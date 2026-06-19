import { Bell, InfoIcon, Menu, Moon, SunDimIcon, X } from "lucide-react";
import React, { useState } from "react";
import { useTheme } from "../../../core/contexts/ThemeProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// ─── Inline SVG Icon ──────────────────────────────────────────────────────────
const SvgIcon = ({
  d,
  size = 18,
  className = "",
}: {
  d: string | string[];
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} d={path} />)
      : <path d={d} />}
  </svg>
);



// ─── Header Component ─────────────────────────────────────────────────────────
const Header: React.FC<HeaderProps> = ({ sidebarOpen, onToggleSidebar }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header
      className={[
        // Position & size
        "fixed top-0 left-0 right-0 h-16 z-[100]",
        // Background — frosted glass
        "backdrop-blur-xl",
        // Border
        "border-b border-border",
        // Layout
        "flex items-center pr-4 gap-3",
        "bg-card"
      ].join(" ")}
    >


      {/* ── Logo ── */}
      <div className="flex items-center flex-shrink-0 w-[260px]">
        {/* Logo mark */}
        <div
          className={[
            "w-[34px] h-[34px] rounded-[9px] flex items-center justify-center ml-4",
            "bg-gradient-to-br from-sky-400 to-indigo-400",
            "text-text font-extrabold text-[14px] tracking-tight",
            "shadow-[0_0_20px_rgba(56,189,248,0.3)]",
          ].join(" ")}
          aria-hidden="true"
        >
          Nx
        </div>

        {/* Wordmark — hide on very small screens */}
        <span className="hidden sm:block text-[17px] font-bold tracking-[-0.4px] text-primary">
          Nexus<span className="text-sky-400">OS</span>
        </span>
      </div>
      {/* ── Toggle button ── */}
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={sidebarOpen}
      >
        { sidebarOpen ? <X size={18}/> : < Menu size={18}/> }
      </button>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Help */}
          <button
          aria-label="Knowledge base">
          <InfoIcon size={19} />

          </button>

        {/* Theme toggle */}
        <button
          onClick={() => toggleTheme()}
          aria-label="Toggle theme"
          className="mx-3"
        >
          { isDark ? <SunDimIcon size={20}/> : <Moon size={20}/>}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative"
        >
          <Bell size={20} />
          {/* Notification dot */}
          <span
            className="absolute -top-1 right-0 w-[7px] h-[7px] rounded-full
              bg-danger border-[1.5px] border-danger"
            aria-hidden="true"
          />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08] mx-1" aria-hidden="true" />

        {/* User avatar */}
        <button
          aria-label="Open user menu"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
            bg-gradient-to-br from-sky-400 to-indigo-400
            border-2 border-sky-400/30"
        >
          JD
        </button>
      </div>
    </header>
  );
};

export default Header;