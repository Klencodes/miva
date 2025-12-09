import { ICartContentProps } from "../../../core/interfaces/IStore";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import { Button, Input } from "../../../ui";

const CartContent: React.FC<ICartContentProps> = ({
  cartItems,
  subTotal,
  total,
  discount,
  tenderedCash,
  paymentMethod,
  referenceId,
  balanceDue,
  balanceLabel,
  selectedCustomer,
  paymentOptions,
  creatingOrder,
  setDiscount,
  setTenderedCash,
  setPaymentMethod,
  setReferenceId,
  removeFromCart,
  updateQuantity,
  openCustomerModal,
  submitOrder,
  holdOrder,
  addToCart,
  addQuarterToCart,
  addHalfToCart,
  addThreeQuarterToCart,
  openHoldOrdersModal,
}) => {
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
            {cartItems.map((item) => (
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
                        {item.short_name} -{" "}
                        <span className="text-text-light text-xs">
                          ({item.content_measurement}x
                          {item.selling_unit_quantity}
                          {item.content_unit})
                        </span>
                      </h4>
                      <p className="text-primary font-semibold text-xs">
                        GHC {item.price?.toFixed(2)}/{item.selling_unit}
                      </p>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item, item.quantity - 1);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      -
                    </Button>
                    <span className="text-sm flex flex-row text-center font-semibold text-text">
                      {formatQuantity(item.quantity)} {item.selling_unit}
                    </span>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item, item.quantity + 1);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      +
                    </Button>
                  </div>

                  <span className="font-semibold text-text">
                    GHC {(item.price * item.quantity)?.toFixed(2)}
                  </span>
                </div>

                {/* Fractional Quick Actions */}
                <div
                  className={
                    item.selling_unit_quantity > 1
                      ? "grid grid-cols-4 gap-1.5"
                      : "grid grid-cols-1 gap-1.5"
                  }
                >
                  {item?.selling_unit_quantity > 1 && (
                    <button
                      onClick={() => addQuarterToCart(item)}
                      className={`flex-1 text-xs py-1 px-2 rounded ${
                        item.quantity === 0.25
                          ? "bg-primary text-white"
                          : "bg-background text-text"
                      }`}
                    >
                      ¼
                    </button>
                  )}

                  {item?.selling_unit_quantity > 1 && (
                    <button
                      onClick={() => addHalfToCart(item)}
                      className={`flex-1 text-xs py-1 px-2 rounded ${
                        item.quantity === 0.5
                          ? "bg-primary text-white"
                          : "bg-background text-text"
                      }`}
                    >
                      ½
                    </button>
                  )}
                  {item?.selling_unit_quantity > 1 && (
                    <button
                      onClick={() => addThreeQuarterToCart(item)}
                      className={`flex-1 text-xs py-1 px-2 rounded ${
                        item.quantity === 0.75
                          ? "bg-primary text-white"
                          : "bg-background text-text"
                      }`}
                    >
                      ¾
                    </button>
                  )}
                  <button
                    onClick={() => addToCart(item)}
                    className={`flex-1 text-xs py-1 px-2 rounded ${
                      item.quantity === 1
                        ? "bg-primary text-white"
                        : "bg-background text-text"
                    }`}
                  >
                    1
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      {cartItems.length > 0 && (
        <div className="border-t border-border p-4">
          {/* Summary */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-light">Subtotal</span>
              <span className="font-semibold text-text">
                GHC {subTotal?.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-text-light">Discount</span>

              <div className="flex items-center gap-4">
                <div className="w-24 -mb-5">
                  <Input
                    type="number"
                    size="sm"
                    onChange={(val) => setDiscount(parseFloat(val) || 0)}
                    min={parseFloat("0")}
                    placeholder="0.00"
                  />
                </div>

                <div className="text-danger font-semibold w-20 text-right">
                  - GHC {discount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-2 border-border-light">
              <span className="text-text">Total</span>
              <span className="text-primary">GHC {total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 mb-6 p-3 rounded-sm bg-background">
            <h3 className="text-md font-semibold text-text mb-2">Payment</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  label="Tendered Cash"
                  value={tenderedCash}
                  onChange={(val) => setTenderedCash(parseFloat(val) || 0)}
                  min={parseFloat("0")}
                  placeholder="0.00"
                />
              </div>

              <div className="flex-1">
                <Input
                  type="select"
                  label="Payment Method"
                  value={paymentMethod}
                  selectOptions={paymentOptions}
                  onChange={(val) => setPaymentMethod(val)}
                />
              </div>
            </div>

            {paymentMethod !== "Cash" && (
              <Input
                type="text"
                label="Reference ID (e.g., Transaction ID)"
                value={referenceId}
                onChange={setReferenceId}
              />
            )}

            <div
              className={`flex justify-between text-sm p-2 rounded-sm ${
                balanceDue >= 0 ? "bg-success-10" : "bg-danger-10"
              }`}
            >
              <span
                className={`font-medium ${
                  balanceDue >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {balanceLabel}
              </span>
              <span
                className={`font-bold ${
                  balanceDue >= 0 ? "text-success" : "text-danger"
                }`}
              >
                GHC {Math.abs(balanceDue)?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row justify-between w-full">
            <Button
              onClick={submitOrder}
              disabled={
                cartItems.length === 0 ||
                total === 0 ||
                tenderedCash < total ||
                creatingOrder
              }
              className="w-full"
              loading={creatingOrder}
            >
              Complete Order (GHC {total?.toFixed(2)})
            </Button>

            <Button onClick={holdOrder} variant="outline" className="flex-1">
              <i className="ri-save-line mr-1 text-primary"></i>
              Hold This Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartContent;
