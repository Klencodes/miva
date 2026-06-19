import { IUser } from "../types";

export interface UserPermissions {
  canEditInventory: boolean;
  canDeleteInventory: boolean;
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canDeleteInvoice: boolean;
  canBuildAssembly: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canViewActivityLogs: boolean;
}

export type UserRole = 'sales' | 'viewer' | 'admin' | 'super_admin' | 'technician';


const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  viewer: {
    canEditInventory: false,
    canDeleteInventory: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canBuildAssembly: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
  sales: {
    canEditInventory: false,
    canDeleteInventory: false,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: false,
    canBuildAssembly: false,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
  technician: {
    canEditInventory: true,
    canDeleteInventory: false,
    canCreateInvoice: false,
    canEditInvoice: false,
    canDeleteInvoice: false,
    canBuildAssembly: true,
    canManageUsers: false,
    canViewReports: true,
    canManageSettings: false,
    canViewActivityLogs: false,
  },
  admin: {
    canEditInventory: true,
    canDeleteInventory: true,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canBuildAssembly: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
    canViewActivityLogs: true,
  },
  super_admin: {
    canEditInventory: true,
    canDeleteInventory: true,
    canCreateInvoice: true,
    canEditInvoice: true,
    canDeleteInvoice: true,
    canBuildAssembly: true,
    canManageUsers: true,
    canViewReports: true,
    canManageSettings: true,
    canViewActivityLogs: true,
  },
};

export const DUMMY_USERS: IUser[] = [
  {
    id: 'user-1',
    name: 'Kwame Mensah',
    role: 'super_admin',
    permissions: ROLE_PERMISSIONS.super_admin,
    email: "kwame@gtest.com",
    phone: "2345656575432"
  },
  {
    id: 'user-2',
    name: 'Ama Owusu',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
    email: "",
    phone: "2345656575432"
  },
  {
    id: 'user-3',
    name: 'Kofi Asante',
    role: 'sales',
    permissions: ROLE_PERMISSIONS.sales,
    email: "",
    phone: "2345656575432"
  },
  {
    id: 'user-4',
    name: 'Abena Darko',
    role: 'technician',
    permissions: ROLE_PERMISSIONS.technician,
    email: "",
    phone: "2345656575432"
  },
  {
    id: 'user-5',
    name: 'Yaw Boateng',
    role: 'viewer',
    permissions: ROLE_PERMISSIONS.viewer,
    email: "",
    phone: "2345656575432"
  },
];

export function getPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role];
}