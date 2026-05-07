import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: scrolled ? "rgba(0, 0, 5, 0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.3)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.3)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,180,255,0.06)" : "1px solid transparent",
        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-3 group no-underline">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: "radial-gradient(circle at 40% 40%, rgba(0,180,255,0.15), transparent 70%)",
              border: "1px solid rgba(0,180,255,0.25)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b4ff" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <span
            className="text-sm font-semibold tracking-[0.2em]"
            style={{ fontFamily: "var(--font-display)", color: "#f0f4f8" }}
          >
            NASA<span style={{ color: "#00b4ff" }}>·</span>SSE
          </span>
        </a>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-10">
          {[
            { label: "Home", href: "#hero" },
            { label: "Features", href: "#features" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs tracking-[0.2em] uppercase no-underline transition-colors duration-300"
              style={{ fontFamily: "var(--font-display)", color: "#94a3b8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00b4ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
            >
              {link.label}
            </a>
          ))}
          {/* Status dot */}
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: "#00b4ff",
              boxShadow: "0 0 8px rgba(0,180,255,0.5)",
            }}
          />
        </div>
      </div>
    </motion.nav>
  );
}
