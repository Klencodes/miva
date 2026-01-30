import React, { useState, useEffect } from "react";
import Input, { SelectOption } from "./Input";
import { DateRangePicker } from "./DateRangePicker";

interface SearchFilterProps {
  placeholder?: string;
  searchLabel?: string;
  showSort?: boolean;
  showFilters?: boolean;
  sortOptions?: SelectOption[];
  filterOptions?: SelectOption[];
  onSearchChange: (term: string) => void;
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: string) => void;
  onDateRangeChange: ( dateRange: { start_date: string; end_date: string } | null ) => void;
  currentDateRange?: { start_date: string; end_date: string } | null;
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
  // currentDateRange = null, 
}) => {
  // const today = new Date();
  // const thirtyDaysAgo = new Date();
  // thirtyDaysAgo.setDate(today.getDate() - 30);
  // const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
  // const defaultEnd = today.toISOString().split('T')[0];

  // const [startDate, setStartDate] = useState( defaultStart);
  // const [endDate, setEndDate] = useState( defaultEnd);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const showDateRange = !!onDateRangeChange || false;

  // Debounce search remains immediate
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

  // Sync local draft when parent-applied range changes (e.g. page load, reset from elsewhere)
  useEffect(() => {
    if (currentDateRange) {
      setStartDate(currentDateRange.start_date);
      setEndDate(currentDateRange.end_date);
    }
  }, [currentDateRange]);

  const handleApplyDateRange = () => {
    if (startDate && endDate) {
      const newRange = { start_date: startDate, end_date: endDate };
      onDateRangeChange(newRange);

      // Optional: also update local state immediately (already up to date)
      setStartDate(startDate);
      setEndDate(endDate);
    }
  };

  // const handleResetDateRange = () => {
  //   setStartDate(defaultStart);
  //   setEndDate(defaultEnd);
  //   onDateRangeChange({ start_date: defaultStart, end_date: defaultEnd });
  // };

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
        <div className="flex gap-x-2">
         <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleApplyDateRange}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
        {/* Optional: add a reset button */}
        {/* <Button size="sm" variant="outline" onClick={handleResetDateRange}>
          Reset
        </Button>         */}
        </div>
      )}

    </div>
  );
};