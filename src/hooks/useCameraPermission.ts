import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  CameraPermissionStatus,
  CameraConfig,
  CameraError,
} from '../types/camera';
import {
  getCameraPermissionStatus,
  requestCameraPermission,
  stopMediaStream,
  onPermissionChange,
} from '../services/cameraService';

/**
 * Hook state for camera permission management
 */
export interface UseCameraPermissionState {
  /** Current permission status */
  status: CameraPermissionStatus | null;
  /** Active media stream (if permission granted) */
  stream: MediaStream | null;
  /** Whether a permission request is in progress */
  isRequesting: boolean;
  /** Last error that occurred */
  error: CameraError | null;
}

/**
 * Hook actions for camera permission management
 */
export interface UseCameraPermissionActions {
  /** Request camera permission - must be called from user interaction on iOS */
  requestPermission: (config?: CameraConfig) => Promise<boolean>;
  /** Stop the camera stream and release resources */
  stopStream: () => void;
  /** Refresh the permission status */
  refreshStatus: () => Promise<void>;
}

/**
 * Hook return type
 */
export type UseCameraPermissionReturn = UseCameraPermissionState & UseCameraPermissionActions;

/**
 * React hook for managing camera permissions and stream access
 *
 * This hook handles:
 * - Checking MediaDevices API support
 * - Checking secure context (HTTPS) requirement
 * - Querying current permission state
 * - Requesting camera permission (with user interaction support for iOS)
 * - Managing the camera stream lifecycle
 * - Listening for permission changes
 *
 * @example
 * ```tsx
 * function CameraComponent() {
 *   const {
 *     status,
 *     stream,
 *     isRequesting,
 *     error,
 *     requestPermission,
 *     stopStream,
 *   } = useCameraPermission();
 *
 *   const handleStartCamera = async () => {
 *     // This must be called from a user interaction (click, tap)
 *     const granted = await requestPermission({ facingMode: 'environment' });
 *     if (granted) {
 *       // Camera stream is available in `stream`
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleStartCamera}>
 *       Start Camera
 *     </button>
 *   );
 * }
 * ```
 */
export function useCameraPermission(): UseCameraPermissionReturn {
  const [status, setStatus] = useState<CameraPermissionStatus | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<CameraError | null>(null);

  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);

  // Refresh permission status
  const refreshStatus = useCallback(async () => {
    const currentStatus = await getCameraPermissionStatus();
    if (isMountedRef.current) {
      setStatus(currentStatus);
      if (currentStatus.error) {
        setError(currentStatus.error);
      }
    }
  }, []);

  // Request camera permission
  const requestPermission = useCallback(async (config?: CameraConfig): Promise<boolean> => {
    if (isRequesting) {
      return false;
    }

    setIsRequesting(true);
    setError(null);

    try {
      const result = await requestCameraPermission(config);

      if (!isMountedRef.current) {
        // Component unmounted, stop the stream if we got one
        stopMediaStream(result.stream);
        return false;
      }

      if (result.stream) {
        setStream(result.stream);
        setStatus((prev) => prev ? { ...prev, state: 'granted' } : {
          state: 'granted',
          isSupported: true,
          isSecureContext: true,
        });
        return true;
      }

      if (result.error) {
        setError(result.error);
        // Update status based on error
        if (result.error.type === 'PERMISSION_DENIED') {
          setStatus((prev) => prev ? { ...prev, state: 'denied', error: result.error } : {
            state: 'denied',
            isSupported: true,
            isSecureContext: true,
            error: result.error,
          });
        }
      }

      return false;
    } finally {
      if (isMountedRef.current) {
        setIsRequesting(false);
      }
    }
  }, [isRequesting]);

  // Stop the camera stream
  const stopStream = useCallback(() => {
    if (stream) {
      stopMediaStream(stream);
      setStream(null);
    }
  }, [stream]);

  // Initial permission status check on mount
  useEffect(() => {
    refreshStatus();

    // Set up permission change listener
    const cleanup = onPermissionChange((state) => {
      if (isMountedRef.current) {
        setStatus((prev) => prev ? { ...prev, state } : {
          state,
          isSupported: true,
          isSecureContext: true,
        });
      }
    });

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [refreshStatus]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stopMediaStream(stream);
      }
    };
  }, [stream]);

  return {
    status,
    stream,
    isRequesting,
    error,
    requestPermission,
    stopStream,
    refreshStatus,
  };
}

export default useCameraPermission;
