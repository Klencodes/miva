import React, { useState, useEffect } from "react";
import { X, DollarSign, Tag, Calendar, Building2, User } from "lucide-react";
import Input, { SelectOption } from "../../components/common/Input";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { toast } from "sonner";
import { ExpenseFormData, ExpenseCategory } from "../../core/types";

const PAYMENT_METHODS: SelectOption[] = [
  { value: "cash", label: "💵 Cash" },
  { value: "bank", label: "🏦 Bank Transfer" },
  { value: "mobile_money", label: "📱 Mobile Money" },
  { value: "credit_card", label: "💳 Credit Card" },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
];

const ExpenseModal = () => {
  const { modalData, modalRef } = useModal();
  const { mode, expense, categories } = modalData || {
    mode: "create",
    expense: null,
    categories: [],
  };
  const isEditing = mode === "edit";
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: "",
    description: "",
    amount: "",
    category: "",
    sub_category: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    vendor: "",
    vendor_contact: "",
    status: "pending",
    receipt: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions: SelectOption[] = categories.map(
    (cat: ExpenseCategory) => ({
      value: cat.name,
      label: `${cat.icon} ${cat.name}`,
    }),
  );


  useEffect(() => {
    if (isEditing && expense) {
      setFormData({
        title: expense.title,
        description: expense.description || "",
        amount: expense.amount?.toString(),
        category: expense.category,
        sub_category: expense.sub_category || "",
        date: expense.date,
        payment_method: expense.payment_method,
        vendor: expense.vendor || "",
        vendor_contact: expense.vendor_contact || "",
        status: expense.status,
        receipt: null,
      });
    }
  }, [isEditing, expense]);

  const handleChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.amount ||
      !formData.category ||
      !formData.date
    ) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      modalRef?.close({
        success: true,
        data: {...formData, amount: Number(formData.amount)},
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to save expense",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    modalRef?.close({ success: false });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2">
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex justify-between items-center bg-card">
        <div>
          <h2 className="text-xl font-bold text-text">
            {isEditing ? "Edit Expense" : "Add New Expense"}
          </h2>
          <p className="text-sm text-text-light">
            {isEditing
              ? "Update expense details"
              : "Record a new business expense"}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-text-light" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4 px-6">
        <form>
          <div className="space-y-4 mt-4">
            <div>
              <Input
                type="text"
                label="Title"
                value={formData.title}
                onChange={(value) => handleChange("title", value)}
                placeholder="Enter expense title"
                required
              />
            </div>

            <div>
              <Input
                type="textarea"
                label="Description"
                value={formData.description}
                onChange={(value) => handleChange("description", value)}
                placeholder="Enter expense description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="number"
                  label="Amount"
                  value={formData.amount}
                  onChange={(value) => handleChange("amount", Number(value))}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  required
                  prefixIcon={<DollarSign size={14} />}
                />
              </div>

              <div>
                <Input
                  type="date"
                  label="Date"
                  value={formData.date}
                  onChange={(value) => handleChange("date", value)}
                  required
                  prefixIcon={<Calendar size={14} />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="select"
                  label="Category"
                  value={formData.category}
                  onChange={(value) => handleChange("category", value)}
                  selectOptions={categoryOptions}
                  selectPlaceholder="Select category..."
                  required
                  prefixIcon={<Tag size={14} />}
                />
              </div>

              <div>
                <Input
                  type="text"
                  label="Sub Category"
                  value={formData.sub_category}
                  onChange={(value) => handleChange("sub_category", value)}
                  placeholder="e.g., Stationery"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="select"
                  label="Payment Method"
                  value={formData.payment_method}
                  onChange={(value) => handleChange("payment_method", value)}
                  selectOptions={PAYMENT_METHODS}
                  required
                />
              </div>

              <div>
                <Input
                  type="select"
                  label="Status"
                  value={formData.status}
                  onChange={(value) => handleChange("status", value)}
                  selectOptions={STATUS_OPTIONS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  label="Vendor"
                  value={formData.vendor}
                  onChange={(value) => handleChange("vendor", value)}
                  placeholder="Vendor name"
                  prefixIcon={<Building2 size={14} />}
                />
              </div>

              <div>
                <Input
                  type="text"
                  label="Vendor Contact"
                  value={formData.vendor_contact}
                  onChange={(value) => handleChange("vendor_contact", value)}
                  placeholder="Phone or email"
                  prefixIcon={<User size={14} />}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
      <div className="flex justify-end items-center p-4 gap-x-4 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          type="button"
          onClick={handleClose}
          variant="ghost"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
          ) : isEditing ? (
            "Update Expense"
          ) : (
            "Create Expense"
          )}
        </Button>
      </div>
    </div>
  );
};

export default ExpenseModal;
