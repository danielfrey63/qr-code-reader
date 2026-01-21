/**
 * Unified workflow status types for consistent state management across the application.
 *
 * This file provides standardized status types to ensure consistency between
 * different components that manage similar state transitions (camera, scanner, etc.)
 *
 * Terminology conventions:
 * - "Status" is used consistently (not "State") for workflow progression
 * - "active" represents the actively running state (previously "streaming" or "scanning")
 * - All status types follow the same base pattern: idle -> initializing -> active -> error
 */

/**
 * Base workflow status values that are common across all components.
 * These represent the fundamental states a workflow can be in.
 */
export type BaseWorkflowStatus = 'idle' | 'initializing' | 'active' | 'error';

/**
 * Camera-specific workflow status.
 * Uses the base workflow status values for camera operations.
 *
 * - 'idle': Camera is not active, ready to start
 * - 'initializing': Camera is starting up, requesting permissions
 * - 'active': Camera is streaming video (previously 'streaming')
 * - 'error': An error occurred with the camera
 */
export type CameraWorkflowStatus = BaseWorkflowStatus;

/**
 * Scanner-specific workflow status.
 * Extends base workflow status with scanner-specific states.
 *
 * - 'idle': Scanner is not active, ready to start
 * - 'initializing': Scanner is starting up
 * - 'active': Scanner is actively scanning for QR codes (previously 'scanning')
 * - 'stopped': Scanner has been explicitly stopped
 * - 'error': An error occurred with the scanner
 */
export type ScannerWorkflowStatus = BaseWorkflowStatus | 'stopped';

/**
 * Type guard to check if a status is a valid BaseWorkflowStatus
 */
export function isBaseWorkflowStatus(status: string): status is BaseWorkflowStatus {
  return ['idle', 'initializing', 'active', 'error'].includes(status);
}

/**
 * Type guard to check if a status is a valid ScannerWorkflowStatus
 */
export function isScannerWorkflowStatus(status: string): status is ScannerWorkflowStatus {
  return ['idle', 'initializing', 'active', 'stopped', 'error'].includes(status);
}

/**
 * Human-readable labels for workflow statuses.
 * Use these for UI display to ensure consistent messaging.
 */
export const WORKFLOW_STATUS_LABELS: Record<ScannerWorkflowStatus, string> = {
  idle: 'Ready',
  initializing: 'Starting...',
  active: 'Active',
  stopped: 'Stopped',
  error: 'Error',
};

/**
 * Get a human-readable label for a workflow status
 */
export function getWorkflowStatusLabel(status: ScannerWorkflowStatus): string {
  return WORKFLOW_STATUS_LABELS[status] ?? 'Unknown';
}
