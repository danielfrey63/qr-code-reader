/**
 * QR scanner types and interfaces
 */

import type { ScannerWorkflowStatus } from './workflow';

/**
 * Result of a successful QR code scan
 */
export interface QRScanResult {
  /** The decoded text content of the QR code */
  text: string;
  /** Format of the scanned code (e.g., QR_CODE, AZTEC, etc.) */
  format: string;
  /** Timestamp of when the scan occurred */
  timestamp: number;
}

/**
 * QR scanner error types
 */
export type QRScannerErrorType =
  | 'CAMERA_NOT_STARTED'
  | 'SCANNER_INITIALIZATION_FAILED'
  | 'SCANNER_START_FAILED'
  | 'SCANNER_STOP_FAILED'
  | 'NO_CAMERA_AVAILABLE'
  | 'UNKNOWN';

/**
 * QR scanner error
 */
export interface QRScannerError {
  type: QRScannerErrorType;
  message: string;
  originalError?: Error | string;
}

/**
 * QR scanner status
 * Uses the standardized ScannerWorkflowStatus from workflow.ts for consistency.
 * - 'idle': Scanner is not active, ready to start
 * - 'initializing': Scanner is starting up
 * - 'active': Scanner is actively scanning for QR codes (previously 'scanning')
 * - 'stopped': Scanner has been explicitly stopped
 * - 'error': An error occurred with the scanner
 */
export type QRScannerStatus = ScannerWorkflowStatus;

/**
 * QR scanner configuration
 */
export interface QRScannerConfig {
  /** Frames per second for scanning (default: 10) */
  fps?: number;
  /** Width of the scanning box in pixels (default: 250) */
  qrboxWidth?: number;
  /** Height of the scanning box in pixels (default: 250) */
  qrboxHeight?: number;
  /** Aspect ratio for scanning (default: 1.777778 for 16:9) */
  aspectRatio?: number;
  /** Whether to disable flip (for back camera) */
  disableFlip?: boolean;
  /** Preferred camera facing mode */
  facingMode?: 'user' | 'environment';
  /** Specific device ID to use (overrides facingMode if provided) */
  deviceId?: string;
}

/**
 * Default scanner configuration
 * Note: deviceId is intentionally undefined as it's optional and device-specific
 */
export const DEFAULT_SCANNER_CONFIG: Omit<Required<QRScannerConfig>, 'deviceId'> & { deviceId?: string } = {
  fps: 10,
  qrboxWidth: 250,
  qrboxHeight: 250,
  aspectRatio: 1.777778,
  disableFlip: false,
  facingMode: 'environment',
  deviceId: undefined,
};
