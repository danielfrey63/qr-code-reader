/**
 * Toast Container Component
 *
 * Renders all active toast notifications in a fixed position container.
 * Supports success, error, warning, and info variants with appropriate
 * icons and styling.
 */

import { useToast, type Toast, type ToastVariant } from '../contexts/ToastContext';
import './ToastContainer.css';

/**
 * Toast Container - renders all active toasts
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notifications"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Toast Item Component
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  return (
    <div
      className={`toast toast--${toast.variant}`}
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      data-testid={`toast-${toast.variant}`}
    >
      <div className="toast__icon">
        <ToastIcon variant={toast.variant} />
      </div>
      <div className="toast__content">
        <p className="toast__message">{toast.message}</p>
      </div>
      <button
        className="toast__close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        data-testid="toast-close-button"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// ============================================================================
// Icon Components
// ============================================================================

interface ToastIconProps {
  variant: ToastVariant;
}

function ToastIcon({ variant }: ToastIconProps) {
  switch (variant) {
    case 'success':
      return <SuccessIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
    default:
      return <InfoIcon />;
  }
}

function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="toast__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="toast__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="toast__svg-icon"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="toast__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="toast__svg-icon toast__svg-icon--close"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default ToastContainer;
