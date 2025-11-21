import React, { useState, useEffect, useCallback, useRef } from "react";
import { appService } from "../../../core/services/app";
import { IResponse } from "../../../core/interfaces/IResponse";
import { eventService } from "../../../core/services/events";
import { toast } from "sonner";
import { Button } from "../../../ui";

// 🔄 UPDATED INTERFACE to match the new product schema
interface Product {
  id: string;
  short_name: string;
  name: string;
  category_name: string;
  stock: number;
  price: number;
  is_available: boolean;
  image_url: string;
  image_alt: string;

  // --- NEW FIELDS ---
  content_measurement: string; // e.g., "400g", "5kg"
  content_unit: string;        // e.g., "can", "bag"
  selling_unit_quantity: number; // e.g., 24, 5
  selling_unit: string;        // e.g., "box", "sack"
}

interface CartItem extends Product {
  quantity: number;
  expanded?: boolean;
}

interface Customer {
  first_name: string;
  last_name: string;
}

const ModernStore: React.FC = () => {
  // State declarations
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // ⭐️ Stability Fix: Use refs for mutable access to page and loading status
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  // Keep refs synchronized with state changes
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // ------------------------------------
  // 1. API Call Function (Memoized and Stable) - No functional change needed here
  // ------------------------------------
  const fetchProducts = useCallback(
    async (
      pageParam: number = 1,
      search: string = "",
      category: string = "All"
    ) => {
      // Use ref to block execution if already running (prevents race conditions)
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = {
          page: pageParam,
          search,
          category,
        };

        const response: IResponse = await appService.getProducts(params);

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
                new Set(response.results.map((p: Product) => p.category_name))
              ),
            ];
            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
      // Empty dependency array because it only uses setters and stable refs/props.
    },
    []
  );

  // ------------------------------------
  // 2. Load More Function (Stable)
  // ------------------------------------
  const loadMoreProducts = useCallback(() => {
    // Use the refs for stable check within the observer closure
    if (!loadingRef.current && hasMore) {
      // Use the ref value to determine the next page
      fetchProducts(pageRef.current + 1, searchTerm, selectedCategory);
    }
  }, [hasMore, searchTerm, selectedCategory, fetchProducts]);

  // ------------------------------------
  // 3. Intersection Observer (Stable)
  // ------------------------------------
  const observer = useRef<IntersectionObserver | null>(null);

  // lastProductRef depends on 'loading' (to skip attaching/detaching) and 'loadMoreProducts' (the action)
  const lastProductRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return; // Prevent creating new observers while a fetch is in progress
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        // The observer simply calls the stable loadMoreProducts function
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadMoreProducts]
  );

  // ------------------------------------
  // 4. Search Function (Stable)
  // ------------------------------------
  const searchProducts = useCallback(
    async (term: string) => {
      setSearchTerm(term);
      await fetchProducts(1, term, selectedCategory);
    },
    [selectedCategory, fetchProducts]
  );

  // Effects
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

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product.is_available || product.stock === 0) {
      toast.error("Product is out of stock", { duration: 3000 });
      return;
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      
      if (newQuantity > product.stock) {
        toast.error("Not enough stock available", { duration: 3000 });
        return prev;
      }

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        toast.success("Success", {
          description: `${product.short_name} added to cart`,
          duration: 3000,
        });
        return [...prev, { ...product, quantity, expanded: false }];
      }
    });
  };

  const addThreeQuarterToCart = (product: Product) => {
    addToCart(product, 0.75);
  };

  const addHalfToCart = (product: Product) => {
    addToCart(product, 0.5);
  };

  const addQuarterToCart = (product: Product) => {
    addToCart(product, 0.25);
  };

  const removeFromCart = (product: Product) => {
    setCartItems((prev) => prev.filter((item) => item.id !== product.id));
    toast.success("Success", {
      description: `${product.short_name} removed from cart`,
      duration: 3000,
    });
  };

  const updateQuantity = (product: Product, newQuantity: number) => {
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
    toast.info(`${product.short_name} quantity updated to ${newQuantity}`, {
      duration: 3000,
    });
  };

  const toggleItemDetails = (productId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  const applyDiscount = (amount: number) => {
    setDiscount(amount);
  };

  // Format quantity display to show fractions nicely
 // Updated Format quantity display to show mixed fractions nicely
const formatQuantity = (quantity: number): string => {
  // 1. Handle whole numbers
  if (quantity % 1 === 0) {
    return quantity.toString();
  }

  // 2. Separate whole and fractional parts
  const whole = Math.floor(quantity);
  const fraction = quantity % 1; // e.g., 0.75, 0.5, 0.3333

  // 3. Map common fractional decimals to Unicode/HTML entities
  let fractionString = '';
  let wholeString = whole > 0 ? whole.toString() : '';

  // Use a small tolerance for floating point comparisons
  const tolerance = 0.0001;

  if (Math.abs(fraction - 0.5) < tolerance) {
    fractionString = "½";
  } else if (Math.abs(fraction - 0.25) < tolerance) {
    fractionString = "¼";
  } else if (Math.abs(fraction - 0.75) < tolerance) {
    fractionString = "¾";
  } else if (Math.abs(fraction - 0.333333) < tolerance) {
    fractionString = "⅓"; // For 1/3
  } else if (Math.abs(fraction - 0.666666) < tolerance) {
    fractionString = "⅔"; // For 2/3
  } else {
    // 4. Fallback for less common or repeating fractions, showing up to two decimal places
    return quantity.toFixed(2);
  }

  // 5. Combine whole number and fraction
  // Returns "2¾", "1½", or "½" (if whole is 0)
  return `${wholeString}${fractionString}`;
};

  // Calculated values
  const subTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = Math.max(0, subTotal - discount);

  return (
    <div className="h-full">
      <div className="w-full h-full">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Products Section */}
          <div className="flex-1 flex flex-col h-full bg-background ">
            {/* Header */}
            <div className="rounded-sm shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-text">
                    Products
                  </h1>
                  <p className="text-text-light mt-1">
                    Browse and add items to your cart
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => searchProducts(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Cart counter for mobile */}
                  <div className="lg:hidden relative">
                    <button className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
                      <span className="font-semibold">{cartItems.length}</span>
                    </button>
                  </div>
                </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4  bg-background rounded-sm">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    ref={index === products.length - 1 ? lastProductRef : null}
                    className={`group bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden ${
                      !product.is_available || product.stock === 0
                        ? "opacity-50"
                        : "hover:scale-105"
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-">
                      <img
                        src={product.image_url}
                        alt={product.image_alt}
                        className="w-full h-full object-cover"
                      />
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm bg-red-600 px-2 py-1 rounded">
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
                        {/* 🔄 UPDATED: Display content/selling unit info */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-2 whitespace-nowrap">
                            {product.selling_unit_quantity}x{product.content_measurement} / {product.selling_unit}
                        </span>
                      </div>

                      <p className="text-xs text-text-light mb-3 line-clamp-1">
                        {/* {product.name} */}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.stock > 10
                              ? "bg-success-10 text-success"
                              : product.stock > 0
                              ? "bg-info-10 text-info"
                              : "bg-danger-10 text-danger"
                          }`}
                        >
                          {/* 🔄 UPDATED: Stock refers to the selling unit */}
                          {product.stock} {product.selling_unit}s in stock 
                        </span>
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary dark:text-blue-400">
                          GHC {product.price.toFixed(2)}
                        </span>
                        
                      </div>

                      {/* Add to Cart Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => addQuarterToCart(product)}
                          disabled={!product.is_available || product.stock === 0}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ¼
                        </button>
                        <button
                          onClick={() => addHalfToCart(product)}
                          disabled={!product.is_available || product.stock === 0}
                          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-2 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ½
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={!product.is_available || product.stock === 0}
                          className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-2 rounded-lg text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add (1 {product.selling_unit})
                        </button>
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
          <div className="lg:w-96 h-full">
            <div className="rounded-sm shadow-sm flex flex-col h-full">
              {/* Cart Header */}
              <div className="border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-text">
                    Cart
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-white px-2 py-1 rounded-full text-sm font-semibold">
                      {cartItems.length}
                    </span>
                  </div>
                </div>

                {/* Customer Selection */}
              </div>

              {/* Cart Items - Scrollable Container */}
              <div className="flex-1 overflow-y-auto bg-background rounded-sm">
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
                    <p className="text-lg font-medium mb-2">
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
                        className="bg-card rounded-sm shadow-sm px-4 py-2"
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
                              {/* 🔄 UPDATED: Show Price per Selling Unit */}
                              <p className="text-primary font-semibold text-xs">
                                GHC {item.price.toFixed(2)}/{item.selling_unit}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => removeFromCart(item)}
                            className="text-danger transition-colors duration-200"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
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
                              {/* 🔄 UPDATED: Show Selling Unit next to quantity */}
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
                            GHC {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Fractional Quick Actions */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => addQuarterToCart(item)}
                            className={`flex-1 text-xs py-1 px-2 rounded ${
                              item.quantity === 0.25
                                ? 'bg-primary text-white'
                                : 'bg-background text-text'
                            }`}
                          >
                            ¼
                          </button>
                          <button
                            onClick={() => addHalfToCart(item)}
                            className={`flex-1 text-xs py-1 px-2 rounded ${
                              item.quantity === 0.5
                                ? 'bg-primary text-white'
                                : 'bg-background text-text'
                            }`}
                          >
                            ½
                          </button>
                          <button
                            onClick={() => addThreeQuarterToCart(item)}
                            className={`flex-1 text-xs py-1 px-2 rounded ${
                              item.quantity === 0.75
                                ? 'bg-primary text-white'
                                : 'bg-background text-text'
                            }`}
                          >
                            ¾
                          </button>
                          <button
                            onClick={() => addToCart(item)}
                            className={`flex-1 text-xs py-1 px-2 rounded ${
                              item.quantity === 1
                                ? 'bg-primary text-white'
                                : 'bg-background text-text'
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
                <div className="border-t border-border pt-4">
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Customer Selection */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-light">Order for</p>
                        
                      </div>
                      {selectedCustomer ? (
                        <div className="flex items-cemter text-sm pb-2">
                        <p className=" font-semibold text-text">
                          {selectedCustomer?.first_name}{" "}
                          {selectedCustomer?.last_name}
                        </p><p
                          onClick={() => setSelectedCustomer(null)}
                         className="underline text-primary ml-1 items-start cursor-pointer"
                        >
                            Change
                          </p>
                          </div>
                      ) : (
                        <Button
                          onClick={() =>
                            setSelectedCustomer({
                              first_name: "John",
                              last_name: "Doe",
                            })
                          }
                          size="sm"
                          variant="link"
                        >
                          <i className="ri-add-line"></i>
                          Add Customer
                        </Button>
                      )}
                    </div>
                    
                  </div>
                  {/* Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">
                        Subtotal
                      </span>
                      <span className="font-semibold text-text">
                        GHC {subTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">
                        Discount
                      </span>
                      <button
                        onClick={() => applyDiscount(5)}
                        className="text-primary font-semibold"
                      >
                        - GHC {discount.toFixed(2)}
                      </button>
                    </div>

                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span className="text-text">
                        Total
                      </span>
                      <span className="text-primary">
                        GHC {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                    <div className="flex items-center justify-between mt-3">
                      <Button
                        onClick={() => setCartItems([])}
                        variant="ghost"
                        size="sm"
                      >
                        Hold Order
                      </Button>
                      <Button size="sm">Proceed to Checkout</Button>
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernStore;