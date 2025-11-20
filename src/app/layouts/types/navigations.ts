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
    id: "dashboard",
    title: "Dashboard",
    icon: "dashboard-line",
    link: "/dashboard",
    roles: [Roles.SUPER_ADMIN, Roles.MERCHANT],
  },
  {
    id: "pending-entities",
    title: "Pending Entities",
    icon: "file-list-3-line",
    link: "/pending-entities",
    roles: [Roles.SUPER_ADMIN],
  },
  {
    id: "stations",
    title: "Stations",
    icon: "charging-pile-line",
    link: "/stations",
    roles: [Roles.SUPER_ADMIN, Roles.MERCHANT],
  },
  {
    id: "sessions",
    title: "Sessions",
    icon: "history-line",
    link: "/sessions",
    roles: [Roles.SUPER_ADMIN, Roles.MERCHANT],
  },
  {
    id: "payouts",
    title: "Payouts",
    icon: "money-dollar-circle-line",
    link: "/payouts/list",
    roles: [Roles.SUPER_ADMIN, Roles.MERCHANT],
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: "account-box-line",
    link: "/accounts",
    roles: [Roles.SUPER_ADMIN, Roles.MERCHANT],
  },
  {
    id: "system-users",
    title: "System Users",
    icon: "user-settings-line",
    link: "/system-users",
    roles: [Roles.SUPER_ADMIN],
  },
  {
    id: "company-profile",
    title: "Company Profile",
    icon: "building-line",
    link: "/settings/company-info",
    roles: [Roles.MERCHANT],
  },

  {
    id: "configurations",
    title: "Configurations",
    icon: "settings-4-line",
    roles: [Roles.SUPER_ADMIN],
    children: [
      {
        id: "commission-split",
        title: "Commission Split",
        icon: "divide-line",
        link: "/configurations/commission-split",
        roles: [Roles.SUPER_ADMIN],
      },
      {
        id: "connector-types",
        title: "Connector Types",
        icon: "plug-line",
        link: "/configurations/connector-types",
        roles: [Roles.SUPER_ADMIN],
      },
      {
        id: "amenities",
        title: "Amenities",
        icon: "hotel-bed-line",
        link: "/configurations/amenities",
        roles: [Roles.SUPER_ADMIN],
      },
      // {
      //   id: "in-app-services",
      //   title: "In App Services",
      //   icon: "service-line",
      //   link: "/configurations/in-app-services",
      //   roles: [Roles.SUPER_ADMIN],
      // },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: "moon-line",
    link: "/settings/preference",
  },
];

export const fetchNavConfigFromServer = (): Promise<NavItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(NAVBAR_CONFIG);
    }, 500);
  });
};
