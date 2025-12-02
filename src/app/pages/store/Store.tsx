import React, { useState, useEffect, useCallback, useRef } from "react";
import { IResponse } from "../../../core/interfaces/IResponse";
import { eventService } from "../../../core/services/events";
import { toast } from "sonner";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct, CartItem } from "../../../core/interfaces/IProduct";
import { indexedDBService } from "../../../core/services/indexdb";
import { syncService } from "../../../core/services/sync";
import { useStore } from "../../../core/hooks/useStore";
import { useModal } from "../../../core/hooks/useModal";
import CustomerModal from "./CustomerModal";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";
import { ICartContentProps } from "../../../core/interfaces/IStore";
import { SelectOption } from "../../../core/interfaces/ISelectOption";

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
}) => {
  return (
    <div className="rounded-sm shadow-sm flex flex-col h-full bg-card">
      {/* Cart Header */}
      <div className="border-b border-border p-4">
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
              <div
                key={item.id}
                className="bg-card rounded-sm shadow-sm p-3"
              >
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
                <div className="flex gap-2 mt-2">
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

            <Button onClick={holdOrder} variant="outline">
              <i className="ri-pause-line mr-1 text-primary"></i>
              Hold
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ModernStore: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [tenderedCash, setTenderedCash] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [referenceId, setReferenceId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { user } = useStore();
  const { openModal } = useModal();
  const isOnline = useNetworkStatus();
  // Refs
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];

  // Keep refs synchronized
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Fetch products with direct implementation
  const fetchProducts = useCallback(
    async (
      pageParam: number = 1,
      search: string = "",
      category: string = "All"
    ) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = { page: pageParam, search, category };

        let response: IResponse;

        if (isOnline) {
          try {
            const serverResponse: IResponse = await appService.getProducts(
              params
            );

            if (serverResponse.success) {
              response = {
                success: serverResponse.success,
                message: serverResponse.message,
                results: serverResponse.results,
                next: serverResponse.next || null,
                count: serverResponse.count || serverResponse.results.length,
                previous: serverResponse.previous || null,
              };

              // Cache the results in IndexedDB
              if (serverResponse.results && serverResponse.results.length > 0) {
                try {
                  await indexedDBService.saveProducts(serverResponse.results);
                } catch (saveError) {
                  console.error("❌ Failed to cache products:", saveError);
                }
              }
            } else {
              const localProducts = await indexedDBService.getProducts(params);
              response = {
                success: true,
                message: "Products loaded from local storage",
                results: localProducts?.results,
                next: localProducts.next,
                count: localProducts.count,
                previous: localProducts.previous,
              };
            }
          } catch (serverError) {
            const localProducts = await indexedDBService.getProducts(params);
            response = {
              success: true,
              message: "Products loaded from local storage",
              results: localProducts?.results,
              next: localProducts.next,
              count: localProducts.count,
              previous: localProducts.previous,
            };
          }
        } else {
          // Use IndexedDB when offline
          const localProducts = await indexedDBService.getProducts(params);
          response = {
            success: true,
            message: "Products loaded from local storage",
            results: localProducts?.results,
            next: localProducts.next,
            count: localProducts.count,
            previous: localProducts.previous,
          };
        }

        if (response.success) {
          setProducts((prev) => {
            if (pageParam === 1) {
              return response.results || [];
            }
            return [...prev, ...(response.results || [])];
          });

          setHasMore(!!response.next);
          setPage(pageParam);
        } else {
          setProducts([]);
        }
      } catch (error) {
        toast.error("Failed to load products");
        setProducts([]);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [isOnline]
  );

  useEffect(() => {
    const getProductExttraData = async () => {
      try {
        const res = await appService.getProductExtraInfo();
        if (res.success) {
          setCategories([
            { label: "All", value: "All" },
            ...res.results?.categories?.map(
              (category: SelectOption) => category
            ),
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch product categories:", error);
      }
    };
    getProductExttraData();
  }, []);

  // Generate order code
  const generateOrderCode = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const datePart = `${yy}${MM}${dd}`;

    const randomPart = Math.random().toString(36).substring(2, 9).toUpperCase();

    return `G-${datePart}${randomPart}`;
  };

  // Submit order with direct implementation
  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setCreatingOrder(true);

    const order = {
      cashier: `${user!.first_name} ${user!.last_name[0]}`, // Assuming user is always defined here
      customer: selectedCustomer,
      total: parseFloat(total?.toFixed(2)),
      subtotal: parseFloat(subTotal?.toFixed(2)),
      discount: discount,
      tendered_cash: tenderedCash,
      balance: parseFloat(balanceDue?.toFixed(2)),
      balance_label: balanceLabel,
      code: generateOrderCode(),
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        product_name: item.name,
        short_name: item.short_name,
        category_name: item.category_name,
        content_measurement: item.content_measurement,
        content_unit: item.content_unit,
        selling_unit_quantity: item.selling_unit_quantity,
        selling_unit: item.selling_unit,
        image_url: item.image_url,
        image_alt: item.image_alt,
      })),
      payment: {
        payment_method: paymentMethod,
        amount_paid: tenderedCash,
        reference_id: referenceId,
      },
    };

    try {
      console.log("💾 Step 1: Always save to IndexedDB first (offline-first)");

      // ALWAYS save to IndexedDB first
      const localResponse = await indexedDBService.createOrder(order as any);

      if (!localResponse.success) {
        throw new Error("Failed to save order locally");
      }

      const localOrderId = localResponse.results?.id;
      console.log("✅ Order saved locally with ID:", localOrderId);

      // If online, try to sync to server immediately
      if (isOnline) {
        console.log("🌐 Online: Attempting immediate server sync...");
        try {
          const serverResponse = await appService.createOrder(order);

          if (serverResponse.success) {
            console.log("✅ Server accepted order");

            // Get server ID from response
            const serverOrderId = serverResponse?.results?.id;
            const serverCode = serverResponse?.results?.code;
            const serverCreatedAt = serverResponse.results?.created_at;

            if (localOrderId && serverOrderId) {
              // Update local order with server info
              await indexedDBService.updateOrderStatus(
                localOrderId,
                "synced",
                serverOrderId,
                serverCode,
                serverCreatedAt
              );
            }

            await cleanupOrderData("Order submitted successfully!");
          } else {
            await cleanupOrderData("Order saved locally - will retry sync");
          }
        } catch (serverError) {
          await cleanupOrderData(
            "Order saved locally - sync failed, will retry"
          );
        }
      } else {
        await cleanupOrderData(
          "Order saved offline - will sync when back online"
        );
      }
    } catch (error) {
      toast.error("Failed to save order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const holdOrder = () => {};

  // Initial load and event listeners
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchProducts(1, searchTerm, selectedCategory);
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchProducts, searchTerm, selectedCategory]);

  // Cart functions
  const addToCart = (product: IProduct, quantity: number = 1) => {
    if (!product.is_available || product.stock === 0) {
      toast.error("Product is out of stock", { duration: 3000 });
      return;
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      const newQuantity = existingItem
        ? existingItem.quantity + quantity
        : quantity;

      if (newQuantity > product.stock) {
        toast.error("Not enough stock available", { duration: 3000 });
        return prev;
      }

      if (existingItem) {
        toast.warning(
          `${product.short_name} quantity updated to ${formatQuantity(
            newQuantity
          )}`,
          {
            duration: 3000,
            id: `cart-update-${product.id}`,
          }
        );
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        toast.success("Success", {
          description: `${product.short_name} added to cart`,
          duration: 3000,
          id: `cart-add-${product.id}`,
        });
        return [...prev, { ...product, quantity, expanded: false }];
      }
    });
  };

  const addThreeQuarterToCart = (product: IProduct) => {
    addToCart(product, 0.75);
  };

  const addHalfToCart = (product: IProduct) => {
    addToCart(product, 0.5);
  };

  const addQuarterToCart = (product: IProduct) => {
    addToCart(product, 0.25);
  };

  const removeFromCart = (product: IProduct) => {
    setCartItems((prev) => prev.filter((item) => item.id !== product.id));
    toast.success("Success", {
      description: `${product.short_name} removed from cart`,
      duration: 3000,
    });
  };

  const updateQuantity = (product: IProduct, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(product);
      return;
    }

    const prod = products.find((p) => p.id === product.id);
    if (prod && newQuantity > product.stock) {
      toast.error(`Not enough stock available for ${product.short_name}`, {
        duration: 3000,
      });
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, quantity: newQuantity } : item
      )
    );
    toast.warning(
      `${product.short_name} quantity updated to ${formatQuantity(
        newQuantity
      )}`,
      {
        duration: 3000,
      }
    );
  };

  // Search function
  const searchProducts = useCallback(
    async (term: string) => {
      setSearchTerm(term);
      await fetchProducts(1, term, selectedCategory);
    },
    [selectedCategory, fetchProducts]
  );

  // Load more function
  const loadMoreProducts = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      fetchProducts(pageRef.current + 1, searchTerm, selectedCategory);
    }
  }, [hasMore, searchTerm, selectedCategory, fetchProducts]);

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadMoreProducts]
  );

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("No internet connection");
      return;
    }

    try {
      toast.info("Syncing data...");
      const result = await syncService.manualSync();

      if (result.products) {
        toast.success("Products synced successfully");
        // Refresh current view
        fetchProducts(1, searchTerm, selectedCategory);
      }

      if (result.orders.success > 0) {
        toast.success(`${result.orders.success} orders synced`);
      }
    } catch (error) {
      toast.error("Sync failed");
    }
  };

  // Calculated values
  const subTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = Math.max(0, subTotal - discount);

  const balanceDue = tenderedCash - total;
  const balanceLabel = balanceDue > 0 ? "Change" : "Owings";

  const openCustomerModal = useCallback(async () => {
    const result = await openModal(CustomerModal, {
      side: "right",
      size: "lg",
    });
    if (result) {
      setSelectedCustomer(result?.full_name);
    }
    //eslint-disable-next-line
  }, [selectedCustomer]);

  const cleanupOrderData = async (message: any) => {
    toast.success(message || "Order submitted successfully");
    setCartItems([]);
    setDiscount(0);
    setSelectedCustomer(null);
    setTenderedCash(0);
    setPaymentMethod("Cash");
    setReferenceId("");
    setIsCartOpen(false);

    // Refresh products to update stock if online
    if (isOnline) {
      fetchProducts(1, searchTerm, selectedCategory);
    }

    // Try to sync orders if we're online (for the fallback case)
    if (isOnline) {
      setTimeout(() => syncService.syncOrders(), 1000);
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-row gap-6 h-full">
        {/* Products Section */}
        <div className="flex-1 h-full bg-background min-w-0">

          {/* Header */}
          <div className="rounded-sm shadow-sm mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                {" "}
                {/* Added min-w-0 to prevent text overflow */}
                <h1 className="text-2xl font-bold text-text truncate">
                  Products
                </h1>
                <p className="text-text-light mt-1 truncate">
                  Browse and add items to your cart
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-64 -mb-5">
                  {" "}
                  {/* Fixed width on sm+ */}
                  <Input
                    type="text"
                    label="Search products..."
                    value={searchTerm}
                    onChange={searchProducts}
                    prefixIcon="search"
                  />
                </div>

                {/* Cart counter for mobile */}
                <div className="lg:hidden relative flex-shrink-0">
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center relative"
                    aria-label="View Cart"
                  >
                    <i className="ri-shopping-cart-2-line text-xl"></i>
                    {cartItems.length > 0 && (
                      <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-5 h-5 bg-danger text-xs text-white rounded-full flex items-center justify-center">
                        {cartItems.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              {isOnline && (
                <Button onClick={handleManualSync} className="flex-shrink-0">
                  Sync Products
                </Button>
              )}
            </div>

            {/* Categories - Fixed section */}
            <div className="mt-4 w-full">
              <div className="relative">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-2">
                  <div className="flex items-center space-x-2 py-1 min-w-max">
                    {" "}
                    {/* Changed to min-w-max */}
                    {categories.map((category: SelectOption) => (
                      <Button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          fetchProducts(1, searchTerm, category.value);
                        }}
                        variant={
                          selectedCategory === category.value
                            ? "primary"
                            : "ghost"
                        }
                        className="whitespace-nowrap flex-shrink-0" // Ensures buttons don't shrink
                      >
                        {category.label || category.value}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Optional: Gradient fade effect on right side */}
                <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
          {/* Products Grid - Scrollable Container */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4 bg-background rounded-sm">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  ref={index === products.length - 1 ? lastProductRef : null}
                  className={`group bg-card rounded-sm shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden ${
                    !product.is_available || product.stock === 0
                      ? "opacity-50"
                      : "hover:scale-105"
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative aspect-square">
                    <img
                      src={product.image_url}
                      alt={product.image_alt}
                      className="w-full h-full object-cover"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-danger-5 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm bg-danger px-2 py-1 rounded-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text text-sm line-clamp-2 flex-1 min-w-0">
                        {product.short_name}
                      </h3>
                      <span className="text-xs text-text-light bg-background px-2 py-1 rounded ml-2 whitespace-nowrap flex-shrink-0">
                        {product.selling_unit_quantity}x
                        {product.content_measurement}{product.content_unit} / {product.selling_unit}
                      </span>
                    </div>

                    <p className="text-xs text-text-light mb-3 line-clamp-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 10
                            ? "bg-success-10 text-success"
                            : product.stock > 0
                            ? "bg-info-10 text-info"
                            : "bg-danger-10 text-danger"
                        }`}
                      >
                        {formatQuantity(product.stock)} {product.selling_unit}s in stock
                      </span>
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-md font-bold text-primary">
                        GHC {product.price?.toFixed(2)}
                      </span>
                    </div>

                    {/* Add to Cart Buttons */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button
                        onClick={() => addQuarterToCart(product)}
                        disabled={!product.is_available || product.stock === 0}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        ¼
                      </Button>
                      <Button
                        onClick={() => addHalfToCart(product)}
                        disabled={!product.is_available || product.stock === 0}
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                      >
                        ½
                      </Button>
                      <Button
                        onClick={() => addToCart(product)}
                        disabled={!product.is_available || product.stock === 0}
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-w-0 truncate"
                      >
                        Add (1 {product.selling_unit})
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* End of results */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No more products to load
              </div>
            )}
          </div>
        </div>

        {/* Cart Section - DESKTOP ONLY */}
        <div className="hidden lg:block lg:w-96 h-full border border-border flex-shrink-0">
          <CartContent
            cartItems={cartItems}
            subTotal={subTotal}
            total={total}
            discount={discount}
            tenderedCash={tenderedCash}
            paymentMethod={paymentMethod}
            referenceId={referenceId}
            balanceDue={balanceDue}
            balanceLabel={balanceLabel}
            selectedCustomer={selectedCustomer}
            paymentOptions={paymentOptions}
            creatingOrder={creatingOrder}
            setDiscount={setDiscount}
            setTenderedCash={setTenderedCash}
            setPaymentMethod={setPaymentMethod}
            setReferenceId={setReferenceId}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            openCustomerModal={openCustomerModal}
            submitOrder={submitOrder}
            holdOrder={holdOrder}
            addToCart={addToCart}
            addQuarterToCart={addQuarterToCart}
            addHalfToCart={addHalfToCart}
            addThreeQuarterToCart={addThreeQuarterToCart}
          />
        </div>
      </div>

      {/* Cart Modal for Mobile (Full Screen Drawer/Modal) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          ></div>

          {/* Modal/Drawer Content (Slide from right or bottom) */}
          <div className="absolute right-0 top-0 w-full h-full sm:w-3/4 md:w-1/2 lg:w-96 bg-card shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Modal Header with Close Button */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-card">
              <h2 className="text-2xl font-bold text-text">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-text-light hover:text-text transition-colors"
                aria-label="Close Cart"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* Cart Content (The reusable component) */}
            <div className="flex-1 overflow-y-auto">
              <CartContent
                cartItems={cartItems}
                subTotal={subTotal}
                total={total}
                discount={discount}
                tenderedCash={tenderedCash}
                paymentMethod={paymentMethod}
                referenceId={referenceId}
                balanceDue={balanceDue}
                balanceLabel={balanceLabel}
                selectedCustomer={selectedCustomer}
                paymentOptions={paymentOptions}
                creatingOrder={creatingOrder}
                setDiscount={setDiscount}
                setTenderedCash={setTenderedCash}
                setPaymentMethod={setPaymentMethod}
                setReferenceId={setReferenceId}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                openCustomerModal={openCustomerModal}
                submitOrder={submitOrder}
                holdOrder={holdOrder}
                addToCart={addToCart}
                addQuarterToCart={addQuarterToCart}
                addHalfToCart={addHalfToCart}
                addThreeQuarterToCart={addThreeQuarterToCart}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernStore;
