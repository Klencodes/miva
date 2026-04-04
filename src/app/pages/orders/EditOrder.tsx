import React, { useState, useEffect, useMemo } from "react";
import { Button, Input } from "../../../ui";
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

  // Convert editableItems to CartItem format for useOrderCalculations
  // This will automatically recalculate whenever editableItems changes
  const cartItemsForCalculations = useMemo(() => editableItems.map(item => ({
    id: item.product_id,
    quantity: item.quantity,
    quantity_type: item.quantity_type,
    isPieces: item.quantity_type === 'pieces',
    price_per_piece: item.price_per_piece,
    price_per_unit: item.unit_price,
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
  })), [editableItems]);

  // Use the order calculations hook - totals will update automatically
  const {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel,
    getPricePerPiece,
  } = useOrderCalculations(cartItemsForCalculations as any, {
    discount: editableOrder.discount?.toString() || "0",
    tenderedCash: editableOrder.tendered_cash?.toString() || "0",
    paymentMethod: editableOrder.payment?.payment_method || "Cash",
    transactionId: editableOrder.payment?.transaction_id || "",
  });

  // Load available products for adding new items
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await appService.getAllProducts({ page: 1, getAll: true });
      if (response.success && response.results) {
        setAvailableProducts(response.results);
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string = "GHS") => {
    if (amount === undefined || amount === null) return "GHS 0.00";
    let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "GHS 0.00";
    return `GHS ${numAmount.toFixed(2)}`;
  };

  const calculateItemSubtotal = (item: EditableItem): number => {
    return item.unit_price * item.quantity;
  };

  const getProductStockInPieces = (product: IProduct): number => {
    return product.stock_in_pieces ?? (product.stock || 0) * (product.selling_unit_quantity || 1);
  };

  const getProductStockLevel = (product: IProduct): number => {
    if (product.stock !== undefined && product.stock !== null) return product.stock;
    return Math.floor(getProductStockInPieces(product) / (product.selling_unit_quantity || 1));
  };

  // Updated handleItemUpdate to properly handle unit_price changes when switching between pieces and units
  const handleItemUpdate = (itemId: string, field: keyof EditableItem, value: any) => {
    setEditableItems(prev => prev.map(item => {
      if (item.product_id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // If quantity_type changes, update unit_price accordingly
        if (field === 'quantity_type') {
          const isUnitSale = value === 'units';
          // When switching to units (box/pack), use price_per_unit
          // When switching to pieces, use price_per_piece
          const sellingQty = item.selling_unit_quantity || 1;
          updatedItem.unit_price = isUnitSale 
            ? (item.price_per_piece * sellingQty)
            : item.price_per_piece;
          
          // Also update quantity_type
          updatedItem.quantity_type = value;
        }
        
        // If quantity changes, just update the quantity
        if (field === 'quantity') {
          // Ensure quantity is positive
          updatedItem.quantity = Math.max(0.01, parseFloat(value) || 0);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setEditableItems(prev => prev.filter(item => item.product_id !== itemId));
    toast.success("Item removed from order");
  };

  // Updated handleAddProduct with full validation from addToCart
  const handleAddProduct = (product: IProduct) => {
    // Check if product is available and in stock
    const stockLevel = getProductStockLevel(product);
    if (!product.is_available || stockLevel === 0) {
      toast.error("Product is out of stock", { duration: 3000 });
      return;
    }

    // Check if product already exists in order
    const existingItem = editableItems.find(item => item.product_id === product.id);
    if (existingItem) {
      toast.error("Product already in order. Edit quantity instead.", { duration: 3000 });
      return;
    }

    // Default to pieces mode
    const isPieces = true;
    const resolvedQtyType = product.content_unit_type || "piece";
    const piecesPerUnit = resolvePiecesPerUnit(resolvedQtyType, product);
    const quantity = 1; // Default quantity
    const quantityInPieces = quantity * piecesPerUnit;

    // Check stock availability
    const availablePieces = getProductStockInPieces(product);
    if (quantityInPieces > availablePieces) {
      const maxInUnit = Math.floor(availablePieces / piecesPerUnit);
      toast.error(
        `Not enough stock. Available: ${maxInUnit} ${resolvedQtyType}s`,
        { duration: 3000 }
      );
      return;
    }

    // Check combined stock with existing items of same product
    const alreadyCommittedPieces = editableItems
      .filter(item => item.product_id === product.id)
      .reduce((sum, item) => {
        const pp = resolvePiecesPerUnit(item.quantity_type || "units", product);
        return sum + item.quantity * pp;
      }, 0);

    if (alreadyCommittedPieces + quantityInPieces > availablePieces) {
      toast.error("Not enough stock for combined quantity", { duration: 3000 });
      return;
    }

    // Calculate prices
    const pricePerPiece = product.price_per_piece && product.price_per_piece > 0
      ? product.price_per_piece
      : product.price_per_unit / (product.selling_unit_quantity || 1);

    if (!pricePerPiece && !product.price_per_unit) {
      toast.error("Product price is not set", { duration: 3000 });
      return;
    }

    const unitPrice = resolveUnitPrice(resolvedQtyType, product);
    const sellingQty = product.selling_unit_quantity || 1;

    // Create new item
    const newItem: EditableItem = {
      order_id: editableOrder.id || undefined,
      product_id: product.id,
      quantity: quantity,
      quantity_type: resolvedQtyType,
      unit_price: unitPrice,
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
      subtotal: unitPrice * quantity,
      isEditing: false
    };

    setEditableItems(prev => [...prev, newItem]);
    setShowProductSelector(false);
    setSearchTerm("");
    toast.success(`${product.short_name} (${resolvedQtyType} ×${quantity}) added`, { duration: 3000 });
  };

  const handleDiscountChange = (value: string) => {
    const discount = parseFloat(value) || 0;
    setEditableOrder(prev => ({ ...prev, discount }));
    if (formErrors.discount) {
      setFormErrors(prev => ({ ...prev, discount: undefined }));
    }
  };

  const handleTenderedCashChange = (value: string) => {
    const tendered = parseFloat(value) || 0;
    setEditableOrder(prev => ({ ...prev, tendered_cash: tendered }));
    if (formErrors.tenderedCash) {
      setFormErrors(prev => ({ ...prev, tenderedCash: undefined }));
    }
  };

  const validateDiscount = () => {
    if (discountValue < 0) {
      setFormErrors(prev => ({ ...prev, discount: "Discount cannot be negative" }));
      return false;
    }
    if (discountValue > subTotal) {
      setFormErrors(prev => ({ ...prev, discount: "Discount cannot exceed subtotal" }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, discount: undefined }));
    return true;
  };

  const validateTenderedCash = () => {
    if (tenderedCashValue < 0) {
      setFormErrors(prev => ({ ...prev, tenderedCash: "Amount cannot be negative" }));
      return false;
    }
    setFormErrors(prev => ({ ...prev, tenderedCash: undefined }));
    return true;
  };

  const handleSaveOrder = async () => {
    if (editableItems.length === 0) {
      toast.error("Order must have at least one item");
      return;
    }

    if (total < 0) {
      toast.error("Invalid total amount");
      return;
    }

    // Discount validation
    if (discountValue < 0) {
      toast.error("Discount cannot be negative");
      setFormErrors(prev => ({ ...prev, discount: "Discount cannot be negative" }));
      return;
    }
    
    if (discountValue > subTotal) {
      toast.error("Discount cannot exceed subtotal");
      setFormErrors(prev => ({ ...prev, discount: "Discount cannot exceed subtotal" }));
      return;
    }
    
    // Tendered cash validation
    if (tenderedCashValue < 0) {
      toast.error("Amount cannot be negative");
      setFormErrors(prev => ({ ...prev, tenderedCash: "Amount cannot be negative" }));
      return;
    }
    
    if (tenderedCashValue < total) {
      toast.error(`Amount cannot be less than total (${formatCurrency(total)})`);
      setFormErrors(prev => ({ ...prev, tenderedCash: `Amount must be at least ${formatCurrency(total)}` }));
      return;
    }
  
    setLoading(true);
    try {
      const updatedOrderData = {
        cashier: editableOrder.cashier,
        customer: editableOrder.customer,
        total: parseFloat(total.toFixed(2)),
        subtotal: parseFloat(subTotal.toFixed(2)),
        discount: discountValue,
        tendered_cash: tenderedCashValue,
        balance: parseFloat(balanceDue.toFixed(2)),
        balance_label: balanceLabel,
        items: editableItems.map((item) => {
          const quantityType = item.quantity_type || "pieces";
          return {
            product_id: item.product_id,
            quantity: item.quantity,
            quantity_type: quantityType,
            unit_price: item.unit_price,
            price_per_piece: item.price_per_piece,
            product_name: item.product_name || "",
            short_name: item.short_name || "",
            category_name: item.category_name || "",
            content_measurement: item.content_measurement || "",
            content_unit: item.content_unit || "",
            content_unit_type: item.content_unit_type || "",
            selling_unit_quantity: item.selling_unit_quantity || 1,
            selling_unit: item.selling_unit || "",
            image_url: item.image_url || "",
            image_alt: item.image_alt || "",
          };
        }),
        payment: {
          payment_method: editableOrder.payment?.payment_method || "Cash",
          amount_paid: tenderedCashValue,
          transaction_id: editableOrder.payment?.transaction_id || "",
        },
      };

      const response = await appService.updateOrder(editableOrder.id, updatedOrderData);
      
      if (response.success) {
        toast.success("Order updated successfully");
        if (onOrderUpdated) onOrderUpdated();
        modalRef?.close({ action: "updated", order: response.results });
      } else {
        toast.error(response.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Update order error:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.short_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-4 border-b border-border pb-3 sticky top-0 bg-card z-10 px-4">
        <div>
          <h2 className="text-xl text-text font-bold">{title}</h2>
          <p className="text-sm text-text-light mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => modalRef?.dismiss()}
          className="w-8 h-8 rounded-full hover:bg-background transition-colors flex items-center justify-center"
        >
          <i className="ri-close-line text-xl text-text-light"></i>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        
        {/* Order Summary Card */}
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium mb-1 opacity-80">Order Code</p>
              <p className="text-base font-bold text-text">{editableOrder.code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium mb-1 opacity-80">Final Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-primary-100">
            <p className="text-xs text-text-light">
              Created: {dateUtils.formatDate(editableOrder.created_at, DateFormatEnums.DATE_TIME_SHORT)}
            </p>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-3">
          <h3 className="text-md font-semibold text-text border-b border-border pb-1">
            Order Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input
                label="Customer Name"
                value={editableOrder.customer}
                onChange={(v) => setEditableOrder(prev => ({ ...prev, customer: v as string }))}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Input
                label="Cashier"
                value={editableOrder.cashier}
                onChange={(v) => setEditableOrder(prev => ({ ...prev, cashier: v as string }))}
                placeholder="Cashier name"
              />
            </div>
            <div>
              <Input
                type="number"
                label="Discount (GHS)"
                value={discountValue.toString()}
                onChange={(v) => handleDiscountChange(v as string)}
                onBlur={validateDiscount}
                min={0}
                step={0.01}
                error={formErrors.discount}
              />
            </div>
            <div>
              <Input
                type="number"
                label="Tendered Cash"
                value={tenderedCashValue.toString()}
                onChange={(v) => handleTenderedCashChange(v as string)}
                onBlur={validateTenderedCash}
                min={0}
                step={0.01}
                error={formErrors.tenderedCash}
              />
            </div>
          </div>

          <div>
            <Input
              type="select"
              label="Payment Method"
              value={editableOrder.payment?.payment_method || "Cash"}
              selectOptions={[
                { value: "Cash", label: "Cash" },
                { value: "Mobile Money", label: "Mobile Money" },
                { value: "Card", label: "Card" }
              ]}
              onChange={(v) => setEditableOrder(prev => ({
                ...prev,
                payment: { ...prev.payment, payment_method: v as string, amount_paid: prev.tendered_cash, transaction_id: prev.payment?.transaction_id || "" }
              }))}
            />
          </div>

          {editableOrder.payment?.payment_method !== "Cash" && (
            <div>
              <Input
                label="Transaction ID / Reference"
                value={editableOrder.payment?.transaction_id || ""}
                onChange={(v) => setEditableOrder(prev => ({
                  ...prev,
                  payment: { ...prev.payment, transaction_id: v as string, payment_method: prev.payment?.payment_method || "Cash", amount_paid: prev.tendered_cash }
                }))}
              />
            </div>
          )}
        </div>

        {/* Balance Display */}
        <div className={`p-3 rounded-lg ${balanceDue >= 0 ? 'bg-success-10' : 'bg-danger-10'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${balanceDue >= 0 ? 'text-success' : 'text-danger'}`}>
              {balanceLabel}:
            </span>
            <span className={`font-bold text-base ${balanceDue >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(Math.abs(balanceDue))}
            </span>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-border pb-1">
            <h3 className="text-md font-semibold text-text">Order Items</h3>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowProductSelector(!showProductSelector)}
            >
              <i className="ri-add-line mr-1"></i>
              Add Product
            </Button>
          </div>

          {/* Product Selector */}
          {showProductSelector && (
            <div className="bg-background rounded-lg p-3 space-y-2">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={setSearchTerm}
                prefixIcon="search"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProducts.slice(0, 10).map(product => {
                  const stockLevel = getProductStockLevel(product);
                  const isOutOfStock = !product.is_available || stockLevel === 0;
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => !isOutOfStock && handleAddProduct(product)}
                      disabled={isOutOfStock}
                      className={`w-full text-left p-2 rounded transition-colors ${
                        isOutOfStock 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-card'
                      }`}
                    >
                      <p className="text-sm font-medium text-text">{product.short_name || product.name}</p>
                      <p className="text-xs text-text-light">
                        {formatCurrency(product.price_per_unit)}/{product.selling_unit}
                        {isOutOfStock && <span className="text-danger ml-2">(Out of stock)</span>}
                      </p>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-text-light text-center py-4">No products found</p>
                )}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-text-light">Product</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-text-light">Quantity</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-text-light">Type</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-text-light">Unit Price</th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-text-light">Subtotal</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-text-light">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editableItems.map((item) => (
                  <tr key={item.product_id} className="hover:bg-background">
                    <td className="px-2 py-2">
                      <p className="text-sm font-medium text-text">{item.short_name}</p>
                      <p className="text-xs text-text-light">{item.category_name}</p>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        value={item.quantity.toString()}
                        onChange={(v) => handleItemUpdate(item.product_id, 'quantity', parseFloat(v as string) || 0)}
                        min={0.01}
                        step={0.01}
                        size="sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="select"
                        size="sm"
                        value={item.quantity_type}
                        onChange={(e) => handleItemUpdate(item.product_id, 'quantity_type', e.target.value)}
                        selectOptions={[
                            { value: item.content_unit_type || "pieces", label: item?.content_unit_type ? item.content_unit_type.charAt(0).toUpperCase() + item.content_unit_type.slice(1) : "Pieces" },
                            { value: item.selling_unit, label: item?.selling_unit ? item.selling_unit.charAt(0).toUpperCase() + item.selling_unit.slice(1) : "Units" },
                        ]}
                      />
                     
                    </td>
                    <td className="px-2 py-2 text-right text-sm text-text">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-2 py-2 text-right text-sm font-semibold text-text">
                      {formatCurrency(calculateItemSubtotal(item))}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-danger hover:text-danger-dark transition-colors"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background border-t border-border">
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-2 py-2 text-right font-medium text-text">Subtotal:</td>
                  <td className="px-2 py-2 text-right font-semibold text-text">
                    {formatCurrency(subTotal)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-2 py-2 text-right font-medium text-text">Discount:</td>
                  <td className="px-2 py-2 text-right font-semibold text-danger">
                    -{formatCurrency(discountValue)}
                  </td>
                  <td></td>
                </tr>
                <tr className="border-b border-border">
                  <td colSpan={4} className="px-2 py-2 text-right font-bold text-text">Total:</td>
                  <td className="px-2 py-2 text-right font-bold text-primary text-base">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between gap-3 pt-4 border-t border-border mt-4 px-4 pb-4">
        <Button
          onClick={() => modalRef?.dismiss()}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveOrder}
          variant="primary"
          loading={loading}
          disabled={loading}
        >
          <i className="ri-save-line mr-2"></i>
          Save Changes
        </Button>
      </div>
    </div>
  );
};