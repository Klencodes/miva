import React, { useState, useEffect } from 'react';
import Input from './Input';
import { SelectOption } from "../../core/interfaces/ISelectOption";


interface SearchFilterProps {
  placeholder?: string;
  searchLabel?: string;
  showSort?: boolean;
  showFilters?: boolean;
  showDateRange?: boolean;
  sortOptions?: SelectOption[];
  filterOptions?: SelectOption[];
  onSearchChange: (term: string) => void;
  onSortChange: (sort: string) => void;
  onFilterChange: (filter: string) => void;
  onDateRangeChange: (dateRange: { start: string; end: string } | null) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder = 'Search...',
  searchLabel = 'Search',
  showSort = false,
  showFilters = false,
  showDateRange = false,
  sortOptions = [],
  filterOptions = [],
  onSearchChange,
  onSortChange,
  onFilterChange,
  onDateRangeChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const handleDateChange = () => {
    if (startDate || endDate) {
      onDateRangeChange({
        start: startDate,
        end: endDate
      });
    } else {
      onDateRangeChange(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 pt-4">
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

      {/* Date Range Filter */}
      {showDateRange && (
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e: any) => {
                setStartDate(e.target.value);
                handleDateChange();
              }}
            />

            <span className="self-center text-gray-500 mt-6">to</span>

            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e: any) => {
                setEndDate(e.target.value);
                handleDateChange();
              }}
            />
          </div>
        </div>
      )}

      {/* Sort Dropdown */}
      {showSort && (
        <div className="relative">
          <Input
            type="select"
            label="Sort By"
            value={selectedSort}
            onChange={handleSortChange}
            selectOptions={[
              { label: 'Select sort...', value: '' },
              ...sortOptions
            ]}
          />
        </div>
      )}

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="relative">
          <Input
            type="select"
            label="Filter By"
            value={selectedFilter}
            onChange={handleFilterChange}
            selectOptions={[
              { label: 'Select filter...', value: '' },
              ...filterOptions
            ]}
          />
        </div>
      )}
    </div>
  );
};