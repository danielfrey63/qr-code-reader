import { useState, useCallback, useEffect, useRef } from 'react';
import type { CameraDevice } from '../types/camera';
import { enumerateCameraDevices, onPermissionChange } from '../services/cameraService';
import { getItemWithDefault, setItem } from '../utils/localStorage';

// localStorage key for persisting camera preference
const CAMERA_PREFERENCE_KEY = 'qr-scanner-camera-preference';

/**
 * Camera preference stored in localStorage
 */
interface CameraPreference {
  deviceId: string;
  facingMode: 'user' | 'environment';
}

/**
 * Hook state for camera device management
 */
export interface UseCameraDevicesState {
  /** List of available camera devices */
  devices: CameraDevice[];
  /** Currently selected device */
  selectedDevice: CameraDevice | null;
  /** Current facing mode preference */
  facingMode: 'user' | 'environment';
  /** Whether devices are being loaded */
  isLoading: boolean;
  /** Whether multiple cameras are available */
  hasMultipleCameras: boolean;
}

/**
 * Hook actions for camera device management
 */
export interface UseCameraDevicesActions {
  /** Refresh the list of available devices */
  refreshDevices: () => Promise<void>;
  /** Select a specific camera device by ID */
  selectDevice: (deviceId: string) => void;
  /** Toggle between front and back camera */
  toggleCamera: () => void;
  /** Set facing mode preference */
  setFacingMode: (mode: 'user' | 'environment') => void;
}

/**
 * Hook return type
 */
export type UseCameraDevicesReturn = UseCameraDevicesState & UseCameraDevicesActions;

/**
 * Get the default camera preference (back camera preferred)
 */
function getDefaultPreference(): CameraPreference {
  return {
    deviceId: '',
    facingMode: 'environment', // Default to back camera
  };
}

/**
 * Load camera preference from localStorage
 */
function loadCameraPreference(): CameraPreference {
  return getItemWithDefault<CameraPreference>(CAMERA_PREFERENCE_KEY, getDefaultPreference());
}

/**
 * Save camera preference to localStorage
 */
function saveCameraPreference(preference: CameraPreference): void {
  setItem(CAMERA_PREFERENCE_KEY, preference);
}

/**
 * Find a device by facing mode from the device list
 */
function findDeviceByFacingMode(
  devices: CameraDevice[],
  facingMode: 'user' | 'environment'
): CameraDevice | undefined {
  return devices.find((device) => device.facingMode === facingMode);
}

/**
 * Find the opposite facing mode device
 */
function findOppositeCamera(
  devices: CameraDevice[],
  currentFacingMode: 'user' | 'environment'
): CameraDevice | undefined {
  const oppositeFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  return findDeviceByFacingMode(devices, oppositeFacingMode);
}

