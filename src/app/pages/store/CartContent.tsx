import { Roles } from "../../../core/enums/roles";
import { getStoredItem, USER_KEY } from "../../../core/hooks/useStore";
import { CartItem } from "../../../core/interfaces/IProduct";
import { ICartContentProps } from "../../../core/interfaces/IStore";
import { IUser } from "../../../core/interfaces/IUser";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import { Button, Input } from "../../../ui";

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
  // Helper function to handle discount change
  const handleDiscountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === "") {
      setDiscount(value);
    }
  };

  // Helper function to handle tendered cash change
  const handleTenderedCashChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) || value === "") {
      setTenderedCash(value);
    }
  };

  // Convert discount to number for display calculations
  const discountValue = parseFloat(discount || "0") || 0;
  const user = getStoredItem<IUser | null>(USER_KEY, null);

  // Helper function to get price per piece
  const getPricePerPiece = (item: CartItem): number => {
    if (item.price_per_piece !== undefined && item.price_per_piece > 0) {
      return item.price_per_piece;
    }
    return (item.price_per_unit || 0) / (item.selling_unit_quantity || 1);
  };

  // Helper function to calculate item subtotal
  const getItemSubtotal = (item: CartItem): number => {
    if (item.isPieces !== undefined && !item.isPieces) {
      // Quantity is in selling units
      return (item.price_per_unit || 0) * item.quantity;
    } else {
      // Quantity is in pieces
      return getPricePerPiece(item) * item.quantity;
    }
  };

  // Helper function to format quantity display
  const formatQuantityDisplay = (item: CartItem): string => {
    if (item.isPieces !== undefined && !item.isPieces) {
      // Quantity is in selling units
      const units = item.quantity;
      const pieces = units * (item.selling_unit_quantity || 1);
      return `${formatQuantity(units)} ${item.selling_unit}${units !== 1 ? 's' : ''} (${formatQuantity(pieces)} pieces)`;
    } else {
      // Quantity is in pieces
      const sellingUnitQty = item.selling_unit_quantity || 1;
      const fullUnits = Math.floor(item.quantity / sellingUnitQty);
      const remainingPieces = item.quantity % sellingUnitQty;
      
      if (fullUnits > 0 && remainingPieces > 0) {
        return `${formatQuantity(item.quantity)} pieces (${fullUnits} ${item.selling_unit}${fullUnits > 1 ? 's' : ''} ${remainingPieces} piece${remainingPieces > 1 ? 's' : ''})`;
      } else if (fullUnits > 0) {
        return `${formatQuantity(item.quantity)} pieces (${fullUnits} ${item.selling_unit}${fullUnits > 1 ? 's' : ''})`;
      } else {
        return `${formatQuantity(item.quantity)} piece${item.quantity > 1 ? 's' : ''}`;
      }
    }
  };

  // Helper function to format price per unit display
  const formatPricePerUnitDisplay = (item: CartItem): string => {
    if (item.isPieces !== undefined && !item.isPieces) {
      return `GHC ${(item.price_per_unit || 0).toFixed(2)}/${item.selling_unit}`;
    } else {
      return `GHC ${getPricePerPiece(item).toFixed(2)}/piece`;
    }
  };

  return (
    <div className="rounded-sm shadow-sm flex flex-col h-full bg-card">
      {/* Cart Header */}
      <div className="border-b border-border p-4">
        <button
          className="flex items-center justify-between mb-2"
          onClick={openHoldOrdersModal}
        >
          <div className="text-primary text-sm">View Hold Orders</div>
        </button>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-text">Cart</h2>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-white px-2 py-1 rounded-full text-sm font-semibold">
              {cartItems.length}
            </span>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-light">Order for</p>
          </div>
          {selectedCustomer ? (
            <div className="flex items-center text-sm">
              <p className="font-semibold text-text">{selectedCustomer}</p>
              <p
                onClick={openCustomerModal}
                className="underline text-primary ml-1 cursor-pointer"
              >
                Change
              </p>
            </div>
          ) : (
            <Button
              onClick={openCustomerModal}
              size="sm"
              variant="link"
              className="-mr-2"
            >
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items - Scrollable Container */}
      <div className="flex-1 overflow-y-auto bg-background rounded-sm p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-light">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-md font-medium mb-2">Your cart is empty</p>
            <p className="text-sm text-center">
              Add products from the catalog to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => {
              const itemSubtotal = getItemSubtotal(item);
              
              return (
                <div key={item.id} className="bg-card rounded-sm shadow-sm p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={item.image_url}
                        alt={item.image_alt}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-text text-sm truncate">
                          {item.short_name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-text-light">
                          <span>
                            {item.selling_unit_quantity}x{item.content_measurement}
                            {item.content_unit} per {item.selling_unit}
                          </span>
                          <span className="text-primary">
                            {formatPricePerUnitDisplay(item)}
                          </span>
                        </div>
                        <p className="text-xs text-text-light">
                          {formatQuantityDisplay(item)}
                        </p>
                        {item.isPieces !== undefined && (
                          <p className="text-xs text-text-light">
                            Type: {item.isPieces ? 'Pieces' : `${item.selling_unit}s`}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item)}
                      className="text-danger transition-colors duration-200"
                    >
                      <i className="ri-trash-3-line"></i>
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      onClick={() => openCustomQuantityModal(item, item.quantity, item.isPieces)}
                      size="sm"
                    >
                      Change Quantity
                    </Button>

                    <span className="font-semibold text-text">
                      GHC {itemSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="">
          {/* Summary */}
          <div className="space-y-2 mb-1">
            {user?.role === Roles.SUPER_ADMIN && (
              <>
                <div className="flex justify-between text-sm pt-2 px-3">
                  <span className="text-text-light">Subtotal</span>
                  <span className="font-semibold text-text">
                    GHC {(subTotal || 0)?.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm px-3">
                  <span className="text-text-light">Discount</span>

                  <div className="flex items-center gap-4">
                    <div className="w-24 -mb-5">
                      <Input
                        type="number"
                        size="sm"
                        value={discount}
                        onChange={(value) => handleDiscountChange(value as string)}
                        onBlur={() => handleFormBlur?.("discount")}
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        error={formErrors?.discount}
                        disabled={[Roles.STAFF, Roles.SALES, Roles.ADMIN].includes(user!.role)}
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
              <span className="text-primary">
                GHC {(total || 0)?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-3 p-3 rounded-sm bg-background">
            <div className="flex gap-3">
              <div className="flex-1 -mb-4">
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

              <div className="flex-1 -mb-4">
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
              <div className="flex-1 -mb-4">
                <Input
                  type="text"
                  label="Transaction ID / Reference"
                  value={transactionId}
                  onChange={setTransactionId}
                  onBlur={() => handleFormBlur?.("transactionId")}
                  error={formErrors?.transactionId}
                />
              </div>
            )}

            <div
              className={`flex justify-between text-sm p-2 rounded-sm ${
                (balanceDue || 0) >= 0 ? "bg-success-10" : "bg-danger-10"
              }`}
            >
              <span
                className={`font-medium ${
                  (balanceDue || 0) >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {balanceLabel}
              </span>
              <span
                className={`font-bold ${
                  (balanceDue || 0) >= 0 ? "text-success" : "text-danger"
                }`}
              >
                GHC {Math.abs(balanceDue || 0)?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row justify-between w-full gap-2 px-3 pb-2">
            <Button
              onClick={submitOrder}
              disabled={
                cartItems.length === 0 ||
                (total || 0) === 0 ||
                (tenderedCash && parseFloat(tenderedCash) < (total || 0)) ||
                creatingOrder
              }
              className="flex-1"
              loading={creatingOrder}
            >
              Complete (GHC {(total || 0)?.toFixed(2)})
            </Button>

            <Button onClick={holdOrder} variant="outline" className="flex-1">
              <i className="ri-save-line mr-1 text-primary"></i>
              Hold
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartContent;