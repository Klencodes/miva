import React, { createContext, useContext, useState, useCallback, ReactNode, CSSProperties } from 'react';

// --- 1. INTERFACES ---

export type ToastType = 'success' | 'error' | 'info' | 'default';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-center';

export interface ToastData {
  id: number;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
}

interface ToastContextType {
  toasts: ToastData[];
  show: (
    title: string,
    message: string,
    type?: ToastType,
    duration?: number,
    position?: ToastPosition
  ) => void;
  hide: (id: number) => void;
}

// --- 2. CONTEXT & HOOK ---

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Custom hook to access the toast notification functions (show and hide).
 * Must be used within a <ToastProvider>.
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// --- 3. PROVIDER ---

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Provides the state and logic for managing toast notifications.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [counter, setCounter] = useState(0);

  const hide = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const show = useCallback((
    title: string,
    message: string,
    type: ToastType = 'default',
    duration = 3000,
    position: ToastPosition = 'top-right'
  ) => {
    // We use the counter for a unique ID
    setCounter(prev => prev + 1);
    const id = counter;

    const toast: ToastData = {
      id,
      title,
      message,
      type,
      duration,
      position,
    };

    // --- MODIFICATION: Filter out any existing toast at this position ---
    setToasts(prevToasts => {
      // Keep toasts with different positions, and replace the one with the same position
      const newToasts = prevToasts.filter(t => t.position !== position);
      return [...newToasts, toast];
    });
    // --------------------------------------------------------------------

    // Set timeout to automatically hide the toast
    setTimeout(() => {
      hide(id);
    }, duration);
  }, [counter, hide]); // counter is included here to ensure the latest value is used

  const value: ToastContextType = {
    toasts,
    show,
    hide,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* The component that renders the toasts must be placed here */}
      <ToastDisplay />
    </ToastContext.Provider>
  );
};

// --- 4. DISPLAY COMPONENT (TOAST DISPLAY) ---

/**
 * Component responsible for rendering all active toasts using inline styles.
 * It is meant to be used internally by the ToastProvider.
 */
export const ToastDisplay: React.FC = () => {
  const { toasts, hide } = useToast();

  // Base styles for the individual toast item
  const toastItemStyles: CSSProperties = {
    padding: '1rem',
    color: 'white',
    borderRadius: '6px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    minWidth: '250px',
    maxWidth: '350px',
    margin: '0.5rem 0',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
    opacity: 0.95,
    wordBreak: 'break-word',
    fontSize: '0.875rem', // sm text
  };

  // Styles for the toast container (Fixed position for the group)
  const containerStyles: CSSProperties = {
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    zIndex: 9999,
    pointerEvents: 'none', // Allows clicks to pass through container
  };

  // Positioning for the container
  const positionContainerStyles: Record<ToastPosition, CSSProperties> = {
    'top-right': { top: '0', right: '0', alignItems: 'flex-end' },
    'top-left': { top: '0', left: '0', alignItems: 'flex-start' },
    'bottom-right': { bottom: '0', right: '0', alignItems: 'flex-end', flexDirection: 'column-reverse' },
    'bottom-left': { bottom: '0', left: '0', alignItems: 'flex-start', flexDirection: 'column-reverse' },
    'top-center': { top: '0', left: '50%', transform: 'translateX(-50%)', alignItems: 'center' },
    'bottom-center': { bottom: '0', left: '50%', transform: 'translateX(-50%)', alignItems: 'center', flexDirection: 'column-reverse' },
  };

  // Color styles for different toast types - Now uses CSS variables with fallbacks
  const typeStyles: Record<ToastType, CSSProperties> = {
    // If the CSS variable is not defined, it defaults to the hardcoded color (e.g., #10b981)
    success: { backgroundColor: 'var(--bg-success, #66BB6A)' },
    error: { backgroundColor: 'var(--bg-danger, #FF453A)' },
    info: { backgroundColor: 'var(--bg-info, #e08e00)' },
    default: { backgroundColor: 'var(--bg-primary, #08872e)' },
  };

  // Group toasts by position to allow stacking in the correct corner/side
  // Since we only allow one per position now, this array will contain 0 or 1 toast.
  const groupedToasts = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {} as Record<ToastPosition, ToastData[]>);

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          // The container gets the position and stacking direction
          style={{
            ...containerStyles,
            ...positionContainerStyles[position as ToastPosition],
          }}
        >
          {positionToasts.map((toast) => (
            <div
              key={toast.id}
              // The toast item is styled, and has pointer events re-enabled
              style={{
                ...toastItemStyles,
                ...typeStyles[toast.type],
                pointerEvents: 'auto', // Re-enable pointer events for clicking
              }}
              onClick={() => hide(toast.id)}
              title="Click to dismiss"
            >
              {toast.title && <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{toast.title}</strong>}
              <p style={{ margin: 0 }}>{toast.message}</p>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
