/**
 * Scan History Context Provider
 *
 * Provides centralized scan history state management to solve the synchronization
 * issue where multiple components using useScanHistory() had independent state.
 *
 * This context ensures all components share the same history state, so when
 * history is modified (add, remove, clear) in one component, all other
 * components immediately see the updated state.
 */

import { createContext, useContext, useCallback, useState, useEffect, useRef, type ReactNode } from 'react';
import type { QRScanResult } from '../types/scanner';
import {
  type ScanHistoryEntry,
  type ScanHistory,
  type ScanMetadata,
  type UseScanHistoryReturn,
  MAX_HISTORY_ENTRIES,
  SCAN_HISTORY_KEY,
} from '../types/history';
import { getItemWithDefault, setItem } from '../utils/localStorage';

// ============================================================================
// Constants
// ============================================================================

/**
 * Current version of the history schema
 * Increment this when making breaking changes to the data structure
 */
const HISTORY_VERSION = 1;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for a scan entry
 * Uses timestamp + random string for uniqueness
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the default empty history
 */
function getDefaultHistory(): ScanHistory {
  return {
    version: HISTORY_VERSION,
    entries: [],
  };
}

/**
 * Load scan history from localStorage
 */
function loadHistory(): ScanHistory {
  const history = getItemWithDefault<ScanHistory>(SCAN_HISTORY_KEY, getDefaultHistory());

  // Handle version migrations if needed in the future
  if (history.version !== HISTORY_VERSION) {
    // For now, just update the version
    // Future migrations can be added here
    return {
      ...history,
      version: HISTORY_VERSION,
    };
  }

  return history;
}

/**
 * Save scan history to localStorage
 */
function saveHistory(history: ScanHistory): void {
  setItem(SCAN_HISTORY_KEY, history);
}

// ============================================================================
// Context
// ============================================================================

const ScanHistoryContext = createContext<UseScanHistoryReturn | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface ScanHistoryProviderProps {
  children: ReactNode;
}

/**
 * Scan History Provider Component
 *
 * Wraps the application to provide centralized scan history state.
 * All components using useScanHistory() will share this same state instance,
 * ensuring synchronization across the app.
 *
 * @example
 * ```tsx
 * <ScanHistoryProvider>
 *   <App />
 * </ScanHistoryProvider>
 * ```
 */
export function ScanHistoryProvider({ children }: ScanHistoryProviderProps) {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Load history from localStorage on mount
  useEffect(() => {
    const history = loadHistory();
    if (isMountedRef.current) {
      setEntries(history.entries);
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Add a new scan to history
   * Implements FIFO: if at max capacity, removes oldest entry
   */
  const addScan = useCallback((result: QRScanResult, metadata?: ScanMetadata) => {
    setEntries((currentEntries) => {
      // Create new entry
      const newEntry: ScanHistoryEntry = {
        id: generateId(),
        text: result.text,
        format: result.format,
        timestamp: result.timestamp,
        metadata,
      };

      // Add to beginning of array (most recent first)
      let updatedEntries = [newEntry, ...currentEntries];

      // FIFO: Remove oldest entries if exceeding max
      if (updatedEntries.length > MAX_HISTORY_ENTRIES) {
        updatedEntries = updatedEntries.slice(0, MAX_HISTORY_ENTRIES);
      }

      // Save to localStorage
      const history: ScanHistory = {
        version: HISTORY_VERSION,
        entries: updatedEntries,
      };
      saveHistory(history);

      return updatedEntries;
    });
  }, []);

  /**
   * Remove a specific scan by ID
   */
  const removeScan = useCallback((id: string) => {
    setEntries((currentEntries) => {
      const updatedEntries = currentEntries.filter((entry) => entry.id !== id);

      // Save to localStorage
      const history: ScanHistory = {
        version: HISTORY_VERSION,
        entries: updatedEntries,
      };
      saveHistory(history);

      return updatedEntries;
    });
  }, []);

  /**
   * Clear all scan history
   */
  const clearHistory = useCallback(() => {
    setEntries([]);

    // Save empty history to localStorage
    const history: ScanHistory = {
      version: HISTORY_VERSION,
      entries: [],
    };
    saveHistory(history);
  }, []);

  /**
   * Get a specific scan by ID
   */
  const getScan = useCallback(
    (id: string): ScanHistoryEntry | undefined => {
      return entries.find((entry) => entry.id === id);
    },
    [entries]
  );

  const value: UseScanHistoryReturn = {
    entries,
    isLoading,
    count: entries.length,
    addScan,
    removeScan,
    clearHistory,
    getScan,
  };

  return <ScanHistoryContext.Provider value={value}>{children}</ScanHistoryContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access scan history context
 *
 * @returns Scan history context value with state and actions
 * @throws Error if used outside of ScanHistoryProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { entries, count, addScan, removeScan, clearHistory } = useScanHistoryContext();
 *
 *   return (
 *     <div>
 *       <p>History: {count} scans</p>
 *       <ul>
 *         {entries.map(entry => (
 *           <li key={entry.id}>
 *             {entry.text}
 *             <button onClick={() => removeScan(entry.id)}>Remove</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
export function useScanHistoryContext(): UseScanHistoryReturn {
  const context = useContext(ScanHistoryContext);

  if (context === null) {
    throw new Error('useScanHistoryContext must be used within a ScanHistoryProvider');
  }

  return context;
}

export { ScanHistoryContext };
