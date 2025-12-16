import { Roles } from "../enums/roles";

export type UserRole = Roles.ADMIN | Roles.SALES | Roles.STAFF | Roles.OWNER | Roles.SUPER_ADMIN;
export type UserGender = "male" | "female" | "other";

export interface IUser {
  auth_token?: string;
  id: string;
  email: string;
  password?: string;
  username?: string;
  role: UserRole;
  gender: UserGender;
  dob?: Date;
  emergency_contact_number?: string;
  emergency_contact_name?: string;
  relation_with_emergency_contact_number?: string;
  phone_number?: string;
  verified: boolean;
  image_url?: string;
  image_alt?: string;
  name: string;
  first_name: string;
  last_name: string;
  deactivated: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface LoginFormState {
  email: string;
  password: string;
}
