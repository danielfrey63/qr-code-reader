import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import type { QRScanResult } from '../types/scanner';
import type { SearchActionState, PaymentActionState } from '../types/actions';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from '../contexts/ToastContext';
import { detectWifiQr, getEncryptionDisplayName, type WifiDetectionResult } from '../utils/wifiParser';
import { detectGeoUri, formatCoordinatesForDisplay, type GeoUriDetectionResult } from '../utils/geoDetector';
import { detectPaymentUri, formatPaymentAddressForDisplay, formatPaymentAmountForDisplay, type PaymentUriDetectionResult } from '../utils/paymentDetector';
import { detectContentType, generateSearchUrl } from '../utils/contentDetector';
import './ScanResultOverlay.css';

interface ScanResultOverlayProps {
  /** The scan result to display */
  result: QRScanResult;
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when user wants to start a new scan */
  onNewScan: () => void;
  /** Callback when overlay is dismissed */
  onDismiss?: () => void;
}

/**
 * Overlay component that displays scan results with copy-to-clipboard functionality
 * and option to start a new scan.
 */
export function ScanResultOverlay({
  result,
  visible,
  onNewScan,
  onDismiss,
}: ScanResultOverlayProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [ssidCopyState, setSsidCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [passwordCopyState, setPasswordCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [searchState, setSearchState] = useState<SearchActionState>('idle');
  const [paymentState, setPaymentState] = useState<PaymentActionState>('idle');
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ssidCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passwordCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { success, error, info, warning } = useToast();

  // Detect if this is a WiFi QR code
  const wifiDetection: WifiDetectionResult = useMemo(
    () => detectWifiQr(result.text),
    [result.text]
  );

  // Detect if this is a geo: URI
  const geoDetection: GeoUriDetectionResult = useMemo(
    () => detectGeoUri(result.text),
    [result.text]
  );

  // Detect if this is a payment URI
  const paymentDetection: PaymentUriDetectionResult = useMemo(
    () => detectPaymentUri(result.text),
    [result.text]
  );

  // Detect content type for fallback actions
  const contentDetection = useMemo(
    () => detectContentType(result.text),
    [result.text]
  );

  // Generate search URL for plain text content
  const searchUrl = useMemo(
    () => contentDetection.shouldOfferWebSearch ? generateSearchUrl(result.text) : '',
    [result.text, contentDetection.shouldOfferWebSearch]
  );

  // Handle escape key to dismiss overlay
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, onDismiss]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (ssidCopyTimeoutRef.current) {
        clearTimeout(ssidCopyTimeoutRef.current);
      }
      if (passwordCopyTimeoutRef.current) {
        clearTimeout(passwordCopyTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }
    };
  }, []);

  // Reset states when result changes
  useEffect(() => {
    setSsidCopyState('idle');
    setPasswordCopyState('idle');
    setShowPassword(false);
    setSearchState('idle');
    setPaymentState('idle');
  }, [result.text]);

  const handleCopy = useCallback(async () => {
    const copySuccess = await copyToClipboard(result.text);
    setCopyState(copySuccess ? 'copied' : 'error');

    // Show toast notification
    if (copySuccess) {
      success('Copied to clipboard!');
    } else {
      error('Failed to copy to clipboard. Please try again or copy manually.');
    }

    // Clear any existing timeout before setting a new one
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    // Reset state after 2 seconds
    copyTimeoutRef.current = setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, [result.text, success, error]);

  // Handle copy SSID to clipboard
  const handleCopySsid = useCallback(async () => {
    if (!wifiDetection.data?.ssid) return;

    const copySuccess = await copyToClipboard(wifiDetection.data.ssid);
    setSsidCopyState(copySuccess ? 'copied' : 'error');

    if (copySuccess) {
      success('SSID copied to clipboard!');
    } else {
      error('Failed to copy SSID. Please try again.');
    }

    if (ssidCopyTimeoutRef.current) {
      clearTimeout(ssidCopyTimeoutRef.current);
    }

    ssidCopyTimeoutRef.current = setTimeout(() => {
      setSsidCopyState('idle');
    }, 2000);
  }, [wifiDetection.data?.ssid, success, error]);

  // Handle copy password to clipboard
  const handleCopyPassword = useCallback(async () => {
    if (!wifiDetection.data?.password) return;

    const copySuccess = await copyToClipboard(wifiDetection.data.password);
    setPasswordCopyState(copySuccess ? 'copied' : 'error');

    if (copySuccess) {
      success('Password copied to clipboard!');
    } else {
      error('Failed to copy password. Please try again.');
    }

    if (passwordCopyTimeoutRef.current) {
      clearTimeout(passwordCopyTimeoutRef.current);
    }

    passwordCopyTimeoutRef.current = setTimeout(() => {
      setPasswordCopyState('idle');
    }, 2000);
  }, [wifiDetection.data?.password, success, error]);

  // Toggle password visibility
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Handle opening location in maps
  const handleOpenInMaps = useCallback(() => {
    if (!geoDetection.data?.mapsUrl) return;

    // Open in new tab - user already confirmed by clicking the button
    window.open(geoDetection.data.mapsUrl, '_blank', 'noopener,noreferrer');
    success('Opening location in maps...');
  }, [geoDetection.data?.mapsUrl, success]);

  // Handle "Search the web" action with confirmation
  const handleSearchWeb = useCallback(() => {
    if (!searchUrl) return;

    if (searchState === 'idle') {
      // First click - show confirmation
      setSearchState('confirming');
      info('Click again to search the web');

      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Reset to idle after 3 seconds if user doesn't confirm
      searchTimeoutRef.current = setTimeout(() => {
        setSearchState('idle');
      }, 3000);
    } else if (searchState === 'confirming') {
      // Second click - execute search
      setSearchState('searching');

      // Clear confirmation timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Open search in new tab
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      success('Opening web search...');

      // Reset state after a short delay
      searchTimeoutRef.current = setTimeout(() => {
        setSearchState('idle');
      }, 2000);
    }
  }, [searchUrl, searchState, info, success]);

  // Handle "Open payment app" action with warning + confirmation
  const handleOpenPayment = useCallback(() => {
    if (!paymentDetection.data?.uri) return;

    if (paymentState === 'idle') {
      // First click - show warning and confirmation
      setPaymentState('confirming');
      warning(paymentDetection.data.warningMessage || 'Click again to open payment app');

      // Clear any existing timeout
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }

      // Reset to idle after 5 seconds if user doesn't confirm (longer timeout for payments)
      paymentTimeoutRef.current = setTimeout(() => {
        setPaymentState('idle');
      }, 5000);
    } else if (paymentState === 'confirming') {
      // Second click - execute payment action
      setPaymentState('opening');

      // Clear confirmation timeout
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
      }

      // Open the payment URI - this will trigger the system to handle it
      // For crypto payments, this typically opens a wallet app
      try {
        window.location.href = paymentDetection.data.uri;
        success('Opening payment app...');
      } catch {
        error('Failed to open payment app. Please copy the address manually.');
      }

      // Reset state after a short delay
      paymentTimeoutRef.current = setTimeout(() => {
        setPaymentState('idle');
      }, 2000);
    }
  }, [paymentDetection.data, paymentState, warning, success, error]);

  const handleNewScan = useCallback(() => {
    setCopyState('idle');
    setSsidCopyState('idle');
    setPasswordCopyState('idle');
    setShowPassword(false);
    setSearchState('idle');
    setPaymentState('idle');
    onNewScan();
  }, [onNewScan]);

  const handleDismiss = useCallback(() => {
    setCopyState('idle');
    onDismiss?.();
  }, [onDismiss]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only dismiss if clicking the backdrop itself, not the content
    if (e.target === e.currentTarget && onDismiss) {
      handleDismiss();
    }
  }, [handleDismiss, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="scan-result-overlay-backdrop"
      onClick={handleBackdropClick}
      data-testid="scan-result-backdrop"
    >
      <div className="scan-result-overlay" data-testid="scan-result-overlay">
        {/* Header */}
        <div className="scan-result-overlay__header">
          <div className="scan-result-overlay__icon">
            <SuccessIcon />
          </div>
          <h2 className="scan-result-overlay__title">Scan Successful!</h2>
          {onDismiss && (
            <button
              className="scan-result-overlay__close"
              onClick={handleDismiss}
              aria-label="Close"
              data-testid="scan-result-close"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="scan-result-overlay__content">
          {wifiDetection.isWifi && wifiDetection.data ? (
            // WiFi QR Code detected - show structured WiFi info
            <>
              <div className="scan-result-overlay__wifi-badge" data-testid="wifi-badge">
                <WifiIcon />
                <span>WiFi Network</span>
              </div>

              {/* SSID Field */}
              <div className="scan-result-overlay__wifi-field" data-testid="wifi-ssid-field">
                <div className="scan-result-overlay__wifi-field-header">
                  <label className="scan-result-overlay__label">Network Name (SSID)</label>
                  <button
                    className={`scan-result-overlay__wifi-copy-btn ${
                      ssidCopyState === 'copied' ? 'scan-result-overlay__wifi-copy-btn--copied' : ''
                    }`}
                    onClick={handleCopySsid}
                    aria-label={ssidCopyState === 'copied' ? 'SSID Copied!' : 'Copy SSID'}
                    data-testid="copy-ssid-button"
                  >
                    {ssidCopyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
                    <span>{ssidCopyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="scan-result-overlay__wifi-value" data-testid="wifi-ssid-value">
                  {wifiDetection.data.ssid}
                </div>
              </div>

              {/* Password Field (only if network has password) */}
              {wifiDetection.data.encryptionType !== 'nopass' && wifiDetection.data.password && (
                <div className="scan-result-overlay__wifi-field" data-testid="wifi-password-field">
                  <div className="scan-result-overlay__wifi-field-header">
                    <label className="scan-result-overlay__label">Password</label>
                    <div className="scan-result-overlay__wifi-field-actions">
                      <button
                        className="scan-result-overlay__wifi-toggle-btn"
                        onClick={handleTogglePassword}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        data-testid="toggle-password-button"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                      <button
                        className={`scan-result-overlay__wifi-copy-btn ${
                          passwordCopyState === 'copied' ? 'scan-result-overlay__wifi-copy-btn--copied' : ''
                        }`}
                        onClick={handleCopyPassword}
                        aria-label={passwordCopyState === 'copied' ? 'Password Copied!' : 'Copy Password'}
                        data-testid="copy-password-button"
                      >
                        {passwordCopyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
                        <span>{passwordCopyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                  <div
                    className="scan-result-overlay__wifi-value scan-result-overlay__wifi-value--password"
                    data-testid="wifi-password-value"
                  >
                    {showPassword ? wifiDetection.data.password : '••••••••'}
                  </div>
                </div>
              )}

              {/* Open network notice */}
              {wifiDetection.data.encryptionType === 'nopass' && (
                <div className="scan-result-overlay__wifi-notice" data-testid="wifi-open-notice">
                  <InfoIcon />
                  <span>This is an open network (no password required)</span>
                </div>
              )}

              {/* Network Info */}
              <div className="scan-result-overlay__meta">
                <span className="scan-result-overlay__meta-item">
                  <strong>Security:</strong> {getEncryptionDisplayName(wifiDetection.data.encryptionType)}
                </span>
                {wifiDetection.data.hidden && (
                  <span className="scan-result-overlay__meta-item">
                    <strong>Hidden:</strong> Yes
                  </span>
                )}
                <span className="scan-result-overlay__meta-item">
                  <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : geoDetection.isGeo && geoDetection.data ? (
            // Geo URI detected - show location info
            <>
              <div className="scan-result-overlay__wifi-badge" data-testid="geo-badge">
                <MapPinIcon />
                <span>Location</span>
              </div>

              {/* Coordinates Field */}
              <div className="scan-result-overlay__wifi-field" data-testid="geo-coordinates-field">
                <div className="scan-result-overlay__wifi-field-header">
                  <label className="scan-result-overlay__label">Coordinates</label>
                </div>
                <div className="scan-result-overlay__wifi-value" data-testid="geo-coordinates-value">
                  {formatCoordinatesForDisplay(geoDetection.data.latitude, geoDetection.data.longitude)}
                </div>
              </div>

              {/* Altitude (if present) */}
              {geoDetection.data.altitude !== undefined && (
                <div className="scan-result-overlay__wifi-field" data-testid="geo-altitude-field">
                  <div className="scan-result-overlay__wifi-field-header">
                    <label className="scan-result-overlay__label">Altitude</label>
                  </div>
                  <div className="scan-result-overlay__wifi-value" data-testid="geo-altitude-value">
                    {geoDetection.data.altitude} meters
                  </div>
                </div>
              )}

              {/* Uncertainty (if present) */}
              {geoDetection.data.uncertainty !== undefined && (
                <div className="scan-result-overlay__wifi-notice" data-testid="geo-uncertainty-notice">
                  <InfoIcon />
                  <span>Uncertainty: ±{geoDetection.data.uncertainty} meters</span>
                </div>
              )}

              {/* Metadata */}
              <div className="scan-result-overlay__meta">
                <span className="scan-result-overlay__meta-item">
                  <strong>Format:</strong> {result.format}
                </span>
                <span className="scan-result-overlay__meta-item">
                  <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : paymentDetection.isPayment && paymentDetection.data ? (
            // Payment URI detected - show payment info with warning
            <>
              <div className="scan-result-overlay__payment-badge" data-testid="payment-badge">
                <PaymentIcon />
                <span>{paymentDetection.data.displayName}</span>
              </div>

              {/* Warning Notice */}
              <div className="scan-result-overlay__payment-warning" data-testid="payment-warning">
                <WarningIcon />
                <span>Verify payment details carefully before proceeding. Transactions may be irreversible.</span>
              </div>

              {/* Payment Address Field */}
              <div className="scan-result-overlay__wifi-field" data-testid="payment-address-field">
                <div className="scan-result-overlay__wifi-field-header">
                  <label className="scan-result-overlay__label">Payment Address</label>
                  <button
                    className={`scan-result-overlay__wifi-copy-btn ${
                      copyState === 'copied' ? 'scan-result-overlay__wifi-copy-btn--copied' : ''
                    }`}
                    onClick={handleCopy}
                    aria-label={copyState === 'copied' ? 'Address Copied!' : 'Copy Address'}
                    data-testid="copy-payment-address-button"
                  >
                    {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
                    <span>{copyState === 'copied' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="scan-result-overlay__wifi-value scan-result-overlay__wifi-value--payment" data-testid="payment-address-value">
                  {formatPaymentAddressForDisplay(paymentDetection.data.address, 40)}
                </div>
              </div>

              {/* Amount Field (if present) */}
              {paymentDetection.data.amount && (
                <div className="scan-result-overlay__wifi-field" data-testid="payment-amount-field">
                  <div className="scan-result-overlay__wifi-field-header">
                    <label className="scan-result-overlay__label">Amount</label>
                  </div>
                  <div className="scan-result-overlay__wifi-value" data-testid="payment-amount-value">
                    {formatPaymentAmountForDisplay(paymentDetection.data.amount, paymentDetection.data.scheme)}
                  </div>
                </div>
              )}

              {/* Label/Recipient (if present) */}
              {paymentDetection.data.label && (
                <div className="scan-result-overlay__wifi-field" data-testid="payment-label-field">
                  <div className="scan-result-overlay__wifi-field-header">
                    <label className="scan-result-overlay__label">Recipient</label>
                  </div>
                  <div className="scan-result-overlay__wifi-value" data-testid="payment-label-value">
                    {paymentDetection.data.label}
                  </div>
                </div>
              )}

              {/* Message (if present) */}
              {paymentDetection.data.message && (
                <div className="scan-result-overlay__wifi-field" data-testid="payment-message-field">
                  <div className="scan-result-overlay__wifi-field-header">
                    <label className="scan-result-overlay__label">Message</label>
                  </div>
                  <div className="scan-result-overlay__wifi-value" data-testid="payment-message-value">
                    {paymentDetection.data.message}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="scan-result-overlay__meta">
                <span className="scan-result-overlay__meta-item">
                  <strong>Type:</strong> {paymentDetection.scheme?.toUpperCase()}
                </span>
                <span className="scan-result-overlay__meta-item">
                  <strong>Format:</strong> {result.format}
                </span>
                <span className="scan-result-overlay__meta-item">
                  <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </>
          ) : (
            // Regular QR Code - show raw content
            <>
              <label className="scan-result-overlay__label">Scanned Content:</label>
              <div className="scan-result-overlay__text-container">
                <pre className="scan-result-overlay__text" data-testid="scan-result-text">
                  {result.text}
                </pre>
              </div>

              {/* Metadata */}
              <div className="scan-result-overlay__meta">
                <span className="scan-result-overlay__meta-item">
                  <strong>Format:</strong> {result.format}
                </span>
                <span className="scan-result-overlay__meta-item">
                  <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="scan-result-overlay__actions">
          {/* Show Open in Maps button for geo URIs */}
          {geoDetection.isGeo && geoDetection.data && (
            <Button
              variant="outline"
              onClick={handleOpenInMaps}
              className="scan-result-overlay__button"
              data-testid="open-in-maps-button"
            >
              <MapPinIcon />
              Open in Maps
            </Button>
          )}

          {/* Show Open Payment App button for payment URIs */}
          {paymentDetection.isPayment && paymentDetection.data && (
            <Button
              variant="outline"
              onClick={handleOpenPayment}
              className={`scan-result-overlay__button scan-result-overlay__button--payment ${
                paymentState === 'confirming' ? 'scan-result-overlay__button--payment-confirming' : ''
              } ${paymentState === 'opening' ? 'scan-result-overlay__button--payment-opening' : ''}`}
              data-testid="open-payment-button"
              aria-label={
                paymentState === 'idle'
                  ? 'Open payment app'
                  : paymentState === 'confirming'
                  ? 'Click again to confirm opening payment app'
                  : 'Opening payment app...'
              }
            >
              {paymentState === 'idle' && (
                <>
                  <PaymentIcon />
                  Open Payment App
                </>
              )}
              {paymentState === 'confirming' && (
                <>
                  <WarningIcon />
                  Click to Confirm
                </>
              )}
              {paymentState === 'opening' && (
                <>
                  <CheckIcon />
                  Opening...
                </>
              )}
            </Button>
          )}

          {/* Show raw copy button only for non-WiFi, non-geo, and non-payment codes */}
          {!wifiDetection.isWifi && !geoDetection.isGeo && !paymentDetection.isPayment && (
            <Button
              variant="outline"
              onClick={handleCopy}
              className="scan-result-overlay__button"
              data-testid="copy-to-clipboard-button"
            >
              {copyState === 'idle' && (
                <>
                  <CopyIcon />
                  Copy to Clipboard
                </>
              )}
              {copyState === 'copied' && (
                <>
                  <CheckIcon />
                  Copied!
                </>
              )}
              {copyState === 'error' && (
                <>
                  <ErrorIcon />
                  Copy Failed
                </>
              )}
            </Button>
          )}

          {/* Show Search the Web button for plain text (fallback action) */}
          {contentDetection.shouldOfferWebSearch && (
            <Button
              variant="outline"
              onClick={handleSearchWeb}
              className={`scan-result-overlay__button scan-result-overlay__button--search ${
                searchState === 'confirming' ? 'scan-result-overlay__button--confirming' : ''
              } ${searchState === 'searching' ? 'scan-result-overlay__button--searching' : ''}`}
              data-testid="search-web-button"
              aria-label={
                searchState === 'idle'
                  ? 'Search the web'
                  : searchState === 'confirming'
                  ? 'Click again to confirm search'
                  : 'Opening search...'
              }
            >
              {searchState === 'idle' && (
                <>
                  <SearchIcon />
                  Search the Web
                </>
              )}
              {searchState === 'confirming' && (
                <>
                  <SearchIcon />
                  Click to Confirm
                </>
              )}
              {searchState === 'searching' && (
                <>
                  <CheckIcon />
                  Opening...
                </>
              )}
            </Button>
          )}

          <Button
            variant="default"
            onClick={handleNewScan}
            className="scan-result-overlay__button"
            data-testid="new-scan-button"
          >
            <ScanIcon />
            New Scan
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icon components
function SuccessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--success"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
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
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--wifi"
      aria-hidden="true"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
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
      className="scan-result-overlay__svg-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--map"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--search"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--payment"
      aria-hidden="true"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="scan-result-overlay__svg-icon scan-result-overlay__svg-icon--warning"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default ScanResultOverlay;
