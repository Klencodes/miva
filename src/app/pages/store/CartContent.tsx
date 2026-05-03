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
  closeCartModal,
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

  const getUnitPrice = (item: CartItem): number => {
    const qtyType = item.quantity_type || (item.isPieces ? "piece" : "units");
    return resolveUnitPrice(qtyType, item as any);
  };

  const getItemSubtotal = (item: CartItem): number =>
    getUnitPrice(item) * item.quantity;

  const formatQuantityDisplay = (item: CartItem): string => {
    const qtyType = item.quantity_type || (item.isPieces ? "piece" : "units");
    const sellingQty = item.selling_unit_quantity || 1;
    const piecesPerUnit = resolvePiecesPerUnit(qtyType, item as any);
    const totalPieces = item.quantity * piecesPerUnit;
    const pieceLabel = item.content_unit_type || "piece";
    const packLabel = item.selling_unit || "unit";

    if (piecesPerUnit >= sellingQty) {
      const pieces = totalPieces;
      return `${item.quantity} ${packLabel}${item.quantity !== 1 ? "s" : ""} (${pieces} ${pieceLabel}s)`;
    }

    const fullPacks = Math.floor(totalPieces / sellingQty);
    const remaining = totalPieces % sellingQty;

    if (fullPacks > 0 && remaining > 0) {
      return `${item.quantity} ${pieceLabel}${item.quantity !== 1 ? "s" : ""} (${fullPacks} ${packLabel}${fullPacks > 1 ? "s" : ""} + ${remaining} ${pieceLabel}${remaining > 1 ? "s" : ""})`;
    }
    if (fullPacks > 0) {
      return `${item.quantity} ${pieceLabel}${item.quantity !== 1 ? "s" : ""} (${fullPacks} ${packLabel}${fullPacks > 1 ? "s" : ""})`;
    }
    return `${item.quantity} ${pieceLabel}${item.quantity > 1 ? "s" : ""}`;
  };

  const formatPriceDisplay = (item: CartItem): string => {
    const qtyType = item.quantity_type || (item.isPieces ? "piece" : "units");
    const price = getUnitPrice(item);
    const label =
      qtyType === "units"
        ? item.selling_unit || "unit"
        : item.content_unit_type || qtyType;
    return `₵${price.toFixed(2)}/${label}`;
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 bg-white flex-shrink-0">
        {/* Hold Orders Button */}
        <div className="flex justify-between  mb-1">
           <button
          onClick={openHoldOrdersModal}
          className="flex items-center gap-1.5 text-primary text-xs font-medium active:opacity-70 transition-opacity"
        >
          <i className="ri-time-line text-sm"></i>
          <span>View Hold Orders</span>
        </button>
         {closeCartModal && <button
          onClick={closeCartModal}
          className="flex items-center gap-1.5 text-danger font-medium active:opacity-70 transition-opacity"
        >
          <i className="ri-close-line text-md"></i>
        </button>}
        </div>

        {/* Cart Title with Badge */}
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg font-bold text-gray-900">Cart</h2>
          <span className="bg-primary text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {cartItems.length}
          </span>
        </div>

        {/* Customer Section */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Order for</p>
          {selectedCustomer ? (
            <div className="flex items-center text-xs">
              <p className="font-semibold text-gray-900 truncate max-w-[150px]">
                {selectedCustomer}
              </p>
              <button
                onClick={openCustomerModal}
                className="text-primary ml-1 font-medium active:opacity-70"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={openCustomerModal}
              className="text-primary text-xs font-medium active:opacity-70"
            >
              + Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Items - Scrollable Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-2.5">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <i className="ri-shopping-cart-line text-3xl text-gray-300"></i>
            </div>
            <p className="text-base font-medium text-gray-600 mb-2">
              Your cart is empty
            </p>
            <p className="text-xs text-center text-gray-400 px-6">
              Add products from the catalog to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cartItems.map((item) => {
              const qtyType =
                item.quantity_type || (item.isPieces ? "piece" : "units");
              const subtotal = getItemSubtotal(item);
              const isPackLine =
                qtyType === "units" ||
                qtyType.toLowerCase() ===
                  (item.selling_unit || "").toLowerCase();

              return (
                <div
                  key={`${item.id}-${qtyType}`}
                  className="bg-white rounded-xl border border-gray-100 p-2.5 transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Product Image — smaller on mobile */}
                    <img
                      src={item.image_url}
                      alt={item.image_alt}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name + Remove */}
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                          {item.short_name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item)}
                          className="text-gray-300 hover:text-red-400 active:text-red-500 flex-shrink-0 -mt-0.5 -mr-0.5 p-0.5"
                          aria-label="Remove item"
                        >
                          <i className="ri-close-line text-base"></i>
                        </button>
                      </div>

                      {/* Quantity + Badge — single compact row */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 leading-none">
                          {formatQuantityDisplay(item)}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium leading-none ${
                            isPackLine
                              ? "bg-primary/10 text-primary"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isPackLine
                            ? `By ${item.selling_unit}`
                            : `By ${item.content_unit_type || "piece"}`}
                        </span>
                      </div>

                      {/* Edit + Unit Price + Subtotal */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              openCustomQuantityModal(
                                item,
                                item.quantity,
                                !isPackLine
                              )
                            }
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors"
                          >
                            <i className="ri-edit-line text-xs"></i>
                            <span>Edit</span>
                          </button>
                          <span className="text-xs text-gray-400">
                            {formatPriceDisplay(item)}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">
                          ₵{subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer — compact summary + payment + actions */}
      {cartItems.length > 0 && (
        <div className="border-t border-gray-100 bg-white flex-shrink-0">
          {/* Totals */}
          <div className="px-4 pt-3 pb-2 space-y-1.5">
            {user?.role === Roles.SUPER_ADMIN && (
              <>
                {/* Subtotal row */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <span className="text-xs font-semibold text-gray-900">
                    ₵{(subTotal || 0).toFixed(2)}
                  </span>
                </div>

                {/* Discount row */}
                <div className="flex justify-between items-center gap-3">
                  <span className="text-xs text-gray-500">Discount</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 -mb-5">
                      <Input
                        type="number"
                        size="sm"
                        value={discount}
                        onChange={(v) => handleDiscountChange(v as string)}
                        onBlur={() => handleFormBlur?.("discount")}
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        error={formErrors?.discount}
                        disabled={[Roles.SALES, Roles.ADMIN].includes(
                          user!.role
                        )}
                      />
                    </div>
                    <span className="text-xs text-red-500 font-semibold min-w-[60px] text-right">
                      −₵{discountValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Total row */}
            <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-900">Total</span>
              <span className="text-base font-bold text-primary">
                ₵{(total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment inputs */}
          <div className="px-3 bg-gray-50 mx-3 rounded-xl space-y-2">
            <div className="flex gap-x-2">
              <div className="flex-1 -mb-5">
                <Input
                  type="number"
                  label="Tendered Cash"
                  value={tenderedCash}
                  onChange={handleTenderedCashChange}
                  onBlur={() => handleFormBlur?.("tenderedCash")}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  error={formErrors?.tenderedCash}
                  
                />
              </div>
              <div className="flex-1 -mb-5">
                <Input
                  type="select"
                  label="Payment Method"
                  value={paymentMethod}
                  selectOptions={paymentOptions}
                  onChange={setPaymentMethod}
                  onBlur={() => handleFormBlur?.("paymentMethod")}
                  error={formErrors?.paymentMethod}
                />
              </div>
            </div>

            {paymentMethod !== "Cash" && (
              <Input
                type="text"
                label="Transaction ID / Reference"
                value={transactionId}
                onChange={setTransactionId}
                onBlur={() => handleFormBlur?.("transactionId")}
                error={formErrors?.transactionId}
              />
            )}

            {/* Balance */}
            <div
              className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                (balanceDue || 0) >= 0 ? "bg-success-5" : "bg-danger-5"
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  (balanceDue || 0) >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {balanceLabel}
              </span>
              <span
                className={`text-sm font-bold ${
                  (balanceDue || 0) >= 0 ? "text-success" : "text-danger"
                }`}
              >
                ₵{Math.abs(balanceDue || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 px-3 pb-3 mt-1">
            <button
              onClick={holdOrder}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-xl active:bg-primary/20 transition-colors"
            >
              <i className="ri-save-line text-sm"></i>
              <span>Hold</span>
            </button>
            <button
              onClick={submitOrder}
              disabled={
                cartItems.length === 0 ||
                (total || 0) === 0 ||
                !!(
                  tenderedCash &&
                  parseFloat(tenderedCash) < (total || 0)
                ) ||
                creatingOrder
              }
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-primary rounded-xl active:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingOrder ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line text-sm"></i>
                  <span>Complete (₵{(total || 0).toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartContent;