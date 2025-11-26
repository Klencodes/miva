import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { IProduct } from "../../../core/interfaces/IProduct";
import { toast } from "sonner";

interface ProductForm {
  name: string;
  category_name: string;
  stock: string;
  price: string;
  content_measurement: string;
  content_unit: string;
  selling_unit_quantity: string;
  selling_unit: string;
  image_url: string;
}

interface ProductFormModalProps {
  data?: any;
}

const initialFormState: ProductForm = {
  name: "",
  category_name: "",
  stock: "",
  price: "",
  content_measurement: "",
  content_unit: "",
  selling_unit_quantity: "",
  selling_unit: "",
  image_url: "",
};

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

const AddProductModal: React.FC<ProductFormModalProps> = () => {
  const { modalRef, modalData } = useModal();

  const [form, setForm] = useState<ProductForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [contentUnits, setContentUnits] = useState<SelectOption[]>([]);
  const [sellingUnits, setSellingUnits] = useState<SelectOption[]>([]);
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
        price: product.price?.toString() || "",
        content_measurement: product.content_measurement || "",
        content_unit: product.content_unit || "",
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

    if (selling_unit_quantity && content_measurement && selling_unit) {
      setFormattedNamePreview(
        `${
          name || "Product"
        }, ${selling_unit_quantity}x${content_measurement} per ${selling_unit}`
      );
    } else if (content_measurement && content_unit) {
      setFormattedNamePreview(
        `${name || "Product"}, ${content_measurement} per ${content_unit}`
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

    if (!data.price) {
      newErrors.price = "Price is required.";
    } else if (isNaN(Number(data.price)) || Number(data.price) < 0) {
      newErrors.price = "Valid price is required.";
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
    setCategories(modalData?.productExtraData?.categories || []);
    setContentUnits(modalData?.productExtraData?.content_units || []);
    setSellingUnits(modalData?.productExtraData?.selling_units || []);
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

  const onImageSelected = (
    event: React.ChangeEvent<HTMLInputElement>
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

  const removeImage = (): void => {
    setImagePreview(null);
    setSelectedFile(null);
    setExistingImageUrl(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
    clearFileInput();
    setImageError(null);
  };

  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) return existingImageUrl;

    setUploading(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const uploadResponse = await appService.uploadAsset(formData);

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || "Failed to upload image");
      }

      return uploadResponse?.results?.secure_url || null;
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
            `Failed to ${isEditMode ? "update" : "create"} product.`
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

  const onSubmit = async (e: React.FormEvent) => {
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
      let imageUrl: string | null = null;

      // Upload image if a new file was selected
      if (selectedFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      } else {
        imageUrl = form.image_url || existingImageUrl;
      }

      const finalFormData = {
        name: form.name.trim(),
        category_name: form.category_name,
        stock: form.stock,
        price: Number(form.price),
        content_measurement: form.content_measurement || undefined,
        content_unit: form.content_unit || undefined,
        selling_unit_quantity: form.selling_unit_quantity || undefined,
        selling_unit: form.selling_unit || undefined,
        image_url: imageUrl || undefined,
      };

      await saveProduct(finalFormData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isEditMode ? "Edit Product" : "Add New Product"}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isEditMode
              ? "Update product information and inventory details."
              : "Add a new product to your inventory."}
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

      {/* Name Preview */}
      <div className="bg-info-5 border border-info-20 rounded-sm p-3 mb-6">
        <div className="flex items-center">
          <i className="ri-eye-line text-info text-lg mr-3"></i>
          <div className="flex-1">
            <p className="font-medium text-info mb-1">Product Name Preview</p>
            <p className="text-sm text-info">{formattedNamePreview}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col gap-6">
            {/* Column 1: Basic Information */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-information-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Basic Information</h3>
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

             
              <div className="grid grid-cols-2 gap-4">
                {!isEditMode && (<Input
                  label="Stock Quantity"
                  type="number"
                  placeholder="0"
                  required
                  name="stock"
                  id="stock"
                  value={form.stock}
                  onChange={handleChange("stock")}
                  onBlur={() => handleBlur("stock")}
                  error={errors.stock}
                  min={parseFloat("0")}
                />)}
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


                <Input
                  label="Price(GHS)"
                  type="number"
                  step={parseFloat("0.01")}
                  placeholder="0.00"
                  required
                  name="price"
                  id="price"
                  value={form.price}
                  onChange={handleChange("price")}
                  onBlur={() => handleBlur("price")}
                  error={errors.price}
                  min={parseFloat("0")}
                />
              </div>
            </div>

            {/* Column 2: Packaging & Image */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-package-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Packaging Details</h3>
              </div>
              {/* Example Section */}
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
                      ,<span className="font-semibold"> Content Unit: can</span>,
                      <span className="font-semibold">
                        {" "}
                        Selling Unit Quantity: 6
                      </span>
                      ,
                      <span className="font-semibold"> Selling Unit: Pack</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                  min={parseFloat("0")}
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
                  <div className="text-danger text-sm mt-1">{imageError}</div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          type="submit"
          onClick={onSubmit}
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
      </div>
    </div>
  );
};

export default AddProductModal;
