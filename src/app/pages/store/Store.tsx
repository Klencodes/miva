import React, { useState, useEffect, useCallback, useRef } from "react";
import { IResponse } from "../../../core/interfaces/IResponse";
import { eventService } from "../../../core/services/events";
import { toast } from "sonner";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct, CartItem } from "../../../core/interfaces/IProduct";
import { networkService } from "../../../core/services/connection";
import { indexedDBService } from "../../../core/services/indexdb";
import { syncService } from "../../../core/services/sync";
import { useStore } from "../../../core/hooks/useStore";
import { useModal } from "../../../core/hooks/useModal";
import CustomerModal from "./CustomerModal";
import { formatQuantity } from "../../../core/utils/formatQuantity";

const ModernStore: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [isOnline, setIsOnline] = useState(networkService.isOnline());
  const { user } = useStore();
  const { openModal } = useModal();
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

  // Network status listener
  useEffect(() => {
    setIsOnline(networkService.isOnline());
    // eslint-disable-next-line
  }, [networkService.isOnline()]);

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
        const params = { page: pageParam, search, category, };
        let response: IResponse;
        if (isOnline) {
          try {
            // Try to fetch from server first
            const serverResponse: IResponse = await appService.getProducts(params);

            if (serverResponse.success) {
              // Convert to our response format
              response = {
                success: serverResponse.success,
                message: serverResponse.message,
                results: serverResponse.results,
                next: serverResponse.next || null,
                count: serverResponse.count || serverResponse.results.length,
                previous: serverResponse.previous || null,
              };

              // Cache the results in IndexedDB
              if (pageParam === 1 && !search && category === "All") {
                // Only cache full product list, not filtered searches
                await indexedDBService.saveProducts(serverResponse.results);
                await indexedDBService.setLastSyncTime();
              }
            } else {
              throw new Error("Server response not successful");
            }
          } catch (serverError) {
            console.warn(
              "Server fetch failed, falling back to IndexedDB:",
              serverError
            );
            // Fall through to IndexedDB
            response = await indexedDBService.getProducts(params);
          }
        } else {
          // Use IndexedDB when offline
          console.log("📦 Offline mode: Loading products from IndexedDB");
          response = await indexedDBService.getProducts(params);
        }

        if (response.success) {
          setProducts((prev) => {
            if (pageParam === 1) {
              return response.results;
            }
            return [...prev, ...response.results];
          });

          setHasMore(!!response.next);
          setPage(pageParam);

          if (pageParam === 1) {
            const uniqueCategories: any[] = [
              "All",
              ...Array.from(
                new Set(response.results.map((p: IProduct) => p.category_name))
              ),
            ];
            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [isOnline]
  );

  // Submit order with direct implementation
  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // if (!selectedCustomer) {
    //   toast.error("Please select a customer");
    //   return;
    // }
    setCreatingOrder(true);
    
    const order = {
      cashier: `${user!.first_name} ${user!.last_name[0]}`,
      customer: selectedCustomer,
      total: parseFloat(total?.toFixed(2)),
      subtotal: parseFloat(subTotal?.toFixed(2)),
      discount: discount,
      tendered_cash: tenderedCash,
      balance: parseFloat(balanceDue?.toFixed(2)),
      balance_label: balanceLabel,

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
      let response;

      if (isOnline) {
        try {
          // Try to submit to server first
          const serverResponse = await appService.createOrder(order);

          if (serverResponse.success) {
            response = {
              success: true,
              order_id: serverResponse.order_id,
              message: "Order submitted successfully",
            };
          } else {
            throw new Error("Server rejected order");
          }
        } catch (serverError) {
          console.warn(
            "Server submission failed, saving locally:",
            serverError
          );
          // Fall through to local storage
          response = await indexedDBService.createOrder(order);
        }
      } else {
        // Save to IndexedDB when offline
        response = await indexedDBService.createOrder(order);
      }

      if (response.success) {
        toast.success(response.message || "Order submitted successfully");
        setCartItems([]);
        setDiscount(0);
        setSelectedCustomer(null);
        setTenderedCash(0);
        setPaymentMethod("Cash");
        setReferenceId("");

        // Refresh products to update stock if online
        if (isOnline) {
          fetchProducts(1, searchTerm, selectedCategory);
        }

        // Try to sync orders if we're online (for the fallback case)
        if (isOnline) {
          setTimeout(() => syncService.syncOrders(), 1000);
        }
      }
    } catch (error) {
      console.error("Order submission failed:", error);
      toast.error("Failed to submit order");
    } finally {
      setCreatingOrder(false);
    }
  };

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
        toast.warning(`${product.short_name} quantity updated to ${formatQuantity(newQuantity)}`, {
          duration: 3000,
           id: `cart-update-${product.id}`, 
        });
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
    toast.warning(`${product.short_name} quantity updated to ${formatQuantity(newQuantity)}`, {
      duration: 3000,
    });
  };

  // const toggleItemDetails = (productId: string) => {
  //   setCartItems((prev) =>
  //     prev.map((item) =>
  //       item.id === productId ? { ...item, expanded: !item.expanded } : item
  //     )
  //   );
  // };

  const applyDiscount = (amount: number) => {
    setDiscount(amount);
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

  return (
      <div className="w-full h-full">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Products Section */}
          <div className="flex-1 flex flex-col h-full bg-background">
            {/* Header */}
            <div className="rounded-sm shadow-sm px-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text">Products</h1>
                  <p className="text-text-light mt-1">
                    Browse and add items to your cart
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                
                    <Input
                      type="text"
                      label="Search products..."
                      value={searchTerm}
                      onChange={searchProducts}
                      
                    />
                  </div>

                  {/* Cart counter for mobile */}
                  <div className="lg:hidden relative">
                    <button className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
                      <span className="font-semibold">{cartItems.length}</span>
                    </button>
                  </div>
                </div>
                 {isOnline && (
                  <Button
                    onClick={handleManualSync}
                    // size="sm"
                  >
                    Sync Products
                  </Button>
                )}
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mt-6">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      fetchProducts(1, searchTerm, category);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-primary text-white shadow-md"
                        : "bg-background text-text hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid - Scrollable Container */}
            <div className="flex-1 overflow-y-auto px-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xxl:grid-cols-5 gap-4 pb-4 bg-background rounded-sm">
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
                        <div className="absolute inset-0 bg-danger flex items-center justify-center">
                          <span className="text-white font-semibold text-sm bg-red-600 px-2 py-1 rounded-sm">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-text text-sm line-clamp-2 flex-1">
                          {product.short_name}
                        </h3>
                        <span className="text-xs text-text-light bg-background px-2 py-1 rounded ml-2 whitespace-nowrap">
                          {product.selling_unit_quantity}x
                          {product.content_measurement} / {product.selling_unit}
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
                          {product.stock} {product.selling_unit}s in stock
                        </span>
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-md font-bold text-primary">
                          GHC {product.price?.toFixed(2)}
                        </span>
                      </div>

                      {/* Add to Cart Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => addQuarterToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          variant="ghost"
                          size="sm"
                        >
                          ¼
                        </Button>
                        <Button
                          onClick={() => addHalfToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          variant="ghost"
                          size="sm"
                        >
                          ½
                        </Button>
                        <Button
                          onClick={() => addToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          variant="ghost"
                          size="sm"
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

          {/* Cart Section - Fixed Height */}
          <div className="lg:w-96 h-full border border-border">
            <div className="rounded-sm shadow-sm flex flex-col h-full">
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
                      <p className="font-semibold text-text">
                        {selectedCustomer}
                      </p>
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
                    <p className="text-md font-medium mb-2">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-center">
                      Add products from the catalog to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-card rounded-sm shadow-sm px-4 py-3"
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
                              {formatQuantity(item.quantity)}{" "}{item.selling_unit}
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

                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">Discount</span>
                      <button
                        onClick={() => applyDiscount(5)}
                        className="text-primary font-semibold"
                      >
                        - GHC {discount?.toFixed(2)}
                      </button>
                    </div>

                    <div className="flex justify-between text-md font-bold pt-2 border-t border-border">
                      <span className="text-text">Total</span>
                      <span className="text-text">
                        GHC {total?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">{balanceLabel}</span>
                      <span className={`font-semibold text-${balanceDue < 0 ? "danger" : "success"}`}>
                        GHC {balanceDue?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Input
                      type="number"
                      id="tendered-cash"
                      label="Tendered Cash"
                      value={tenderedCash}
                      onChange={(value:number) => setTenderedCash(value)}
                    />
                    <Input
                      id="payment-method"
                      label="Payment Method"
                      type="select"
                      selectOptions={paymentOptions}
                      value={paymentMethod}
                      onChange={(value: string) => setPaymentMethod(value)}
                    />
                    {paymentMethod === "Mobile Money" && (
                      <Input
                        type="text"
                        id="reference-id"
                        label="Reference ID"
                        value={referenceId}
                        onChange={(value: string) => setReferenceId(value)}
                      />
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setCartItems([])}
                      variant="ghost"
                      size="sm"
                    >
                      Hold Order
                    </Button>
                    <Button
                      onClick={submitOrder}
                      size="sm"
                      disabled={cartItems.length === 0 || creatingOrder}
                      loading={creatingOrder}
                    >
                      {isOnline ? "Submit Order" : "Save Order Offline"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default ModernStore;
