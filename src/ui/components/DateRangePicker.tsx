// DateRangePicker.tsx
import React from 'react';
import Button from './Button';
import { Roles } from '../../core/enums/roles';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onChange: () => void;
  userRole?: string; // Add user role prop
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onChange,
  userRole,
}) => {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  
  // Calculate max allowed date for SALES role (1 week from start date)
  const getMaxEndDate = () => {
    if (userRole === Roles.SALES && startDate) {
      const start = new Date(startDate);
      const maxDate = new Date(start);
      maxDate.setDate(start.getDate() + 7); // Add 7 days (1 week)
      
      // Ensure max date doesn't exceed today
      return maxDate > today ? todayISO : maxDate.toISOString().split('T')[0];
    }
    return todayISO;
  };

  // Calculate max date range for SALES role (1 week)
  const getMaxStartDate = () => {
    if (userRole === Roles.SALES) {
      const end = endDate ? new Date(endDate) : today;
      const maxStartDate = new Date(end);
      maxStartDate.setDate(end.getDate() - 7); // Go back 7 days
      return maxStartDate.toISOString().split('T')[0];
    }
    return undefined; // No restriction for other roles
  };

  // Get max end date dynamically
  const maxEndDate = getMaxEndDate();

  // Check if date range exceeds 1 week for SALES role
  const validateDateRange = (start: string, end: string) => {
    if (userRole !== Roles.SALES || !start || !end) return true;
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7;
  };

  // Handle start date change with validation
  const handleStartChange = (date: string) => {
    onStartChange(date);
    
    // If end date exists and range exceeds 1 week for SALES role, adjust end date
    if (userRole === Roles.SALES && endDate && date) {
      const start = new Date(date);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        // Adjust end date to be exactly 1 week from start
        const maxEnd = new Date(start);
        maxEnd.setDate(start.getDate() + 7);
        
        // Ensure adjusted date doesn't exceed today
        const finalEndDate = maxEnd > today ? today : maxEnd;
        onEndChange(finalEndDate.toISOString().split('T')[0]);
      }
    }
  };

  // Handle end date change with validation
  const handleEndChange = (date: string) => {
    if (userRole === Roles.SALES && startDate && date) {
      const start = new Date(startDate);
      const end = new Date(date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        // Show warning or adjust date
        alert(`Sales users can only select a maximum of 7 days. Selected range: ${diffDays} days.`);
        return;
      }
    }
    
    onEndChange(date);
  };

  const isDateRangeValid = validateDateRange(startDate, endDate);
  const maxStartDate = getMaxStartDate();

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-3 p-1 rounded-sm border border-border bg-card">
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
            max={endDate || todayISO}
            min={maxStartDate} // Restrict start date for SALES role
            className="uppercase px-3 py-1 border border-border rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
          <span className="text-text-light text-xs font-medium uppercase">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndChange(e.target.value)}
            min={startDate}
            max={maxEndDate} // Dynamic max based on role
            className="uppercase px-3 py-1 border border-border rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-background"
          />
        </div>

        <Button
          size="sm"
          onClick={onChange}
          disabled={!startDate || !endDate || !isDateRangeValid}
          className="py-2"
          title={!isDateRangeValid ? "Date range exceeds 7 days for sales role" : ""}
        >
          Apply
        </Button>
      </div>
      
      {/* Warning message for SALES role */}
      {userRole === Roles.SALES && (
        <div className="text-xs text-amber-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Maximum date range: 7 days
        </div>
      )}
    </div>
  );
};