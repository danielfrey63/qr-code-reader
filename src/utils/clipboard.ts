/**
 * Clipboard utility functions
 */

/**
 * Copy text to clipboard with fallback for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern approach using Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed:', err);
      // Fall through to legacy approach
    }
  }

  // Legacy fallback for older browsers or insecure contexts
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Avoid scrolling to bottom
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    return successful;
  } catch (err) {
    console.error('Legacy clipboard method failed:', err);
    return false;
  }
}
