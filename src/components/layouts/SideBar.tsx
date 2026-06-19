import { AlignVerticalJustifyCenterIcon, ChevronRight, LayoutDashboard, ListTodoIcon, LogOut, Mail, SendToBack, Settings2Icon, UserRoundCogIcon } from "lucide-react";
import React from "react";
import { NavLink, useLocation } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | null;
  badgeVariant?: "accent" | "success" | "warning";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

// ─── Inline SVG Icon Helper ───────────────────────────────────────────────────
const SvgIcon = ({
  d,
  size = 18,
}: {
  d: string | string[];
  size?: number;
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
    aria-hidden="true"
  >
    {Array.isArray(d)
      ? d.map((path, i) => <path key={i} d={path} />)
      : <path d={d} />}
  </svg>
);

// ─── Nav Groups Config ────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/", badge: null },
      { id: "invoice", label: "Invoicing", icon: <ListTodoIcon size={20} />, href: "/invoices", badge: "New", badgeVariant: "warning" },
      { id: "inventory", label: "Inventory", icon: <SendToBack size={20} />, href: "/inventory", badge: "New", badgeVariant: "success" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "users", label: "Team", icon: <UserRoundCogIcon size={20} />, href: "/team", badge: null },
      { id: "messages", label: "Messages", icon: <Mail size={20}/>, href: "/messages", badge: "3", badgeVariant: "warning" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: <Settings2Icon size={20}/>, href: "/settings", badge: null },
    ],
  },
];

// ─── Badge Variants ───────────────────────────────────────────────────────────
const badgeStyles: Record<string, string> = {
  accent: "bg-sky-400/15 text-sky-400",
  primary: "bg-primary-10 text-primary",
  success: "bg-emerald-400/15 text-emerald-400",
  warning: "bg-amber-400/15 text-amber-400",
};

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          className={[
            "fixed inset-0 z-40",
            "transition-opacity duration-300",
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          ].join(" ")}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          // Base layout
          "fixed top-16 bottom-0 left-0 z-50 bg-card",
          "w-[260px] flex flex-col",
          // Background & border
          "border-r border-border",
          // Scroll
          "overflow-y-auto overflow-x-hidden",
          // Slide transition
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop shadow only when open on mobile
          isMobile && isOpen ? "shadow-[0_8px_40px_rgba(0,0,0,0.5)]" : "",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        {/* Nav content */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-7">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <p className="px-2.5 mb-1.5 text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-light select-none">
                {group.label}
              </p>

              {/* Items */}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.href}
                        onClick={() => isMobile && onClose()}
                        className={[
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                          "text-sm font-medium w-full",
                          "transition-all duration-200",
                          active
                            ? "bg-primary-30 text-sky-400 shadow-[inset_3px_0_0_#38BDF8]"
                            : "text-text hover:bg-white/[0.05] hover:text-primary",
                        ].join(" ")}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* Icon */}
                        <span className={["flex-shrink-0", active ? "opacity-100" : "opacity-70"].join(" ")}>
                          {item.icon}
                        </span>

                        {/* Label */}
                        <span className="flex-1 truncate">{item.label}</span>

                        {/* Badge */}
                        {item.badge && (
                          <span
                            className={[
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              badgeStyles[item.badgeVariant ?? "accent"],
                            ].join(" ")}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User card footer */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 text-left
              hover:bg-white/[0.05] transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
              bg-gradient-to-br from-sky-400 to-indigo-400 text-text text-xs font-bold">
              JD
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold text-slate-100 truncate">James Donkor</p>
              <p className="text-[11.5px] text-text-light truncate">Admin · Pro Plan</p>
            </div>

            {/* Chevron */}
            <span className="text-text-light flex-shrink-0">
              <ChevronRight size={14} />
            </span>
          </button>

          {/* Sign out */}
          <button
            className="mt-1 flex items-center gap-3 w-full px-3 py-2 text-left
              text-sm text-text-light hover:text-rose-400 hover:bg-rose-400/[0.06]
              transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
          >
            <span className="opacity-70">
              <LogOut size={15} />
            </span>
            <span className="text-[13px] font-medium">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;