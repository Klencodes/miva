import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ENTITY_KEY,
  getStoredItem,
  USER_KEY,
  useStore,
} from "../../../../core/hooks/useStore";
import { LayoutMode } from "../../types/layout";
import { useLayout } from "../../../../core/hooks/useLayout";
import { appService } from "../../../../core/services/app";
import { IEntityItem } from "../../../../core/interfaces/IEntity";
import { useModal } from "../../../../core/hooks/useModal";
import { Roles, SUPER_ADMIN_ENTITY_ID } from "../../../../core/enums/roles";
import { eventService } from "../../../../core/services/events";
import { Button } from "../../../../ui";
import AddEntityModal from "./AddEntityModal";
import useNetworkStatus from "../../../../core/hooks/useNetworkStatus";

interface HeaderProps {
  isVerticalLayout: boolean;
  onToggleSidebar: () => void;
  onUserMenuAction?: (action: "logout" | "profile" | "settings") => void;
  onLogoClick?: () => void;
  currentSidebarState?: "standard" | "condensed" | "hidden";
}

// Memoize the header to prevent unnecessary re-renders
const Header: React.FC<HeaderProps> = memo(({
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
  
  // Only select the specific store values we need
  const { user, entity, setEntity, storeEntities, setStoreEntities } = useStore();
  const { layoutMode } = useLayout();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const entityDropdownRef = useRef<HTMLDivElement>(null);
  const isOnline = useNetworkStatus();

  const hasFetchedEntities = useRef(false);
  
  // Get locally stored entity for immediate display when offline/before fetch
  const storedEntity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

  // Memoize user data to prevent unnecessary re-renders
  const userData = useMemo(() => user || getStoredItem(USER_KEY, null), [user]);

  // Memoize entity display logic
  const displayEntityName = useMemo(() => {
    return isOnline
      ? isEntityLoading
        ? "Loading Entities..."
        : entity
        ? `${entity.name} ${entity?.name === "All Entities" ? "" : " | " + entity.branch}`
        : "Select Entity"
      : storedEntity
      ? storedEntity.name
      : "Offline - No Entity Loaded";
  }, [isOnline, isEntityLoading, entity, storedEntity]);

  // Memoize entity display logic
  const shouldShowEntityDropdown = useMemo(() => {
    return storeEntities !== null || isEntityLoading || storedEntity;
  }, [storeEntities, isEntityLoading, storedEntity]);

  // Memoize user role check
  const isSuperAdmin = useMemo(() => {
    return userData?.role === Roles.SUPER_ADMIN;
  }, [userData?.role]);

  // --- Entity Fetching/State Management Logic ---
const fetchEntities = useCallback(
    async (isManualRefetch = false) => {
      if (!isOnline) {
        setIsEntityLoading(false);
        if (storedEntity && !storeEntities) {
            setStoreEntities([storedEntity]); 
        }
        return;
      }

      if (!isManualRefetch && (hasFetchedEntities.current || isEntityLoading)) {
        return;
      }

      setIsEntityLoading(true);

      if (!isManualRefetch) {
        hasFetchedEntities.current = true;
      }

      if (isManualRefetch) {
        setStoreEntities(null);
      }

      try {
        const res = await appService.getEntities();

        if (res && res.results) {
          if (res.results.length > 0) {
            let entitiesToSet = res.results;

            if (isSuperAdmin) {
              entitiesToSet = res.results.map((ent: IEntityItem) => ({
                ...ent,
                id: ent.name === "All Entities"
                    ? SUPER_ADMIN_ENTITY_ID
                    : ent.id,
              }));
            }
            setStoreEntities(entitiesToSet);

            if (!entity) {
              setEntity(storedEntity || entitiesToSet[0]);
            }
          }
        } 
      } catch (error) {

        if (isManualRefetch) {
            hasFetchedEntities.current = false;
            // console.warn("Manual refetch failed. Will retry on next render.");
            // setStoreEntities([]);
        } else {
             console.warn("Automatic fetch failed (Server Unreachable). Loop stopped.");
        }

      } finally {
        setIsEntityLoading(false);
      }
    },
    // eslint-disable-next-line 
    [isOnline, isSuperAdmin, entity, setEntity, setStoreEntities, storedEntity, isEntityLoading]
  );

  
  // Fetch entities only once on mount and when coming back online
  useEffect(() => {
    // 1. Set/restore the current entity immediately from local storage on mount
    if (!entity && storedEntity) {
        setEntity(storedEntity);
    }

    // 2. Fetch entities only if online and we haven't fetched yet
    if (isOnline && !hasFetchedEntities.current) {
      fetchEntities();
    }
  }, [fetchEntities, isOnline, entity, storedEntity, setEntity]);

  // Handlers for refresh
  const handleRefreshEntities = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isOnline) {
      console.warn("No internet connection - cannot refresh entities");
      return;
    }

    fetchEntities(true);
  }, [fetchEntities, isOnline]);

  // Handle entity selection
  const handleEntitySelect = useCallback(async (selectedEntity: IEntityItem) => {
    setEntity(selectedEntity);
    setShowEntityDropdown(false);
    eventService.triggerRefresh();
  }, [setEntity]);

  // --- UI/Event Handlers ---
