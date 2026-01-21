import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type {
  QRScanResult,
  QRScannerError,
  QRScannerStatus,
  QRScannerConfig,
} from '../types/scanner';
import { DEFAULT_SCANNER_CONFIG } from '../types/scanner';

/**
 * Hook state for QR scanner management
 */
export interface UseQRScannerState {
  /** Current scanner status */
  status: QRScannerStatus;
  /** Last successful scan result */
  lastResult: QRScanResult | null;
  /** Last error that occurred */
  error: QRScannerError | null;
  /** Whether the scanner is actively scanning */
  isScanning: boolean;
}

/**
 * Hook actions for QR scanner management
 */
export interface UseQRScannerActions {
  /** Start the QR scanner */
  startScanner: () => Promise<boolean>;
  /** Stop the QR scanner */
  stopScanner: () => Promise<void>;
  /** Clear the last scan result */
  clearResult: () => void;
  /** Switch to a different camera by device ID or facing mode */
  switchCamera: (options: { deviceId?: string; facingMode?: 'user' | 'environment' }) => Promise<boolean>;
}

/**
 * Hook return type
 */
export type UseQRScannerReturn = UseQRScannerState & UseQRScannerActions;

/**
 * React hook for managing QR code scanning with html5-qrcode
 *
 * @param elementId - The HTML element ID where the scanner will render
 * @param config - Scanner configuration options
 * @param onScan - Callback function when a QR code is successfully scanned
 *
 * @example
 * ```tsx
 * function ScannerComponent() {
 *   const handleScan = (result: QRScanResult) => {
 *     console.log('Scanned:', result.text);
 *   };
 *
 *   const {
 *     status,
 *     lastResult,
 *     isScanning,
 *     startScanner,
 *     stopScanner,
 *   } = useQRScanner('qr-reader', {}, handleScan);
 *
 *   return (
 *     <div>
 *       <div id="qr-reader" />
 *       <button onClick={startScanner}>Start</button>
 *       <button onClick={stopScanner}>Stop</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useQRScanner(
  elementId: string,
  config: QRScannerConfig = {},
  onScan?: (result: QRScanResult) => void
): UseQRScannerReturn {
  const [status, setStatus] = useState<QRScannerStatus>('idle');
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null);
  const [error, setError] = useState<QRScannerError | null>(null);

  // Reference to the Html5Qrcode instance
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Track if component is mounted
  const isMountedRef = useRef(true);
  // Track current camera configuration for switching
  const currentCameraConfigRef = useRef<{ deviceId?: string; facingMode?: 'user' | 'environment' }>({});

  // Merge config with defaults
  const mergedConfig = useMemo(() => ({ ...DEFAULT_SCANNER_CONFIG, ...config }), [config]);

  /**
   * Handle successful QR code decode
   * Stops the scanner after a successful scan to prevent multiple scans
   */
  const handleDecode = useCallback(
    (decodedText: string, decodedResult: { result: { format?: { formatName: string } } }) => {
      const result: QRScanResult = {
        text: decodedText,
        format: decodedResult.result.format?.formatName || 'QR_CODE',
        timestamp: Date.now(),
      };

      const stopAndNotify = async () => {
        if (scannerRef.current?.isScanning) {
          try {
            await scannerRef.current.stop();
          } catch {
            // Ignore stop errors after a successful scan
          }
        }

        if (isMountedRef.current) {
          setLastResult(result);
          setStatus('idle');
        }

        onScan?.(result);
      };

      void stopAndNotify();
    },
    [onScan]
  );

  /**
   * Start the QR scanner
   */
  const startScanner = useCallback(async (): Promise<boolean> => {
    if (status === 'active' || status === 'initializing') {
      return false;
    }

    setStatus('initializing');
    setError(null);

    try {
      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.AZTEC,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ],
          verbose: false,
        });
      }

      const scanner = scannerRef.current;

      // Determine camera configuration
      // If deviceId is provided, use it; otherwise use facingMode
      const cameraConfig = mergedConfig.deviceId
        ? { deviceId: { exact: mergedConfig.deviceId } }
        : { facingMode: mergedConfig.facingMode };

      // Start scanning
      await scanner.start(
        cameraConfig,
        {
          fps: mergedConfig.fps,
          qrbox: {
            width: mergedConfig.qrboxWidth,
            height: mergedConfig.qrboxHeight,
          },
          aspectRatio: mergedConfig.aspectRatio,
          disableFlip: mergedConfig.disableFlip,
        },
        handleDecode,
        () => {
          // Error callback - called on each failed frame, ignore these
        }
      );

      if (isMountedRef.current) {
        setStatus('active');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const scannerError: QRScannerError = {
        type: 'SCANNER_START_FAILED',
        message: `Failed to start scanner: ${errorMessage}`,
        originalError: err instanceof Error ? err : String(err),
      };

      if (isMountedRef.current) {
        setError(scannerError);
        setStatus('error');
      }

      return false;
    }
  }, [elementId, mergedConfig, handleDecode, status]);

  /**
   * Stop the QR scanner
   */
  const stopScanner = useCallback(async (): Promise<void> => {
    if (!scannerRef.current) return;

    try {
      const scanner = scannerRef.current;

      // Check if scanner is running before stopping
      if (scanner.isScanning) {
        await scanner.stop();
      }

      if (isMountedRef.current) {
        setStatus('stopped');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const scannerError: QRScannerError = {
        type: 'SCANNER_STOP_FAILED',
        message: `Failed to stop scanner: ${errorMessage}`,
        originalError: err instanceof Error ? err : String(err),
      };

      if (isMountedRef.current) {
        setError(scannerError);
      }
    }
  }, []);

  /**
   * Clear the last scan result
   */
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  /**
   * Switch to a different camera
   * Stops the current scanner and restarts with new camera configuration
   */
  const switchCamera = useCallback(
    async (options: { deviceId?: string; facingMode?: 'user' | 'environment' }): Promise<boolean> => {
      // Update the current camera config ref
      currentCameraConfigRef.current = options;

      // If scanner is running, stop it first
      if (scannerRef.current?.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore stop errors during switch
        }
      }

      setStatus('initializing');
      setError(null);

      try {
        // Create scanner instance if not exists
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(elementId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.AZTEC,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
            verbose: false,
          });
        }

        const scanner = scannerRef.current;

        // Determine camera configuration
        const cameraConfig = options.deviceId
          ? { deviceId: { exact: options.deviceId } }
          : { facingMode: options.facingMode || mergedConfig.facingMode };

        // Start scanning with new camera
        await scanner.start(
          cameraConfig,
          {
            fps: mergedConfig.fps,
            qrbox: {
              width: mergedConfig.qrboxWidth,
              height: mergedConfig.qrboxHeight,
            },
            aspectRatio: mergedConfig.aspectRatio,
            disableFlip: mergedConfig.disableFlip,
          },
          handleDecode,
          () => {
            // Error callback - called on each failed frame, ignore these
          }
        );

        if (isMountedRef.current) {
          setStatus('active');
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const scannerError: QRScannerError = {
          type: 'SCANNER_START_FAILED',
          message: `Failed to switch camera: ${errorMessage}`,
          originalError: err instanceof Error ? err : String(err),
        };

        if (isMountedRef.current) {
          setError(scannerError);
          setStatus('error');
        }

        return false;
      }
    },
    [elementId, mergedConfig, handleDecode]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Stop scanner on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, []);

  const isScanning = status === 'active';

  return {
    status,
    lastResult,
    error,
    isScanning,
    startScanner,
    stopScanner,
    clearResult,
    switchCamera,
  };
}

export default useQRScanner;
