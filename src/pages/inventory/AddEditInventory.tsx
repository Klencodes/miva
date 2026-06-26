import React, { useState, useCallback, useEffect, useRef } from "react";
import { useModal } from "../../core/hooks/useModal";
import { Button, Input } from "../../components/common";
import { SelectOption } from "../../components/common/Input";
import { toast } from "sonner";
import { InvItemType, InvItemUnitType, InventoryItem, Supplier } from "../../core/types";
import InventoryService from "../../core/services/inventory";
import SupplierService from "../../core/services/supplier";
import * as XLSX from "xlsx";
import { Building, Phone, Search, X, Download } from "lucide-react";

interface InventoryFormData {
  name: string;
  part_number: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity: string;
  reorder_threshold: string;
  cost: string;
  price: string;
  supplier: string; // This stores the supplier ID
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

// interface TemplateColumn {
//   header: string;
//   key: string;
//   required: boolean;
//   description: string;
// }

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

// Template columns for documentation
// const TEMPLATE_COLUMNS: TemplateColumn[] = [
//   { header: "Name", key: "name", required: true, description: "Item name" },
//   { header: "Part Number", key: "part_number", required: false, description: "Part number or SKU" },
//   { header: "Type", key: "type", required: true, description: "hose, fitting, ferrule, assembly, adapter, coupling, other" },
//   { header: "Unit", key: "unit", required: true, description: "meters, feet, pieces" },
//   { header: "Quantity", key: "quantity", required: true, description: "Numeric value" },
//   { header: "Reorder Threshold", key: "reorder_threshold", required: false, description: "Minimum stock level" },
//   { header: "Cost", key: "cost", required: true, description: "Cost price" },
//   { header: "Price", key: "price", required: true, description: "Selling price" },
//   { header: "Supplier", key: "supplier", required: false, description: "Supplier name or ID" },
//   { header: "Image URL", key: "image", required: false, description: "Product image URL" },
//   { header: "Metadata", key: "metadata", required: false, description: 'JSON object e.g., {"key":"value"}' },
// ];

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

