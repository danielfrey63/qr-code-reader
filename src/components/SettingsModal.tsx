/**
 * Settings Modal Component
 *
 * A modal dialog for app settings including:
 * - Theme selection (light/dark/system)
 * - Camera preference (front/back)
 * - App information
 */

import { useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import './SettingsModal.css';

interface SettingsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Available camera devices */
  cameraDevices?: Array<{ deviceId: string; label: string; facingMode?: string }>;
  /** Currently selected camera device ID */
  selectedCameraId?: string;
  /** Callback when camera selection changes */
  onCameraChange?: (deviceId: string) => void;
  /** Current facing mode */
  facingMode?: 'user' | 'environment';
  /** Whether multiple cameras are available */
  hasMultipleCameras?: boolean;
}

/**
 * Settings Modal with theme selector, camera preferences, and app info
 */
export function SettingsModal({
  visible,
  onClose,
  cameraDevices = [],
  selectedCameraId,
  onCameraChange,
  facingMode = 'environment',
  hasMultipleCameras = false,
}: SettingsModalProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();

  // Handle escape key to dismiss modal
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleThemeChange = useCallback(
    (newTheme: Theme) => {
      setTheme(newTheme);
    },
    [setTheme]
  );

  const handleCameraChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onCameraChange) {
        onCameraChange(e.target.value);
      }
    },
    [onCameraChange]
  );

  if (!visible) return null;

  const appVersion = '1.0.0';
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="settings-modal-backdrop"
      onClick={handleBackdropClick}
      data-testid="settings-modal-backdrop"
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        data-testid="settings-modal"
      >
        {/* Header */}
        <div className="settings-modal__header">
          <div className="settings-modal__icon">
            <SettingsIcon />
          </div>
          <h2 id="settings-modal-title" className="settings-modal__title">
            Settings
          </h2>
          <button
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
            data-testid="settings-modal-close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="settings-modal__content">
          {/* Theme Section */}
          <section className="settings-modal__section" data-testid="theme-section">
            <h3 className="settings-modal__section-title">
              <ThemeIcon />
              Appearance
            </h3>
            <p className="settings-modal__section-description">
              Choose how the app looks to you
            </p>
            <div className="settings-modal__theme-options">
              <ThemeOption
                value="light"
                label="Light"
                description="Always use light theme"
                icon={<SunIcon />}
                selected={theme === 'light'}
                onChange={() => handleThemeChange('light')}
              />
              <ThemeOption
                value="dark"
                label="Dark"
                description="Always use dark theme"
                icon={<MoonIcon />}
                selected={theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
              />
              <ThemeOption
                value="system"
                label="System"
                description="Match system setting"
                icon={<SystemIcon />}
                selected={theme === 'system'}
                onChange={() => handleThemeChange('system')}
              />
            </div>
            {theme === 'system' && (
              <p className="settings-modal__theme-hint">
                Currently using {effectiveTheme} theme based on your system preference
              </p>
            )}
          </section>

          {/* Camera Section */}
          <section className="settings-modal__section" data-testid="camera-section">
            <h3 className="settings-modal__section-title">
              <CameraIcon />
              Camera
            </h3>
            <p className="settings-modal__section-description">
              Configure your camera preferences
            </p>

            {cameraDevices.length > 0 ? (
              <div className="settings-modal__field">
                <label
                  htmlFor="camera-select"
                  className="settings-modal__field-label"
                >
                  Select Camera
                </label>
                <select
                  id="camera-select"
                  className="settings-modal__select"
                  value={selectedCameraId || ''}
                  onChange={handleCameraChange}
                  data-testid="camera-select"
                >
                  {cameraDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="settings-modal__empty-state">
                {hasMultipleCameras
                  ? 'Loading cameras...'
                  : 'No cameras available or permission not granted'}
              </p>
            )}

            <div className="settings-modal__camera-info">
              <span className="settings-modal__camera-badge">
                {facingMode === 'environment' ? (
                  <>
                    <BackCameraIcon />
                    Back camera
                  </>
                ) : (
                  <>
                    <FrontCameraIcon />
                    Front camera
                  </>
                )}
              </span>
            </div>
          </section>

          {/* About Section */}
          <section className="settings-modal__section" data-testid="about-section">
            <h3 className="settings-modal__section-title">
              <InfoIcon />
              About
            </h3>
            <div className="settings-modal__about">
              <div className="settings-modal__about-logo">
                <QRCodeIcon />
              </div>
              <div className="settings-modal__about-info">
                <h4 className="settings-modal__app-name">QR Code Reader</h4>
                <p className="settings-modal__app-version">Version {appVersion}</p>
                <p className="settings-modal__app-description">
                  A fast, privacy-focused QR code scanner that works entirely in your browser.
                  No data is sent to any server.
                </p>
              </div>
            </div>
            <div className="settings-modal__about-footer">
              <p className="settings-modal__copyright">
                © {currentYear} QR Code Reader
              </p>
              <p className="settings-modal__tech">
                Built with React + TypeScript
              </p>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="settings-modal__actions">
          <Button
            variant="default"
            onClick={onClose}
            className="settings-modal__button"
            data-testid="settings-done-button"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// Theme Option Component
interface ThemeOptionProps {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onChange: () => void;
}

function ThemeOption({
  value,
  label,
  description,
  icon,
  selected,
  onChange,
}: ThemeOptionProps) {
  return (
    <button
      type="button"
      className={`settings-modal__theme-option ${
        selected ? 'settings-modal__theme-option--selected' : ''
      }`}
      onClick={onChange}
      aria-pressed={selected}
      data-testid={`theme-option-${value}`}
    >
      <span className="settings-modal__theme-option-icon">{icon}</span>
      <span className="settings-modal__theme-option-label">{label}</span>
      <span className="settings-modal__theme-option-description">{description}</span>
      {selected && (
        <span className="settings-modal__theme-option-check">
          <CheckIcon />
        </span>
      )}
    </button>
  );
}

// Icon Components
function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon settings-modal__svg-icon--header"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function BackCameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon settings-modal__svg-icon--small"
      aria-hidden="true"
    >
      <rect width="18" height="12" x="3" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function FrontCameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon settings-modal__svg-icon--small"
      aria-hidden="true"
    >
      <rect width="18" height="12" x="3" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 2v2" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function QRCodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon settings-modal__svg-icon--logo"
      aria-hidden="true"
    >
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
      className="settings-modal__svg-icon"
      aria-hidden="true"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export default SettingsModal;
