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
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import CartContent from "./CartContent";
import HoldOrdersModal from "./HoldOrders";

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];
  // const [holdOrders, setHoldOrders] = useState<any[]>([]);
  const { user } = useStore();
  const { openModal } = useModal();
  const isOnline = useNetworkStatus();

  // Refs
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  const fetchProductsRef = useRef<
    | ((
        pageParam?: number,
        search?: string,
        category?: string
      ) => Promise<void>)
    | null
  >(null);



  // Update refs when state changes
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Create fetchProducts function with stable dependencies
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

        if (isOnlineRef.current) {
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

          // Mark initial load as complete
          if (pageParam === 1) {
            setInitialLoadComplete(true);
          }
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
    [] // Empty dependencies - using refs instead
  );

  // Store fetchProducts in ref
  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  // Fetch categories on mount
  useEffect(() => {
    const getProductExtraData = async () => {
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
    getProductExtraData();
  }, []);

  // Initial load
  useEffect(() => {
    if (fetchProductsRef.current) {
      fetchProductsRef.current();
    }
  }, []); // Run only once on mount

  // Handle network status changes
  useEffect(() => {
    if (initialLoadComplete && isOnline) {
      // Refresh products when coming back online
      if (fetchProductsRef.current) {
        fetchProductsRef.current(1, searchTerm, selectedCategory);
      }
    }
  }, [isOnline, initialLoadComplete, searchTerm, selectedCategory]);

  // Event listener for refresh
  useEffect(() => {
    const handleRefresh = () => {
      if (fetchProductsRef.current) {
        fetchProductsRef.current(1, searchTerm, selectedCategory);
      }
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [searchTerm, selectedCategory]);



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

  // Submit order
  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setCreatingOrder(true);

    try {

      // ALWAYS save to IndexedDB first
      const localResponse = await indexedDBService.createOrder(
        prepareOrder as any
      );

      if (!localResponse.success) {
        throw new Error("Failed to save order locally");
      }

      const localOrderId = localResponse.results?.id;

      // If online, try to sync to server immediately
      if (isOnline) {
        try {
          const serverResponse = await appService.createOrder(prepareOrder);

          if (serverResponse.success) {

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
      if (fetchProductsRef.current) {
        await fetchProductsRef.current(1, term, selectedCategory);
      }
    },
    [selectedCategory]
  ); // Only selectedCategory as dependency

  // Load more function
  const loadMoreProducts = useCallback(() => {
    if (!loadingRef.current && hasMore && fetchProductsRef.current) {
      fetchProductsRef.current(
        pageRef.current + 1,
        searchTerm,
        selectedCategory
      );
    }
  }, [hasMore, searchTerm, selectedCategory]);

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
      toast.info("Syncing products...");
      const result = await syncService.syncProducts();

      if (result.success) {
        toast.success("Products synced successfully");
        // Refresh current view
        if (fetchProductsRef.current) {
          fetchProductsRef.current(1, searchTerm, selectedCategory);
        }
      }
    } catch (error) {
      toast.error("Sync failed");
    }
  };

  // Calculated values
  const subTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subTotal - discount);

  const balanceDue = tenderedCash - total;
  const balanceLabel = balanceDue > 0 ? "Change" : "Owings";
  
  const openCustomerModal = async () => {
    const result = await openModal(CustomerModal, {
      side: "right",
      size: "lg",
    });
    if (result) {
      setSelectedCustomer(result?.full_name);
    }
  };

  const prepareOrder = {
    cashier: `${user?.first_name} ${user?.last_name[0]}`,
    customer: selectedCustomer || "Walk-in Customer",
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

  const openHoldOrdersModal = useCallback(async () => {
    const result = await openModal(HoldOrdersModal, {
      side: "right",
      size: "lg",
    });
    if (result?.success && result?.orderId) {
      try {
        const holdOrderId = result.orderId;
        // Get order from IndexedDB
        const response = await indexedDBService.getHoldOrderById(holdOrderId);

        if (response.success && response.results) {
          const order = response.results;

          // Convert order items to cart items
          const cartItemsFromHold = order.items.map((item: any) => ({
            ...item,
            expanded: false,
            quantity: item.quantity,
          }));

          // Set cart with order items
          setCartItems(cartItemsFromHold);
          
          // Set other order details
          setSelectedCustomer(
            order.customer === "Walk-in Customer" ? null : order.customer
          );
          setDiscount(order.discount || 0);

          // Show success and close modal
          toast.success(`Order ${order.code} retrieved`);

          // Delete the hold order from IndexedDB since we're retrieving it
          await indexedDBService.deleteHoldOrder(holdOrderId);

          //  // Update local hold orders list
          //  setHoldOrders(prev => prev.filter(order =>
          //    order.id !== holdOrderId && order.local_id !== holdOrderId
          //  ));
        } else {
          toast.error("Failed to retrieve hold order");
        }
      } catch (error) {
        toast.error("Error retrieving hold order");
      }
    }
    // eslint-disable-next-line 
  }, [cartItems]);

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
    if (isOnline && fetchProductsRef.current) {
      fetchProductsRef.current(1, searchTerm, selectedCategory);
    }

    // Try to sync orders if we're online (for the fallback case)
    if (isOnline) {
      setTimeout(() => syncService.syncOrders(), 1000);
    }
  };

  // Hold Order Function
  const holdOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      const localResponse = await indexedDBService.createHoldOrder(
        prepareOrder
      );

      if (!localResponse.success) {
        throw new Error("Failed to save hold order locally");
      }

      // Update local hold orders list
      // setHoldOrders(prev => [...prev, {
      //   ...prepareOrder,
      //   id: localResponse.results?.id,
      //   local_id: localResponse.results?.id,
      // }]);

      // Clear cart and show success
      toast.success("Order on hold", {
        description: `Order ${prepareOrder.code} saved for later`,
        duration: 5000,
        action: {
          label: "View Holds",
          onClick: () => openHoldOrdersModal(),
        },
      });

      // Clear the cart
      setCartItems([]);
      setDiscount(0);
      setSelectedCustomer(null);
      setTenderedCash(0);
      setPaymentMethod("Cash");
      setReferenceId("");
      setIsCartOpen(false);
    } catch (error) {
      toast.error("Failed to put order on hold");
      console.error("Hold order error:", error);
    }
  };

  return (
    <div className="h-[calc(100%-120px)] flex flex-col">
      <div className="flex flex-row gap-6 w-full h-full">
        {/* Products Section */}
        <div className="flex-1 h-full bg-background min-w-0">
          {/* Header */}
          <div className="rounded-sm shadow-sm mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
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
                    {/* Changed to min-w-max */}
                    {categories.map((category: SelectOption) => (
                      <Button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          if (fetchProductsRef.current) {
                            fetchProductsRef.current(
                              1,
                              searchTerm,
                              category.value
                            );
                          }
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
          <div className="flex-1 overflow-y-auto h-full px-2">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 bg-background">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  ref={index === products.length - 1 ? lastProductRef : null}
                  className="group"
                >
                  <div
                    className={`relative bg-background rounded-sm shadow-sm hover:shadow-sm border border-border transition-all duration-400 overflow-hidden ${
                      !product.is_available || product.stock === 0
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    {/* Image with stock badge overlay */}
                    <div className="relative h-40 bg-card overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                      <img
                        src={product.image_url}
                        alt={product.image_alt}
                        className="w-full h-full object-cover"
                      />

                      {/* Stock Badge - Overlay at top right */}
                      <div
                        className={`absolute top-1 right-1 text-xs px-2 py-1 rounded-full z-10 ${
                          product.stock > 10
                            ? "bg-success text-white"
                            : product.stock > 0
                            ? "bg-info text-white"
                            : "bg-danger text-white"
                        }`}
                      >
                        {formatQuantity(product.stock)} left
                      </div>

                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-background backdrop-blur-[2px] flex items-center justify-center">
                          <div className="bg-card text-text px-3 py-1.5 rounded-full text-xs font-medium">
                            Sold Out
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Title & Details */}
                      <div className="mb-2">
                        <h3 className="font-medium text-text text-sm line-clamp-1 mb-1">
                          {product.short_name}
                        </h3>
                        <p className="text-xs text-text-light">
                          {product.selling_unit_quantity}x
                          {product.content_measurement}
                          {product.content_unit} / {product.selling_unit}
                        </p>
                      </div>

                      {/* Stock & Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-right">
                          <div className="font-bold text-text">
                            GHC {product.price?.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`grid grid-cols-${product.selling_unit_quantity > 1 ? '3': '1'} gap-1.5`}>
                        {product.selling_unit_quantity > 1 && (<button
                          onClick={() => addQuarterToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          className="h-8 rounded-sm border border-border text-text rounded-sm text-xs disabled:opacity-30 transition-colors"
                        >
                          ¼
                        </button>)}
                        {product.selling_unit_quantity > 1 && (<button
                          onClick={() => addHalfToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          className="h-8 rounded-sm border border-border text-text rounded-sm text-xs disabled:opacity-30 transition-colors"
                        >
                          ½
                        </button>)}
                        <button
                          onClick={() => addToCart(product)}
                          disabled={
                            !product.is_available || product.stock === 0
                          }
                          className="h-8 bg-primary text-white rounded-sm text-xs font-medium disabled:bg-primary-40 transition-colors"
                        >
                          Add 1
                        </button>
                      </div>
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
              <div className="text-center py-8 text-text-light">
                No more products to load
              </div>
            )}
          </div>
        </div>

        {/* Cart Section - DESKTOP ONLY */}
        <div className="hidden lg:block lg:w-96 h-full border border-border h-[calc(100%+125px)]">
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
            openHoldOrdersModal={openHoldOrdersModal}
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
                openHoldOrdersModal={openHoldOrdersModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernStore;
