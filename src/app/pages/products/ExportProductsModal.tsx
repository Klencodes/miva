// ExportProductsModal.tsx
import React, { useState } from "react";
import { Button, Input } from "../../../ui";
import { useModal } from "../../../core/hooks/useModal";
import { SelectOption } from "../../../core/interfaces/ISelectOption";

interface ExportProductsModalProps {
  title: string;
  subtitle: string;
  categories?: SelectOption[];
}

export interface ExportFilters {
  limit: number;
  paymentMethod: string;
  isAvailable: boolean | null;
  stockLessThan: number | null;
  category: string | null;
  searchTerm: string;
}

const paymentMethodOptions: SelectOption[] = [
  { label: "All payment methods", value: "all" },
  { label: "Cash", value: "Cash" },
  { label: "Mobile Money", value: "Mobile Money" },
];

const availabilityOptions: SelectOption[] = [
  { label: "All products", value: "all" },
  { label: "Available only", value: "available" },
  { label: "Unavailable only", value: "unavailable" },
];

const stockFilterOptions: SelectOption[] = [
  { label: "All stock levels", value: "all" },
  { label: "Out of stock (0)", value: "0" },
  { label: "Low stock (≤ 5)", value: "5" },
  { label: "Low stock (≤ 10)", value: "10" },
  { label: "Low stock (≤ 20)", value: "20" },
  { label: "Custom threshold…", value: "custom" },
];

