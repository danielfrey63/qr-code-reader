import { ReactNode } from 'react';
import './ViewfinderOverlay.css';

interface ViewfinderOverlayProps {
  /** Child components to display in the overlay */
  children?: ReactNode;
  /** Position of the overlay content */
  position?: 'top' | 'center' | 'bottom';
  /** Whether the overlay should be visible */
  visible?: boolean;
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Whether to show a gradient background for better text readability */
  showGradient?: boolean;
  /** Overlay variant for different use cases */
  variant?: 'default' | 'status' | 'controls' | 'result';
}

/**
 * ViewfinderOverlay component for displaying content over the camera viewfinder.
 * Supports different positions and variants for status messages, controls, and results.
 * The overlay is designed to be non-intrusive while maintaining readability.
 */
export function ViewfinderOverlay({
  children,
  position = 'bottom',
  visible = true,
  className = '',
  showGradient = false,
  variant = 'default',
}: ViewfinderOverlayProps) {
  if (!visible) return null;

  const overlayClasses = [
    'viewfinder-overlay',
    `viewfinder-overlay--${position}`,
    `viewfinder-overlay--${variant}`,
    showGradient ? 'viewfinder-overlay--gradient' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} data-testid="viewfinder-overlay">
      <div className="viewfinder-overlay__content">
        {children}
      </div>
    </div>
  );
}

/**
 * Pre-configured overlay for status messages at the top
 */
export function StatusOverlay({ children, visible = true }: { children: ReactNode; visible?: boolean }) {
  return (
    <ViewfinderOverlay position="top" variant="status" visible={visible} showGradient>
      {children}
    </ViewfinderOverlay>
  );
}

/**
 * Pre-configured overlay for controls at the bottom
 */
export function ControlsOverlay({ children, visible = true }: { children: ReactNode; visible?: boolean }) {
  return (
    <ViewfinderOverlay position="bottom" variant="controls" visible={visible} showGradient>
      {children}
    </ViewfinderOverlay>
  );
}

/**
 * Pre-configured overlay for centered content (results, modals)
 */
export function CenterOverlay({ children, visible = true }: { children: ReactNode; visible?: boolean }) {
  return (
    <ViewfinderOverlay position="center" variant="result" visible={visible}>
      {children}
    </ViewfinderOverlay>
  );
}

export default ViewfinderOverlay;
