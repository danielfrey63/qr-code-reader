/**
 * Payment URI Detection utility functions
 * Detects cryptocurrency and payment URIs (bitcoin:, lightning:, ethereum:, upi:, etc.)
 * and provides warning information for user confirmation before opening.
 */

/**
 * Supported payment URI schemes
 */
export type PaymentScheme =
  | 'bitcoin'
  | 'lightning'
  | 'ethereum'
  | 'upi'
  | 'paypal'
  | 'venmo'
  | 'cashapp';

/**
 * Result of payment URI detection
 */
export interface PaymentUriDetectionResult {
  /** Whether a valid payment URI pattern was detected */
  isPayment: boolean;
  /** The detected payment scheme (only present if isPayment is true) */
  scheme?: PaymentScheme;
  /** The parsed payment data (only present if isPayment is true) */
  data?: PaymentUriData;
  /** The original raw value */
  rawValue: string;
}

/**
 * Parsed data from a payment URI
 */
export interface PaymentUriData {
  /** The payment scheme (e.g., 'bitcoin', 'lightning', 'upi') */
  scheme: PaymentScheme;
  /** The payment address or identifier */
  address: string;
  /** The amount to pay (if specified in URI) */
  amount?: string;
  /** A label for the payment (if specified in URI) */
  label?: string;
  /** A message/description for the payment (if specified in URI) */
  message?: string;
  /** The original full URI */
  uri: string;
  /** Human-readable display name for the payment type */
  displayName: string;
  /** Warning message to show before opening */
  warningMessage: string;
}

/**
 * Regular expression patterns for payment URI detection
 */

// Bitcoin URI: bitcoin:address?amount=x&label=y&message=z
// BIP-21 format
const BITCOIN_URI_PATTERN = /^bitcoin:([a-zA-Z0-9]{25,62})(\?.*)?$/i;

// Lightning Network: lightning:invoice or LNURL
const LIGHTNING_URI_PATTERN = /^lightning:([a-zA-Z0-9]+)(\?.*)?$/i;

// Ethereum URI: ethereum:address@chainId?value=x
// EIP-681 format
const ETHEREUM_URI_PATTERN = /^ethereum:(0x[a-fA-F0-9]{40})(@\d+)?(\?.*)?$/i;

// UPI (Unified Payments Interface - India): upi://pay?pa=address&pn=name&am=amount
const UPI_URI_PATTERN = /^upi:\/\/pay\?(.+)$/i;

// PayPal.me links (converted to paypal: scheme internally)
const PAYPAL_URI_PATTERN = /^paypal(?:\.me)?:?\/?\/?([a-zA-Z0-9._-]+)\/?(\?.*)?$/i;

// Venmo deep link
const VENMO_URI_PATTERN = /^venmo:\/\/([a-zA-Z0-9._-]+)(\?.*)?$/i;

// Cash App: $cashtag or cash.app/$cashtag
const CASHAPP_URI_PATTERN = /^(?:cash(?:app)?:\/\/|cash\.app\/)?(\$[a-zA-Z0-9_-]+)(\?.*)?$/i;

/**
 * Payment scheme display names
 */
const SCHEME_DISPLAY_NAMES: Record<PaymentScheme, string> = {
  bitcoin: 'Bitcoin Payment',
  lightning: 'Lightning Network Payment',
  ethereum: 'Ethereum Payment',
  upi: 'UPI Payment',
  paypal: 'PayPal Payment',
  venmo: 'Venmo Payment',
  cashapp: 'Cash App Payment',
};

/**
 * Payment scheme warning messages
 */
const SCHEME_WARNING_MESSAGES: Record<PaymentScheme, string> = {
  bitcoin: 'This will open a Bitcoin wallet app. Verify the address and amount before sending any funds. Cryptocurrency transactions are irreversible.',
  lightning: 'This will open a Lightning Network wallet. Verify the invoice details before paying. Lightning payments are instant and irreversible.',
  ethereum: 'This will open an Ethereum wallet app. Verify the address and amount before sending any funds. Cryptocurrency transactions are irreversible.',
  upi: 'This will open your UPI payment app. Verify the recipient details and amount before confirming the payment.',
  paypal: 'This will open PayPal to send money. Verify the recipient before proceeding with the payment.',
  venmo: 'This will open Venmo to send money. Verify the recipient before proceeding with the payment.',
  cashapp: 'This will open Cash App to send money. Verify the recipient before proceeding with the payment.',
};

/**
 * Detects if the given text is a payment URI
 * @param text - The text to analyze
 * @returns PaymentUriDetectionResult with detection details
 */
export function detectPaymentUri(text: string): PaymentUriDetectionResult {
  const trimmedText = text.trim();

  // Try to detect each payment scheme
  const bitcoinResult = detectBitcoinUri(trimmedText);
  if (bitcoinResult.isPayment) return bitcoinResult;

  const lightningResult = detectLightningUri(trimmedText);
  if (lightningResult.isPayment) return lightningResult;

  const ethereumResult = detectEthereumUri(trimmedText);
  if (ethereumResult.isPayment) return ethereumResult;

  const upiResult = detectUpiUri(trimmedText);
  if (upiResult.isPayment) return upiResult;

  const paypalResult = detectPayPalUri(trimmedText);
  if (paypalResult.isPayment) return paypalResult;

  const venmoResult = detectVenmoUri(trimmedText);
  if (venmoResult.isPayment) return venmoResult;

  const cashappResult = detectCashAppUri(trimmedText);
  if (cashappResult.isPayment) return cashappResult;

  // No payment URI detected
  return {
    isPayment: false,
    rawValue: trimmedText,
  };
}

/**
 * Detects Bitcoin URI (BIP-21)
 */
