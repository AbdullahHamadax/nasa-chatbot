import BlurText from "./BlurText";
import ASCIIText from "./ASCIIText";
import { motion } from "motion/react";

export default function Hero() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden flex-col"
      style={{ paddingTop: "6rem", paddingBottom: "4rem" }}
    >
      {/* ASCII Text Background */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-20 mix-blend-screen">
        <ASCIIText
          text="C-MAPSS"
          enableWaves={true}
          asciiFontSize={8}
          textFontSize={250}
        />
      </div>

      {/* Subtle grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,180,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute z-0 pointer-events-none"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: "800px",
          maxHeight: "800px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(0,180,255,0.06) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 w-full text-center flex flex-col items-center"
        style={{
          maxWidth: "72rem",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "0 2rem",
        }}
      >
        {/* Mission Status Badge */}
        <motion.div
          className="inline-flex items-center"
          style={{
            gap: "0.5rem",
            padding: "0.4rem 1.25rem",
            borderRadius: "9999px",
            border: "1px solid rgba(0,180,255,0.25)",
            background: "rgba(0,0,5,0.5)",
            backdropFilter: "blur(12px)",
            marginBottom: "2.5rem",
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span
            className="animate-pulse"
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#22c55e",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#00b4ff",
              fontFamily: "var(--font-display)",
            }}
          >
            System Online • Diagnostics Ready
          </span>
        </motion.div>

        {/* Main Headline */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p
            style={{
              letterSpacing: "0.5em",
              textTransform: "uppercase",
              fontSize: "0.85rem",
              color: "#64748b",
              fontFamily: "var(--font-display)",
              marginBottom: "0.75rem",
            }}
          >
            Turbofan Engine Degradation
          </p>
          <BlurText
            text="Telemetry & Simulation"
            delay={100}
            animateBy="words"
            direction="top"
            className="text-4xl sm:text-5xl md:text-7xl font-bold gradient-text-blue font-display"
          />
        </div>

        {/* Subheadline */}
        <motion.p
          style={{
            maxWidth: "38rem",
            marginLeft: "auto",
            marginRight: "auto",
            fontSize: "1.05rem",
            color: "#94a3b8",
            marginBottom: "3rem",
            lineHeight: 1.75,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Access comprehensive historical data from the NASA C-MAPSS dataset.
          Monitor engine health, analyze failure modes, and interact with Jarvis
          for predictive diagnostics.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center"
          style={{ gap: "1.25rem" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Primary button */}
          <motion.button
            onClick={() => scrollTo("features")}
            style={{
              padding: "0.9rem 2.5rem",
              background:
                "linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,180,255,0.05))",
              border: "1px solid rgba(0,180,255,0.4)",
              borderRadius: "0.5rem",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            whileHover={{ scale: 1.04, borderColor: "rgba(0,180,255,0.7)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#00b4ff",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              Engine Diagnostics
            </span>
          </motion.button>

          {/* Secondary button */}
          <motion.button
            onClick={() => scrollTo("solar-system")}
            style={{
              padding: "0.9rem 2.5rem",
              background: "transparent",
              border: "1px solid rgba(100,116,139,0.3)",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
            whileHover={{ scale: 1.04, borderColor: "rgba(100,116,139,0.6)" }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#94a3b8",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
              }}
            >
              Explore Solar System
            </span>
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute flex flex-col items-center"
        style={{
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          gap: "0.5rem",
          zIndex: 10,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span
          style={{
            fontSize: "0.55rem",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#475569",
          }}
        >
          Scroll to explore
        </span>
        <motion.div
          style={{
            width: "1px",
            height: "3rem",
            background: "linear-gradient(to bottom, #475569, transparent)",
          }}
          animate={{ scaleY: [1, 0.5, 1], transformOrigin: "top" }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
