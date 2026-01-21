import { useRef, useEffect, useState, useCallback } from 'react';
import type { CameraPermissionStatus, CameraError } from '../types/camera';
import type { PermissionDenialError, CameraFailureError, RecoveryAction } from '../types/errors';
import { mapCameraErrorToAppError } from '../utils/errorFactory';
import './CameraPermission.css';

interface CameraPermissionProps {
  status: CameraPermissionStatus | null;
  stream: MediaStream | null;
  isRequesting: boolean;
  error: CameraError | null;
  onRequestPermission: () => void;
  onStopStream: () => void;
}

/**
 * Component to handle camera permission UI
 * Shows appropriate UI based on permission state with enhanced error handling
 */
export function CameraPermission({
  status,
  stream,
  isRequesting,
  error,
  onRequestPermission,
  onStopStream,
}: CameraPermissionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Enhanced error state with app error format
  const [appError, setAppError] = useState<PermissionDenialError | CameraFailureError | null>(null);

  // Convert camera errors to app errors with recovery actions
  useEffect(() => {
    if (error) {
      const mappedError = mapCameraErrorToAppError(error);
      setAppError(mappedError);
    } else {
      setAppError(null);
    }
  }, [error]);

  // Attach stream to video element when available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle recovery action
  const handleRecoveryAction = useCallback((action: RecoveryAction) => {
    switch (action.type) {
      case 'REQUEST_PERMISSION':
        setAppError(null);
        onRequestPermission();
        break;
      case 'REFRESH_PAGE':
        window.location.reload();
        break;
      case 'OPEN_SETTINGS':
        // Show instructions for opening settings
        alert('To update permissions:\n\n1. Click the lock/info icon in your browser\'s address bar\n2. Find "Camera" in the permissions list\n3. Change it to "Allow"\n4. Refresh this page');
        break;
      case 'RETRY':
        setAppError(null);
        onRequestPermission();
        break;
      default:
        onRequestPermission();
    }
  }, [onRequestPermission]);

  // Loading state
  if (status === null) {
    return (
      <div className="camera-permission camera-permission--loading" data-testid="camera-permission-loading">
        <div className="camera-permission__spinner" aria-label="Loading..."></div>
        <p>Checking camera availability...</p>
      </div>
    );
  }

  // Not supported
  if (!status.isSupported) {
    return (
      <div className="camera-permission camera-permission--error" data-testid="camera-permission-unsupported">
        <div className="camera-permission__icon camera-permission__icon--error">
          <CameraOffIcon />
        </div>
        <h2>Camera Not Supported</h2>
        <p>
          Your browser does not support the MediaDevices API.
          Please use a modern browser like Chrome, Firefox, Safari, or Edge.
        </p>
        <div className="camera-permission__recovery-hint">
          <strong>Supported browsers:</strong>
          <ul>
            <li>Google Chrome (version 53+)</li>
            <li>Mozilla Firefox (version 36+)</li>
            <li>Safari (version 11+)</li>
            <li>Microsoft Edge (version 12+)</li>
          </ul>
        </div>
      </div>
    );
  }

  // Not secure context
  if (!status.isSecureContext) {
    return (
      <div className="camera-permission camera-permission--error" data-testid="camera-permission-insecure">
        <div className="camera-permission__icon camera-permission__icon--error">
          <LockIcon />
        </div>
        <h2>Secure Connection Required</h2>
        <p>
          Camera access requires a secure connection (HTTPS).
          Please access this application using HTTPS or localhost.
        </p>
        <div className="camera-permission__recovery-hint">
          <strong>How to fix:</strong>
          <ul>
            <li>Use HTTPS instead of HTTP in the URL</li>
            <li>Access via localhost for local development</li>
            <li>Contact the site administrator if on a network</li>
          </ul>
        </div>
      </div>
    );
  }

  // Permission granted and stream active
  if (status.state === 'granted' && stream) {
    return (
      <div className="camera-permission camera-permission--active" data-testid="camera-permission-active">
        <div className="camera-permission__preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-permission__video"
            data-testid="camera-video"
          />
          <div className="camera-permission__overlay">
            <p className="camera-permission__status">Camera Active</p>
          </div>
        </div>
        <button
          onClick={onStopStream}
          className="camera-permission__button camera-permission__button--stop"
          data-testid="stop-camera-button"
        >
          Stop Camera
        </button>
      </div>
    );
  }

  // Permission denied with enhanced error handling
  if (status.state === 'denied') {
    return (
      <div className="camera-permission camera-permission--denied" data-testid="camera-permission-denied">
        <div className="camera-permission__icon camera-permission__icon--denied">
          <CameraOffIcon />
        </div>
        <h2>Camera Access Denied</h2>

        {/* Show app error user message if available */}
        {appError ? (
          <>
            <p className="camera-permission__user-message">
              {appError.userMessage}
            </p>

            {/* Recovery actions */}
            <div className="camera-permission__recovery-actions">
              {appError.recoveryActions.map((action, index) => (
                <button
                  key={`${action.type}-${index}`}
                  onClick={() => handleRecoveryAction(action)}
                  className={`camera-permission__button ${
                    action.isPrimary
                      ? 'camera-permission__button--primary'
                      : 'camera-permission__button--secondary'
                  }`}
                  data-testid={`recovery-action-${action.type.toLowerCase()}`}
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Instructions hint */}
            <div className="camera-permission__instructions-hint">
              <details>
                <summary>How to enable camera access</summary>
                <ol className="camera-permission__instructions">
                  <li>Click the lock/camera icon in your browser's address bar</li>
                  <li>Find "Camera" in the permissions list</li>
                  <li>Change it to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </details>
            </div>
          </>
        ) : (
          <>
            <p>
              You have denied camera access. To use this feature, please:
            </p>
            <ol className="camera-permission__instructions">
              <li>Open your browser settings</li>
              <li>Find the site permissions section</li>
              <li>Allow camera access for this site</li>
              <li>Refresh this page</li>
            </ol>
            {error && (
              <p className="camera-permission__error-message" data-testid="error-message">
                {error.message}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Permission prompt state - show request button with enhanced error display
  return (
    <div className="camera-permission camera-permission--prompt" data-testid="camera-permission-prompt">
      <div className="camera-permission__icon camera-permission__icon--prompt">
        <CameraIcon />
      </div>
      <h2>Camera Access Required</h2>
      <p>
        To scan QR codes, we need access to your camera.
        Your camera feed never leaves your device.
      </p>

      {/* Show enhanced error with recovery actions if available */}
      {appError && (
        <div className="camera-permission__error-box" role="alert" aria-live="polite" data-testid="permission-error-box">
          <div className="camera-permission__error-icon-small">
            <WarningIcon />
          </div>
          <p className="camera-permission__error-text">
            {appError.userMessage}
          </p>
          <div className="camera-permission__error-recovery">
            {appError.recoveryActions
              .filter(action => action.type !== 'REQUEST_PERMISSION')
              .slice(0, 2)
              .map((action, index) => (
                <button
                  key={`${action.type}-${index}`}
                  onClick={() => handleRecoveryAction(action)}
                  className="camera-permission__error-action"
                  data-testid={`error-recovery-${action.type.toLowerCase()}`}
                >
                  {action.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Show basic error if appError not available */}
      {!appError && error && (
        <p className="camera-permission__error-message" data-testid="error-message">
          {error.message}
        </p>
      )}

      <button
        onClick={onRequestPermission}
        disabled={isRequesting}
        className="camera-permission__button camera-permission__button--request"
        data-testid="request-permission-button"
      >
        {isRequesting ? (
          <>
            <span className="camera-permission__button-spinner"></span>
            Requesting Access...
          </>
        ) : (
          'Enable Camera'
        )}
      </button>

      <p className="camera-permission__hint">
        <strong>Privacy Note:</strong> Your camera feed is processed entirely on your device.
        No video data is sent to any server.
      </p>
    </div>
  );
}

// Simple SVG icons
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CameraOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default CameraPermission;
