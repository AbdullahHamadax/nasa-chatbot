"""
RAG (Retrieval-Augmented Generation) Engine for the NASA C-MAPSS Chatbot.

Pipeline:
  1. RETRIEVAL  — TF-IDF + cosine similarity to find relevant documents
  2. AUGMENT    — Build prompt with JARVIS system prompt + retrieved context
  3. GENERATE   — Google Gemini LLM generates natural-language answer
"""

import os
import re
from pathlib import Path
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

load_dotenv()

# ── Paths ───────────────────────────────────────────────────────────
PROCESSED_PATH = Path(__file__).parent.parent / "data" / "processed"

# ── JARVIS System Prompt ────────────────────────────────────────────
SYSTEM_PROMPT = """You are JARVIS, an aircraft engine health monitoring AI for NASA C-MAPSS turbofan engine data. You operate from the Maintenance Operations Center and assist engineers with engine diagnostics, RUL analysis, sensor interpretation, and maintenance decisions.

═══════════════════════════════════════════
PERSONALITY & TONE
═══════════════════════════════════════════
- Be precise, confident, slightly formal, and concise.
- You may address the user as "sir" or "boss" occasionally, but not in every message.
- Stay in character as an engine health monitoring AI.
- Use phrases naturally when appropriate:
  • "Running diagnostics..."
  • "My sensors indicate..."
  • "Based on our fleet data..."
  • "Cross-referencing the sensor array..."
  • "I've flagged this in the system..."

Do not say:
- "Context 1"
- "Context 2"
- "Based on the provided context"
- "According to the documents"

═══════════════════════════════════════════
STRICT DOMAIN BOUNDARY
═══════════════════════════════════════════
You may ONLY answer questions about:
- Aircraft engines
- Turbofan engines
- Gas turbine engines
- NASA C-MAPSS data
- FD001, FD002, FD003, FD004 datasets
- Engine health status
- RUL / Remaining Useful Life
- Sensor readings and trends
- Predictive maintenance
- Prognostics and health management
- HPC degradation
- Fan degradation
- Operating conditions
- Engine failure modes

If the user asks anything outside this domain, do not answer the question. Reply only:

"🚫 I appreciate the curiosity, sir, but my systems are dedicated entirely to aircraft engine health monitoring. I can help with RUL, sensor trends, degradation, maintenance risk, or C-MAPSS fleet diagnostics. 🛩️"

Do not partially answer off-topic questions.

═══════════════════════════════════════════
DATA SAFETY RULES
═══════════════════════════════════════════
- Never fabricate engine IDs, RUL values, sensor readings, trends, or maintenance recommendations.
- Use only data that exists in the dataset or has been calculated by the backend.
- If exact data is unavailable, say:
  "I don't have that specific engine data available right now."
- Do not pretend to know values that were not retrieved or computed.
- Do not estimate RUL unless the backend provides the RUL value.
- Do not say every engine is known unless the data was actually loaded.

═══════════════════════════════════════════
RESPONSE LENGTH RULES
═══════════════════════════════════════════
- Keep normal answers under 250 words.
- Do not repeat titles or headings.
- Use only one main heading per answer.
- Do not list all sensors unless the user explicitly asks for a full sensor report.
- Always finish the answer with a short conclusion when giving a health report.

═══════════════════════════════════════════
HEALTH REPORT RULES
═══════════════════════════════════════════
When the user asks for an engine health report:

1. If no dataset is specified, ask for the dataset.
   Example: FD001, FD002, FD003, or FD004.

2. If no engine ID is specified, ask for the engine ID.
   Example:
   "Please specify an Engine ID, sir. For example: Engine 8 in FD001."

3. If one engine ID is specified, return one report only.

4. Do not generate reports for multiple engines unless the user explicitly asks for multiple engines or a fleet comparison.

5. Default health report format:

## 🛩️ Engine Health Report — [DATASET]

| Field | Value |
|---|---|
| Engine ID | [engine_id] |
| Dataset | [dataset] |
| Operating Conditions | [conditions] |
| Cycles Recorded | [cycles] |
| RUL Remaining | [rul] cycles |
| Health Status | [status] |
| Risk Level | [risk] |

### 📊 Key Sensor Trends — Last 30 Cycles
- Sensor 2 / T24: [value] — [trend]
- Sensor 3 / T30: [value] — [trend]
- Sensor 4 / T50: [value] — [trend]
- Sensor 11 / Ps30: [value] — [trend]
- Sensor 15 / BPR: [value] — [trend]

### 💡 Conclusion
[One or two clear sentences about engine condition and maintenance urgency.]

6. Only show all 21 sensors if the user says:
- "full sensor report"
- "show all sensors"
- "detailed sensor readings"

═══════════════════════════════════════════
HEALTH STATUS RULES
═══════════════════════════════════════════
Use these categories unless the backend provides different labels:

- 🟢 HEALTHY: RUL greater than 80 cycles
- 🟡 WATCH: RUL between 41 and 80 cycles
- 🟠 DEGRADED: RUL between 16 and 40 cycles
- 🔴 CRITICAL: RUL 15 cycles or fewer

Risk level:
- LOW: RUL greater than 80
- MEDIUM: RUL 41–80
- HIGH: RUL 16–40
- CRITICAL: RUL 15 or fewer

═══════════════════════════════════════════
RUL EXPLANATION RULES
═══════════════════════════════════════════
When explaining RUL:
- Define RUL as Remaining Useful Life.
- Explain that it means the estimated number of cycles before the engine reaches end-of-life/failure condition.
- Mention that training engines run until failure.
- Mention that test engines stop before failure and use RUL files for remaining cycles.
- Do not repeat the title.

Use this formula for test data:
RUL at current cycle = RUL_from_file + (last_recorded_cycle - current_cycle)

═══════════════════════════════════════════
SENSOR DICTIONARY RULES
═══════════════════════════════════════════
When explaining sensors:
- Use one title only.
- Group sensors by type: temperature, pressure, speed, ratio/flow, bleed/demand.
- Keep descriptions short.
- Mention that key degradation sensors include 2, 3, 4, 7, 11, 12, 15, 20, and 21.
- Do not include long dashboard formatting unless asked.

═══════════════════════════════════════════
FORMATTING STYLE
═══════════════════════════════════════════
Use Markdown.

Use emojis strategically:
- 🔴 CRITICAL
- 🟠 DEGRADED
- 🟡 WATCH
- 🟢 HEALTHY
- ⚠️ Warning
- ✅ Confirmation
- 🔧 Maintenance action
- 📊 Data
- 🛩️ Engine
- 📈 Increasing trend
- 📉 Decreasing trend
- 💡 Recommendation

Use tables only when:
- comparing multiple engines
- showing a compact health report
- summarizing fleet status

Avoid long code blocks for normal answers.
Avoid decorative separators unless the answer is a report."""


