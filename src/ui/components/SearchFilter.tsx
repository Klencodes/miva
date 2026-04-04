import React, { useState, useEffect } from "react";
import Input, { SelectOption, DateRangeValue } from "./Input";

interface SearchFilterProps {
  placeholder?: string;
  searchLabel?: string;
  showSort?: boolean;
  userRole?: string;
  showFilters?: boolean;
  sortOptions?: SelectOption[];
  filterOptions?: SelectOption[];
  onSearchChange: (term: string) => void;
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: string) => void;
  onDateRangeChange: (dateRange: { start_date: string; end_date: string } | null) => void;
  currentDateRange?: { start_date: string; end_date: string } | null;
  autoApply?: boolean; // New prop to control auto-apply behavior
  showQuickSelect?: boolean; // New prop to show quick select options
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = "Search...",
  searchLabel = "Search",
  showSort = false,
  showFilters = false,
  sortOptions = [],
  filterOptions = [],
  onSearchChange,
  onSortChange,
  onFilterChange,
  onDateRangeChange,
  currentDateRange,
  userRole,
  autoApply = true, // Default to auto-apply mode
  showQuickSelect = true, // Default to showing quick select
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  
  // Convert string dates to Date objects for the date-range input
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>({
    start: currentDateRange?.start_date ? new Date(currentDateRange.start_date) : null,
    end: currentDateRange?.end_date ? new Date(currentDateRange.end_date) : null,
  });

  const showDateRange = !!onDateRangeChange;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    onSortChange(value);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    onFilterChange(value);
  };

  // Sync local state when parent-applied range changes (e.g., page load, reset from elsewhere)
  useEffect(() => {
    if (currentDateRange) {
      setDateRangeValue({
        start: currentDateRange.start_date ? new Date(currentDateRange.start_date) : null,
        end: currentDateRange.end_date ? new Date(currentDateRange.end_date) : null,
      });
    }
  }, [currentDateRange]);

  // Handle date range changes from the Input component
  const handleDateRangeChange = (range: DateRangeValue) => {
    setDateRangeValue(range);
    
    // If auto-apply is enabled, immediately notify parent
    if (autoApply && range.start && range.end) {
      onDateRangeChange({
        start_date: range.start.toISOString().split('T')[0],
        end_date: range.end.toISOString().split('T')[0],
      });
    }
  };

  // Optional: Reset date range
  const handleResetDateRange = () => {
    const resetRange = { start: null, end: null };
    setDateRangeValue(resetRange);
    onDateRangeChange(null);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4">
      {/* Search Input */}
      <div className="relative flex-grow">
        <Input
          type="text"
          label={searchLabel}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(value: string) => setSearchTerm(value)}
        />
      </div>

      {/* Sort Dropdown */}
      {showSort && (
        <div className="relative min-w-[150px]">
          <Input
            type="select"
            label="Sort By"
            value={selectedSort}
            onChange={handleSortChange}
            selectOptions={[
              { label: "Select sort...", value: "" },
              ...sortOptions,
            ]}
          />
        </div>
      )}

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="relative min-w-[150px]">
          <Input
            type="select"
            label="Filter By"
            value={selectedFilter}
            onChange={handleFilterChange}
            selectOptions={[
              { label: "Select filter...", value: "" },
              ...filterOptions,
            ]}
          />
        </div>
      )}
      
      {/* Date Range Filter */}
      {showDateRange && (
        <div className="flex gap-x-2 items-end">
          <div className="min-w-[280px] -mb-5">
            <Input
              type="date-range"
              label="Date Range"
              placeholder="Select date range"
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              autoApply={false}
              showQuickSelect={false}
              variant="outline"
              size="md"
              radius="sm"
            />
          </div>
          
          {/* Optional reset button */}
          {(dateRangeValue.start || dateRangeValue.end) && (
            <button
              onClick={handleResetDateRange}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-danger, #ef4444)',
                border: '1px solid var(--color-border, #e5e7eb)',
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};