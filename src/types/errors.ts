/**
 * Application-wide error types and interfaces for comprehensive error handling
 */

/**
 * Application error categories for classification
 */
export type AppErrorCategory =
  | 'CAMERA'
  | 'PERMISSION'
  | 'SCANNER'
  | 'NETWORK'
  | 'STORAGE'
  | 'UNKNOWN';

/**
 * Camera-specific error types
 */
export type CameraFailureType =
  | 'HARDWARE_NOT_FOUND'
  | 'HARDWARE_IN_USE'
  | 'HARDWARE_FAILURE'
  | 'STREAM_ERROR'
  | 'INITIALIZATION_FAILED';

/**
 * Permission-specific error types
 */
export type PermissionFailureType =
  | 'DENIED_BY_USER'
  | 'DENIED_BY_SYSTEM'
  | 'DISMISSED'
  | 'BLOCKED'
  | 'EXPIRED';

/**
 * Scanner-specific error types
 */
export type ScannerFailureType =
  | 'INITIALIZATION_FAILED'
  | 'DECODE_ERROR'
  | 'CAMERA_SWITCH_FAILED'
  | 'UNSUPPORTED_FORMAT'
  | 'PROCESSING_ERROR';

/**
 * Recovery action types that users can take
 */
export type RecoveryActionType =
  | 'RETRY'
  | 'REQUEST_PERMISSION'
  | 'OPEN_SETTINGS'
  | 'REFRESH_PAGE'
  | 'CHECK_CONNECTION'
  | 'SWITCH_CAMERA'
  | 'CONTACT_SUPPORT'
  | 'NONE';

/**
 * Recovery action with display information
 */
export interface RecoveryAction {
  type: RecoveryActionType;
  label: string;
  description?: string;
  isPrimary?: boolean;
}

/**
 * Base application error interface
 */
export interface AppError {
  id: string;
  category: AppErrorCategory;
  code: string;
  message: string;
  userMessage: string;
  recoveryActions: RecoveryAction[];
  timestamp: number;
  originalError?: Error | string;
  context?: Record<string, unknown>;
}

/**
 * Camera failure error
 */
export interface CameraFailureError extends AppError {
  category: 'CAMERA';
  failureType: CameraFailureType;
  deviceId?: string;
}

/**
 * Permission denial error
 */
export interface PermissionDenialError extends AppError {
  category: 'PERMISSION';
  failureType: PermissionFailureType;
  permissionType: 'camera' | 'microphone' | 'location';
}

/**
 * Scanner error
 */
export interface ScanError extends AppError {
  category: 'SCANNER';
  failureType: ScannerFailureType;
  scannerState?: string;
}

/**
 * Union type for all specific error types
 */
export type SpecificAppError = CameraFailureError | PermissionDenialError | ScanError | AppError;

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error with severity information
 */
export interface ErrorWithSeverity extends AppError {
  severity: ErrorSeverity;
}

/**
 * Error handler callback type
 */
export type ErrorHandler = (error: SpecificAppError) => void;

/**
 * Error recovery callback type
 */
export type RecoveryHandler = (action: RecoveryAction, error: SpecificAppError) => Promise<boolean>;

/**
 * Error boundary fallback props
 */
export interface ErrorFallbackProps {
  error: Error;
  appError?: SpecificAppError;
  resetErrorBoundary: () => void;
}

/**
 * Error context state
 */
export interface ErrorContextState {
  errors: SpecificAppError[];
  lastError: SpecificAppError | null;
  addError: (error: SpecificAppError) => void;
  clearError: (errorId: string) => void;
  clearAllErrors: () => void;
  handleRecovery: RecoveryHandler;
}
