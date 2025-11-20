import React, { useState, useEffect, useRef, useId } from 'react';
import { SelectOption } from "../../core/interfaces/ISelectOption";

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outline';
export type InputType = 'text' | 'password' | 'email' | 'number' | 'range' | 'date' | 'tel' | 'url' | 'search' | 'checkbox' | 'select' | 'time' | 'textarea';
export type InputRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type LabelType = 'default' | 'floating';

export interface CustomInputProps {
  id?: string;
  type?: InputType;
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  name?: string;
  value?: any;
  size?: InputSize;
  variant?: InputVariant;
  radius?: InputRadius;
  labelType?: LabelType;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  prefixIcon?: boolean;
  suffixIcon?: boolean;
  suffixIconClickable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  selectOptions?: SelectOption[];
  selectPlaceholder?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSuffixIconClick?: () => void;
  children?: React.ReactNode;
}

const Input: React.FC<CustomInputProps> = ({
  id,
  type = 'text',
  label = '',
  placeholder = '',
  hint = '',
  error = '',
  name = '',
  value = '',
  size = 'md',
  variant = 'outline',
  radius = 'sm',
  labelType = 'floating',
  disabled = false,
  readonly = false,
  required = false,
  prefixIcon = false,
  suffixIcon = false,
  suffixIconClickable = false,
  min,
  max,
  step,
  selectOptions = [],
  selectPlaceholder = '',
  onChange,
  onBlur,
  onFocus,
  onSuffixIconClick,
  children
}) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  // Helper properties to avoid type comparison issues
  const showFloatingLabel = labelType === 'floating' && 
    type !== 'checkbox' && 
    type !== 'range';

  const showDefaultLabel = labelType === 'default' && 
    label !== '' && 
    type !== 'checkbox' && 
    type !== 'range';

  const showDefaultInput = labelType === 'default' || 
    type === 'checkbox' || 
    type === 'range' ||
    !showFloatingLabel;

  const showHint = type !== 'checkbox';
  const showError = type !== 'checkbox';
  const floatingLabel = labelType === 'floating';

  // Icon visibility helpers - EXCLUDING 'textarea' for icon usage logic
  const showFloatingPrefixIcon = prefixIcon && 
    type !== 'checkbox' &&
    type !== 'textarea';

  const showFloatingSuffixIcon = suffixIcon && 
    type !== 'password' && 
    type !== 'checkbox' && 
    type !== 'range' && 
    type !== 'select' &&
    type !== 'textarea';

  const showFloatingPasswordIcon = type === 'password';

  const showDefaultPrefixIcon = prefixIcon && 
    type !== 'password' && 
    type !== 'checkbox' && 
    type !== 'range' && 
    type !== 'select' &&
    type !== 'textarea';

  const showDefaultSuffixIcon = suffixIcon && 
    type !== 'password' && 
    type !== 'checkbox' && 
    type !== 'range' && 
    type !== 'select' &&
    type !== 'textarea';

  const showDefaultPasswordIcon = type === 'password' && labelType === 'default';

  // Helper method to get the actual input type
  const getInputType = (): string => {
    if (type === 'password' && showPassword) {
      return 'text';
    }
    return type;
  };

  useEffect(() => {
    updateHasValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updateHasValue = (): void => {
    setHasValue(!!value || value === 0 || value === false);
  };

  const handleFocus = (): void => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = (): void => {
    setIsFocused(false);
    onBlur?.();
    updateHasValue();
  };

  const togglePasswordVisibility = (): void => {
    if (type === 'password' && !disabled) {
      setShowPassword(!showPassword);
    }
  };

  const focusInput = (): void => {
    if (!disabled) {
      if (inputRef.current) inputRef.current.focus();
      if (textareaRef.current) textareaRef.current.focus();
      if (selectRef.current) selectRef.current.focus();
    }
  };

  const handleSuffixIconClick = (): void => {
    if (suffixIconClickable && !disabled) {
      onSuffixIconClick?.();
    }
  };

  /**
   * Floating Input Classes
   */
  const getFloatingInputClasses = (): string => {
    const baseClasses = 'block w-full focus:border-primary transition-all duration-200 bg-transparent outline-none';
    
    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }[radius];

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    }[size];

    const variantClasses = {
      default: 'border border-border',
      filled: 'border border-border bg-background',
      outline: 'border border-border'
    }[variant];

    const stateClasses = disabled 
      ? 'cursor-not-allowed opacity-70 bg-background' 
      : '';

    const focusClasses = isFocused ? 'border-primary' : '';
    const errorClasses = error ? 'border-danger' : '';

    return [baseClasses, radiusClasses, sizeClasses, variantClasses, stateClasses, focusClasses, errorClasses].join(' ');
  };

  /**
   * Default Input Classes
   */
  const getInputClasses = (): string => {
    if (type === 'range') {
      const radiusClasses = {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded',
        lg: 'rounded-md',
        xl: 'rounded-lg',
        full: 'rounded-full'
      }[radius];

      return `w-full h-2 bg-background${radiusClasses} appearance-none cursor-pointer outline-none
              focus:border-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer`;
    }

    const baseClasses = 'block w-full focus:border-primary transition-all duration-200 outline-none';
    
    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }[radius];

    const sizeClasses = {
      sm: 'py-1.5 px-2 text-xs',
      md: 'py-2.5 px-3.5 text-sm',
      lg: 'py-3.5 px-4.5 text-base'
    }[size];

    let variantClasses;
    switch (variant) {
      case 'default':
        variantClasses = `bg-background border border-border ${isFocused ? 'border-primary' : ''}`;
        break;
      case 'filled':
        variantClasses = `bg-background border border-border ${isFocused ? 'border-primary' : ''}`;
        break;
      case 'outline':
        variantClasses = `bg-transparent border border-border ${isFocused ? 'border-primary' : ''}`;
        break;
    }

    const stateClasses = disabled 
      ? 'bg-background cursor-not-allowed' 
      : '';

    const errorClasses = error ? 'border-danger' : '';

    return [baseClasses, radiusClasses, sizeClasses, variantClasses, stateClasses, errorClasses].join(' ');
  };

  const getCheckboxClasses = (): string => {
    const baseClasses = 'h-4 w-4 rounded border-border bg-background text-primary focus:border-primary outline-none';
    
    const radiusClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded',
      lg: 'rounded-md',
      xl: 'rounded-lg',
      full: 'rounded-full'
    }[radius];

    return [baseClasses, radiusClasses].join(' ');
  };

  /**
   * Floating Label Classes
   */
  const getFloatingLabelClasses = (): string => {
    const baseClasses = 'absolute left-3 pointer-events-none transition-all duration-200 origin-top-left bg-card px-1 z-10';
    
    const activePosition = '-top-2 text-base scale-75';
    
    let inactivePosition;
    if (type === 'textarea') {
      inactivePosition = 'top-3 text-sm scale-100';
    } else {
      inactivePosition = 'top-1/2 -translate-y-1/2 text-sm scale-100';
    }

    const positionClasses = isFocused || hasValue ? activePosition : inactivePosition;

    const colorClasses = isFocused
      ? 'text-primary'
      : 'text-text-light';

    const errorClasses = error ? 'text-danger' : '';

    return [baseClasses, positionClasses, colorClasses, errorClasses].join(' ');
  };

  const getFloatingIconClasses = (): string => {
    const positionClasses = isFocused || hasValue
      ? 'top-2'
      : 'top-1/2 -translate-y-1/2';

    return `absolute ${positionClasses} transition-all duration-200`;
  };

  // Event handlers
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const newValue = event.target.value;
    onChange?.(newValue);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = event.target.checked;
    onChange?.(newValue);
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newValue = event.target.value;
    onChange?.(newValue);
  };

  // Extract prefix and suffix from children
  const prefixContent = React.Children.toArray(children).find(
    (child: any) => child.props?.slot === 'prefix'
  );

  const suffixContent = React.Children.toArray(children).find(
    (child: any) => child.props?.slot === 'suffix'
  );

  // Render methods for different input types
  const renderFloatingInput = () => {
    if (type === 'select') {
      return (
        <select
          ref={selectRef}
          value={value}
          onChange={handleSelectChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={getFloatingInputClasses() + " appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9wYXRoPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem] bg-[length:1rem]"}
        >
          {selectPlaceholder && !value && (
            <option value="" disabled selected></option>
          )}
          {selectOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    } else if (type === 'textarea') {
      return (
        <textarea
          ref={textareaRef}
          id={inputId}
          placeholder={floatingLabel ? '' : placeholder}
          disabled={disabled}
          readOnly={readonly}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          className={getFloatingInputClasses() + ' resize-none min-h-[100px]' + 
            (prefixIcon && showFloatingPrefixIcon ? ' pl-12' : '') +
            (suffixIcon && showFloatingSuffixIcon ? ' pr-10' : '')}
        />
      );
    } else {
      return (
        <input
          ref={inputRef}
          id={inputId}
          type={getInputType()}
          placeholder={floatingLabel ? '' : placeholder}
          disabled={disabled}
          readOnly={readonly}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          className={getFloatingInputClasses() +
            (prefixIcon && showFloatingPrefixIcon ? ' pl-10' : '') +
            (showFloatingPasswordIcon || (suffixIcon && showFloatingSuffixIcon) ? ' pr-10' : '')}
        />
      );
    }
  };

  const renderDefaultInput = () => {
    switch (type) {
      case 'range':
        return (
          <div className="flex items-center gap-2 w-full">
            <input
              ref={inputRef}
              id={inputId}
              type="range"
              min={min}
              max={max}
              step={step}
              disabled={disabled}
              readOnly={readonly}
              onChange={handleInputChange}
              value={value}
              onBlur={handleBlur}
              className={getInputClasses() + ' flex-1'}
            />
            <span className="w-12 text-center text-sm text-primary">
              {value}
            </span>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              ref={inputRef}
              id={inputId}
              type="checkbox"
              checked={!!value}
              onChange={handleCheckboxChange}
              onBlur={handleBlur}
              disabled={disabled}
              className={getCheckboxClasses()}
            />
            {label && (
              <label htmlFor={inputId} className="ml-2.5 block text-sm text-text cursor-pointer">
                {label}
                {required && <span className="text-danger">*</span>}
              </label>
            )}
          </div>
        );
      
      case 'select':
        return (
          <select
            ref={selectRef}
            id={inputId}
            value={value}
            onChange={handleSelectChange}
            onBlur={handleBlur}
            disabled={disabled}
             className={getFloatingInputClasses() +
            (prefixIcon && showFloatingPrefixIcon ? ' pl-10' : '') +
            (showFloatingPasswordIcon || (suffixIcon && showFloatingSuffixIcon) ? ' pr-10' : '') + " appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tZG93biI+PHBhdGggZD0ibTYgOSA2IDYgNi02Ii8+PC9wYXRoPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem] bg-[length:1rem]"}
          >
            
            {selectPlaceholder && (
              <option value="" disabled selected>
                {selectPlaceholder}
              </option>
            )}
            {selectOptions.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            ref={textareaRef}
            id={inputId}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            onChange={handleInputChange}
            onFocus={handleFocus}
            value={value}
            onBlur={handleBlur}
            className={getInputClasses() + ' resize-none min-h-[100px]' + 
              (prefixIcon && showDefaultPrefixIcon ? ' pl-10' : '') +
              (suffixIcon && showDefaultSuffixIcon ? ' pr-10' : '') +
              (error ? ' border-danger' : '')}
          />
        );
      
      default:
        return (
          <input
            ref={inputRef}
            id={inputId}
            type={getInputType()}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            onChange={handleInputChange}
            onFocus={handleFocus}
            value={value}
            onBlur={handleBlur}
            className={getInputClasses() +
              (prefixIcon && showDefaultPrefixIcon ? ' pl-10' : '') +
              (showDefaultPasswordIcon || (suffixIcon && showDefaultSuffixIcon) ? ' pr-10' : '') +
              (error ? ' border-danger' : '')}
          />
        );
    }
  };

  return (
    <div className="block space-y-1 mb-5">
      {showFloatingLabel && (
        <div className="relative">
          {renderFloatingInput()}

          <label 
            htmlFor={inputId} 
            className={getFloatingLabelClasses()}
            onClick={focusInput}
          >
            {label}
            {required && <span className="text-danger">*</span>}
          </label>

          {showFloatingPrefixIcon && prefixContent && (
            <div className={`absolute left-0 pl-3 flex items-center pointer-events-none text-text-light ${getFloatingIconClasses()}`}>
              {prefixContent}
            </div>
          )}

          {showFloatingPasswordIcon && (
            <button
              type="button"
              className={`absolute right-0 pr-3 flex items-center text-text-light hover:text-primary transition-colors ${getFloatingIconClasses()}`}
              onClick={togglePasswordVisibility}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <i className={`text-lg ${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}`}></i>
            </button>
          )}

          {showFloatingSuffixIcon && suffixContent && (
            <div 
              className={`absolute right-0 pr-3 flex items-center transition-colors ${getFloatingIconClasses()} ${
                !suffixIconClickable 
                  ? 'text-text-light pointer-events-none' 
                  : 'cursor-pointer pointer-events-auto'
              }`}
              onClick={handleSuffixIconClick}
            >
              {suffixContent}
            </div>
          )}
        </div>
      )}

      {showDefaultLabel && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}

      {showDefaultInput && (
        <div className={`relative flex items-center ${type === 'checkbox' ? 'flex-row-reverse' : ''}`}>
          {showDefaultPrefixIcon && prefixContent && (
            <div className="absolute left-0 pl-3 flex items-center pointer-events-none text-text-light">
              {prefixContent}
            </div>
          )}
          
          {renderDefaultInput()}

          {showDefaultPasswordIcon && (
            <button
              type="button"
              className="absolute right-0 pr-3 flex items-center text-text-light hover:text-primary"
              onClick={togglePasswordVisibility}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <i className={`text-lg ${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}`}></i>
            </button>
          )}

          {showDefaultSuffixIcon && suffixContent && (
            <div 
              className={`absolute right-0 pr-3 flex items-center ${
                !suffixIconClickable 
                  ? 'text-text-light pointer-events-none' 
                  : 'cursor-pointer pointer-events-auto'
              }`}
              onClick={handleSuffixIconClick}
            >
              {suffixContent}
            </div>
          )}
        </div>
      )}

      {hint && showHint && (
        <p className="text-xs text-text-light">{hint}</p>
      )}

      {error && showError && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
};

export default Input;
