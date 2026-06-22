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
        translate: 'translate-x-[14px]', // 3.5 * 4px = 14px
      },
      md: {
        track: 'w-10 h-6',
        thumb: 'w-4 h-4',
        translate: 'translate-x-[18px]', // 4.5 * 4px = 18px
      },
      lg: {
        track: 'w-14 h-8',
        thumb: 'w-6 h-6',
        translate: 'translate-x-[26px]', // 6.5 * 4px = 26px
      },
    };

    // Color configurations - using specific color classes
    const colors = {
      primary: 'bg-blue-500 dark:bg-blue-400',
      secondary: 'bg-gray-500 dark:bg-gray-400',
      success: 'bg-green-500 dark:bg-green-400',
      danger: 'bg-red-500 dark:bg-red-400',
      info: 'bg-cyan-500 dark:bg-cyan-400',
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
            relative inline-flex items-center flex-shrink-0
            ${sizeConfig.track}
            rounded-full transition-colors duration-200 ease-in-out
            ${checked ? colorClass : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${checked ? 'border-transparent' : 'border-2 border-gray-300 dark:border-gray-600'}
          `}
        >
          <span
            className={`
              inline-block
              ${sizeConfig.thumb}
              bg-white dark:bg-gray-200
              rounded-full
              shadow-md
              transform transition-transform duration-200 ease-in-out
              ${checked ? sizeConfig.translate : 'translate-x-0.5'}
              ${checked ? '' : 'border border-gray-300 dark:border-gray-600'}
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

export default Switch;