import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useQRScanner } from '../hooks/useQRScanner';
import type { QRScanResult, QRScannerConfig } from '../types/scanner';
import type { ScanError, RecoveryAction } from '../types/errors';
import { mapScannerErrorToAppError } from '../utils/errorFactory';
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

      {/* Last scan result display */}
      {lastResult && (
        <div className="qr-scanner__result" data-testid="scan-result">
          <div className="qr-scanner__result-header">
            <CheckIcon />
            <span>QR Code Detected!</span>
          </div>
          <div className="qr-scanner__result-content">
            <p className="qr-scanner__result-text">{lastResult.text}</p>
            <p className="qr-scanner__result-meta">
              Format: {lastResult.format} |
              Time: {new Date(lastResult.timestamp).toLocaleTimeString()}
            </p>
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="qr-scanner__icon">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
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

export default QRScanner;
