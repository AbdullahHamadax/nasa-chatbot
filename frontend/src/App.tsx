import Hero from "./components/Hero";
import Features from "./components/Features";
import JarvisChatbot from "./components/JarvisChatbot";
import Navbar from "./components/Navbar";
import StarField from "./components/StarField";
import InfiniteMenu from "./components/InfiniteMenu";
import OrbitImages from "./components/OrbitImages";
import {
  Mercury,
  Venus,
  Earth,
  Mars,
  Jupiter,
  Saturn,
  Uranus,
  Neptune,
} from "./components/Planets";
import { motion } from "motion/react";

/* ── InfiniteMenu items (CORS-safe image URLs) ── */
const historicalItems = [
  {
    image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=600&h=600&fit=crop",
    link: "#",
    title: "Space Shuttle",
    description: "RS-25 engines powered 135 missions.",
  },
  {
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=600&fit=crop",
    link: "#",
    title: "Apollo Program",
    description: "The F-1 remains history's most powerful single-nozzle engine.",
  },
  {
    image: "https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=600&h=600&fit=crop",
    link: "#",
    title: "ISS Assembly",
    description: "Continuous habitation since November 2000.",
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=600&fit=crop",
    link: "#",
    title: "Earth Observation",
    description: "Monitoring our planet from low Earth orbit.",
  },
  {
    image: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&h=600&fit=crop",
    link: "#",
    title: "Mars Missions",
    description: "Perseverance rover exploring Jezero Crater.",
  },
  {
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=600&fit=crop",
    link: "#",
    title: "Deep Space",
    description: "Webb telescope revealing the earliest galaxies.",
  },
];

/* ── Sun center component ── */
function Sun() {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: "radial-gradient(circle at 40% 35%, #ffe082, #ffa726 50%, #e65100)",
        boxShadow: "0 0 30px rgba(255,167,38,0.5), 0 0 60px rgba(255,111,0,0.3), 0 0 100px rgba(255,167,38,0.15)",
        animation: "sun-corona-pulse 4s ease-in-out infinite",
      }}
    />
  );
}

/* ── Planet orbit items ── */
const innerPlanets = [
  { content: <Mercury size={22} />, label: "Mercury" },
  { content: <Venus size={28} />, label: "Venus" },
  { content: <Earth size={30} />, label: "Earth" },
  { content: <Mars size={26} />, label: "Mars" },
];

const outerPlanets = [
  { content: <Jupiter size={50} />, label: "Jupiter" },
  { content: <Saturn size={55} />, label: "Saturn" },
  { content: <Uranus size={38} />, label: "Uranus" },
  { content: <Neptune size={36} />, label: "Neptune" },
];

function App() {
  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden"
      style={{
        background: "#000005",
        color: "#e2e8f0",
      }}
    >
      {/* Lightweight star background */}
      <StarField />

      <Navbar />

      <main className="relative z-10 flex flex-col">
        <Hero />

        {/* ── Solar System Section ── */}
        <section
          id="solar-system"
          className="relative z-10"
          style={{ paddingTop: "5rem", paddingBottom: "6rem", paddingLeft: "2rem", paddingRight: "2rem" }}
        >
          <div style={{ maxWidth: "72rem", marginLeft: "auto", marginRight: "auto" }}>
            <motion.div
              className="text-center"
              style={{ marginBottom: "4rem" }}
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
                Solar System Overview
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.875rem, 4vw, 3rem)",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "#f0f4f8",
                  marginBottom: "1rem",
                }}
              >
                Our Celestial Neighborhood
              </h2>
              <p style={{ color: "#94a3b8", maxWidth: "36rem", marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
                An interactive model of our solar system. Each planet is rendered as a custom SVG
                with accurate color palettes and atmospheric details.
              </p>
            </motion.div>

            {/* Orbit display */}
            <motion.div
              className="flex items-center justify-center"
              style={{ position: "relative", minHeight: "420px" }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              {/* Inner orbit */}
              <OrbitImages
                items={innerPlanets}
                radiusX={140}
                radiusY={140}
                duration={30}
                itemSize={35}
                centerContent={<Sun />}
                centerSize={60}
                showOrbitPath={true}
                tilt={70}
              />

              {/* Outer orbit — absolute positioned on top */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <OrbitImages
                  items={outerPlanets}
                  radiusX={280}
                  radiusY={280}
                  duration={60}
                  itemSize={55}
                  showOrbitPath={true}
                  tilt={70}
                  reverse={true}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Infinite Menu Section ── */}
        <section
          id="history"
          className="relative z-10"
          style={{ paddingTop: "5rem", paddingBottom: "5rem" }}
        >
          <div style={{ maxWidth: "72rem", marginLeft: "auto", marginRight: "auto", paddingLeft: "2rem", paddingRight: "2rem", marginBottom: "3rem" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
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
                Historical Archives
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.875rem, 4vw, 2.5rem)",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "#f0f4f8",
                }}
              >
                Explore NASA History
              </h2>
              <p style={{ color: "#94a3b8", marginTop: "0.75rem", maxWidth: "40rem" }}>
                Drag to navigate through historical milestones and critical engine developments.
              </p>
            </motion.div>
          </div>
          <div
            style={{
              width: "100%",
              height: "600px",
              position: "relative",
              borderTop: "1px solid rgba(0,180,255,0.12)",
              borderBottom: "1px solid rgba(0,180,255,0.12)",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <InfiniteMenu items={historicalItems} />
          </div>
        </section>

        <Features />
      </main>

      {/* Persistent Chatbot */}
      <JarvisChatbot />

      {/* Footer */}
      <footer
        className="relative z-10 text-center"
        style={{
          borderTop: "1px solid rgba(30,41,59,0.5)",
          background: "rgba(0,0,5,0.9)",
          padding: "2.5rem 1.5rem",
        }}
      >
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#64748b",
            fontFamily: "var(--font-display)",
          }}
        >
          NASA C-MAPSS Simulation Environment • Internal Use Only
        </p>
      </footer>
    </div>
  );
}

export default App;
