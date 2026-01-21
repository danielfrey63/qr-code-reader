/**
 * Service Worker Registration Utility
 * Handles registration, updates, and lifecycle of the service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isReady: boolean;
  registration: ServiceWorkerRegistration | null;
  error: Error | null;
}

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Check if we're in a secure context (required for service workers)
export function isSecureContext(): boolean {
  return window.isSecureContext === true ||
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  config: ServiceWorkerConfig = {}
): Promise<ServiceWorkerRegistration | null> {
  const { onSuccess, onUpdate, onError } = config;

  // Check for service worker support
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers are not supported in this browser');
    return null;
  }

  // Check for secure context
  if (!isSecureContext()) {
    console.log('[SW] Service workers require a secure context (HTTPS or localhost)');
    return null;
  }

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Handle successful registration
    if (registration.installing) {
      console.log('[SW] Service worker installing');
    } else if (registration.waiting) {
      console.log('[SW] Service worker installed and waiting');
      onUpdate?.(registration);
    } else if (registration.active) {
      console.log('[SW] Service worker active');
      onSuccess?.(registration);
    }

    // Listen for state changes
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;

      if (newWorker) {
        console.log('[SW] New service worker found');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, old content has been purged
              console.log('[SW] New content available; please refresh');
              onUpdate?.(registration);
            } else {
              // Content is cached for offline use
              console.log('[SW] Content is cached for offline use');
              onSuccess?.(registration);
            }
          }
        });
      }
    });

    return registration;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('[SW] Service worker registration failed:', err);
    onError?.(err);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();

    if (success) {
      console.log('[SW] Service worker unregistered successfully');
    }

    return success;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Get the current service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const status: ServiceWorkerStatus = {
    isSupported: isServiceWorkerSupported(),
    isRegistered: false,
    isReady: false,
    registration: null,
    error: null
  };

  if (!status.isSupported) {
    return status;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    status.isRegistered = registrations.length > 0;

    if (status.isRegistered) {
      status.registration = registrations[0];
      status.isReady = status.registration?.active !== null;
    }
  } catch (error) {
    status.error = error instanceof Error ? error : new Error('Unknown error');
  }

  return status;
}

/**
 * Check if a new service worker is waiting to activate
 */
export async function checkForUpdate(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return registration.waiting !== null;
  } catch (error) {
    console.error('[SW] Update check failed:', error);
    return false;
  }
}

/**
 * Skip waiting and activate the new service worker immediately
 */
export function skipWaiting(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Get cache status from the service worker
 */
export async function getCacheStatus(): Promise<Record<string, string[]> | null> {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    return null;
  }

  const controller = navigator.serviceWorker.controller;

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
    return true;
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
    return false;
  }
}
