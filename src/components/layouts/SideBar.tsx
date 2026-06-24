import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ListTodoIcon,
  LogOut,
  SendToBack,
  Settings2Icon,
  UserRoundCogIcon,
  Building2,
  Check,
  Loader2,
  Bell,
  ContrastIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Entity } from "../../core/types";
import { useStore } from "../../core/contexts/StoreProvider";
import { eventService } from "../../core/services/events";
import UserService from "../../core/services/user";
import AddEntityModal from "./AddEntityModal";
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
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        href: "/dashboard",
        badge: null,
      }
    ],
  },

  {
    label: "Main",
    items: [
      {
        id: "invoice",
        label: "Invoicing",
        icon: <ListTodoIcon size={20} />,
        href: "/invoices",
        badge: "New",
        badgeVariant: "warning",
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: <SendToBack size={20} />,
        href: "/inventory",
        badge: "New",
        badgeVariant: "success",
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        id: "customers",
        label: "Customers",
        icon: <UserRoundCogIcon size={20} />,
        href: "/customers",
        badge: null,
      },
      {
        id: "suppliers",
        label: "Suppliers",
        icon: <UserRoundCogIcon size={20} />,
        href: "/suppliers",
        badge: null,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        id: "teams",
        label: "Team",
        icon: <UserRoundCogIcon size={20} />,
        href: "/team",
        badge: null,
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <Bell size={20} />,
        href: "/notifications",
        badge: "3", // Dynamic unread count
        badgeVariant: "warning",
      },
    ],
  },
  {
    label: "Expense",
    items: [
      {
        id: "expenses",
        label: "Expenses",
        icon: <ContrastIcon size={20} />,
        href: "/expenses",
        badge: null,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: <Settings2Icon size={20} />,
        href: "/settings",
        badge: null,
      },
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

// ─── User Footer ──────────────────────────────────────────────────────────────
const UserFooter: React.FC = () => {
  const { user, logout } = useStore();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
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
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
          bg-gradient-to-br from-sky-400 to-indigo-400 text-white text-xs font-bold"
        >
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
        onClick={() => logout()}
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
// ─── Entity Switcher ──────────────────────────────────────────────────────────
interface EntitySwitcherProps {
  entity: Entity | null;
  setEntity: (entity: Entity) => void;
  storeEntities: Entity[];
  setStoreEntities: (entities: Entity[]) => void;
  displayEntities: Entity[];
  loading: boolean;
  onOpen: () => void;
  onSelectEntity: (selected: Entity) => void;
  onAddEntity: () => void;
}

const EntitySwitcher: React.FC<EntitySwitcherProps> = ({
  entity,
  setEntity,
  storeEntities,
  setStoreEntities,
  displayEntities,
  loading,
  onOpen,
  onSelectEntity,
  onAddEntity,
}) => {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { openModal } = useModal();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = useCallback(() => {
    setOpen((prev) => !prev);
    if (!open) {
      onOpen(); // Fetch entities when opening dropdown
    }
  }, [open, onOpen]);

  const handleSelectEntity = useCallback(
    async (selected: Entity) => {
      if (selected.uuid === entity?.uuid) {
        setOpen(false);
        return;
      }

      setSwitching(selected.uuid);
      try {
        onSelectEntity(selected);
        setOpen(false);
      } catch (err) {
        console.error("Failed to switch entity:", err);
      } finally {
        setSwitching(null);
      }
    },
    [entity, onSelectEntity],
  );

  const handleAddEntity = async () => {
    setOpen(false);
    const result = await openModal(AddEntityModal, {
      data: null,
      size: "xl",
      side: "right",
    });
    if (result?.success) {
      onAddEntity();
    }
  };

  // Display values
  const entityName = entity?.name || "Select Organisation";
  const entityInitial = entityName.charAt(0).toUpperCase();
  const { user } = useStore();

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
        <div
          className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center
          bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-[11px] font-bold"
        >
          {entityInitial}
        </div>

        {/* Entity name & role */}
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-text-light truncate">
            {entityName}
          </p>
          <p className="text-[11.5px] text-text truncate">{entity?.branch}</p>
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
            ) : displayEntities.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 py-5 px-3 text-center">
                <Building2 size={18} className="text-text-light opacity-50" />
                <p className="text-[12px] text-text-light">
                  No organisations found
                </p>
                {user?.role === "admin" && (<button
                  onClick={handleAddEntity}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Create your first organisation
                </button>)}
              </div>
            ) : (
              displayEntities.map((e: Entity) => {
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
                      <p className="text-[12.5px] font-medium truncate">
                        {e.name}
                      </p>
                      {e.branch && (
                        <p className="text-[10.5px] text-text truncate opacity-70">
                          {e.branch}
                        </p>
                      )}
                    </div>

                    {/* Active check / spinner */}
                    <span className="flex-shrink-0">
                      {isSwitching ? (
                        <Loader2
                          size={13}
                          className="animate-spin text-text-light"
                        />
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
            {user?.role === "admin" && (<button
              onClick={handleAddEntity}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                text-[12px] text-text-light hover:bg-white/[0.05]
                transition-colors duration-150"
            >
              <Building2 size={13} />
              Add Branch
            </button>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { entity, setEntity, setStoreEntities, user } = useStore();

  // Local state for entities to use in navigation
  const [localEntities, setLocalEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if user has access to dashboard
  const hasDashboardAccess = user?.role === "admin" || user?.role === "super_admin";

  // Filter navigation groups based on user role
  const getFilteredNavGroups = useCallback(() => {
    return NAV_GROUPS.map((group) => {
      return {
        ...group,
        items: group.items.filter((item) => {
          // If item is dashboard, only show for admin/super_admin
          if (item.id === "dashboard" || item.id === "teams" || item.id === "expenses") {
            return hasDashboardAccess;
          }
          return true;
        }),
      };
    }).filter((group) => group.items.length > 0); // Remove empty groups
  }, [hasDashboardAccess]);

  // Fetch entities function - stores in local state
  const fetchEntities = useCallback(async () => {
    // Check local state first
    if (localEntities.length > 0) {
      return localEntities.filter((e: Entity) => e.uuid !== "ALL_ENTITIES");
    }

    setLoading(true);
    try {
      const res = await UserService.getMyEntities();
      const entities: Entity[] = res?.results || [];

      // Filter out the "ALL_ENTITIES" entity
      const filteredEntities = entities.filter(
        (e: Entity) => e.uuid !== "ALL_ENTITIES",
      );

      // Store in local state
      setLocalEntities(filteredEntities);

      // Also update store if needed
      setStoreEntities(filteredEntities);

      // If no entity is selected and we have entities, select the first one
      if (!entity && filteredEntities.length > 0) {
        setEntity(filteredEntities[0]);
        eventService.triggerRefresh();
      }

      return filteredEntities;
    } catch (err) {
      console.error("Failed to load entities:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [localEntities, setStoreEntities, entity, setEntity]);

  // Handle entity selection
  const handleSelectEntity = useCallback(
    (selected: Entity) => {
      if (selected.uuid === entity?.uuid) return;
      setEntity(selected);
      eventService.triggerRefresh();
    },
    [entity, setEntity],
  );

  // Handle add entity
  const handleAddEntity = useCallback(async () => {
    await fetchEntities();
    eventService.triggerRefresh();
  }, [fetchEntities]);

  // Auto-select first entity when navigating from dashboard or when entities load
  useEffect(() => {
    const isDashboard = location.pathname === "/dashboard";
    const filteredEntities = localEntities.filter(
      (e: Entity) => e.uuid !== "ALL_ENTITIES",
    );

    // If we have entities and no entity is selected
    if (filteredEntities.length > 0 && !entity) {
      setEntity(filteredEntities[0]);
      eventService.triggerRefresh();
    }

    // If on dashboard with ALL_ENTITIES, switch to first valid entity
    if (isDashboard && entity?.entity_id === "ALL_ENTITIES") {
      const filtered = localEntities.filter(
        (e: Entity) => e.uuid !== "ALL_ENTITIES",
      );
      if (filtered.length > 0) {
        setEntity(filtered[0]);
        eventService.triggerRefresh();
      }
    }
  }, [localEntities, entity, location.pathname, setEntity]);

  // Handle navigation with entity switching logic
  const handleNavigation = useCallback(
    (href: string) => {
      // Close sidebar on mobile
      if (isMobile) {
        onClose();
      }

      // Check if current entity is "ALL_ENTITIES"
      if (entity?.entity_id === "ALL_ENTITIES") {
        // Use localEntities for filtering
        const filteredEntities = localEntities.filter(
          (e: Entity) => e.uuid !== "ALL_ENTITIES",
        );

        if (filteredEntities.length > 0) {
          // Set to first valid entity before navigating
          setEntity(filteredEntities[0]);
          // Navigate after setting entity
          navigate(href);
          // Trigger refresh to update data with new entity
          eventService.triggerRefresh();
          return;
        }
      }

      // Normal navigation
      navigate(href);
    },
    [isMobile, onClose, entity, localEntities, setEntity, navigate],
  );

  // Handle dashboard access restriction
  useEffect(() => {
    // If user is on dashboard but doesn't have access, redirect to invoices
    if (location.pathname === "/dashboard" && !hasDashboardAccess) {
      navigate("/invoices");
    }
  }, [location.pathname, hasDashboardAccess, navigate]);

  // Fetch entities on mount if not already loaded
  useEffect(() => {
    if (localEntities.length === 0) {
      fetchEntities();
    }
    // eslint-disable-next-line
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

  // Filter entities for display - use localEntities
  const displayEntities = localEntities.filter(
    (e: Entity) => e.uuid !== "ALL_ENTITIES",
  );

  // Get filtered navigation groups
  const filteredNavGroups = getFilteredNavGroups();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          className={[
            "fixed inset-0 z-40",
            "transition-opacity duration-300",
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
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
        <EntitySwitcher
          entity={entity}
          setEntity={setEntity}
          storeEntities={localEntities}
          setStoreEntities={setLocalEntities}
          displayEntities={displayEntities}
          loading={loading}
          onOpen={fetchEntities}
          onSelectEntity={handleSelectEntity}
          onAddEntity={handleAddEntity}
        />

        {/* Nav content */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-7">
          {filteredNavGroups.map((group) => (
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
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation(item.href);
                        }}
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
                        <span
                          className={[
                            "flex-shrink-0",
                            active ? "opacity-100" : "opacity-70",
                          ].join(" ")}
                        >
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
