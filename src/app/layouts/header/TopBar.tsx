import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavItem } from '../types/navigations';
import { useNavService } from '../../../core/hooks/useNavService';
import { Roles } from '../../../core/enums/roles';
import { useStore } from '../../../core/hooks/useStore';


interface TopbarProps {
  navItems?: NavItem[];
  onNavItemClick?: (item: NavItem) => void;
}

const Topbar: React.FC<TopbarProps> = ({ 
  navItems: externalNavItems, 
  onNavItemClick 
}) => {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const location = useLocation();
  const {getFilteredNavItems  } = useNavService();
  const { user } = useStore();

  useEffect(() => {
    if (externalNavItems) {
      setNavItems(externalNavItems);
      setLoading(false);
    } else {
      loadNavItems();
    }
    // eslint-disable-next-line
  }, [user, externalNavItems]);

  const loadNavItems = async () => {
    setLoading(true);
    try {
      if (user?.role) {
        const filteredItems = getFilteredNavItems([user.role as Roles]);
        setNavItems([...filteredItems]);
      } else {
        setNavItems([]);
      }
    } catch (error) {
      console.error('Error loading topbar nav items:', error);
      setNavItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (itemId: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActiveLink = (link?: string) => {
    if (!link) return false;
    return location.pathname === link;
  };

  const handleNavClick = (item: NavItem, event: React.MouseEvent) => {
    if (item.children?.length) {
      event.preventDefault();
      toggleDropdown(item.id!);
    } else {
      onNavItemClick?.(item);
    }
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isDropdownOpen = openDropdowns.has(item.id!);
    const isActive = isActiveLink(item.link);

    return (
      <li key={item.id} className="relative group">
        <Link
          to={item.link || '#'}
          className={`
            flex items-center px-5 h-full text-text-light no-underline 
            transition-all duration-200 font-medium gap-2 
            hover:text-primary
            ${isActive ? 'text-primary border-b-2 border-primary' : ''}
            ${level > 0 ? 'text-sm' : ''}
          `}
          onClick={(e) => handleNavClick(item, e)}
        >
          {item.icon && (
            <i className={`ri-${item.icon} text-lg`} />
          )}
          <span>{item.title}</span>
          {hasChildren && (
            <i 
              className={`
                ri-arrow-down-s-line text-base ml-1 transition-transform duration-300
                ${isDropdownOpen ? 'rotate-180' : ''}
                ${level > 0 ? 'ml-auto -rotate-90 group-hover:rotate-0' : 'group-hover:rotate-180'}
              `}
            />
          )}
        </Link>

        {hasChildren && (
          <ul 
            className={`
              absolute top-full left-0 bg-card min-w-[220px] shadow-lg rounded-b-lg 
              border border-t-0 border-border py-2 z-[100]
              transition-all duration-300
              ${level === 0 ? `
                opacity-0 invisible -translate-y-2 
                group-hover:opacity-100 group-hover:visible group-hover:translate-y-0
              ` : `
                top-0 left-full rounded-r-lg rounded-bl-lg
                opacity-0 invisible -translate-x-2
                group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
              `}
            `}
          >
            {item.children!.map((child: any) => renderNavItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (loading && !externalNavItems) {
    return (
      <div className="bg-card h-12 z-[90] shadow-sm border-b border-border">
        <ul className="flex list-none m-0 p-0 h-full relative">
          <li className="relative h-0.5 w-full p-0 m-0 bg-transparent">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent bg-[length:200%_100%] animate-pulse"></div>
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-card h-12 z-[90] shadow-sm border-b border-border">
      <ul className="flex list-none m-0 p-0 h-full relative">
        {navItems.map(item => renderNavItem(item))}
      </ul>
    </div>
  );
};
export default Topbar;