/**
 * Toast Context Provider
 *
 * Provides toast notification functionality with:
 * - Auto-dismiss after configurable duration
 * - Support for success, error, warning, and info variants
 * - Multiple toasts can be displayed simultaneously
 * - Accessible announcements for screen readers
 */

import { createContext, useContext, useCallback, useState, useRef, useEffect, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Available toast variants
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification data
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;
  /** Message to display */
  message: string;
  /** Visual variant of the toast */
  variant: ToastVariant;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration: number;
  /** Timestamp when the toast was created */
  createdAt: number;
}

/**
 * Options for showing a toast
 */
export interface ToastOptions {
  /** Message to display */
  message: string;
  /** Visual variant of the toast */
  variant?: ToastVariant;
  /** Duration in milliseconds before auto-dismiss (default: 3000) */
  duration?: number;
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  /** Currently active toasts */
  toasts: Toast[];
  /** Show a new toast notification */
  showToast: (options: ToastOptions) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Remove all toasts */
  clearAllToasts: () => void;
  /** Convenience method for success toast */
  success: (message: string, duration?: number) => string;
  /** Convenience method for error toast */
  error: (message: string, duration?: number) => string;
  /** Convenience method for warning toast */
  warning: (message: string, duration?: number) => string;
  /** Convenience method for info toast */
  info: (message: string, duration?: number) => string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 3000; // 3 seconds
const MAX_TOASTS = 5; // Maximum number of toasts to display at once

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique ID for a toast
 */
function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Provider Component
// ============================================================================

export interface ToastProviderProps {
  children: ReactNode;
  /** Maximum number of toasts to display (default: 5) */
  maxToasts?: number;
  /** Default duration for toasts in milliseconds (default: 3000) */
  defaultDuration?: number;
}

/**
 * Toast Provider Component
 *
 * Wraps the application to provide toast notification context.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({
  children,
  maxToasts = MAX_TOASTS,
  defaultDuration = DEFAULT_DURATION,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Map to store timeout IDs for each toast
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current.clear();
    };
  }, []);

  // Remove a toast by ID and clear its timeout
  const removeToast = useCallback((id: string) => {
    // Clear the timeout for this toast if it exists
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // Show a new toast
  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = generateToastId();
      const duration = options.duration ?? defaultDuration;

      const newToast: Toast = {
        id,
        message: options.message,
        variant: options.variant ?? 'info',
        duration,
        createdAt: Date.now(),
      };

      setToasts((current) => {
        // Remove oldest toasts if we exceed the maximum
        const updated = [...current, newToast];
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      // Set up auto-dismiss if duration is greater than 0
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          timeoutRefs.current.delete(id);
          removeToast(id);
        }, duration);
        timeoutRefs.current.set(id, timeoutId);
      }

      return id;
    },
    [defaultDuration, maxToasts, removeToast]
  );

  // Clear all toasts and their timeouts
  const clearAllToasts = useCallback(() => {
    timeoutRefs.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutRefs.current.clear();
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, duration?: number) =>
      showToast({ message, variant: 'success', duration }),
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) =>
      showToast({ message, variant: 'error', duration }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) =>
      showToast({ message, variant: 'warning', duration }),
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) =>
      showToast({ message, variant: 'info', duration }),
    [showToast]
  );

  const value: ToastContextValue = {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access toast context
 *
 * @returns Toast context value with state and actions
 * @throws Error if used outside of ToastProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error } = useToast();
 *
 *   const handleCopy = async () => {
 *     const copied = await copyToClipboard(text);
 *     if (copied) {
 *       success('Copied to clipboard!');
 *     } else {
 *       error('Failed to copy');
 *     }
 *   };
 *
 *   return <button onClick={handleCopy}>Copy</button>;
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export { ToastContext };
