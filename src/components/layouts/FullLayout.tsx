import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FullLayoutProps {
  children: React.ReactNode;
}

// ─── FullLayout ───────────────────────────────────────────────────────────────
const FullLayout: React.FC<FullLayoutProps> = ({ children }) => {
  return (
    <div
      className={[
        // Fill full viewport
        "min-h-screen w-full flex flex-col bg-background",
        "relative overflow-hidden",
      ].join(" ")}
    >
      {/* Ambient gradient blobs — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Top-left accent */}
        <div
          className={[
            "absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full",
            "bg-sky-500/[0.07] blur-[100px]",
          ].join(" ")}
        />
        {/* Bottom-right accent */}
        <div
          className={[
            "absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full",
            "bg-indigo-500/[0.07] blur-[100px]",
          ].join(" ")}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Minimal top bar with logo */}
      <header className="relative z-10 flex items-center px-6 py-4 sm:px-8">
        <a
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded-lg"
          aria-label="NexusOS home"
        >
          <div
            className={[
              "w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0",
              "bg-gradient-to-br from-sky-400 to-indigo-400",
              "text-text font-extrabold text-[13px]",
              "shadow-[0_0_16px_rgba(56,189,248,0.25)]",
            ].join(" ")}
          >
            Nx
          </div>
          <span className="text-[16px] font-bold tracking-[-0.4px] text-white">
            Nexus<span className="text-sky-400">OS</span>
          </span>
        </a>
      </header>

      {/* ── Main content: vertically centred ── */}
      <main
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8"
        id="main-content"
      >
        {children}
      </main>

      {/* Minimal public footer */}
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-4 text-[12px] text-text-light">
        <span>© {new Date().getFullYear()} NexusOS Inc.</span>
        <a href="/privacy" className="hover:text-slate-400 transition-colors duration-150">Privacy</a>
        <a href="/terms" className="hover:text-slate-400 transition-colors duration-150">Terms</a>
        <a href="/help" className="hover:text-slate-400 transition-colors duration-150">Help</a>
      </footer>
    </div>
  );
};

export default FullLayout;