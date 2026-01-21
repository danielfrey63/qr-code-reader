/**
 * Theme Toggle Component
 *
 * A simple cycle-through button that allows users to switch between light, dark, and system themes.
 * Cycles through: light → dark → system → light
 * Displays the current theme's icon (sun for light, moon for dark, monitor for system).
 */

import { useTheme, type Theme } from '@/contexts/ThemeContext';
import './ThemeToggle.css';

// ============================================================================
// Icons
// ============================================================================

/**
 * Sun icon for light mode
 */
function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

/**
 * Moon icon for dark mode
 */
function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/**
 * Monitor/System icon for system preference
 */
function MonitorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

// ============================================================================
// Theme Cycle Order
// ============================================================================

/**
 * Theme cycle order: light → dark → system → light
 */
const themeCycleOrder: Theme[] = ['light', 'dark', 'system'];

/**
 * Get the next theme in the cycle
 */
function getNextTheme(currentTheme: Theme): Theme {
  const currentIndex = themeCycleOrder.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeCycleOrder.length;
  return themeCycleOrder[nextIndex];
}

/**
 * Get the icon component for a theme
 */
function getThemeIcon(theme: Theme): React.ReactNode {
  switch (theme) {
    case 'light':
      return <SunIcon />;
    case 'dark':
      return <MoonIcon />;
    case 'system':
      return <MonitorIcon />;
  }
}

/**
 * Get the label for a theme (for accessibility)
 */
function getThemeLabel(theme: Theme): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System';
  }
}

// ============================================================================
// Component
// ============================================================================

export interface ThemeToggleProps {
  /** Additional CSS class name */
  className?: string;
}

/**
 * Theme Toggle Component
 *
 * Renders a simple button that cycles through theme options on click.
 * Cycles: light → dark → system → light
 * Shows the current theme's icon (sun, moon, or monitor).
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  // Get the icon for the current theme preference (not effective theme)
  const currentIcon = getThemeIcon(theme);
  const currentLabel = getThemeLabel(theme);
  const nextTheme = getNextTheme(theme);
  const nextLabel = getThemeLabel(nextTheme);

  const handleClick = () => {
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`theme-toggle ${className}`}
      aria-label={`Theme: ${currentLabel}. Click to switch to ${nextLabel}.`}
      data-testid="theme-toggle-button"
    >
      {currentIcon}
    </button>
  );
}

export default ThemeToggle;
