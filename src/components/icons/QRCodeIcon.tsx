/**
 * QR Code Icon Component
 *
 * A reusable QR code icon used for app branding throughout the application.
 * Used in the Header title bar and Settings modal.
 */

interface QRCodeIconProps {
  /** Additional CSS class names */
  className?: string;
  /** Icon size variant */
  size?: 'small' | 'medium' | 'large';
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * QR Code Icon - represents a QR code pattern
 * Used for app branding in header and settings
 */
export function QRCodeIcon({ className = '', size = 'medium', 'data-testid': testId }: QRCodeIconProps) {
  const sizeClass = `qr-code-icon--${size}`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`qr-code-icon ${sizeClass} ${className}`.trim()}
      aria-hidden="true"
      data-testid={testId}
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

export default QRCodeIcon;