export const ExportProductsModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const {
    title,
    subtitle,
    categories = [],
  } = modalData as ExportProductsModalProps;

  const [showCustomStock, setShowCustomStock] = useState(false);
  const [stockFilterType, setStockFilterType] = useState<SelectOption>(
    stockFilterOptions[0]
  );
  const [filters, setFilters] = useState<ExportFilters>({
    limit: 1000,
    paymentMethod: "all",
    isAvailable: null,
    stockLessThan: null,
    category: null,
    searchTerm: "",
  });

  const categoryOptions: SelectOption[] = [
    { label: "All categories", value: "all" },
    ...categories,
  ];

  const getPaymentMethodOption = (value: string): SelectOption =>
    paymentMethodOptions.find((opt) => opt.value === value) ??
    paymentMethodOptions[0];

  const getAvailabilityOption = (): SelectOption => {
    if (filters.isAvailable === null) return availabilityOptions[0];
    return filters.isAvailable ? availabilityOptions[1] : availabilityOptions[2];
  };

  const getCategoryOption = (): SelectOption =>
    categoryOptions.find((opt) => opt.value === filters.category) ??
    categoryOptions[0];

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.category) count++;
    if (filters.paymentMethod !== "all") count++;
    if (filters.isAvailable !== null) count++;
    if (filters.stockLessThan !== null) count++;
    return count;
  };

  const handleStockFilterChange = (option: SelectOption) => {
    setStockFilterType(option);
    if (option.value === "custom") {
      setShowCustomStock(true);
      setFilters((prev) => ({ ...prev, stockLessThan: null }));
    } else if (option.value === "all") {
      setShowCustomStock(false);
      setFilters((prev) => ({ ...prev, stockLessThan: null }));
    } else {
      setShowCustomStock(false);
      setFilters((prev) => ({ ...prev, stockLessThan: parseInt(option.value) }));
    }
  };

  const handleAvailabilityChange = (option: SelectOption) => {
    const value =
      option.value === "all" ? null : option.value === "available";
    setFilters((prev) => ({ ...prev, isAvailable: value }));
  };

  const handlePaymentMethodChange = (option: SelectOption) =>
    setFilters((prev) => ({ ...prev, paymentMethod: option.value }));

  const handleCategoryChange = (option: SelectOption) =>
    setFilters((prev) => ({
      ...prev,
      category: option.value === "all" ? null : option.value,
    }));

  const handleConfirm = () => {
    if (filters.limit < 1 || filters.limit > 10000) return;
    if (showCustomStock && (filters.stockLessThan === null || filters.stockLessThan < 0))
      return;
    modalRef?.close({ confirmed: true, filters });
  };

  const activeCount = getActiveFilterCount();

  const SummaryRow = ({
    label,
    value,
    muted = false,
  }: {
    label: string;
    value: React.ReactNode;
    muted?: boolean;
  }) => (
    <div className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-background transition-colors">
      <span className="text-text-light text-xs">{label}</span>
      <span
        className={`text-xs font-medium text-right font-mono max-w-[55%] truncate ${
          muted ? "text-text-light font-normal font-sans" : "text-text"
        }`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full">

      {/* Header */}
      <div className="flex items-start justify-between pt-5 pb-4 border-b border-border bg-card sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-info-5 flex items-center justify-center flex-shrink-0">
            <i className="ri-download-line text-info text-base" />
          </div>
          <div>
            <h2 className="text-base font-medium text-text leading-tight">{title}</h2>
            <p className="text-xs text-text-light mt-0.5">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => modalRef?.dismiss()}
          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-background transition-colors text-text-light hover:text-text"
        >
          <i className="ri-close-line text-sm" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Filter Settings */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-text-light">
            Filter settings
          </p>

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-info-5 border border-info-20 rounded-lg px-3 py-2.5">
            <i className="ri-information-line text-info text-sm mt-px flex-shrink-0" />
            <p className="text-xs text-info leading-relaxed">
              All fields are optional — leave any blank to include all products
              matching the other filters.
            </p>
          </div>

          {/* Search */}
          <Input
            type="text"
            label="Search products"
            value={filters.searchTerm}
            onChange={(v) =>
              setFilters((prev) => ({ ...prev, searchTerm: v as string }))
            }
            placeholder="Product name, short name…"
            prefixIcon="search"
            hint="Filter by name or short name"
          />

          {/* Category */}
          <Input
            type="select"
            label="Category"
            value={getCategoryOption()}
            onChange={(opt) => handleCategoryChange(opt as SelectOption)}
            selectOptions={categoryOptions}
          />

          {/* Limit */}
          <Input
            type="number"
            label="Max records to export"
            value={filters.limit.toString()}
            onChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                limit: parseInt(v as string) || 0,
              }))
            }
            min={1}
            max={10000}
            placeholder="e.g. 1000"
            hint="Between 1 and 10,000"
          />

          {/* Payment Method */}
          <Input
            type="select"
            label="Payment method"
            value={getPaymentMethodOption(filters.paymentMethod)}
            onChange={(opt) => handlePaymentMethodChange(opt as SelectOption)}
            selectOptions={paymentMethodOptions}
          />

          {/* Availability */}
          <Input
            type="select"
            label="Availability"
            value={getAvailabilityOption()}
            onChange={(opt) => handleAvailabilityChange(opt as SelectOption)}
            selectOptions={availabilityOptions}
          />

          {/* Stock Level */}
          <Input
            type="select"
            label="Stock level"
            value={stockFilterType}
            onChange={(opt) => handleStockFilterChange(opt as SelectOption)}
            selectOptions={stockFilterOptions}
          />

          {/* Custom Stock — animated reveal */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              showCustomStock ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <Input
              type="number"
              label="Custom stock threshold"
              value={filters.stockLessThan?.toString() ?? ""}
              onChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  stockLessThan: parseInt(v as string) || null,
                }))
              }
              min={0}
              placeholder="e.g. 50"
              hint="Export products with stock less than this value"
            />
          </div>
        </div>

        {/* Right — Export Summary */}
        <div className="w-64 flex-shrink-0 border-l border-border bg-background overflow-y-auto px-4 py-5 space-y-4">
          <p className="text-[10px] font-medium uppercase tracking-widest text-text-light">
            Export summary
          </p>

          <div className="space-y-0.5">
            <SummaryRow
              label="Search term"
              value={filters.searchTerm || "None"}
              muted={!filters.searchTerm}
            />

            <div className="h-px bg-border mx-2 my-1" />

            <SummaryRow
              label="Category"
              value={getCategoryOption().label}
              muted={!filters.category}
            />
            <SummaryRow
              label="Payment method"
              value={getPaymentMethodOption(filters.paymentMethod).label}
              muted={filters.paymentMethod === "all"}
            />
            <SummaryRow
              label="Availability"
              value={getAvailabilityOption().label}
              muted={filters.isAvailable === null}
            />
            <SummaryRow
              label="Stock filter"
              value={
                filters.stockLessThan !== null
                  ? `Stock < ${filters.stockLessThan}`
                  : "No filter"
              }
              muted={filters.stockLessThan === null}
            />

            <div className="h-px bg-border mx-2 my-1" />

            <SummaryRow
              label="Max records"
              value={
                <span className="inline-flex items-center bg-info-5 text-info text-xs font-medium font-mono px-2 py-0.5 rounded-full">
                  {filters.limit > 0 ? filters.limit.toLocaleString() : "—"}
                </span>
              }
            />
          </div>

          {/* Active filters count */}
          <div className="pt-3 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-widest text-text-light mb-2">
              Active filters
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  activeCount > 0 ? "bg-info" : "bg-border"
                }`}
              />
              <span className="text-xs text-text-light">
                {activeCount > 0
                  ? `${activeCount} filter${activeCount > 1 ? "s" : ""} active`
                  : "No filters applied"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-3.5 border-t border-border bg-background">
        <Button onClick={() => modalRef?.dismiss()} variant="outline">
          <i className="ri-close-line mr-1.5" />
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-text-light">
            Up to{" "}
            <span className="font-medium text-text font-mono">
              {filters.limit > 0 ? filters.limit.toLocaleString() : "—"}
            </span>{" "}
            products
          </span>
          <Button onClick={handleConfirm} variant="primary">
            <i className="ri-download-line mr-1.5" />
            Export products
          </Button>
        </div>
      </div>
    </div>
  );
};