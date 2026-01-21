/**
 * Theme Context Provider
 *
 * Provides theme switching functionality (light/dark/system) with:
 * - localStorage persistence
 * - System theme detection via prefers-color-scheme
 * - CSS variable management via class on document root
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getItemWithDefault, setItem } from '@/utils/localStorage';

// ============================================================================
// Types
// ============================================================================

/**
 * Available theme options
 * - 'light': Always use light theme
 * - 'dark': Always use dark theme
 * - 'system': Follow system preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * The actual rendered theme (resolved from system preference if needed)
 */
export type EffectiveTheme = 'light' | 'dark';

/**
 * Theme context state values
 */
export interface ThemeContextState {
  /** The user's theme preference */
  theme: Theme;
  /** The actual theme being displayed (resolved from system if theme is 'system') */
  effectiveTheme: EffectiveTheme;
  /** Whether the system prefers dark mode */
  systemPrefersDark: boolean;
}

/**
 * Theme context actions
 */
export interface ThemeContextActions {
  /** Set the theme preference */
  setTheme: (theme: Theme) => void;
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void;
}

/**
 * Combined theme context value
 */
export type ThemeContextValue = ThemeContextState & ThemeContextActions;

// ============================================================================
// Constants
// ============================================================================

const THEME_STORAGE_KEY = 'qr-scanner-theme';
const DEFAULT_THEME: Theme = 'system';

// ============================================================================
// Context
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the system's preferred color scheme
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Resolves the effective theme based on user preference and system settings
 */
function resolveEffectiveTheme(theme: Theme, systemPrefersDark: boolean): EffectiveTheme {
  if (theme === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return theme;
}

/**
 * Applies the theme to the document root element
 * Uses 'dark' and 'light' classes to control CSS variables
 */
function applyThemeToDocument(effectiveTheme: EffectiveTheme): void {
  const root = document.documentElement;

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * Loads theme preference from localStorage
 */
function loadThemePreference(): Theme {
  const stored = getItemWithDefault<Theme>(THEME_STORAGE_KEY, DEFAULT_THEME);
  // Validate the stored value
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return DEFAULT_THEME;
}

/**
 * Saves theme preference to localStorage
 */
function saveThemePreference(theme: Theme): void {
  setItem(THEME_STORAGE_KEY, theme);
}

// ============================================================================
// Provider Component
// ============================================================================

export interface ThemeProviderProps {
  children: ReactNode;
  /** Optional default theme (defaults to 'system') */
  defaultTheme?: Theme;
}

/**
 * Theme Provider Component
 *
 * Wraps the application to provide theme context.
 * Handles localStorage persistence and system preference detection.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      return loadThemePreference();
    }
    return defaultTheme;
  });

  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return getSystemPreference();
  });

  // Calculate effective theme
  const effectiveTheme = resolveEffectiveTheme(theme, systemPrefersDark);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  }, [effectiveTheme, setTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Apply theme to document whenever effective theme changes
  useEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, [effectiveTheme]);

  // Apply theme immediately on mount (before first render completes)
  // This prevents flash of wrong theme
  useEffect(() => {
    applyThemeToDocument(effectiveTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: ThemeContextValue = {
    theme,
    effectiveTheme,
    systemPrefersDark,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access theme context
 *
 * @returns Theme context value with state and actions
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current: {effectiveTheme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export { ThemeContext };
