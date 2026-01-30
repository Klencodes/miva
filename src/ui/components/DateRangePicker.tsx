// DateRangePicker.tsx
import React from 'react';
import Button from './Button';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  onChange: () => void; 
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onChange,
}) => {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center space-x-3 p-1 rounded-sm border border-border bg-card">
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          max={endDate || today} // Prevent start > end
          className="uppercase px-3 py-1 border border-border rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
        <span className="text-text-light text-xs font-medium uppercase">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          min={startDate} // Prevent end < start
          max={today}
          className="uppercase px-3 py-1 border border-border rounded-sm text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary bg-background"
        />
      </div>

      <Button
        size="sm"
        onClick={onChange}
        disabled={!startDate || !endDate}
        className='py-2'
      >
        Apply
      </Button>
    </div>
  );
};