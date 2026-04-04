// EditOrderModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Button, Input } from "../../../ui";
import { SelectOption } from "../../../ui/components/Input";
import { useModal } from "../../../core/hooks/useModal";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";
import { appService } from "../../../core/services/app";
import { toast } from "sonner";
import { IOrder, IOrderItem } from "../../../core/interfaces/IOrder";
import { IProduct } from "../../../core/interfaces/IProduct";
import { useOrderCalculations } from "../../../core/hooks/useOrderCalculations";
import { resolvePiecesPerUnit, resolveUnitPrice } from "../store/CustomQuantityModal";

interface EditOrderModalProps {
  order: IOrder;
  title: string;
  subtitle: string;
  onOrderUpdated?: () => void;
}

interface EditableItem extends IOrderItem {
  isEditing?: boolean;
  originalQuantity?: number;
  originalQuantityType?: string;
  subtotal?: number;
  order_id?: string | undefined;
  content_unit_type?: string | undefined;
}

// ─── Mirror of CustomQuantityModal's isFullPack check ────────────────────────
// "units" OR the product's selling_unit → full pack; anything else → piece mode
const isFullPackType = (
  quantityType: string,
  item: Pick<EditableItem, "selling_unit">
): boolean => {
  if (!quantityType) return false;
  return (
    quantityType === "units" ||
    quantityType.toLowerCase() === (item.selling_unit || "").toLowerCase()
  );
};