# ── Document store ──────────────────────────────────────────────────
class Document:
    """A single document in the knowledge base."""

    def __init__(self, doc_id: int, category: str, source: str,
                 title: str, content: str, subset: str = ""):
        self.doc_id = doc_id
        self.category = category
        self.source = source
        self.title = title
        self.content = content
        self.subset = subset

    def __repr__(self):
        return f"Doc({self.doc_id}, {self.category}, {self.source[:30]})"


# ── Intent recognition ──────────────────────────────────────────────
INTENT_PATTERNS = {
    "engine_specific": [
        re.compile(r"engine\s*(?:#?\s*)?(\d+)", re.I),
        re.compile(r"engine\s+id\s*:?\s*(\d+)", re.I),
    ],
    "fleet_overview": [
        re.compile(r"fleet", re.I),
        re.compile(r"how many engines", re.I),
        re.compile(r"total engines", re.I),
        re.compile(r"overview", re.I),
        re.compile(r"health.*score", re.I),
    ],
    "alerts": [
        re.compile(r"alert", re.I),
        re.compile(r"critical", re.I),
        re.compile(r"ground", re.I),
        re.compile(r"danger", re.I),
        re.compile(r"warning", re.I),
        re.compile(r"urgent", re.I),
        re.compile(r"emergency", re.I),
    ],
    "sensors": [
        re.compile(r"sensor", re.I),
        re.compile(r"temperature", re.I),
        re.compile(r"pressure", re.I),
        re.compile(r"T24|T30|T50|P30|Ps30|Nf|Nc|BPR|epr", re.I),
    ],
    "failure_modes": [
        re.compile(r"failure", re.I),
        re.compile(r"degradation", re.I),
        re.compile(r"fault", re.I),
        re.compile(r"HPC", re.I),
        re.compile(r"compressor", re.I),
    ],
    "rul": [
        re.compile(r"\brul\b", re.I),
        re.compile(r"remaining useful life", re.I),
        re.compile(r"remaining life", re.I),
        re.compile(r"how.*(long|many|much).*(cycle|life|left)", re.I),
    ],
    "turbofan": [
        re.compile(r"turbofan", re.I),
        re.compile(r"jet engine", re.I),
        re.compile(r"how.*engine.*work", re.I),
        re.compile(r"component", re.I),
        re.compile(r"combustion", re.I),
    ],
    "maintenance": [
        re.compile(r"maintenance", re.I),
        re.compile(r"inspection", re.I),
        re.compile(r"schedule", re.I),
        re.compile(r"repair", re.I),
    ],
    "dataset_info": [
        re.compile(r"FD00[1-4]", re.I),
        re.compile(r"dataset", re.I),
        re.compile(r"subset", re.I),
        re.compile(r"C-?MAPSS", re.I),
    ],
}


