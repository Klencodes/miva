import { useState, useEffect, useCallback } from 'react';
import { LayoutMode, SidebarState } from '../../app/layouts/types/layout';
import { getStoredItem, setStoredItem } from './useStore';

export const LAYOUT_MODE_KEY = 'layoutMode';
export const SIDEBAR_STATE_KEY = 'sidebarState';

export const useLayout = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.VERTICAL);
  const [sidebarState, setSidebarState] = useState<SidebarState>(SidebarState.STANDARD);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      return mobile;
    };

    // Load saved preferences
    const savedLayout = getStoredItem<LayoutMode>(LAYOUT_MODE_KEY, LayoutMode.VERTICAL);
    const savedSidebar = getStoredItem<SidebarState>(SIDEBAR_STATE_KEY, SidebarState.STANDARD);
    
    if (savedLayout) setLayoutMode(savedLayout);
    if (savedSidebar) {
      // On mobile, always start with hidden sidebar regardless of saved state
      const mobile = checkMobile();
      setSidebarState(mobile ? SidebarState.HIDDEN : savedSidebar);
    }

    const handleResize = () => {
      const mobile = checkMobile();
      
      // Auto-hide sidebar on mobile, restore previous state on desktop
      if (mobile && sidebarState !== SidebarState.HIDDEN) {
        setSidebarState(SidebarState.HIDDEN);
      } else if (!mobile && sidebarState === SidebarState.HIDDEN) {
        // Restore to standard when switching to desktop if it was hidden due to mobile
        const saved = getStoredItem<SidebarState>(SIDEBAR_STATE_KEY, SidebarState.STANDARD);
        setSidebarState(saved || SidebarState.STANDARD);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarState]);

  const setLayoutModeWithSave = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    setStoredItem<LayoutMode>(LAYOUT_MODE_KEY, mode);
  }, []);

  const setSidebarStateWithSave = useCallback((state: SidebarState) => {
    setSidebarState(state);
    // Only save non-mobile states to localStorage
    if (!isMobile) {
      setStoredItem<SidebarState| null>(SIDEBAR_STATE_KEY, state);
    }
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setSidebarState(prev => {
      let newState: SidebarState;
      
      if (isMobile) {
        // Mobile: toggle between hidden and standard
        newState = prev === SidebarState.HIDDEN ? SidebarState.STANDARD : SidebarState.HIDDEN;
      } else {
        // Desktop: cycle through states
        if (prev === SidebarState.STANDARD) {
          newState = SidebarState.CONDENSED;
        } else if (prev === SidebarState.CONDENSED) {
          newState = SidebarState.HIDDEN;
        } else {
          newState = SidebarState.STANDARD;
        }
      }
      
      // Save to localStorage only for desktop states
      if (!isMobile) {
        setStoredItem<SidebarState>(SIDEBAR_STATE_KEY, newState);
      }
      
      return newState;
    });
  }, [isMobile]);

  const isVerticalLayout = useCallback(() => {
    return layoutMode === LayoutMode.VERTICAL;
  }, [layoutMode]);

  const getContentMarginClass = useCallback(() => {
    if (layoutMode === LayoutMode.HORIZONTAL) return '';
    if (sidebarState === SidebarState.CONDENSED) return 'ml-20';
    if (sidebarState === SidebarState.STANDARD) return 'ml-72';
    return 'ml-0';
  }, [layoutMode, sidebarState]);

  // Close sidebar when switching to mobile
  useEffect(() => {
    if (isMobile && sidebarState !== SidebarState.HIDDEN) {
      setSidebarState(SidebarState.HIDDEN);
    }
  }, [isMobile, sidebarState]);

  return {
    layoutMode,
    sidebarState,
    toggleSidebar,
    isVerticalLayout,
    getContentMarginClass,
    setLayoutMode: setLayoutModeWithSave,
    setSidebarState: setSidebarStateWithSave,
    isMobile
  };
};