# 🛩️ JARVIS — NASA C-MAPSS Engine Health Monitoring Chatbot

> **J**ust **A** **R**ather **V**ery **I**ntelligent **S**ystem  
> An AI-powered diagnostic assistant for NASA C-MAPSS turbofan engine telemetry.

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-orange)

---

## 📋 Overview

JARVIS is a full-stack **Retrieval-Augmented Generation (RAG)** chatbot that answers questions about NASA C-MAPSS turbofan engine health data. It uses:

- **TF-IDF retrieval** over 717 processed engine documents
- **Google Gemini 2.0 Flash** for LLM-powered responses
- **JARVIS persona** — a professional engine health monitoring AI
- **Server-Sent Events (SSE)** for real-time streaming responses
- **React + Vite** frontend with animated chat UI

---

## 🗂️ Project Structure

```
nasa-chatbot/
├── backend/
│   ├── main.py              # FastAPI app — REST + SSE endpoints
│   ├── rag_engine.py        # RAG pipeline: retrieval, augmentation, generation
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Gemini API key (not committed)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JarvisChatbot.tsx   # Chat UI with SSE streaming
│   │   │   ├── Features.tsx        # Landing page features section
│   │   │   └── ...
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── processed/
│       ├── engine_summaries/       # Per-engine health reports (FD001–FD004)
│       ├── domain_knowledge/       # RUL explanation, sensor dictionary, etc.
│       ├── fleet_summary/          # Fleet-wide overview documents
│       └── alerts/                 # Active engine alerts
└── scripts/
    └── prepare_data.py             # Data preprocessing script
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 22.12+
- A free [Gemini API key](https://aistudio.google.com/apikey)

### 1. Configure the API Key

Create or edit `backend/.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

### 2. Install Backend Dependencies

```bash
cd nasa-chatbot/backend
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd nasa-chatbot/frontend
npm install
```

### 4. Run the Project

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd nasa-chatbot/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd nasa-chatbot/frontend
npm run dev
```



---

## 🧠 How It Works

```
User Query
    │
    ▼
Intent Detection (regex patterns)
    │
    ▼
TF-IDF Retrieval (top-k documents from 717 indexed docs)
    │  ↕ intent-based boosting
    ▼
Keyword Fallback (if TF-IDF returns nothing)
    │
    ▼
LLM Augmentation (Gemini 2.0 Flash + JARVIS system prompt)
    │  ↕ rule-based fallback if LLM unavailable
    ▼
SSE Streaming → Frontend
```

### Intent Categories
| Intent | Example Query |
|---|---|
| `engine_specific` | "Show health report for Engine 8 in FD001" |
| `fleet_overview` | "Give me a fleet summary" |
| `rul` | "What is RUL?" |
| `sensors` | "What are the C-MAPSS sensors?" |
| `alerts` | "Show critical alerts" |
| `failure_modes` | "What causes HPC degradation?" |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — returns status + LLM availability |
| `POST` | `/api/chat` | Single-shot query, returns full JSON response |
| `GET` | `/api/stream?query=...` | SSE streaming endpoint for real-time responses |

### Example Request

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Show health report for Engine 8 in FD001"}'
```

### Example Response

```json
{
  "answer": "## 🛩️ Engine Health Report — FD001\n...",
  "intent": "engine_specific",
  "llm_used": true,
  "sources": [
    { "source": "engine_008.txt", "score": 0.847, "title": "Engine 8 Report" }
  ]
}
```

---

## 🗃️ Dataset — NASA C-MAPSS

| Subset | Engines | Operating Conditions | Failure Mode |
|---|---|---|---|
| FD001 | 100 | 1 | HPC Degradation |
| FD002 | 259 | 6 | HPC Degradation |
| FD003 | 100 | 1 | HPC + Fan Degradation |
| FD004 | 248 | 6 | HPC + Fan Degradation |

Each engine has **21 sensor readings** per flight cycle. Key degradation sensors: 2, 3, 4, 7, 11, 12, 15, 20, 21.

---

## 🛡️ Health Status Categories

| Status | RUL | Risk |
|---|---|---|
| 🟢 HEALTHY | > 80 cycles | LOW |
| 🟡 WATCH | 41–80 cycles | MEDIUM |
| 🟠 DEGRADED | 16–40 cycles | HIGH |
| 🔴 CRITICAL | ≤ 15 cycles | CRITICAL |

---

## ⚙️ Configuration

### Backend (`backend/.env`)
```env
GEMINI_API_KEY=AIza...
```

### Rate Limits
The free Gemini tier allows ~15 requests/minute. If the LLM hits quota, JARVIS automatically falls back to rule-based responses. The system recovers automatically after 1 minute.

---

## 🔧 Dependencies

### Backend
```
fastapi
uvicorn[standard]
scikit-learn
nltk
numpy
google-generativeai
python-dotenv
```

### Frontend
```
react, react-dom
vite
typescript
motion/react (framer-motion)
```

---

## 📝 Notes

- The `backend/.env` file is **not committed** to version control. Never share your API key.
- `scripts/bundle_data.py` and `frontend/src/knowledgeBase.ts` are **obsolete** — the backend RAG engine handles all knowledge retrieval directly.
- The `google-generativeai` package is deprecated; migrate to `google.genai` in future versions.

---

## 📄 License

This project uses NASA's C-MAPSS dataset for academic and research purposes.
