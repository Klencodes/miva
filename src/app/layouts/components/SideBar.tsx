import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NavItem } from '../types/navigations';
import { useStore } from '../../../core/hooks/useStore';
import { SidebarState } from '../types/layout';
import { Button } from '../../../ui';
import { useNavService } from '../../../core/hooks/useNavService';

interface SidebarProps {
  isVerticalLayout: boolean;
  isMobile?: boolean;
  isTablet?: boolean; 
  isCondensed?: boolean; 
  currentSidebarState: SidebarState;
  navItems: NavItem[];
  onNavItemClick?: (item: NavItem) => void;
  loading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = memo(({ 
  isMobile = false,
  currentSidebarState,
  navItems,
  onNavItemClick
}) => {
  const [hoveredItem, setHoveredItem] = useState<NavItem | null>(null);
  const [isOverlayHovered, setIsOverlayHovered] = useState(false);
  const [localNavItems, setLocalNavItems] = useState<NavItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate(); 
  
  const { user, logout } = useStore(); 
  const { retryLoadConfig } = useNavService();
  const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);
  const isCondensedMode = currentSidebarState === 'condensed';

  const deepCloneNavItems = (items: NavItem[]): NavItem[] => {
    return items.map(item => ({
      ...item,
      children: item.children ? deepCloneNavItems(item.children) : undefined,
      isOpen: false 
    }));
  };
  
  useEffect(() => {
    setLocalNavItems(deepCloneNavItems(navItems));
    // eslint-disable-next-line
  }, [navItems]);

  const setActiveRecursive = (item: NavItem, currentPath: string): NavItem => {
    let isOpen = item.isOpen || false;
    let isActive = false;

    if (item.link && currentPath.startsWith(item.link)) {
      isActive = true; 
    }

    const updatedChildren = item.children?.map(child => 
      setActiveRecursive(child, currentPath)
    ) || [];

    // If any child is active, the parent should be open
    if (isActive || updatedChildren.some(child => child.isOpen || (child as any).isActive)) {
      isOpen = true;
    }

    return {
      ...item,
      isOpen: isOpen, 
      isActive: isActive,
      children: updatedChildren.length ? updatedChildren : undefined
    } as NavItem & { isOpen?: boolean, isActive?: boolean }; 
  };

  const setActiveParents = useCallback((currentPath: string) => {
    if (!localNavItems.length) return;
    
    setLocalNavItems(prevItems => {
      const updatedItems = prevItems.map(item => 
        setActiveRecursive(item, currentPath)
      );
      return updatedItems;
    });
    // eslint-disable-next-line
  }, [localNavItems.length]); 

  useEffect(() => {
    setActiveParents(location.pathname);
    // eslint-disable-next-line
  }, [location.pathname, setActiveParents]); 

  // Cleanup effect for the timeout ref
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (currentSidebarState === 'hidden' && !isMobile) {
    return null; 
  }

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null; 
    }
  };

  const isActive = (item: NavItem): boolean => {
    if (!item.link) return false;
    return location.pathname.startsWith(item.link);
  };

  const closeAllSubmenus = () => {
    setLocalNavItems(prevItems => prevItems.map(item => closeSubmenusRecursive(item)));
  };

  const closeSubmenusRecursive = (item: NavItem): NavItem => {
    const updatedChildren = item.children?.map(child => closeSubmenusRecursive(child));
    return {
      ...item,
      isOpen: false,
      children: updatedChildren
    };
  };

  // FIXED: Enhanced navigation handler
  const handleNavigation = (item: NavItem, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // If it's a mobile device, close sidebar first
    if (isMobile) {
      onNavItemClick?.(item);
    }

    // Navigate to the link if it exists
    if (item.link) {
      navigate(item.link);
    }

    // Close all submenus on mobile after navigation
    if (isMobile) {
      closeAllSubmenus();
    }
  };

  // FIXED: Enhanced submenu toggle with proper navigation
  const toggleSubmenu = (item: NavItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (isCondensedMode) {
      // In condensed mode, navigate directly to the link if it exists
      if (item.link) {
        handleNavigation(item);
      }
      setHoveredItem(null);
      setIsOverlayHovered(false);
      return;
    }

    // If item has children, toggle the submenu
    if (item.children && item.children.length > 0) {
      if (isTopLevelItem(item)) {
        setLocalNavItems(prevItems => prevItems.map(navItem => 
          navItem.id === item.id 
            ? { ...navItem, isOpen: !navItem.isOpen }
            : closeSubmenusRecursive(navItem)
        ));
      } else {
        setLocalNavItems(prevItems => prevItems.map(navItem => 
          toggleSubmenuRecursive(navItem, item)
        ));
      }
    } else if (item.link) {
      // If no children but has link, navigate
      handleNavigation(item);
    }
  };

  const toggleSubmenuRecursive = (currentItem: NavItem, targetItem: NavItem): NavItem => {
    if (currentItem.id === targetItem.id) {
      return { ...currentItem, isOpen: !currentItem.isOpen };
    }

    if (!currentItem.children) return currentItem;

    const updatedChildren = currentItem.children.map(child => 
      toggleSubmenuRecursive(child, targetItem)
    );

    return {
      ...currentItem,
      children: updatedChildren
    };
  };

  const isTopLevelItem = (item: NavItem): boolean => {
    return localNavItems.some(navItem => navItem.id === item.id);
  };

  const onItemHover = (item: NavItem) => {
    if (!isCondensedMode) return;

    clearHoverTimeout();
    setHoveredItem(item);
  };

  const onItemLeave = () => {
    if (!isCondensedMode) return;

    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isOverlayHovered) {
        setHoveredItem(null);
      }
    }, 100);
  };

  const onOverlayEnter = () => {
    setIsOverlayHovered(true);
    clearHoverTimeout();
  };

  const onOverlayLeave = () => {
    setIsOverlayHovered(false);
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 200);
  };

  const onContainerLeave = () => {
    if (!isCondensedMode) return;
    
    clearHoverTimeout();
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isOverlayHovered) {
        setHoveredItem(null);
      }
    }, 150);
  };

  const shouldShowOverlay = (): boolean => {
    return isCondensedMode && 
           hoveredItem !== null && 
           hoveredItem.children !== undefined && 
           hoveredItem.children.length > 0;
  };

  const handleLogout = () => {
    logout();
  };

  // FIXED: Enhanced nav item renderer with proper event handling
  const renderNavItems = (items: NavItem[], level = 0, isTopLevel = true) => {
    if (!items || items.length === 0) return (
      <Button 
        variant='link'
        className='flex items-center'
        onClick={retryLoadConfig}
      >
        Retry
        <i className='ri-refresh-line mr-2 text-base'></i>
      </Button>
    );

    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const active = isActive(item);
      const isItemOpen = (item as NavItem).isOpen || false; 

      return (
        <li
          key={item.id}
          className={`relative group ${hasChildren ? 'has-children' : ''} ${isItemOpen ? 'open' : ''} ${active ? 'active' : ''}`}
          onMouseEnter={() => onItemHover(item)}
          onMouseLeave={onItemLeave}
        >
          {/* FIXED: Use button for items with children, Link for direct navigation */}
          {hasChildren ? (
            <button
              className={`
                flex items-center no-underline transition-all duration-200 
                text-text-light rounded-sm gap-3 relative overflow-hidden w-full
                ${!isCondensedMode ? 'py-3 px-4 my-1' : 'justify-center py-4'}
                ${active ? 'bg-primary text-white font-medium' : 'hover:bg-background'}
              `}
              onClick={(e) => toggleSubmenu(item, e)}
            >
              <div className="relative">
                {item.icon && (
                  <i
                    className={`
                      ri-${item.icon} flex-shrink-0 transition-colors duration-200
                      ${!isCondensedMode ? 'text-xl' : 'text-2xl'}
                      ${active ? 'text-white' : 'text-text-light'}
                    `}
                  />
                )}
                {active && isCondensedMode && (
                  <span className="absolute -right-1 -top-2 h-3 w-3 rounded-full animate-pulse" />
                )}
              </div>
              <span
                className={`
                  whitespace-nowrap overflow-hidden text-ellipsis 
                  transition-colors duration-200 text-sm font-medium
                  ${isCondensedMode ? 'hidden' : ''}
                  ${active ? 'text-white' : 'text-text'}
                `}
              >
                {item.title}
              </span>
              {hasChildren && !isCondensedMode && (
                <i
                  className={`
                    ml-auto transition-transform duration-300
                    ${level === 0 ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}
                    ${isItemOpen ? 'rotate-0' : '-rotate-90'}
                    ${active ? 'text-white' : 'text-text-light'}
                  `}
                />
              )}
            </button>
          ) : (
            <Link
              to={item.link || '#'}
              className={`
                flex items-center no-underline transition-all duration-200 
                text-text-light rounded-sm gap-3 relative overflow-hidden
                ${!isCondensedMode ? 'py-3 px-4 my-1' : 'justify-center py-4'}
                ${active ? 'bg-primary text-white font-medium' : 'hover:bg-background'}
              `}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item);
              }}
            >
              <div className="relative">
                {item.icon && (
                  <i
                    className={`
                      ri-${item.icon} flex-shrink-0 transition-colors duration-200
                      ${!isCondensedMode ? 'text-xl' : 'text-2xl'}
                      ${active ? 'text-white' : 'text-text-light'}
                    `}
                  />
                )}
                {active && isCondensedMode && (
                  <span className="absolute -right-1 -top-2 h-3 w-3 rounded-full animate-pulse" />
                )}
              </div>
              <span
                className={`
                  whitespace-nowrap overflow-hidden text-ellipsis 
                  transition-colors duration-200 text-sm font-medium
                  ${isCondensedMode ? 'hidden' : ''}
                  ${active ? 'text-white' : 'text-text'}
                `}
              >
                {item.title}
              </span>
            </Link>
          )}

          {hasChildren && !isCondensedMode && (
            <ul
              className={`
                list-none p-0 ml-8 mt-1 overflow-hidden transition-all duration-300 ease-in-out
                ${isItemOpen ? 'max-h-screen mb-2' : 'max-h-0'}
              `}
            >
              {renderNavItems(item.children!, level + 1, false)}
            </ul>
          )}
        </li>
      );
    });
  };

  // FIXED: Enhanced overlay navigation handler
  const renderOverlayNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const active = isActive(item);
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <li key={item.id}>
          {hasChildren ? (
            <button
              className={`
                flex items-center px-4 py-3 text-text no-underline 
                transition-all duration-200 rounded-sm text-sm font-medium w-full text-left
                hover:bg-background hover:text-primary 
                ${active ? 'bg-primary text-white' : ''}
              `}
              onClick={() => toggleSubmenu(item, { preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent)}
            >
              {item.icon && (
                <i className={`ri-${item.icon} mr-3 text-base`} />
              )}
              <span>{item.title}</span>
              <i className={`ri-arrow-right-s-line ml-auto ${active ? 'text-white' : 'text-text-light'}`} />
            </button>
          ) : (
            <Link
              to={item.link || '#'}
              className={`
                flex items-center px-4 py-3 text-text no-underline 
                transition-all duration-200 rounded-sm text-sm font-medium
                hover:bg-background hover:text-primary 
                ${active ? 'bg-primary text-white' : ''}
              `}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation(item);
                setHoveredItem(null);
              }}
            >
              {item.icon && (
                <i className={`ri-${item.icon} mr-3 text-base`} />
              )}
              <span>{item.title}</span>
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <div
      className={`
        flex flex-col border-r border-border h-full transition-all duration-300 
        overflow-hidden bg-card text-text isolate-parts
        
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl transform' : 'relative'}
        
        ${
          currentSidebarState === 'standard' ? 'w-72' : currentSidebarState === 'condensed' ? 'w-20' : 'w-0'
        }

        ${
          isMobile ? (currentSidebarState !== 'hidden' ? 'translate-x-0' : '-translate-x-full') : '' 
        }
      `}
      style={{ height: 'auto' }}
      onMouseLeave={onContainerLeave}
    >
      {/* User Profile Section */}
      {!isCondensedMode && user && ( 
        <div className="px-6 py-6 border-b border-border flex flex-col items-center flex-shrink-0">
          <div className="relative w-16 h-16 rounded-full bg-primary-60 flex items-center justify-center mb-3 shadow-md">
            <i className="ri-user-line text-2xl text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text whitespace-nowrap">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-text-light text-sm whitespace-nowrap mt-1">
            {user.email}
          </p>
        </div>
      )}

      {/* Navigation Items */}
      <ul className="list-none p-0 my-2 flex-1 overflow-y-auto cursor-pointer scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {renderNavItems(localNavItems)}
      </ul>

      {/* Fixed Overlay for Condensed Mode */}
      <div 
        className={`
          fixed top-0 bottom-0 w-64 bg-card shadow-xl border-l border-border 
          transform transition-all duration-300 z-50
          ${shouldShowOverlay() 
            ? 'opacity-100 visible translate-x-0' 
            : 'opacity-0 invisible -translate-x-2'
          }
        `}
        style={{ left: '5rem', top: '4rem' }}
        onMouseEnter={onOverlayEnter}
        onMouseLeave={onOverlayLeave}
      >
        <div className="p-4 h-full overflow-y-auto">
          {hoveredItem && (
            <div className="mb-4 pb-3 border-b border-border">
              <h3 className="text-lg font-semibold text-text flex items-center">
                {hoveredItem.icon && (
                  <i className={`ri-${hoveredItem.icon} mr-3 text-xl`} />
                )}
                {hoveredItem.title}
              </h3>
            </div>
          )}
          
          {hoveredItem?.children ? (
            <ul className="list-none p-0 m-0 space-y-1">
              {renderOverlayNavItems(hoveredItem.children)}
            </ul>
          ) : hoveredItem && (
            <div className="text-center py-8 text-text-light">
              <i className="ri-information-line text-3xl mb-2 opacity-50" />
              <p className="text-sm">No submenu items</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className="justify-center items-center border-t border-border flex items-center justify-start flex-shrink-0">
        <button
          className={`
            flex items-center gap-2 px-4 py-3.5 rounded-sm text-danger 
            justify-center hover:bg-background transition-colors duration-200 w-full
          `}
          onClick={handleLogout}
        >
          <i 
            className={`
              ri-logout-circle-r-line text-lg
              ${!isCondensedMode ? 'mr-2' : ''} 
            `} 
          />
          {!isCondensedMode && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;