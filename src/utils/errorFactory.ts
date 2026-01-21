/**
 * Error factory utilities for creating standardized application errors
 * with user-friendly messages and recovery actions
 */

import type {
  AppError,
  CameraFailureError,
  PermissionDenialError,
  ScanError,
  RecoveryAction,
  CameraFailureType,
  PermissionFailureType,
  ScannerFailureType,
  SpecificAppError,
} from '../types/errors';
import type { CameraError, CameraErrorType } from '../types/camera';
import type { QRScannerError, QRScannerErrorType } from '../types/scanner';

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a base app error
 */
export function createAppError(
  category: AppError['category'],
  code: string,
  message: string,
  userMessage: string,
  recoveryActions: RecoveryAction[],
  originalError?: Error | string,
  context?: Record<string, unknown>
): AppError {
  return {
    id: generateErrorId(),
    category,
    code,
    message,
    userMessage,
    recoveryActions,
    timestamp: Date.now(),
    originalError,
    context,
  };
}

/**
 * Recovery actions for camera failures
 */
const CAMERA_RECOVERY_ACTIONS: Record<CameraFailureType, RecoveryAction[]> = {
  HARDWARE_NOT_FOUND: [
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh the page to detect cameras',
      isPrimary: true,
    },
    {
      type: 'CONTACT_SUPPORT',
      label: 'Get Help',
      description: 'Contact support for assistance',
    },
  ],
  HARDWARE_IN_USE: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Close other apps using the camera and try again',
      isPrimary: true,
    },
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh to release the camera',
    },
  ],
  HARDWARE_FAILURE: [
    {
      type: 'SWITCH_CAMERA',
      label: 'Switch Camera',
      description: 'Try using a different camera',
      isPrimary: true,
    },
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh the page to reinitialize',
    },
  ],
  STREAM_ERROR: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Restart the camera stream',
      isPrimary: true,
    },
  ],
  INITIALIZATION_FAILED: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Attempt to initialize the camera again',
      isPrimary: true,
    },
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh the page to start fresh',
    },
  ],
  INSECURE_CONTEXT: [
    {
      type: 'CONTACT_SUPPORT',
      label: 'Contact Support',
      description: 'Request help to resolve the HTTPS configuration issue',
      isPrimary: true,
    },
    {
      type: 'NONE',
      label: 'Use HTTPS',
      description: 'Access this site using a secure HTTPS connection',
    },
  ],
};

/**
 * Recovery actions for permission denials
 */
const PERMISSION_RECOVERY_ACTIONS: Record<PermissionFailureType, RecoveryAction[]> = {
  DENIED_BY_USER: [
    {
      type: 'REQUEST_PERMISSION',
      label: 'Request Permission',
      description: 'Request camera permission again',
      isPrimary: true,
    },
    {
      type: 'OPEN_SETTINGS',
      label: 'Open Settings',
      description: 'Update permissions in browser settings',
    },
  ],
  DENIED_BY_SYSTEM: [
    {
      type: 'OPEN_SETTINGS',
      label: 'Open Settings',
      description: 'Enable camera access in your device settings',
      isPrimary: true,
    },
  ],
  DISMISSED: [
    {
      type: 'REQUEST_PERMISSION',
      label: 'Request Permission',
      description: 'Request camera permission',
      isPrimary: true,
    },
  ],
  BLOCKED: [
    {
      type: 'OPEN_SETTINGS',
      label: 'Open Browser Settings',
      description: 'Unblock camera access in browser settings',
      isPrimary: true,
    },
  ],
  EXPIRED: [
    {
      type: 'REQUEST_PERMISSION',
      label: 'Grant Permission Again',
      description: 'Your permission has expired, please grant it again',
      isPrimary: true,
    },
  ],
};

/**
 * Recovery actions for scanner errors
 */
