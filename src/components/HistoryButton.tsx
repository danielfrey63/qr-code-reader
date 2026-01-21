/**
 * History Button Component
 *
 * A button that opens the scan history modal.
 * Displays a badge with the count of history entries when there are any.
 */

import { useScanHistory } from '../hooks/useScanHistory';
import './HistoryButton.css';

// ============================================================================
// Icons
// ============================================================================

/**
 * Clock/History icon
 */
function HistoryIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

// ============================================================================
// Component
// ============================================================================

export interface HistoryButtonProps {
  /** Callback when button is clicked */
  onClick: () => void;
  /** Additional CSS class name */
  className?: string;
}

/**
 * History Button Component
 *
 * Renders a button that opens the history modal.
 * Shows a badge with the count when there are history entries.
 */
export function HistoryButton({ onClick, className = '' }: HistoryButtonProps) {
  const { count } = useScanHistory();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`history-button ${className}`}
      aria-label={`View scan history${count > 0 ? ` (${count} items)` : ''}`}
      data-testid="history-button"
    >
      <HistoryIcon />
      {count > 0 && (
        <span className="history-button__badge" data-testid="history-badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default HistoryButton;
