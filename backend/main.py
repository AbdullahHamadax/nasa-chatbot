"""
FastAPI backend for the NASA C-MAPSS RAG Chatbot.

Endpoints:
  POST /api/chat   — Send a query, get a RAG-generated answer
  GET  /api/health — Check if the RAG engine is ready
  GET  /api/stream — SSE endpoint for streaming word-by-word responses
"""

import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from rag_engine import RAGEngine

# ── Initialize app & RAG engine ────────────────────────────────────
app = FastAPI(title="NASA C-MAPSS RAG Chatbot API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGEngine()


@app.on_event("startup")
def startup():
    """Load documents and build TF-IDF index on startup."""
    print("[API] Starting RAG engine...")
    rag.load_documents()
    rag.build_index()
    print("[API] RAG engine ready!")
    print(f"[API] LLM available: {rag.llm.available}")


# ── Models ──────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str


# ── Endpoints ───────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Check if the RAG engine is loaded and ready."""
    return {
        "status": "ready" if rag.ready else "loading",
        "documents": len(rag.documents),
        "llm_available": rag.llm.available,
        "index_shape": (
            list(rag.tfidf_matrix.shape) if rag.tfidf_matrix is not None else None
        ),
    }


@app.post("/api/chat")
def chat(request: ChatRequest):
    """
    Standard (non-streaming) RAG endpoint.
    Retrieves relevant documents and generates an answer.
    """
    result = rag.query(request.query)
    return result


@app.get("/api/stream")
async def stream_chat(query: str):
    """
    SSE (Server-Sent Events) endpoint for streaming responses.
    Uses LLM streaming when available, word-by-word fallback otherwise.
    """
    async def event_generator():
        for event_type, data in rag.query_stream(query):
            if event_type == "meta":
                payload = json.dumps({"type": "meta", **data})
                yield f"data: {payload}\n\n"

            elif event_type == "chunk":
                payload = json.dumps({"type": "chunk", "text": data})
                yield f"data: {payload}\n\n"
                # Small delay for visual effect (LLM streams fast)
                await asyncio.sleep(0.01)

            elif event_type == "done":
                payload = json.dumps({"type": "done"})
                yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
