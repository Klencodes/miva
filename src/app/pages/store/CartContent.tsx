import { Roles } from "../../../core/enums/roles";
import { getStoredItem, USER_KEY } from "../../../core/hooks/useStore";
import { CartItem } from "../../../core/interfaces/IProduct";
import { ICartContentProps } from "../../../core/interfaces/IStore";
import { IUser } from "../../../core/interfaces/IUser";
import { Button, Input } from "../../../ui";
import { resolvePiecesPerUnit, resolveUnitPrice } from "./CustomQuantityModal";

const CartContent: React.FC<ICartContentProps> = ({
  cartItems,
  subTotal,
  total,
  discount,
  tenderedCash,
  paymentMethod,
  transactionId,
  balanceDue,
  balanceLabel,
  selectedCustomer,
  paymentOptions,
  creatingOrder,
  setDiscount,
  setTenderedCash,
  setPaymentMethod,
  setTransactionId,
  removeFromCart,
  updateQuantity,
  openCustomerModal,
  submitOrder,
  holdOrder,
  openCustomQuantityModal,
  openHoldOrdersModal,
  formErrors = {},
  handleFormBlur,
}) => {
  const discountValue = parseFloat(discount || "0") || 0;
  const user = getStoredItem<IUser | null>(USER_KEY, null);

  const handleDiscountChange = (value: string) => {
    if (!isNaN(parseFloat(value)) || value === "") setDiscount(value);
  };

  const handleTenderedCashChange = (value: string) => {
    if (!isNaN(parseFloat(value)) || value === "") setTenderedCash(value);
  };

  // ── price helpers ─────────────────────────────────────────────────────────

  /** Unit price for one unit of this cart line's quantity_type */
  const getUnitPrice = (item: CartItem): number => {
    const qtyType = item.quantity_type || (item.isPieces ? "piece" : "units");
    return resolveUnitPrice(qtyType, item as any);
  };

  /** Total for the cart line */
  const getItemSubtotal = (item: CartItem): number =>
    getUnitPrice(item) * item.quantity;

  /**
   * E.g. "3 pieces (= 0.13 boxes)"  or  "2 boxes (= 48 pieces)"
   */
  const formatQuantityDisplay = (item: CartItem): string => {
    const qtyType   = item.quantity_type || (item.isPieces ? "piece" : "units");
    const sellingQty = item.selling_unit_quantity || 1;
    const piecesPerUnit = resolvePiecesPerUnit(qtyType, item as any);
    const totalPieces = item.quantity * piecesPerUnit;
    const pieceLabel = item.content_unit_type || "piece";
    const packLabel  = item.selling_unit || "unit";

// Piece only (no full packs)
    if (piecesPerUnit >= sellingQty) {
      // Pack-level line
      const pieces = totalPieces;
return `${item.quantity} ${packLabel}${item.quantity !== 1 ? "s" : ""} (${pieces} ${pieceLabel}s)`;
    }

    // Piece-level line
    const fullPacks    = Math.floor(totalPieces / sellingQty);
    const remaining    = totalPieces % sellingQty;

    if (fullPacks > 0 && remaining > 0) {
return `${item.quantity} ${pieceLabel}${item.quantity !== 1 ? "s" : ""} (${fullPacks} ${packLabel}${fullPacks > 1 ? "s" : ""} + ${remaining} ${pieceLabel}${remaining > 1 ? "s" : ""})`;
    }
    if (fullPacks > 0) {
return `${item.quantity} ${pieceLabel}${item.quantity !== 1 ? "s" : ""} (${fullPacks} ${packLabel}${fullPacks > 1 ? "s" : ""})`;
    }
return `${item.quantity} ${pieceLabel}${item.quantity > 1 ? "s" : ""}`;
  };

  /** "GHC 30.00/piece" or "GHC 720.00/box" */
  const formatPriceDisplay = (item: CartItem): string => {
    const qtyType  = item.quantity_type || (item.isPieces ? "piece" : "units");
    const price    = getUnitPrice(item);
    const label    = qtyType === "units"
      ? (item.selling_unit || "unit")
      : (item.content_unit_type || qtyType);
    return `GHC ${price.toFixed(2)}/${label}`;
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-sm shadow-sm flex flex-col h-full bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <button className="flex items-center justify-between mb-2" onClick={openHoldOrdersModal}>
          <span className="text-primary text-sm">View Hold Orders</span>
        </button>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-text">Cart</h2>
          <span className="bg-primary text-white px-2 py-1 rounded-full text-sm font-semibold">
            {cartItems.length}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-text-light">Order for</p>
          {selectedCustomer ? (
            <div className="flex items-center text-sm">
              <p className="font-semibold text-text">{selectedCustomer}</p>
              <p onClick={openCustomerModal} className="underline text-primary ml-1 cursor-pointer">Change</p>
            </div>
          ) : (
            <Button onClick={openCustomerModal} size="sm" variant="link" className="-mr-2">
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto bg-background rounded-sm p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-light">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-md font-medium mb-2">Your cart is empty</p>
            <p className="text-sm text-center">Add products from the catalog to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => {
              const qtyType    = item.quantity_type || (item.isPieces ? "piece" : "units");
              const subtotal   = getItemSubtotal(item);
              const isPackLine = qtyType === "units" ||
                qtyType.toLowerCase() === (item.selling_unit || "").toLowerCase();

              return (
                <div key={`${item.id}-${qtyType}`} className="bg-card rounded-sm shadow-sm p-3">
                  <div className="flex items-start gap-3 mb-2">
                    <img src={item.image_url} alt={item.image_alt} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text text-sm truncate">{item.short_name}</h4>
                      <p className="text-xs text-text-light">
                        {item.selling_unit_quantity}×{item.content_measurement}{item.content_unit}/{item.selling_unit}
                      </p>
                      <p className="text-xs text-text-light">{formatQuantityDisplay(item)}</p>
                      {/* Selling mode badge */}
                      <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        isPackLine
                          ? "bg-primary-10 text-primary"
                          : "bg-info-10 text-info"
                      }`}>
                        {isPackLine ? `By ${item.selling_unit}` : `By ${item.content_unit_type || "piece"}`}
                      </span>
                    </div>
                    <button onClick={() => removeFromCart(item)} className="text-danger flex-shrink-0 mt-0.5">
                      <i className="ri-close-line"></i>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => openCustomQuantityModal(item, item.quantity, !isPackLine)}
                        size="sm"
                        variant="outline"
                      >
                        <i className="ri-edit-line mr-1"></i>
                        Edit
                      </Button>
                      <span className="text-xs text-text-light">{formatPriceDisplay(item)}</span>
                    </div>
                    <span className="font-bold text-text">GHC {subtotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div>
          <div className="space-y-2 mb-1">
            {user?.role === Roles.SUPER_ADMIN && (
              <>
                <div className="flex justify-between text-sm pt-2 px-3">
                  <span className="text-text-light">Subtotal</span>
                  <span className="font-semibold text-text">GHC {(subTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm px-3">
                  <span className="text-text-light">Discount</span>
                  <div className="flex items-center gap-4">
                    <div className="w-24 -mb-5">
                      <Input
                        type="number" size="sm" value={discount}
                        onChange={(v) => handleDiscountChange(v as string)}
                        onBlur={() => handleFormBlur?.("discount")}
                        min={0} step={0.01} placeholder="0.00"
                        error={formErrors?.discount}
                        disabled={[Roles.SALES, Roles.ADMIN].includes(user!.role)}
                      />
                    </div>
                    <div className="text-danger font-semibold w-24 text-right">
                      - GHC {discountValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-border-light pt-2 px-3">
              <span className="text-text">Total</span>
              <span className="text-primary">GHC {(total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3 mb-3 p-3 rounded-sm bg-background">
            <div className="flex gap-3">
              <div className="flex-1 -mb-4">
                <Input
                  type="number" label="Tendered Cash" value={tenderedCash}
                  onChange={handleTenderedCashChange}
                  onBlur={() => handleFormBlur?.("tenderedCash")}
                  min={0} step={0.01} placeholder="0.00"
                  error={formErrors?.tenderedCash}
                />
              </div>
              <div className="flex-1 -mb-4">
                <Input
                  type="select" label="Payment Method" value={paymentMethod}
                  selectOptions={paymentOptions} onChange={setPaymentMethod}
                  onBlur={() => handleFormBlur?.("paymentMethod")}
                  error={formErrors?.paymentMethod}
                />
              </div>
            </div>

            {paymentMethod !== "Cash" && (
              <div className="-mb-4">
                <Input
                  type="text" label="Transaction ID / Reference" value={transactionId}
                  onChange={setTransactionId}
                  onBlur={() => handleFormBlur?.("transactionId")}
                  error={formErrors?.transactionId}
                />
              </div>
            )}

            <div className={`flex justify-between text-sm p-2 rounded-sm ${(balanceDue || 0) >= 0 ? "bg-success-10" : "bg-danger-10"}`}>
              <span className={`font-medium ${(balanceDue || 0) >= 0 ? "text-success" : "text-danger"}`}>
                {balanceLabel}
              </span>
              <span className={`font-bold ${(balanceDue || 0) >= 0 ? "text-success" : "text-danger"}`}>
                GHC {Math.abs(balanceDue || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-3 pb-2">
            <Button onClick={holdOrder} variant="outline" className="flex-1">
              <i className="ri-save-line mr-1 text-primary"></i>Hold
            </Button>
            <Button
              onClick={submitOrder}
              disabled={
                cartItems.length === 0 ||
                (total || 0) === 0 ||
                !!(tenderedCash && parseFloat(tenderedCash) < (total || 0)) ||
                creatingOrder
              }
              className="flex-1"
              loading={creatingOrder}
            >
              Complete (GHC {(total || 0).toFixed(2)})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartContent;