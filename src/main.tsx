import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ToastContainer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { registerServiceWorker } from './services/serviceWorkerRegistration'
import type { SpecificAppError } from './types/errors'

/**
 * Global error handler for the application
 * Logs errors and could be extended to send to error tracking service
 */
const handleGlobalError = (error: Error, appError: SpecificAppError) => {
  // Log to console in development
  console.error('Application error:', {
    error: error.message,
    code: appError.code,
    category: appError.category,
    timestamp: new Date(appError.timestamp).toISOString(),
  });

  // Here you could send to an error tracking service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(appError);
  // }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      onError={handleGlobalError}
      onReset={() => {
        // Clear any global state if needed
        console.log('Error boundary reset');
      }}
    >
      <ThemeProvider>
        <ToastProvider>
          <App />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker for offline-first functionality
registerServiceWorker({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully:', registration)
  },
  onUpdate: (registration) => {
    console.log('New content available, please refresh:', registration)
  },
  onError: (error) => {
    console.error('Service worker registration failed:', error)
  }
})
