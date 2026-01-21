import { useRef, useEffect, useState, useCallback } from 'react';
import type { CameraConfig } from '../types/camera';
import type { CameraWorkflowStatus } from '../types/workflow';
import './CameraPreview.css';

/**
 * Camera preview status types
 * Uses the standardized CameraWorkflowStatus from workflow.ts for consistency.
 * - 'idle': Camera is not active
 * - 'initializing': Camera is starting up
 * - 'active': Camera is streaming video
 * - 'error': An error occurred
 */
export type CameraPreviewStatus = CameraWorkflowStatus;

/**
 * Aspect ratio preset options
 */
export type AspectRatioPreset = '1:1' | '4:3' | '16:9' | 'auto';

/**
 * Props for the CameraPreview component
 */
export interface CameraPreviewProps {
  /** Whether the camera should be active */
  active?: boolean;
  /** Camera configuration */
  config?: CameraConfig;
  /** Aspect ratio for the video display */
  aspectRatio?: AspectRatioPreset;
  /** Whether to show the scanning indicator */
  showScanningIndicator?: boolean;
  /** Whether the scanning animation is active */
  scanning?: boolean;
  /** Callback when stream is ready */
  onStreamReady?: (stream: MediaStream) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Callback when status changes */
  onStatusChange?: (status: CameraPreviewStatus) => void;
  /** Optional className for custom styling */
  className?: string;
  /** Children to render as overlay content */
  children?: React.ReactNode;
}

/**
 * Converts aspect ratio preset to numeric value
 */
function getAspectRatioValue(preset: AspectRatioPreset): number | undefined {
  switch (preset) {
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '16:9':
      return 16 / 9;
    case 'auto':
    default:
      return undefined;
  }
}

/**
 * CameraPreview component for displaying live video stream
 * with scanning indicator overlay and proper aspect ratio handling.
 *
 * @example
 * ```tsx
 * <CameraPreview
 *   active={true}
 *   aspectRatio="4:3"
 *   showScanningIndicator={true}
 *   scanning={isScanning}
 *   onStreamReady={(stream) => console.log('Stream ready')}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export function CameraPreview({
  active = false,
  config = {},
  aspectRatio = '4:3',
  showScanningIndicator = true,
  scanning = false,
  onStreamReady,
  onError,
  onStatusChange,
  className = '',
  children,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraPreviewStatus>('idle');
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | undefined>();

  /**
   * Update status and notify parent
   */
  const updateStatus = useCallback((newStatus: CameraPreviewStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  /**
   * Stop the current video stream
   */
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  /**
   * Start the camera stream
   */
  const startStream = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.('Camera not supported');
      updateStatus('error');
      return;
    }

    updateStatus('initializing');

    try {
      // Build constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: config.facingMode || 'environment',
          ...(config.deviceId && { deviceId: { exact: config.deviceId } }),
          ...(config.width && { width: { ideal: config.width } }),
          ...(config.height && { height: { ideal: config.height } }),
        },
        audio: false,
      };

      // Get the stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Get actual video dimensions for auto aspect ratio
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          setVideoAspectRatio(settings.width / settings.height);
        }
      }

      updateStatus('active');
      onStreamReady?.(stream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      onError?.(errorMessage);
      updateStatus('error');
    }
  }, [config, onError, onStreamReady, updateStatus]);

  /**
   * Handle video element loaded metadata
   */
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth && videoHeight) {
        setVideoAspectRatio(videoWidth / videoHeight);
      }
    }
  }, []);

  /**
   * Start/stop stream based on active prop
   */
  useEffect(() => {
    if (active) {
      startStream();
    } else {
      stopStream();
      updateStatus('idle');
    }

    return () => {
      stopStream();
    };
  }, [active, startStream, stopStream, updateStatus]);

  /**
   * Handle config changes while active
   */
  useEffect(() => {
    if (active && status === 'active') {
      // Restart stream with new config
      stopStream();
      startStream();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.deviceId, config.facingMode]);

  // Compute the aspect ratio CSS value
  const aspectRatioValue = aspectRatio === 'auto' ? videoAspectRatio : getAspectRatioValue(aspectRatio);
  const aspectRatioStyle = aspectRatioValue ? { aspectRatio: aspectRatioValue } : {};

  // Build class names
  const containerClasses = [
    'camera-preview',
    `camera-preview--${status}`,
    `camera-preview--ratio-${aspectRatio.replace(':', '-')}`,
    scanning ? 'camera-preview--scanning' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      style={aspectRatioStyle}
      data-testid="camera-preview"
      data-status={status}
    >
      {/* Video element for camera stream */}
      <video
        ref={videoRef}
        className="camera-preview__video"
        autoPlay
        playsInline
        muted
        onLoadedMetadata={handleLoadedMetadata}
        data-testid="camera-preview-video"
      />

      {/* Scanning indicator overlay */}
      {showScanningIndicator && status === 'active' && (
        <div className="camera-preview__overlay" data-testid="camera-preview-overlay">
          {/* Corner markers */}
          <div className="camera-preview__scan-region">
            <div className="camera-preview__corner camera-preview__corner--tl" />
            <div className="camera-preview__corner camera-preview__corner--tr" />
            <div className="camera-preview__corner camera-preview__corner--bl" />
            <div className="camera-preview__corner camera-preview__corner--br" />

            {/* Animated scan line - only visible when scanning */}
            {scanning && (
              <div
                className="camera-preview__scan-line"
                data-testid="camera-preview-scan-line"
              />
            )}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {status === 'initializing' && (
        <div className="camera-preview__loading" data-testid="camera-preview-loading">
          <div className="camera-preview__spinner" />
          <span className="camera-preview__loading-text">Starting camera...</span>
        </div>
      )}

      {/* Error indicator */}
      {status === 'error' && (
        <div className="camera-preview__error" data-testid="camera-preview-error">
          <CameraOffIcon />
          <span className="camera-preview__error-text">Camera unavailable</span>
        </div>
      )}

      {/* Status indicator when active */}
      {status === 'active' && scanning && (
        <div className="camera-preview__status-badge" data-testid="camera-preview-status">
          <span className="camera-preview__status-dot" />
          <span className="camera-preview__status-text">Scanning</span>
        </div>
      )}

      {/* Custom overlay content */}
      {children && (
        <div className="camera-preview__custom-overlay">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Camera off icon component
 */
function CameraOffIcon() {
  return (
    <svg
      className="camera-preview__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
  );
}

export default CameraPreview;
