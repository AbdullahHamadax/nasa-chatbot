export default function Footer() {
  return (
    <footer className="relative z-10 py-12 px-4 sm:px-8 border-t border-space-border/30">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs tracking-[0.2em] text-text-muted">
            NASA<span className="text-electric-blue">·</span>SSE
          </span>
          <span className="text-text-muted/40 text-xs">|</span>
          <span className="text-text-muted/60 text-xs">
            Solar System Explorer
          </span>
        </div>
        <p className="text-text-muted/40 text-xs tracking-wider">
          © {new Date().getFullYear()} — Built for the stars
        </p>
      </div>
    </footer>
  );
}
