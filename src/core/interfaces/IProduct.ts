export interface IProduct {
  id: string;
  short_name: string;
  name: string;
  category_name: string;
  stock: number;
  stock_in_pieces: number;
  price_per_unit: number; // Price per selling unit (box, sack, etc.)
  price_per_piece: number; // Price per individual piece
  allow_pieces_sell: boolean;
  is_available: boolean;
  image_url: string;
  image_alt: string;
  content_measurement: string; // e.g., "400g", "5kg"
  content_unit: string; // e.g., "can", "bag"
  selling_unit_quantity: number; // e.g., 24 pieces in a box
  selling_unit: string; // e.g., "box", "sack"
  entity_id: string; // Added this field (based on your backend schema)
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
}

// Extended CartItem with additional properties needed for cart calculations
export interface CartItem extends Omit<IProduct, 'price_per_piece'> {
  quantity: number;
  quantity_type?: string;
  expanded?: boolean;
  isPieces?: boolean; // true = pieces, false = selling units
  price_per_piece: number; // Price per individual piece (required in cart)
  price_per_unit: number; // Price per selling unit (required in cart)
}

export interface ProductForm {
  name: string;
  short_name?: string; // Added this optional field
  category_name: string;
  stock: string;
  price_per_unit: string; // Price per selling unit
  price_per_piece: string; // Price per piece
  allow_pieces_sell: boolean;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: string;
  selling_unit: string;
  image_url: string;
  image_alt?: string; // Added this optional field
  entity_id?: string; // Added this optional field
}

export interface IBulkAddProduct {
  name: string;
  short_name?: string; // Added this optional field
  category_name: string;
  stock: string;
  price_per_unit: string;
  price_per_piece: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: string;
  selling_unit: string;
  image_url?: string;
  image_alt?: string; // Added this optional field
  entity_id?: string; // Added this optional field
}

// You might also want to add this helper type for product creation/update
export interface ProductCreateDto {
  name: string;
  short_name?: string;
  category_name: string;
  stock: number;
  price_per_unit: number;
  price_per_piece: number;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: number;
  selling_unit: string;
  image_url?: string;
  image_alt?: string;
  entity_id: string;
}

// For API responses
export interface IProductResponse extends IProduct {
  created_at: string;
  updated_at: string;
  // Add any other fields from your API response
}

export interface ICloudinaryImageUploadResponse {
  public_id: string;  
  secure_url: string;      
  original_filename?: string;
}