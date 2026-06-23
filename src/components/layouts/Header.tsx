import { Bell, InfoIcon, Menu, Moon, SunDimIcon } from "lucide-react";
import React from "react";
import { useTheme } from "../../core/contexts/ThemeProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

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
        "bg-card",
      ].join(" ")}
    >
      {/* ── Logo ── */}
      <div className="flex items-center flex-shrink-0 w-[260px]">
        {/* Logo mark */}
        <div className="w-full h-[50px] flex items-center pl-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-full w-auto object-contain"
          />
        </div>
      </div>
      {/* ── Toggle button ── */}
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={sidebarOpen}
      >
        {/* {sidebarOpen ? <X size={18} /> : <Menu size={18} />} */}
        {<Menu size={20} />}
      </button>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Help */}
        <button aria-label="Knowledge base">
          <InfoIcon size={19} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => toggleTheme()}
          aria-label="Toggle theme"
          className="mx-3"
        >
          {isDark ? <SunDimIcon size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <button aria-label="Notifications" className="relative">
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
