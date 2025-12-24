import React, { useState, useEffect, useCallback, useRef } from "react";
import { IResponse } from "../../../core/interfaces/IResponse";
import { eventService } from "../../../core/services/events";
import { toast } from "sonner";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct, CartItem } from "../../../core/interfaces/IProduct";
import { indexedDBService } from "../../../core/services/indexdb";
import { syncService } from "../../../core/services/sync";
import { ENTITY_KEY, getStoredItem, useStore } from "../../../core/hooks/useStore";
import { useModal } from "../../../core/hooks/useModal";
import CustomerModal from "./CustomerModal";
import { formatQuantity } from "../../../core/utils/formatQuantity";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import CartContent from "./CartContent";
import HoldOrdersModal from "./HoldOrders";
import { printReceiptDirectly } from "../../../core/utils/receipt";
import { IEntityItem } from "../../../core/interfaces/IEntity";
import { FormErrors, OrderFormData } from "../../../core/interfaces/IStore";
import { useOrderCalculations } from "../../../core/hooks/useOrderCalculations";


const ModernStore: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Order Form Data
  const [orderFormData, setOrderFormData] = useState<OrderFormData>({
    discount: "0",
    tenderedCash: "0",
    paymentMethod: "Cash",
    transactionId: "",
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];
  
  const { user } = useStore();
  const { openModal } = useModal();
  const isOnline = useNetworkStatus();
  const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

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

const handleFormChange = (name: keyof OrderFormData) => (value: any) => {
  // Validate before updating state
  if (name === 'tenderedCash' || name === 'discount') {
    // Parse the value first
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Validate numeric values immediately
    if (name === 'tenderedCash') {
      if (isNaN(numericValue) || numericValue < 0) {
        value = "0";
      } else {
        value = numericValue.toString();
      }
    }
    
    if (name === 'discount') {
      if (isNaN(numericValue) || numericValue < 0) {
        value = "0";
      } else {
        value = numericValue.toString();
      }
    }
  }

  setOrderFormData((prev) => ({ ...prev, [name]: value }));

  // Clear error for this field when user starts typing
  if (formErrors[name]) {
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }
};

const handleFormBlur = (field: keyof OrderFormData) => {
  // Use current orderFormData for validation
  const currentDiscount = orderFormData.discount;
  const currentTenderedCash = orderFormData.tenderedCash;
  
  const errors: FormErrors = {};
  
  if (field === 'discount') {
    const discountValue = parseFloat(currentDiscount);
    if (isNaN(discountValue) || discountValue < 0) {
      errors.discount = "Discount must be a positive number";
    } else if (discountValue > subTotal) {
      errors.discount = "Discount cannot exceed subtotal";
    }
  }
  
  if (field === 'tenderedCash') {
    const tenderedCashValue = parseFloat(currentTenderedCash);
    if (isNaN(tenderedCashValue) || tenderedCashValue < 0) {
      errors.tenderedCash = "Amount must be a positive number";
    }
  }
  
  if (field === 'paymentMethod') {
    if (!orderFormData.paymentMethod?.trim()) {
      errors.paymentMethod = "Payment method is required";
    }
  }
  
  if (field === 'transactionId' && orderFormData.paymentMethod !== 'Cash') {
    if (!orderFormData.transactionId?.trim()) {
      errors.transactionId = "Reference ID is required for non-cash payments";
    }
  }
  
  setFormErrors(prev => ({ ...prev, ...errors }));
};


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
            const serverResponse: IResponse = await appService.getAllProducts(
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

    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `G-${datePart}${randomPart}`;
  };

const {
  subTotal,
  discountValue,
  total,
  tenderedCashValue,
  balanceDue,
  balanceLabel,
} = useOrderCalculations(cartItems, orderFormData);

  // Submit order
  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate form
    const errors: FormErrors = {};
    
    if (discountValue < 0) {
      errors.discount = "Discount cannot be negative";
    }
    
    if (discountValue > subTotal) {
      errors.discount = "Discount cannot exceed subtotal";
    }
    
    if (tenderedCashValue < 0) {
      errors.tenderedCash = "Amount cannot be negative";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix form errors");
      return;
    }

    setCreatingOrder(true);

    try {
      const orderData = prepareOrder();
      
      // ALWAYS save to IndexedDB first
      const localResponse = await indexedDBService.createOrder(orderData);

      if (!localResponse.success) {
        throw new Error("Failed to save order locally");
      }

      const localOrderId = localResponse.results?.id;
      let orderDataForPrint = localResponse.results; 

      // If online, try to sync to server immediately
      if (isOnline) {
        try {
          const serverResponse = await appService.createOrder(orderData);

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
              
              // Update order data for printing with server info
              orderDataForPrint = {
                ...orderDataForPrint,
                id: serverOrderId,
                code: serverCode,
                created_at: serverCreatedAt
              };
            }

            // Print receipt after successful sync
            await cleanupOrderData("Order submitted successfully!");
            printReceiptDirectly(orderDataForPrint, entity!);

          } else {
            // Print receipt for locally saved order
            await cleanupOrderData("Order saved locally - will retry sync");
            printReceiptDirectly(orderDataForPrint, entity!);
          }
        } catch (serverError) {
          // Print receipt for locally saved order even if sync failed
          await cleanupOrderData("Order saved locally - sync failed, will retry");
          printReceiptDirectly(orderDataForPrint, entity!);
        }
      } else {
        // Print receipt for offline order
        await cleanupOrderData("Order saved offline - will sync when back online");
        printReceiptDirectly(orderDataForPrint, entity!);
      }
    } catch (error) {
      toast.error("Failed to save order");
      console.error("Order submission error:", error);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Prepare order data with NaN protection
  const prepareOrder = () => {
    return {
      cashier: `${user?.first_name} ${user?.last_name?.[0] || ""}`.trim() || "Cashier",
      customer: selectedCustomer || "Walk-in Customer",
      total: parseFloat(total?.toFixed(2)) || 0,
      subtotal: parseFloat(subTotal?.toFixed(2)) || 0,
      discount: discountValue || 0,
      tendered_cash: tenderedCashValue || 0,
      balance: parseFloat(balanceDue?.toFixed(2)) || 0,
      balance_label: balanceLabel,
      code: generateOrderCode(),
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity || 0,
        unit_price: item.price || 0,
        product_name: item.name || "",
        short_name: item.short_name || "",
        category_name: item.category_name || "",
        content_measurement: item.content_measurement || "",
        content_unit: item.content_unit || "",
        selling_unit_quantity: item.selling_unit_quantity || 1,
        selling_unit: item.selling_unit || "",
        image_url: item.image_url || "",
        image_alt: item.image_alt || "",
      })),
      payment: {
        payment_method: orderFormData.paymentMethod || "Cash",
        amount_paid: tenderedCashValue || 0,
        transaction_id: orderFormData.transactionId || "",
      },
    };
  };

  // Cart functions
  const addToCart = (product: IProduct, quantity: number = 1) => {
    if (!product.is_available || product.stock === 0) {
      toast.error("Product is out of stock", { duration: 3000 });
      return;
    }
      if (Number(product.price) < 1) {
      toast.error("Product price is not set, contact owner", { duration: 3000 });
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
  );

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

  const openCustomerModal = async () => {
    const result = await openModal(CustomerModal, {
      side: "right",
      size: "lg",
    });
    if (result) {
      setSelectedCustomer(result?.full_name);
    }
  };

// Create a utility function for hold order calculations
const calculateHoldOrderTotals = (order: any) => {
  // Calculate subtotal from items
  const subTotal = order.items.reduce((sum: number, item: any) => {
    const price = parseFloat(item.unit_price) || parseFloat(item.price) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  // Calculate discount (ensure it doesn't exceed subtotal)
  const discount = parseFloat(order.discount) || 0;
  const safeDiscount = Math.min(Math.max(0, discount), subTotal);

  // Calculate total
  const total = Math.max(0, subTotal - safeDiscount);

  // Get tendered cash
  const tenderedCash = Math.max(0, parseFloat(order.tendered_cash) || 0);

  // Calculate balance
  const balance = tenderedCash - total;

  return {
    subTotal,
    discount: safeDiscount,
    total,
    tenderedCash,
    balance,
    balanceLabel: balance >= 0 ? "Change" : "Owings"
  };
};

// Use it in your function
const openHoldOrdersModal = useCallback(async () => {
  const result = await openModal(HoldOrdersModal, {
    side: "right",
    size: "lg",
  });
  
  if (result?.success && result?.orderId) {
    try {
      const response = await indexedDBService.getHoldOrderById(result.orderId);

      if (response.success && response.results) {
        const order = response.results;
        const totals = calculateHoldOrderTotals(order);

        // Convert items
        const cartItemsFromHold = order.items.map((item: any) => ({
          id: item.product_id || item.id,
          name: item.product_name || item.name || '',
          short_name: item.short_name || item.product_name || '',
          price: parseFloat(item.unit_price) || parseFloat(item.price) || 0,
          quantity: parseFloat(item.quantity) || 0,
          stock: parseFloat(item.stock) || 0,
          is_available: true,
          image_url: item.image_url || '',
          image_alt: item.image_alt || '',
          category_name: item.category_name || '',
          content_measurement: item.content_measurement || '',
          content_unit: item.content_unit || '',
          selling_unit_quantity: parseInt(item.selling_unit_quantity) || 1,
          selling_unit: item.selling_unit || '',
          expanded: false
        }));

        // Update state
        setCartItems(cartItemsFromHold);
        setSelectedCustomer(
          order.customer === "Walk-in Customer" ? null : order.customer
        );
        
        setOrderFormData({
          discount: totals.discount.toString(),
          tenderedCash: totals.tenderedCash.toString(),
          paymentMethod: order.payment?.payment_method || "Cash",
          transactionId: order.payment?.transaction_id || "",
        });

        toast.success(`Order ${order.code} retrieved`);
        await indexedDBService.deleteHoldOrder(result.orderId);
        
        if (window.innerWidth < 1024) {
          setIsCartOpen(true);
        }
      }
    } catch (error) {
      toast.error("Error retrieving hold order");
      console.error("Retrieve hold order error:", error);
    }
  }
}, 
// eslint-disable-next-line
[]);

  const cleanupOrderData = async (message: any) => {
    toast.success(message || "Order submitted successfully");
    setCartItems([]);
    setOrderFormData({
      discount: "0",
      tenderedCash: "0",
      paymentMethod: "Cash",
      transactionId: "",
    });
    setSelectedCustomer(null);
    setIsCartOpen(false);
    setFormErrors({});

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
      const orderData = prepareOrder();
      const localResponse = await indexedDBService.createHoldOrder(orderData);

      if (!localResponse.success) {
        throw new Error("Failed to save hold order locally");
      }

      // Clear cart and show success
      toast.success("Order on hold", {
        description: `Order ${orderData.code} saved for later`,
        duration: 5000,
        action: {
          label: "View Holds",
          onClick: () => openHoldOrdersModal(),
        },
      });

      // Clear the cart
      setCartItems([]);
      setOrderFormData({
        discount: "0",
        tenderedCash: "0",
        paymentMethod: "Cash",
        transactionId: "",
      });
      setSelectedCustomer(null);
      setIsCartOpen(false);
      setFormErrors({});
    } catch (error) {
      toast.error("Failed to put order on hold");
      console.error("Hold order error:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-row gap-6 w-full h-full">
        {/* Products Section */}
        <div className="flex-1 bg-background min-w-0 h-[calc(100%-120px)]">
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
                  key={`${product.id}-${index}`}
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
                      <div
                        className={
                          product.selling_unit_quantity > 1
                            ? "grid grid-cols-3 gap-1.5"
                            : "grid grid-cols-1 gap-1.5"
                        }
                      >
                        {/* The ¼ button */}
                        {product.selling_unit_quantity > 1 && (
                          <button
                            onClick={() => addQuarterToCart(product)}
                            disabled={
                              !product.is_available || product.stock === 0
                            }
                            className="h-8 rounded-sm border border-border text-text text-xs disabled:opacity-30 transition-colors"
                          >
                            ¼
                          </button>
                        )}

                        {/* The ½ button */}
                        {product.selling_unit_quantity > 1 && (
                          <button
                            onClick={() => addHalfToCart(product)}
                            disabled={
                              !product.is_available || product.stock === 0
                            }
                            className="h-8 rounded-sm border border-border text-text text-xs disabled:opacity-30 transition-colors"
                          >
                            ½
                          </button>
                        )}

                        {/* The Add 1 button */}
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
        <div className="hidden lg:block lg:w-96 h-full border border-border h-[calc(100%+120px)] ">
          <CartContent
            cartItems={cartItems}
            subTotal={subTotal}
            total={total}
            discount={discountValue.toString()}
            tenderedCash={tenderedCashValue.toString()}
            paymentMethod={orderFormData.paymentMethod}
            transactionId={orderFormData.transactionId}
            balanceDue={balanceDue}
            balanceLabel={balanceLabel}
            selectedCustomer={selectedCustomer}
            paymentOptions={paymentOptions}
            creatingOrder={creatingOrder}
            setDiscount={(value) => handleFormChange('discount')(value.toString())}
            setTenderedCash={(value) => handleFormChange('tenderedCash')(value.toString())}
            setPaymentMethod={(value) => handleFormChange('paymentMethod')(value)}
            setTransactionId={(value) => handleFormChange('transactionId')(value)}
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
            formErrors={formErrors}
            handleFormBlur={handleFormBlur}
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
            <div className="flex justify-end items-center p-4 border-b border-border bg-card mt-12">
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
                discount={discountValue.toString()}
                tenderedCash={tenderedCashValue.toString()}
                paymentMethod={orderFormData.paymentMethod}
                transactionId={orderFormData.transactionId}
                balanceDue={balanceDue}
                balanceLabel={balanceLabel}
                selectedCustomer={selectedCustomer}
                paymentOptions={paymentOptions}
                creatingOrder={creatingOrder}
                setDiscount={(value) => handleFormChange('discount')(value.toString())}
                setTenderedCash={(value) => handleFormChange('tenderedCash')(value.toString())}
                setPaymentMethod={(value) => handleFormChange('paymentMethod')(value)}
                setTransactionId={(value) => handleFormChange('transactionId')(value)}
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
                formErrors={formErrors}
                handleFormBlur={handleFormBlur}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernStore;