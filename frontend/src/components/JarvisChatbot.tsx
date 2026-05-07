import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const API_BASE = "http://localhost:8000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { source: string; category: string; score: number; title: string }[];
  intent?: string;
}

export default function JarvisChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Good day, sir. I am Jarvis, your engine diagnostics assistant. I have access to the full C-MAPSS turbofan dataset — over 700 engine health reports across 4 operational subsets. Ask me about engine health, fleet status, alerts, sensor readings, or turbofan fundamentals.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Check backend health ──
  useEffect(() => {
    if (!isOpen) return;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
          const data = await res.json();
          setBackendReady(data.status === "ready");
          setDocCount(data.documents || 0);
        }
      } catch {
        setBackendReady(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Stream response word-by-word via SSE ──
  const streamResponse = useCallback(async (query: string) => {
    setIsStreaming(true);

    // Add a placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", sources: [], intent: "" },
    ]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(
        `${API_BASE}/api/stream?query=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error("Stream failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let sources: ChatMessage["sources"] = [];
      let intent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "meta") {
              sources = event.sources;
              intent = event.intent;
            } else if (event.type === "chunk") {
              fullText += event.text;
              // Update the last message in place
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullText,
                    sources,
                    intent,
                  };
                }
                return updated;
              });
            } else if (event.type === "done") {
              // Final update with all metadata
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: fullText,
                    sources,
                    intent,
                  };
                }
                return updated;
              });
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        // Fallback to non-streaming
        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
          });
          const data = await res.json();
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === "assistant") {
              updated[lastIdx] = {
                role: "assistant",
                content: data.answer,
                sources: data.sources,
                intent: data.intent,
              };
            }
            return updated;
          });
        } catch {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === "assistant") {
              updated[lastIdx] = {
                role: "assistant",
                content:
                  "I'm having trouble connecting to the RAG backend, sir. Please ensure the backend server is running on port 8000.",
              };
            }
            return updated;
          });
        }
      }
    } finally {
      setIsStreaming(false);
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages.length]);

  // ── Submit handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isStreaming) return;

    const userQuery = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
    setInput("");
    setIsLoading(true);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 300));

    streamResponse(userQuery);
  };

  // ── Quick suggestions ──
  const suggestions = [
    "Show fleet overview",
    "Critical alerts",
    "Engine 31 FD001",
    "What is RUL?",
    "Sensor dictionary",
    "FD003 fleet status",
  ];

  const handleSuggestion = (text: string) => {
    setInput(text);
  };



  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          background: "linear-gradient(135deg, #0a1628, #162033)",
          border: "1px solid rgba(0,180,255,0.35)",
          boxShadow:
            "0 0 25px rgba(0,180,255,0.15), 0 4px 20px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        whileHover={{
          scale: 1.1,
          boxShadow: "0 0 35px rgba(0,180,255,0.3)",
        }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00b4ff"
          strokeWidth="1.5"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: "6rem",
              right: "2rem",
              width: "26rem",
              maxWidth: "calc(100vw - 2rem)",
              height: "38rem",
              maxHeight: "calc(100vh - 10rem)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "1.25rem",
              background: "rgba(8, 12, 24, 0.92)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0,180,255,0.15)",
              boxShadow:
                "0 0 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,180,255,0.08)",
            }}
          >
            {/* ─── Header ─── */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(0,180,255,0.12)",
                background: "rgba(0,180,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(0,180,255,0.15), rgba(124,58,237,0.1))",
                    border: "1px solid rgba(0,180,255,0.3)",
                    fontSize: "1rem",
                    position: "relative",
                  }}
                >
                  🤖
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: backendReady ? "#22c55e" : "#f59e0b",
                      border: "2px solid #080c18",
                      animation: backendReady
                        ? "none"
                        : "pulse 2s ease-in-out infinite",
                    }}
                  />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      color: "#f0f4f8",
                      margin: 0,
                    }}
                  >
                    J.A.R.V.I.S
                  </h3>
                  <p
                    style={{
                      fontSize: "0.6rem",
                      color: backendReady ? "#00b4ff" : "#f59e0b",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    {backendReady
                      ? `Online — RAG Engine • ${docCount} docs`
                      : "Connecting to RAG backend..."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "0.5rem",
                  lineHeight: 1,
                  borderRadius: "0.5rem",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#f0f4f8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#64748b")
                }
              >
                ✕
              </button>
            </div>

            {/* ─── Messages ─── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.25rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "88%",
                        padding: "0.85rem 1.1rem",
                        fontSize: "0.78rem",
                        lineHeight: 1.65,
                        borderRadius:
                          msg.role === "user"
                            ? "1rem 1rem 0.25rem 1rem"
                            : "1rem 1rem 1rem 0.25rem",
                        background:
                          msg.role === "user"
                            ? "rgba(0,180,255,0.12)"
                            : "rgba(30,41,59,0.4)",
                        border:
                          msg.role === "user"
                            ? "1px solid rgba(0,180,255,0.25)"
                            : "1px solid rgba(51,65,85,0.4)",
                        color:
                          msg.role === "user" ? "#e0f2fe" : "#cbd5e1",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                      {/* Blinking cursor during streaming */}
                      {isStreaming &&
                        i === messages.length - 1 &&
                        msg.role === "assistant" && (
                          <motion.span
                            style={{ color: "#00b4ff", fontWeight: 700 }}
                            animate={{ opacity: [1, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          >
                            ▊
                          </motion.span>
                        )}
                    </div>
                  </div>

                  {/* Source badges */}
                  {msg.sources &&
                    msg.sources.length > 0 &&
                    msg.role === "assistant" &&
                    !isStreaming && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.3rem",
                          marginTop: "0.4rem",
                          paddingLeft: "0.2rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.55rem",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginRight: "0.3rem",
                          }}
                        >
                          Sources:
                        </span>
                        {msg.sources.map((s, si) => (
                          <span
                            key={si}
                            style={{
                              fontSize: "0.55rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "0.75rem",
                              background: "rgba(0,180,255,0.08)",
                              border: "1px solid rgba(0,180,255,0.15)",
                              color: "#7dd3fc",
                              letterSpacing: "0.02em",
                            }}
                            title={`Score: ${s.score} | ${s.title}`}
                          >
                            {s.source.length > 25
                              ? s.source.slice(0, 22) + "..."
                              : s.source}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {/* Typing indicator — only when loading before stream starts */}
              {isLoading && !isStreaming && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    style={{
                      padding: "0.85rem 1.1rem",
                      borderRadius: "1rem 1rem 1rem 0.25rem",
                      background: "rgba(30,41,59,0.4)",
                      border: "1px solid rgba(51,65,85,0.4)",
                      display: "flex",
                      gap: "0.35rem",
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((idx) => (
                      <motion.div
                        key={idx}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#00b4ff",
                        }}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: idx * 0.15,
                        }}
                      />
                    ))}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        marginLeft: "0.5rem",
                        fontStyle: "italic",
                      }}
                    >
                      Retrieving from C-MAPSS...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─── Suggestion chips ─── */}
            {messages.length <= 2 && !isLoading && !isStreaming && (
              <div
                style={{
                  padding: "0 1.25rem 0.75rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    style={{
                      background: "rgba(0,180,255,0.08)",
                      border: "1px solid rgba(0,180,255,0.2)",
                      borderRadius: "1rem",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.65rem",
                      color: "#7dd3fc",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(0,180,255,0.15)";
                      e.currentTarget.style.borderColor =
                        "rgba(0,180,255,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(0,180,255,0.08)";
                      e.currentTarget.style.borderColor =
                        "rgba(0,180,255,0.2)";
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* ─── Input ─── */}
            <div
              style={{
                padding: "1rem 1.25rem 1.25rem",
                borderTop: "1px solid rgba(0,180,255,0.08)",
              }}
            >
              <form onSubmit={handleSubmit} style={{ position: "relative" }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isLoading || isStreaming
                      ? "Analyzing telemetry..."
                      : "Ask Jarvis about engine data, sir..."
                  }
                  disabled={isLoading || isStreaming}
                  style={{
                    width: "100%",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(51,65,85,0.5)",
                    borderRadius: "0.75rem",
                    padding: "0.85rem 3rem 0.85rem 1rem",
                    fontSize: "0.82rem",
                    color: "#f0f4f8",
                    outline: "none",
                    transition: "border-color 0.2s",
                    opacity: isLoading || isStreaming ? 0.5 : 1,
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(0,180,255,0.4)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(51,65,85,0.5)")
                  }
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isStreaming}
                  style={{
                    position: "absolute",
                    right: "0.65rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor:
                      input.trim() && !isLoading && !isStreaming
                        ? "pointer"
                        : "not-allowed",
                    opacity:
                      input.trim() && !isLoading && !isStreaming
                        ? 1
                        : 0.35,
                    padding: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.2s",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00b4ff"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </form>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.55rem",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  marginTop: "0.65rem",
                }}
              >
                RAG-Powered • TF-IDF Retrieval • C-MAPSS Telemetry
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse animation for status indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}
