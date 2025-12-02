import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../core/hooks/useStore";
import { useNavService } from "../../core/hooks/useNavService";
import { useLayout } from "../../core/hooks/useLayout";
import Header from "./header/Header";
import Topbar from "./header/TopBar";
import Sidebar from "./components/SideBar";
import Footer from "./components/Footer";
import { SidebarState, LayoutMode } from "./types/layout";
import { NavItem } from "./types/navigations";
import { Roles } from "../../core/enums/roles";

interface CommonLayoutProps {
  children: React.ReactNode;
}

// Utility hook to track mobile state (screen width <= 768px)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

// Tracks if screen width is (768px, 1024px]
const useIsTablet = () => {
  const [isTablet, setIsTablet] = useState(
    window.innerWidth > 768 && window.innerWidth <= 1024
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsTablet(width > 768 && width <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isTablet;
};

// Memoize the layout component to prevent unnecessary re-renders
const CommonLayout: React.FC<CommonLayoutProps> = memo(({ children }) => {
  const { user } = useStore();
  const { getFilteredNavItems } = useNavService();
  const { layoutMode, sidebarState, toggleSidebar, isVerticalLayout } = useLayout();
  const navigate = useNavigate();
  const [filteredNavItems, setFilteredNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Memoize user data to prevent unnecessary re-renders
  const userRoles = useMemo(() => {
    return user?.role ? [user.role as Roles] : [];
  }, [user?.role]);

  // Memoize the isCondensed calculation
  const isCondensed = useMemo(() => {
    return isVerticalLayout() && isTablet;
  }, [isVerticalLayout, isTablet]);

  // Memoize final sidebar state
  const finalSidebarState = useMemo(() => {
    if (isCondensed) {
      return SidebarState.CONDENSED;
    }
    return sidebarState;
  }, [isCondensed, sidebarState]);

  // Memoize the loadNavItems function
  const loadNavItems = useCallback(async () => {
    setLoading(true);
    try {
      if (userRoles.length > 0) {
        const filteredItems = getFilteredNavItems(userRoles);
        setFilteredNavItems([...filteredItems]);
      } else {
        setFilteredNavItems([]);
      }
    } catch (error) {
      setFilteredNavItems([]);
    } finally {
      setLoading(false);
    }
  }, [userRoles, getFilteredNavItems]);

  // Only reload nav items when user roles change
  useEffect(() => {
    loadNavItems();
  }, [loadNavItems]);

  // Memoize all callback functions
  const closeAllSubmenus = useCallback(() => {
    if (isMobile && sidebarState !== SidebarState.HIDDEN) {
      toggleSidebar();
    }
  }, [isMobile, sidebarState, toggleSidebar]);

  const handleNavItemClick = useCallback(
    (item: NavItem) => {
      if (isMobile && sidebarState !== SidebarState.HIDDEN) {
        toggleSidebar();
      }
    },
    [isMobile, sidebarState, toggleSidebar]
  );

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleLogoClick = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const handleUserMenuAction = useCallback(
    (action: string) => {
      switch (action) {
        case "profile":
          navigate("/profile");
          break;
        case "logout":
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  // Memoize derived values
  const showLoading = useMemo(() => loading && filteredNavItems.length === 0, [loading, filteredNavItems.length]);
  const isMobileSidebarOpen = useMemo(() => isMobile && sidebarState !== SidebarState.HIDDEN, [isMobile, sidebarState]);

  // Memoize layout class calculations
  const layoutClasses = useMemo(() => {
    return `flex flex-1 overflow-hidden relative ${layoutMode === LayoutMode.VERTICAL ? "flex-row" : "flex-col"}`;
  }, [layoutMode]);

  const contentClasses = useMemo(() => {
    return `flex-1 overflow-y-auto transition-all duration-300 ease-in-out bg-background
      ${isMobileSidebarOpen ? "pointer-events-none" : ""} 
      ${layoutMode === LayoutMode.VERTICAL ? " lg:p-6 md:p-4" : "p-4"}
      scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent`;
  }, [isMobileSidebarOpen, layoutMode]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header Component - This should not re-render on route changes */}
      <Header
        isVerticalLayout={isVerticalLayout()}
        onToggleSidebar={handleToggleSidebar}
        currentSidebarState={finalSidebarState}
        onUserMenuAction={handleUserMenuAction}
        onLogoClick={handleLogoClick}
      />

      {layoutMode === LayoutMode.HORIZONTAL && !showLoading && filteredNavItems.length > 0 && (
        <Topbar
          navItems={filteredNavItems}
          onNavItemClick={handleNavItemClick}
        />
      )}

      {/* Main Content Area */}
      <div className={layoutClasses}>
        {/* Mobile Overlay */}
        {layoutMode === LayoutMode.VERTICAL && isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleToggleSidebar}
          />
        )}

        {/* Vertical Sidebar Navigation - This should not re-render on route changes */}
        {layoutMode === LayoutMode.VERTICAL && (
          <Sidebar
            isVerticalLayout={isVerticalLayout()}
            isMobile={isMobile}
            isTablet={isTablet}
            currentSidebarState={finalSidebarState}
            navItems={filteredNavItems}
            onNavItemClick={handleNavItemClick}
            loading={loading}
          />
        )}

        {/* Page Content Area - Only this part should update on route changes */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div
            className={contentClasses}
            onClick={closeAllSubmenus}
          >
            {showLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-text-light">Loading navigation...</p>
                </div>
              </div>
            ) : (
              // Main Content - This is what changes on route navigation
              children
            )}
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
});

export default CommonLayout;