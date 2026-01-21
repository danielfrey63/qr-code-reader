/**
 * Camera permission states
 */
export type CameraPermissionState = 'prompt' | 'granted' | 'denied';

/**
 * Camera permission status with detailed information
 */
export interface CameraPermissionStatus {
  state: CameraPermissionState;
  isSupported: boolean;
  isSecureContext: boolean;
  error?: CameraError;
}

/**
 * Camera error types for better error handling
 */
export type CameraErrorType =
  | 'NOT_SUPPORTED'
  | 'NOT_SECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_DISMISSED'
  | 'NO_DEVICES_FOUND'
  | 'DEVICE_IN_USE'
  | 'OVERCONSTRAINED'
  | 'UNKNOWN';

/**
 * Camera error with type and message
 */
export interface CameraError {
  type: CameraErrorType;
  message: string;
  originalError?: Error;
}

/**
 * Camera device information
 */
export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
  facingMode?: 'user' | 'environment';
}

/**
 * Camera stream configuration
 */
export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  deviceId?: string;
  width?: number;
  height?: number;
}

/**
 * Camera stream result
 */
export interface CameraStreamResult {
  stream: MediaStream | null;
  error?: CameraError;
}
