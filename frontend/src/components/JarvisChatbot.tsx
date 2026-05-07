import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function JarvisChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Good day, sir. I am Jarvis, your engine diagnostics assistant. I have access to the full C-MAPSS turbofan dataset — over 100 engine run-to-failure simulations across 4 operational conditions. How may I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Analyzing C-MAPSS telemetry logs now, sir. Please note that my Flowise backend is currently disconnected — I am operating in offline simulation mode. Once connected, I will be able to provide real-time RUL predictions.",
        },
      ]);
    }, 1200);
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
          boxShadow: "0 0 25px rgba(0,180,255,0.15), 0 4px 20px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
        whileHover={{ scale: 1.1, boxShadow: "0 0 35px rgba(0,180,255,0.3)" }}
        whileTap={{ scale: 0.95 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="1.5">
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
              width: "24rem",
              maxWidth: "calc(100vw - 2rem)",
              height: "34rem",
              maxHeight: "calc(100vh - 10rem)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "1.25rem",
              background: "rgba(8, 12, 24, 0.92)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(0,180,255,0.15)",
              boxShadow: "0 0 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,180,255,0.08)",
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {/* Avatar */}
                <div
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(0,180,255,0.15), rgba(124,58,237,0.1))",
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
                      background: "#22c55e",
                      border: "2px solid #080c18",
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
                      color: "#00b4ff",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      margin: 0,
                      marginTop: "2px",
                    }}
                  >
                    Online — Engine Diagnostics
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
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f0f4f8")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
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
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "0.85rem 1.1rem",
                      fontSize: "0.82rem",
                      lineHeight: 1.6,
                      borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                      background:
                        msg.role === "user"
                          ? "rgba(0,180,255,0.12)"
                          : "rgba(30,41,59,0.4)",
                      border:
                        msg.role === "user"
                          ? "1px solid rgba(0,180,255,0.25)"
                          : "1px solid rgba(51,65,85,0.4)",
                      color: msg.role === "user" ? "#e0f2fe" : "#cbd5e1",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

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
                  placeholder="Ask Jarvis about engine data, sir..."
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
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,180,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(51,65,85,0.5)")}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  style={{
                    position: "absolute",
                    right: "0.65rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    opacity: input.trim() ? 1 : 0.35,
                    padding: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.2s",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="2">
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
                Powered by C-MAPSS Telemetry DB
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