const SCANNER_RECOVERY_ACTIONS: Record<ScannerFailureType, RecoveryAction[]> = {
  INITIALIZATION_FAILED: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Restart the QR scanner',
      isPrimary: true,
    },
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh the page to reinitialize',
    },
  ],
  DECODE_ERROR: [
    {
      type: 'RETRY',
      label: 'Scan Again',
      description: 'Try scanning the QR code again',
      isPrimary: true,
    },
  ],
  CAMERA_SWITCH_FAILED: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Attempt to switch camera again',
      isPrimary: true,
    },
    {
      type: 'REFRESH_PAGE',
      label: 'Refresh Page',
      description: 'Refresh to reset camera selection',
    },
  ],
  UNSUPPORTED_FORMAT: [
    {
      type: 'NONE',
      label: 'Unsupported Format',
      description: 'This QR code format is not supported',
    },
  ],
  PROCESSING_ERROR: [
    {
      type: 'RETRY',
      label: 'Try Again',
      description: 'Retry scanning the QR code',
      isPrimary: true,
    },
  ],
};

/**
 * User-friendly messages for camera failures
 */
const CAMERA_USER_MESSAGES: Record<CameraFailureType, string> = {
  HARDWARE_NOT_FOUND: 'No camera was found on your device. Please ensure a camera is connected and try again.',
  HARDWARE_IN_USE: 'Your camera is currently being used by another application. Please close other apps and try again.',
  HARDWARE_FAILURE: 'There was a problem accessing your camera. Please try using a different camera or restart your device.',
  STREAM_ERROR: 'The camera stream was interrupted. Please try starting the camera again.',
  INITIALIZATION_FAILED: 'We couldn\'t start the camera. Please make sure your camera is working and try again.',
  INSECURE_CONTEXT: 'Camera access requires a secure connection (HTTPS). Please access this site using HTTPS or contact the site administrator.',
};

/**
 * User-friendly messages for permission denials
 */
const PERMISSION_USER_MESSAGES: Record<PermissionFailureType, string> = {
  DENIED_BY_USER: 'Camera access was denied. To scan QR codes, please allow camera access when prompted.',
  DENIED_BY_SYSTEM: 'Camera access is blocked by your system settings. Please enable camera access in your device settings.',
  DISMISSED: 'The permission request was dismissed. Please grant camera access to continue.',
  BLOCKED: 'Camera access has been blocked. Please update your browser settings to allow camera access for this site.',
  EXPIRED: 'Your camera permission has expired. Please grant permission again to continue scanning.',
};

/**
 * User-friendly messages for scanner errors
 */
const SCANNER_USER_MESSAGES: Record<ScannerFailureType, string> = {
  INITIALIZATION_FAILED: 'The QR scanner couldn\'t start. Please try again or refresh the page.',
  DECODE_ERROR: 'We had trouble reading that QR code. Please make sure the code is clearly visible and try again.',
  CAMERA_SWITCH_FAILED: 'We couldn\'t switch to the other camera. Please try again.',
  UNSUPPORTED_FORMAT: 'This type of barcode is not supported. Please scan a standard QR code.',
  PROCESSING_ERROR: 'An error occurred while processing the scan. Please try again.',
};

/**
 * Create a camera failure error
 */
export function createCameraFailureError(
  failureType: CameraFailureType,
  originalError?: Error | string,
  deviceId?: string
): CameraFailureError {
  return {
    id: generateErrorId(),
    category: 'CAMERA',
    code: `CAMERA_${failureType}`,
    message: `Camera failure: ${failureType}`,
    userMessage: CAMERA_USER_MESSAGES[failureType],
    recoveryActions: CAMERA_RECOVERY_ACTIONS[failureType],
    failureType,
    deviceId,
    timestamp: Date.now(),
    originalError,
  };
}

/**
 * Create a permission denial error
 */
export function createPermissionDenialError(
  failureType: PermissionFailureType,
  permissionType: 'camera' | 'microphone' | 'location' = 'camera',
  originalError?: Error | string
): PermissionDenialError {
  return {
    id: generateErrorId(),
    category: 'PERMISSION',
    code: `PERMISSION_${failureType}`,
    message: `Permission failure: ${failureType}`,
    userMessage: PERMISSION_USER_MESSAGES[failureType],
    recoveryActions: PERMISSION_RECOVERY_ACTIONS[failureType],
    failureType,
    permissionType,
    timestamp: Date.now(),
    originalError,
  };
}

/**
 * Create a scanner error
 */