export const EditOrderModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const { order, title, subtitle, onOrderUpdated } = modalData as EditOrderModalProps;

  const [editableOrder, setEditableOrder] = useState<IOrder>(order);
  const [editableItems, setEditableItems] = useState<EditableItem[]>(order.items);
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [formErrors, setFormErrors] = useState<{ discount?: string; tenderedCash?: string }>({});

  // Map editable items to the shape useOrderCalculations expects.
  // unit_price on each item is already resolved, so we hand it straight through
  // as price_per_unit so the hook doesn't need to re-derive it.
  const cartItemsForCalculations = useMemo(
    () =>
      editableItems.map((item) => ({
        id: item.product_id,
        quantity: item.quantity,
        quantity_type: item.quantity_type,
        isPieces: !isFullPackType(item.quantity_type, item),
        price_per_piece: item.price_per_piece,
        price_per_unit: item.unit_price, // already resolved — use as source of truth
        selling_unit_quantity: item.selling_unit_quantity,
        selling_unit: item.selling_unit,
        content_unit_type: item.content_unit_type,
        content_measurement: item.content_measurement,
        content_unit: item.content_unit,
        name: item.product_name,
        short_name: item.short_name,
        category_name: item.category_name,
        image_url: item.image_url,
        image_alt: item.image_alt,
      })),
    [editableItems]
  );

  const {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel,
  } = useOrderCalculations(cartItemsForCalculations as any, {
    discount: editableOrder.discount?.toString() || "0",
    tenderedCash: editableOrder.tendered_cash?.toString() || "0",
    paymentMethod: editableOrder.payment?.payment_method || "Cash",
    transactionId: editableOrder.payment?.transaction_id || "",
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await appService.getAllProducts({ page: 1, getAll: true });
      if (response.success && response.results) setAvailableProducts(response.results);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(n)) return "GHS 0.00";
    return `GHS ${n.toFixed(2)}`;
  };

  // Subtotal for one row — unit_price is always the per-unit price for the
  // current quantity_type, so simple multiplication is correct here.
  const calculateItemSubtotal = (item: EditableItem) =>
    item.unit_price * item.quantity;

  const getProductStockInPieces = (p: IProduct) =>
    p.stock_in_pieces ?? (p.stock || 0) * (p.selling_unit_quantity || 1);

  const getProductStockLevel = (p: IProduct) =>
    p.stock !== undefined && p.stock !== null
      ? p.stock
      : Math.floor(getProductStockInPieces(p) / (p.selling_unit_quantity || 1));

  // ─── Item update — mirrors CustomQuantityModal price + conversion logic ─────
  const handleItemUpdate = (
    itemId: string,
    field: keyof EditableItem,
    value: any
  ) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== itemId) return item;

        const updated = { ...item, [field]: value };

        if (field === "quantity_type") {
          const newQtyType = value as string;
          const sellingQty = item.selling_unit_quantity || 1;

          // Use the same helper as CustomQuantityModal so the logic stays in sync
          const productShape = {
            selling_unit_quantity: sellingQty,
            selling_unit: item.selling_unit,
            price_per_unit: item.price_per_piece * sellingQty, // full-pack price
            price_per_piece: item.price_per_piece,
          };

          // Resolve the new unit price exactly as CustomQuantityModal does
          updated.unit_price = resolveUnitPrice(newQtyType, productShape);

          // Convert quantity so that the number of pieces being sold stays the same.
          // switching TO pieces → multiply current (pack) qty by pieces-per-pack
          // switching TO packs → divide current (piece) qty by pieces-per-pack
          const wasFullPack = isFullPackType(item.quantity_type, item);
          const nowFullPack = isFullPackType(newQtyType, item);

          if (wasFullPack && !nowFullPack) {
            // packs → pieces
            updated.quantity = item.quantity * sellingQty;
          } else if (!wasFullPack && nowFullPack) {
            // pieces → packs (floor so we never sell more than available)
            updated.quantity = Math.max(1, Math.floor(item.quantity / sellingQty));
          }
          // same-to-same (e.g. two different piece labels): leave quantity as-is

          updated.quantity_type = newQtyType;
        }

        if (field === "quantity") {
          updated.quantity = Math.max(0, parseFloat(value) || 0);
        }

        return updated;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditableItems((prev) => prev.filter((i) => i.product_id !== itemId));
    toast.success("Item removed");
  };

  const handleAddProduct = (product: IProduct) => {
    const stockLevel = getProductStockLevel(product);
    if (!product.is_available || stockLevel === 0) {
      toast.error("Product is out of stock");
      return;
    }
    if (editableItems.find((i) => i.product_id === product.id)) {
      toast.error("Product already in order.");
      return;
    }

    // Default to piece mode when available, same as CustomQuantityModal's init
    const sellingQty = product.selling_unit_quantity || 1;
    const defaultQtyType =
      product.allow_pieces_sell && sellingQty > 1
        ? product.content_unit_type || "piece"
        : "units";

    const pricePerPiece =
      product.price_per_piece && product.price_per_piece > 0
        ? product.price_per_piece
        : product.price_per_unit / sellingQty;

    const newItem: EditableItem = {
      order_id: editableOrder.id || undefined,
      product_id: product.id,
      quantity: 1,
      quantity_type: defaultQtyType,
      // resolveUnitPrice mirrors exactly what CustomQuantityModal uses on submit
      unit_price: resolveUnitPrice(defaultQtyType, product),
      price_per_piece: pricePerPiece,
      product_name: product.name,
      short_name: product.short_name || product.name,
      category_name: product.category_name || "General",
      content_measurement: product.content_measurement || "",
      content_unit: product.content_unit || "",
      content_unit_type: product.content_unit_type || "piece",
      selling_unit_quantity: sellingQty,
      selling_unit: product.selling_unit || "unit",
      image_url: product.image_url || "",
      image_alt: product.image_alt || "",
      subtotal: resolveUnitPrice(defaultQtyType, product),
      isEditing: false,
    };

    setEditableItems((prev) => [...prev, newItem]);
    setShowProductSelector(false);
    setSearchTerm("");
    toast.success(`${product.short_name} added`);
  };

  const handleDiscountChange = (value: string) => {
    setEditableOrder((prev) => ({ ...prev, discount: parseFloat(value) || 0 }));
  };

  const handleTenderedCashChange = (value: string) => {
    setEditableOrder((prev) => ({
      ...prev,
      tendered_cash: parseFloat(value) || 0,
    }));
  };

  const validateDiscount = () => {
    if (discountValue < 0) {
      setFormErrors((p) => ({ ...p, discount: "Discount cannot be negative" }));
      return false;
    }
    if (discountValue > subTotal) {
      setFormErrors((p) => ({
        ...p,
        discount: "Discount cannot exceed subtotal",
      }));
      return false;
    }
    setFormErrors((p) => ({ ...p, discount: undefined }));
    return true;
  };

  const validateTenderedCash = () => {
    if (tenderedCashValue < 0) {
      setFormErrors((p) => ({
        ...p,
        tenderedCash: "Amount cannot be negative",
      }));
      return false;
    }
    setFormErrors((p) => ({ ...p, tenderedCash: undefined }));
    return true;
  };

  const handleSaveOrder = async () => {
    if (editableItems.length === 0) {
      toast.error("Order must have at least one item");
      return;
    }

    if (tenderedCashValue < total) {
      toast.error(`Amount must be at least ${formatCurrency(total)}`);
      return;
    }

    setLoading(true);
    try {
      const response = await appService.updateOrder(editableOrder.id, {
        cashier: editableOrder.cashier,
        customer: editableOrder.customer,
        total: parseFloat(total.toFixed(2)),
        subtotal: parseFloat(subTotal.toFixed(2)),
        discount: discountValue,
        tendered_cash: tenderedCashValue,
        balance: parseFloat(balanceDue.toFixed(2)),
        balance_label: balanceLabel,
        items: editableItems,
        payment: {
          payment_method: editableOrder.payment?.payment_method || "Cash",
          amount_paid: tenderedCashValue,
          transaction_id: editableOrder.payment?.transaction_id || "",
        },
      });

      if (response.success) {
        toast.success("Order updated successfully");
        onOrderUpdated?.();
        modalRef?.close({ action: "updated", order: response.results });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.short_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isBalancePositive = balanceDue >= 0;

  const capitalizeFirst = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // ── UI Components ─────────────────────────────────────────────────────────

  const StatPill = ({
    label,
    value,
    accent = false,
  }: {
    label: string;
    value: string;
    accent?: boolean;
  }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest font-medium text-text-light">
        {label}
      </span>
      <span
        className={`text-sm font-medium font-mono ${
          accent ? "text-primary" : "text-text"
        }`}
      >
        {value}
      </span>
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-medium uppercase tracking-widest text-text-light mb-3">
      {children}
    </p>
  );

  // ── Per-row price breakdown (mirrors CustomQuantityModal's price summary) ──
  const ItemPriceDetail = ({ item }: { item: EditableItem }) => {
    const sellingQty = item.selling_unit_quantity || 1;
    const isPiecesMode = !isFullPackType(item.quantity_type, item);
    const pieceLabel = item.content_unit_type || "piece";
    const packLabel = item.selling_unit || "unit";
    const subtotal = calculateItemSubtotal(item);

    // Equivalent label — same formula as CustomQuantityModal's equivalentStr
    let equivalentLabel = "";
    if (sellingQty > 1) {
      if (isPiecesMode) {
        const packs = item.quantity / sellingQty;
        equivalentLabel = `≈ ${
          packs % 1 === 0 ? packs : packs.toFixed(2)
        } ${packLabel}${packs !== 1 ? "s" : ""}`;
      } else {
        const pieces = item.quantity * sellingQty;
        equivalentLabel = `= ${pieces} ${pieceLabel}${pieces !== 1 ? "s" : ""}`;
      }
    }

    return (
      <div className="text-xs text-text-light space-y-0.5 mt-1">
        <span>
          {formatCurrency(item.unit_price)} /{" "}
          {isPiecesMode ? pieceLabel : packLabel}
          {equivalentLabel ? (
            <span className="ml-1 opacity-70">({equivalentLabel})</span>
          ) : null}
        </span>
        <span className="block font-mono font-medium text-text">
          = {formatCurrency(subtotal)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
            <i className="ri-file-edit-line text-primary text-base" />
          </div>
          <div>
            <h2 className="text-base font-medium text-text leading-tight">
              {title}
            </h2>
            <p className="text-xs text-text-light mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => modalRef?.dismiss()}
          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-background transition-colors text-text-light hover:text-text"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Order hero card */}
        <div className="rounded-xl border border-border bg-background px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium text-text-light mb-1">
                Order
              </p>
              <p className="text-lg font-medium text-text font-mono">
                {editableOrder.code}
              </p>
              <p className="text-xs text-text-light mt-1">
                {dateUtils.formatDate(
                  editableOrder.created_at,
                  DateFormatEnums.DATE_TIME_SHORT
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-medium text-text-light mb-1">
                Total
              </p>
              <p className="text-2xl font-medium text-primary font-mono">
                {formatCurrency(total)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
            <StatPill label="Subtotal" value={formatCurrency(subTotal)} />
            <StatPill
              label="Discount"
              value={`- ${formatCurrency(discountValue)}`}
            />
            <StatPill
              label="Tendered"
              value={formatCurrency(tenderedCashValue)}
              accent
            />
          </div>
        </div>

        {/* Order information */}
        <div>
          <SectionLabel>Order information</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Customer name"
              value={editableOrder.customer}
              onChange={(v) =>
                setEditableOrder((prev) => ({
                  ...prev,
                  customer: v as string,
                }))
              }
            />
            <Input
              label="Cashier"
              value={editableOrder.cashier}
              onChange={(v) =>
                setEditableOrder((prev) => ({ ...prev, cashier: v as string }))
              }
            />
            <Input
              type="number"
              label="Discount (GHS)"
              value={editableOrder.discount?.toString()}
              onChange={(v) => handleDiscountChange(v as string)}
              onBlur={validateDiscount}
              error={formErrors.discount}
            />
            <Input
              type="number"
              label="Tendered cash (GHS)"
              value={editableOrder.tendered_cash?.toString()}
              onChange={(v) => handleTenderedCashChange(v as string)}
              onBlur={validateTenderedCash}
              error={formErrors.tenderedCash}
            />
          </div>
        </div>

        {/* Balance pill */}
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
            isBalancePositive
              ? "bg-success-10 border-success-20"
              : "bg-danger-10 border-danger-20"
          }`}
        >
          <span
            className={`text-sm font-medium ${
              isBalancePositive ? "text-success" : "text-danger"
            }`}
          >
            {balanceLabel}
          </span>
          <span
            className={`text-base font-medium font-mono ${
              isBalancePositive ? "text-success" : "text-danger"
            }`}
          >
            {formatCurrency(Math.abs(balanceDue))}
          </span>
        </div>

        {/* Items section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Order items ({editableItems.length})</SectionLabel>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProductSelector((v) => !v)}
            >
              <i
                className={`${
                  showProductSelector ? "ri-close-line" : "ri-add-line"
                } mr-1`}
              />
              {showProductSelector ? "Close" : "Add product"}
            </Button>
          </div>

          {showProductSelector && (
            <div className="mb-4 rounded-xl border border-border bg-background p-4 space-y-3">
              <Input
                type="text"
                placeholder="Search products…"
                value={searchTerm}
                onChange={setSearchTerm}
                prefixIcon="search"
              />
              <div className="max-h-48 overflow-y-auto">
                {filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-card flex items-center justify-between"
                  >
                    <span>{product.short_name || product.name}</span>
                    <span className="font-mono text-xs">
                      {formatCurrency(product.price_per_unit)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase text-text-light">
                    Product
                  </th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-medium uppercase text-text-light w-24">
                    Qty
                  </th>
                  <th className="px-3 py-2.5 text-center text-[10px] font-medium uppercase text-text-light w-28">
                    Type
                  </th>
                  <th className="px-3 py-2.5 text-right text-[10px] font-medium uppercase text-text-light">
                    Subtotal
                  </th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editableItems.map((item) => (
                  <tr key={`${item.product_id}-${item.quantity_type}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{item.short_name}</p>
                      {/* Inline price breakdown — same info as CustomQuantityModal's price summary */}
                      <ItemPriceDetail item={item} />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(v) =>
                          handleItemUpdate(item.product_id, "quantity", v)
                        }
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        type="select"
                        size="sm"
                        value={item.quantity_type}
                        onChange={(opt) =>
                          handleItemUpdate(
                            item.product_id,
                            "quantity_type",
                            typeof opt === "object" ? opt.value : opt
                          )
                        }
                        selectOptions={[
                          // Piece option — matches CustomQuantityModal's "By piece" tab
                          {
                            value: item.content_unit_type || "piece",
                            label: capitalizeFirst(
                              item.content_unit_type || "piece"
                            ),
                          },
                          // Pack option — matches CustomQuantityModal's "By pack" tab.
                          // Value is the selling_unit name (e.g. "box", "sack") so
                          // isFullPackType() resolves it correctly, same as the modal.
                          {
                            value: item.selling_unit || "unit",
                            label: capitalizeFirst(
                              item.selling_unit || "unit"
                            ),
                          },
                        ]}
                      />
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-mono">
                      {formatCurrency(calculateItemSubtotal(item))}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-text-light hover:text-danger"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-background">
        <Button onClick={() => modalRef?.dismiss()} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleSaveOrder}
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          Save changes ({formatCurrency(total)})
        </Button>
      </div>
    </div>
  );
};