import type { ErrorFallbackProps, RecoveryAction, SpecificAppError } from '../types/errors';
import './ErrorFallback.css';

/**
 * ErrorFallback component displays user-friendly error messages
 * with recovery actions for various error types.
 *
 * Features:
 * - Category-specific icons (camera, permission, scanner)
 * - User-friendly error messages
 * - Recovery action buttons
 * - Dark mode support
 */
export function ErrorFallback({
  error,
  appError,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const handleRecoveryAction = (action: RecoveryAction) => {
    switch (action.type) {
      case 'RETRY':
        resetErrorBoundary();
        break;
      case 'REFRESH_PAGE':
        window.location.reload();
        break;
      case 'OPEN_SETTINGS':
        // Try to provide guidance for opening settings
        // This varies by browser, so we show instructions
        alert('To update permissions:\n\n1. Click the lock/info icon in your browser\'s address bar\n2. Find "Camera" in the permissions list\n3. Change it to "Allow"\n4. Refresh this page');
        break;
      case 'REQUEST_PERMISSION':
        resetErrorBoundary();
        break;
      case 'SWITCH_CAMERA':
        resetErrorBoundary();
        break;
      default:
        resetErrorBoundary();
    }
  };

  // Determine icon and title based on error category
  const getErrorDisplay = () => {
    if (!appError) {
      return {
        icon: <UnknownErrorIcon />,
        title: 'Something Went Wrong',
        category: 'unknown',
      };
    }

    switch (appError.category) {
      case 'CAMERA':
        return {
          icon: <CameraErrorIcon />,
          title: 'Camera Error',
          category: 'camera',
        };
      case 'PERMISSION':
        return {
          icon: <PermissionErrorIcon />,
          title: 'Permission Required',
          category: 'permission',
        };
      case 'SCANNER':
        return {
          icon: <ScannerErrorIcon />,
          title: 'Scanner Error',
          category: 'scanner',
        };
      default:
        return {
          icon: <UnknownErrorIcon />,
          title: 'Something Went Wrong',
          category: 'unknown',
        };
    }
  };

  const { icon, title, category } = getErrorDisplay();
  const userMessage = appError?.userMessage || error.message || 'An unexpected error occurred. Please try again.';
  const recoveryActions = appError?.recoveryActions || [
    { type: 'RETRY' as const, label: 'Try Again', isPrimary: true },
  ];

  return (
    <div
      className={`error-fallback error-fallback--${category}`}
      data-testid="error-fallback"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-fallback__icon" data-testid="error-icon">
        {icon}
      </div>

      <h2 className="error-fallback__title">{title}</h2>

      <p className="error-fallback__message" data-testid="error-message">
        {userMessage}
      </p>

      {/* Recovery actions */}
      <div className="error-fallback__actions">
        {recoveryActions.map((action, index) => (
          <button
            key={`${action.type}-${index}`}
            className={`error-fallback__button ${
              action.isPrimary ? 'error-fallback__button--primary' : 'error-fallback__button--secondary'
            }`}
            onClick={() => handleRecoveryAction(action)}
            data-testid={`recovery-action-${action.type.toLowerCase()}`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Technical details (collapsible) */}
      <details className="error-fallback__details">
        <summary className="error-fallback__details-summary">
          Technical Details
        </summary>
        <div className="error-fallback__details-content">
          <p><strong>Error:</strong> {error.name}</p>
          <p><strong>Message:</strong> {error.message}</p>
          {appError && (
            <>
              <p><strong>Code:</strong> {appError.code}</p>
              <p><strong>Category:</strong> {appError.category}</p>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

/**
 * Specialized error display component for inline errors (non-boundary)
 */
export function InlineErrorDisplay({
  error,
  onRetry,
  onDismiss,
}: {
  error: SpecificAppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="inline-error"
      role="alert"
      aria-live="polite"
      data-testid="inline-error"
    >
      <div className="inline-error__content">
        <span className="inline-error__icon">
          <WarningIcon />
        </span>
        <p className="inline-error__message">{error.userMessage}</p>
      </div>

      <div className="inline-error__actions">
        {onRetry && (
          <button
            className="inline-error__button inline-error__button--retry"
            onClick={onRetry}
            data-testid="inline-retry-button"
          >
            Try Again
          </button>
        )}
        {onDismiss && (
          <button
            className="inline-error__button inline-error__button--dismiss"
            onClick={onDismiss}
            aria-label="Dismiss error"
            data-testid="inline-dismiss-button"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// Icon components

function CameraErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
  );
}

function PermissionErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <line x1="12" y1="15" x2="12" y2="17" />
    </svg>
  );
}

function ScannerErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function UnknownErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default ErrorFallback;
