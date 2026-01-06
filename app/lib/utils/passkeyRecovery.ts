/**
 * Passkey Cache Recovery Utility
 * 
 * Provides functions to detect and recover from passkey cache issues
 * that cause transaction size errors in LazorKit.
 * 
 * When passkey credentials are cached inconsistently, the paymaster pipeline
 * can create transactions that exceed Solana's 1232 byte limit. This utility
 * helps detect and recover from these issues automatically.
 */

/**
 * Transaction size error indicators
 */
const TRANSACTION_SIZE_ERROR_INDICATORS = [
  'Transaction too large',
  'too large',
  'exceeds Solana\'s 1232 byte limit',
  '1232 byte limit',
  'transaction size',
];

/**
 * Detects if an error is related to passkey cache issues causing transaction size errors
 * 
 * @param error - The error to check
 * @returns true if the error is a transaction size error likely caused by passkey cache issues
 * 
 * @example
 * ```ts
 * try {
 *   await signAndSendTransaction({ instructions });
 * } catch (error) {
 *   if (detectPasskeyCacheIssue(error)) {
 *     // Handle passkey cache issue
 *   }
 * }
 * ```
 */
export function detectPasskeyCacheIssue(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = 
    error instanceof Error 
      ? error.message 
      : typeof error === 'string'
      ? error
      : String(error);

  const lowerMessage = errorMessage.toLowerCase();

  // Check for transaction size errors
  const isTransactionSizeError = TRANSACTION_SIZE_ERROR_INDICATORS.some(
    (indicator) => lowerMessage.includes(indicator.toLowerCase())
  );

  // If it's a transaction size error, it's likely a passkey cache issue
  // (unless it's a genuine transaction that's too large, which is rare)
  return isTransactionSizeError;
}

/**
 * Recovery result interface
 */
export interface RecoveryResult {
  success: boolean;
  error?: string;
  message: string;
}

/**
 * Attempts automatic recovery from passkey cache issues
 * 
 * This function:
 * 1. Clears all application caches
 * 2. Disconnects the wallet
 * 3. Waits briefly
 * 4. Reconnects the wallet
 * 
 * @param disconnect - Function to disconnect the wallet
 * @param connect - Function to connect the wallet
 * @param walletAddress - Optional wallet address for cache clearing
 * @returns Promise resolving to recovery result
 * 
 * @example
 * ```ts
 * const result = await attemptAutoRecovery(
 *   () => disconnect(),
 *   () => connect(),
 *   smartWalletPubkey?.toString()
 * );
 * 
 * if (result.success) {
 *   // Retry transaction
 * }
 * ```
 */
export async function attemptAutoRecovery(
  disconnect: () => Promise<void>,
  connect: () => Promise<any>,
  walletAddress?: string
): Promise<RecoveryResult> {
  try {
    // Clear caches first
    if (typeof window !== 'undefined' && walletAddress) {
      // Dynamic import to avoid circular dependencies
      const { clearAllCaches } = await import('../cache/clearCache');
      clearAllCaches(walletAddress);
    }

    // Disconnect wallet
    await disconnect();
    
    // Wait for disconnect to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Reconnect wallet
    await connect();

    // Wait for connection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: 'Wallet reconnected successfully. You can now retry your transaction.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: errorMessage,
      message: `Recovery failed: ${errorMessage}. Please try disconnecting and reconnecting manually.`,
    };
  }
}


