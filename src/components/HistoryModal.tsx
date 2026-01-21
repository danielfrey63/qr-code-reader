import { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { useScanHistory } from '../hooks/useScanHistory';
import type { ScanHistoryEntry } from '../types/history';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from '../contexts/ToastContext';
import './HistoryModal.css';

interface HistoryModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Modal component that displays scan history with individual copy buttons
 * and clear all functionality.
 */
export function HistoryModal({ visible, onClose }: HistoryModalProps) {
  const { entries, clearHistory, removeScan } = useScanHistory();
  const { success, error, warning } = useToast();
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Handle escape key to dismiss modal
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose, showClearConfirm]);

  const handleCopy = useCallback(async (entry: ScanHistoryEntry) => {
    setCopyingId(entry.id);
    const copySuccess = await copyToClipboard(entry.text);

    if (copySuccess) {
      success('Copied to clipboard!');
    } else {
      error('Failed to copy to clipboard. Please try again.');
    }

    // Reset state after 2 seconds
    setTimeout(() => {
      setCopyingId(null);
    }, 2000);
  }, [success, error]);

  const handleRemove = useCallback((id: string) => {
    removeScan(id);
    success('Entry removed from history');
  }, [removeScan, success]);

  const handleClearAll = useCallback(() => {
    clearHistory();
    setShowClearConfirm(false);
    warning('History cleared');
  }, [clearHistory, warning]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (showClearConfirm) {
        setShowClearConfirm(false);
      } else {
        onClose();
      }
    }
  }, [onClose, showClearConfirm]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!visible) return null;

  return (
    <div
      className="history-modal-backdrop"
      onClick={handleBackdropClick}
      data-testid="history-modal-backdrop"
    >
      <div
        className="history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        data-testid="history-modal"
      >
        {/* Header */}
        <div className="history-modal__header">
          <div className="history-modal__title-container">
            <HistoryIcon />
            <h2 id="history-modal-title" className="history-modal__title">
              Scan History
            </h2>
            <span className="history-modal__count" data-testid="history-count">
              {entries.length}
            </span>
          </div>
          <button
            className="history-modal__close"
            onClick={onClose}
            aria-label="Close history"
            data-testid="history-modal-close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="history-modal__content">
          {entries.length === 0 ? (
            <div className="history-modal__empty" data-testid="history-empty">
              <EmptyIcon />
              <p className="history-modal__empty-text">No scan history yet</p>
              <p className="history-modal__empty-hint">
                Scanned QR codes will appear here
              </p>
            </div>
          ) : (
            <ul className="history-modal__list" data-testid="history-list">
              {entries.map((entry) => (
                <li key={entry.id} className="history-modal__item" data-testid="history-item">
                  <div className="history-modal__item-content">
                    <div className="history-modal__item-text" data-testid="history-item-text">
                      {entry.text}
                    </div>
                    <div className="history-modal__item-meta">
                      <span className="history-modal__item-time" data-testid="history-item-time">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span className="history-modal__item-format">
                        {entry.format}
                      </span>
                    </div>
                  </div>
                  <div className="history-modal__item-actions">
                    <button
                      className={`history-modal__item-button history-modal__item-button--copy ${
                        copyingId === entry.id ? 'history-modal__item-button--copied' : ''
                      }`}
                      onClick={() => handleCopy(entry)}
                      aria-label={copyingId === entry.id ? 'Copied!' : 'Copy to clipboard'}
                      data-testid="history-item-copy"
                    >
                      {copyingId === entry.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button
                      className="history-modal__item-button history-modal__item-button--delete"
                      onClick={() => handleRemove(entry.id)}
                      aria-label="Remove from history"
                      data-testid="history-item-delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Actions */}
        {entries.length > 0 && (
          <div className="history-modal__footer">
            {showClearConfirm ? (
              <div className="history-modal__confirm" data-testid="clear-confirm">
                <p className="history-modal__confirm-text">Clear all history?</p>
                <div className="history-modal__confirm-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    data-testid="clear-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClearAll}
                    data-testid="clear-confirm-button"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                className="history-modal__clear-button"
                data-testid="clear-history-button"
              >
                <TrashIcon />
                Clear History
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Icon components
function HistoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="history-modal__icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="history-modal__svg-icon"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="history-modal__empty-icon"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="history-modal__svg-icon"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="history-modal__svg-icon"
      aria-hidden="true"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="history-modal__svg-icon"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default HistoryModal;
