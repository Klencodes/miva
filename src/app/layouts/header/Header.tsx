import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ENTITY_KEY,
  getStoredItem,
  USER_KEY,
  useStore,
} from "../../../core/hooks/useStore";
import { LayoutMode } from "../types/layout";
import { useLayout } from "../../../core/hooks/useLayout";
import { appService } from "../../../core/services/app";
import { IEntity, IEntityItem } from "../../../core/interfaces/IEntity";
import { useModal } from "../../../core/hooks/useModal";
import { Roles, SUPER_ADMIN_ENTITY_ID } from "../../../core/enums/roles";
import { eventService } from "../../../core/services/events";
import { Button } from "../../../ui";
import AddEntityModal from "./AddEntityModal";

interface HeaderProps {
  isVerticalLayout: boolean;
  onToggleSidebar: () => void;
  onUserMenuAction?: (action: "logout" | "profile" | "settings") => void;
  onLogoClick?: () => void;
  currentSidebarState?: "standard" | "condensed" | "hidden";
}

const Header: React.FC<HeaderProps> = ({
  isVerticalLayout,
  onToggleSidebar,
  onUserMenuAction,
  onLogoClick,
  currentSidebarState = "standard",
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [isEntityLoading, setIsEntityLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, entity, setEntity, storeEntities, setStoreEntities } =
    useStore();
  const { layoutMode } = useLayout();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);
  const userData = user || getStoredItem(USER_KEY, null);

  // Track if we've already fetched entities to prevent duplicate calls
  const hasFetchedEntities = useRef(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- Entity Fetching/State Management Logic ---
  const fetchEntities = useCallback(
    async (isManualRefetch = false) => {
      // Prevent API calls when offline
      if (!isOnline) {
        setIsEntityLoading(false);
        return;
      }

      // STOP THE LOOP:
      // If not a manual refresh, and we are already loading OR have already fetched, stop.
      if (!isManualRefetch && (hasFetchedEntities.current || isEntityLoading)) {
        return;
      }

      setIsEntityLoading(true);

      // MARK AS FETCHED IMMEDIATELY to prevent race conditions/loops
      if (!isManualRefetch) {
        hasFetchedEntities.current = true;
      }

      // If manual refresh, clear store temporarily
      if (isManualRefetch) {
        setStoreEntities(null);
        // Note: We don't reset hasFetchedEntities here because we are effectively fetching now
      }

      try {
        const res = await appService.getEntities();

        if (res && res.results) {
          if (res.results.length > 0) {
            let entitiesToSet = res.results;

            if (userData?.role === Roles.SUPER_ADMIN) {
              entitiesToSet = res.results.map((ent: IEntityItem) => ({
                ...ent,
                id:
                  ent.name === "All Entities"
                    ? SUPER_ADMIN_ENTITY_ID
                    : ent.id,
              }));
            }

            setStoreEntities(entitiesToSet);

            // Use functional update to remove 'entity' from dependency array
            if (!entity) {
              const storedEntity = getStoredItem<IEntityItem | null>(
                ENTITY_KEY,
                null
              );
              setEntity(storedEntity || entitiesToSet[0]);
            }
          }
        } else {
          setStoreEntities([]);
        }
      } catch (error) {
        // If it failed, allow it to try again next time
        hasFetchedEntities.current = false;

        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          console.warn("Network error - keeping existing entities if any");
        } else {
          setStoreEntities([]);
        }
      } finally {
        setIsEntityLoading(false);
      }
    },
    [isOnline, userData?.role, navigate, setEntity, setStoreEntities]
  );

  // Fetch entities only once on mount and when coming back online
  useEffect(() => {
    if (isOnline && !hasFetchedEntities.current) {
      fetchEntities();
    }
  }, [fetchEntities, isOnline]);

  // Handlers for refresh
  const handleRefreshEntities = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isOnline) {
      console.warn("No internet connection - cannot refresh entities");
      return;
    }

    fetchEntities(true);
  };

  // Handle entity selection
  const handleEntitySelect = async (selectedEntity: IEntityItem) => {
    setEntity(selectedEntity);
    setShowEntityDropdown(false);
    eventService.triggerRefresh();
  };

  // --- UI/Event Handlers (unchanged) ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        entityDropdownRef.current &&
        !entityDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEntityDropdown(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleUserMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowUserMenu(!showUserMenu);
    setShowEntityDropdown(false);
  };

  const handleAddEntity = async () => {
    if (!isOnline) {
      return;
    }

    try {
      const result = await openModal(AddEntityModal, {
        data: null,
        size: "3xl",
        side: "right",
        backdropClose: true,
      });

      switch (result?.success) {
        case "success":
          // After successful addition, refresh entities
          handleRefreshEntities();
          return;

        default:
          break;
      }
    } catch (error) {
      console.error("Error in handleAddEntity:", error);
    }
  };

  const handleEntityButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEntityDropdown(!showEntityDropdown);
  };

  const handleToggleSidebar = () => {
    onToggleSidebar();
  };

  const handleLogoClickInternal = (event: React.MouseEvent) => {
    event.preventDefault();
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate("/dashboard");
    }
  };

  const handleUserMenuAction = (
    action: "logout" | "profile" | "settings",
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setShowUserMenu(false);

    if (onUserMenuAction) {
      onUserMenuAction(action);
    } else {
      switch (action) {
        case "profile":
          navigate("/profile");
          break;
        case "settings":
          navigate("/settings");
          break;
        case "logout":
          console.log("Logout clicked");
          break;
        default:
          break;
      }
    }
  };

  const isCondensed = currentSidebarState === "condensed";
  const displayEntityName = isEntityLoading
    ? "Loading Entities..."
    : !isOnline
    ? "Offline - No Connection"
    : entity
    ? entity.name
    : "Select Entity";

  return (
    <div className="flex items-center justify-between h-16 px-6 bg-card z-[1000] relative border-b border-border isolate-parts">
      {/* --- LEFT SIDE (Logo/Sidebar Toggle) --- */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className={`
            flex items-center transition-all duration-300 cursor-pointer
            ${isCondensed ? "w-[30px]" : "w-[230px]"}
          `}
          aria-label="Home"
          onClick={handleLogoClickInternal}
        >
          <img
            src="/icons/logo-icon.png"
            className={`
              h-8 w-8
              ${isCondensed ? "block" : "hidden"}
            `}
            alt="App Icon"
          />
          <img
            src="/icons/logo-full.png"
            className={`
              h-[45px] ml-3 transition-opacity duration-200
              ${isCondensed ? "opacity-0 w-0 ml-0 hidden" : "opacity-100 block"}
            `}
            alt="App Logo"
          />
        </Link>
        <div className="flex gap-2 ml-4">
          {isVerticalLayout && (
            <button
              className="
                bg-transparent border-none cursor-pointer text-text-light text-xl p-2 rounded-sm 
                transition-all duration-200 flex items-center justify-center w-10 h-10 
                hover:bg-background hover:text-text
              "
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <i className="ri-menu-line"></i>
            </button>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE (Controls) --- */}
      <div className="flex items-center">
        {/* Online/Offline Status Indicator */}
        <div
          className={`
            flex items-center mr-3 px-2 py-1 rounded text-xs font-medium
            ${
              isOnline
                ? "bg-success-5 text-success border border-success"
                : "bg-danger-5 text-danger border border-danger"
            }
          `}
          title={isOnline ? "Online" : "Offline - No Internet Connection"}
        >
          <i className={`ri-wifi-${isOnline ? "line" : "off-line"} mr-1`}></i>
          {isOnline ? "Online" : "Offline"}
        </div>

        {/* Maximize/Fullscreen button */}
        <button
          className="
              bg-transparent border-none cursor-pointer text-text-light text-xl p-2 rounded-sm 
              transition-all duration-200 flex items-center justify-center w-10 h-10 
              hover:bg-background hover:text-text mr-3
            "
          onClick={toggleFullScreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          <i
            className={
              isFullscreen ? "ri-fullscreen-exit-line" : "ri-fullscreen-line"
            }
          ></i>
        </button>

        {/* Entity Dropdown/Modal Button */}
        {(storeEntities !== null || isEntityLoading) && (
          <div ref={entityDropdownRef} className="relative">
            <button
              className="
                min-w-[200px]
                flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium rounded-sm 
                bg-background border border-border text-text transition-colors duration-200 
                hover:bg-background-10
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              onClick={handleEntityButtonClick}
              aria-expanded={
                showEntityDropdown
              }
              aria-haspopup={"listbox"}
              aria-label="Select entity"
              disabled={(isEntityLoading) || !isOnline}
            >
              {displayEntityName}

              {isEntityLoading && (
                <i className="ri-loader-4-line ri-spin text-lg" />
              )}

              {(!isEntityLoading) && (
                <i
                  className={`
                    ri-arrow-down-s-line text-lg transition-transform duration-200
                    ${showEntityDropdown ? "rotate-180" : ""}
                  `}
                />
              )}
            </button>

            {/* Dropdown for merchants only */}
            {showEntityDropdown && (
              <div
                className="absolute top-full left-0 mt-2 bg-card min-w-[200px] rounded-sm py-1 z-[1010] border border-border"
                role="listbox"
              >
                {/* 1. Add Entity Button (Now at the Top) */}
                <div className="px-1 py-1 w-full">
                  <Button
                    size="sm"
                    fullWidth
                    onClick={handleAddEntity}
                    disabled={!isOnline}
                  >
                    {!isOnline ? "Offline - Cannot Add" : "Add Entity"}
                  </Button>
                </div>

                {/* 2. Separator */}
                <div className="h-px border-border border-b my-1"></div>

                {/* 3. List of Entities */}
                {isEntityLoading ? (
                  <div className="flex items-center px-4 py-2.5 text-sm text-text-light">
                    <i className="ri-loader-4-line ri-spin mr-2"></i>{" "}
                    Fetching...
                  </div>
                ) : storeEntities && storeEntities.length > 0 ? (
                  storeEntities.map((ent) => (
                    <button
                      key={ent.id}
                      onClick={() => handleEntitySelect(ent)}
                      className={`
                        flex items-center w-full px-4 py-2 text-sm text-text-light 
                        transition-colors duration-150 hover:bg-primary-5 hover:text-primary text-left
                        ${
                          entity && entity.id === ent.id
                            ? "bg-primary-5 font-semibold text-primary"
                            : ""
                        }
                      `}
                      role="option"
                      aria-selected={!!(entity && entity.id === ent.id)}
                    >
                      {ent.name}
                      {entity && entity.id === ent.id && (
                        <i className="ri-check-line ml-auto"></i>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2.5 text-sm text-text-light">
                    {!isOnline
                      ? "Offline - No entities loaded"
                      : "No entities available."}
                  </div>
                )}

                {/* 4. Separator and Refresh Button (At the Bottom) */}
                <div className="h-px border-border border-b my-1"></div>
                <button
                  onClick={handleRefreshEntities}
                  disabled={isEntityLoading || !isOnline}
                  className="
                flex items-center w-full px-4 py-1 text-sm text-text-light 
                transition-colors duration-150 hover:bg-info-5 hover:text-info text-left
                disabled:opacity-50 disabled:cursor-not-allowed
              "
                >
                  <i
                    className={`ri-refresh-line text-lg mr-3 ${
                      isEntityLoading ? "ri-spin" : ""
                    }`}
                  ></i>
                  {!isOnline ? "Offline - Cannot Refresh" : "Refresh Entities"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* User Menu (Always Last) */}
        <div className="flex items-center gap-3">
          {user && layoutMode === LayoutMode.HORIZONTAL && (
            <div
              ref={userMenuRef}
              className="
                relative flex items-center gap-3 cursor-pointer p-1.5 pl-3 rounded-sm 
                transition-all duration-200 hover:bg-primary-50  
                user-dropdown
              "
              onClick={toggleUserMenu}
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-text">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-xs text-text-light capitalize">
                  {user.role?.toLowerCase()}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                <i className="ri-user-line text-primary text-sm"></i>
              </div>
              <i
                className={`
                  ri-arrow-down-s-line text-text-light text-lg transition-transform duration-200
                  ${showUserMenu ? "rotate-180" : ""}
                `}
              />
              {showUserMenu && (
                <div className="absolute top-full right-0 bg-card min-w-[200px] rounded-sm shadow-lg py-2 mt-2 z-[1000] border border-border">
                  <button
                    className="
                      flex items-center px-4 py-2.5 text-text-light no-underline 
                      transition-colors duration-200 gap-3 hover:bg-primary-5 hover:text-primary w-full text-left
                    "
                    onClick={(e) => handleUserMenuAction("profile", e)}
                  >
                    <i className="ri-user-line text-lg"></i> Profile
                  </button>
                  <button
                    className="
                      flex items-center px-4 py-2.5 text-text-light no-underline 
                      transition-colors duration-200 gap-3 hover:bg-primary-5 hover:text-primary w-full text-left
                    "
                    onClick={(e) => handleUserMenuAction("settings", e)}
                  >
                    <i className="ri-settings-3-line text-lg"></i> Settings
                  </button>
                  <div className="h-px border-border border-b my-2"></div>
                  <button
                    className="
                      flex items-center px-4 py-2.5 text-text-light no-underline 
                      transition-colors duration-200 gap-3 hover:text-danger w-full text-left hover:bg-danger-5
                    "
                    onClick={(e) => handleUserMenuAction("logout", e)}
                  >
                    <i className="ri-logout-circle-line text-lg"></i> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
