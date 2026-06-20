import React, { useState, useCallback, useEffect } from "react";
import { useModal } from "../../core/hooks/useModal";
import { Button, Input } from "../../components/common";
import { SelectOption } from "../../components/common/Input";
import { toast } from "sonner";
import { useStore } from "../../core/contexts/StoreProvider";
import {  InvItemType, InvItemUnitType, InvItemThreadType } from "../../core/types";

interface InventoryFormData {
  name: string;
  type: InvItemType;
  unit: InvItemUnitType;
  quantity:  string;
  reorder_threshold: string;
  cost: string;
  price: string;
  supplier: string;
  image: string;
  specs: {
    sae: string;
    pressure: number;
    thread_type: InvItemThreadType | '';
    diameter: number;
    material: string;
    part_number: string;
    angle: number;
    working_temp: string;
    assembly_length: number;
  };
}

const initialFormState: InventoryFormData = {
  name: "",
  type: "other",
  unit: "pieces",
  quantity: "0",
  reorder_threshold: "5",
  cost: "0",
  price: "0",
  supplier: "",
  image: "",
  specs: {
    sae: "",
    pressure: 0,
    thread_type: "",
    diameter: 0,
    material: "",
    part_number: "",
    angle: 0,
    working_temp: "",
    assembly_length: 0,
  },
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

const threadTypeOptions: SelectOption[] = [
  { value: "", label: "Select Thread Type" },
  { value: "BSP", label: "BSP" },
  { value: "JIC", label: "JIC" },
  { value: "NPT", label: "NPT" },
  { value: "ORFS", label: "ORFS" },
  { value: "SAE", label: "SAE" },
  { value: "Komatsu", label: "Komatsu" },
  { value: "Metric", label: "Metric" },
];

const AddEditInventory: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const { setStoreEntities } = useStore();
  const [form, setForm] = useState<InventoryFormData>(initialFormState);
  const [errors, setErrors] = useState<Partial<InventoryFormData>>({});
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [itemUuid, setItemUuid] = useState<string | null>(null);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (modalData?.item) {
      setIsEditMode(true);
      setItemUuid(modalData.item.uuid);
      const item = modalData.item;
      setForm({
        name: item.name || "",
        type: item.type || "other",
        unit: item.unit || "pieces",
        quantity: item.quantity || 0,
        reorder_threshold: item.reorder_threshold || 5,
        cost: item.cost || 0,
        price: item.price || 0,
        supplier: item.supplier || "",
        image: item.image || "",
        specs: {
          sae: item.specs?.sae || "",
          pressure: item.specs?.pressure || 0,
          thread_type: item.specs?.thread_type || "",
          diameter: item.specs?.diameter || 0,
          material: item.specs?.material || "",
          part_number: item.specs?.part_number || "",
          angle: item.specs?.angle || 0,
          working_temp: item.specs?.working_temp || "",
          assembly_length: item.specs?.assembly_length || 0,
        },
      });
    }
  }, [modalData]);

  const validate = useCallback((data: InventoryFormData): Partial<InventoryFormData> => {
    const newErrors: Partial<InventoryFormData> = {};
    if (!data.name) newErrors.name = "Item name is required.";
    if (Number(data.quantity) < 0) newErrors.quantity = "Quantity cannot be negative.";
    if (Number(data.cost) < 0) newErrors.cost = "Cost cannot be negative.";
    if (Number(data.price) < 0) newErrors.price = "Price cannot be negative.";
    if (Number(data.reorder_threshold) < 0) newErrors.reorder_threshold = "Reorder threshold cannot be negative.";
    return newErrors;
  }, []);

  const handleChange = (name: keyof InventoryFormData) => (value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSpecChange = (name: keyof InventoryFormData['specs']) => (value: any) => {
    setForm(prev => ({
      ...prev,
      specs: { ...prev.specs, [name]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Validation Error", { description: "Please correct the highlighted fields." });
      return;
    }

    setLoading(true);

    try {
      const formData = {
        name: form.name,
        type: form.type as InvItemType,
        unit: form.unit as InvItemUnitType,
        quantity: form.quantity,
        reorder_threshold: Number(form.reorder_threshold),
        cost: Number(form.cost),
        price: Number(form.price),
        supplier: form.supplier || undefined,
        image: form.image || undefined,
        specs: {
          sae: form.specs.sae || undefined,
          pressure: form.specs.pressure || undefined,
          thread_type: form.specs.thread_type || undefined,
          diameter: form.specs.diameter || undefined,
          material: form.specs.material || undefined,
          part_number: form.specs.part_number || undefined,
          angle: form.specs.angle || undefined,
          working_temp: form.specs.working_temp || undefined,
          assembly_length: form.specs.assembly_length || undefined,
        },
      };

      let response;
      if (isEditMode && itemUuid) {
        response = {}
        // response = await InventoryService.updateItem(itemUuid, formData);
      } else {
        // response = await InventoryService.createItem(formData);
      }

    //   if (response.success) {
    //     toast.success("Success", {
    //       description: `Inventory item ${isEditMode ? 'updated' : 'created'} successfully!`
    //     });
        
    //     // Trigger refresh event to update UI
    //     eventService.triggerRefresh();
    //     modalRef?.close({ success: true, data: response.results?.item });
    //   }
    } catch (error: any) {
      console.error("Error saving inventory item:", error);
      toast.error("Error", {
        description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} inventory item.`
      });
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
            {isEditMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isEditMode 
              ? 'Update your inventory item details.' 
              : 'Add a new item to your inventory.'
            }
          </h4>
        </div>
        <button
          onClick={() => modalRef?.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Basic Info */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-information-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Basic Information</h3>
              </div>

              <Input
                label="Item Name *"
                placeholder="Enter item name"
                required
                name="name"
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                error={errors.name}
              />

              <Input
                type="select"
                label="Type *"
                required
                name="type"
                id="type"
                selectOptions={typeOptions}
                value={form.type}
                onChange={handleChange("type")}
              />

              <Input
                type="select"
                label="Unit *"
                required
                name="unit"
                id="unit"
                selectOptions={unitOptions}
                value={form.unit}
                onChange={handleChange("unit")}
              />

              <Input
                type="number"
                label="Quantity *"
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
                label="Reorder Threshold *"
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

            {/* Column 2: Pricing  */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-money-dollar-circle-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Pricing</h3>
              </div>

              <Input
                type="number"
                label="Cost (GHS) *"
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
                label="Price (GHS) *"
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

          {/* Specifications Section */}
          <div className="border border-border rounded-sm p-4">
            <div className="flex items-center mb-4">
              <i className="ri-settings-3-line text-primary text-lg mr-2"></i>
              <h3 className="font-semibold text-text">Specifications</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="SAE Rating"
                placeholder="100R1"
                name="sae"
                id="sae"
                value={form.specs.sae}
                onChange={handleSpecChange("sae")}
              />

              <Input
                type="number"
                label="Pressure (bar)"
                placeholder="250"
                name="pressure"
                id="pressure"
                value={form.specs.pressure}
                onChange={handleSpecChange("pressure")}
                min={0}
              />

              <Input
                type="select"
                label="Thread Type"
                name="thread_type"
                id="thread_type"
                selectOptions={threadTypeOptions}
                value={form.specs.thread_type}
                onChange={handleSpecChange("thread_type")}
              />

              <Input
                type="number"
                label="Diameter (inches)"
                placeholder="0.5"
                name="diameter"
                id="diameter"
                value={form.specs.diameter}
                onChange={handleSpecChange("diameter")}
                min={0}
                step={0.1}
              />

              <Input
                label="Material"
                placeholder="Steel, Rubber"
                name="material"
                id="material"
                value={form.specs.material}
                onChange={handleSpecChange("material")}
              />

              <Input
                label="Part Number"
                placeholder="HOSE-001"
                name="part_number"
                id="part_number"
                value={form.specs.part_number}
                onChange={handleSpecChange("part_number")}
              />

              <Input
                type="number"
                label="Angle (degrees)"
                placeholder="45"
                name="angle"
                id="angle"
                value={form.specs.angle}
                onChange={handleSpecChange("angle")}
                min={0}
                max={360}
              />

              <Input
                label="Working Temperature"
                placeholder="-40°C to +100°C"
                name="working_temp"
                id="working_temp"
                value={form.specs.working_temp}
                onChange={handleSpecChange("working_temp")}
              />

              <Input
                type="number"
                label="Assembly Length (mm)"
                placeholder="500"
                name="assembly_length"
                id="assembly_length"
                value={form.specs.assembly_length}
                onChange={handleSpecChange("assembly_length")}
                min={0}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
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
    </div>
  );
};

export default AddEditInventory;