  // Supplier search states
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(); 
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkItems, setBulkItems] = useState<BulkInventoryItem[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch suppliers for dropdown ──────────────────────────────────────────
  const fetchSuppliers = useCallback(async (search: string = "") => {
    try {
      setSupplierLoading(true);
      const params: any = {
        page: 1,
        limit: 10,
        status: "active",
      };

      if (search) {
        params.search = search;
      }

      const response = await SupplierService.getSuppliers(params);
      
      if (response.success) {
        setSuppliers(response.results || []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setSupplierLoading(false);
    }
  }, []);

  // ── Debounced supplier search ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (supplierSearch) {
        fetchSuppliers(supplierSearch);
      } else {
        fetchSuppliers("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [supplierSearch, fetchSuppliers]);

  // ── Click outside handler for supplier dropdown ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (modalData?.item) {
      setIsEditMode(true);
      setItemUuid(modalData.item.uuid);
      const item = modalData.item as InventoryItem;

      // If there's a supplier ID, fetch the supplier name for display
      if (item.supplier) {
        fetchSupplierName(item.supplier);
      }

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

  // ── Fetch supplier name when editing ──────────────────────────────────────
  const fetchSupplierName = async (supplierId: string) => {
    try {
      const response = await SupplierService.getByUuid(supplierId);
      if (response.success) {
        const supplier = response.results?.supplier;
        if (supplier) {
          setSelectedSupplier(supplier);
          setSupplierSearch(supplier.name);
        }
      }
    } catch (error) {
      console.error("Error fetching supplier details:", error);
    }
  };

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

  // ── Supplier selection handler ────────────────────────────────────────────
  const handleSelectSupplier = (supplier: Supplier) => {
    setForm(prev => ({
      ...prev,
      supplier: supplier.uuid // Store just the supplier ID
    }));
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
  };

  // ── Clear supplier selection ──────────────────────────────────────────────
  const handleClearSupplier = () => {
    setForm(prev => ({
      ...prev,
      supplier: "" // Clear the supplier ID
    }));
    setSelectedSupplier(null);
    setSupplierSearch("");
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

  // ── Template Download Functions ───────────────────────────────────────────
  const downloadTemplate = (format: 'excel' | 'json') => {
    try {
      if (format === 'excel') {
        // Create workbook for Excel
        const wb = XLSX.utils.book_new();
        
        // Create data with headers and example rows
        const exampleData = [
          {
            "Name": "Hydraulic Hose 1/2\"",
            "Part Number": "HOSE-001",
            "Type": "hose",
            "Unit": "meters",
            "Quantity": 50,
            "Reorder Threshold": 10,
            "Cost": 15.50,
            "Price": 25.00,
            "Supplier": "Parker Hydraulics",
            "Image URL": "https://example.com/hose.jpg",
            "Metadata": '{"sae":"100R1AT","pressure":"250 bar"}'
          },
          {
            "Name": "Steel Fitting BSP 1/2\"",
            "Part Number": "FITT-002",
            "Type": "fitting",
            "Unit": "pieces",
            "Quantity": 100,
            "Reorder Threshold": 20,
            "Cost": 3.75,
            "Price": 7.50,
            "Supplier": "HydraFit Solutions",
            "Image URL": "",
            "Metadata": '{"thread_type":"BSP","material":"Stainless Steel 316"}'
          }
        ];
        
        // Convert to worksheet
        const ws = XLSX.utils.json_to_sheet(exampleData);
        
        // Set column widths
        ws['!cols'] = [
          { wch: 25 }, // Name
          { wch: 20 }, // Part Number
          { wch: 15 }, // Type
          { wch: 12 }, // Unit
          { wch: 12 }, // Quantity
          { wch: 20 }, // Reorder Threshold
          { wch: 12 }, // Cost
          { wch: 12 }, // Price
          { wch: 25 }, // Supplier
          { wch: 30 }, // Image URL
          { wch: 40 }, // Metadata
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");
        
        // Generate and download
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'inventory_template.xlsx';
        link.click();
        URL.revokeObjectURL(link.href);
        
        toast.success("Template downloaded", {
          description: "Excel template with example data has been downloaded"
        });
      } else {
        // JSON template
        const templateData = [
          {
            name: "Example Hose",
            part_number: "HOSE-001",
            type: "hose",
            unit: "meters",
            quantity: 50,
            reorder_threshold: 10,
            cost: 15.50,
            price: 25.00,
            supplier: "Parker Hydraulics",
            image: "https://example.com/hose.jpg",
            metadata: {
              sae: "100R1AT",
              pressure: "250 bar"
            }
          }
        ];
        
        const jsonStr = JSON.stringify(templateData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'inventory_template.json';
        link.click();
        URL.revokeObjectURL(link.href);
        
        toast.success("Template downloaded", {
          description: "JSON template with example data has been downloaded"
        });
      }
    } catch (error) {
      console.error("Error downloading template:", error);
      toast.error("Error", {
        description: "Failed to download template"
      });
    }
  };

  // ── Download Sample Data ──────────────────────────────────────────────────
  const downloadSampleData = (format: 'excel' | 'json') => {
    const sampleData = [
      {
        name: "Hydraulic Hose 1/2\"",
        part_number: "HOSE-001",
        type: "hose",
        unit: "meters",
        quantity: 50,
        reorder_threshold: 10,
        cost: 15.50,
        price: 25.00,
        supplier: "Parker Hydraulics",
        image: "https://example.com/hose.jpg",
        metadata: { sae: "100R1AT", pressure: "250 bar" }
      },
      {
        name: "Steel Fitting BSP 1/2\"",
        part_number: "FITT-002",
        type: "fitting",
        unit: "pieces",
        quantity: 100,
        reorder_threshold: 20,
        cost: 3.75,
        price: 7.50,
        supplier: "HydraFit Solutions",
        image: "",
        metadata: { thread_type: "BSP", material: "Stainless Steel 316" }
      }
    ];

    if (format === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, ws, "Inventory Items");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'sample_inventory_data.xlsx';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const jsonStr = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'sample_inventory_data.json';
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  // ── Enhanced File Upload Handler ──────────────────────────────────────────
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", {
        description: "Please upload a file smaller than 10MB"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data: any[] = [];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'json') {
          // Parse JSON
          const jsonData = JSON.parse(e.target?.result as string);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
          
          // Validate JSON structure
          if (data.length === 0) {
            toast.error("Empty file", {
              description: "The JSON file is empty"
            });
            return;
          }
        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
          // Parse Excel with options
          const workbook = XLSX.read(e.target?.result, { 
            type: 'array',
            cellDates: true,
            dateNF: 'yyyy-mm-dd'
          });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(firstSheet, {
            defval: '', // Default value for empty cells
            raw: true // Keep raw values
          });
          
          if (data.length === 0) {
            toast.error("Empty file", {
              description: "The Excel file appears to be empty"
            });
            return;
          }
        } else {
          toast.error("Invalid file format", {
            description: "Please upload a JSON or Excel file (.json, .xlsx, .xls)"
          });
          return;
        }

        // Normalize and map data to inventory items
        const mappedItems: BulkInventoryItem[] = data.map((item: any, index: number) => {
          // Handle metadata - could be string or object
          let metadata = {};
          if (item.metadata) {
            if (typeof item.metadata === 'string') {
              try {
                metadata = JSON.parse(item.metadata);
              } catch {
                // If metadata string is not valid JSON, use as simple value
                metadata = { value: item.metadata };
              }
            } else if (typeof item.metadata === 'object') {
              metadata = item.metadata;
            }
          }

          // Normalize field names (case insensitive)
          const getField = (field: string, defaultValue: any) => {
            const keys = Object.keys(item);
            const foundKey = keys.find(k => k.toLowerCase() === field.toLowerCase());
            return foundKey ? item[foundKey] : defaultValue;
          };

          return {
            name: getField('name', '') || getField('Name', ''),
            part_number: getField('part_number', '') || getField('PartNumber', '') || getField('Part Number', ''),
            type: (getField('type', '') || getField('Type', '') || 'other').toLowerCase() as InvItemType,
            unit: (getField('unit', '') || getField('Unit', '') || 'pieces').toLowerCase() as InvItemUnitType,
            quantity: parseFloat(getField('quantity', 0) || getField('Quantity', 0)) || 0,
            reorder_threshold: parseFloat(getField('reorder_threshold', 5) || getField('ReorderThreshold', 5) || getField('Reorder Threshold', 5)) || 5,
            cost: parseFloat(getField('cost', 0) || getField('Cost', 0)) || 0,
            price: parseFloat(getField('price', 0) || getField('Price', 0)) || 0,
            supplier: getField('supplier', '') || getField('Supplier', ''),
            image: getField('image', '') || getField('Image', '') || getField('Image URL', ''),
            metadata: metadata,
          };
        });

        // Filter out invalid items and add validation errors
        const validItems: BulkInventoryItem[] = [];
        const invalidItems: { index: number; errors: string[] }[] = [];
        
        mappedItems.forEach((item, index) => {
          const errors: string[] = [];
          
          if (!item.name || item.name.trim() === '') {
            errors.push('Name is required');
          }
          if (!['hose', 'fitting', 'ferrule', 'assembly', 'adapter', 'coupling', 'other'].includes(item.type)) {
            errors.push(`Invalid type: ${item.type}. Must be one of: hose, fitting, ferrule, assembly, adapter, coupling, other`);
          }
          if (!['meters', 'feet', 'pieces'].includes(item.unit)) {
            errors.push(`Invalid unit: ${item.unit}. Must be one of: meters, feet, pieces`);
          }
          if (isNaN(item.quantity) || item.quantity < 0) {
            errors.push('Quantity must be a positive number');
          }
          if (isNaN(item.cost) || item.cost < 0) {
            errors.push('Cost must be a positive number');
          }
          if (isNaN(item.price) || item.price < 0) {
            errors.push('Price must be a positive number');
          }
          
          if (errors.length > 0) {
            invalidItems.push({ index, errors });
          } else {
            validItems.push(item);
          }
        });

        if (validItems.length === 0) {
          toast.error("No valid items found", {
            description: "Please check the file format and ensure all required fields are present"
          });
          return;
        }

        setBulkItems(validItems);
        
        // Show warning for invalid items
        if (invalidItems.length > 0) {
          toast.warning(`${invalidItems.length} items have errors`, {
            description: `${invalidItems.length} items were skipped due to validation errors. ${validItems.length} items ready to import.`
          });
          console.log('Invalid items:', invalidItems);
        } else {
          toast.success("File uploaded successfully", {
            description: `Found ${validItems.length} valid items ready to import`
          });
        }
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Error parsing file", {
          description: "Please check the file format and try again"
        });
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    if (file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }, []);

  // ── Bulk Submit Handler ────────────────────────────────────────────────────
  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      toast.error("No items to import", {
        description: "Please upload a file with inventory items",
      });
      return;
    }

    setBulkLoading(true);
    try {
      const response = await InventoryService.bulkCreate(bulkItems);

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

  // ── Export Bulk Items ──────────────────────────────────────────────────────
  const exportBulkItems = () => {
    if (bulkItems.length === 0) {
      toast.error("No items to export");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bulkItems);
    XLSX.utils.book_append_sheet(wb, ws, "Items");
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'imported_items.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success("Export successful", {
      description: `${bulkItems.length} items exported to Excel`
    });
  };

  // ── Single Item Submit ────────────────────────────────────────────────────
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
        response = await InventoryService.update(itemUuid, formData);
      } else {
        response = await InventoryService.create(formData);
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
            {/* Instructions */}
            <div className="bg-primary-5 p-4 rounded-lg border border-primary-20">
              <h3 className="font-semibold text-text mb-2">
                Bulk Upload Instructions
              </h3>
              <ul className="text-sm text-text-light space-y-1 list-disc list-inside">
                <li>Upload a JSON or Excel file with your inventory items</li>
                <li>
                  Required fields: name, type, unit, part_number, quantity, cost, price
                </li>
                <li>
                  Optional fields: reorder_threshold, supplier,
                  image, metadata
                </li>
                <li>Metadata can be any key-value pairs or JSON object</li>
                <li>File size limit: 10MB</li>
                <li>Supports .json, .xlsx, .xls formats</li>
              </ul>
            </div>

            {/* Template Download Section */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-text">Download Templates</h4>
                <span className="text-xs text-text-light">Get started quickly</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('excel')}
                >
                  <Download size={14} className="mr-1" />
                  Excel Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('json')}
                >
                  <Download size={14} className="mr-1" />
                  JSON Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleData('excel')}
                >
                  <Download size={14} className="mr-1" />
                  Sample Data (Excel)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleData('json')}
                >
                  <Download size={14} className="mr-1" />
                  Sample Data (JSON)
                </Button>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
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
                    Supports .json, .xlsx, .xls (max 10MB)
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

            {/* Items Preview */}
            {bulkItems.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-background p-3 border-b border-border flex justify-between items-center flex-wrap gap-2">
                  <span className="font-medium text-text">
                    {bulkItems.length} items ready to import
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportBulkItems}
                    >
                      <i className="ri-download-line mr-1"></i>
                      Export
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setBulkItems([])}
                    >
                      <i className="ri-delete-bin-line mr-1"></i>
                      Clear All
                    </Button>
                  </div>
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
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              item.type === 'hose' ? 'bg-blue-100 text-blue-800' :
                              item.type === 'fitting' ? 'bg-green-100 text-green-800' :
                              item.type === 'ferrule' ? 'bg-purple-100 text-purple-800' :
                              item.type === 'assembly' ? 'bg-yellow-100 text-yellow-800' :
                              item.type === 'adapter' ? 'bg-red-100 text-red-800' :
                              item.type === 'coupling' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.type}
                            </span>
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
                {/* Summary Statistics */}
                <div className="bg-background p-3 border-t border-border grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-text-light">Total Items:</span>
                    <span className="ml-2 font-medium text-text">{bulkItems.length}</span>
                  </div>
                  <div>
                    <span className="text-text-light">Total Quantity:</span>
                    <span className="ml-2 font-medium text-text">
                      {bulkItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-light">Total Value:</span>
                    <span className="ml-2 font-medium text-text">
                      GHS {bulkItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowBulkUpload(false);
                  setBulkItems([]);
                }}
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

                {/* Supplier Search Field */}
                <div className="relative" ref={supplierDropdownRef}>
                  <Input
                    type="search"
                    label="Supplier"
                    placeholder="Search supplier by name..."
                    value={supplierSearch}
                    onChange={(value: string) => {
                      setSupplierSearch(value);
                      setShowSupplierDropdown(true);
                      // If user types, clear the selected supplier
                      if (form.supplier && value !== selectedSupplier?.name) {
                        setForm(prev => ({
                          ...prev,
                          supplier: ""
                        }));
                        setSelectedSupplier(null);
                      }
                    }}
                    onFocus={() => {
                      setShowSupplierDropdown(true);
                      if (!supplierSearch) {
                        fetchSuppliers("");
                      }
                    }}
                    prefixIcon={<Search size={15} />}
                    suffixIcon={
                      form.supplier && (
                        <button
                          type="button"
                          onClick={handleClearSupplier}
                          className="text-text-light hover:text-danger transition-colors"
                        >
                          <X size={15} />
                        </button>
                      )
                    }
                  />

                  {/* Supplier Dropdown */}
                  {showSupplierDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {supplierLoading ? (
                        <div className="p-4 text-center text-text-light">
                          Loading suppliers...
                        </div>
                      ) : suppliers.length > 0 ? (
                        <div>
                          {suppliers.map((supplier) => (
                            <button
                              key={supplier.uuid}
                              type="button"
                              onClick={() => handleSelectSupplier(supplier)}
                              className="w-full text-left px-4 py-3 hover:bg-background transition-colors border-b border-border last:border-0"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-text">
                                  {supplier.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-text-light mt-1">
                                  {supplier.email && (
                                    <span>{supplier.email}</span>
                                  )}
                                  {supplier.phone_number && (
                                    <span>
                                      {supplier.phone_code || ""} {supplier.phone_number}
                                    </span>
                                  )}
                                </div>
                                {supplier.address && (
                                  <span className="text-xs text-text-light mt-0.5">
                                    {supplier.address}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : supplierSearch ? (
                        <div className="p-4 text-center text-text-light">
                          No suppliers found matching "{supplierSearch}"
                        </div>
                      ) : (
                        <div className="p-4 text-center text-text-light">
                          No suppliers available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Show selected supplier badge */}
                {form.supplier && selectedSupplier && (
                  <div className="flex items-center gap-2 p-2 bg-primary-5 rounded-lg border border-primary-20">
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text">
                        {selectedSupplier?.name}
                      </div>
                      {selectedSupplier?.phone_number && <div className="flex flex-row text-xs text-text-light py-1">
                         <Phone size={13} className="pr-1"/>{`${selectedSupplier?.phone_code}${selectedSupplier?.phone_number}`}
                      </div>}
                      {selectedSupplier?.address&&<div className="flex flex-row text-xs text-text-light">
                         <Building size={13} className="pr-1"/>{selectedSupplier?.address}
                      </div>}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearSupplier}
                      className="text-text-light hover:text-danger transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

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