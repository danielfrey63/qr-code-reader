import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useQRScanner } from '../hooks/useQRScanner';
import type { QRScanResult, QRScannerConfig } from '../types/scanner';
import type { ScanError, RecoveryAction } from '../types/errors';
import { mapScannerErrorToAppError } from '../utils/errorFactory';
import { copyToClipboard } from '../utils/clipboard';
import { detectPhoneNumber, type UriDetectionResult } from '../utils/uriDetector';
import { useToast } from '../contexts/ToastContext';
import './QRScanner.css';

interface QRScannerProps {
  /** Callback when a QR code is successfully scanned */
  onScan?: (result: QRScanResult) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Scanner configuration */
  config?: QRScannerConfig;
  /** Whether to automatically start scanning */
  autoStart?: boolean;
  /** Whether multiple cameras are available */
  hasMultipleCameras?: boolean;
  /** Current facing mode */
  facingMode?: 'user' | 'environment';
  /** Callback when camera switch is requested */
  onSwitchCamera?: () => void;
}

/** Imperative handle for QRScanner component */
export interface QRScannerRef {
  /** Start the scanner */
  startScanner: () => Promise<boolean>;
  /** Clear the last scan result */
  clearResult: () => void;
}

const SCANNER_ELEMENT_ID = 'qr-reader';

/**
 * QR Scanner component that handles camera stream and QR code detection
 * with comprehensive error handling and recovery options.
 */
