import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ListTodoIcon,
  LogOut,
  Mail,
  SendToBack,
  Settings2Icon,
  UserRoundCogIcon,
  Building2,
  Check,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Entity } from "../../core/types";
import { useStore } from "../../core/contexts/StoreProvider";
import { eventService } from "../../core/services/events";
import UserService from "../../core/services/user"
import AddEntityModal from "./header/AddEntityModal";
import { useModal } from "../../core/hooks/useModal";
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

// ─── Nav Groups Config ────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard", badge: null },
      { id: "invoice", label: "Invoicing", icon: <ListTodoIcon size={20} />, href: "/invoices", badge: "New", badgeVariant: "warning" },
      { id: "inventory", label: "Inventory", icon: <SendToBack size={20} />, href: "/inventory", badge: "New", badgeVariant: "success" },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "customers", label: "Customers", icon: <UserRoundCogIcon size={20} />, href: "/customers", badge: null },
      { id: "suppliers", label: "Suppliers", icon: <UserRoundCogIcon size={20} />, href: "/suppliers", badge: null },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "users", label: "Team", icon: <UserRoundCogIcon size={20} />, href: "/team", badge: null },
      { id: "messages", label: "Messages", icon: <Mail size={20} />, href: "/messages", badge: "3", badgeVariant: "warning" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: <Settings2Icon size={20} />, href: "/settings", badge: null },
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

// ─── Entity Switcher ──────────────────────────────────────────────────────────
const EntitySwitcher: React.FC = () => {
  const { entity, setEntity, storeEntities, setStoreEntities } = useStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal()
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Fetch entities when dropdown opens (if not already loaded)
  const handleOpen = useCallback(async () => {
    setOpen((prev) => !prev);
    if (storeEntities.length > 0) return;

    setLoading(true);
    try {
      const res = await UserService.getMyEntities();
      const entities: Entity[] = res?.results?.entities || [];
      setStoreEntities(entities);
    } catch (err) {
      console.error("Failed to load entities:", err);
    } finally {
      setLoading(false);
    }
  }, [storeEntities, setStoreEntities]);

  // Switch active entity
  const handleSelectEntity = useCallback(
    async (selected: Entity) => {
      if (selected.uuid === entity?.uuid) {
        setOpen(false);
        return;
      }

      setSwitching(selected.uuid);
      try {
        setEntity(selected);
        setOpen(false);
        // Trigger soft refresh across all subscribed components
        eventService.triggerRefresh();
      } catch (err) {
        console.error("Failed to switch entity:", err);
      } finally {
        setSwitching(null);
      }
    },
    [entity, setEntity]
  );

  const handleAddEntity = async() =>{
    setOpen(false)
    const result = await openModal(AddEntityModal, {
      data: null,
      size: "xl",
      side: "right"
    })
    if(result?.success){
      eventService.triggerRefresh();
    }
  }
  // Display values
  const entityName = entity?.name || "Select Organisation";
  const entityInitial = entityName.charAt(0).toUpperCase();


  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-3 w-full px-3 py-2.5 text-left mt-4
          hover:bg-white/[0.05] transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {/* Entity avatar */}
        <div className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center
          bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-[11px] font-bold">
          {entityInitial}
        </div>

        {/* Entity name & role */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-text-light truncate">
            {entityName}
          </p>
          <p className="text-[11.5px] text-text truncate">
            {entity?.branch}
          </p>
        </div>

        {/* Chevron */}
        <span
          className={`text-text-light flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={14} />
        </span>
      </button>
          <div className="border-b border-border mt-4"></div>
      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-2 right-2 z-50
            bg-card border border-border rounded-xl shadow-xl
            overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          aria-label="Select organisation"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-light">
              Organisations
            </p>
          </div>

          {/* Entity list */}
          <div className="max-h-52 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-5 text-text-light">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[12px]">Loading...</span>
              </div>
            ) : storeEntities.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-5 px-3 text-center">
                <Building2 size={18} className="text-text-light opacity-50" />
                <p className="text-[12px] text-text-light">No organisations found</p>
              </div>
            ) : (
              storeEntities?.map((e: Entity) => {
                const isActive = e.uuid === entity?.uuid;
                const isSwitching = switching === e.uuid;

                return (
                  <button
                    key={e.uuid}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelectEntity(e)}
                    disabled={isSwitching}
                    className={[
                      "flex items-center gap-3 w-full px-3 py-2.5 text-left",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-primary-30 text-primary"
                        : "hover:bg-white/[0.05] text-text-light",
                    ].join(" ")}
                  >
                    {/* Avatar */}
                    <div
                      className={[
                        "w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center",
                        "text-white text-[10px] font-bold",
                        isActive
                          ? "bg-gradient-to-br from-indigo-500 to-sky-500"
                          : "bg-white/10",
                      ].join(" ")}
                    >
                      {e.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium truncate">{e.name}</p>
                      {e.email && (
                        <p className="text-[10.5px] text-text truncate opacity-70">{e.email}</p>
                      )}
                    </div>

                    {/* Active check / spinner */}
                    <span className="flex-shrink-0">
                      {isSwitching ? (
                        <Loader2 size={13} className="animate-spin text-text-light" />
                      ) : isActive ? (
                        <Check size={13} className="text-primary" />
                      ) : null}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer action */}
          <div className="border-t border-border p-1.5">
            <button
             
              onClick={() => handleAddEntity()}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                text-[12px] text-text-light hover:bg-white/[0.05]
                transition-colors duration-150"
            >
              <Building2 size={13} />
              Manage organisations
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── User Footer ──────────────────────────────────────────────────────────────
const UserFooter: React.FC = () => {
  const { user, logout } = useStore();

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace("_", " ")
    : "";

  return (
    <div className="px-3 py-4 border-t border-white/[0.06]">
      <button
        className="flex items-center gap-3 w-full px-3 py-2.5 text-left
          hover:bg-white/[0.05] transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          bg-gradient-to-br from-sky-400 to-indigo-400 text-white text-xs font-bold">
          {initials}
        </div>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-text-light truncate">
            {user?.name || "Unknown"}
          </p>
          <p className="text-[11.5px] text-text truncate">{roleLabel}</p>
        </div>

        <span className="text-text-light flex-shrink-0">
          <ChevronRight size={14} />
        </span>
      </button>

      {/* Sign out */}
      <button
        onClick={logout}
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
  );
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
          "fixed top-16 bottom-0 left-0 z-50 bg-card",
          "w-[260px] flex flex-col",
          "border-r border-border",
          "overflow-y-auto overflow-x-hidden",
          "transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isMobile && isOpen ? "shadow-[0_8px_40px_rgba(0,0,0,0.5)]" : "",
        ].join(" ")}
        aria-label="Sidebar navigation"
      >
        {/* Entity Switcher */}
        <EntitySwitcher />

        {/* Nav content */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-7">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 mb-1.5 text-[10.5px] font-semibold tracking-[0.1em] uppercase text-text-light select-none">
                {group.label}
              </p>

              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.href}
                        onClick={() => isMobile && onClose()}
                        className={[
                          "flex items-center gap-3 p-3 rounded-lg",
                          "text-sm font-medium w-full",
                          "transition-all duration-200",
                          active
                            ? "bg-primary-30 text-primary shadow-[inset_3px_0_0_var(--primary-color)]"
                            : "text-text hover:bg-white/[0.05] hover:text-primary",
                        ].join(" ")}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className={["flex-shrink-0", active ? "opacity-100" : "opacity-70"].join(" ")}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
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

        {/* User footer */}
        <UserFooter />
      </aside>
    </>
  );
};

export default Sidebar;