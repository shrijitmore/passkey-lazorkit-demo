/**
 * useWebAuthnConnection Hook
 * 
 * A custom hook that wraps wallet connection logic with WebAuthn validation.
 * Automatically validates the environment before attempting connection.
 * 
 * @example
 * ```tsx
 * const { connect, isConnecting, error, validateEnvironment } = useWebAuthnConnection();
 * 
 * const handleConnect = async () => {
 *   const validation = validateEnvironment();
 *   if (!validation.isValid) {
 *     setError(validation.error);
 *     return;
 *   }
 *   await connect();
 * };
 * ```
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  validateWebAuthnEnvironment,
  type WebAuthnValidationResult,
} from '../utils/webauthnValidation';
import { parseConnectionError } from '../utils/connectionErrorHandling';

interface UseWebAuthnConnectionReturn {
  /**
   * Connect wallet with automatic environment validation
   */
  connect: () => Promise<void>;
  
  /**
   * Whether connection is in progress
   */
  isConnecting: boolean;
  
  /**
   * Connection error message (if any)
   */
  error: string | null;
  
  /**
   * Validate WebAuthn environment without connecting
   * Useful for showing validation errors before attempting connection
   */
  validateEnvironment: () => WebAuthnValidationResult;
  
  /**
   * Clear the current error
   */
  clearError: () => void;
}

/**
 * Custom hook for WebAuthn wallet connection with validation
 * 
 * @returns Connection functions and state
 */
export function useWebAuthnConnection(): UseWebAuthnConnectionReturn {
  const { connect: connectWallet, isConnecting: walletIsConnecting } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Validate WebAuthn environment
   * Can be called independently to check environment before connecting
   */
  const validateEnvironment = useCallback((): WebAuthnValidationResult => {
    return validateWebAuthnEnvironment();
  }, []);

  /**
   * Connect wallet with automatic environment validation
   */
  const connect = useCallback(async () => {
    // Clear any previous errors
    setError(null);
    setIsConnecting(true);

    try {
      // Validate environment first
      const validation = validateWebAuthnEnvironment();
      if (!validation.isValid) {
        setError(validation.error || 'WebAuthn environment validation failed');
        return;
      }

      // Attempt connection
      await connectWallet();
    } catch (err: unknown) {
      // Parse connection-specific errors
      const errorInfo = parseConnectionError(err);
      setError(errorInfo.userFriendly);
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [connectWallet]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    connect,
    isConnecting: isConnecting || walletIsConnecting,
    error,
    validateEnvironment,
    clearError,
  };
}

