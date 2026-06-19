import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building,
} from "lucide-react";
import { Customer } from "../../core/types";
import Input from "../../components/common/Input";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";

const AddEditCustomer = () => {
  const { modalRef, modalData } = useModal();
  const customer = modalData?.customer as Customer;
  const editing = !!customer;

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    creditLimit: undefined,
    notes: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        creditLimit: customer.creditLimit || undefined,
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

    if (formData.creditLimit !== undefined && formData.creditLimit < 0) {
      newErrors.creditLimit = "Credit limit cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const saveData = { ...formData };
        modalRef?.close({success: true, customer: saveData});
      } catch (error) {
        console.error("Error saving customer:", error);
        alert("An error occurred while saving the customer. Please try again.");
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
    <div className="">
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                onChange={(e) => handleInputChange("name", e.target.value)}
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
                onChange={(e) => handleInputChange("email", e.target.value)}
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
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="024-123-4567"
                error={errors.phone}
                prefixIcon={<Phone className="w-4 h-4" />}
                required
                disabled={isSubmitting}
              />

              <Input
                label="Tax ID"
                value={formData.taxId || ""}
                onChange={(e) => handleInputChange("taxId", e.target.value)}
                placeholder="C-12345"
                prefixIcon={<Building className="w-4 h-4" />}
                disabled={isSubmitting}
              />
            </div>

            <Input
              label="Address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Street Name, City"
              error={errors.address}
              prefixIcon={<MapPin className="w-4 h-4" />}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Credit & Status */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium text-text-light flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Credit & Status
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Credit Limit"
                value={
                  formData.creditLimit !== undefined &&
                  formData.creditLimit !== null
                    ? formData.creditLimit.toString()
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value
                    ? parseFloat(e.target.value)
                    : undefined;
                  handleInputChange("creditLimit", value);
                }}
                placeholder="0.00"
                error={errors.creditLimit}
                prefixIcon={<CreditCard className="w-4 h-4" />}
                disabled={isSubmitting}
              />

              {/* ✅ FIXED CHECKBOX SECTION */}
              <div className="flex items-center h-full">
                <Input
                  type="checkbox"
                  label="Active Customer"
                  checked={formData.isActive !== false}
                  onChange={(checked: boolean) => handleInputChange("isActive", checked)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2 border-t pt-4">
            <Input
              type="textarea"
              label="Notes"
              value={formData.notes || ""}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              placeholder="Additional notes about the customer..."
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
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
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4" />
              {isSubmitting
                ? "Saving..."
                : editing
                  ? "Update Customer"
                  : "Create Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCustomer;