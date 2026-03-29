import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { appService } from "../../../core/services/app";
import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { eventService } from "../../../core/services/events";
import { Breadcrumb, Button, DataTable } from "../../../ui";
import {
  IBreadcrumbItem,
  IBreadcrumbAction,
} from "../../../ui/components/Breadcrumb";
import { convertToCSV, downloadCSV } from "../../../core/utils/fileFormators";
import { useModal } from "../../../core/hooks/useModal";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";
import AddProductModal from "./AddProductModal";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import UpdateStockModal from "./UpdateStockModal";
import UpdateAvailabilityModal from "./UpdateAvailabilityModal";
import UpdatePriceModal from "./UpdatePriceModal";
import { useStore } from "../../../core/hooks/useStore";

export default function ProductsList() {
  // 1. STATE ADJUSTMENTS: Use IProduct interface
  const [products, setProducts] = useState<IProduct[] | null>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const { user } = useStore();
  const [productExtraData, setProductExtraData] = useState<any>();
  const [categories, setCategories] = useState<SelectOption[]>([]);

  // Availability filter options
  const availabilityOptions: SelectOption[] = [
    { label: "All", value: "all" },
    { label: "Available", value: "available" },
    { label: "Unavailable", value: "unavailable" },
  ];

  // 2. PAGE TITLE: Update title
  usePageTitle("Inventory Products");

  // 3. BREADCRUMBS: Update breadcrumbs
  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Store", url: "/store" },
    { label: "Products", url: "/products", isActive: true },
  ];

  // 4. HELPER FUNCTION: Calculate price per piece
  const calculatePricePerPiece = (product: IProduct): number => {
    if (product.price_per_piece !== undefined && product.price_per_piece > 0) {
      return product.price_per_piece;
    }
    if (product.price_per_unit && product.selling_unit_quantity) {
      return product.price_per_unit / product.selling_unit_quantity;
    }
    return 0;
  };

  // 5. COLUMNS: Define columns for Products data - UPDATED FOR NEW PRICE FIELDS
  const columns: TableColumn[] = [
    {
      header: "Image",
      value: (item: IProduct) => item.image_url,
      type: "image",
      imageConfig: {
        size: "sm"
      },
      bold: true,
    },  
    {
      header: "Product Name",
      value: (item: IProduct) => item.short_name,
      type: "column",
      bold: true,
    },
    {
      header: "Category",
      value: (item: IProduct) => item.category_name,
      type: "column",
    },
    {
      header: "Pack Size",
      value: (item: IProduct) =>
        `${item.selling_unit_quantity} x ${item.content_measurement}${item.content_unit}`,
      type: "column",
    },
    {
      header: "Unit Price",
      // Price per unit (box/pack)
      value: (item: IProduct) => {
        const price = item.price_per_unit || 0;
        return (
          <div className="text-right">
            <div className="font-semibold text-text">
              GHS {price.toFixed(2)}
            </div>
            <div className="text-xs text-text-light">
              per {item.selling_unit}
            </div>
          </div>
        );
      },
    },
    {
      header: "Piece Price",
      // Price per individual piece
      value: (item: IProduct) => {
        const pricePerPiece = calculatePricePerPiece(item);
        return (
          <div className="text-right">
            <div className="font-semibold text-text">
              GHS {pricePerPiece.toFixed(2)}
            </div>
            <div className="text-xs text-text-light">
              per {item.content_unit_type}
            </div>
          </div>
        );
      },
    },
    {
      header: "Stock",
      // Display stock with unit and total pieces
      value: (item: IProduct) => {
        const totalPieces = item.stock_in_pieces ?? item.stock * item.selling_unit_quantity;
        const stockLevel = item.stock;
        const isLowStock = stockLevel <= 3;
        const isOutOfStock = stockLevel === 0;
        
        return (
          <div className={`${isOutOfStock ? 'text-danger' : isLowStock ? 'text-info' : 'text-text'}`}>
            <div className="font-semibold">
              {item.whole_stock === 0 ? '0' : item.whole_stock?.toFixed(2)} {item.selling_unit}{item.stock !== 1 ? "s" : ""}
            </div>
            <div className="text-xs">
              {item.stock_in_pieces ?? totalPieces} {item.content_unit_type}s
            </div>
            {isLowStock && (
              <div className="text-xs mt-1">
                {isOutOfStock ? (
                  <span className="text-danger font-medium">Out of stock</span>
                ) : (
                  <span className="text-info font-medium">Low stock</span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Whole Stock",
      value: (item: IProduct) => {
        return (
          <div className="text-right">
            <div className="font-semibold text-text">
             {item.whole_stock === 0 ? '0' : item.whole_stock?.toFixed(2)}/{item.selling_unit}
            </div>
            {/* <div className="text-xs text-text-light">
              {item.selling_unit}
            </div> */}
          </div>
        );
      },
    },
    {
      header: "Availability",
      value: (item: IProduct) => item.is_available ? "Available" : "Unavailable",
      type: "status",
      // Define status classes based on availability
      statusClasses: (item: IProduct) => {
        if (item.is_available) {
          return item.stock > 5 
            ? "bg-success-10 text-success" 
            : item.stock > 0 
            ? "bg-info-10 text-info" 
            : "bg-danger-10 text-danger";
        }
        return "bg-danger-10 text-danger";
      },
    },
    {
      header: "Last Updated",
      value: (item: IProduct) => item.updated_at,
      type: "date",
      format: "short_date", 
    },
  ];

  // 6. BREADCRUMB ACTIONS: Add 'Add Product' and keep 'Export'
  const actions: IBreadcrumbAction[] = [
  {
    label: "Add Product",
    action: () => handleAddProduct(),
    icon: "add",          // → ri-add-line ✓
    size: "sm",
    variant: "primary",
  },
  {
    label: "Sync Prices",
    action: () => handleSyncPrices(),
    icon: "refresh",      // → ri-refresh-line ✓
    size: "sm",
    variant: "ghost",
  },
  {
    label: "Sync Inventory",
    action: () => handleSyncInventory(),
    icon: "refresh",      // → ri-refresh-line ✓
    size: "sm",
    variant: "ghost",
  },
  {
    label: exportLoading ? "Exporting..." : "Export CSV",
    action: () => handleExport(),
    icon: exportLoading ? "loader-4" : "download-2", // → ri-download-2-line ✓
    size: "sm",
    variant: "outline",
    disabled: exportLoading,
  },
];

  // 7. CUSTOM ACTIONS: Define actions for individual product rows
  const getCustomActions = (item: IProduct): CustomAction[] => [
    {
      title: "Edit Product",
      handler: () => handleEditProduct(item),
      icon: "edit-line",
      classes: "",
    },
    {
      title: "Update Stock", 
      handler: () => handleUpdateStock(item),
      icon: "truck-line",
      classes: "",
    },
    {
      title: "Update Price", 
      handler: () => handleUpdatePrice(item),
      icon: "money-dollar-circle-line",
      classes: "",
    },
    {
      title: item.is_available ? "Mark Unavailable" : "Mark Available", 
      handler: () => handleUpdateAvailability(item),
      icon: item.is_available ? "forbid-line" : "check-double-line",
      classes: item.is_available ? "text-info" : "text-success",
    },
    {
      title: "Delete",
      handler: () => handleDeleteProduct(item),
      icon: "delete-bin-line",
      classes: "text-error",
    },
  ];

  // 8. DATA FETCHING: Update function to fetch Products
  const fetchProductsData = useCallback(
    async (
      page: number,
      search: string,
      category: string,
      availability: string = "all"
    ): Promise<void> => {
      setLoading(true);
      try {
        const payload: any = {
          page,
          search,
          category: category !== "all" ? category : undefined,
        };

        // Add availability filter if specified
        if (availability !== "all") {
          payload.is_available = availability.toLowerCase() === "available";
        }

        const res = await appService.getProducts(payload);

        if (res.success) {
          // Ensure all products have price_per_piece calculated if not present
          const productsWithPiecePrice = res.results.map((product: IProduct) => {
            const pricePerPiece = calculatePricePerPiece(product);
            const pricePerUnit = product.price_per_unit || 0;
            
            return {
              ...product,
              price_per_piece: pricePerPiece,
              price_per_unit: pricePerUnit,
              // Ensure price field exists for backward compatibility
              price: pricePerUnit,
            };
          });
          
          setProducts(productsWithPiecePrice as IProduct[]);
          setTotalCount(res.count);
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        toast.error("Failed to load products");
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const getProductExtraData = async () => {
      try {
        const res = await appService.getProductExtraInfo();
        if (res.success) {
          setProductExtraData(res.results);
          setCategories([
            { label: "All", value: "all" }, 
            ...res.results?.categories?.map((category: any) => category)
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch product categories:", error);
        toast.error("Failed to load categories");
      }
    };
    getProductExtraData();
  }, []);

  // 9. EFFECT HOOKS: Adjust dependencies for category filter
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory, selectedAvailability]);

  useEffect(() => {
    fetchProductsData(currentPage, debouncedSearchTerm, selectedCategory, selectedAvailability);
  }, [
    fetchProductsData,
    currentPage,
    debouncedSearchTerm,
    selectedCategory,
    selectedAvailability,
  ]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchProductsData(currentPage, debouncedSearchTerm, selectedCategory, selectedAvailability);
    };

    eventService.onRefresh(handleRefresh);

    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [
    fetchProductsData,
    currentPage,
    debouncedSearchTerm,
    selectedCategory,
    selectedAvailability,
  ]);

  // 10. HANDLERS: Update handler logic
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilter = (filterValue: string) => {
    setSelectedCategory(filterValue);
  };

  const handleAvailabilityFilter = (filterValue: string) => {
    setSelectedAvailability(filterValue);
  };


  const handleDeleteProduct = async (product: IProduct) => {
    toast.custom((id) => (
      <div className="bg-card p-4 rounded-md shadow-lg">
        <div className="font-semibold text-text">Are you sure you want to delete this product?</div>
        <p className="text-text-light text-sm mt-1">This action cannot be undone.</p>
        <div className="flex justify-end gap-2 mt-3">
          <Button
            variant="ghost"
            onClick={() => toast.dismiss(id)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              toast.dismiss(id); 
              try {
                const res = await appService.deleteProduct(product.id);
                if (res.success) {
                  toast.success("Product deleted successfully");
                  if(products){
                    setProducts(products.filter((p) => p.id !== product.id));
                  }
                } else {
                  toast.error("Failed to delete product");
                }
              } catch (error) {
                console.error("Failed to delete product:", error);
                toast.error("Failed to delete product");
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    ));
  };

  // 11. EXPORT LOGIC: Update export logic for Products - UPDATED FOR NEW PRICE FIELDS
  const handleExport = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const payload: any = {
        page: currentPage,
        search: debouncedSearchTerm,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        is_available: selectedAvailability !== "all" ? selectedAvailability : undefined
      };

      const res = await appService.getProducts(payload);

      if (res.success && res.results && res.results.length > 0) {
        const exportData: IProduct[] = res.results as IProduct[];

        const csvHeaders = [
          { key: "name", label: "Product Name" },
          { key: "category_name", label: "Category" },
          { key: "stock", label: "Stock (Boxes)" },
          { key: "total_pieces", label: "Total Pieces" },
          { key: "price_per_unit", label: "Price Per Box (GHS)" },
          { key: "price_per_piece", label: "Price Per Piece (GHS)" },
          { key: "content_measurement", label: "Content Measurement" },
          { key: "content_unit", label: "Content Unit" },
          { key: "selling_unit_quantity", label: "Pieces Per Box" },
          { key: "selling_unit", label: "Selling Unit" },
          { key: "is_available", label: "Availability" },
          { key: "image_url", label: "Image URL" }
        ];

        const csvData = exportData.map((product: IProduct) => {
          const pricePerPiece = calculatePricePerPiece(product);
          const pricePerUnit = product.price_per_unit || 0;
          const totalPieces = product.stock * product.selling_unit_quantity;
          
          return {
            name: product.short_name,
            category_name: product.category_name,
            stock: String(product.stock),
            total_pieces: String(totalPieces),
            price_per_unit: pricePerUnit.toFixed(2),
            price_per_piece: pricePerPiece.toFixed(2),
            content_measurement: product.content_measurement,
            content_unit: product.content_unit,
            selling_unit_quantity: String(product.selling_unit_quantity),
            selling_unit: product.selling_unit,
            is_available: product.is_available ? "Available" : "Unavailable",
            image_url: product.image_url || "https://placehold.co/300?text=No+Image"
          };
        });

        const csvContent = await convertToCSV(csvData, csvHeaders);

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `products-inventory-${timestamp}.csv`;

        await downloadCSV(csvContent, filename);

        toast.success(
          "Export Successful",
          {
            description: `${exportData.length} product records exported.`,
          }
        );
      } else {
        toast.error("No Data", { 
          description: "No product records found to export.", 
        });
      }
    } catch (error) {
      console.error("Error exporting products:", error);
      toast.error(
        "Export Error",
        {
          description: "Failed to export products. Please try again.",
        }
      );
    } finally {
      setExportLoading(false);
    }
  };
  const handleSyncPrices = async () => {
    try {
      const res = await appService.syncProductsPrices();
      if (res.success) {
        toast.success("Prices synced successfully");
      } else {
        toast.error("Failed to sync prices");
      }
    } catch (error) {
      console.error("Failed to sync prices:", error);
      toast.error("Failed to sync prices");
    }
  };

  const handleSyncInventory = async () => {
    try {
      const res = await appService.syncWholeStock();
      if (res.success) {
        toast.success("Inventory synced successfully");
      } else {
        toast.error("Failed to sync inventory");
      }
    } catch (error) {
      console.error("Failed to sync inventory:", error);
      toast.error("Failed to sync inventory");
    }
  };


  const handleAddProduct = async () => {
    const result = await openModal(AddProductModal, {
      data: {product: null, productExtraData}, 
      size: "3xl",
      side: "right",
      backdropClose: false,
    });
    if (result?.success && result?.product) {
      fetchProductsData(currentPage, debouncedSearchTerm, selectedCategory, selectedAvailability);
    }
  };

  const handleEditProduct = async (product: IProduct) => {
    const result = await openModal(AddProductModal, {
      data: {product: product, productExtraData}, 
      size: "3xl",
      side: "right",
      backdropClose: false,
    });
    if(result?.success && result?.product){
      if(products)
        setProducts(products.map((p) => (p.id === product.id ? result.product : p)));
    }
  };

  const handleUpdateStock = async (product: IProduct) => {
    const result = await openModal(UpdateStockModal, {
      data: { product },
      size: "md",
      side: "right",
      backdropClose: false,
    });
    if (result?.success && result?.product) {
      if(products)
        setProducts(products.map((p) => (p.id === product.id ? result.product : p)));
    }
  };

  const handleUpdatePrice = async (product: IProduct) => {
    const result = await openModal(UpdatePriceModal, {
      data: { product },
      size: "md",
      side: "right",
      backdropClose: false,
    });
    if (result?.success && result?.product) {
      if(products)
        setProducts(products.map((p) => (p.id === product.id ? result.product : p)));
    }
  };

  const handleUpdateAvailability = async (product: IProduct) => {
    const result = await openModal(UpdateAvailabilityModal, {
      data: { product },
      size: "md",
      side: "right",
      backdropClose: false,
    });
    if (result?.success && result?.product) {
      if(products)
        setProducts(products.map((p) => (p.id === product.id ? result.product : p)));
    }
  };

  // 12. RENDER: Use updated props for DataTable
  return (
    <div className="flex flex-col h-full">
      <div className="rounded-sm shadow-sm overflow-hidden flex-1 flex flex-col">
        <Breadcrumb
          breadcrumbs={breadcrumbs}
          pageTitle="Inventory Products"
          pageSubtitle="Review and manage all products in the inventory"
          actions={actions}
        />

        <div className="overflow-y-auto flex-1">
          <DataTable
            columns={columns}
            data={products}
            loading={loading}
            onSearch={handleSearch}
            filterOptions={categories}
            onFilter={handleFilter}
            sortOptions={availabilityOptions}
            onSort={handleAvailabilityFilter}
            page={currentPage}
            count={totalCount}
            userRole={user?.role}
            onPageChange={handlePageChange}
            customActions={getCustomActions}
            noDataMessage="No products found in the inventory."
          />
        </div>
      </div>
    </div>
  );
}