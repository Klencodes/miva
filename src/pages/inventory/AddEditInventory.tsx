import React, { useState, useCallback, useEffect, useRef } from "react";
import { useModal } from "../../core/hooks/useModal";
import { Button, Input } from "../../components/common";
import { SelectOption } from "../../components/common/Input";
import { toast } from "sonner";
import { InvItemType, InvItemUnitType, InventoryItem } from "../../core/types";
import InventoryService from "../../core/services/inventory";
import * as XLSX from "xlsx";

interface InventoryFormData {
  name: string;
  part_number: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity: string;
  reorder_threshold: string;
  cost: string;
  price: string;
  supplier: string;
  image: string;
  metadata: Record<string, any>;
}

interface BulkInventoryItem {
  name: string;
  part_number?: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity: number;
  reorder_threshold: number;
  cost: number;
  price: number;
  supplier?: string;
  image?: string;
  metadata?: Record<string, any>;
}

const initialFormState: InventoryFormData = {
  name: "",
  part_number: "",
  type: "other",
  unit: "pieces",
  quantity: "0",
  reorder_threshold: "5",
  cost: "0",
  price: "0",
  supplier: "",
  image: "",
  metadata: {},
};

const typeOptions: SelectOption[] = [
  { value: "hose", label: "Hose" },
  { value: "fitting", label: "Fitting" },
  { value: "ferrule", label: "Ferrule" },
  { value: "assembly", label: "Assembly" },
  { value: "adapter", label: "Adapter" },
  { value: "coupling", label: "Coupling" },
  { value: "other", label: "Other" },
];

const unitOptions: SelectOption[] = [
  { value: "meters", label: "Meters" },
  { value: "feet", label: "Feet" },
  { value: "pieces", label: "Pieces" },
];

// Example metadata templates
const metadataExamples = [
  {
    name: "Hydraulic Hose Specs",
    fields: {
      sae: "100R1AT",
      pressure: "250 bar",
      temperature: "-40°C to +100°C",
      material: "Rubber",
      inner_diameter: "12.7mm",
      outer_diameter: "19.5mm",
      bend_radius: "100mm",
      weight_per_meter: "0.8kg",
      manufacturer: "Parker",
      certification: "ISO 18752",
    },
  },
  {
    name: "Fitting Specs",
    fields: {
      thread_type: "BSP",
      thread_size: '1/2"',
      material: "Stainless Steel 316",
      pressure_rating: "3000 PSI",
      temperature_range: "-20°C to +200°C",
      surface_finish: "Zinc Plated",
      hex_size: "19mm",
      length: "42mm",
      weight: "0.15kg",
      standard: "DIN 2353",
    },
  },
  {
    name: "Ferrule Specs",
    fields: {
      hose_type: "EN853 1SN",
      material: "Carbon Steel",
      finish: "Zinc Plated",
      pressure_rating: "350 bar",
      crimp_diameter: "28.5mm",
      length: "32mm",
      weight: "0.08kg",
      applicable_hoses: "R2T-06, R2T-08",
      brand: "MIVA-CRIMP",
      stock_location: "Warehouse A",
    },
  },
];

