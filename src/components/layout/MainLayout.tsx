import { ReactNode } from 'react';
import { Header } from './Header';
import './MainLayout.css';

export interface MainLayoutProps {
  /** Child components to render in the main content area */
  children: ReactNode;
  /** Optional title for the header */
  title?: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Whether to show the footer */
  showFooter?: boolean;
  /** Footer content */
  footerContent?: ReactNode;
  /** Optional left action element for header (e.g., back button) */
  headerLeftAction?: ReactNode;
  /** Optional right action element for header (e.g., settings button) */
  headerRightAction?: ReactNode;
}

/**
 * MainLayout component that provides the app's core structure
 * with header, camera viewfinder area, and overlay system.
 * Implements responsive design following single-screen pattern
 * with camera as the dominant element.
 */
export function MainLayout({
  children,
  title = 'QR Code Reader',
  subtitle,
  showHeader = true,
  showFooter = true,
  footerContent,
  headerLeftAction,
  headerRightAction,
}: MainLayoutProps) {
  return (
    <div className="main-layout" data-testid="main-layout">
      {/* Header with app branding */}
      {showHeader && (
        <Header
          title={title}
          subtitle={subtitle}
          leftAction={headerLeftAction}
          rightAction={headerRightAction}
        />
      )}

      {/* Main content area - camera viewfinder is the dominant element */}
      <main className="main-layout__content" data-testid="main-content">
        <div className="main-layout__viewfinder-container">
          {children}
        </div>
      </main>

      {/* Footer with privacy info */}
      {showFooter && (
        <footer className="main-layout__footer" data-testid="main-footer">
          {footerContent || (
            <p className="main-layout__footer-text">
              Privacy-first QR scanning - your data stays on your device
            </p>
          )}
        </footer>
      )}
    </div>
  );
}

export default MainLayout;
