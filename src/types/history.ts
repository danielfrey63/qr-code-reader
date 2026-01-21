/**
 * Scan history types and interfaces
 */

import type { QRScanResult } from './scanner';

/**
 * Maximum number of entries to keep in scan history (FIFO queue)
 */
export const MAX_HISTORY_ENTRIES = 20;

/**
 * localStorage key for scan history
 */
export const SCAN_HISTORY_KEY = 'qr-scanner-history';

/**
 * Additional metadata captured during a scan
 */
export interface ScanMetadata {
  /** Device ID used for the scan */
  deviceId?: string;
  /** Camera facing mode used */
  facingMode?: 'user' | 'environment';
  /** Optional user-added notes */
  notes?: string;
}

/**
 * A single entry in the scan history
 * Extends QRScanResult with a unique ID and optional metadata
 */
export interface ScanHistoryEntry extends QRScanResult {
  /** Unique identifier for this scan entry */
  id: string;
  /** Additional metadata about the scan */
  metadata?: ScanMetadata;
}

/**
 * The complete scan history stored in localStorage
 */
export interface ScanHistory {
  /** Version for future migrations */
  version: number;
  /** Array of scan history entries (most recent first) */
  entries: ScanHistoryEntry[];
}

/**
 * State returned by the useScanHistory hook
 */
export interface ScanHistoryState {
  /** Array of scan history entries */
  entries: ScanHistoryEntry[];
  /** Whether the history is currently loading from storage */
  isLoading: boolean;
  /** Number of entries in history */
  count: number;
}

/**
 * Actions provided by the useScanHistory hook
 */
export interface ScanHistoryActions {
  /** Add a new scan to history */
  addScan: (result: QRScanResult, metadata?: ScanMetadata) => void;
  /** Remove a specific scan by ID */
  removeScan: (id: string) => void;
  /** Clear all scan history */
  clearHistory: () => void;
  /** Get a specific scan by ID */
  getScan: (id: string) => ScanHistoryEntry | undefined;
}

/**
 * Combined return type for useScanHistory hook
 */
export type UseScanHistoryReturn = ScanHistoryState & ScanHistoryActions;
