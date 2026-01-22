/**
 * Content Detection utility functions
 * Detects content types from scanned QR codes to suggest appropriate actions
 */

import { detectWifiQr } from './wifiParser';
import { detectGeoUri } from './geoDetector';
import { detectPhoneNumber, detectSmsUri } from './uriDetector';


/**
 * Content types that can be detected from QR codes
 */
export type ContentType =
  | 'URL'
  | 'WIFI'
  | 'GEO'
  | 'TEL'
  | 'SMS'
  | 'EMAIL'
  | 'PLAIN_TEXT';

/**
 * Result of content type detection
 */
export interface ContentDetectionResult {
  /** The detected content type */
  type: ContentType;
  /** Whether this is a structured/known format */
  isStructured: boolean;
  /** The original raw text */
  rawText: string;
  /** Whether a fallback "Search the web" action should be offered */
  shouldOfferWebSearch: boolean;
}

/**
 * Regular expression patterns for content detection
 */

// URL pattern - matches http, https, ftp URLs
const URL_PATTERN = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// Email pattern - basic email format
const EMAIL_PATTERN = /^mailto:([^\s@]+@[^\s@]+\.[^\s@]+)$/i;

// Plain email (without mailto:)
const PLAIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/**
 * Detects if the given text is a URL
 * @param text - The text to analyze
 * @returns Whether the text is a valid URL
 */
export function isUrl(text: string): boolean {
  return URL_PATTERN.test(text.trim());
}

/**
 * Detects if the given text is an email address
 * @param text - The text to analyze
 * @returns Whether the text is a valid email (with or without mailto:)
 */
export function isEmail(text: string): boolean {
  const trimmed = text.trim();
  return EMAIL_PATTERN.test(trimmed) || PLAIN_EMAIL_PATTERN.test(trimmed);
}

/**
 * Detect the content type of scanned text
 * Checks for known structured formats and falls back to plain text
 *
 * @param text - The scanned QR code text
 * @returns ContentDetectionResult with type and metadata
 */
export function detectContentType(text: string): ContentDetectionResult {
  const trimmedText = text.trim();

  // Check for WiFi QR code
  if (detectWifiQr(trimmedText).isWifi) {
    return {
      type: 'WIFI',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Check for Geo URI
  if (detectGeoUri(trimmedText).isGeo) {
    return {
      type: 'GEO',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Check for URL
  if (isUrl(trimmedText)) {
    return {
      type: 'URL',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Check for Email
  if (isEmail(trimmedText)) {
    return {
      type: 'EMAIL',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Check for Phone number (tel: URI or plain number)
  const phoneResult = detectPhoneNumber(trimmedText);
  if (phoneResult.isDetected) {
    return {
      type: 'TEL',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Check for SMS URI
  const smsResult = detectSmsUri(trimmedText);
  if (smsResult.isDetected) {
    return {
      type: 'SMS',
      isStructured: true,
      rawText: trimmedText,
      shouldOfferWebSearch: false,
    };
  }

  // Fallback: Plain text - offer web search
  return {
    type: 'PLAIN_TEXT',
    isStructured: false,
    rawText: trimmedText,
    shouldOfferWebSearch: true,
  };
}

/**
 * Generate a web search URL for the given text
 * Uses Google search by default
 *
 * @param text - The text to search for
 * @returns Encoded Google search URL
 */
export function generateSearchUrl(text: string): string {
  const encodedQuery = encodeURIComponent(text.trim());
  return `https://www.google.com/search?q=${encodedQuery}`;
}

/**
 * Get user-friendly display name for content type
 * @param type - The content type
 * @returns Human-readable content type name
 */
export function getContentTypeDisplayName(type: ContentType): string {
  switch (type) {
    case 'URL':
      return 'Website URL';
    case 'WIFI':
      return 'WiFi Network';
    case 'GEO':
      return 'Location';
    case 'TEL':
      return 'Phone Number';
    case 'SMS':
      return 'SMS Message';
    case 'EMAIL':
      return 'Email Address';
    case 'PLAIN_TEXT':
      return 'Plain Text';
    default:
      return 'Unknown';
  }
}
