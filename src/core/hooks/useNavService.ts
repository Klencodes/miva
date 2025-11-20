import { useState, useEffect, useCallback, useMemo } from 'react';
import { NAVBAR_CONFIG, NavItem, fetchNavConfigFromServer } from '../../app/layouts/types/navigations';
import { Roles } from '../enums/roles';

export const useNavService = () => {
  const [navConfig, setNavConfig] = useState<NavItem[]>(NAVBAR_CONFIG); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadNavigationConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNavigationConfig = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await fetchNavConfigFromServer();
      setNavConfig(config);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasRoleAccess = useCallback((item: NavItem, userRoles: Roles[]): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => userRoles.includes(role as Roles));
  }, []);

  const filterNavItems = useCallback((items: NavItem[], userRoles: Roles[]): NavItem[] => {
    return items
      .filter(item => hasRoleAccess(item, userRoles))
      .map(item => ({
        ...item, 
        children: item.children 
          ? filterNavItems(item.children, userRoles)
          : undefined
      }))
      .filter(item => !item.children || item.children.length > 0);
  }, [hasRoleAccess]);

  const getFilteredNavItems = useCallback((userRoles: Roles[]): NavItem[] => {
    return filterNavItems(navConfig, userRoles);
  }, [navConfig, filterNavItems]);

  // Memoized version for better performance in components
  const useFilteredNavItems = (userRoles: Roles[]) => {
    return useMemo(() => {
      return getFilteredNavItems(userRoles);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getFilteredNavItems, userRoles]);
  };

  const updateRolesArray = useCallback((currentRoles: string[], role: string, operation: 'add' | 'remove'): string[] => {
    const roleExists = currentRoles.includes(role);
    
    if (operation === 'add' && !roleExists) {
      return [...currentRoles, role];
    }
    
    if (operation === 'remove' && roleExists) {
      return currentRoles.filter(r => r !== role);
    }
    
    return currentRoles;
  }, []);

  const updateRolesRecursive = useCallback(( items: NavItem[], ids: string[], role: string, operation: 'add' | 'remove' ): NavItem[] => {
    return items.map(item => {
      const shouldUpdate = ids.includes(item.id || '');
      const updatedChildren = item.children 
        ? updateRolesRecursive(item.children, ids, role, operation)
        : undefined;
      
      if (!shouldUpdate && !updatedChildren) {
        return item;
      }
      
      const updatedItem: NavItem = {
        ...item,
        children: updatedChildren
      };

      if (shouldUpdate) {
        updatedItem.roles = updateRolesArray(item.roles || [], role, operation);
      }
      return updatedItem;
    });
  }, [updateRolesArray]);

  const addRoleToNavItems = useCallback((ids: string[], role: string): void => {
    const updatedConfig = updateRolesRecursive(navConfig, ids, role, 'add');
    setNavConfig(updatedConfig);
  }, [navConfig, updateRolesRecursive]);

  const removeRoleFromNavItems = useCallback((ids: string[], role: string): void => {
    const updatedConfig = updateRolesRecursive(navConfig, ids, role, 'remove');
    setNavConfig(updatedConfig);
  }, [navConfig, updateRolesRecursive]);

  const findItemRecursive = useCallback((items: NavItem[], id: string): NavItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemRecursive(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  const findNavItemById = useCallback((id: string): NavItem | undefined => {
    return findItemRecursive(navConfig, id);
  }, [navConfig, findItemRecursive]);

  const retryLoadConfig = useCallback(async (): Promise<void> => {
    await loadNavigationConfig();
  }, [loadNavigationConfig]);

  return {
    navConfig,
    isLoading,
    error,
    getFilteredNavItems,
    useFilteredNavItems, 
    addRoleToNavItems,
    removeRoleFromNavItems,
    findNavItemById,
    loadNavigationConfig,
    retryLoadConfig,
  };
};