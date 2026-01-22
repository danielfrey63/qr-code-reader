/**
 * Verification test for GitHub Issue #26 fix
 *
 * Bug: onPermissionChange updates status but leaves error intact,
 * so error UI can persist after permission is granted.
 *
 * Fix: When state === 'granted', setError(null) and clear status.error
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraPermission } from './useCameraPermission';
import * as cameraService from '../services/cameraService';

// Mock the camera service
vi.mock('../services/cameraService', () => ({
  getCameraPermissionStatus: vi.fn(),
  requestCameraPermission: vi.fn(),
  stopMediaStream: vi.fn(),
  onPermissionChange: vi.fn(),
}));

describe('useCameraPermission - Issue #26: Clear error when permission is granted', () => {
  let permissionChangeCallback: ((state: 'prompt' | 'granted' | 'denied') => void) | null = null;
  let mockCleanup: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    permissionChangeCallback = null;
    mockCleanup = vi.fn();

    // Default mock implementations
    vi.mocked(cameraService.getCameraPermissionStatus).mockResolvedValue({
      state: 'prompt',
      isSupported: true,
      isSecureContext: true,
    });

    vi.mocked(cameraService.onPermissionChange).mockImplementation((callback) => {
      permissionChangeCallback = callback;
      return mockCleanup;
    });

    vi.mocked(cameraService.stopMediaStream).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should clear error state when permission changes to granted', async () => {
    // Set up initial denied state with error
    vi.mocked(cameraService.getCameraPermissionStatus).mockResolvedValue({
      state: 'denied',
      isSupported: true,
      isSecureContext: true,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied',
      },
    });

    vi.mocked(cameraService.requestCameraPermission).mockResolvedValue({
      stream: null,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied',
      },
    });

    const { result } = renderHook(() => useCameraPermission());

    // Wait for initial status to be set
    await waitFor(() => {
      expect(result.current.status).not.toBeNull();
    });

    // Request permission (will be denied)
    await act(async () => {
      await result.current.requestPermission();
    });

    // Verify error is set
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe('PERMISSION_DENIED');

    // Simulate permission change to 'granted' (e.g., user updates browser settings)
    expect(permissionChangeCallback).not.toBeNull();

    act(() => {
      permissionChangeCallback!('granted');
    });

    // Verify error is cleared after permission change to 'granted'
    expect(result.current.error).toBeNull();
    expect(result.current.status?.state).toBe('granted');
    expect(result.current.status?.error).toBeUndefined();
  });

  it('should remove error property from status when permission changes to granted', async () => {
    // Set up initial denied state with error in status
    vi.mocked(cameraService.getCameraPermissionStatus).mockResolvedValue({
      state: 'denied',
      isSupported: true,
      isSecureContext: true,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied',
      },
    });

    vi.mocked(cameraService.requestCameraPermission).mockResolvedValue({
      stream: null,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied',
      },
    });

    const { result } = renderHook(() => useCameraPermission());

    // Wait for initial status
    await waitFor(() => {
      expect(result.current.status).not.toBeNull();
    });

    // Request permission
    await act(async () => {
      await result.current.requestPermission();
    });

    // Verify status has error
    expect(result.current.status?.error).toBeDefined();

    // Simulate permission change to 'granted'
    act(() => {
      permissionChangeCallback!('granted');
    });

    // Verify status.error is removed
    expect(result.current.status?.error).toBeUndefined();
    expect(result.current.status?.state).toBe('granted');
  });

  it('should not clear error when permission changes to denied', async () => {
    // Set up initial prompt state
    vi.mocked(cameraService.getCameraPermissionStatus).mockResolvedValue({
      state: 'prompt',
      isSupported: true,
      isSecureContext: true,
    });

    vi.mocked(cameraService.requestCameraPermission).mockResolvedValue({
      stream: null,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied',
      },
    });

    const { result } = renderHook(() => useCameraPermission());

    // Wait for initial status
    await waitFor(() => {
      expect(result.current.status).not.toBeNull();
    });

    // Request permission (will be denied)
    await act(async () => {
      await result.current.requestPermission();
    });

    // Verify error is set
    expect(result.current.error).not.toBeNull();

    // Simulate permission change to 'denied' (should keep error)
    act(() => {
      permissionChangeCallback!('denied');
    });

    // Verify error is still present
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe('PERMISSION_DENIED');
    expect(result.current.status?.state).toBe('denied');
  });

  it('should handle permission change from denied to granted correctly', async () => {
    // This test specifically verifies the bug fix scenario
    // 1. Initial state is denied with error
    // 2. User manually grants permission in browser settings
    // 3. Permission change event fires with 'granted'
    // 4. Error UI should disappear

    vi.mocked(cameraService.getCameraPermissionStatus).mockResolvedValue({
      state: 'denied',
      isSupported: true,
      isSecureContext: true,
      error: {
        type: 'PERMISSION_DENIED',
        message: 'Camera access was denied. Please allow camera permissions in your browser settings.',
      },
    });

    const { result } = renderHook(() => useCameraPermission());

    // Wait for initial status with error
    await waitFor(() => {
      expect(result.current.status?.state).toBe('denied');
    });

    // The status should have the error from getCameraPermissionStatus
    expect(result.current.status?.error).toBeDefined();

    // Simulate user granting permission via browser settings
    // This triggers the onPermissionChange callback
    act(() => {
      permissionChangeCallback!('granted');
    });

    // Both error state and status.error should be cleared
    expect(result.current.error).toBeNull();
    expect(result.current.status?.state).toBe('granted');
    expect(result.current.status?.error).toBeUndefined();
  });
});
