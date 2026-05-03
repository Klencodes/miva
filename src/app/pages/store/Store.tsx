import React, { useState, useEffect, useCallback, useRef } from "react";
import { IResponse } from "../../../core/interfaces/IResponse";
import { eventService } from "../../../core/services/events";
import { toast } from "sonner";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { IProduct, CartItem } from "../../../core/interfaces/IProduct";
import { indexedDBService } from "../../../core/services/indexdb";
import { syncService } from "../../../core/services/sync";
import {
  ENTITY_KEY,
  getStoredItem,
  useStore,
} from "../../../core/hooks/useStore";
import { useModal } from "../../../core/hooks/useModal";
import CustomerModal from "./CustomerModal";
import {
  formatQuantity,
  formatStockBadge,
} from "../../../core/utils/formatQuantity";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import CartContent from "./CartContent";
import HoldOrdersModal from "./HoldOrders";
import { printReceiptDirectly } from "../../../core/utils/receipt";
import { IEntityItem } from "../../../core/interfaces/IEntity";
import { FormErrors, OrderFormData } from "../../../core/interfaces/IStore";
import { useOrderCalculations } from "../../../core/hooks/useOrderCalculations";
import CustomQuantityModal, {
  resolvePiecesPerUnit,
  resolveUnitPrice,
} from "./CustomQuantityModal";
import { CATEGORIES } from "./categories";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { DBOrder } from "../../../core/interfaces/IDBTypes";
import { convertDBOrderToIOrder } from "../../../core/utils/order-format";

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
  const [showCustomQuantityModal, setShowCustomQuantityModal] = useState(false);
  const [selectedProductForCustomQty, setSelectedProductForCustomQty] =
    useState<IProduct | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState<number>(0);
  const [currentIsPieces, setCurrentIsPieces] = useState<boolean>(true);

  const [orderFormData, setOrderFormData] = useState<OrderFormData>({
    discount: "0",
    tenderedCash: "0",
    paymentMethod: "Cash",
    transactionId: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const paymentOptions = [
    { value: "Cash", label: "Cash" },
    { value: "Mobile Money", label: "Mobile Money" },
  ];

  const { user } = useStore();
  const { openModal } = useModal();
  const isOnline = useNetworkStatus();
  const entity = getStoredItem<IEntityItem | null>(ENTITY_KEY, null);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  const fetchProductsRef = useRef<
    | ((
        pageParam?: number,
        search?: string,
        category?: string,
      ) => Promise<void>)
    | null
  >(null);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) return;

    const syncPendingOrders = async () => {
      try {
        const localResponse = await indexedDBService.getPendingOrders();
        const pendingOrders: DBOrder[] = localResponse.results || [];

        if (pendingOrders.length === 0) return;

        let syncedCount = 0;

        for (const dbOrder of pendingOrders) {
          try {
            const orderData = convertDBOrderToIOrder(dbOrder);
            const serverResponse = await appService.createOrder(orderData);

            if (serverResponse.success) {
              await indexedDBService.deleteOrder(dbOrder.id!);
              syncedCount++;
            }
          } catch (err) {
            console.error(`Failed to sync order ${dbOrder.id}:`, err);
          }
        }

        if (syncedCount === 0) return;

        const result = await syncService.syncProducts();
        if (result.success) {
          toast.success("Products synced successfully");
          fetchProductsRef.current?.(1, debouncedSearchTerm, selectedCategory);
        }
      } catch (err) {
        console.error("Background sync error:", err);
      }
    };

    syncPendingOrders();
    // eslint-disable-next-line 
  }, [isOnline]);

  const handleFormChange = (name: keyof OrderFormData) => (value: any) => {
    if (name === "tenderedCash" || name === "discount") {
      const num = typeof value === "string" ? parseFloat(value) : value;
      value = isNaN(num) || num < 0 ? "0" : num.toString();
    }
    setOrderFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const e = { ...prev };
        delete e[name];
        return e;
      });
    }
  };

  const handleFormBlur = (field: keyof OrderFormData) => {
    const errors: FormErrors = {};
    if (field === "discount") {
      const v = parseFloat(orderFormData.discount);
      if (isNaN(v) || v < 0)
        errors.discount = "Discount must be a positive number";
      else if (v > subTotal)
        errors.discount = "Discount cannot exceed subtotal";
    }
    if (field === "tenderedCash") {
      const v = parseFloat(orderFormData.tenderedCash);
      if (isNaN(v) || v < 0)
        errors.tenderedCash = "Amount must be a positive number";
    }
    if (field === "paymentMethod" && !orderFormData.paymentMethod?.trim()) {
      errors.paymentMethod = "Payment method is required";
    }
    if (field === "transactionId" && orderFormData.paymentMethod !== "Cash") {
      if (!orderFormData.transactionId?.trim())
        errors.transactionId = "Reference ID is required for non-cash payments";
    }
    setFormErrors((prev) => ({ ...prev, ...errors }));
  };

  const fetchProducts = useCallback(
    async (pageParam = 1, search = "", category = "All") => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const params = { page: pageParam, search, category };
        let response: IResponse;
        if (isOnlineRef.current) {
          try {
            const sr = await appService.getAllProducts(params);
            if (sr.success) {
              response = {
                success: true,
                message: sr.message,
                results: sr.results,
                next: sr.next || null,
                count: sr.count || sr.results.length,
                previous: sr.previous || null,
              };
              if (sr.results?.length) {
                try {
                  await indexedDBService.saveProducts(sr.results);
                } catch {}
              }
            } else {
              const local = await indexedDBService.getProducts(params);
              response = local;
            }
          } catch {
            const local = await indexedDBService.getProducts(params);
            response = local;
          }
        } else {
          const local = await indexedDBService.getProducts(params);
          response = local;
        }
        if (response.success) {
          setProducts((prev) =>
            pageParam === 1
              ? response.results || []
              : [...prev, ...(response.results || [])],
          );
          setHasMore(!!response.next);
          setPage(pageParam);
          if (pageParam === 1) setInitialLoadComplete(true);
        } else {
          setProducts([]);
        }
      } catch {
        toast.error("Failed to load products");
        setProducts([]);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchProductsRef.current = fetchProducts;
  }, [fetchProducts]);

  useEffect(() => {
    setCategories(CATEGORIES);
  }, []);

  useEffect(() => {
    fetchProductsRef.current?.();
  }, []);

  useEffect(() => {
    if (initialLoadComplete && fetchProductsRef.current) {
      fetchProductsRef.current(1, debouncedSearchTerm, selectedCategory);
    }
  }, [debouncedSearchTerm, selectedCategory, initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete && isOnline) {
      fetchProductsRef.current?.(1, debouncedSearchTerm, selectedCategory);
    }
  }, [isOnline, initialLoadComplete, debouncedSearchTerm, selectedCategory]);

  useEffect(() => {
    const handleRefresh = () =>
      fetchProductsRef.current?.(1, debouncedSearchTerm, selectedCategory);
    eventService.onRefresh(handleRefresh);
    return () => eventService.offRefresh(handleRefresh);
  }, [debouncedSearchTerm, selectedCategory]);

  const {
    subTotal,
    discountValue,
    total,
    tenderedCashValue,
    balanceDue,
    balanceLabel,
    getPricePerPiece,
  } = useOrderCalculations(cartItems, orderFormData);

  const getStockLevel = (product: IProduct): number => {
    if (product.stock !== undefined && product.stock !== null)
      return product.stock;
    return Math.floor(
      (product.stock_in_pieces ?? 0) / (product.selling_unit_quantity || 1),
    );
  };

  const deductStockLocally = (soldItems: CartItem[]) => {
    setProducts((prev) =>
      prev.map((product) => {
        const soldItem = soldItems.find((item) => item.id === product.id);
        if (!soldItem) return product;
        const qtyType =
          soldItem.quantity_type ||
          (soldItem.isPieces
            ? product.content_unit_type
            : product.selling_unit);
        const piecesPerUnit = resolvePiecesPerUnit(qtyType || "units", product);
        const soldPieces = soldItem.quantity * piecesPerUnit;
        const currentPieces =
          product.stock_in_pieces ??
          (product.stock || 0) * (product.selling_unit_quantity || 1);
        const newPieces = Math.max(0, currentPieces - soldPieces);
        return {
          ...product,
          stock: Math.floor(newPieces / (product.selling_unit_quantity || 1)),
          stock_in_pieces: newPieces,
          is_available: newPieces > 0,
        };
      }),
    );
  };

  const generateOrderCode = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `G${yy}${MM}${dd}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  };

  const prepareOrder = () => ({
    cashier:
      `${user?.first_name} ${user?.last_name?.[0] || ""}`.trim() || "Cashier",
    customer: selectedCustomer || "Walk-in Customer",
    total: parseFloat(total?.toFixed(2)) || 0,
    subtotal: parseFloat(subTotal?.toFixed(2)) || 0,
    discount: discountValue || 0,
    tendered_cash: tenderedCashValue || 0,
    balance: parseFloat(balanceDue?.toFixed(2)) || 0,
    balance_label: balanceLabel,
    code: generateOrderCode(),
    items: cartItems.map((item) => {
      const quantityType =
        item.quantity_type ||
        (item.isPieces ? item.content_unit_type || "piece" : "units");
      const unitPrice = resolveUnitPrice(quantityType, item as any);
      return {
        product_id: item.id,
        quantity: item.quantity || 0,
        quantity_type: quantityType,
        unit_price: unitPrice,
        price_per_piece: getPricePerPiece(item),
        product_name: item.name || "",
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
      payment_method: orderFormData.paymentMethod || "Cash",
      amount_paid: tenderedCashValue || 0,
      transaction_id: orderFormData.transactionId || "",
    },
    created_at: new Date().toISOString(),
  });

  const cleanupOrderData = async (message: string) => {
    toast.success(message || "Order submitted successfully");
    deductStockLocally(cartItems);
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
    if (isOnline && fetchProductsRef.current) {
      setTimeout(
        () =>
          fetchProductsRef.current!(1, debouncedSearchTerm, selectedCategory),
        800,
      );
    }
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const errors: FormErrors = {};
    if (discountValue < 0) errors.discount = "Discount cannot be negative";
    if (discountValue > subTotal)
      errors.discount = "Discount cannot exceed subtotal";
    if (tenderedCashValue < 0)
      errors.tenderedCash = "Amount cannot be negative";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fix form errors");
      return;
    }

    setCreatingOrder(true);

    try {
      const orderData = prepareOrder();

      if (isOnline) {
        try {
          const serverResponse = await appService.createOrder(orderData);

          if (serverResponse.success) {
            const serverOrderId = serverResponse?.results?.order?.id ?? (serverResponse?.results?.id as string | undefined);

            const orderDataForPrint = {
              ...orderData,
              id: serverOrderId,
            };

            await cleanupOrderData("Order submitted successfully!");
            printReceiptDirectly(orderDataForPrint, entity!);
          } else {
            console.warn("Server rejected order:", serverResponse.message);
            const localResponse = await indexedDBService.createOrder(orderData);
            if (!localResponse.success) throw new Error("Failed to save order locally");

            await cleanupOrderData("Order saved locally — will retry sync");
            printReceiptDirectly(localResponse.results, entity!);
          }
        } catch (networkErr) {
          console.error("Network error during order submit:", networkErr);
          const localResponse = await indexedDBService.createOrder(orderData);
          if (!localResponse.success) throw new Error("Failed to save order locally");

          await cleanupOrderData("Order saved offline — sync failed, will retry");
          printReceiptDirectly(localResponse.results, entity!);
        }
      } else {
        const localResponse = await indexedDBService.createOrder(orderData);
        if (!localResponse.success) throw new Error("Failed to save order locally");

        await cleanupOrderData("Order saved offline — will sync when back online");
        printReceiptDirectly(localResponse.results, entity!);
      }
    } catch (err) {
      toast.error("Failed to save order");
      console.error("Order submission error:", err);
    } finally {
      setCreatingOrder(false);
    }
  };

  const addToCart = (
    product: IProduct,
    quantity: number = 1,
    isPieces: boolean = true,
    quantityType?: string,
  ) => {
    if (!product.is_available || getStockLevel(product) === 0) {
      toast.error("Product is out of stock", { duration: 3000 });
      return;
    }

    const resolvedQtyType =
      quantityType ||
      (isPieces ? product.content_unit_type || "piece" : "units");

    const piecesPerUnit = resolvePiecesPerUnit(resolvedQtyType, product);
    const quantityInPieces = quantity * piecesPerUnit;
    if (piecesPerUnit > 1 && !Number.isInteger(quantityInPieces)) {
      toast.error(`${product.selling_unit} quantity must be a whole number`, {
        duration: 3000,
      });
      return;
    }

    const availablePieces =
      product.stock_in_pieces ??
      (product.stock || 0) * product.selling_unit_quantity;

    if (quantityInPieces > availablePieces) {
      const maxInUnit = Math.floor(availablePieces / piecesPerUnit);
      toast.error(
        `Not enough stock. Available: ${maxInUnit} ${resolvedQtyType}s`,
        { duration: 3000 },
      );
      return;
    }

    const pricePerPiece =
      product.price_per_piece && product.price_per_piece > 0
        ? product.price_per_piece
        : product.price_per_unit / (product.selling_unit_quantity || 1);

    if (!pricePerPiece && !product.price_per_unit) {
      toast.error("Product price is not set", { duration: 3000 });
      return;
    }

    const unitPrice = resolveUnitPrice(resolvedQtyType, product);

    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id && item.quantity_type === resolvedQtyType,
      );

      if (existing) {
        const newPieces = quantity * piecesPerUnit;
        if (newPieces > availablePieces) {
          toast.error("Not enough stock available", { duration: 3000 });
          return prev;
        }
        toast.success(
          `${product.short_name} updated to ${quantity} ${resolvedQtyType}s`,
        );
        return prev.map((item) =>
          item.id === product.id && item.quantity_type === resolvedQtyType
            ? { ...item, quantity }
            : item,
        );
      }

      const alreadyCommittedPieces = prev
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => {
          const pp = resolvePiecesPerUnit(
            item.quantity_type || "units",
            product,
          );
          return sum + item.quantity * pp;
        }, 0);

      if (alreadyCommittedPieces + quantityInPieces > availablePieces) {
        toast.error("Not enough stock for combined quantity", {
          duration: 3000,
        });
        return prev;
      }

      toast.success(
        `${product.short_name} (${resolvedQtyType} ×${quantity}) added`,
      );
      return [
        ...prev,
        {
          ...product,
          quantity,
          isPieces: piecesPerUnit === 1,
          quantity_type: resolvedQtyType,
          price_per_piece: pricePerPiece,
          price_per_unit: product.price_per_unit,
          unit_price: unitPrice,
        },
      ];
    });
  };

  const openCustomQuantityModal = (
    product: IProduct,
    qty?: number,
    isPieces?: boolean,
  ) => {
    setSelectedProductForCustomQty(product);
    setCurrentQuantity(qty || 0);
    setCurrentIsPieces(isPieces !== false);
    setShowCustomQuantityModal(true);
  };

  const handleCustomQuantitySubmit = (
    quantity: number,
    isPieces: boolean,
    quantityType: string,
  ) => {
    if (selectedProductForCustomQty && quantity > 0) {
      addToCart(selectedProductForCustomQty, quantity, isPieces, quantityType);
    }
    setShowCustomQuantityModal(false);
    setSelectedProductForCustomQty(null);
  };

  const removeFromCart = (product: IProduct) => {
    setCartItems((prev) => prev.filter((item) => item.id !== product.id));
    toast.success(`${product.short_name} removed from cart`, {
      duration: 3000,
    });
  };

  const updateQuantity = (product: IProduct, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(product);
      return;
    }
    const prod = products.find((p) => p.id === product.id);
    if (prod) {
      const avail =
        prod.stock_in_pieces ?? (prod.stock || 0) * prod.selling_unit_quantity;
      if (newQuantity > avail) {
        toast.error(`Not enough stock for ${product.short_name}`, {
          duration: 3000,
        });
        return;
      }
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, quantity: newQuantity } : item,
      ),
    );
    toast.warning(
      `${product.short_name} updated to ${formatQuantity(newQuantity)}`,
      { duration: 3000 },
    );
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const loadMoreProducts = useCallback(() => {
    if (!loadingRef.current && hasMore && fetchProductsRef.current)
      fetchProductsRef.current(
        pageRef.current + 1,
        debouncedSearchTerm,
        selectedCategory,
      );
  }, [hasMore, debouncedSearchTerm, selectedCategory]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      observer.current?.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMoreProducts();
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadMoreProducts],
  );

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
        fetchProductsRef.current?.(1, debouncedSearchTerm, selectedCategory);
      }
    } catch {
      toast.error("Sync failed");
    }
  };

  const openCustomerModal = async () => {
    const result = await openModal(CustomerModal, {
      side: "right",
      size: "lg",
    });
    if (result) setSelectedCustomer(result?.full_name);
  };

  const calculateHoldOrderTotals = (order: any) => {
    const st = order.items.reduce((sum: number, item: any) => {
      const ppp =
        item.price_per_piece ||
        item.unit_price / (item.selling_unit_quantity || 1);
      return sum + ppp * (parseFloat(item.quantity) || 0);
    }, 0);
    const disc = Math.min(Math.max(0, parseFloat(order.discount) || 0), st);
    const tot = Math.max(0, st - disc);
    const tc = Math.max(0, parseFloat(order.tendered_cash) || 0);
    const bal = tc - tot;
    return {
      subTotal: st,
      discount: disc,
      total: tot,
      tenderedCash: tc,
      balance: bal,
      balanceLabel: bal >= 0 ? "Change" : "Owings",
    };
  };

  const openHoldOrdersModal = useCallback(async () => {
    const result = await openModal(HoldOrdersModal, {
      side: "right",
      size: "lg",
    });
    if (result?.success && result?.orderId) {
      try {
        const response = await indexedDBService.getHoldOrderById(
          result.orderId,
        );
        if (response.success && response.results) {
          const order = response.results;
          const totals = calculateHoldOrderTotals(order);
          const cartItemsFromHold = order.items.map((item: any) => ({
            id: item.product_id || item.id,
            name: item.product_name || item.name || "",
            short_name: item.short_name || item.product_name || "",
            price: parseFloat(item.unit_price) || 0,
            price_per_piece:
              item.price_per_piece ||
              item.unit_price / (item.selling_unit_quantity || 1),
            price_per_unit: item.unit_price || 0,
            quantity: parseFloat(item.quantity) || 0,
            stock: parseFloat(item.stock) || 0,
            is_available: true,
            image_url: item.image_url || "",
            image_alt: item.image_alt || "",
            category_name: item.category_name || "",
            content_measurement: item.content_measurement || "",
            content_unit: item.content_unit || "",
            content_unit_type: item.content_unit_type || "",
            selling_unit_quantity: parseInt(item.selling_unit_quantity) || 1,
            selling_unit: item.selling_unit || "",
            quantity_type: item.quantity_type || "units",
            isPieces: item.quantity_type !== "units",
            expanded: false,
          }));
          setCartItems(cartItemsFromHold);
          setSelectedCustomer(
            order.customer === "Walk-in Customer" ? null : order.customer,
          );
          setOrderFormData({
            discount: totals.discount.toString(),
            tenderedCash: totals.tenderedCash.toString(),
            paymentMethod: order.payment?.payment_method || "Cash",
            transactionId: order.payment?.transaction_id || "",
          });
          toast.success(`Order ${order.code} retrieved`);
          await indexedDBService.deleteHoldOrder(result.orderId);
          if (window.innerWidth < 1024) setIsCartOpen(true);
        }
      } catch (error) {
        toast.error("Error retrieving hold order");
        console.error(error);
      }
    }
    // eslint-disable-next-line 
  }, []);

  const holdOrder = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    try {
      const orderData = prepareOrder();
      const localResponse = await indexedDBService.createHoldOrder(orderData);
      if (!localResponse.success)
        throw new Error("Failed to save hold order locally");
      toast.success("Order on hold", {
        description: `Order ${orderData.code} saved for later`,
        duration: 5000,
        action: { label: "View Holds", onClick: () => openHoldOrdersModal() },
      });
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
      console.error(error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Mobile Header Bar */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Products</h1>
            <p className="text-xs text-gray-500">Browse and add items</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline && (
              <button
                onClick={handleManualSync}
                className="p-2 text-gray-600 hover:text-primary rounded-full active:bg-gray-100"
                aria-label="Sync"
              >
                <i className="ri-refresh-line text-xl"></i>
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-primary rounded-full active:bg-gray-100"
              aria-label="Cart"
            >
              <i className="ri-shopping-cart-2-line text-xl"></i>
              {cartItems.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center px-1">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Browse and add items to your cart
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-72">
                  <Input
                    type="text"
                    label="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    prefixIcon="search"
                  />
                </div>
                {isOnline && (
                  <Button onClick={handleManualSync} variant="outline">
                    <i className="ri-refresh-line mr-2"></i>
                    Sync Products
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-2">
                  <div className="flex items-center space-x-2 min-w-max">
                    {categories.map((category) => (
                      <Button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          fetchProductsRef.current?.(
                            1,
                            debouncedSearchTerm,
                            category.value,
                          );
                        }}
                        variant={
                          selectedCategory === category.value
                            ? "primary"
                            : "ghost"
                        }
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {category.label || category.value}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Search & Categories */}
          <div className="lg:hidden px-4 pt-3 pb-2 space-y-3">
            <Input
              type="text"
              label="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              prefixIcon="search"
            />
            <div className="relative">
              <div className="overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
                <div className="flex items-center space-x-2 min-w-max">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setSelectedCategory(category.value);
                        fetchProductsRef.current?.(
                          1,
                          debouncedSearchTerm,
                          category.value,
                        );
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === category.value
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-100 text-gray-700 active:bg-gray-200"
                      }`}
                    >
                      {category.label || category.value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product, index) => {
                const stockLevel = getStockLevel(product);
                const stockInPieces =
                  product.stock_in_pieces ??
                  stockLevel * (product.selling_unit_quantity || 1);

                const stockBadge = formatStockBadge(
                  stockInPieces,
                  product.selling_unit || "unit",
                  product.content_unit_type || product.content_unit || "piece",
                  product.selling_unit_quantity || 1,
                );

                return (
                  <div
                    key={`${product.id}-${index}`}
                    ref={index === products.length - 1 ? lastProductRef : null}
                    className="group"
                  >
                    <div
                      className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 ${
                        !product.is_available || stockLevel === 0 ? "opacity-60" : ""
                      }`}
                    >
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={product.image_url}
                          alt={product.image_alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div
                          className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full z-10 ${
                            stockLevel > 10
                              ? "bg-green-100 text-green-800"
                              : stockLevel > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {stockBadge}
                        </div>
                        {stockLevel === 0 && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="bg-white/90 text-gray-800 px-2 py-1 rounded-md text-xs font-medium">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 sm:p-3">
                        <div className="mb-1.5">
                          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                            {product.short_name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {product.selling_unit_quantity > 1 &&
                              `${product.selling_unit_quantity}×`}
                            {product.content_measurement}
                            {product.content_unit} / {product.selling_unit}
                          </p>
                        </div>
                        <div className="mb-2.5">
                          <div className="font-bold text-primary text-base">
                            ₵{product.price_per_unit?.toFixed(2)}
                            <span className="text-xs font-normal text-gray-400">
                              /{product.selling_unit}
                            </span>
                          </div>
                          {product.selling_unit_quantity > 1 && (
                            <div className="text-xs text-gray-400">
                              ₵{" "}
                              {(
                                product.price_per_piece ||
                                product.price_per_unit /
                                  product.selling_unit_quantity
                              ).toFixed(2)}
                              /{product.content_unit_type}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => openCustomQuantityModal(product)}
                          disabled={!product.is_available || stockLevel === 0}
                          className={`w-full py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                            !product.is_available || stockLevel === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-primary text-white active:bg-primary-dark shadow-sm"
                          }`}
                        >
                          <i className="ri-add-line text-base"></i>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No more products to load
              </div>
            )}
          </div>
        </div>

        {/* Cart Desktop Sidebar */}
        <div className="hidden lg:block lg:w-96 xl:w-[400px] bg-white border-l border-gray-200 flex flex-col">
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
            setDiscount={(v) => handleFormChange("discount")(v.toString())}
            setTenderedCash={(v) =>
              handleFormChange("tenderedCash")(v.toString())
            }
            setPaymentMethod={(v) => handleFormChange("paymentMethod")(v)}
            setTransactionId={(v) => handleFormChange("transactionId")(v)}
            removeFromCart={removeFromCart}
            updateQuantity={updateQuantity}
            openCustomerModal={openCustomerModal}
            submitOrder={submitOrder}
            holdOrder={holdOrder}
            openCustomQuantityModal={openCustomQuantityModal}
            openHoldOrdersModal={openHoldOrdersModal}
            formErrors={formErrors}
            handleFormBlur={handleFormBlur}
          />
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity mt-6"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute right-0 top-16 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-up sm:animate-scale-in">
            
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
                setDiscount={(v) => handleFormChange("discount")(v.toString())}
                setTenderedCash={(v) =>
                  handleFormChange("tenderedCash")(v.toString())
                }
                setPaymentMethod={(v) => handleFormChange("paymentMethod")(v)}
                setTransactionId={(v) => handleFormChange("transactionId")(v)}
                removeFromCart={removeFromCart}
                updateQuantity={updateQuantity}
                openCustomerModal={openCustomerModal}
                submitOrder={submitOrder}
                holdOrder={holdOrder}
                openCustomQuantityModal={openCustomQuantityModal}
                openHoldOrdersModal={openHoldOrdersModal}
                formErrors={formErrors}
                handleFormBlur={handleFormBlur}
                closeCartModal={() => setIsCartOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Quantity Modal */}
      {showCustomQuantityModal && selectedProductForCustomQty && (
        <CustomQuantityModal
          product={selectedProductForCustomQty}
          currentQuantity={currentQuantity}
          currentIsPieces={currentIsPieces}
          isOpen={showCustomQuantityModal}
          onClose={() => {
            setShowCustomQuantityModal(false);
            setSelectedProductForCustomQty(null);
          }}
          onSubmit={handleCustomQuantitySubmit}
        />
      )}
    </div>
  );
};

export default ModernStore;