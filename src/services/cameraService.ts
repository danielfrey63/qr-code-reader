import type {
  CameraPermissionState,
  CameraPermissionStatus,
  CameraError,
  CameraErrorType,
  CameraDevice,
  CameraConfig,
  CameraStreamResult,
} from '../types/camera';

/**
 * Check if MediaDevices API is supported
 */
export function isMediaDevicesSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Check if the current context is secure (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext;
}

/**
 * Create a CameraError object from various error types
 */
export function createCameraError(error: unknown): CameraError {
  if (error instanceof DOMException) {
    return mapDOMExceptionToError(error);
  }

  if (error instanceof Error) {
    return {
      type: 'UNKNOWN',
      message: error.message,
      originalError: error,
    };
  }

  return {
    type: 'UNKNOWN',
    message: String(error),
  };
}

/**
 * Map DOMException to CameraError
 */
function mapDOMExceptionToError(error: DOMException): CameraError {
  const errorMap: Record<string, { type: CameraErrorType; message: string }> = {
    NotAllowedError: {
      type: 'PERMISSION_DENIED',
      message: 'Camera access was denied. Please allow camera permissions in your browser settings.',
    },
    NotFoundError: {
      type: 'NO_DEVICES_FOUND',
      message: 'No camera devices were found on this device.',
    },
    NotReadableError: {
      type: 'DEVICE_IN_USE',
      message: 'The camera is already in use by another application.',
    },
    OverconstrainedError: {
      type: 'OVERCONSTRAINED',
      message: 'The requested camera configuration is not supported.',
    },
    AbortError: {
      type: 'PERMISSION_DISMISSED',
      message: 'Camera access request was dismissed.',
    },
    SecurityError: {
      type: 'NOT_SECURE_CONTEXT',
      message: 'Camera access requires a secure context (HTTPS).',
    },
  };

  const mapped = errorMap[error.name];
  if (mapped) {
    return {
      type: mapped.type,
      message: mapped.message,
      originalError: error,
    };
  }

  return {
    type: 'UNKNOWN',
    message: error.message || 'An unknown camera error occurred.',
    originalError: error,
  };
}

/**
 * Query the current camera permission state using Permissions API
 */
export async function queryCameraPermission(): Promise<CameraPermissionState> {
  // Check if Permissions API is available
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    // Permissions API not available, return 'prompt' as default
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as CameraPermissionState;
  } catch {
    // Some browsers don't support querying camera permission
    return 'prompt';
  }
}

/**
 * Get the full camera permission status including support checks
 */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  const isSupported = isMediaDevicesSupported();
  const isSecure = isSecureContext();

  if (!isSupported) {
    return {
      state: 'denied',
      isSupported: false,
      isSecureContext: isSecure,
      error: {
        type: 'NOT_SUPPORTED',
        message: 'MediaDevices API is not supported in this browser.',
      },
    };
  }

  if (!isSecure) {
    return {
      state: 'denied',
      isSupported: true,
      isSecureContext: false,
      error: {
        type: 'NOT_SECURE_CONTEXT',
        message: 'Camera access requires a secure context (HTTPS or localhost).',
      },
    };
  }

  const state = await queryCameraPermission();
  return {
    state,
    isSupported: true,
    isSecureContext: true,
  };
}

/**
 * Request camera permission by attempting to get a stream
 * This is the reliable way to trigger permission prompt on all platforms
 * iOS specifically requires user interaction before this call
 */
export async function requestCameraPermission(
  config: CameraConfig = {}
): Promise<CameraStreamResult> {
  if (!isMediaDevicesSupported()) {
    return {
      stream: null,
      error: {
        type: 'NOT_SUPPORTED',
        message: 'MediaDevices API is not supported in this browser.',
      },
    };
  }

  if (!isSecureContext()) {
    return {
      stream: null,
      error: {
        type: 'NOT_SECURE_CONTEXT',
        message: 'Camera access requires a secure context (HTTPS or localhost).',
      },
    };
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: buildVideoConstraints(config),
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream };
  } catch (error) {
    return {
      stream: null,
      error: createCameraError(error),
    };
  }
}

/**
 * Build video constraints from config
 */
function buildVideoConstraints(config: CameraConfig): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {};

  if (config.deviceId) {
    constraints.deviceId = { exact: config.deviceId };
  } else if (config.facingMode) {
    // Use ideal instead of exact for facingMode to allow fallback
    constraints.facingMode = { ideal: config.facingMode };
  }

  if (config.width) {
    constraints.width = { ideal: config.width };
  }

  if (config.height) {
    constraints.height = { ideal: config.height };
  }

  // If no constraints specified, request any video
  if (Object.keys(constraints).length === 0) {
    return { facingMode: { ideal: 'environment' } };
  }

  return constraints;
}

/**
 * Stop a media stream and release all tracks
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

/**
 * Enumerate available camera devices
 * Note: Labels may be empty if permission hasn't been granted
 */
export async function enumerateCameraDevices(): Promise<CameraDevice[]> {
  if (!isMediaDevicesSupported()) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device): device is MediaDeviceInfo => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
        kind: 'videoinput' as const,
        facingMode: guessFacingMode(device.label),
      }));
  } catch {
    return [];
  }
}

/**
 * Guess the facing mode from device label
 */
function guessFacingMode(label: string): 'user' | 'environment' | undefined {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
    return 'user';
  }
  if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
    return 'environment';
  }
  return undefined;
}

/**
 * Listen for permission changes
 * Returns a cleanup function to remove the listener
 */
export function onPermissionChange(
  callback: (state: CameraPermissionState) => void
): () => void {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return () => {};
  }

  let permissionStatus: PermissionStatus | null = null;

  const handleChange = () => {
    if (permissionStatus) {
      callback(permissionStatus.state as CameraPermissionState);
    }
  };

  navigator.permissions
    .query({ name: 'camera' as PermissionName })
    .then((status) => {
      permissionStatus = status;
      status.addEventListener('change', handleChange);
    })
    .catch(() => {
      // Ignore errors - some browsers don't support this
    });

  return () => {
    if (permissionStatus) {
      permissionStatus.removeEventListener('change', handleChange);
    }
  };
}
