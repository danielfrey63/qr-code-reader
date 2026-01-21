/**
 * Type-safe localStorage utility functions with error handling,
 * JSON serialization, and storage quota management.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for operations that may fail
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: StorageError }

/**
 * Storage error types for granular error handling
 */
export type StorageErrorType =
  | 'NOT_AVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'PARSE_ERROR'
  | 'SERIALIZE_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN'

/**
 * Structured storage error
 */
export interface StorageError {
  type: StorageErrorType
  message: string
  originalError?: unknown
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number
  available: number
  total: number
  usagePercentage: number
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Estimated localStorage limit (5MB is typical for most browsers)
 */
const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 // 5MB

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a storage error object
 */
function createError(
  type: StorageErrorType,
  message: string,
  originalError?: unknown
): StorageError {
  return { type, message, originalError }
}

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// Core Storage Operations
// ============================================================================

/**
 * Retrieves and parses a value from localStorage with type safety
 *
 * @param key - The storage key
 * @returns StorageResult containing the parsed value or an error
 *
 * @example
 * const result = getItem<User>('user')
 * if (result.success) {
 *   console.log(result.data.name)
 * } else {
 *   console.error(result.error.message)
 * }
 */
export function getItem<T>(key: string): StorageResult<T> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: createError('NOT_AVAILABLE', 'localStorage is not available')
    }
  }

  try {
    const item = window.localStorage.getItem(key)

    if (item === null) {
      return {
        success: false,
        error: createError('NOT_FOUND', `Key "${key}" not found in storage`)
      }
    }

    const parsed = JSON.parse(item) as T
    return { success: true, data: parsed }
  } catch (error) {
    return {
      success: false,
      error: createError(
        'PARSE_ERROR',
        `Failed to parse value for key "${key}"`,
        error
      )
    }
  }
}

/**
 * Retrieves a value from localStorage with a default fallback
 *
 * @param key - The storage key
 * @param defaultValue - Value to return if key doesn't exist or on error
 * @returns The stored value or the default value
 *
 * @example
 * const theme = getItemWithDefault('theme', 'light')
 */
export function getItemWithDefault<T>(key: string, defaultValue: T): T {
  const result = getItem<T>(key)
  return result.success ? result.data : defaultValue
}

/**
 * Stores a value in localStorage with JSON serialization
 *
 * @param key - The storage key
 * @param value - The value to store (will be JSON serialized)
 * @returns StorageResult indicating success or failure
 *
 * @example
 * const result = setItem('user', { name: 'John', age: 30 })
 * if (!result.success) {
 *   if (result.error.type === 'QUOTA_EXCEEDED') {
 *     // Handle quota exceeded
 *   }
 * }
 */
export function setItem<T>(key: string, value: T): StorageResult<void> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: createError('NOT_AVAILABLE', 'localStorage is not available')
    }
  }

  try {
    const serialized = JSON.stringify(value)
    window.localStorage.setItem(key, serialized)
    return { success: true, data: undefined }
  } catch (error) {
    // Check for quota exceeded error
    if (
      error instanceof DOMException &&
      (error.code === 22 || // Legacy code
        error.code === 1014 || // Firefox
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return {
        success: false,
        error: createError(
          'QUOTA_EXCEEDED',
          'localStorage quota exceeded',
          error
        )
      }
    }

    // Check for serialization errors
    if (error instanceof TypeError) {
      return {
        success: false,
        error: createError(
          'SERIALIZE_ERROR',
          `Failed to serialize value for key "${key}"`,
          error
        )
      }
    }

    return {
      success: false,
      error: createError('UNKNOWN', 'Unknown storage error occurred', error)
    }
  }
}

/**
 * Removes an item from localStorage
 *
 * @param key - The storage key to remove
 * @returns StorageResult indicating success or failure
 */
export function removeItem(key: string): StorageResult<void> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: createError('NOT_AVAILABLE', 'localStorage is not available')
    }
  }

  try {
    window.localStorage.removeItem(key)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: createError('UNKNOWN', `Failed to remove key "${key}"`, error)
    }
  }
}

/**
 * Clears all items from localStorage
 *
 * @returns StorageResult indicating success or failure
 */
export function clearStorage(): StorageResult<void> {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: createError('NOT_AVAILABLE', 'localStorage is not available')
    }
  }

  try {
    window.localStorage.clear()
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: createError('UNKNOWN', 'Failed to clear storage', error)
    }
  }
}

// ============================================================================
// Storage Quota Management
// ============================================================================

/**
 * Gets the current storage usage in bytes
 *
 * @returns The total bytes used in localStorage
 */
