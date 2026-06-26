import React, { useState, useEffect } from "react";
import Input, { SelectOption, DateRangeValue } from "./Input";
import { Filter, X } from "lucide-react";

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
  autoApply?: boolean;
  showQuickSelect?: boolean;
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
  autoApply = true,
  showQuickSelect = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Convert string dates to Date objects for the date-range input
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>({
    start: currentDateRange?.start_date ? new Date(currentDateRange.start_date) : null,
    end: currentDateRange?.end_date ? new Date(currentDateRange.end_date) : null,
  });

  const showDateRange = !!onDateRangeChange;
  const hasAdvancedFilters = showSort || showFilters || showDateRange;
  const hasActiveFilters = selectedSort || selectedFilter || dateRangeValue.start || dateRangeValue.end;

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

  // Sync local state when parent-applied range changes
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

  // Reset all filters
  const handleResetAllFilters = () => {
    setSelectedSort("");
    setSelectedFilter("");
    setDateRangeValue({ start: null, end: null });
    onDateRangeChange(null);
    onSortChange("");
    onFilterChange("");
    setShowAdvancedFilters(false);
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      {/* Main Search Row - Always Visible */}
      <div className="flex items-center gap-2">
        {/* Search Input - Takes full width on mobile */}
        <div className="relative flex-1">
          <Input
            type="text"
            label={searchLabel}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(value: string) => setSearchTerm(value)}
          />
        </div>

        {/* Advanced Filters Toggle - Only show if there are filters */}
        {hasAdvancedFilters && (
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex-shrink-0 p-2 rounded-lg border border-border bg-card hover:bg-background transition-colors relative"
            aria-label={showAdvancedFilters ? "Hide filters" : "Show filters"}
          >
            <Filter size={20} className="text-text-light" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card"></span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Filters - Collapsible on mobile */}
      {showAdvancedFilters && hasAdvancedFilters && (
        <div className="flex flex-col gap-3 p-3 bg-background rounded-lg border border-border">
          {/* Header with filter count */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">
              Filters {hasActiveFilters && `(${[
                selectedSort && 'Sort',
                selectedFilter && 'Filter',
                (dateRangeValue.start || dateRangeValue.end) && 'Date'
              ].filter(Boolean).length} active)`}
            </span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetAllFilters}
                  className="text-xs text-danger hover:text-danger/80 transition-colors"
                >
                  Reset all
                </button>
              )}
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 rounded hover:bg-card transition-colors"
              >
                <X size={16} className="text-text-light" />
              </button>
            </div>
          </div>

          {/* Filter Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Sort Dropdown */}
            {showSort && (
              <div className="w-full">
                <Input
                  type="select"
                  label="Sort By"
                  value={selectedSort}
                  onChange={handleSortChange}
                  selectOptions={[
                    { label: "Select sort...", value: "" },
                    ...sortOptions,
                  ]}
                  placeholder="Sort by"
                />
              </div>
            )}

            {/* Filter Dropdown */}
            {showFilters && (
              <div className="w-full">
                <Input
                  type="select"
                  label="Filter By"
                  value={selectedFilter}
                  onChange={handleFilterChange}
                  selectOptions={[
                    { label: "Select filter...", value: "" },
                    ...filterOptions,
                  ]}
                  placeholder="Filter by"
                />
              </div>
            )}
            
            {/* Date Range Filter */}
            {showDateRange && (
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="date-range"
                      label="Date Range"
                      placeholder="Select date range"
                      value={dateRangeValue}
                      onChange={handleDateRangeChange}
                      autoApply={false}
                      showQuickSelect={false}
                    />
                  </div>
                  
                  {/* Reset date button */}
                  {(dateRangeValue.start || dateRangeValue.end) && (
                    <button
                      onClick={handleResetDateRange}
                      className="flex-shrink-0 p-2 text-xs text-danger hover:text-danger/80 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Apply button for manual mode */}
          {!autoApply && (selectedSort || selectedFilter || dateRangeValue.start || dateRangeValue.end) && (
            <div className="flex justify-end mt-2">
              <button
                onClick={() => {
                  // Apply all filters
                  if (dateRangeValue.start && dateRangeValue.end) {
                    onDateRangeChange({
                      start_date: dateRangeValue.start.toISOString().split('T')[0],
                      end_date: dateRangeValue.end.toISOString().split('T')[0],
                    });
                  }
                  setShowAdvancedFilters(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile: Active filters summary */}
      {hasActiveFilters && !showAdvancedFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-light">Active filters:</span>
          {selectedSort && (
            <span className="text-xs bg-primary-10 text-primary px-2 py-0.5 rounded-full">
              {sortOptions.find(opt => opt.value === selectedSort)?.label || selectedSort}
            </span>
          )}
          {selectedFilter && (
            <span className="text-xs bg-primary-10 text-primary px-2 py-0.5 rounded-full">
              {filterOptions.find(opt => opt.value === selectedFilter)?.label || selectedFilter}
            </span>
          )}
          {(dateRangeValue.start || dateRangeValue.end) && (
            <span className="text-xs bg-primary-10 text-primary px-2 py-0.5 rounded-full">
              {dateRangeValue.start?.toLocaleDateString()} - {dateRangeValue.end?.toLocaleDateString()}
            </span>
          )}
          <button
            onClick={handleResetAllFilters}
            className="text-xs text-danger hover:text-danger/80 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};