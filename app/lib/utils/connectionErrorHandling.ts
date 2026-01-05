/**
 * Connection Error Handling Utilities
 * 
 * Functions to parse and handle connection-specific errors.
 * Focuses on WebAuthn/passkey connection errors that are different from
 * general transaction errors.
 * 
 * @example
 * ```tsx
 * try {
 *   await connect();
 * } catch (error) {
 *   const errorInfo = parseConnectionError(error);
 *   setError(errorInfo.userFriendly);
 * }
 * ```
 */

export interface ConnectionErrorInfo {
  /**
   * Original error message
   */
  message: string;
  
  /**
   * User-friendly error message
   */
  userFriendly: string;
  
  /**
   * Error code for programmatic handling
   */
  code?: string;
}

/**
 * Extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Parse connection-specific errors and return user-friendly messages
 * 
 * Handles WebAuthn/passkey connection errors like:
 * - Passkey creation failures
 * - NotAllowedError (user denied)
 * - NotSupportedError (browser/device doesn't support)
 * - InvalidStateError (passkey already exists)
 * 
 * @param error - The error object to parse
 * @returns Error information with user-friendly message
 */
export function parseConnectionError(error: unknown): ConnectionErrorInfo {
  const message = getErrorMessage(error);
  const errorObj = error as { message?: string; name?: string };

  // Passkey creation failure
  if (message.includes('passkeyPublicKey') || message.includes('passkey')) {
    return {
      message,
      userFriendly:
        'Passkey creation failed. Please ensure:\n• Your device supports biometric authentication (Face ID, Touch ID, Windows Hello)\n• You approve the biometric prompt when it appears\n• Your browser supports WebAuthn\n• You are not blocking the authentication prompt',
      code: 'PASSKEY_CREATION_FAILED',
    };
  }

  // User denied/canceled authentication
  if (message.includes('NotAllowedError') || errorObj?.name === 'NotAllowedError') {
    return {
      message,
      userFriendly:
        'Biometric authentication was canceled or denied. Please try again and approve the prompt.',
      code: 'NOT_ALLOWED',
    };
  }

  // Browser/device doesn't support WebAuthn
  if (message.includes('NotSupportedError') || errorObj?.name === 'NotSupportedError') {
    return {
      message,
      userFriendly:
        'Your device or browser does not support passkeys. Please use a device with Face ID, Touch ID, or Windows Hello.',
      code: 'NOT_SUPPORTED',
    };
  }

  // Passkey already exists (InvalidStateError)
  if (message.includes('InvalidStateError') || errorObj?.name === 'InvalidStateError') {
    return {
      message,
      userFriendly:
        'A passkey already exists. Please try disconnecting and reconnecting.',
      code: 'INVALID_STATE',
    };
  }

  // Connection timeout
  if (message.includes('timeout') || message.includes('Timeout')) {
    return {
      message,
      userFriendly:
        'Connection timed out. Please check your internet connection and try again.',
      code: 'TIMEOUT',
    };
  }

  // Network error
  if (message.includes('network') || message.includes('NetworkError')) {
    return {
      message,
      userFriendly:
        'Network error occurred. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }

  // Default: return original message
  return {
    message,
    userFriendly: message || 'Failed to connect wallet. Please try again.',
  };
}

