import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import type { QRScanResult } from '../types/scanner';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from '../contexts/ToastContext';
import './ScanResultOverlay.css';

interface ScanResultOverlayProps {
  /** The scan result to display */
  result: QRScanResult;
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when user wants to start a new scan */
  onNewScan: () => void;
  /** Callback when overlay is dismissed */
  onDismiss?: () => void;
}

/**
 * Overlay component that displays scan results with copy-to-clipboard functionality
 * and option to start a new scan.
 */
export function ScanResultOverlay({
  result,
  visible,
  onNewScan,
  onDismiss,
}: ScanResultOverlayProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { success, error } = useToast();

  // Handle escape key to dismiss overlay
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onDismiss]);

  // Cleanup copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const copySuccess = await copyToClipboard(result.text);
    setCopyState(copySuccess ? 'copied' : 'error');

    // Show toast notification
    if (copySuccess) {
      success('Copied to clipboard!');
    } else {
      error('Failed to copy to clipboard. Please try again or copy manually.');
    }

    // Clear any existing timeout before setting a new one
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    // Reset state after 2 seconds
    copyTimeoutRef.current = setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, [result.text, success, error]);

  const handleNewScan = useCallback(() => {
    setCopyState('idle');
    onNewScan();
  }, [onNewScan]);

  const handleDismiss = useCallback(() => {
    setCopyState('idle');
    onDismiss?.();
  }, [onDismiss]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only dismiss if clicking the backdrop itself, not the content
    if (e.target === e.currentTarget && onDismiss) {
      handleDismiss();
    }
  }, [handleDismiss, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="scan-result-overlay-backdrop"
      onClick={handleBackdropClick}
      data-testid="scan-result-backdrop"
    >
      <div className="scan-result-overlay" data-testid="scan-result-overlay">
        {/* Header */}
        <div className="scan-result-overlay__header">
          <div className="scan-result-overlay__icon">
            <SuccessIcon />
          </div>
          <h2 className="scan-result-overlay__title">Scan Successful!</h2>
          {onDismiss && (
            <button
              className="scan-result-overlay__close"
              onClick={handleDismiss}
              aria-label="Close"
              data-testid="scan-result-close"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="scan-result-overlay__content">
          <label className="scan-result-overlay__label">Scanned Content:</label>
          <div className="scan-result-overlay__text-container">
            <pre className="scan-result-overlay__text" data-testid="scan-result-text">
              {result.text}
            </pre>
          </div>

          {/* Metadata */}
          <div className="scan-result-overlay__meta">
            <span className="scan-result-overlay__meta-item">
              <strong>Format:</strong> {result.format}
            </span>
            <span className="scan-result-overlay__meta-item">
              <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="scan-result-overlay__actions">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="scan-result-overlay__button"
            data-testid="copy-to-clipboard-button"
          >
            {copyState === 'idle' && (
              <>
                <CopyIcon />
                Copy to Clipboard
              </>
            )}
            {copyState === 'copied' && (
              <>
                <CheckIcon />
                Copied!
              </>
            )}
            {copyState === 'error' && (
              <>
                <ErrorIcon />
                Copy Failed
              </>
            )}
          </Button>

          <Button
            variant="default"
            onClick={handleNewScan}
            className="scan-result-overlay__button"
            data-testid="new-scan-button"
          >
            <ScanIcon />
            New Scan
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icon components
function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--success"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
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
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
      className="scan-result-overlay__svg-icon"
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
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

export default ScanResultOverlay;
