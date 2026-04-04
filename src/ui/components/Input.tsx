import React, { useState, useEffect, useRef, useId, useCallback } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outline';
export type InputType =
  | 'text' | 'password' | 'email' | 'number' | 'range' | 'date'
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
  prefixIcon?: string;
  suffixIcon?: string;
  suffixIconClickable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  selectOptions?: SelectOption[];
  selectPlaceholder?: string;
  autoApply?: boolean; // New prop for auto-apply mode
  showQuickSelect?: boolean; // New prop to show quick select options
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSuffixIconClick?: () => void;
  children?: React.ReactNode;
}

const IconRenderer = ({ iconName, extraClasses = '' }: { iconName: string; extraClasses?: string }) => {
  if (!iconName) return null;
  return <i className={`text-lg ri-${iconName}-line ${extraClasses}`}></i>;
};

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
      {/* Gradient picker */}
      <div
        ref={gradientRef}
        className="relative cursor-crosshair select-none"
        style={{
          height: 160,
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onMouseDown={(e) => { draggingGrad.current = true; updateFromGradient(e.clientX, e.clientY); }}
      >
        {/* Cursor */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${hsv[1] * 100}%`,
            top: `${(1 - hsv[2]) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 14, height: 14,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
            background: currentHex,
          }}
        />
      </div>

      <div className="p-3 space-y-3">
        {/* Hue slider */}
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
              border: '2px solid white',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              background: hueColor,
            }}
          />
        </div>

        {/* Preview + Hex Input */}
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

        {/* Presets */}
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

  // Update temp value when prop changes
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
        {/* Quick Select Sidebar */}
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

        {/* Calendar */}
        <div className="p-3 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevPeriod}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-primary hover:text-white"
              style={{ color: 'var(--text-color, #111)' }}
            >
              <i className="ri-arrow-left-s-line text-base" />
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
              <i className="ri-arrow-right-s-line text-base" />
            </button>
          </div>

          {/* Days View */}
          {viewMode === 'days' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--text-light-color, #9ca3af)' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
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

          {/* Months View */}
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

          {/* Years View */}
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

          {/* Footer with Apply/Cancel buttons */}
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

          {/* Footer for auto-apply mode */}
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

  const hasPrefixIcon = !!prefixIcon && type !== 'checkbox' && type !== 'textarea';
  const hasSuffixIcon = !!suffixIcon &&
    type !== 'password' && type !== 'checkbox' &&
    type !== 'range' && type !== 'select' && type !== 'textarea';
  const showPasswordIcon = type === 'password';

  const getInputType = () => {
    if (type === 'password' && showPassword) return 'text';
    if (isColor || isDateRange || isDate) return 'text';
    return type;
  };

  useEffect(() => {
    setHasValue(!!value || value === 0 || value === false);
  }, [value]);

  // Close picker on outside click
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
    if (type === 'password' && !disabled) setShowPassword(p => !p);
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
  const colorDisplayValue = isColor
    ? (isValidHex(value) ? value.toUpperCase() : value)
    : '';

  const dateRangeDisplayValue = isDateRange
    ? (() => {
        const v = value as DateRangeValue;
        if (!v?.start) return '';
        if (!v?.end || sameDay(v.start, v.end)) return formatDate(v.start);
        return `${formatDate(v.start)} – ${formatDate(v.end)}`;
      })()
    : '';

  const dateDisplayValue = isDate && value instanceof Date ? formatDate(value) : (isDate && typeof value === 'string' ? value : '');

  // ── Classes ────────────────────────────────────────────────────────────────
  const getFloatingInputClasses = () => {
    const base = 'block w-full focus:border-primary transition-all duration-200 bg-transparent outline-none text-text';
    const r = { none:'rounded-none', sm:'rounded-sm', md:'rounded-md', lg:'rounded-lg', xl:'rounded-xl', full:'rounded-full' }[radius];
    const s = { sm:'px-2.5 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-6 py-3 text-base' }[size];
    const v = { default:'border border-border', filled:'border border-border bg-background', outline:'border border-border' }[variant];
    const st = disabled ? 'cursor-not-allowed opacity-70 bg-background' : '';
    const fc = isFocused ? 'border-primary' : '';
    const ec = error ? 'border-danger' : '';
    return [base, r, s, v, st, fc, ec].join(' ');
  };

  const getInputClasses = () => {
    if (type === 'range') {
      const r = { none:'rounded-none', sm:'rounded-sm', md:'rounded', lg:'rounded-md', xl:'rounded-lg', full:'rounded-full' }[radius];
      return `w-full h-2 bg-background ${r} appearance-none cursor-pointer outline-none focus:border-primary
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
        [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer`;
    }
    const base = 'block w-full focus:border-primary transition-all duration-200 outline-none text-text';
    const r = { none:'rounded-none', sm:'rounded-sm', md:'rounded-md', lg:'rounded-lg', xl:'rounded-xl', full:'rounded-full' }[radius];
    const s = { sm:'py-1.5 px-2 text-xs', md:'py-2.5 px-3.5 text-sm', lg:'py-3.5 px-4.5 text-base' }[size];
    let v = '';
    if (variant === 'outline') v = `bg-transparent border border-border ${isFocused ? 'border-primary' : ''}`;
    else v = `bg-background border border-border ${isFocused ? 'border-primary' : ''}`;
    const st = disabled ? 'bg-background cursor-not-allowed' : '';
    const ec = error ? 'border-danger' : '';
    return [base, r, s, v, st, ec].join(' ');
  };

  const getCheckboxClasses = () =>
    `h-4 w-4 rounded border-border bg-background text-primary focus:border-primary outline-none ${{ none:'rounded-none', sm:'rounded-sm', md:'rounded', lg:'rounded-md', xl:'rounded-lg', full:'rounded-full' }[radius]}`;

  const getFloatingLabelClasses = () => {
    const base = 'absolute left-3 pointer-events-none transition-all duration-200 origin-top-left bg-card px-1 z-10';
    const active = '-top-2 text-base scale-75';
    const inactive = type === 'textarea' ? 'top-3 text-sm scale-100' : 'top-1/2 -translate-y-1/2 text-sm scale-100';
    const pos = isFocused || hasValue ? active : inactive;
    const col = isFocused ? 'text-primary' : 'text-text-light';
    return [base, pos, col, error ? 'text-danger' : ''].join(' ');
  };

  const getFloatingIconClasses = (isPrefix = false) => {
    const pos = isFocused || hasValue ? 'top-2' : 'top-1/2 -translate-y-1/2';
    return `absolute ${isPrefix ? 'left-0 pl-3' : 'right-0 pr-3'} ${pos} transition-all duration-200`;
  };

  const getDefaultIconClasses = (isPrefix = false) =>
    `absolute ${isPrefix ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange?.(e.target.value);
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked);
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value);

  // ── Color / Date trigger input ─────────────────────────────────────────────
  const renderTriggerInput = (displayValue: string, icon: string, pickerContent: React.ReactNode) => {
    const pL = hasPrefixIcon ? ' pl-10' : ' pl-10';
    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          {/* Prefix: color swatch or calendar icon */}
          <div
            className={`absolute left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${isFocused || hasValue ? 'top-2' : 'top-1/2 -translate-y-1/2'}`}
          >
            {isColor && isValidHex(value) ? (
              <span
                className="w-6 h-6 rounded-sm border border-border inline-block"
                style={{ background: value }}
              />
            ) : (
              <i className={`text-lg ri-${icon}-line text-text-light`} />
            )}
          </div>

          <input
            ref={inputRef}
            id={inputId}
            type="text"
            readOnly={isDateRange || isDate}
            value={displayValue}
            placeholder={floatingLabel ? '' : placeholder}
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
            className={getFloatingInputClasses() + pL + ' pr-9 cursor-pointer'}
          />

          {/* Toggle arrow */}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => { if (!disabled) setShowPicker(p => !p); }}
            className={`absolute right-0 pr-3 flex items-center transition-all duration-200 ${isFocused || hasValue ? 'top-2' : 'top-1/2 -translate-y-1/2'}`}
            style={{ color: 'var(--text-light-color, #9ca3af)' }}
          >
            <i className={`text-sm ri-arrow-${showPicker ? 'up' : 'down'}-s-line`} />
          </button>
        </div>

        {/* Floating label */}
        <label htmlFor={inputId} className={getFloatingLabelClasses()} onClick={focusInput}>
          {label}
          {required && <span className="text-danger">*</span>}
        </label>

        {/* Popup */}
        {showPicker && pickerContent}
      </div>
    );
  };

  // ── Floating input renderer ────────────────────────────────────────────────
  const renderFloatingInput = () => {
    const pL = hasPrefixIcon ? ' pl-10' : '';
    const pR = showPasswordIcon || hasSuffixIcon ? ' pr-10' : '';

    if (isColor) {
      return renderTriggerInput(colorDisplayValue, 'palette', (
        <ColorPickerPopup
          value={isValidHex(value) ? value : '#3b82f6'}
          onChange={(v) => onChange?.(v)}
          onClose={() => setShowPicker(false)}
        />
      ));
    }

    if (isDateRange) {
      return renderTriggerInput(dateRangeDisplayValue, 'calendar', (
        <DateRangePickerPopup
          value={value as DateRangeValue || { start: null, end: null }}
          onChange={(v) => onChange?.(v)}
          onClose={() => setShowPicker(false)}
          autoApply={autoApply}
          showQuickSelect={showQuickSelect}
        />
      ));
    }

    if (isDate) {
      const dateValue = value instanceof Date ? value : null;
      return renderTriggerInput(dateDisplayValue, 'calendar', (
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

    if (type === 'select') {
      return (
        <select
          ref={selectRef}
          value={value}
          onChange={handleSelectChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={getFloatingInputClasses() + (hasPrefixIcon ? ' pl-8' : '') +
            " appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem] bg-[length:1rem]"}
        >
          {selectPlaceholder && !value && <option value="" disabled>Select…</option>}
          {selectOptions.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
        </select>
      );
    }

    if (type === 'textarea') {
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
          rows={rows}
          className={getFloatingInputClasses() + ' resize-none min-h-[100px]' + (hasPrefixIcon ? ' pl-12' : '') + (hasSuffixIcon ? ' pr-10' : '')}
        />
      );
    }

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
        className={getFloatingInputClasses() + pL + pR}
      />
    );
  };

  // ── Default input renderer ─────────────────────────────────────────────────
  const renderDefaultInput = () => {
    const pL = hasPrefixIcon ? ' pl-10' : '';
    const pR = showPasswordIcon || hasSuffixIcon ? ' pr-10' : '';

    switch (type) {
      case 'range':
        return (
          <div className="flex items-center gap-2 w-full">
            <input ref={inputRef} id={inputId} type="range" min={min} max={max} step={step}
              disabled={disabled} readOnly={readonly} onChange={handleInputChange}
              value={value} onBlur={handleBlur} className={getInputClasses() + ' flex-1'} />
            <span className="w-12 text-center text-sm text-primary">{value}</span>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input ref={inputRef} id={inputId} type="checkbox" checked={!!value}
              onChange={handleCheckboxChange} onBlur={handleBlur} disabled={disabled}
              className={getCheckboxClasses()} />
            {label && (
              <label htmlFor={inputId} className="ml-2.5 block text-sm text-text cursor-pointer">
                {label}{required && <span className="text-danger">*</span>}
              </label>
            )}
          </div>
        );
      case 'select':
        return (
          <select ref={selectRef} id={inputId} value={value} onChange={handleSelectChange}
            onBlur={handleBlur} disabled={disabled}
            className={getInputClasses() + " appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==')] bg-no-repeat bg-[center_right_0.75rem] bg-[length:1rem]"}>
            {selectPlaceholder && <option value="" disabled>{selectPlaceholder}</option>}
            {selectOptions.map((o, i) => <option key={i} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'textarea':
        return (
          <textarea ref={textareaRef} id={inputId} placeholder={placeholder} disabled={disabled}
            readOnly={readonly} onChange={handleInputChange} onFocus={handleFocus}
            value={value} onBlur={handleBlur}
            className={getInputClasses() + ' resize-none min-h-[100px]' + (hasPrefixIcon ? ' pl-10' : '') + (hasSuffixIcon ? ' pr-10' : '') + (error ? ' border-danger' : '')} />
        );
      default:
        return (
          <input ref={inputRef} id={inputId} type={getInputType()} placeholder={placeholder}
            disabled={disabled} readOnly={readonly} onChange={handleInputChange}
            onFocus={handleFocus} value={value} onBlur={handleBlur}
            className={getInputClasses() + pL + pR + (error ? ' border-danger' : '')} />
        );
    }
  };

  // ── For color/date in default labelType, wrap with ref for outside-click ──
  const wrapTriggerDefault = (displayValue: string, icon: string, pickerContent: React.ReactNode) => (
    <div ref={containerRef} className="relative flex items-center">
      {hasPrefixIcon && (
        <div className={`pointer-events-none text-text-light ${getDefaultIconClasses(true)}`}>
          <IconRenderer iconName={prefixIcon!} />
        </div>
      )}
      {isColor && isValidHex(value) && (
        <div className={`pointer-events-none ${getDefaultIconClasses(true)}`}>
          <span className="w-4 h-4 rounded-sm border border-border" style={{ background: value }} />
        </div>
      )}
      {!isColor && (
        <div className={`pointer-events-none text-text-light ${getDefaultIconClasses(true)}`}>
          <i className={`text-lg ri-${icon}-line`} />
        </div>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        readOnly={isDateRange || isDate}
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={isColor ? (e) => {
          let v = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
          onChange?.(v);
        } : undefined}
        onFocus={() => { handleFocus(); if (!disabled && !readonly) setShowPicker(true); }}
        onBlur={handleBlur}
        onClick={() => { if (!disabled && !readonly && !showPicker) setShowPicker(true); }}
        className={getInputClasses() + ' pl-10 pr-9 cursor-pointer' + (error ? ' border-danger' : '')}
      />
      <button type="button" tabIndex={-1} disabled={disabled}
        onClick={() => { if (!disabled) setShowPicker(p => !p); }}
        className={`${getDefaultIconClasses(false)} text-text-light`}>
        <i className={`text-sm ri-arrow-${showPicker ? 'up' : 'down'}-s-line`} />
      </button>
      {showPicker && pickerContent}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="block space-y-1 mb-5">
      {showFloatingLabel && (
        <div className="relative">
          {isColor ? renderTriggerInput(colorDisplayValue, 'palette', (
            <ColorPickerPopup value={isValidHex(value) ? value : '#3b82f6'} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} />
          )) : isDateRange ? renderTriggerInput(dateRangeDisplayValue, 'calendar', (
            <DateRangePickerPopup value={value || { start: null, end: null }} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} autoApply={autoApply} showQuickSelect={showQuickSelect} />
          )) : isDate ? renderTriggerInput(dateDisplayValue, 'calendar', (
            <DateRangePickerPopup value={{ start: value instanceof Date ? value : null, end: null }} onChange={(v) => onChange?.(v.start)} onClose={() => setShowPicker(false)} singleDate autoApply={autoApply} />
          )) : (
            <>
              {renderFloatingInput()}
              <label htmlFor={inputId} className={getFloatingLabelClasses()} onClick={focusInput}>
                {label}{required && <span className="text-danger">*</span>}
              </label>
              {hasPrefixIcon && (
                <div className={`flex items-center pointer-events-none text-text-light ${getFloatingIconClasses(true)}`}>
                  <IconRenderer iconName={prefixIcon!} />
                </div>
              )}
              {showPasswordIcon && (
                <button type="button"
                  className={`flex items-center text-text-light hover:text-primary transition-colors ${getFloatingIconClasses(false)}`}
                  onClick={togglePasswordVisibility} onMouseDown={(e) => e.preventDefault()} disabled={disabled}>
                  <i className={`text-lg ${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}`} />
                </button>
              )}
              {hasSuffixIcon && (
                <div className={`flex items-center transition-colors ${getFloatingIconClasses(false)} ${!suffixIconClickable ? 'text-text-light pointer-events-none' : 'cursor-pointer pointer-events-auto'}`}
                  onClick={handleSuffixIconClick}>
                  <IconRenderer iconName={suffixIcon!} extraClasses={suffixIconClickable ? 'hover:text-primary' : ''} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showDefaultLabel && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text">
          {label}{required && <span className="text-danger">*</span>}
        </label>
      )}

      {showDefaultInput && (
        isColor ? wrapTriggerDefault(colorDisplayValue, 'palette', (
          <ColorPickerPopup value={isValidHex(value) ? value : '#3b82f6'} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} />
        )) : isDateRange ? wrapTriggerDefault(dateRangeDisplayValue, 'calendar', (
          <DateRangePickerPopup value={value || { start: null, end: null }} onChange={(v) => onChange?.(v)} onClose={() => setShowPicker(false)} autoApply={autoApply} showQuickSelect={showQuickSelect} />
        )) : isDate ? wrapTriggerDefault(dateDisplayValue, 'calendar', (
          <DateRangePickerPopup value={{ start: value instanceof Date ? value : null, end: null }} onChange={(v) => onChange?.(v.start)} onClose={() => setShowPicker(false)} singleDate autoApply={autoApply} />
        )) : (
          <div className={`relative flex items-center ${type === 'checkbox' ? 'flex-row-reverse' : ''}`}>
            {hasPrefixIcon && (
              <div className={`pointer-events-none text-text-light ${getDefaultIconClasses(true)}`}>
                <IconRenderer iconName={prefixIcon!} />
              </div>
            )}
            {renderDefaultInput()}
            {showPasswordIcon && (
              <button type="button" className={`text-text-light hover:text-primary ${getDefaultIconClasses(false)}`}
                onClick={togglePasswordVisibility} onMouseDown={(e) => e.preventDefault()} disabled={disabled}>
                <i className={`text-lg ${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}`} />
              </button>
            )}
            {hasSuffixIcon && (
              <div className={`${getDefaultIconClasses(false)} ${!suffixIconClickable ? 'text-text-light pointer-events-none' : 'cursor-pointer pointer-events-auto'}`}
                onClick={handleSuffixIconClick}>
                <IconRenderer iconName={suffixIcon!} extraClasses={suffixIconClickable ? 'hover:text-primary' : ''} />
              </div>
            )}
          </div>
        )
      )}

      {hint && showHint && <p className="text-xs text-text-light">{hint}</p>}
      {error && showError && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
};

export default Input;