function detectBitcoinUri(text: string): PaymentUriDetectionResult {
  const match = text.match(BITCOIN_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const address = match[1];
  const queryString = match[2]?.substring(1) || '';
  const params = parseQueryParams(queryString);

  return {
    isPayment: true,
    scheme: 'bitcoin',
    rawValue: text,
    data: {
      scheme: 'bitcoin',
      address,
      amount: params.amount,
      label: params.label,
      message: params.message,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.bitcoin,
      warningMessage: SCHEME_WARNING_MESSAGES.bitcoin,
    },
  };
}

/**
 * Detects Lightning Network URI
 */
function detectLightningUri(text: string): PaymentUriDetectionResult {
  const match = text.match(LIGHTNING_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const invoice = match[1];

  return {
    isPayment: true,
    scheme: 'lightning',
    rawValue: text,
    data: {
      scheme: 'lightning',
      address: invoice,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.lightning,
      warningMessage: SCHEME_WARNING_MESSAGES.lightning,
    },
  };
}

/**
 * Detects Ethereum URI (EIP-681)
 */
function detectEthereumUri(text: string): PaymentUriDetectionResult {
  const match = text.match(ETHEREUM_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const address = match[1];
  const queryString = match[3]?.substring(1) || '';
  const params = parseQueryParams(queryString);

  return {
    isPayment: true,
    scheme: 'ethereum',
    rawValue: text,
    data: {
      scheme: 'ethereum',
      address,
      amount: params.value,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.ethereum,
      warningMessage: SCHEME_WARNING_MESSAGES.ethereum,
    },
  };
}

/**
 * Detects UPI URI
 */
function detectUpiUri(text: string): PaymentUriDetectionResult {
  const match = text.match(UPI_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const queryString = match[1];
  const params = parseQueryParams(queryString);

  return {
    isPayment: true,
    scheme: 'upi',
    rawValue: text,
    data: {
      scheme: 'upi',
      address: params.pa || '', // pa = payee address (VPA)
      amount: params.am,
      label: params.pn, // pn = payee name
      message: params.tn, // tn = transaction note
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.upi,
      warningMessage: SCHEME_WARNING_MESSAGES.upi,
    },
  };
}

/**
 * Detects PayPal URI or PayPal.me link
 */
function detectPayPalUri(text: string): PaymentUriDetectionResult {
  const match = text.match(PAYPAL_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const username = match[1];

  return {
    isPayment: true,
    scheme: 'paypal',
    rawValue: text,
    data: {
      scheme: 'paypal',
      address: username,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.paypal,
      warningMessage: SCHEME_WARNING_MESSAGES.paypal,
    },
  };
}

/**
 * Detects Venmo URI
 */
function detectVenmoUri(text: string): PaymentUriDetectionResult {
  const match = text.match(VENMO_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const username = match[1];

  return {
    isPayment: true,
    scheme: 'venmo',
    rawValue: text,
    data: {
      scheme: 'venmo',
      address: username,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.venmo,
      warningMessage: SCHEME_WARNING_MESSAGES.venmo,
    },
  };
}

/**
 * Detects Cash App URI or $cashtag
 */
function detectCashAppUri(text: string): PaymentUriDetectionResult {
  const match = text.match(CASHAPP_URI_PATTERN);
  if (!match) {
    return { isPayment: false, rawValue: text };
  }

  const cashtag = match[1];

  return {
    isPayment: true,
    scheme: 'cashapp',
    rawValue: text,
    data: {
      scheme: 'cashapp',
      address: cashtag,
      uri: text,
      displayName: SCHEME_DISPLAY_NAMES.cashapp,
      warningMessage: SCHEME_WARNING_MESSAGES.cashapp,
    },
  };
}

/**
 * Parse URL query parameters
 */
function parseQueryParams(queryString: string): Record<string, string> {
  if (!queryString) return {};

  const params: Record<string, string> = {};
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      try {
        params[key] = decodeURIComponent(value);
      } catch {
        params[key] = value;
      }
    }
  }

  return params;
}

/**
 * Get the display name for a payment scheme
 * @param scheme - The payment scheme
 * @returns Human-readable display name
 */
export function getPaymentSchemeDisplayName(scheme: PaymentScheme): string {
  return SCHEME_DISPLAY_NAMES[scheme] || 'Payment';
}

/**
 * Get the warning message for a payment scheme
 * @param scheme - The payment scheme
 * @returns Warning message to display before opening
 */
export function getPaymentWarningMessage(scheme: PaymentScheme): string {
  return SCHEME_WARNING_MESSAGES[scheme] || 'Verify the payment details before proceeding.';
}

/**
 * Format payment address for display (truncate long addresses)
 * @param address - The payment address
 * @param maxLength - Maximum display length (default 20)
 * @returns Truncated address for display
 */
export function formatPaymentAddressForDisplay(address: string, maxLength = 20): string {
  if (address.length <= maxLength) return address;

  const start = address.substring(0, Math.ceil(maxLength / 2));
  const end = address.substring(address.length - Math.floor(maxLength / 2));
  return `${start}...${end}`;
}

/**
 * Format payment amount for display
 * @param amount - The amount string
 * @param scheme - The payment scheme (for currency symbol)
 * @returns Formatted amount string
 */
export function formatPaymentAmountForDisplay(amount: string, scheme: PaymentScheme): string {
  if (!amount) return '';

  const currencySymbols: Partial<Record<PaymentScheme, string>> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    upi: 'INR',
  };

  const symbol = currencySymbols[scheme];
  return symbol ? `${amount} ${symbol}` : amount;
}

/**
 * Checks if the given text is a valid payment URI
 * @param text - The text to validate
 * @returns Whether the text is a valid payment URI
 */
export function isValidPaymentUri(text: string): boolean {
  return detectPaymentUri(text).isPayment;
}
