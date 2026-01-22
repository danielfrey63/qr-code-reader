/**
 * WiFi QR Code Parser utility
 * Parses WiFi QR codes in the standard WIFI: format
 * Format: WIFI:T:<authentication>;S:<ssid>;P:<password>;H:<hidden>;;
 */

/**
 * WiFi encryption types supported in WiFi QR codes
 */
export type WifiEncryptionType = 'WPA' | 'WPA2' | 'WPA3' | 'WEP' | 'nopass';

/**
 * Result of WiFi QR code parsing
 */
export interface WifiQrData {
  /** The network SSID (name) */
  ssid: string;
  /** The network password (empty string for open networks) */
  password: string;
  /** The encryption/authentication type */
  encryptionType: WifiEncryptionType;
  /** Whether the network is hidden */
  hidden: boolean;
  /** The original raw QR code text */
  rawValue: string;
}

/**
 * Result of WiFi QR code detection
 */
export interface WifiDetectionResult {
  /** Whether a valid WiFi QR code was detected */
  isWifi: boolean;
  /** The parsed WiFi data (only present if isWifi is true) */
  data: WifiQrData | null;
}

/**
 * Regular expression for WiFi QR code format
 * WIFI:T:<type>;S:<ssid>;P:<password>;H:<hidden>;;
 *
 * Fields:
 * - T (Type/Authentication): WPA, WPA2, WPA3, WEP, or nopass (open network)
 * - S (SSID): Network name (required)
 * - P (Password): Network password (optional for open networks)
 * - H (Hidden): true if network is hidden (optional, defaults to false)
 *
 * The order of fields can vary, and some fields are optional.
 * The string ends with ;; (double semicolon)
 */
const WIFI_QR_PATTERN = /^WIFI:/i;

/**
 * Parse a single field value from WiFi QR code
 * Handles escaped characters: \; \: \\ \"
 */
function parseFieldValue(value: string): string {
  if (!value) return '';

  // Unescape special characters
  return value
    .replace(/\\;/g, ';')
    .replace(/\\:/g, ':')
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"');
}

/**
 * Extract a field value from the WiFi QR code string
 * @param text - The WiFi QR code string (without WIFI: prefix)
 * @param fieldName - The field name (T, S, P, or H)
 * @returns The field value or undefined if not found
 */
function extractField(text: string, fieldName: string): string | undefined {
  // Match field pattern: FIELD_NAME:VALUE;
  // The value can contain escaped semicolons (\;) so we need to be careful
  const pattern = new RegExp(`${fieldName}:([^;]*(?:\\\\;[^;]*)*)(?:;|$)`, 'i');
  const match = text.match(pattern);

  if (match) {
    return parseFieldValue(match[1]);
  }

  return undefined;
}

/**
 * Normalize the encryption type to a standard format
 */
function normalizeEncryptionType(type: string | undefined): WifiEncryptionType {
  if (!type) return 'nopass';

  const normalized = type.toUpperCase().trim();

  switch (normalized) {
    case 'WPA':
    case 'WPA2':
    case 'WPA2-EAP':
    case 'WPA-EAP':
      return 'WPA';
    case 'WPA3':
    case 'SAE':
      return 'WPA3';
    case 'WEP':
      return 'WEP';
    case 'NOPASS':
    case '':
      return 'nopass';
    default:
      // Default to WPA for unknown types as it's the most common
      return 'WPA';
  }
}

/**
 * Detect and parse a WiFi QR code
 * @param text - The scanned QR code text
 * @returns Detection result with parsed data if valid
 */
export function detectWifiQr(text: string): WifiDetectionResult {
  const trimmedText = text.trim();

  // Check if it starts with WIFI:
  if (!WIFI_QR_PATTERN.test(trimmedText)) {
    return {
      isWifi: false,
      data: null,
    };
  }

  // Remove the WIFI: prefix
  const content = trimmedText.substring(5);

  // Extract SSID (required)
  const ssid = extractField(content, 'S');

  if (!ssid) {
    // SSID is required for a valid WiFi QR code
    return {
      isWifi: false,
      data: null,
    };
  }

  // Extract other fields
  const encryptionTypeRaw = extractField(content, 'T');
  const password = extractField(content, 'P') || '';
  const hiddenRaw = extractField(content, 'H');

  // Parse hidden flag
  const hidden = hiddenRaw?.toLowerCase() === 'true';

  // Normalize encryption type
  const encryptionType = normalizeEncryptionType(encryptionTypeRaw);

  return {
    isWifi: true,
    data: {
      ssid,
      password,
      encryptionType,
      hidden,
      rawValue: trimmedText,
    },
  };
}

/**
 * Check if a string is a WiFi QR code
 * @param text - The text to check
 * @returns True if the text is a valid WiFi QR code
 */
export function isWifiQrCode(text: string): boolean {
  return detectWifiQr(text).isWifi;
}

/**
 * Get a user-friendly display name for the encryption type
 */
export function getEncryptionDisplayName(encryptionType: WifiEncryptionType): string {
  switch (encryptionType) {
    case 'WPA':
      return 'WPA/WPA2';
    case 'WPA3':
      return 'WPA3';
    case 'WEP':
      return 'WEP';
    case 'nopass':
      return 'Open (No Password)';
    default:
      return encryptionType;
  }
}
