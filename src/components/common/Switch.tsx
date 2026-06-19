import React, { forwardRef } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'size'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'info';
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked = false,
      onChange,
      label,
      disabled = false,
      size = 'md',
      color = 'primary',
      className = '',
      ...props
    },
    ref
  ) => {
    // Size configurations
    const sizes = {
      sm: {
        track: 'w-8 h-5',
        thumb: 'w-3 h-3',
        translate: 'translate-x-3.5',
      },
      md: {
        track: 'w-10 h-6',
        thumb: 'w-4 h-4',
        translate: 'translate-x-4.5',
      },
      lg: {
        track: 'w-14 h-8',
        thumb: 'w-6 h-6',
        translate: 'translate-x-6.5',
      },
    };

    // Color configurations
    const colors = {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      success: 'bg-success',
      danger: 'bg-danger',
      info: 'bg-info',
    };

    const sizeConfig = sizes[size];
    const colorClass = colors[color];

    return (
      <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          ref={ref}
          {...props}
        />
        
        <div
          className={`
            relative inline-flex items-center
            ${sizeConfig.track}
            rounded-full transition-colors duration-200 ease-in-out
            ${checked ? colorClass : 'bg-white border-2 border-gray-300'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block
              ${sizeConfig.thumb}
              bg-white
              rounded-full
              shadow-md
              transform transition-transform duration-200 ease-in-out
              ${checked ? sizeConfig.translate : 'translate-x-0.5'}
              ${checked ? '' : 'border border-gray-200'}
            `}
          />
        </div>

        {label && (
          <span className={`text-sm ${disabled ? 'text-text-light' : 'text-text'}`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;