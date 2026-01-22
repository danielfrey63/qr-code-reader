/**
 * URI Detection utility functions
 * Detects tel: and sms: URIs and optionally validates phone number patterns
 */

/**
 * Result of URI detection
 */
export interface UriDetectionResult {
  /** The type of URI detected */
  type: 'tel' | 'sms' | 'unknown';
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
 * Result of SMS URI detection with additional SMS-specific fields
 */
export interface SmsUriDetectionResult extends UriDetectionResult {
  type: 'sms' | 'unknown';
  /** The phone number(s) to send SMS to */
  phoneNumber: string;
  /** The pre-filled message body (if present in URI) */
  messageBody?: string;
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

// =============================================================================
// SMS URI Detection
// =============================================================================

/**
 * Regular expression for sms: URI detection
 * Matches sms: or smsto: followed by phone number and optional query params
 * RFC 5724 compliant basic pattern
 * Examples:
 * - sms:+1234567890
 * - sms:+1234567890?body=Hello
 * - smsto:+1234567890
 * - SMSTO:1234567890
 */
const SMS_URI_PATTERN = /^(?:sms|smsto):([+]?[\d\s()\-.]+)(?:\?(.*))?$/i;

/**
 * Detects if the given text is an SMS URI (sms: or smsto:)
 * @param text - The text to analyze
 * @returns SmsUriDetectionResult with detection details
 */
export function detectSmsUri(text: string): SmsUriDetectionResult {
  const trimmedText = text.trim();

  // Check for sms: or smsto: URI pattern
  const smsMatch = trimmedText.match(SMS_URI_PATTERN);

  if (smsMatch) {
    const phoneNumber = smsMatch[1].trim();
    const queryString = smsMatch[2] || '';

    // Parse query parameters for message body
    const messageBody = parseMessageBodyFromQuery(queryString);
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    return {
      type: 'sms',
      isDetected: true,
      rawValue: trimmedText,
      normalizedValue: normalizedPhone,
      actionUri: trimmedText, // Use original URI for action
      phoneNumber: normalizedPhone,
      messageBody,
    };
  }

  return {
    type: 'unknown',
    isDetected: false,
    rawValue: trimmedText,
    normalizedValue: trimmedText,
    actionUri: '',
    phoneNumber: '',
  };
}

/**
 * Parse the message body from SMS URI query string
 * @param queryString - The query string portion of the URI (without the ?)
 * @returns The decoded message body if present, undefined otherwise
 */
function parseMessageBodyFromQuery(queryString: string): string | undefined {
  if (!queryString) return undefined;

  // Parse query parameters
  const params = new URLSearchParams(queryString);
  const body = params.get('body');

  if (body) {
    try {
      // The body may be URL encoded
      return decodeURIComponent(body);
    } catch {
      // If decoding fails, return the raw value
      return body;
    }
  }

  return undefined;
}

/**
 * Checks if the given text is a valid SMS URI
 * @param uri - The text to validate
 * @returns Whether the text is a valid sms: or smsto: URI
 */
export function isValidSmsUri(uri: string): boolean {
  return SMS_URI_PATTERN.test(uri.trim());
}

/**
 * Formats SMS info for display
 * @param result - The SMS detection result
 * @returns A user-friendly string for display
 */
export function formatSmsForDisplay(result: SmsUriDetectionResult): string {
  if (!result.isDetected) return '';

  let display = result.phoneNumber;
  if (result.messageBody) {
    // Truncate long messages for display
    const truncatedBody = result.messageBody.length > 50
      ? result.messageBody.substring(0, 47) + '...'
      : result.messageBody;
    display += `: "${truncatedBody}"`;
  }
  return display;
}
