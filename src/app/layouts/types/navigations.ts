import { Roles } from "../../../core/enums/roles";

export interface NavItem {
  id?: string;
  title: string;
  icon?: string;
  link?: string;
  badge?: string;
  roles?: string[];
  children?: NavItem[];
  isOpen?: boolean;
}

export const NAVBAR_CONFIG: NavItem[] = [
  {
    id: "store",
    title: "Store",
    icon: "store-line",
    link: "/store",
    roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.SALES, Roles.OWNER],
  },
  {
    id: "orders",
    title: "Orders",
    icon: "shopping-bag-line",
    link: "/orders",
    roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.SALES, Roles.OWNER],
  },
  {
    id: "suppliers",
    title: "Suppliers",
    icon: "user-settings-line",
    link: "/suppliers",
    roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.SALES, Roles.OWNER],
  },
  {
    id: "reports",
    title: "Reports",
    icon: "dashboard-line",
    link: "/reports",
    roles: [Roles.SUPER_ADMIN, Roles.ADMIN, Roles.SALES, Roles.OWNER],
  },
  {
    id: "products",
    title: "Products",
    icon: "shopping-bag-line",
    link: "/products",
    roles: [Roles.SUPER_ADMIN, Roles.OWNER],
  }, 
  {
    id: "payouts",
    title: "Payouts",
    icon: "money-dollar-circle-line",
    link: "/payouts",
    roles: [Roles.SUPER_ADMIN,  Roles.OWNER, Roles.ADMIN],
  },
  {
    id: "system-users",
    title: "System Users",
    icon: "user-settings-line",
    link: "/system-users",
    roles: [Roles.SUPER_ADMIN, Roles.OWNER],
  },
  {
    id: "company-profile",
    title: "Company Profile",
    icon: "building-line",
    link: "/settings/company-info",
    roles: [Roles.SUPER_ADMIN, Roles.OWNER],
  },
  {
    id: "settings",
    title: "Settings",
    icon: "moon-line",
    link: "/settings/preference",
    roles: [Roles.SUPER_ADMIN,  Roles.OWNER, Roles.ADMIN],
  },
];

export const fetchNavConfigFromServer = (): Promise<NavItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(NAVBAR_CONFIG);
    }, 500);
  });
};
