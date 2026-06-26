import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { Customer } from "../../core/types";
import Input from "../../components/common/Input";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { toast } from "sonner";
import CustomerService from "../../core/services/customer"
const AddEditCustomer = () => {
  const { modalRef, modalData } = useModal();
  const customer = modalData?.customer as Customer;
  const editing = !!customer;

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    notes: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
      });
    }
  }, [customer]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Customer name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
       try {
      let response: any;
      
      if (editing && customer?.uuid) {
        const saveData = { ...customer, ...formData };

        // Update existing entity
        response = await CustomerService.update(customer?.uuid, saveData );
      } else {
        // Create new entity
        response = await CustomerService.create(formData);
      }
    
      
      toast.success(
        "Success", 
        {description: response.message || `Customer profile ${editing ? 'update' : 'create'} successfully!`}
      );
      
      // Close the modal upon success
      modalRef!.close({ success: true }); 
      } catch (error: any) {
        toast.error('Error', { description: error?.message || 'An error occurred while saving the customer. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleInputChange = (field: keyof Customer, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      modalRef?.close();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex justify-between items-center bg-card">
        <div>
          <h3 className="text-lg font-semibold text-text">
            {editing ? "Edit Customer" : "Add New Customer"}
          </h3>
          <p className="text-sm text-text-light">
            {editing
              ? "Update customer information"
              : "Enter customer details"}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5 text-text-light" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4 px-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                value={formData.name || ""}
                onChange={(value: string) => handleInputChange("name", value)}
                placeholder="Enter full name"
                error={errors.name}
                prefixIcon={<User className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email || ""}
                onChange={(value: string) => handleInputChange("email", value)}
                placeholder="customer@email.com"
                error={errors.email}
                prefixIcon={<Mail className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={formData.phone || ""}
                onChange={(value: string) => handleInputChange("phone", value)}
                placeholder="024-123-4567"
                error={errors.phone}
                prefixIcon={<Phone className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Tax ID"
                value={formData.tax_id || ""}
                onChange={(value: string) => handleInputChange("tax_id", value)}
                placeholder="C-12345"
                prefixIcon={<Building className="w-4 h-4" />}
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Address"
              value={formData.address || ""}
              onChange={(value: string) => handleInputChange("address", value)}
              placeholder="123 Street Name, City"
              error={errors.address}
              prefixIcon={<MapPin className="w-4 h-4" />}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2 border-t border-border pt-4">
            <Input
              type="textarea"
              label="Notes"
              value={formData.notes || ""}
              onChange={(value: string) => handleInputChange("notes", value)}
              rows={3}
              placeholder="Additional notes about the customer..."
              disabled={isSubmitting}
            />
          </div>

          {/* Spacer to push content up */}
          <div className="h-4" />
        </form>
      </div>

      {/* Actions - Fixed at bottom */}
        <div className="flex justify-end items-center p-4 border-t border-border mt-auto sticky bottom-0 z-10  gap-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : editing
              ? "Update Customer"
              : "Create Customer"}
        </Button>
      </div>
    </div>
  );
};

export default AddEditCustomer;