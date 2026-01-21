import { Component, ErrorInfo, ReactNode } from 'react';
import type { SpecificAppError, ErrorFallbackProps } from '../types/errors';
import { normalizeError } from '../utils/errorFactory';
import { ErrorFallback } from './ErrorFallback';
import './ErrorBoundary.css';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component */
  FallbackComponent?: React.ComponentType<ErrorFallbackProps>;
  /** Callback when error is caught */
  onError?: (error: Error, appError: SpecificAppError, errorInfo: ErrorInfo) => void;
  /** Callback when error is reset */
  onReset?: () => void;
  /** Keys that will trigger a reset when they change */
  resetKeys?: unknown[];
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  appError: SpecificAppError | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors in child component tree
 * and displays a fallback UI with user-friendly error messages and recovery options.
 *
 * Features:
 * - Catches render errors, lifecycle errors, and errors in constructors
 * - Converts errors to standardized AppError format with recovery actions
 * - Provides a user-friendly fallback UI with retry options
 * - Supports custom fallback components
 * - Auto-reset when specified keys change
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, appError) => logError(appError)}
 *   onReset={() => clearState()}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      appError: null,
    };
  }

  /**
   * Static method to derive state from error
   * Called during the "render" phase when an error is thrown
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const appError = normalizeError(error, {
      source: 'ErrorBoundary',
      errorName: error.name,
    });

    return {
      hasError: true,
      error,
      appError,
    };
  }

  /**
   * Lifecycle method called after an error is caught
   * Used for side effects like logging
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props;
    const { appError } = this.state;

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // Call onError callback if provided
    if (onError && appError) {
      onError(error, appError, errorInfo);
    }
  }

  /**
   * Check if resetKeys have changed and reset error state
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = (): void => {
    const { onReset } = this.props;

    this.setState({
      hasError: false,
      error: null,
      appError: null,
    });

    onReset?.();
  };

  render(): ReactNode {
    const { hasError, error, appError } = this.state;
    const { children, FallbackComponent } = this.props;

    if (hasError && error) {
      const FallbackToRender = FallbackComponent || ErrorFallback;

      return (
        <div className="error-boundary" data-testid="error-boundary">
          <FallbackToRender
            error={error}
            appError={appError || undefined}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
