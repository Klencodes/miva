import { IUser } from "../types";

export interface UserPermissions {
  can_edit_inventory: boolean;
  can_delete_inventory: boolean;
  can_create_invoice: boolean;
  can_edit_invoice: boolean;
  can_delete_invoice: boolean;
  can_build_assembly: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
  can_view_activity_logs: boolean;
}

export type UserRole = 'sales' | 'viewer' | 'admin' | 'super_admin' | 'technician';


const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  viewer: {
    can_edit_inventory: false,
    can_delete_inventory: false,
    can_create_invoice: false,
    can_edit_invoice: false,
    can_delete_invoice: false,
    can_build_assembly: false,
    can_manage_users: false,
    can_view_reports: true,
    can_manage_settings: false,
    can_view_activity_logs: false,
  },
  sales: {
    can_edit_inventory: false,
    can_delete_inventory: false,
    can_create_invoice: true,
    can_edit_invoice: true,
    can_delete_invoice: false,
    can_build_assembly: false,
    can_manage_users: false,
    can_view_reports: true,
    can_manage_settings: false,
    can_view_activity_logs: false,
  },
  technician: {
    can_edit_inventory: true,
    can_delete_inventory: false,
    can_create_invoice: false,
    can_edit_invoice: false,
    can_delete_invoice: false,
    can_build_assembly: true,
    can_manage_users: false,
    can_view_reports: true,
    can_manage_settings: false,
    can_view_activity_logs: false,
  },
  admin: {
    can_edit_inventory: true,
    can_delete_inventory: true,
    can_create_invoice: true,
    can_edit_invoice: true,
    can_delete_invoice: true,
    can_build_assembly: true,
    can_manage_users: true,
    can_view_reports: true,
    can_manage_settings: true,
    can_view_activity_logs: true,
  },
  super_admin: {
    can_edit_inventory: true,
    can_delete_inventory: true,
    can_create_invoice: true,
    can_edit_invoice: true,
    can_delete_invoice: true,
    can_build_assembly: true,
    can_manage_users: true,
    can_view_reports: true,
    can_manage_settings: true,
    can_view_activity_logs: true,
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