export function getStorageUsage(): number {
  if (!isStorageAvailable()) {
    return 0
  }

  let totalBytes = 0

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        const value = window.localStorage.getItem(key) ?? ''
        // Each character is 2 bytes in JavaScript strings (UTF-16)
        totalBytes += (key.length + value.length) * 2
      }
    }
  } catch {
    // If enumeration fails, return 0
    return 0
  }

  return totalBytes
}

/**
 * Gets the size of a specific key in bytes
 *
 * @param key - The storage key
 * @returns The size in bytes, or 0 if the key doesn't exist
 */
export function getItemSize(key: string): number {
  if (!isStorageAvailable()) {
    return 0
  }

  try {
    const value = window.localStorage.getItem(key)
    if (value === null) {
      return 0
    }
    return (key.length + value.length) * 2
  } catch {
    return 0
  }
}

/**
 * Gets detailed storage quota information
 *
 * @returns StorageQuota object with usage statistics
 */
export function getStorageQuota(): StorageQuota {
  const used = getStorageUsage()
  const total = STORAGE_LIMIT_BYTES
  const available = Math.max(0, total - used)
  const usagePercentage = (used / total) * 100

  return {
    used,
    available,
    total,
    usagePercentage: Math.round(usagePercentage * 100) / 100
  }
}

/**
 * Checks if there's enough space to store a value
 *
 * @param value - The value to check (will be serialized to measure size)
 * @returns true if there's enough space, false otherwise
 */
export function hasEnoughSpace<T>(value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    const requiredBytes = serialized.length * 2
    const quota = getStorageQuota()
    return requiredBytes < quota.available
  } catch {
    return false
  }
}

/**
 * Attempts to free up space by removing old items
 * Uses a callback to determine which items can be removed
 *
 * @param bytesNeeded - Number of bytes to free
 * @param canRemove - Callback to determine if a key can be removed
 * @returns The number of bytes freed
 */
export function freeUpSpace(
  bytesNeeded: number,
  canRemove: (key: string) => boolean
): number {
  if (!isStorageAvailable()) {
    return 0
  }

  let freedBytes = 0
  const keysToRemove: string[] = []

  try {
    // Collect keys that can be removed
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && canRemove(key)) {
        keysToRemove.push(key)
      }
    }

    // Remove keys until we've freed enough space
    for (const key of keysToRemove) {
      if (freedBytes >= bytesNeeded) {
        break
      }

      const size = getItemSize(key)
      window.localStorage.removeItem(key)
      freedBytes += size
    }
  } catch {
    // Return whatever we managed to free
  }

  return freedBytes
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets all keys in localStorage
 *
 * @returns Array of all storage keys
 */
export function getAllKeys(): string[] {
  if (!isStorageAvailable()) {
    return []
  }

  const keys: string[] = []

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key) {
        keys.push(key)
      }
    }
  } catch {
    return []
  }

  return keys
}

/**
 * Gets all keys that match a prefix
 *
 * @param prefix - The prefix to match
 * @returns Array of matching keys
 *
 * @example
 * const scanKeys = getKeysByPrefix('scan_')
 */
export function getKeysByPrefix(prefix: string): string[] {
  return getAllKeys().filter((key) => key.startsWith(prefix))
}

/**
 * Checks if a key exists in localStorage
 *
 * @param key - The key to check
 * @returns true if the key exists
 */
export function hasKey(key: string): boolean {
  if (!isStorageAvailable()) {
    return false
  }

  try {
    return window.localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

/**
 * Sets an item with automatic quota management
 * If quota is exceeded, attempts to free space using the provided callback
 *
 * @param key - The storage key
 * @param value - The value to store
 * @param canRemove - Callback to determine which keys can be removed to free space
 * @returns StorageResult indicating success or failure
 */
export function setItemWithQuotaManagement<T>(
  key: string,
  value: T,
  canRemove: (key: string) => boolean
): StorageResult<void> {
  // First attempt to set the item
  let result = setItem(key, value)

  if (result.success) {
    return result
  }

  // If quota exceeded, try to free up space
  if (result.error.type === 'QUOTA_EXCEEDED') {
    try {
      const serialized = JSON.stringify(value)
      const bytesNeeded = serialized.length * 2

      const freedBytes = freeUpSpace(bytesNeeded, canRemove)

      if (freedBytes >= bytesNeeded) {
        // Retry after freeing space
        result = setItem(key, value)
        return result
      }
    } catch {
      // Fall through to return original error
    }
  }

  return result
}
