/**
 * Header Navigation Component
 *
 * A responsive navigation component for the header that includes:
 * - History button with badge
 * - Settings button
 * - Theme toggle dropdown
 *
 * Uses Lucide React icons for consistent iconography.
 */

import { History, Settings } from 'lucide-react';
import { useScanHistory } from '../../hooks/useScanHistory';
import { ThemeToggle } from '../ThemeToggle';
import './HeaderNavigation.css';

// ============================================================================
// Component Props
// ============================================================================

export interface HeaderNavigationProps {
  /** Callback when history button is clicked */
  onHistoryClick: () => void;
  /** Callback when settings button is clicked */
  onSettingsClick: () => void;
  /** Additional CSS class name */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Header Navigation Component
 *
 * Renders a set of navigation buttons for the app header.
 * Includes history, settings, and theme toggle functionality.
 */
export function HeaderNavigation({
  onHistoryClick,
  onSettingsClick,
  className = '',
}: HeaderNavigationProps) {
  const { count } = useScanHistory();

  return (
    <nav
      className={`header-navigation ${className}`}
      aria-label="Main navigation"
      data-testid="header-navigation"
    >
      {/* History Button */}
      <button
        type="button"
        onClick={onHistoryClick}
        className="header-navigation__button"
        aria-label={`View scan history${count > 0 ? ` (${count} items)` : ''}`}
        data-testid="header-nav-history-button"
      >
        <History size={20} aria-hidden="true" />
        {count > 0 && (
          <span
            className="header-navigation__badge"
            data-testid="header-nav-history-badge"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Settings Button */}
      <button
        type="button"
        onClick={onSettingsClick}
        className="header-navigation__button header-navigation__button--settings"
        aria-label="Open settings"
        data-testid="header-nav-settings-button"
      >
        <Settings size={20} aria-hidden="true" />
      </button>

      {/* Theme Toggle */}
      <ThemeToggle />
    </nav>
  );
}

export default HeaderNavigation;
