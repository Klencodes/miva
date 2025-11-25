export interface IProduct {
  id: string;
  short_name: string;
  name: string;
  category_name: string;
  stock: number;
  price: number;
  is_available: boolean;
  image_url: string;
  image_alt: string;
  content_measurement: string; // e.g., "400g", "5kg"
  content_unit: string; // e.g., "can", "bag"
  selling_unit_quantity: number; // e.g., 24, 5
  selling_unit: string; // e.g., "box", "sack"
  created_at: string; // e.g., "box", "sack"
  updated_at: string; // e.g., "box", "sack"
}

export interface CartItem extends IProduct {
  quantity: number;
  expanded?: boolean;
}