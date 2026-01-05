/**
 * WebAuthn Validation Utilities
 * 
 * Functions to validate WebAuthn environment requirements.
 * Checks for browser support, HTTPS/localhost requirements, etc.
 * 
 * @example
 * ```tsx
 * const validation = validateWebAuthnEnvironment();
 * if (!validation.isValid) {
 *   alert(validation.error);
 *   return;
 * }
 * ```
 */

export interface WebAuthnValidationResult {
  /**
   * Whether the environment is valid for WebAuthn
   */
  isValid: boolean;
  
  /**
   * Error message if validation failed
   */
  error?: string;
}

/**
 * Check if WebAuthn/PublicKeyCredential is supported in the current browser
 * 
 * @returns Validation result with error message if not supported
 */
export function validateWebAuthnSupport(): WebAuthnValidationResult {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return {
      isValid: false,
      error: 'WebAuthn requires a browser environment.',
    };
  }

  // Check if PublicKeyCredential API is available
  if (!window.PublicKeyCredential) {
    return {
      isValid: false,
      error:
        'WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Safari, Firefox, or Edge.',
    };
  }

  return { isValid: true };
}

/**
 * Check if the current environment meets HTTPS requirement
 * 
 * Note: While passkey authentication may work on http://localhost,
 * transactions require HTTPS. This function validates HTTPS for transaction support.
 * 
 * @returns Validation result with error message if requirement not met
 */
export function validateHttpsOrLocalhost(): WebAuthnValidationResult {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return {
      isValid: false,
      error: 'WebAuthn requires a browser environment.',
    };
  }

  const { protocol, hostname } = window.location;

  // Allow HTTPS (required for transactions)
  if (protocol === 'https:') {
    return { isValid: true };
  }

  // Allow localhost and 127.0.0.1 for basic passkey auth
  // Note: Transactions will still require HTTPS
  if (
    protocol === 'http:' &&
    (hostname === 'localhost' || hostname === '127.0.0.1')
  ) {
    return { 
      isValid: true,
      // Warning: transactions require HTTPS
    };
  }

  // Not HTTPS and not localhost
  return {
    isValid: false,
    error:
      'Transactions require HTTPS. Please use https://localhost:3000 (run "npm run dev:https") or deploy to a service with HTTPS.',
  };
}

/**
 * Combined validation: Check both WebAuthn support and HTTPS/localhost requirement
 * 
 * @returns Validation result with error message if any check fails
 */
export function validateWebAuthnEnvironment(): WebAuthnValidationResult {
  // First check WebAuthn support
  const supportCheck = validateWebAuthnSupport();
  if (!supportCheck.isValid) {
    return supportCheck;
  }

  // Then check HTTPS/localhost requirement
  const httpsCheck = validateHttpsOrLocalhost();
  if (!httpsCheck.isValid) {
    return httpsCheck;
  }

  // All checks passed
  return { isValid: true };
}

