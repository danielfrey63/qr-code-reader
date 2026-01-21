/**
 * Theme Toggle Component
 *
 * A dropdown button that allows users to switch between light, dark, and system themes.
 * Displays the current effective theme with an appropriate icon.
 */

import { useState, useRef, useEffect } from 'react';
import { useTheme, type Theme } from '@/contexts/ThemeContext';

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

/**
 * Check icon for selected item
 */
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ============================================================================
// Theme Options
// ============================================================================

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
];

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
 * Renders a button that opens a dropdown menu for theme selection.
 * Shows the current theme's icon and allows switching between light, dark, and system.
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get the icon for the current effective theme
  const currentIcon = effectiveTheme === 'dark' ? <MoonIcon /> : <SunIcon />;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`theme-toggle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle__button"
        aria-label={`Current theme: ${effectiveTheme}. Click to change theme.`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        data-testid="theme-toggle-button"
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          className="theme-toggle__dropdown"
          role="listbox"
          aria-label="Select theme"
          data-testid="theme-dropdown"
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={theme === option.value}
              onClick={() => handleThemeSelect(option.value)}
              className={`theme-toggle__option ${theme === option.value ? 'theme-toggle__option--selected' : ''}`}
              data-testid={`theme-option-${option.value}`}
            >
              <span className="theme-toggle__option-icon">{option.icon}</span>
              <span className="theme-toggle__option-label">{option.label}</span>
              {theme === option.value && (
                <span className="theme-toggle__option-check">
                  <CheckIcon />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