// Change the initial state to false

useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  
  const handleFullscreenError = (e: Event) => {
    console.error('Fullscreen error:', e);
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
  document.addEventListener("fullscreenerror", handleFullscreenError);
  document.addEventListener("mousedown", handleClickOutside);
  
  // Auto-enter fullscreen when component mounts
  const enterFullscreenOnMount = () => {
    // Only enter fullscreen if not already in fullscreen
    if (!document.fullscreenElement) {
      // Small delay to ensure component is fully rendered
      setTimeout(() => {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Auto fullscreen failed: ${err.message}`);
          setIsFullscreen(false);
        });
      }, 300); // 300ms delay
    } else {
      setIsFullscreen(true);
    }
  };
  
  // Only auto-enter fullscreen if user hasn't interacted with it before
  // You might want to store a preference in localStorage
  const shouldAutoFullscreen = !localStorage.getItem('fullscreenDisabled');
  
  if (shouldAutoFullscreen) {
    enterFullscreenOnMount();
  } else {
    setIsFullscreen(!!document.fullscreenElement);
  }
  
  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener("fullscreenerror", handleFullscreenError);
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const toggleFullScreen = useCallback(() => {
  if (!document.fullscreenElement) {
    // Not in fullscreen, so request it
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
    // User manually enabled fullscreen, don't auto-enter next time
    localStorage.removeItem('fullscreenDisabled');
  } else {
    // Already in fullscreen, so exit it
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
      // User manually exited, remember this preference
      localStorage.setItem('fullscreenDisabled', 'true');
    }
  }
}, []);

  const toggleUserMenu = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowUserMenu(prev => !prev);
    setShowEntityDropdown(false);
  }, []);

  const handleAddEntity = useCallback(async () => {
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

      if (result?.success === "success") {
        // After successful addition, refresh entities
        handleRefreshEntities();
      }
    } catch (error) {
      console.error("Error in handleAddEntity:", error);
    }
  }, [isOnline, openModal, handleRefreshEntities]);

  const handleEntityButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEntityDropdown(prev => !prev);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    onToggleSidebar();
  }, [onToggleSidebar]);

  const handleLogoClickInternal = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (onLogoClick) {
      onLogoClick();
    } else {
      navigate("/store");
    }
  }, [onLogoClick, navigate]);

  const handleUserMenuAction = useCallback((
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
  }, [onUserMenuAction, navigate]);

  const isCondensed = currentSidebarState === "condensed";

  // Memoize logo classes
  const logoClasses = useMemo(() => `
    flex items-center transition-all duration-300 cursor-pointer
    ${isCondensed ? "w-[30px]" : "w-[230px]"}
  `, [isCondensed]);

  const iconLogoClass = useMemo(() => `
    h-8 w-8
    ${isCondensed ? "block" : "hidden"}
  `, [isCondensed]);

  const fullLogoClass = useMemo(() => `
    h-[45px] ml-3 transition-opacity duration-200
    ${isCondensed ? "opacity-0 w-0 ml-0 hidden" : "opacity-100 block"}
  `, [isCondensed]);

  return (
    <div className="flex items-center justify-between h-16 px-6 bg-card z-[1000] relative border-b border-border isolate-parts">
      {/* --- LEFT SIDE (Logo/Sidebar Toggle) --- */}
      <div className="flex items-center gap-4">
        <Link
          to="/store"
          className={logoClasses}
          aria-label="Home"
          onClick={handleLogoClickInternal}
        >
          <img
            src="/icons/logo-icon.png"
            className={iconLogoClass}
            alt="App Icon"
          />
          <img
            src="/icons/logo-full.png"
            className={fullLogoClass}
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
        {shouldShowEntityDropdown && ( 
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
              aria-expanded={showEntityDropdown}
              aria-haspopup="listbox"
              aria-label="Select entity"
              disabled={isEntityLoading || (!isOnline && !entity)} 
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
                {isSuperAdmin && (
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
                )}

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
                      {ent.name} {ent?.name === "All Entities" ? "" : " | " + ent.branch}
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
});

Header.displayName = "Header";

export default Header;