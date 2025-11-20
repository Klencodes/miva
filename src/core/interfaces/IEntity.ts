import { IUser } from "./IUser";

export interface IEntityItem {
  id: string | null;
  name: string;
  address: string;
  phone_number: string;
  email: string;
  logo: string;
  created_at: string;
  updated_at: string;
}

export interface IEntity {
  id: string;
  user: IUser;
  entity: IEntityItem;
  role: string;
  has_access: boolean;
}