const AddEditInventory: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const [form, setForm] = useState<InventoryFormData>(initialFormState);
  const [errors, setErrors] = useState<Partial<InventoryFormData>>({});
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [itemUuid, setItemUuid] = useState<string | null>(null);
  const [customMetadataKey, setCustomMetadataKey] = useState("");
  const [customMetadataValue, setCustomMetadataValue] = useState("");

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkInventoryItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (modalData?.item) {
      setIsEditMode(true);
      setItemUuid(modalData.item.uuid);
      const item = modalData.item as InventoryItem;

      setForm({
        name: item.name || "",
        part_number: item.part_number || "",
        type: item.type || "other",
        unit: item.unit || "pieces",
        quantity: String(item.quantity || 0),
        reorder_threshold: String(item.reorder_threshold || 5),
        cost: String(item.cost || 0),
        price: String(item.price || 0),
        supplier: item.supplier || "",
        image: item.image || "",
        metadata: item.metadata || {},
      });
    }
  }, [modalData]);

  const validate = useCallback(
    (data: InventoryFormData): Partial<InventoryFormData> => {
      const newErrors: Partial<InventoryFormData> = {};
      if (!data.name) newErrors.name = "Item name is required.";
      if (Number(data.quantity) < 0)
        newErrors.quantity = "Quantity cannot be negative.";
      if (Number(data.cost) < 0) newErrors.cost = "Cost cannot be negative.";
      if (Number(data.price) < 0) newErrors.price = "Price cannot be negative.";
      if (Number(data.reorder_threshold) < 0)
        newErrors.reorder_threshold = "Reorder threshold cannot be negative.";
      return newErrors;
    },
    [],
  );

  const handleChange = (name: keyof InventoryFormData) => (value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handleAddCustomMetadata = () => {
    if (customMetadataKey && customMetadataValue) {
      setForm((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [customMetadataKey]: customMetadataValue,
        },
      }));
      setCustomMetadataKey("");
      setCustomMetadataValue("");
    }
  };

  const handleRemoveMetadata = (key: string) => {
    setForm((prev) => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return { ...prev, metadata: newMetadata };
    });
  };

  const handleApplyExample = (exampleIndex: number) => {
    const example = metadataExamples[exampleIndex];
    setSelectedExample(exampleIndex);
    setForm((prev) => ({
      ...prev,
      metadata: { ...example.fields },
    }));
    toast.success("Example Applied", {
      description: `Applied "${example.name}" metadata template`,
    });
  };

  // Handle file upload for bulk import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data: any[] = [];

        if (file.name.endsWith(".json")) {
          // Parse JSON
          const jsonData = JSON.parse(e.target?.result as string);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Parse Excel
          const workbook = XLSX.read(e.target?.result, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(firstSheet);
        } else {
          toast.error("Invalid file format", {
            description:
              "Please upload a JSON or Excel file (.json, .xlsx, .xls)",
          });
          return;
        }

        // Map data to inventory items
        const mappedItems: BulkInventoryItem[] = data.map((item: any) => ({
          name: item.name || item.Name || item.item_name || "",
          part_number:
            item.part_number || item.PartNumber || item.part_no || "",
          type: (
            item.type ||
            item.Type ||
            "other"
          ).toLowerCase() as InvItemType,
          unit: (
            item.unit ||
            item.Unit ||
            "pieces"
          ).toLowerCase() as InvItemUnitType,
          quantity: parseFloat(item.quantity || item.Quantity || 0),
          reorder_threshold: parseFloat(
            item.reorder_threshold || item.ReorderThreshold || 5,
          ),
          cost: parseFloat(item.cost || item.Cost || 0),
          price: parseFloat(item.price || item.Price || 0),
          supplier: item.supplier || item.Supplier || "",
          image: item.image || item.Image || "",
          metadata: item.metadata || item.Metadata || {},
        }));

        // Filter out invalid items
        const validItems = mappedItems.filter((item) => item.name);
        if (validItems.length === 0) {
          toast.error("No valid items found", {
            description: "Each item must have at least a name field",
          });
          return;
        }

        setBulkItems(validItems);
        toast.success("File uploaded", {
          description: `Found ${validItems.length} items ready to import`,
        });
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Error parsing file", {
          description: "Please check the file format and try again",
        });
      }
    };

    if (file.name.endsWith(".json")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle bulk submit
  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      toast.error("No items to import", {
        description: "Please upload a file with inventory items",
      });
      return;
    }

    setBulkLoading(true);
    try {
      const response = await InventoryService.bulkCreateItems(bulkItems);

      if (response.success) {
        toast.success("Bulk import successful", {
          description: `Created ${response.results?.created?.length || 0} items successfully`,
        });

        if (response.results?.failed?.length > 0) {
          toast.warning("Some items failed", {
            description: `${response.results.failed.length} items failed to import`,
          });
        }

        modalRef?.close({ success: true, data: response.results });
      }
    } catch (error: any) {
      console.error("Error importing items:", error);
      toast.error("Import failed", {
        description: error.message || "Failed to import items",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const formData = {
        name: form.name,
        part_number: form.part_number || undefined,
        type: form.type as InvItemType,
        unit: form.unit as InvItemUnitType,
        quantity: Number(form.quantity),
        reorder_threshold: Number(form.reorder_threshold),
        cost: Number(form.cost),
        price: Number(form.price),
        supplier: form.supplier || undefined,
        image: form.image || undefined,
        metadata: form.metadata,
      };

      let response;
      if (isEditMode && itemUuid) {
        response = await InventoryService.updateItem(itemUuid, formData);
      } else {
        response = await InventoryService.createItem(formData);
      }

      if (response.success) {
        toast.success("Success", {
          description: `Inventory item ${isEditMode ? "updated" : "created"} successfully!`,
        });

        modalRef?.close({ success: true, data: response.results });
      }
    } catch (error: any) {
      console.error("Error saving inventory item:", error);
      toast.error("Error", {
        description:
          error.message ||
          `Failed to ${isEditMode ? "update" : "create"} inventory item.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex justify-between items-center bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isEditMode ? "Edit Inventory Item" : "Add New Inventory Item"}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isEditMode
              ? "Update your inventory item details."
              : "Add a new item to your inventory."}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
            >
              <i className="ri-upload-2-line mr-1"></i>
              {showBulkUpload ? "Single Item" : "Bulk Upload"}
            </Button>
          )}
          <button
            onClick={() => modalRef?.dismiss()}
            className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 px-6">
        {showBulkUpload && !isEditMode ? (
          // Bulk Upload View
          <div className="space-y-6 py-4">
            <div className="bg-primary-5 p-4 rounded-lg border border-primary-20">
              <h3 className="font-semibold text-text mb-2">
                Bulk Upload Instructions
              </h3>
              <ul className="text-sm text-text-light space-y-1 list-disc list-inside">
                <li>Upload a JSON or Excel file with your inventory items</li>
                <li>
                  Required fields: name, type, unit, quantity, cost, price
                </li>
                <li>
                  Optional fields: part_number, reorder_threshold, supplier,
                  image, metadata
                </li>
                <li>Metadata can be any key-value pairs</li>
              </ul>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,.xlsx,.xls"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <i className="ri-upload-cloud-2-line text-4xl text-text-light"></i>
                <div>
                  <p className="text-text font-medium">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-text-light">
                    Supports .json, .xlsx, .xls
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="ri-folder-open-line mr-1"></i>
                  Choose File
                </Button>
              </div>
            </div>

            {bulkItems.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-background p-3 border-b border-border flex justify-between items-center">
                  <span className="font-medium text-text">
                    {bulkItems.length} items ready to import
                  </span>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setBulkItems([])}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-background sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                          Part #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-light">
                          Type
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-text-light">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-text-light">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bulkItems.slice(0, 20).map((item, index) => (
                        <tr key={index} className="hover:bg-background">
                          <td className="px-3 py-2 text-sm text-text">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-sm text-text-light">
                            {item.part_number || "—"}
                          </td>
                          <td className="px-3 py-2 text-sm text-text-light">
                            {item.type}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-text">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-sm text-right text-text">
                            GHS {item.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {bulkItems.length > 20 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-2 text-center text-sm text-text-light"
                          >
                            And {bulkItems.length - 20} more items...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBulkUpload(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkSubmit}
                disabled={bulkItems.length === 0 || bulkLoading}
                loading={bulkLoading}
              >
                {bulkLoading
                  ? "Importing..."
                  : `Import ${bulkItems.length} Items`}
              </Button>
            </div>
          </div>
        ) : (
          // Single Item Form
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Basic Info */}
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <div className="flex items-center mb-4">
                  <i className="ri-information-line text-primary text-lg mr-2"></i>
                  <h3 className="font-semibold text-text">Basic Information</h3>
                </div>

                <Input
                  label="Item Name"
                  placeholder="Enter item name"
                  required
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  error={errors.name}
                />

                <Input
                  label="Part Number"
                  placeholder="HOSE-001"
                  name="part_number"
                  id="part_number"
                  value={form.part_number}
                  onChange={handleChange("part_number")}
                />

                <Input
                  type="select"
                  label="Type"
                  required
                  name="type"
                  id="type"
                  selectOptions={typeOptions}
                  value={form.type}
                  onChange={handleChange("type")}
                />

                <Input
                  type="select"
                  label="Unit"
                  required
                  name="unit"
                  id="unit"
                  selectOptions={unitOptions}
                  value={form.unit}
                  onChange={handleChange("unit")}
                />

                <Input
                  type="number"
                  label="Quantity"
                  placeholder="0"
                  required
                  name="quantity"
                  id="quantity"
                  value={form.quantity}
                  onChange={handleChange("quantity")}
                  error={errors.quantity}
                  min={0}
                />

                <Input
                  type="number"
                  label="Reorder Threshold"
                  placeholder="5"
                  required
                  name="reorder_threshold"
                  id="reorder_threshold"
                  value={form.reorder_threshold}
                  onChange={handleChange("reorder_threshold")}
                  error={errors.reorder_threshold}
                  min={0}
                />
              </div>

              {/* Column 2: Pricing & Supplier */}
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <div className="flex items-center mb-4">
                  <i className="ri-money-dollar-circle-line text-primary text-lg mr-2"></i>
                  <h3 className="font-semibold text-text">
                    Pricing & Supplier
                  </h3>
                </div>

                <Input
                  type="number"
                  label="Cost (GHS)"
                  placeholder="0.00"
                  required
                  name="cost"
                  id="cost"
                  value={form.cost}
                  onChange={handleChange("cost")}
                  error={errors.cost}
                  min={0}
                  step={0.01}
                />

                <Input
                  type="number"
                  label="Price (GHS)"
                  placeholder="0.00"
                  required
                  name="price"
                  id="price"
                  value={form.price}
                  onChange={handleChange("price")}
                  error={errors.price}
                  min={0}
                  step={0.01}
                />

                <Input
                  label="Supplier"
                  placeholder="Supplier name"
                  name="supplier"
                  id="supplier"
                  value={form.supplier}
                  onChange={handleChange("supplier")}
                />

                <Input
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  name="image"
                  id="image"
                  value={form.image}
                  onChange={handleChange("image")}
                />
              </div>
            </div>

            {/* Metadata Section - Flexible */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <i className="ri-settings-3-line text-primary text-lg mr-2"></i>
                  <h3 className="font-semibold text-text">
                    Metadata (Optional)
                  </h3>
                </div>
                <span className="text-xs text-text-light">
                  Add any custom fields
                </span>
              </div>

              {/* Example Templates */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-text mb-2">
                  Quick Templates
                </h4>
                <div className="flex flex-wrap gap-2">
                  {metadataExamples.map((example, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={
                        selectedExample === index ? "primary" : "outline"
                      }
                      size="sm"
                      onClick={() => handleApplyExample(index)}
                      className="text-xs"
                    >
                      <i className="ri-template-line mr-1"></i>
                      {example.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Metadata */}
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-sm font-medium text-text mb-3">
                  Add Custom Metadata
                </h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="Key"
                      placeholder="e.g., manufacturer, angle_bar, thread_size"
                      name="custom_key"
                      id="custom_key"
                      value={customMetadataKey}
                      onChange={(value) => {
                        // Automatically convert spaces to underscores and lowercase
                        const formattedValue = value
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        setCustomMetadataKey(formattedValue);
                      }}
                    />
                    <p className="text-xs text-text-light mt-1">
                      Use snake_case: e.g., angle_bar, thread_size, max_pressure
                    </p>
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Value"
                      placeholder="e.g., Parker, 47, 3000 PSI"
                      name="custom_value"
                      id="custom_value"
                      value={customMetadataValue}
                      onChange={(value) => setCustomMetadataValue(value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddCustomMetadata}
                    variant="outline"
                  >
                    <i className="ri-add-line mr-1"></i> Add
                  </Button>
                </div>
              </div>

              {/* Display Current Metadata */}
              {Object.keys(form.metadata).length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-text mb-2">
                    Current Metadata
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(form.metadata).map(([key, value]) => {
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border"
                        >
                          <span className="text-xs font-medium text-text">
                            {key}:
                          </span>
                          <span className="text-xs text-text-light">
                            {String(value)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMetadata(key)}
                            className="text-text-light hover:text-red-500 transition-colors"
                          >
                            <i className="ri-close-line text-sm"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      {!showBulkUpload && (
        <div className="flex justify-end items-center p-4 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            loading={loading}
            variant="primary"
          >
            {loading
              ? "Processing..."
              : isEditMode
                ? "Update Item"
                : "Add Item"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AddEditInventory;
