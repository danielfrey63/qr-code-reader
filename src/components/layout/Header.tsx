import { QRCodeIcon } from '../icons/QRCodeIcon';
import '../icons/QRCodeIcon.css';
import './Header.css';

interface HeaderProps {
  /** Main title text */
  title?: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Optional left action element (e.g., back button) */
  leftAction?: React.ReactNode;
  /** Optional right action element (e.g., settings button) */
  rightAction?: React.ReactNode;
}

/**
 * Header component with app branding and optional actions.
 * Designed as a compact, non-intrusive header that doesn't
 * distract from the camera viewfinder experience.
 */
export function Header({
  title = 'QR Code Reader',
  subtitle,
  leftAction,
  rightAction,
}: HeaderProps) {
  return (
    <header className="header" data-testid="app-header">
      <div className="header__container">
        {/* Left action slot */}
        {leftAction && (
          <div className="header__action header__action--left">
            {leftAction}
          </div>
        )}

        {/* Title and branding */}
        <div className="header__branding">
          <div className="header__title-row">
            <QRCodeIcon className="header__icon" size="small" data-testid="header-icon" />
            <h1 className="header__title">{title}</h1>
          </div>
          {subtitle && (
            <p className="header__subtitle">{subtitle}</p>
          )}
        </div>

        {/* Right action slot */}
        {rightAction && (
          <div className="header__action header__action--right">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
