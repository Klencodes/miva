/**
 * Interface for the Payment details within an Order.
 */
export interface IOrderPayment {
    payment_method: string;
    amount_paid: number;
    reference_id: string;
}

/**
 * Interface for a single Item within an Order's item list.
 */
export interface IOrderItem {
    order_id: string; // ID of the parent order
    product_id: string;
    quantity: number;
    unit_price: number;
    product_name: string;
    short_name: string;
    category_name: string;
    content_measurement: string;
    content_unit: string;
    selling_unit_quantity: number;
    selling_unit: string;
    image_url: string;
    image_alt: string;
    id: string;  // Internal application ID for the subdocument
}

/**
 * Interface for a single Sales Order record.
 */
export interface IOrder {
    cashier: string; // The user ID of the cashier who processed the order
    customer: string; // The customer's name
    total: number; // Final amount paid
    subtotal: number; // Total before discount
    discount: number;
    tendered_cash: number; // Amount the customer physically paid (e.g., if paying cash)
    balance: number; // Change given back to the customer
    balance_label: string; // Label for the balance field
    items: IOrderItem[];
    payment: IOrderPayment;
    entity_id: string; // The ID of the store/entity where the order was placed
    id: string; // Unique ID of the order
    created_at: string; // ISO Date string
    updated_at: string; // ISO Date string
    code: string; // Human-readable order code (e.g., G-251122T4W6WI8)
}
