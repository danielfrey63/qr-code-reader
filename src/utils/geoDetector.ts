/**
 * Geo URI Detection utility functions
 * Detects geo: URIs (RFC 5870) and generates map URLs
 */

/**
 * Result of geo URI detection
 */
export interface GeoUriDetectionResult {
  /** Whether a valid geo: URI pattern was detected */
  isGeo: boolean;
  /** The parsed geo data (only present if isGeo is true) */
  data?: GeoUriData;
  /** The original raw value */
  rawValue: string;
}

/**
 * Parsed data from a geo: URI
 */
export interface GeoUriData {
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Optional altitude in meters */
  altitude?: number;
  /** Optional uncertainty in meters */
  uncertainty?: number;
  /** The original geo: URI */
  uri: string;
  /** Pre-generated Google Maps URL for opening */
  mapsUrl: string;
}

/**
 * Regular expression for geo: URI detection
 * Matches geo:lat,long format with optional altitude and query parameters
 * RFC 5870 compliant basic pattern
 * Examples:
 * - geo:37.7749,-122.4194
 * - geo:37.7749,-122.4194,100
 * - geo:37.7749,-122.4194;u=35
 * - geo:37.7749,-122.4194,100;u=35
 */
const GEO_URI_PATTERN = /^geo:(-?\d+\.?\d*),(-?\d+\.?\d*)(?:,(-?\d+\.?\d*))?(?:;(.*))?$/i;

/**
 * Detects if the given text is a geo: URI
 * @param text - The text to analyze
 * @returns GeoUriDetectionResult with detection details
 */
export function detectGeoUri(text: string): GeoUriDetectionResult {
  const trimmedText = text.trim();

  // Check for geo: URI pattern
  const geoMatch = trimmedText.match(GEO_URI_PATTERN);

  if (geoMatch) {
    const latitude = parseFloat(geoMatch[1]);
    const longitude = parseFloat(geoMatch[2]);
    const altitude = geoMatch[3] ? parseFloat(geoMatch[3]) : undefined;

    // Validate latitude and longitude ranges
    if (!isValidCoordinate(latitude, longitude)) {
      return {
        isGeo: false,
        rawValue: trimmedText,
      };
    }

    // Parse optional parameters (like uncertainty)
    const params = geoMatch[4] ? parseGeoParams(geoMatch[4]) : {};

    // Generate Google Maps URL
    const mapsUrl = generateMapsUrl(latitude, longitude);

    return {
      isGeo: true,
      rawValue: trimmedText,
      data: {
        latitude,
        longitude,
        altitude,
        uncertainty: params.u,
        uri: trimmedText,
        mapsUrl,
      },
    };
  }

  return {
    isGeo: false,
    rawValue: trimmedText,
  };
}

/**
 * Validates that latitude and longitude are within valid ranges
 * @param latitude - Latitude value (-90 to 90)
 * @param longitude - Longitude value (-180 to 180)
 * @returns Whether the coordinates are valid
 */
function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Parse geo URI parameters (e.g., "u=35" for uncertainty)
 * @param paramString - The parameter string (without leading semicolon)
 * @returns Parsed parameters object
 */
function parseGeoParams(paramString: string): { u?: number } {
  const params: { u?: number } = {};

  const pairs = paramString.split(';');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key === 'u' && value) {
      const uncertainty = parseFloat(value);
      if (!isNaN(uncertainty) && uncertainty >= 0) {
        params.u = uncertainty;
      }
    }
  }

  return params;
}

/**
 * Generate a Google Maps URL for the given coordinates
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Google Maps URL that will show the location
 */
export function generateMapsUrl(latitude: number, longitude: number): string {
  // Use Google Maps query format which works well across platforms
  // and will prompt to open in app on mobile devices
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/**
 * Format coordinates for display
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @returns Formatted coordinate string
 */
export function formatCoordinatesForDisplay(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(6)}° ${latDir}, ${Math.abs(longitude).toFixed(6)}° ${lonDir}`;
}

/**
 * Checks if the given text is a valid geo: URI
 * @param text - The text to validate
 * @returns Whether the text is a valid geo: URI
 */
export function isValidGeoUri(text: string): boolean {
  const result = detectGeoUri(text);
  return result.isGeo;
}
