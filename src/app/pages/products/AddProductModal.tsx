import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import {
  IBulkAddProduct,
  ICloudinaryImageUploadResponse,
  IProduct,
  ProductForm,
} from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

interface ProductFormModalProps {
  data?: any;
}

const initialFormState: ProductForm = {
  name: "",
  category_name: "",
  stock: "",
  price_per_unit: "",
  price_per_piece: "",
  allow_pieces_sell: true,
  content_measurement: "",
  content_unit: "",
  content_unit_type: "",
  selling_unit_quantity: "",
  selling_unit: "",
  image_url: "",
};

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

const AddProductModal: React.FC<ProductFormModalProps> = () => {
  const { modalRef, modalData } = useModal();

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [form, setForm] = useState<ProductForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<IBulkAddProduct[]>([]);
  const [csvValidationErrors, setCsvValidationErrors] = useState<
    { row: number; errors: string[] }[]
  >([]);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [contentUnits, setContentUnits] = useState<SelectOption[]>([]);
  const [sellingUnits, setSellingUnits] = useState<SelectOption[]>([]);
  const [contentUnitTypes, setContentUnitTypes] = useState<SelectOption[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [formattedNamePreview, setFormattedNamePreview] = useState("");

  // Initialize form with edit data if provided
  useEffect(() => {
    if (modalData?.product) {
      const product: IProduct = modalData.product;
      setIsEditMode(true);

      const formData = {
        name: product.short_name || "",
        category_name: product.category_name || "",
        stock: product.stock?.toString() || "",
        price_per_unit: product.price_per_unit?.toString() || "",
        price_per_piece: product.price_per_piece?.toString() || "",
        content_measurement: product.content_measurement || "",
        allow_pieces_sell: product.allow_pieces_sell ?? true,
        content_unit: product.content_unit || "",
        content_unit_type: product.content_unit_type || "",
        selling_unit_quantity: product.selling_unit_quantity?.toString() || "",
        selling_unit: product.selling_unit || "",
        image_url: product.image_url || "",
      };

      setForm(formData);

      if (product.image_url) {
        setExistingImageUrl(product.image_url);
        setImagePreview(product.image_url);
      }

      // Set initial preview
      updateFormattedNamePreview(formData);
    }
  }, [modalData]);

  // Auto-calculate price_per_piece when price_per_unit or selling_unit_quantity changes
  useEffect(() => {
    if (form.price_per_unit && form.selling_unit_quantity) {
      const pricePerUnit = parseFloat(form.price_per_unit);
      const sellingUnitQuantity = parseFloat(form.selling_unit_quantity);

      if (
        !isNaN(pricePerUnit) &&
        !isNaN(sellingUnitQuantity) &&
        sellingUnitQuantity > 0
      ) {
        const calculatedPricePerPiece = pricePerUnit / sellingUnitQuantity;
        setForm((prev) => ({
          ...prev,
          price_per_piece: calculatedPricePerPiece.toFixed(2),
        }));
      }
    }
  }, [form.price_per_unit, form.selling_unit_quantity]);

  // Update formatted name preview when relevant fields change
  useEffect(() => {
    updateFormattedNamePreview(form);
    // eslint-disable-next-line
  }, [
    form.name,
    form.content_measurement,
    form.content_unit,
    form.selling_unit_quantity,
    form.selling_unit,
  ]);

  const updateFormattedNamePreview = (formData: ProductForm) => {
    const {
      name,
      content_measurement,
      content_unit,
      selling_unit_quantity,
      selling_unit,
    } = formData;

    if (
      selling_unit_quantity &&
      content_measurement &&
      selling_unit &&
      content_unit
    ) {
      setFormattedNamePreview(
        `${
          name || "Product"
        }, ${selling_unit_quantity}x${content_measurement}${content_unit} per ${selling_unit}`,
      );
    } else if (content_measurement && content_unit) {
      setFormattedNamePreview(
        `${name || "Product"}, ${content_measurement} per ${content_unit}`,
      );
    } else {
      setFormattedNamePreview(name || "Product name will appear here");
    }
  };

  const validate = useCallback((data: ProductForm): Partial<ProductForm> => {
    const newErrors: Partial<ProductForm> = {};

    if (!data.name?.trim()) newErrors.name = "Product name is required.";
    if (!data.category_name) newErrors.category_name = "Category is required.";

    if (!data.stock) {
      newErrors.stock = "Stock quantity is required.";
    } else if (isNaN(Number(data.stock)) || Number(data.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required.";
    }

    if (!data.price_per_unit) {
      newErrors.price_per_unit = "Price per unit is required.";
    } else if (
      isNaN(Number(data.price_per_unit)) ||
      Number(data.price_per_unit) < 0
    ) {
      newErrors.price_per_unit = "Valid price per unit is required.";
    }

    if (data.image_url && !URL_PATTERN.test(data.image_url)) {
      newErrors.image_url = "Invalid URL format.";
    }

    // Validate packaging fields
    if (
      data.selling_unit_quantity &&
      isNaN(Number(data.selling_unit_quantity))
    ) {
      newErrors.selling_unit_quantity = "Must be a valid number.";
    }

    if (data.selling_unit_quantity && !data.selling_unit) {
      newErrors.selling_unit =
        "Selling unit is required when quantity is specified.";
    }

    if (data.selling_unit && !data.selling_unit_quantity) {
      newErrors.selling_unit_quantity =
        "Quantity is required when selling unit is specified.";
    }

    return newErrors;
  }, []);

  // Fetch dropdown data
  useEffect(() => {
    setCategories([
      { value: "", label: "Select Category" },
      ...(modalData?.productExtraData?.categories || []),
    ]);
    setContentUnits([
      { value: "", label: "Select Content Unit" },
      ...(modalData?.productExtraData?.content_units || []),
    ]);
    setContentUnitTypes([
      { value: "", label: "Select Unit Type" },
      ...(modalData?.productExtraData?.content_unit_types || []),
    ]);
    setSellingUnits([
      { value: "", label: "Select Selling Unit" },
      ...(modalData?.productExtraData?.selling_units || []),
    ]);
    // eslint-disable-next-line
  }, []);

  const handleChange = (name: keyof ProductForm) => (value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: keyof ProductForm) => {
    setErrors(validate(form));
  };

  const clearFileInput = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, []);

  const clearCsvFileInput = useCallback(() => {
    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  }, []);

  const onImageSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPEG, PNG, WEBP)");
      clearFileInput();
      return;
    }

    if (file.size > maxSize) {
      setImageError("File size must be less than 5MB");
      clearFileInput();
      return;
    }

    setImageError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onCsvSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["text/csv", "application/vnd.ms-excel"];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
      toast.error("Invalid File", {
        description: "Please select a valid CSV file",
      });
      clearCsvFileInput();
      return;
    }

    if (file.size > maxSize) {
      toast.error("File Too Large", {
        description: "CSV file must be less than 10MB",
      });
      clearCsvFileInput();
      return;
    }

    setCsvFile(file);
    parseCsvFile(file);
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast.error("File Error", {
          description: "Failed to read CSV file",
        });
        return;
      }

      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
      if (lines.length === 0) {
        toast.error("Empty File", {
          description: "The CSV file is empty",
        });
        return;
      }

      // Parse headers - handle quoted headers and different separators
      const firstLine = lines[0];
      let headers: string[] = [];

      // Try comma separator first
      headers = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

      // If only one column found, try semicolon
      if (headers.length === 1 && firstLine.includes(";")) {
        headers = firstLine
          .split(";")
          .map((h) => h.trim().replace(/^"|"$/g, ""));
      }

      // Validate headers
      const requiredHeaders = [
        "name",
        "category_name",
        "stock",
        "price_per_unit",
        "price_per_piece",
        "content_measurement",
        "content_unit",
        "selling_unit_quantity",
        "selling_unit",
      ];

      const headerMap: { [key: string]: string } = {};
      headers.forEach((header) => {
        headerMap[header.toLowerCase()] = header;
      });

      const missingHeaders = requiredHeaders.filter((h) => !headerMap[h]);
      if (missingHeaders.length > 0) {
        toast.error("Invalid CSV Format", {
          description: `Missing required columns: ${missingHeaders.join(", ")}`,
        });
        return;
      }

      const validationErrors: { row: number; errors: string[] }[] = [];
      const validProducts: IBulkAddProduct[] = [];
      const previewRows = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let values: string[];

        // Check if line contains commas
        if (line.includes(",") && !line.includes(";")) {
          values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        } else if (line.includes(";")) {
          values = line.split(";").map((v) => v.trim().replace(/^"|"$/g, ""));
        } else {
          // If no separator found, treat entire line as first column
          values = [line];
        }

        if (values.length < headers.length) {
          // Pad with empty strings if missing values
          while (values.length < headers.length) {
            values.push("");
          }
        } else if (values.length > headers.length) {
          // Join extra values into the last column
          const extraValues = values.slice(headers.length);
          values = values.slice(0, headers.length - 1);
          values[headers.length - 1] = [
            ...values.slice(headers.length - 1),
            ...extraValues,
          ].join(",");
        }

        const row: any = {};
        headers.forEach((header, index) => {
          const headerKey = header.toLowerCase();
          row[headerKey] = values[index] || "";
        });

        const rowErrors: string[] = [];

        // Validate required fields
        if (!row.name?.trim()) rowErrors.push("Product name is required");
        if (!row.category_name?.trim()) rowErrors.push("Category is required");

        const stockNum = Number(row.stock);
        if (!row.stock || isNaN(stockNum) || stockNum < 0)
          rowErrors.push("Valid stock quantity is required");

        const pricePerUnitNum = Number(row.price_per_unit);
        if (
          !row.price_per_unit ||
          isNaN(pricePerUnitNum) ||
          pricePerUnitNum < 0
        )
          rowErrors.push("Valid price per unit is required");

        const pricePerPieceNum = Number(row.price_per_piece);
        if (
          !row.price_per_piece ||
          isNaN(pricePerPieceNum) ||
          pricePerPieceNum < 0
        )
          rowErrors.push("Valid price per piece is required");

        if (!row.content_measurement?.trim())
          rowErrors.push("Content measurement is required");
        if (!row.content_unit?.trim())
          rowErrors.push("Content unit is required");

        const sellingUnitQuantityNum = Number(row.selling_unit_quantity);
        if (
          !row.selling_unit_quantity ||
          isNaN(sellingUnitQuantityNum) ||
          sellingUnitQuantityNum < 0
        ) {
          rowErrors.push("Valid selling unit quantity is required");
        }

        if (!row.selling_unit?.trim())
          rowErrors.push("Selling unit is required");

        if (rowErrors.length > 0) {
          validationErrors.push({ row: i + 1, errors: rowErrors });
        } else {
          validProducts.push({
            name: row.name.trim(),
            category_name: row.category_name.trim(),
            stock: row.stock,
            price_per_unit: row.price_per_unit,
            price_per_piece: row.price_per_piece,
            content_measurement: row.content_measurement.trim(),
            content_unit: row.content_unit.trim(),
            content_unit_type: row.content_unit_type?.trim() || "",
            selling_unit_quantity: row.selling_unit_quantity,
            selling_unit: row.selling_unit.trim(),
            image_url: row.image_url?.trim() || "",
            // FIX 4: Parse allow_pieces_sell as a boolean, not a raw string
            allow_pieces_sell: row.allow_pieces_sell !== "false",
          });
        }

        // Add to preview (limit to 5 rows for preview)
        if (i <= 5) {
          previewRows.push(row);
        }
      }

      setCsvData(validProducts);
      setCsvValidationErrors(validationErrors);
      setCsvPreview(previewRows);

      toast.success("CSV Parsed", {
        description: `Found ${validProducts.length} valid products. ${validationErrors.length} rows have errors.`,
      });
    };

    reader.onerror = () => {
      toast.error("File Read Error", {
        description: "Failed to read CSV file",
      });
    };

    reader.readAsText(file);
  };

  const removeCsvFile = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvValidationErrors([]);
    setCsvPreview([]);
    clearCsvFileInput();
  };

  const removeImage = (): void => {
    setImagePreview(null);
    setSelectedFile(null);
    setExistingImageUrl(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
    clearFileInput();
    setImageError(null);
  };

  const uploadImage =
    useCallback(async (): Promise<ICloudinaryImageUploadResponse | null> => {
      if (!selectedFile)
        return {
          secure_url: existingImageUrl || "",
          public_id: existingImageUrl || "",
        };

      setUploading(true);
      setImageError(null);

      try {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const uploadResponse = await appService.uploadAsset(formData);

        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || "Failed to upload image");
        }

        return uploadResponse?.results || null;
      } catch (error: any) {
        const errorMessage =
          error.error?.message || error.message || "Failed to upload image";
        setImageError(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    }, [selectedFile, existingImageUrl]);

  const saveProduct = async (productData: any): Promise<void> => {
    try {
      let response: any;

      if (isEditMode && modalData?.product?.id) {
        // Update existing product
        const payload = {
          ...productData,
          id: modalData.product.id,
        };
        response = await appService.updateProduct(payload);
      } else {
        // Create new product
        response = await appService.createProduct(productData);
      }

      if (!response.success) {
        throw new Error(
          response.message ||
            `Failed to ${isEditMode ? "update" : "create"} product.`,
        );
      }

      toast.success("Success", {
        description:
          response.message ||
          `Product ${isEditMode ? "updated" : "created"} successfully!`,
      });

      // Close the modal upon success
      modalRef!.close({ success: true, product: response.results });
    } catch (error: any) {
      toast.error("Error", {
        description:
          error.message ||
          `Failed to ${isEditMode ? "update" : "create"} product.`,
      });
      throw error;
    }
  };

  const bulkAddProducts = async (
    products: IBulkAddProduct[],
  ): Promise<void> => {
    try {
      setBulkLoading(true);

      const response = await appService.bulkAddProducts({ products });

      if (response.success) {
        toast.success("Bulk Import Successful", {
          description: `Successfully imported ${response.summary?.successCount || 0} products. ${response.summary?.failedCount || 0} failed.`,
        });

        // Show detailed errors if any
        if (response.errors && response.errors.length > 0) {
          console.warn("Bulk import errors:", response.errors);
          toast.warning("Some Products Failed", {
            description: `${response.errors.length} products failed. Check console for details.`,
          });
        }

        // Close the modal upon success
        modalRef!.close({ success: true, bulk: true });
      } else {
        throw new Error(response.message || "Failed to bulk add products");
      }
    } catch (error: any) {
      toast.error("Bulk Import Error", {
        description: error.message || "Failed to import products",
      });
      throw error;
    } finally {
      setBulkLoading(false);
    }
  };

  const onSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Validation Error", {
        description: "Please correct the highlighted fields.",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload image if a new file was selected
      let imageUrl: string | null = null;
      let imagePublicId: string | null = null;

      if (selectedFile) {
        const uploadedImage: ICloudinaryImageUploadResponse | null =
          await uploadImage();
        if (uploadedImage) {
          imageUrl = uploadedImage.secure_url;
          imagePublicId = uploadedImage.public_id;
        }
      } else {
        // Use existing image if no new file selected
        imageUrl = form.image_url || existingImageUrl;
      }

      // FIX 3: Include stock as a proper Number in the payload.
      // Previously stock was missing from finalFormData entirely,
      // so the backend never received it and no stock was saved.
      const finalFormData = {
        name: form.name.trim(),
        category_name: form.category_name,
        stock: Number(form.stock),                   // FIX 3
        price_per_unit: Number(form.price_per_unit),
        price_per_piece: Number(form.price_per_piece),
        allow_pieces_sell: form.allow_pieces_sell,
        content_measurement: form.content_measurement,
        content_unit: form.content_unit,
        content_unit_type: form.content_unit_type,
        selling_unit_quantity: form.selling_unit_quantity,
        selling_unit: form.selling_unit,
        image_url: imageUrl,
        image_public_id: imagePublicId,
      };

      await saveProduct(finalFormData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitBulk = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csvFile) {
      toast.error("No File", {
        description: "Please select a CSV file to upload",
      });
      return;
    }

    if (csvData.length === 0) {
      toast.error("No Valid Data", {
        description: "No valid products found in the CSV file",
      });
      return;
    }

    if (csvValidationErrors.length > 0) {
      toast.warning(
        `There are ${csvValidationErrors.length} rows with errors. Do you want to proceed with the ${csvData.length} valid rows?`,
      );
    }

    await bulkAddProducts(csvData);
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  // Calculate price per piece for display
  const calculatePricePerPiece = () => {
    const pricePerUnit = parseFloat(form.price_per_unit) || 0;
    const sellingUnitQuantity = parseFloat(form.selling_unit_quantity) || 1;

    if (pricePerUnit > 0 && sellingUnitQuantity > 0) {
      return pricePerUnit / sellingUnitQuantity;
    }
    return 0;
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isEditMode ? "Edit Product" : "Add Product"}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isEditMode
              ? "Update product information and inventory details."
              : "Add products to your inventory."}
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Tabs */}
      {!isEditMode && (
        <div className="flex border-b border-border mb-6">
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "single"
                ? "text-primary border-b-2 border-primary"
                : "text-text-light hover:text-text"
            }`}
            onClick={() => setActiveTab("single")}
          >
            <i className="ri-add-line mr-2"></i>
            Single Product
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === "bulk"
                ? "text-primary border-b-2 border-primary"
                : "text-text-light hover:text-text"
            }`}
            onClick={() => setActiveTab("bulk")}
          >
            <i className="ri-upload-cloud-line mr-2"></i>
            Bulk Import
          </button>
        </div>
      )}

      {/* Single Product Form */}
      {activeTab === "single" && (
        <>
          {/* Name Preview */}
          <div className="bg-info-5 border border-info-20 rounded-sm p-3 mb-6">
            <div className="flex items-center">
              <i className="ri-eye-line text-info text-lg mr-3"></i>
              <div className="flex-1">
                <p className="font-medium text-info mb-1">
                  Product Name Preview
                </p>
                <p className="text-sm text-info">{formattedNamePreview}</p>
              </div>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
            <form onSubmit={onSubmitSingle} className="space-y-6">
              <div className="flex flex-col gap-6">
                {/* Column 1: Basic Information */}
                <div className="space-y-4 border border-border rounded-sm p-4">
                  <div className="flex items-center mb-4">
                    <i className="ri-information-line text-primary text-lg mr-2"></i>
                    <h3 className="font-semibold text-text">
                      Basic Information
                    </h3>
                  </div>

                  <Input
                    label="Product Name"
                    placeholder="Enter product name"
                    required
                    name="name"
                    id="name"
                    value={form.name}
                    onChange={handleChange("name")}
                    onBlur={() => handleBlur("name")}
                    error={errors.name}
                  />

                  <div className="grid grid-cols-2 gap-x-4">
                    {/* FIX 3: Stock field is always rendered (was previously
                        hidden in edit mode but the real issue was it was also
                        missing from the submit payload in add mode) */}
                    <Input
                      label="Stock Quantity"
                      type="number"
                      placeholder="0"
                      required={!isEditMode}
                      name="stock"
                      id="stock"
                      value={form.stock}
                      onChange={handleChange("stock")}
                      onBlur={() => handleBlur("stock")}
                      error={errors.stock}
                      min={parseFloat("0")}
                      // Hide the field visually in edit mode (stock is managed
                      // via stock-in / stock-out operations, not direct edits)
                    />
                    <Input
                      type="select"
                      label="Category"
                      placeholder="Select Category"
                      required
                      name="category_name"
                      id="category_name"
                      selectOptions={categories}
                      value={form.category_name}
                      onChange={handleChange("category_name")}
                      onBlur={() => handleBlur("category_name")}
                      error={errors.category_name}
                    />
                  </div>
                </div>

                {/* Column 2: Pricing Information */}
                <div className="space-y-4 border border-border rounded-sm p-4">
                  <div className="flex items-center mb-4">
                    <i className="ri-money-dollar-circle-line text-primary text-lg mr-2"></i>
                    <h3 className="font-semibold text-text">
                      Pricing Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4">
                    <Input
                      label="Price Per Unit (Box/Pack)"
                      type="number"
                      step={0.01}
                      placeholder="0.00"
                      required
                      name="price_per_unit"
                      id="price_per_unit"
                      value={form.price_per_unit}
                      onChange={handleChange("price_per_unit")}
                      onBlur={() => handleBlur("price_per_unit")}
                      error={errors.price_per_unit}
                      min={parseFloat("0")}
                      hint="Price for entire selling unit (box/pack)"
                    />

                    <Input
                      label="Price Per Piece"
                      type="number"
                      step={0.01}
                      placeholder="0.00"
                      required
                      name="price_per_piece"
                      id="price_per_piece"
                      value={form.price_per_piece}
                      onChange={handleChange("price_per_piece")}
                      onBlur={() => handleBlur("price_per_piece")}
                      min={parseFloat("0")}
                      hint={`Calculated: GHS ${calculatePricePerPiece().toFixed(2)} per piece`}
                    />
                  </div>

                  {form.price_per_unit && form.selling_unit_quantity && (
                    <div className="bg-success-5 border border-success-20 rounded-sm p-3">
                      <div className="flex items-center">
                        <i className="ri-calculator-line text-success text-lg mr-2"></i>
                        <div>
                          <p className="text-sm font-medium text-success mb-1">
                            Price Breakdown:
                          </p>
                          <p className="text-sm text-success">
                            1 {form.selling_unit || "unit"} (
                            {form.selling_unit_quantity || "1"} pieces) = GHS{" "}
                            {form.price_per_unit}
                          </p>
                          <p className="text-sm text-success">
                            1 piece = GHS {calculatePricePerPiece().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 3: Packaging & Image */}
                <div className="space-y-4 border border-border rounded-sm p-4">
                  <div className="flex items-center mb-4">
                    <i className="ri-package-line text-primary text-lg mr-2"></i>
                    <h3 className="font-semibold text-text">
                      Packaging Details
                    </h3>
                  </div>

                  <div className="bg-primary-5 border border-primary rounded-sm p-3 mb-4">
                    <div className="flex items-start">
                      <i className="ri-lightbulb-flash-line text-primary-50 text-lg mr-2 mt-0.5"></i>
                      <div>
                        <p className="text-sm text-primary-80 font-medium mb-1">
                          Example:
                        </p>
                        <p className="text-sm text-primary-70">
                          A 6-pack of 400ml energy drinks would be:
                          <span className="font-semibold">
                            {" "}
                            Content Measurement: 400ml
                          </span>
                          ,
                          <span className="font-semibold">
                            {" "}
                            Content Unit: can
                          </span>
                          ,
                          <span className="font-semibold">
                            {" "}
                            Selling Unit Quantity: 6
                          </span>
                          ,
                          <span className="font-semibold">
                            {" "}
                            Selling Unit: Pack
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4">
                    <Input
                      label="Content Measurement"
                      placeholder="e.g., 400g, 1Kg, 50ml, 1L"
                      name="content_measurement"
                      id="content_measurement"
                      value={form.content_measurement}
                      onChange={handleChange("content_measurement")}
                      onBlur={() => handleBlur("content_measurement")}
                    />

                    <Input
                      type="select"
                      label="Content Unit"
                      placeholder="Select Unit"
                      name="content_unit"
                      id="content_unit"
                      selectOptions={contentUnits}
                      value={form.content_unit}
                      onChange={handleChange("content_unit")}
                      onBlur={() => handleBlur("content_unit")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4">
                    <Input
                      label="Selling Unit Quantity"
                      type="number"
                      placeholder="e.g., 6, 12, 24 in a pack"
                      name="selling_unit_quantity"
                      id="selling_unit_quantity"
                      value={form.selling_unit_quantity}
                      onChange={handleChange("selling_unit_quantity")}
                      onBlur={() => handleBlur("selling_unit_quantity")}
                      error={errors.selling_unit_quantity}
                      min={parseFloat("1")}
                      hint="Number of pieces per selling unit"
                    />

                    <Input
                      type="select"
                      label="Selling Unit"
                      placeholder="Select Unit"
                      name="selling_unit"
                      id="selling_unit"
                      selectOptions={sellingUnits}
                      value={form.selling_unit}
                      onChange={handleChange("selling_unit")}
                      onBlur={() => handleBlur("selling_unit")}
                      error={errors.selling_unit}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-4">
                    <Input
                      type="select"
                      label="Content Unit Type"
                      placeholder="Select Unit Type"
                      name="content_unit_type"
                      id="content_unit_type"
                      selectOptions={contentUnitTypes}
                      value={form.content_unit_type}
                      onChange={handleChange("content_unit_type")}
                      onBlur={() => handleBlur("content_unit_type")}
                      error={errors.content_unit_type}
                    />

                    <div className="flex flex-col items-start justify-end">
                      <p className="text-xs text-text-light -mt-3">
                        Allow selling individual pieces from this product.
                      </p>

                      <Input
                        type="checkbox"
                        label="Allow Pieces Sell"
                        name="allow_pieces_sell"
                        id="allow_pieces_sell"
                        value={form.allow_pieces_sell}
                        onChange={handleChange("allow_pieces_sell")}
                      />
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-2 mt-4">
                    <Input
                      label="Image URL (Optional)"
                      type="url"
                      placeholder="https://example.com/product-image.jpg"
                      name="image_url"
                      id="image_url"
                      value={form.image_url}
                      onChange={handleChange("image_url")}
                      onBlur={() => handleBlur("image_url")}
                      error={errors.image_url}
                    />

                    <div className="text-sm text-text-light mb-2">
                      Or upload an image:
                    </div>

                    {imagePreview && (
                      <div className="relative inline-block w-full">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-full h-40 rounded-lg object-contain border border-border p-2"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-80 transition-colors z-20"
                        >
                          &times;
                        </button>
                      </div>
                    )}

                    {!imagePreview && (
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                          <input
                            type="file"
                            ref={imageInputRef}
                            onChange={onImageSelected}
                            accept="image/*"
                            className="hidden"
                          />
                          <div className="h-40 border-2 border-dashed border-border rounded-sm p-4 text-center hover:border-primary transition-colors">
                            <i className="ri-upload-cloud-2-line text-2xl text-text-light mb-2 block"></i>
                            <p className="text-sm text-text-light">
                              Click to upload product image
                            </p>
                            <p className="text-xs text-text-lighter mt-1">
                              PNG, JPG, WEBP up to 5MB
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm text-text-light">
                          <i className="ri-loader-4-line animate-spin"></i>
                          <span>Uploading image...</span>
                        </div>
                      </div>
                    )}

                    {imageError && (
                      <div className="text-danger text-sm mt-1">
                        {imageError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Bulk Import Form */}
      {activeTab === "bulk" && (
        <div className="flex-1 overflow-y-auto space-y-6 pb-4">
          <form onSubmit={onSubmitBulk} className="space-y-6">
            {/* Instructions */}
            <div className="bg-info-5 border border-info-20 rounded-sm p-4">
              <div className="flex items-start">
                <i className="ri-information-line text-info text-lg mr-3 mt-0.5"></i>
                <div className="flex-1">
                  <p className="font-medium text-info mb-2">
                    How to Bulk Import
                  </p>
                  <ul className="text-sm text-info space-y-1">
                    <li>
                      • Download the CSV template using the export feature
                    </li>
                    <li>• Fill in the required fields for each product</li>
                    <li>• Upload the CSV file below</li>
                    <li>• Review the data before importing</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-file-excel-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Upload CSV File</h3>
              </div>

              {!csvFile ? (
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      ref={csvInputRef}
                      onChange={onCsvSelected}
                      accept=".csv"
                      className="hidden"
                    />
                    <div className="h-40 border-2 border-dashed border-border rounded-sm p-6 text-center hover:border-primary transition-colors">
                      <i className="ri-file-upload-line text-3xl text-text-light mb-3 block"></i>
                      <p className="text-lg text-text mb-2">Upload CSV File</p>
                      <p className="text-sm text-text-light">
                        Click to select a CSV file or drag and drop
                      </p>
                      <p className="text-xs text-text-lighter mt-2">
                        CSV files only, max 10MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background-5 rounded-sm">
                    <div className="flex items-center">
                      <i className="ri-file-excel-line text-success text-xl mr-3"></i>
                      <div>
                        <p className="font-medium">{csvFile.name}</p>
                        <p className="text-sm text-text-light">
                          {(csvFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCsvFile}
                      className="text-danger hover:text-danger-80"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>

                  {/* Validation Summary */}
                  {csvValidationErrors.length > 0 && (
                    <div className="bg-warning-5 border border-warning-20 rounded-sm p-3">
                      <div className="flex items-center mb-2">
                        <i className="ri-error-warning-line text-warning text-lg mr-2"></i>
                        <p className="font-medium text-warning">
                          {csvValidationErrors.length} rows have validation
                          errors
                        </p>
                      </div>
                      <details>
                        <summary className="text-sm text-warning cursor-pointer hover:underline">
                          Click to view errors
                        </summary>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {csvValidationErrors.map((error, index) => (
                            <div
                              key={index}
                              className="text-xs text-warning mb-1"
                            >
                              Row {error.row}: {error.errors.join(", ")}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Data Preview */}
                  {csvPreview.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-text">
                        Data Preview ({csvData.length} valid rows):
                      </p>
                      <div className="border border-border rounded-sm overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-background-10">
                            <tr>
                              <th className="p-2 text-left">Name</th>
                              <th className="p-2 text-left">Category</th>
                              <th className="p-2 text-left">Stock</th>
                              <th className="p-2 text-left">Price/Unit</th>
                              <th className="p-2 text-left">Price/Piece</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, index) => (
                              <tr
                                key={index}
                                className="border-t border-border"
                              >
                                <td className="p-2">{row.name}</td>
                                <td className="p-2">{row.category_name}</td>
                                <td className="p-2">{row.stock}</td>
                                <td className="p-2">{row.price_per_unit}</td>
                                <td className="p-2">{row.price_per_piece}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Required Fields Info */}
            <div className="bg-background-5 border border-border rounded-sm p-4">
              <p className="font-medium text-text mb-2">
                Required Fields in CSV:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>name</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>category_name</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>stock</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>price_per_unit</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>price_per_piece</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>allow_pieces_sell</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>content_unit_type</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>content_measurement</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>content_unit</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>selling_unit_quantity</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-circle-fill text-success mr-2"></i>
                  <span>selling_unit</span>
                </div>
                <div className="flex items-center">
                  <i className="ri-checkbox-blank-circle-line text-text-light mr-2"></i>
                  <span className="text-text-light">image_url (optional)</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        {activeTab === "single" ? (
          <Button
            type="submit"
            onClick={onSubmitSingle}
            disabled={!isFormValid || loading || uploading}
            loading={loading || uploading}
            variant="primary"
          >
            {uploading
              ? "Uploading Image..."
              : loading
                ? "Processing..."
                : isEditMode
                  ? "Update Product"
                  : "Add Product"}
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={onSubmitBulk}
            disabled={!csvFile || csvData.length === 0 || bulkLoading}
            loading={bulkLoading}
            variant="primary"
          >
            {bulkLoading ? "Importing..." : `Import ${csvData.length} Products`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AddProductModal;