def detect_intent(query: str) -> tuple[str, dict]:
    """Detect the user's intent and extract parameters."""
    params = {}

    # Extract engine ID
    for p in INTENT_PATTERNS["engine_specific"]:
        m = p.search(query)
        if m:
            params["engine_id"] = m.group(1)
            break

    # Extract dataset subset
    subset_match = re.search(r"FD00[1-4]", query, re.I)
    if subset_match:
        params["subset"] = subset_match.group(0).upper()

    # Determine primary intent
    for intent_name, patterns in INTENT_PATTERNS.items():
        for p in patterns:
            if p.search(query):
                return intent_name, params

    return "general", params


# ── Gemini LLM Client ──────────────────────────────────────────────
class GeminiClient:
    """Wrapper around Google Gemini API for text generation."""

    def __init__(self):
        self.model = None
        self.available = False
        self._init()

    def _init(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key or api_key == "your_api_key_here":
            print("[LLM] No Gemini API key found. Set GEMINI_API_KEY in .env")
            print("[LLM] Get a free key at: https://aistudio.google.com/apikey")
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(
                "gemini-2.0-flash",
                system_instruction=SYSTEM_PROMPT,
            )
            self.available = True
            print("[LLM] Gemini model initialized successfully")
        except Exception as e:
            print(f"[LLM] Failed to initialize Gemini: {e}")

    def generate(self, prompt: str) -> str:
        """Generate a response from Gemini."""
        if not self.available or not self.model:
            return ""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"[LLM] Generation error: {e}")
            return ""

    def generate_stream(self, prompt: str):
        """Stream a response from Gemini, yielding chunks."""
        if not self.available or not self.model:
            return
        try:
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"[LLM] Stream error: {e}")


