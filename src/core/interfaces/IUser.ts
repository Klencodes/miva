import {  IEntityItem } from "./IEntity";

export interface IUser {
  auth_token?: string;
  email: string;
  first_name: string;
  gender: string;
  id: string;
  is_active: boolean;
  last_name: string;
  login_attempts: number;
  phone_number: string;
  phone_code?: string;
  profile_picture: null | string;
  signup_date: string;
  username: string;
  verified: boolean;
  referral_code: string;
  role: string,
  
}

export interface LoginFormState {
  email: string;
  password: string;
}

