import { DBOrder } from "../interfaces/IDBTypes";
import { IOrder } from "../interfaces/IOrder";

export const convertDBOrderToIOrder = (dbOrder: DBOrder): IOrder => ({
    id: dbOrder.server_id || dbOrder.id?.toString() || `local-${dbOrder.id}`,
    code: dbOrder.code || `LOCAL-${dbOrder.id}`,
    cashier: dbOrder.cashier || "",
    customer: dbOrder.customer || "",
    total: dbOrder.total || 0,
    subtotal: dbOrder.subtotal || dbOrder.total || 0,
    discount: dbOrder.discount || 0,
    tendered_cash: dbOrder.tendered_cash || 0,
    balance: dbOrder.balance || 0,
    balance_label: dbOrder.balance_label || "Change",
    items: dbOrder.items || [],
    payment: dbOrder.payment || { payment_method: "Cash", amount_paid: 0 },
    created_at: dbOrder.created_at || new Date().toISOString(),
  } as IOrder & { status?: string; synced_at?: string; entity_id?: string });