# ── RAG Engine ──────────────────────────────────────────────────────
class RAGEngine:
    """
    Retrieval-Augmented Generation engine.

    - Uses TF-IDF vectorization for document embeddings
    - Cosine similarity for retrieval
    - Google Gemini LLM for generation with JARVIS persona
    - Falls back to rule-based generation if LLM is unavailable
    """

    def __init__(self):
        self.documents: list[Document] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.ready = False
        self.llm = GeminiClient()

    def load_documents(self):
        """Load all processed documents from disk."""
        doc_id = 0

        # Domain knowledge
        dk_path = PROCESSED_PATH / "domain_knowledge"
        if dk_path.exists():
            for f in sorted(dk_path.glob("*.txt")):
                content = f.read_text(encoding="utf-8")
                title = content.strip().split("\n")[0].strip()
                self.documents.append(Document(
                    doc_id, "domain_knowledge", f.name, title, content
                ))
                doc_id += 1

        # Fleet overviews
        fo_path = PROCESSED_PATH / "fleet_overviews"
        if fo_path.exists():
            for f in sorted(fo_path.glob("*.txt")):
                content = f.read_text(encoding="utf-8")
                title = content.strip().split("\n")[0].strip()
                self.documents.append(Document(
                    doc_id, "fleet_overview", f.name, title, content
                ))
                doc_id += 1

        # Alerts
        alerts_path = PROCESSED_PATH / "alerts"
        if alerts_path.exists():
            for f in sorted(alerts_path.glob("*.txt")):
                content = f.read_text(encoding="utf-8")
                title = content.strip().split("\n")[0].strip()
                self.documents.append(Document(
                    doc_id, "alerts", f.name, title, content
                ))
                doc_id += 1

        # Engine summaries
        es_path = PROCESSED_PATH / "engine_summaries"
        if es_path.exists():
            for subset_dir in sorted(es_path.iterdir()):
                if subset_dir.is_dir():
                    for f in sorted(subset_dir.glob("*.txt")):
                        content = f.read_text(encoding="utf-8")
                        title = content.strip().split("\n")[0].strip()
                        self.documents.append(Document(
                            doc_id, "engine_summary", f"{subset_dir.name}/{f.name}",
                            title, content, subset=subset_dir.name
                        ))
                        doc_id += 1

        print(f"[RAG] Loaded {len(self.documents)} documents")

    def build_index(self):
        """Build TF-IDF index over all documents."""
        corpus = [
            f"{doc.title} {doc.content}" for doc in self.documents
        ]

        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95,
            sublinear_tf=True,
        )

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.ready = True
        print(f"[RAG] TF-IDF index built: {self.tfidf_matrix.shape}")

    def retrieve(self, query: str, top_k: int = 5,
                 intent: str = "", params: dict = None) -> list[tuple[Document, float]]:
        """
        RETRIEVAL step: find the most relevant documents for a query.
        Returns list of (document, similarity_score) tuples.
        """
        if not self.ready:
            return []

        params = params or {}

        # Vectorize the query
        query_vec = self.vectorizer.transform([query])

        # Compute cosine similarity against all documents
        similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()

        # ── Apply intent-based boosting ──
        category_boost = {
            "engine_specific": "engine_summary",
            "fleet_overview": "fleet_overview",
            "alerts": "alerts",
            "sensors": "domain_knowledge",
            "failure_modes": "domain_knowledge",
            "rul": "domain_knowledge",
            "turbofan": "domain_knowledge",
            "maintenance": "engine_summary",
            "dataset_info": "fleet_overview",
        }

        target_category = category_boost.get(intent, "")

        boosted = np.copy(similarities)
        for i, doc in enumerate(self.documents):
            if boosted[i] == 0:
                continue

            # Category boost
            if target_category and doc.category == target_category:
                boosted[i] *= 3.0

            # Subset match boost
            if params.get("subset") and doc.subset == params["subset"]:
                boosted[i] *= 4.0
            if params.get("subset") and params["subset"] in doc.content:
                boosted[i] *= 1.5

            # Specific engine ID boost
            if params.get("engine_id"):
                eid = params["engine_id"]
                padded = eid.zfill(3)
                if f"engine_{padded}" in doc.source:
                    boosted[i] *= 15.0
                elif re.search(rf"Engine\s*(ID)?\s*:?\s*{eid}\b", doc.content):
                    boosted[i] *= 5.0

            # Fleet summary boost for overview queries
            if doc.source == "fleet_summary_all.txt" and intent == "fleet_overview":
                boosted[i] *= 10.0
            # Demote individual fleet files when no specific subset is requested
            if (intent == "fleet_overview" and not params.get("subset")
                    and doc.category == "fleet_overview"
                    and doc.source != "fleet_summary_all.txt"):
                boosted[i] *= 0.3

        # Get top-k indices
        top_indices = np.argsort(boosted)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if boosted[idx] > 0:
                results.append((self.documents[idx], float(boosted[idx])))

        # ── Fallback: keyword search if TF-IDF returned nothing ──
        if not results:
            results = self._keyword_fallback(query, intent, params, top_k)

        return results

    def _keyword_fallback(self, query: str, intent: str, params: dict,
                          top_k: int) -> list[tuple[Document, float]]:
        """
        Fallback search when TF-IDF returns no results.
        Uses keyword matching and intent-to-source mapping.
        """
        # Map intents to known source filenames
        intent_sources = {
            "rul": ["rul_explanation.txt"],
            "sensors": ["sensor_dictionary.txt"],
            "failure_modes": ["failure_modes.txt"],
            "turbofan": ["turbofan_basics.txt"],
            "fleet_overview": ["fleet_summary_all.txt"],
            "alerts": ["active_alerts.txt"],
        }

        results = []

        # Try intent-based source mapping first
        if intent in intent_sources:
            for doc in self.documents:
                if doc.source in intent_sources[intent]:
                    results.append((doc, 1.0))

        # If still empty, do brute-force keyword search
        if not results:
            query_words = [w.lower() for w in query.split()
                           if len(w) > 2 and w.lower() not in
                           {"the", "what", "how", "does", "can", "this", "that",
                            "are", "was", "for", "with", "from", "about", "show"}]

            for doc in self.documents:
                content_lower = doc.content.lower()
                score = sum(1 for w in query_words if w in content_lower)
                if score > 0:
                    results.append((doc, float(score)))

            # Sort by score descending
            results.sort(key=lambda x: x[1], reverse=True)

        return results[:top_k]

    # ── AUGMENT: Build the LLM prompt ───────────────────────────────

    @staticmethod
    def _strip_doc_header(content: str) -> str:
        """Remove raw ASCII headings, separators, and clean up formatting."""
        lines = content.strip().split("\n")
        cleaned = []
        skip_next = False
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Skip pure separator lines (===... or ---...)
            if stripped and len(stripped) >= 5 and all(
                    c in "=-" for c in stripped):
                # Also skip the line BEFORE a === separator (it's the title)
                if stripped.startswith("=") and cleaned:
                    cleaned.pop()
                continue
            if skip_next:
                skip_next = False
                continue
            # Convert UPPERCASE sub-headings to markdown ###
            if (stripped and stripped == stripped.upper()
                    and len(stripped) > 3 and stripped[-1] != ","
                    and not stripped.startswith("-")
                    and not stripped.startswith("•")
                    and ":" not in stripped
                    and any(c.isalpha() for c in stripped)):
                cleaned.append(f"### {stripped.title()}")
            else:
                cleaned.append(line)
        return "\n".join(cleaned).strip()

    def _build_prompt(self, query: str,
                      retrieved: list[tuple[Document, float]]) -> str:
        """
        Build the augmented prompt by combining the user's question
        with the retrieved document context.
        """
        context_parts = []
        for i, (doc, score) in enumerate(retrieved):
            cleaned = self._strip_doc_header(doc.content)
            context_parts.append(
                f"[Source: {doc.source} | Category: {doc.category}]\n"
                f"{cleaned}"
            )

        context = "\n\n---\n\n".join(context_parts)

        prompt = f"""Here is the relevant data from your engine monitoring systems:

{context}

---

USER QUESTION: {query}

IMPORTANT RULES:
- Do NOT repeat raw document headings or ASCII separators (===, ---).
- Use only ONE Markdown heading per answer.
- For health reports, show only 5 key sensors (2, 3, 4, 11, 15) unless the user asks for all sensors.
- Keep normal answers under 250 words.
- Always end health reports with a short conclusion.
- Respond as JARVIS following your system instructions."""

        return prompt

    # ── GENERATE: LLM or fallback ───────────────────────────────────

    def generate(self, query: str, retrieved: list[tuple[Document, float]],
                 intent: str, params: dict) -> str:
        """
        GENERATION step: use LLM to generate answer from retrieved context.
        Falls back to rule-based if LLM is unavailable.
        """
        if not retrieved:
            return (
                "🔍 I've scanned the entire C-MAPSS database, sir, but couldn't "
                "find relevant data for that query. Could you rephrase? I can help "
                "with engine health, fleet status, alerts, sensors, RUL, and "
                "turbofan fundamentals. 🛩️"
            )

        # Try LLM generation first
        if self.llm.available:
            prompt = self._build_prompt(query, retrieved)
            answer = self.llm.generate(prompt)
            if answer:
                return answer

        # Fallback: rule-based generation
        return self._fallback_generate(query, retrieved, intent, params)

    def generate_stream(self, query: str,
                        retrieved: list[tuple[Document, float]]):
        """
        Stream generation — yields text chunks from the LLM.
        Falls back to word-by-word from rule-based if LLM unavailable.
        """
        if not retrieved:
            yield ("🔍 I've scanned the entire C-MAPSS database, sir, but couldn't "
                   "find relevant data for that query. Could you rephrase?")
            return

        if self.llm.available:
            prompt = self._build_prompt(query, retrieved)
            yielded_any = False
            for chunk in self.llm.generate_stream(prompt):
                yielded_any = True
                yield chunk
            if yielded_any:
                return

        # Fallback: yield the full rule-based response
        intent, params = detect_intent(query)
        answer = self._fallback_generate(query, retrieved, intent, params)
        yield answer

    # ── Fallback rule-based generation ──────────────────────────────

    def _fallback_generate(self, query: str,
                           retrieved: list[tuple[Document, float]],
                           intent: str, params: dict) -> str:
        """Rule-based generation when LLM is unavailable."""
        top_doc, _ = retrieved[0]

        if intent == "engine_specific" and top_doc.category == "engine_summary":
            return self._gen_engine(top_doc, params)
        if intent == "alerts" or top_doc.category == "alerts":
            return self._gen_alerts(top_doc, params)
        if intent == "fleet_overview" or top_doc.category == "fleet_overview":
            return self._gen_fleet(top_doc, params)
        if top_doc.category == "domain_knowledge":
            cleaned = self._strip_doc_header(top_doc.content)
            return f"📚 **{top_doc.title}**\n\n{cleaned}"

        # Generic fallback
        cleaned = self._strip_doc_header(top_doc.content)
        return (
            f"📊 Based on our fleet data, sir:\n\n"
            f"{cleaned[:1200]}"
        )

    def _gen_engine(self, doc: Document, params: dict) -> str:
        content = doc.content
        eid = self._extract(content, r"Engine ID\s*:\s*(\d+)")
        dataset = self._extract(content, r"Dataset\s*:\s*(\S+)")
        rul = self._extract(content, r"RUL \(Remaining\):\s*(\d+)")
        status = self._extract(content, r"Health Status\s*:\s*(\w+)")

        icon = {"HEALTHY": "🟢", "WATCH": "🟡",
                "DEGRADED": "🟠", "CRITICAL": "🔴"}.get(status, "📊")

        return (
            f"{icon} **Engine {eid}** ({dataset})\n\n"
            f"{content.strip()}"
        )

    def _gen_alerts(self, doc: Document, params: dict) -> str:
        lines = [l for l in doc.content.split("\n") if l.strip()]
        subset = params.get("subset", "")
        if subset:
            filtered = [l for l in lines if subset in l]
            return f"🚨 **Alerts for {subset}**\n\n" + "\n".join(filtered[:20])
        return f"🚨 **Active Alerts**\n\n{doc.content.strip()}"

    def _gen_fleet(self, doc: Document, params: dict) -> str:
        return f"📊 **Fleet Status**\n\n{doc.content.strip()}"

    @staticmethod
    def _extract(text: str, pattern: str) -> str:
        m = re.search(pattern, text)
        return m.group(1) if m else "N/A"

    # ── Full RAG pipeline ───────────────────────────────────────────

    def query(self, user_query: str) -> dict:
        """
        Full RAG pipeline: detect intent -> retrieve -> generate.
        Returns dict with answer and metadata.
        """
        # 1. Intent detection
        intent, params = detect_intent(user_query)

        # 2. Retrieval
        retrieved = self.retrieve(user_query, top_k=5,
                                  intent=intent, params=params)

        # 3. Generation (LLM with fallback)
        answer = self.generate(user_query, retrieved, intent, params)

        # Metadata
        sources = [
            {"source": doc.source, "category": doc.category,
             "score": round(score, 4), "title": doc.title}
            for doc, score in retrieved[:3]
        ]

        return {
            "answer": answer,
            "intent": intent,
            "params": params,
            "sources": sources,
            "num_retrieved": len(retrieved),
            "llm_used": self.llm.available,
        }

    def query_stream(self, user_query: str):
        """
        Streaming RAG pipeline — yields (event_type, data) tuples.
        """
        # 1. Intent detection
        intent, params = detect_intent(user_query)

        # 2. Retrieval
        retrieved = self.retrieve(user_query, top_k=5,
                                  intent=intent, params=params)

        sources = [
            {"source": doc.source, "category": doc.category,
             "score": round(score, 4), "title": doc.title}
            for doc, score in retrieved[:3]
        ]

        # Yield metadata first
        yield ("meta", {
            "intent": intent,
            "sources": sources,
            "num_retrieved": len(retrieved),
            "llm_used": self.llm.available,
        })

        # 3. Stream generation
        for chunk in self.generate_stream(user_query, retrieved):
            yield ("chunk", chunk)

        yield ("done", None)