export const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(function QRScanner({
  onScan,
  onError,
  config,
  autoStart = true,
  hasMultipleCameras = false,
  facingMode = 'environment',
  onSwitchCamera,
}, ref) {
  const hasStartedRef = useRef(false);
  const previousConfigRef = useRef<QRScannerConfig | undefined>(undefined);

  // Enhanced error state with app error format
  const [appError, setAppError] = useState<ScanError | null>(null);

  // Copy state for result display
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  // Call state for phone number action
  const [callState, setCallState] = useState<'idle' | 'confirming' | 'initiated'>('idle');
  const { success, error: toastError } = useToast();

  const {
    status,
    lastResult,
    error,
    isScanning,
    startScanner,
    stopScanner,
    switchCamera,
    clearResult,
  } = useQRScanner(SCANNER_ELEMENT_ID, config, onScan);

  // Expose methods via ref for parent components to call
  useImperativeHandle(ref, () => ({
    startScanner,
    clearResult,
  }), [startScanner, clearResult]);

  // Convert scanner errors to app errors with recovery actions
  useEffect(() => {
    if (error) {
      const scanError = mapScannerErrorToAppError(error, status);
      setAppError(scanError);
    } else {
      setAppError(null);
    }
  }, [error, status]);

  // Auto-start scanner on mount
  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      // Small delay to ensure DOM element is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startScanner]);

  // Handle camera switching when config changes (deviceId or facingMode)
  useEffect(() => {
    const prevConfig = previousConfigRef.current;
    const currentDeviceId = config?.deviceId;
    const currentFacingMode = config?.facingMode;
    const prevDeviceId = prevConfig?.deviceId;
    const prevFacingMode = prevConfig?.facingMode;

    // Check if camera config changed and scanner is active
    const cameraConfigChanged =
      (currentDeviceId !== prevDeviceId || currentFacingMode !== prevFacingMode) &&
      prevConfig !== undefined;

    if (cameraConfigChanged && isScanning) {
      // Switch camera with new config
      switchCamera({
        deviceId: currentDeviceId,
        facingMode: currentFacingMode,
      });
    }

    // Update previous config ref
    previousConfigRef.current = config;
  }, [config?.deviceId, config?.facingMode, isScanning, switchCamera, config]);

  // Report errors to parent
  useEffect(() => {
    if (error && onError) {
      onError(error.message);
    }
  }, [error, onError]);

  // Note: onScan callback is already called directly in useQRScanner's handleDecode function
  // Removed duplicate useEffect that was calling onScan(lastResult) here, which caused double-firing

  // Handle recovery action from error overlay
  const handleRecoveryAction = useCallback((action: RecoveryAction) => {
    switch (action.type) {
      case 'RETRY':
        setAppError(null);
        startScanner();
        break;
      case 'REFRESH_PAGE':
        window.location.reload();
        break;
      case 'SWITCH_CAMERA':
        if (onSwitchCamera) {
          setAppError(null);
          onSwitchCamera();
        }
        break;
      default:
        setAppError(null);
        startScanner();
    }
  }, [startScanner, onSwitchCamera]);

  // Handle copy to clipboard for scan result
  const handleCopy = useCallback(async () => {
    if (!lastResult) return;

    const copySuccess = await copyToClipboard(lastResult.text);
    setCopyState(copySuccess ? 'copied' : 'error');

    // Show toast notification
    if (copySuccess) {
      success('Copied to clipboard!');
    } else {
      toastError('Failed to copy to clipboard. Please try again.');
    }

    // Reset state after 2 seconds
    setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, [lastResult, success, toastError]);

  // Detect phone number in result
  const phoneDetection: UriDetectionResult | null = lastResult
    ? detectPhoneNumber(lastResult.text)
    : null;

  // Handle call action for phone numbers
  const handleCall = useCallback(() => {
    if (!phoneDetection?.isDetected || !phoneDetection.actionUri) return;

    if (callState === 'idle') {
      // First click: show confirmation
      setCallState('confirming');
      success(`Tap again to call ${phoneDetection.normalizedValue}`);

      // Reset confirmation state after 3 seconds if not confirmed
      setTimeout(() => {
        setCallState((current) => (current === 'confirming' ? 'idle' : current));
      }, 3000);
    } else if (callState === 'confirming') {
      // Second click: initiate call
      setCallState('initiated');
      success(`Opening dialer for ${phoneDetection.normalizedValue}...`);

      // Open the tel: URI to trigger the dialer
      window.location.href = phoneDetection.actionUri;

      // Reset state after a delay
      setTimeout(() => {
        setCallState('idle');
      }, 2000);
    }
  }, [phoneDetection, callState, success]);

  // Format timestamp for display
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

  return (
    <div className="qr-scanner" data-testid="qr-scanner">
      {/* Scanner viewport */}
      <div className="qr-scanner__viewport">
        <div
          id={SCANNER_ELEMENT_ID}
          className="qr-scanner__reader"
          data-testid="qr-reader"
        />

        {/* Scanning overlay with corner markers */}
        {isScanning && (
          <div className="qr-scanner__overlay">
            <div className="qr-scanner__scan-region">
              <div className="qr-scanner__corner qr-scanner__corner--tl" />
              <div className="qr-scanner__corner qr-scanner__corner--tr" />
              <div className="qr-scanner__corner qr-scanner__corner--bl" />
              <div className="qr-scanner__corner qr-scanner__corner--br" />
              <div className="qr-scanner__scan-line" />
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'initializing' && (
          <div className="qr-scanner__loading-overlay">
            <div className="qr-scanner__spinner" />
            <p>Starting camera...</p>
          </div>
        )}

        {/* Enhanced Error overlay with recovery actions */}
        {status === 'error' && appError && (
          <div className="qr-scanner__error-overlay" role="alert" aria-live="assertive" data-testid="scanner-error-overlay">
            <div className="qr-scanner__error-icon">
              <ScannerErrorIcon />
            </div>
            <h3 className="qr-scanner__error-title">Scanner Error</h3>
            <p className="qr-scanner__error-message" data-testid="scanner-error-message">
              {appError.userMessage}
            </p>

            {/* Recovery actions */}
            <div className="qr-scanner__error-actions">
              {appError.recoveryActions.map((action, index) => (
                <button
                  key={`${action.type}-${index}`}
                  className={`qr-scanner__error-button ${
                    action.isPrimary ? 'qr-scanner__error-button--primary' : 'qr-scanner__error-button--secondary'
                  }`}
                  onClick={() => handleRecoveryAction(action)}
                  data-testid={`scanner-recovery-${action.type.toLowerCase()}`}
                >
                  {action.type === 'RETRY' && <RetryIcon />}
                  {action.type === 'REFRESH_PAGE' && <RefreshIcon />}
                  {action.type === 'SWITCH_CAMERA' && <SwitchCameraIcon />}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Error code for debugging */}
            <p className="qr-scanner__error-code">Error code: {appError.code}</p>
          </div>
        )}

        {/* Fallback for basic error display when appError is not available */}
        {status === 'error' && error && !appError && (
          <div className="qr-scanner__error-overlay" data-testid="scanner-error-fallback">
            <div className="qr-scanner__error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="qr-scanner__error-message">{error.message}</p>
            <button
              className="qr-scanner__retry-button"
              onClick={() => startScanner()}
              data-testid="retry-button"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Scanner controls */}
      <div className="qr-scanner__controls">
        {!isScanning && status !== 'initializing' && status !== 'error' && (
          <button
            className="qr-scanner__button qr-scanner__button--start"
            onClick={() => startScanner()}
            data-testid="start-scanner-button"
          >
            <ScanIcon />
            Start Scanning
          </button>
        )}
        {isScanning && (
          <>
            <button
              className="qr-scanner__button qr-scanner__button--stop"
              onClick={() => stopScanner()}
              data-testid="stop-scanner-button"
            >
              <StopIcon />
              Stop Scanning
            </button>
            {hasMultipleCameras && onSwitchCamera && (
              <button
                className="qr-scanner__button qr-scanner__button--switch"
                onClick={onSwitchCamera}
                data-testid="switch-camera-button"
                title={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
              >
                <SwitchCameraIcon />
                {facingMode === 'environment' ? 'Front Camera' : 'Back Camera'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Last scan result display - styled like history items */}
      {lastResult && (
        <div className="qr-scanner__result" data-testid="scan-result">
          <div className="qr-scanner__result-item">
            <div className="qr-scanner__result-item-content">
              <div className="qr-scanner__result-item-text" data-testid="scan-result-text">
                {lastResult.text}
              </div>
              <div className="qr-scanner__result-item-meta">
                <span className="qr-scanner__result-item-time">
                  {formatTimestamp(lastResult.timestamp)}
                </span>
                <span className="qr-scanner__result-item-format">
                  {lastResult.format}
                </span>
              </div>
            </div>
            <div className="qr-scanner__result-item-actions">
              <button
                className={`qr-scanner__result-item-button qr-scanner__result-item-button--copy ${
                  copyState === 'copied' ? 'qr-scanner__result-item-button--copied' : ''
                }`}
                onClick={handleCopy}
                aria-label={copyState === 'copied' ? 'Copied!' : 'Copy to clipboard'}
                data-testid="scan-result-copy"
              >
                {copyState === 'copied' ? <CopyCheckIcon /> : <CopyIcon />}
              </button>
              {phoneDetection?.isDetected && (
                <button
                  className={`qr-scanner__result-item-button qr-scanner__result-item-button--call ${
                    callState === 'confirming' ? 'qr-scanner__result-item-button--confirming' : ''
                  } ${callState === 'initiated' ? 'qr-scanner__result-item-button--initiated' : ''}`}
                  onClick={handleCall}
                  aria-label={
                    callState === 'confirming'
                      ? `Confirm call to ${phoneDetection.normalizedValue}`
                      : `Call ${phoneDetection.normalizedValue}`
                  }
                  data-testid="scan-result-call"
                >
                  {callState === 'initiated' ? <PhoneCheckIcon /> : <PhoneIcon />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// Icon components
function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function SwitchCameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon">
      {/* Camera body */}
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      {/* Rotating arrows to indicate switch */}
      <path d="M9 13l-2 2 2 2" />
      <path d="M15 11l2-2-2-2" />
      <path d="M7 15h5a3 3 0 0 0 3-3" />
      <path d="M17 9h-5a3 3 0 0 0-3 3" />
    </svg>
  );
}

function ScannerErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <polyline points="23,4 23,10 17,10" />
      <polyline points="1,20 1,14 7,14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CopyCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PhoneCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon" aria-hidden="true">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export default QRScanner;
