import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outline';
export type InputType = 'text' | 'password' | 'email' | 'number' | 'range' | 'date'
  | 'tel' | 'url' | 'search' | 'checkbox' | 'select' | 'time'
  | 'textarea' | 'color' | 'date-range';
export type InputRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type LabelType = 'default' | 'floating';

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

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
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  suffixIconClickable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  selectOptions?: SelectOption[];
  selectPlaceholder?: string;
  autoApply?: boolean;
  showQuickSelect?: boolean;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSuffixIconClick?: () => void;
  children?: React.ReactNode;
}

// ─── Color Picker ────────────────────────────────────────────────────────────

function hexToHsv(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255).toString(16).padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function isValidHex(hex: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

const ColorPickerPopup: React.FC<{ value: string; onChange: (v: string) => void; onClose: () => void }> = ({
  value, onChange, onClose,
}) => {
  const safeHex = isValidHex(value) ? value : '#3b82f6';
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(safeHex));
  const [hexInput, setHexInput] = useState(safeHex.toUpperCase());
  const gradientRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const draggingGrad = useRef(false);
  const draggingHue = useRef(false);

  const currentHex = hsvToHex(...hsv);

  const updateFromGradient = useCallback((clientX: number, clientY: number) => {
    if (!gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setHsv(([h]) => [h, s, v]);
  }, []);

  const updateFromHue = useCallback((clientX: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setHsv(([, s, v]) => [Math.round(h), s, v]);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingGrad.current) updateFromGradient(e.clientX, e.clientY);
      if (draggingHue.current) updateFromHue(e.clientX);
    };
    const onUp = () => { draggingGrad.current = false; draggingHue.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [updateFromGradient, updateFromHue]);

  useEffect(() => {
    const hex = hsvToHex(...hsv);
    setHexInput(hex.toUpperCase());
    onChange(hex);
  }, [hsv, onChange]);

  const presets = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#000000','#ffffff'];

  const hueColor = hsvToHex(hsv[0], 1, 1);

  return (
    <div
      className="absolute z-50 top-full left-0 mt-2 shadow-2xl rounded-xl overflow-hidden"
      style={{
        width: 260,
        background: 'var(--card-color, #fff)',
        border: '1px solid var(--border-color, #e5e7eb)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        ref={gradientRef}
        className="relative cursor-crosshair select-none"
        style={{
          height: 160,
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onMouseDown={(e) => { draggingGrad.current = true; updateFromGradient(e.clientX, e.clientY); }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${hsv[1] * 100}%`,
            top: `${(1 - hsv[2]) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 14, height: 14,
            borderRadius: '50%',
            border: '2px solid var(--border-color)',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            background: currentHex,
          }}
        />
      </div>

      <div className="p-3 space-y-3">
        <div
          ref={hueRef}
          className="relative cursor-pointer select-none"
          style={{
            height: 12, borderRadius: 6,
            background: 'linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)',
          }}
          onMouseDown={(e) => { draggingHue.current = true; updateFromHue(e.clientX); }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${(hsv[0] / 360) * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 16, height: 16,
              borderRadius: '50%',
              border: '2px solid var(--border-color)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              background: hueColor,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex-shrink-0 rounded-md border border-border"
            style={{ width: 32, height: 32, background: currentHex }}
          />
          <div className="flex-1 flex items-center border border-border rounded-md overflow-hidden" style={{ background: 'var(--background-color, #f9fafb)' }}>
            <span className="pl-2 text-xs" style={{ color: 'var(--text-light-color, #9ca3af)' }}>#</span>
            <input
              className="flex-1 px-1 py-1.5 text-xs font-mono outline-none bg-transparent"
              style={{ color: 'var(--text-color, #111)' }}
              value={hexInput.replace('#', '')}
              maxLength={6}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                setHexInput(raw);
                if (raw.length === 6) {
                  setHsv(hexToHsv(`#${raw}`));
                }
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              className="rounded-md transition-transform hover:scale-110 focus:outline-none"
              style={{
                width: 20, height: 20,
                background: p,
                border: currentHex.toLowerCase() === p.toLowerCase() ? '2px solid var(--primary-color, #3b82f6)' : '1px solid var(--border-color, #e5e7eb)',
              }}
              onClick={() => { setHsv(hexToHsv(p)); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Date Range Picker ────────────────────────────────────────────────────────

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInclusiveInRange(d: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  return (d >= start && d <= end);
}

function formatDate(d: Date | null) {
  if (!d) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

const DateRangePickerPopup: React.FC<{
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  onClose: () => void;
  singleDate?: boolean;
  autoApply?: boolean;
  showQuickSelect?: boolean;
}> = ({ value, onChange, onClose, singleDate = false, autoApply = true, showQuickSelect = true }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [hovered, setHovered] = useState<Date | null>(null);
  const [tempValue, setTempValue] = useState<DateRangeValue>(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleMonthYearClick = () => {
    if (viewMode === 'days') {
      setViewMode('months');
    } else if (viewMode === 'months') {
      setViewMode('years');
    }
  };

  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setViewMode('days');
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setViewMode('months');
  };

  const prevPeriod = () => {
    if (viewMode === 'days') {
      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
      else setViewMonth(m => m - 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y - 1);
    } else if (viewMode === 'years') {
      setViewYear(y => y - 20);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'days') {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
      else setViewMonth(m => m + 1);
    } else if (viewMode === 'months') {
      setViewYear(y => y + 1);
    } else if (viewMode === 'years') {
      setViewYear(y => y + 20);
    }
  };

  const handleDayClick = (d: Date) => {
    if (singleDate) {
      if (autoApply) {
        onChange({ start: d, end: d });
        onClose();
      } else {
        setTempValue({ start: d, end: d });
      }
      return;
    }
    
    if (!tempValue.start || (tempValue.start && tempValue.end)) {
      setTempValue({ start: d, end: null });
    } else {
      let newValue: DateRangeValue;
      if (d < tempValue.start) {
        newValue = { start: d, end: tempValue.start };
      } else {
        newValue = { start: tempValue.start, end: d };
      }
      setTempValue(newValue);
      
      if (autoApply) {
        onChange(newValue);
        onClose();
      }
    }
  };

  const handleApply = () => {
    onChange(tempValue);
    onClose();
  };

  const handleCancel = () => {
    setTempValue(value);
    onClose();
  };

  const handleQuickSelect = (start: Date, end: Date) => {
    const newValue = { start, end };
    setTempValue(newValue);
    if (autoApply) {
      onChange(newValue);
      onClose();
    }
  };

  const cells: (Date | null)[] = [];
  
  if (viewMode === 'days') {
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(viewYear, viewMonth, i));
  }

  const quickSelectOptions = [
    { label: 'Today', getRange: () => ({ start: new Date(), end: new Date() }) },
    { label: 'Yesterday', getRange: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return { start: y, end: y };
    }},
    { label: 'Last 7 days', getRange: () => {
      const e = new Date();
      const s = new Date();
      s.setDate(s.getDate() - 6);
      return { start: s, end: e };
    }},
    { label: 'Last 30 days', getRange: () => {
      const e = new Date();
      const s = new Date();
      s.setDate(s.getDate() - 29);
      return { start: s, end: e };
    }},
    { label: 'This month', getRange: () => {
      const s = new Date(today.getFullYear(), today.getMonth(), 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: s, end: e };
    }},
    { label: 'Last month', getRange: () => {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: e };
    }},
    { label: 'Next month', getRange: () => {
      const s = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { start: s, end: e };
    }},
    { label: 'This year', getRange: () => {
      const s = new Date(today.getFullYear(), 0, 1);
      const e = new Date(today.getFullYear(), 11, 31);
      return { start: s, end: e };
    }},
  ];

  return (
    <div
      className="absolute z-50 top-full left-0 mt-2 shadow-2xl rounded-xl overflow-hidden"
      style={{
        background: 'var(--card-color, #fff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        minWidth: 320,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex">
        {showQuickSelect && !singleDate && (
          <div className="flex flex-col py-3 px-2 gap-0.5" style={{ borderRight: '1px solid var(--border-color, #e5e7eb)', minWidth: 110 }}>
            <p className="text-xs font-semibold px-2 pb-1" style={{ color: 'var(--text-light-color, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Select
            </p>
            {quickSelectOptions.map(option => (
              <button
                key={option.label}
                onClick={() => {
                  const { start, end } = option.getRange();
                  handleQuickSelect(start, end);
                }}
                className="text-left text-xs px-2 py-1.5 rounded-md transition-colors hover:bg-primary hover:text-white"
                style={{ color: 'var(--text-color, #111)' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-3 flex-1">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevPeriod}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-primary hover:text-white"
              style={{ color: 'var(--text-color, #111)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleMonthYearClick}
              className="text-sm font-semibold hover:text-primary transition-colors px-2 py-1 rounded-md"
              style={{ color: 'var(--text-color, #111)' }}
            >
              {viewMode === 'days' && `${MONTHS[viewMonth]} ${viewYear}`}
              {viewMode === 'months' && `${viewYear}`}
              {viewMode === 'years' && `${viewYear - 10} - ${viewYear + 9}`}
            </button>
            <button
              onClick={nextPeriod}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-primary hover:text-white"
              style={{ color: 'var(--text-color, #111)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--text-light-color, #9ca3af)' }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;

                  const isStart = tempValue.start && sameDay(date, tempValue.start);
                  const isEnd = tempValue.end && sameDay(date, tempValue.end);
                  const isSelected = isStart || isEnd;
                  const isInRange = tempValue.start && tempValue.end && isInclusiveInRange(date, tempValue.start, tempValue.end);
                  const isInPreviewRange = tempValue.start && hovered && !tempValue.end && isInclusiveInRange(date, tempValue.start, hovered);
                  const isToday = sameDay(date, today);

                  let bgStyle: React.CSSProperties = {};
                  let textColor = 'var(--text-color, #111)';

                  if (isSelected) {
                    bgStyle = { background: 'var(--primary-color, #3b82f6)', borderRadius: 6 };
                    textColor = '#fff';
                  } else if (isInPreviewRange && !singleDate) {
                    bgStyle = { background: 'color-mix(in srgb, var(--primary-color, #3b82f6) 20%, transparent)', borderRadius: 0 };
                  } else if (isInRange && !singleDate) {
                    bgStyle = { background: 'color-mix(in srgb, var(--primary-color, #3b82f6) 15%, transparent)', borderRadius: 0 };
                  }

                  if (isStart && !singleDate) {
                    bgStyle.borderRadius = '6px 0 0 6px';
                  }
                  if (isEnd && !singleDate) {
                    bgStyle.borderRadius = '0 6px 6px 0';
                  }
                  if (isStart && isEnd) {
                    bgStyle.borderRadius = 6;
                  }

                  return (
                    <div key={date.toISOString()} style={bgStyle}>
                      <button
                        className="w-full text-xs py-1.5 transition-colors relative"
                        style={{
                          color: textColor,
                          fontWeight: isToday && !isSelected ? 700 : 400,
                        }}
                        onClick={() => handleDayClick(date)}
                        onMouseEnter={() => setHovered(date)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {isToday && !isSelected && (
                          <span
                            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 block rounded-full"
                            style={{ width: 4, height: 4, background: 'var(--primary-color, #3b82f6)' }}
                          />
                        )}
                        {date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className="text-sm py-2 px-3 rounded-md transition-colors hover:bg-primary hover:text-white"
                  style={{
                    background: viewMonth === index ? 'var(--primary-color, #3b82f6)' : 'transparent',
                    color: viewMonth === index ? '#fff' : 'var(--text-color, #111)',
                  }}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'years' && (
            <div className="grid grid-cols-4 gap-2">
              {YEARS().map(year => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className="text-sm py-2 px-3 rounded-md transition-colors hover:bg-primary hover:text-white"
                  style={{
                    background: viewYear === year ? 'var(--primary-color, #3b82f6)' : 'transparent',
                    color: viewYear === year ? '#fff' : 'var(--text-color, #111)',
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {!autoApply && !singleDate && (
            <div className="mt-4 pt-2 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <span className="text-xs flex-1" style={{ color: 'var(--text-light-color, #9ca3af)' }}>
                {tempValue.start && !tempValue.end ? 'Select end date' : 
                 tempValue.start && tempValue.end ? `${formatDate(tempValue.start)} – ${formatDate(tempValue.end)}` : 
                 'Select date range'}
              </span>
              <div className="flex gap-2">
                <button
                  className="text-xs px-3 py-1.5 rounded-md transition-colors hover:bg-danger/10"
                  style={{ color: 'var(--danger-color, #ef4444)' }}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="text-xs px-3 py-1.5 rounded-md transition-colors bg-primary text-white hover:opacity-90"
                  onClick={handleApply}
                  disabled={!tempValue.start || !tempValue.end}
                  style={{
                    opacity: !tempValue.start || !tempValue.end ? 0.5 : 1,
                    cursor: !tempValue.start || !tempValue.end ? 'not-allowed' : 'pointer',
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {autoApply && !singleDate && (
            <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color, #e5e7eb)' }}>
              <span className="text-xs" style={{ color: 'var(--text-light-color, #9ca3af)' }}>
                {tempValue.start && !tempValue.end ? 'Select end date' : 
                 tempValue.start && tempValue.end ? `${formatDate(tempValue.start)} – ${formatDate(tempValue.end)}` : 
                 'Select start date'}
              </span>
              {(tempValue.start || tempValue.end) && (
                <button
                  className="text-xs px-2 py-1 rounded-md transition-colors hover:bg-danger/10"
                  style={{ color: 'var(--danger-color, #ef4444)' }}
                  onClick={() => setTempValue({ start: null, end: null })}
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Input Component ─────────────────────────────────────────────────────

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
  prefixIcon,
  suffixIcon,
  suffixIconClickable = false,
  min,
  max,
  step,
  rows = 3,
  selectOptions = [],
  selectPlaceholder = '',
  autoApply = true,
  showQuickSelect = true,
  onChange,
  onBlur,
  onFocus,
  onSuffixIconClick,
}) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const isColor = type === 'color';
  const isDateRange = type === 'date-range';
  const isDate = type === 'date';
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';
  const isCheckbox = type === 'checkbox';
  const isRange = type === 'range';
  const isPassword = type === 'password';

  const showFloatingLabel = labelType === 'floating' && !isCheckbox && !isRange;
  const showDefaultLabel = labelType === 'default' && label !== '' && !isCheckbox && !isRange;
  const hasPrefixIcon = !!prefixIcon && !isCheckbox && !isTextarea;
  const hasSuffixIcon = !!suffixIcon && !isPassword && !isCheckbox && !isRange && !isSelect && !isTextarea;
  const showPasswordIcon = isPassword;

  const getInputType = () => {
    if (isPassword && showPassword) return 'text';
    if (isColor || isDateRange || isDate) return 'text';
    return type;
  };

  useEffect(() => {
    setHasValue(!!value || value === 0 || value === false);
  }, [value]);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const handleFocus = () => { setIsFocused(true); onFocus?.(); };
  const handleBlur = () => { 
    setIsFocused(false); 
    onBlur?.(); 
    setHasValue(!!value || value === 0 || value === false);
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowPicker(false);
      }
    }, 200);
  };

  const togglePasswordVisibility = () => {
    if (isPassword && !disabled) setShowPassword(p => !p);
  };

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
      textareaRef.current?.focus();
      selectRef.current?.focus();
    }
  };

  const handleSuffixIconClick = () => {
    if (suffixIconClickable && !disabled && hasSuffixIcon) onSuffixIconClick?.();
  };

  // ── Display value helpers ──────────────────────────────────────────────────
  const colorDisplayValue = isColor ? (isValidHex(value) ? value.toUpperCase() : value) : '';

  const dateRangeDisplayValue = isDateRange ? (() => {
    const v = value as DateRangeValue;
    if (!v?.start) return '';
    if (!v?.end || sameDay(v.start, v.end)) return formatDate(v.start);
    return `${formatDate(v.start)} – ${formatDate(v.end)}`;
  })() : '';

  const dateDisplayValue = isDate && value instanceof Date ? formatDate(value) : (isDate && typeof value === 'string' ? value : '');

  // ── Size-specific spacing ───────────────────────────────────────────────────
  const getSpacing = () => {
    const spacings = {
      sm: { px: 'px-3', py: 'py-1.5', text: 'text-xs', icon: 'w-3.5 h-3.5', gap: 'gap-1.5' },
      md: { px: 'px-4', py: 'py-2.5', text: 'text-sm', icon: 'w-4 h-4', gap: 'gap-2' },
      lg: { px: 'px-5', py: 'py-3.5', text: 'text-base', icon: 'w-5 h-5', gap: 'gap-2.5' }
    };
    return spacings[size] || spacings.md;
  };

  const spacing = getSpacing();

  // ── Classes ────────────────────────────────────────────────────────────────
  const getBaseInputClasses = () => {
    const r = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }[radius] || 'rounded-md';

    const v = variant === 'filled' ? 'bg-card border-border' : 'bg-background border-border';
    const focusState = isFocused ? 'border-primary ring-2 ring-primary/20' : '';
    const errorState = error ? 'border-danger ring-2 ring-danger/20' : '';
    const disabledState = disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : '';
    
    return `w-full border transition-all duration-200 outline-none ${r} ${v} ${focusState} ${errorState} ${disabledState}`;
  };

  // ── Render icon helper ──────────────────────────────────────────────────
  const renderIcon = (icon: React.ReactNode, className: string = '') => {
    if (!icon) return null;
    return (
      <div className={`flex items-center justify-center text-text-light ${className}`}>
        {icon}
      </div>
    );
  };

  // ── Color / Date trigger input ─────────────────────────────────────────────
  const renderTriggerInput = (displayValue: string, pickerContent: React.ReactNode) => {
    const isColorType = isColor;
    const iconSize = spacing.icon;
    
    return (
      <div ref={containerRef} className="relative w-full">
        <div className="relative">
          {/* Prefix Icon */}
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
            {isColorType && isValidHex(value) ? (
              <span
                className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
                style={{ background: value }}
              />
            ) : (
              <Calendar className={iconSize} />
            )}
          </div>

          <input
            ref={inputRef}
            id={inputId}
            type="text"
            readOnly={isDateRange || isDate}
            value={displayValue}
            placeholder={showFloatingLabel ? '' : placeholder}
            disabled={disabled}
            onChange={isColor ? (e) => {
              let v = e.target.value;
              if (!v.startsWith('#')) v = '#' + v;
              v = '#' + v.slice(1).replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
              onChange?.(v);
            } : undefined}
            onFocus={() => { handleFocus(); if (!disabled && !readonly) setShowPicker(true); }}
            onBlur={handleBlur}
            onClick={() => { if (!disabled && !readonly && !showPicker) setShowPicker(true); }}
            className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text} pl-10 pr-10 cursor-pointer`}
            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
          />

          {/* Suffix Arrow */}
          <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer ${iconSize}`}
            onClick={() => { if (!disabled) setShowPicker(p => !p); }}
          >
            {showPicker ? (
              <ChevronUp className={iconSize} />
            ) : (
              <ChevronDown className={iconSize} />
            )}
          </div>
        </div>

        {/* Floating label */}
        {showFloatingLabel && (
          <label 
            htmlFor={inputId} 
            className={`absolute left-3 pointer-events-none transition-all duration-200 bg-card px-1 z-10 ${spacing.text}
              ${isFocused || hasValue ? '-top-2 scale-75 text-primary' : 'top-1/2 -translate-y-1/2 scale-100 text-text-light'}`}
            onClick={focusInput}
          >
            {label}{required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}

        {/* Popup */}
        {showPicker && pickerContent}
      </div>
    );
  };

  // ── Floating input renderer ────────────────────────────────────────────────
  const renderFloatingInput = () => {
    const hasLeftIcon = hasPrefixIcon || isColor || isDateRange || isDate;
    const hasRightIcon = showPasswordIcon || hasSuffixIcon || isSelect;
    const iconSize = spacing.icon;
    
    // For color picker
    if (isColor) {
      return renderTriggerInput(colorDisplayValue, (
        <ColorPickerPopup
          value={isValidHex(value) ? value : '#3b82f6'}
          onChange={(v) => onChange?.(v)}
          onClose={() => setShowPicker(false)}
        />
      ));
    }

    // For date range
    if (isDateRange) {
      return renderTriggerInput(dateRangeDisplayValue, (
        <DateRangePickerPopup
          value={value as DateRangeValue || { start: null, end: null }}
          onChange={(v) => onChange?.(v)}
          onClose={() => setShowPicker(false)}
          autoApply={autoApply}
          showQuickSelect={showQuickSelect}
        />
      ));
    }

    // For date
    if (isDate) {
      const dateValue = value instanceof Date ? value : null;
      return renderTriggerInput(dateDisplayValue, (
        <DateRangePickerPopup
          value={{ start: dateValue, end: dateValue }}
          onChange={(v) => onChange?.(v.start)}
          onClose={() => setShowPicker(false)}
          singleDate
          autoApply={autoApply}
          showQuickSelect={false}
        />
      ));
    }

    // For select
    if (isSelect) {
      return (
        <div className="relative w-full">
          {hasPrefixIcon && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
              {prefixIcon}
            </div>
          )}
          
          <select
            ref={selectRef}
            id={inputId}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text} appearance-none pr-10`}
            style={{ 
              paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
              paddingRight: '2.5rem' 
            }}
          >
            {selectPlaceholder && !value && <option value="" disabled>Select…</option>}
            {selectOptions.map((o, i) => (
              <option key={i} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>

          <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
            <ChevronDown className={iconSize} />
          </div>

          {showFloatingLabel && (
            <label 
              htmlFor={inputId} 
              className={`absolute left-3 pointer-events-none transition-all duration-200 bg-card px-1 z-10 ${spacing.text}
                ${isFocused || hasValue ? '-top-2 scale-75 text-primary' : 'top-1/2 -translate-y-1/2 scale-100 text-text-light'}`}
              onClick={focusInput}
            >
              {label}{required && <span className="text-danger ml-0.5">*</span>}
            </label>
          )}
        </div>
      );
    }

    // For textarea
    if (isTextarea) {
      return (
        <div className="relative w-full">
          {hasPrefixIcon && (
            <div className={`absolute left-3 top-3 flex items-center justify-center ${iconSize}`}>
              {prefixIcon}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            id={inputId}
            placeholder={showFloatingLabel ? '' : placeholder}
            disabled={disabled}
            readOnly={readonly}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            rows={rows}
            className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text} resize-none min-h-[80px]`}
            style={{ 
              paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
            }}
          />

          {showFloatingLabel && (
            <label 
              htmlFor={inputId} 
              className={`absolute left-3 pointer-events-none transition-all duration-200 bg-card px-1 z-10 ${spacing.text}
                ${isFocused || hasValue ? '-top-2 scale-75 text-primary' : 'top-3 scale-100 text-text-light'}`}
              onClick={focusInput}
            >
              {label}{required && <span className="text-danger ml-0.5">*</span>}
            </label>
          )}
        </div>
      );
    }

    // Default input
    return (
      <div className="relative w-full">
        {hasPrefixIcon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
            {prefixIcon}
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type={getInputType()}
          placeholder={showFloatingLabel ? '' : placeholder}
          disabled={disabled}
          readOnly={readonly}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text}`}
          style={{ 
            paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
            paddingRight: showPasswordIcon || hasSuffixIcon ? '2.5rem' : spacing.px,
          }}
        />

        {showPasswordIcon && (
          <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer ${iconSize}`}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className={iconSize} />
            ) : (
              <Eye className={iconSize} />
            )}
          </div>
        )}

        {hasSuffixIcon && suffixIcon && (
          <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${suffixIconClickable ? 'cursor-pointer hover:opacity-70' : ''} ${iconSize}`}
            onClick={handleSuffixIconClick}
          >
            {suffixIcon}
          </div>
        )}

        {showFloatingLabel && (
          <label 
            htmlFor={inputId} 
            className={`absolute left-3 pointer-events-none transition-all duration-200 bg-card px-1 z-10 ${spacing.text}
              ${isFocused || hasValue ? '-top-2 scale-75 text-primary' : 'top-1/2 -translate-y-1/2 scale-100 text-text-light'}`}
            onClick={focusInput}
          >
            {label}{required && <span className="text-danger ml-0.5">*</span>}
          </label>
        )}
      </div>
    );
  };

  // ── Default input renderer ─────────────────────────────────────────────────
  const renderDefaultInput = () => {
    const hasLeftIcon = hasPrefixIcon || isColor || isDateRange || isDate;
    const hasRightIcon = showPasswordIcon || hasSuffixIcon || isSelect;
    const iconSize = spacing.icon;

    // Range input
    if (isRange) {
      return (
        <div className="flex items-center gap-3 w-full">
          <input
            ref={inputRef}
            id={inputId}
            type="range"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            readOnly={readonly}
            onChange={(e) => onChange?.(e.target.value)}
            value={value}
            onBlur={handleBlur}
            className="flex-1 h-2 bg-gray-200 appearance-none cursor-pointer"
          />
          <span className={`min-w-[3rem] text-center font-medium text-primary ${spacing.text}`}>
            {value}
          </span>
        </div>
      );
    }

    // Checkbox
    if (isCheckbox) {
      return (
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            id={inputId}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange?.(e.target.checked)}
            onBlur={handleBlur}
            disabled={disabled}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
          />
          {label && (
            <label htmlFor={inputId} className={`text-text cursor-pointer ${spacing.text}`}>
              {label}{required && <span className="text-danger ml-0.5">*</span>}
            </label>
          )}
        </div>
      );
    }

    // Color picker
    if (isColor) {
      return renderTriggerInput(colorDisplayValue, (
        <ColorPickerPopup value={isValidHex(value) ? value : '#3b82f6'} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} />
      ));
    }

    // Date range
    if (isDateRange) {
      return renderTriggerInput(dateRangeDisplayValue, (
        <DateRangePickerPopup value={value || { start: null, end: null }} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} autoApply={autoApply} showQuickSelect={showQuickSelect} />
      ));
    }

    // Date
    if (isDate) {
      return renderTriggerInput(dateDisplayValue, (
        <DateRangePickerPopup value={{ start: value instanceof Date ? value : null, end: null }} onChange={(v) => onChange?.(v.start)} onClose={() => setShowPicker(false)} singleDate autoApply={autoApply} />
      ));
    }

    // Select
    if (isSelect) {
      return (
        <div className="relative w-full">
          {hasPrefixIcon && (
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
              {prefixIcon}
            </div>
          )}
          
          <select
            ref={selectRef}
            id={inputId}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text} appearance-none pr-10`}
            style={{ 
              paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
              paddingRight: '2.5rem' 
            }}
          >
            {selectPlaceholder && !value && <option value="" disabled>Select…</option>}
            {selectOptions.map((o, i) => (
              <option key={i} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>

          <div className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
            <ChevronDown className={iconSize} />
          </div>
        </div>
      );
    }

    // Textarea
    if (isTextarea) {
      return (
        <div className="relative w-full">
          {hasPrefixIcon && (
            <div className={`absolute left-3 top-3 flex items-center justify-center ${iconSize}`}>
              {prefixIcon}
            </div>
          )}
          
          <textarea
            ref={textareaRef}
            id={inputId}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={handleFocus}
            value={value}
            onBlur={handleBlur}
            rows={rows}
            className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text} resize-none min-h-[80px]`}
            style={{ 
              paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
            }}
          />
        </div>
      );
    }

    // Default input
    return (
      <div className="relative w-full">
        {hasPrefixIcon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${iconSize}`}>
            {prefixIcon}
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type={getInputType()}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          value={value}
          onBlur={handleBlur}
          className={`${getBaseInputClasses()} ${spacing.px} ${spacing.py} ${spacing.text}`}
          style={{ 
            paddingLeft: hasPrefixIcon ? '2.5rem' : spacing.px,
            paddingRight: showPasswordIcon || hasSuffixIcon ? '2.5rem' : spacing.px,
          }}
        />

        {showPasswordIcon && (
          <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer ${iconSize}`}
            onClick={togglePasswordVisibility}
          >
            {showPassword ? (
              <EyeOff className={iconSize} />
            ) : (
              <Eye className={iconSize} />
            )}
          </div>
        )}

        {hasSuffixIcon && suffixIcon && (
          <div 
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center ${suffixIconClickable ? 'cursor-pointer hover:opacity-70' : ''} ${iconSize}`}
            onClick={handleSuffixIconClick}
          >
            {suffixIcon}
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-1.5">
      {/* Default Label */}
      {showDefaultLabel && (
        <label htmlFor={inputId} className={`block font-medium text-text ${spacing.text}`}>
          {label}{required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      {/* Input */}
      {showFloatingLabel ? renderFloatingInput() : renderDefaultInput()}

      {/* Hint & Error */}
      {hint && !isCheckbox && !isRange && (
        <p className={`text-text-light ${spacing.text}`}>{hint}</p>
      )}
      {error && !isCheckbox && !isRange && (
        <p className={`text-danger ${spacing.text}`}>{error}</p>
      )}
    </div>
  );
};

export default Input;