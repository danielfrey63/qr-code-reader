/**
 * Content action types and interfaces
 * Defines actions that can be suggested based on scanned QR code content
 */

/**
 * Types of actions that can be performed on scanned content
 */
export type ContentActionType =
  | 'OPEN_URL'
  | 'SEARCH_WEB'
  | 'SEND_EMAIL'
  | 'CALL_PHONE'
  | 'SEND_SMS'
  | 'OPEN_MAPS'
  | 'COPY_CLIPBOARD'
  | 'OPEN_PAYMENT';

/**
 * A suggested action for scanned content
 */
export interface ContentAction {
  /** The type of action */
  type: ContentActionType;
  /** Display label for the action button */
  label: string;
  /** Short description of what the action does */
  description: string;
  /** The target URL or URI for the action */
  actionUrl: string;
  /** Whether user confirmation is required before executing */
  requiresConfirmation: boolean;
  /** Confirmation message to show to the user */
  confirmationMessage?: string;
  /** Whether this is the primary/recommended action */
  isPrimary?: boolean;
}

/**
 * State for managing search action confirmation flow
 */
export type SearchActionState = 'idle' | 'confirming' | 'searching';

/**
 * State for managing payment action confirmation flow
 */
export type PaymentActionState = 'idle' | 'confirming' | 'opening';

/**
 * Creates a "Search the web" action for plain text content
 * @param text - The text to search for
 * @param searchUrl - The pre-generated search URL
 * @returns ContentAction for web search
 */
export function createSearchWebAction(text: string, searchUrl: string): ContentAction {
  // Truncate text for display if too long
  const displayText = text.length > 50 ? text.substring(0, 47) + '...' : text;

  return {
    type: 'SEARCH_WEB',
    label: 'Search the Web',
    description: `Search for "${displayText}" online`,
    actionUrl: searchUrl,
    requiresConfirmation: true,
    confirmationMessage: `Do you want to search the web for "${displayText}"? This will open your browser.`,
    isPrimary: false,
  };
}
