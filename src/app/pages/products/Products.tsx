import { useCallback, useEffect, useState } from "react";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { appService } from "../../../core/services/app";
import { CustomAction, TableColumn } from "../../../core/interfaces/table";
import { useDebounce } from "../../../core/hooks/useDebounce";
import { eventService } from "../../../core/services/events";
import { useToast } from "../../../core/hooks/useToast";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { Breadcrumb, DataTable } from "../../../ui";
import {
  IBreadcrumbItem,
  IBreadcrumbAction,
} from "../../../ui/components/Breadcrumb";
import { convertToCSV, downloadCSV } from "../../../core/utils/fileFormators";
import { useModal } from "../../../core/hooks/useModal";
import { IProduct } from "../../../core/interfaces/IProduct";
// import { ProductDetailsModal } from "./ProductDetails"; // Placeholder for future use
// import { ProductFormModal } from "./ProductForm"; // Placeholder for future use

export default function ProductsList() {
  // 1. STATE ADJUSTMENTS: Use IProduct interface
  const [products, setProducts] = useState<IProduct[] | null>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { openModal } = useModal();
  const { show } = useToast();

  // 2. PAGE TITLE: Update title
  usePageTitle("Inventory Products");

  // 3. BREADCRUMBS: Update breadcrumbs
  const breadcrumbs: IBreadcrumbItem[] = [
    { label: "Dashboard", url: "/dashboard" },
    { label: "Products", url: "/products", isActive: true },
  ];

  // 4. FILTER OPTIONS: Change to category filter (hardcoded options for now)
  // NOTE: In a real app, you would fetch categories from the API.
  const categoryOptions: SelectOption[] = [
    { value: "all", label: "All Categories" },
    { value: "Stationery", label: "Stationery" },
    { value: "Groceries", label: "Groceries" },
    { value: "Hygiene", label: "Hygiene" },
    { value: "Beverages", label: "Beverages" },
    { value: "Electronics", label: "Electronics" },
  ];

  // 5. COLUMNS: Define columns for Products data
  const columns: TableColumn[] = [
    {
      header: "Product Name",
      value: (item: IProduct) => item.name,
      type: "column",
      bold: true,
    },
    {
      header: "Category",
      value: (item: IProduct) => item.category_name,
      type: "column",
    },
    {
      header: "Unit Price (GHS)",
      // Assuming a currency (e.g., GHS) for display
      value: (item: IProduct) =>
        `${item.price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      type: "column",
    },
    {
      header: "Stock Quantity",
      // Display stock with unit, rounded to 2 decimal places if needed
      value: (item: IProduct) =>
        `${item.stock.toFixed(2)} ${item.selling_unit}`,
      type: "column",
    },
    {
      header: "Availability",
      value: (item: IProduct) => (item.is_available ? "Available" : "Unavailable"),
      type: "status",
      // Define status classes based on availability
      statusClasses: (item: IProduct) => {
        return item.is_available
          ? "bg-success-10 text-success"
          : "bg-error-10 text-error";
      },
    },
    {
      header: "Selling Unit",
      value: (item: IProduct) =>
        `${item.selling_unit_quantity} x ${item.content_measurement} ${item.content_unit} per ${item.selling_unit}`,
      type: "column",
    },
    {
      header: "Last Updated",
      value: (item: IProduct) => item.updated_at,
      type: "date",
      format: "short_date_time", // Placeholder format
    },
  ];

  // 6. BREADCRUMB ACTIONS: Add 'Add Product' and keep 'Export'
  const actions: IBreadcrumbAction[] = [
    {
      label: "Add Product",
      action: () => handleAddProduct(),
      icon: "add-circle-line",
      size: "sm",
      variant: "primary",
    },
    {
      label: exportLoading ? "Exporting..." : "Export as CSV",
      action: () => handleExport(),
      icon: exportLoading ? "loader-4-line" : "download",
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
      title: "View Details",
      handler: () => onViewDetails(item),
      icon: "eye-line",
      classes: "",
    },
    // Add delete action if needed
    // {
    //   title: "Delete",
    //   handler: () => handleDeleteProduct(item),
    //   icon: "delete-bin-line",
    //   classes: "text-error",
    // },
  ];

  // 8. DATA FETCHING: Update function to fetch Products
  const fetchProductsData = useCallback(
    async (
      page: number,
      search: string,
      category: string
    ): Promise<void> => {
      setLoading(true);
      try {
        const payload = {
          page,
          search,
          category,
        };

        // NOTE: Replace getOrders with getProducts
        const res = await appService.getProducts(payload);

        if (res.success) {
          setProducts(res.results as IProduct[]);
          setTotalCount(res.count);
        }
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 9. EFFECT HOOKS: Adjust dependencies for category filter
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory]);

  useEffect(() => {
    fetchProductsData(currentPage, debouncedSearchTerm, selectedCategory);
  }, [
    fetchProductsData,
    currentPage,
    debouncedSearchTerm,
    selectedCategory,
  ]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchProductsData(currentPage, debouncedSearchTerm, selectedCategory);
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

  const handleAddProduct = () => {
    // openModal(ProductFormModal, { data: { title: "Add New Product" } });
    console.log("Open Add Product Modal");
    show("Coming Soon", "Add Product functionality is coming soon.", "info");
  };

  const handleEditProduct = (item: IProduct) => {
    // openModal(ProductFormModal, { data: { title: "Edit Product", product: item } });
    console.log("Open Edit Product Modal for:", item.name);
    show("Coming Soon", `Edit ${item.name} functionality is coming soon.`, "info");
  };

  const onViewDetails = (item: IProduct) => {
    // openModal(ProductDetailsModal, {
    //   data: { title: "Product Details", product: item },
    //   size: "lg",
    //   side: "right",
    // });
    console.log("Open Product Details Modal for:", item.name);
    show("Coming Soon", `View Details for ${item.name} is coming soon.`, "info");
  };

  // 11. EXPORT LOGIC: Update export logic for Products
  const handleExport = async (): Promise<void> => {
    setExportLoading(true);
    try {
      const payload = {
        page: currentPage,
        search: debouncedSearchTerm,
        category: selectedCategory,
      };
      // NOTE: Replace getOrders with getProducts
      const res = await appService.getProducts(payload);

      if (res.success && res.results && res.results.length > 0) {
        const exportData: IProduct[] = res.results as IProduct[];

        const csvHeaders = [
          { key: "name", label: "Product Name" },
          { key: "short_name", label: "Short Name" },
          { key: "category_name", label: "Category" },
          { key: "price", label: "Unit Price" },
          { key: "stock", label: "Current Stock" },
          { key: "selling_unit", label: "Selling Unit" },
          { key: "content_measurement", label: "Content Measurement" },
          { key: "content_unit", label: "Content Unit" },
          { key: "selling_unit_quantity", label: "Selling Unit Quantity" },
          { key: "is_available", label: "Available" },
          { key: "updated_at", label: "Last Updated" },
        ];

        const csvData = exportData.map((product: IProduct) => {
          return {
            name: product.name,
            short_name: product.short_name,
            category_name: product.category_name,
            price: product.price,
            stock: product.stock,
            selling_unit: product.selling_unit,
            content_measurement: product.content_measurement,
            content_unit: product.content_unit,
            selling_unit_quantity: product.selling_unit_quantity,
            is_available: product.is_available ? "Yes" : "No",
            updated_at: new Date(product.updated_at).toLocaleString(),
          };
        });

        const csvContent = await convertToCSV(csvData, csvHeaders);

        const timestamp = new Date().toISOString().split("T")[0];
        const filename = `products-export-${timestamp}.csv`;

        await downloadCSV(csvContent, filename);

        show(
          "Export Successful",
          `${exportData.length} product records exported successfully.`,
          "success"
        );
      } else {
        show("No Data", "No product records found to export.", "info");
      }
    } catch (error) {
      console.error("Error exporting products:", error);
      show(
        "Export Error",
        "Failed to export products. Please try again.",
        "error"
      );
    } finally {
      setExportLoading(false);
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
            filterOptions={categoryOptions} // Use category filter options
            onFilter={handleFilter}
            page={currentPage}
            limit={10}
            count={totalCount}
            onPageChange={handlePageChange}
            customActions={getCustomActions}
            noDataMessage="No products found in the inventory."
          />
        </div>
      </div>
    </div>
  );
}