export function createScanError(
  failureType: ScannerFailureType,
  originalError?: Error | string,
  scannerState?: string
): ScanError {
  return {
    id: generateErrorId(),
    category: 'SCANNER',
    code: `SCANNER_${failureType}`,
    message: `Scanner error: ${failureType}`,
  userMessage: SCANNER_USER_MESSAGES[failureType],
    recoveryActions: SCANNER_RECOVERY_ACTIONS[failureType],
    failureType,
    scannerState,
    timestamp: Date.now(),
    originalError,
  };
}

/**
 * Map CameraError to CameraFailureError
 */
export function mapCameraErrorToAppError(error: CameraError): CameraFailureError | PermissionDenialError {
  const typeMapping: Record<CameraErrorType, { category: 'CAMERA' | 'PERMISSION'; type: CameraFailureType | PermissionFailureType }> = {
    'NOT_SUPPORTED': { category: 'CAMERA', type: 'HARDWARE_NOT_FOUND' },
    'NOT_SECURE_CONTEXT': { category: 'CAMERA', type: 'INSECURE_CONTEXT' },
    'PERMISSION_DENIED': { category: 'PERMISSION', type: 'DENIED_BY_USER' },
    'PERMISSION_DISMISSED': { category: 'PERMISSION', type: 'DISMISSED' },
    'NO_DEVICES_FOUND': { category: 'CAMERA', type: 'HARDWARE_NOT_FOUND' },
    'DEVICE_IN_USE': { category: 'CAMERA', type: 'HARDWARE_IN_USE' },
    'OVERCONSTRAINED': { category: 'CAMERA', type: 'HARDWARE_FAILURE' },
    'UNKNOWN': { category: 'CAMERA', type: 'HARDWARE_FAILURE' },
  };

  const mapping = typeMapping[error.type];

  if (mapping.category === 'PERMISSION') {
    return createPermissionDenialError(
      mapping.type as PermissionFailureType,
      'camera',
      error.originalError
    );
  }

  return createCameraFailureError(
    mapping.type as CameraFailureType,
    error.originalError
  );
}

/**
 * Map QRScannerError to ScanError
 */
export function mapScannerErrorToAppError(error: QRScannerError, scannerState?: string): ScanError {
  const typeMapping: Record<QRScannerErrorType, ScannerFailureType> = {
    'CAMERA_NOT_STARTED': 'INITIALIZATION_FAILED',
    'SCANNER_INITIALIZATION_FAILED': 'INITIALIZATION_FAILED',
    'SCANNER_START_FAILED': 'INITIALIZATION_FAILED',
    'SCANNER_STOP_FAILED': 'PROCESSING_ERROR',
    'NO_CAMERA_AVAILABLE': 'INITIALIZATION_FAILED',
    'UNKNOWN': 'PROCESSING_ERROR',
  };

  const failureType = typeMapping[error.type];
  const originalError = error.originalError instanceof Error
    ? error.originalError
    : typeof error.originalError === 'string'
      ? error.originalError
      : undefined;

  return createScanError(failureType, originalError, scannerState);
}

/**
 * Create a generic unknown error
 */
export function createUnknownError(originalError?: Error | string, context?: Record<string, unknown>): AppError {
  return createAppError(
    'UNKNOWN',
    'UNKNOWN_ERROR',
    'An unknown error occurred',
    'Something went wrong. Please try again or refresh the page.',
    [
      {
        type: 'RETRY',
        label: 'Try Again',
        description: 'Attempt the action again',
        isPrimary: true,
      },
      {
        type: 'REFRESH_PAGE',
        label: 'Refresh Page',
        description: 'Refresh the page to start fresh',
      },
    ],
    originalError,
    context
  );
}

/**
 * Convert any error to a SpecificAppError
 */
export function normalizeError(error: unknown, context?: Record<string, unknown>): SpecificAppError {
  if (error && typeof error === 'object' && 'category' in error && 'code' in error) {
    return error as SpecificAppError;
  }

  if (error instanceof Error) {
    return createUnknownError(error, context);
  }

  if (typeof error === 'string') {
    return createUnknownError(error, context);
  }

  return createUnknownError(String(error), context);
}
