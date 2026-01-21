/**
 * URI Detection utility functions
 * Detects tel: URIs and optionally validates phone number patterns
 */

/**
 * Result of URI detection
 */
export interface UriDetectionResult {
  /** The type of URI detected */
  type: 'tel' | 'unknown';
  /** Whether a valid URI pattern was detected */
  isDetected: boolean;
  /** The original raw value */
  rawValue: string;
  /** The normalized/cleaned value (e.g., phone number without tel: prefix) */
  normalizedValue: string;
  /** The full URI for action (e.g., tel:+1234567890) */
  actionUri: string;
}

/**
 * Regular expression for tel: URI detection
 * Matches tel: followed by optional + and digits, spaces, parentheses, or hyphens
 * RFC 3966 compliant basic pattern
 */
const TEL_URI_PATTERN = /^tel:([\+]?[\d\s\(\)\-\.]+)$/i;

/**
 * Regular expression for plain phone number detection (optional feature)
 * Matches common phone number formats:
 * - International: +1 234 567 8900, +1-234-567-8900
 * - US: (234) 567-8900, 234-567-8900, 234.567.8900
 * - Simple: 2345678900
 */
const PHONE_NUMBER_PATTERN = /^[\+]?[\d][\d\s\(\)\-\.]{7,}[\d]$/;

/**
 * Detects if the given text is a tel: URI
 * @param text - The text to analyze
 * @returns UriDetectionResult with detection details
 */
export function detectTelUri(text: string): UriDetectionResult {
  const trimmedText = text.trim();

  // Check for tel: URI pattern
  const telMatch = trimmedText.match(TEL_URI_PATTERN);

  if (telMatch) {
    const phoneNumber = telMatch[1].trim();
    return {
      type: 'tel',
      isDetected: true,
      rawValue: trimmedText,
      normalizedValue: normalizePhoneNumber(phoneNumber),
      actionUri: trimmedText, // Already a valid tel: URI
    };
  }

  return {
    type: 'unknown',
    isDetected: false,
    rawValue: trimmedText,
    normalizedValue: trimmedText,
    actionUri: '',
  };
}

/**
 * Detects if the given text is a plain phone number (not a tel: URI)
 * This is an optional feature for detecting phone numbers without the tel: prefix
 * @param text - The text to analyze
 * @returns UriDetectionResult with detection details
 */
export function detectPlainPhoneNumber(text: string): UriDetectionResult {
  const trimmedText = text.trim();

  // First check if it's already a tel: URI
  if (trimmedText.toLowerCase().startsWith('tel:')) {
    return detectTelUri(trimmedText);
  }

  // Check for plain phone number pattern
  if (PHONE_NUMBER_PATTERN.test(trimmedText)) {
    const normalized = normalizePhoneNumber(trimmedText);
    return {
      type: 'tel',
      isDetected: true,
      rawValue: trimmedText,
      normalizedValue: normalized,
      actionUri: `tel:${normalized}`,
    };
  }

  return {
    type: 'unknown',
    isDetected: false,
    rawValue: trimmedText,
    normalizedValue: trimmedText,
    actionUri: '',
  };
}

/**
 * Detects if the given text contains a callable phone number (tel: URI or plain number)
 * @param text - The text to analyze
 * @param detectPlainNumbers - Whether to also detect plain phone numbers (default: true)
 * @returns UriDetectionResult with detection details
 */
export function detectPhoneNumber(text: string, detectPlainNumbers = true): UriDetectionResult {
  // First try tel: URI detection
  const telResult = detectTelUri(text);
  if (telResult.isDetected) {
    return telResult;
  }

  // Optionally try plain phone number detection
  if (detectPlainNumbers) {
    return detectPlainPhoneNumber(text);
  }

  return {
    type: 'unknown',
    isDetected: false,
    rawValue: text.trim(),
    normalizedValue: text.trim(),
    actionUri: '',
  };
}

/**
 * Normalizes a phone number by removing formatting characters
 * but preserving the + prefix for international numbers
 * @param phoneNumber - The phone number to normalize
 * @returns Normalized phone number
 */
function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all characters except digits and leading +
  const hasPlus = phoneNumber.startsWith('+');
  const digitsOnly = phoneNumber.replace(/[^\d]/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The normalized phone number
 * @returns Formatted phone number for display
 */
export function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // For now, just return the number as-is
  // Could be enhanced with locale-specific formatting
  return phoneNumber;
}

/**
 * Checks if the phone URI can be opened (basic validation)
 * @param uri - The tel: URI to validate
 * @returns Whether the URI appears valid for opening
 */
export function isValidTelUri(uri: string): boolean {
  return TEL_URI_PATTERN.test(uri.trim());
}
