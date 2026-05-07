"""
Bundle all processed text documents into a single JSON file
for the frontend chatbot's knowledge base.
"""

import json
import os
from pathlib import Path

PROCESSED_PATH = Path(__file__).parent.parent / "data" / "processed"
OUTPUT_PATH = Path(__file__).parent.parent / "frontend" / "public" / "knowledge_base.json"


def extract_title(content: str, filename: str) -> str:
    """Extract a meaningful title from file content or filename."""
    first_line = content.strip().split("\n")[0].strip()
    if first_line and not first_line.startswith("="):
        return first_line
    return filename.replace(".txt", "").replace("_", " ").title()


def main():
    documents = []
    doc_id = 0

    # ── Domain Knowledge ──
    dk_path = PROCESSED_PATH / "domain_knowledge"
    if dk_path.exists():
        for f in sorted(dk_path.glob("*.txt")):
            content = f.read_text(encoding="utf-8")
            documents.append({
                "id": doc_id,
                "category": "domain_knowledge",
                "source": f.name,
                "title": extract_title(content, f.name),
                "content": content,
            })
            doc_id += 1
            print(f"  [DOMAIN] {f.name}")

    # ── Fleet Overviews ──
    fo_path = PROCESSED_PATH / "fleet_overviews"
    if fo_path.exists():
        for f in sorted(fo_path.glob("*.txt")):
            content = f.read_text(encoding="utf-8")
            documents.append({
                "id": doc_id,
                "category": "fleet_overview",
                "source": f.name,
                "title": extract_title(content, f.name),
                "content": content,
            })
            doc_id += 1
            print(f"  [FLEET] {f.name}")

    # ── Alerts ──
    alerts_path = PROCESSED_PATH / "alerts"
    if alerts_path.exists():
        for f in sorted(alerts_path.glob("*.txt")):
            content = f.read_text(encoding="utf-8")
            documents.append({
                "id": doc_id,
                "category": "alerts",
                "source": f.name,
                "title": extract_title(content, f.name),
                "content": content,
            })
            doc_id += 1
            print(f"  [ALERT] {f.name}")

    # ── Engine Summaries ──
    es_path = PROCESSED_PATH / "engine_summaries"
    if es_path.exists():
        engine_count = 0
        for subset_dir in sorted(es_path.iterdir()):
            if subset_dir.is_dir():
                for f in sorted(subset_dir.glob("*.txt")):
                    content = f.read_text(encoding="utf-8")
                    documents.append({
                        "id": doc_id,
                        "category": "engine_summary",
                        "source": f"{subset_dir.name}/{f.name}",
                        "subset": subset_dir.name,
                        "title": extract_title(content, f.name),
                        "content": content,
                    })
                    doc_id += 1
                    engine_count += 1
        print(f"  [ENGINE] {engine_count} engine summaries")

    # ── Write output ──
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as fp:
        json.dump({"documents": documents, "totalDocuments": len(documents)}, fp, ensure_ascii=False)

    size_mb = OUTPUT_PATH.stat().st_size / (1024 * 1024)
    print(f"\n[DONE] Bundled {len(documents)} documents -> {OUTPUT_PATH}")
    print(f"   File size: {size_mb:.2f} MB")


if __name__ == "__main__":
    print("=" * 50)
    print("Bundling knowledge base for frontend chatbot")
    print("=" * 50)
    main()
