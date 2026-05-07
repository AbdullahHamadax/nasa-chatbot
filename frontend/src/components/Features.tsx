import { motion } from "motion/react";

const FEATURES = [
  {
    icon: "⚙️",
    title: "C-MAPSS Telemetry",
    description:
      "Access historical data streams from the Turbofan Engine Degradation Simulation dataset. Monitor pressure, temperature, and fan speed metrics across 100+ engine units.",
    stat: "100+",
    statLabel: "Engine Units Simulated",
    accent: "#00b4ff",
  },
  {
    icon: "📊",
    title: "Failure Mode Analysis",
    description:
      "Harness advanced analytics to explore HPC (High Pressure Compressor) degradation and other critical failure modes in turbofan engines with 98% diagnostic accuracy.",
    stat: "98%",
    statLabel: "Diagnostic Accuracy",
    accent: "#7c3aed",
  },
  {
    icon: "🤖",
    title: "Jarvis AI Assistant",
    description:
      "Interact with Jarvis, your onboard AI trained on decades of NASA engine archives. Ask anything about engine health, remaining useful life (RUL), and predictive maintenance.",
    stat: "24/7",
    statLabel: "Always Online",
    accent: "#ec4899",
  },
];

const STATS = [
  { value: "4", label: "Operational Conditions", color: "#00b4ff" },
  { value: "21", label: "Sensor Channels", color: "#00e5ff" },
  { value: "30M+", label: "Data Points", color: "#7c3aed" },
  { value: "1", label: "Mission Critical Goal", color: "#ec4899" },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative z-10"
      style={{ paddingTop: "7rem", paddingBottom: "7rem", paddingLeft: "2rem", paddingRight: "2rem" }}
    >
      <div style={{ maxWidth: "72rem", marginLeft: "auto", marginRight: "auto" }}>
        {/* Header */}
        <motion.div
          className="text-center"
          style={{ marginBottom: "5rem" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p
            style={{
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              color: "#00b4ff",
              fontFamily: "var(--font-display)",
              marginBottom: "1rem",
            }}
          >
            Diagnostic Capabilities
          </p>
          <h2
            style={{
              fontSize: "clamp(1.875rem, 4vw, 3rem)",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              color: "#f0f4f8",
              marginBottom: "1.5rem",
            }}
          >
            Engine Health Monitoring
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              color: "#94a3b8",
              maxWidth: "40rem",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
            }}
          >
            Our platform bridges the gap between historical data and predictive maintenance,
            delivering mission-critical insights through cutting-edge technology.
          </p>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass-card relative overflow-hidden group"
              style={{ padding: "2.5rem 2rem", display: "flex", flexDirection: "column" }}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.18 }}
            >
              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0 opacity-60 group-hover:opacity-100"
                style={{
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                  transition: "opacity 0.5s",
                }}
              />

              {/* Icon */}
              <div
                className="flex items-center justify-center"
                style={{
                  width: "3.5rem",
                  height: "3.5rem",
                  borderRadius: "0.75rem",
                  marginBottom: "1.75rem",
                  fontSize: "1.5rem",
                  background: `linear-gradient(135deg, ${f.accent}18, ${f.accent}08)`,
                  border: `1px solid ${f.accent}25`,
                }}
              >
                {f.icon}
              </div>

              {/* Content */}
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  color: "#f0f4f8",
                  marginBottom: "0.75rem",
                  letterSpacing: "0.03em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  color: "#94a3b8",
                  marginBottom: "2rem",
                  flex: 1,
                }}
              >
                {f.description}
              </p>

              {/* Stat — ALL inline to fix the rectangle bug */}
              <div style={{ borderTop: "1px solid rgba(30,41,59,0.5)", paddingTop: "1.25rem" }}>
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                    background: `linear-gradient(135deg, ${f.accent}, ${f.accent}aa)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    display: "inline-block",
                  }}
                >
                  {f.stat}
                </span>
                <span
                  className="block"
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginTop: "0.25rem",
                  }}
                >
                  {f.statLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <motion.div
          className="flex items-center"
          style={{ marginTop: "6rem", gap: "1.5rem" }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
        >
          <div className="flex-1" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.15), transparent)" }} />
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: "#64748b",
              fontFamily: "var(--font-display)",
            }}
          >
            Engine Diagnostics
          </span>
          <div className="flex-1" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,180,255,0.15), transparent)" }} />
        </motion.div>

        {/* Stats bar — fixed with ALL inline styles */}
        <motion.div
          style={{
            marginTop: "4rem",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "2rem",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center" style={{ padding: "1.5rem 0" }}>
              <div
                style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  marginBottom: "0.5rem",
                  background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "inline-block",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#64748b",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
