/**
 * Scan History Hook
 *
 * This hook provides access to the centralized scan history state from ScanHistoryContext.
 * It's a simple wrapper around useScanHistoryContext for backward compatibility.
 *
 * Features:
 * - Stores up to MAX_HISTORY_ENTRIES (20) scan results
 * - FIFO queue: oldest entries are automatically removed when limit is reached
 * - Persists history to localStorage
 * - Stores timestamp, content (text), format, and optional metadata
 * - **All components share the same state** - updates propagate instantly
 *
 * @example
 * ```tsx
 * function ScannerComponent() {
 *   const {
 *     entries,
 *     count,
 *     addScan,
 *     removeScan,
 *     clearHistory,
 *   } = useScanHistory();
 *
 *   const handleScan = (result: QRScanResult) => {
 *     addScan(result, { deviceId: 'camera-1', facingMode: 'environment' });
 *   };
 *
 *   return (
 *     <div>
 *       <p>History: {count} scans</p>
 *       <ul>
 *         {entries.map(entry => (
 *           <li key={entry.id}>
 *             {entry.text} - {new Date(entry.timestamp).toLocaleString()}
 *             <button onClick={() => removeScan(entry.id)}>Remove</button>
 *           </li>
 *         ))}
 *       </ul>
 *       <button onClick={clearHistory}>Clear History</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useScanHistoryContext } from '../contexts/ScanHistoryContext';
import type { UseScanHistoryReturn } from '../types/history';

/**
 * React hook for managing QR code scan history
 *
 * This hook uses the ScanHistoryContext to ensure all components
 * share the same state. When one component modifies the history,
 * all other components immediately see the updated state.
 *
 * @returns Object containing history entries, count, and mutation functions
 */
export function useScanHistory(): UseScanHistoryReturn {
  return useScanHistoryContext();
}

export default useScanHistory;
