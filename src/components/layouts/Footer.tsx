import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FooterLink {
  label: string;
  href: string;
}

// ─── Link Groups ──────────────────────────────────────────────────────────────
const FOOTER_LINKS: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "Status", href: "https://status.nexusos.io" },
  { label: "Help", href: "/help" },
  { label: "Changelog", href: "/changelog" },
];


// ─── Footer Component ─────────────────────────────────────────────────────────
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={[
        "border-t border-white/[0.06]",
        "px-6 py-5",
      ].join(" ")}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">

        {/* ── Brand + copyright ── */}
        <div className="flex items-center gap-5 flex-shrink-0">
          {/* Logo mark */}
          <div className="flex items-center gap-2">
            <div
              className={"w-[28px] h-[28px] rounded-[7px] flex items-center justify-center"}
            >
              Nx
            </div>
            <span className="text-sm font-bold text-white tracking-[-0.3px]">
              Nexus<span className="text-sky-400">OS</span>
            </span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-black/[0.08]" aria-hidden="true" />

          {/* Copyright */}
          <p className="text-[12px] text-text-light">
            © {year} NexusOS Inc.
          </p>
        </div>

        {/* ── Nav links ── */}
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap gap-x-4 gap-y-1.5"
        >
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[12.5px] text-text-light hover:text-sky-400
                transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 rounded"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
};

export default Footer;