/**
 * React hook for managing camera device enumeration and selection
 *
 * Features:
 * - Enumerates available camera devices
 * - Persists user's camera preference in localStorage
 * - Defaults to back camera (environment)
 * - Provides toggle functionality for front/back camera switching
 * - Listens for device changes (when cameras are connected/disconnected)
 *
 * @example
 * ```tsx
 * function CameraComponent() {
 *   const {
 *     devices,
 *     selectedDevice,
 *     facingMode,
 *     hasMultipleCameras,
 *     toggleCamera,
 *   } = useCameraDevices();
 *
 *   return (
 *     <div>
 *       <p>Using: {selectedDevice?.label}</p>
 *       {hasMultipleCameras && (
 *         <button onClick={toggleCamera}>
 *           Switch to {facingMode === 'environment' ? 'Front' : 'Back'} Camera
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCameraDevices(): UseCameraDevicesReturn {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<CameraDevice | null>(null);
  const [facingMode, setFacingModeState] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(true);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  /**
   * Refresh the list of available camera devices
   */
  const refreshDevices = useCallback(async () => {
    setIsLoading(true);

    try {
      const availableDevices = await enumerateCameraDevices();

      if (!isMountedRef.current) return;

      setDevices(availableDevices);

      // Load saved preference
      const preference = loadCameraPreference();

      // Try to select device based on saved preference
      let deviceToSelect: CameraDevice | undefined;

      // First, try to find by saved deviceId
      if (preference.deviceId) {
        deviceToSelect = availableDevices.find((d) => d.deviceId === preference.deviceId);
      }

      // If not found, try to find by facing mode
      if (!deviceToSelect) {
        deviceToSelect = findDeviceByFacingMode(availableDevices, preference.facingMode);
      }

      // If still not found, use first available device
      if (!deviceToSelect && availableDevices.length > 0) {
        deviceToSelect = availableDevices[0];
      }

      if (deviceToSelect) {
        setSelectedDevice(deviceToSelect);
        setFacingModeState(deviceToSelect.facingMode || preference.facingMode);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Select a specific camera device by ID
   */
  const selectDevice = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        setSelectedDevice(device);
        const newFacingMode = device.facingMode || facingMode;
        setFacingModeState(newFacingMode);

        // Save preference to localStorage
        saveCameraPreference({
          deviceId: device.deviceId,
          facingMode: newFacingMode,
        });
      }
    },
    [devices, facingMode]
  );

  /**
   * Toggle between front and back camera
   */
  const toggleCamera = useCallback(() => {
    const oppositeDevice = findOppositeCamera(devices, facingMode);

    if (oppositeDevice) {
      setSelectedDevice(oppositeDevice);
      const newFacingMode = oppositeDevice.facingMode || (facingMode === 'user' ? 'environment' : 'user');
      setFacingModeState(newFacingMode);

      // Save preference to localStorage
      saveCameraPreference({
        deviceId: oppositeDevice.deviceId,
        facingMode: newFacingMode,
      });
    } else {
      // If no opposite device found, just toggle facing mode
      // This handles cases where facing mode is not detected from labels
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
      setFacingModeState(newFacingMode);

      // Find any other device that's not the current one
      const otherDevice = devices.find((d) => d.deviceId !== selectedDevice?.deviceId);
      if (otherDevice) {
        setSelectedDevice(otherDevice);
        saveCameraPreference({
          deviceId: otherDevice.deviceId,
          facingMode: newFacingMode,
        });
      } else {
        // Just save the facing mode preference
        saveCameraPreference({
          deviceId: selectedDevice?.deviceId || '',
          facingMode: newFacingMode,
        });
      }
    }
  }, [devices, facingMode, selectedDevice]);

  /**
   * Set facing mode preference explicitly
   */
  const setFacingMode = useCallback(
    (mode: 'user' | 'environment') => {
      setFacingModeState(mode);

      // Try to find a device with this facing mode
      const device = findDeviceByFacingMode(devices, mode);
      if (device) {
        setSelectedDevice(device);
        saveCameraPreference({
          deviceId: device.deviceId,
          facingMode: mode,
        });
      } else {
        // Just save the facing mode preference
        saveCameraPreference({
          deviceId: selectedDevice?.deviceId || '',
          facingMode: mode,
        });
      }
    },
    [devices, selectedDevice]
  );

  // Initial device enumeration
  useEffect(() => {
    refreshDevices();

    // Listen for permission changes to re-enumerate devices
    // (device labels become available after permission is granted)
    const cleanup = onPermissionChange((state) => {
      if (state === 'granted' && isMountedRef.current) {
        refreshDevices();
      }
    });

    // Listen for device changes (cameras connected/disconnected)
    const handleDeviceChange = () => {
      if (isMountedRef.current) {
        refreshDevices();
      }
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      isMountedRef.current = false;
      cleanup();
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  const hasMultipleCameras = devices.length > 1;

  return {
    devices,
    selectedDevice,
    facingMode,
    isLoading,
    hasMultipleCameras,
    refreshDevices,
    selectDevice,
    toggleCamera,
    setFacingMode,
  };
}

export default useCameraDevices;
