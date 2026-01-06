/**
 * Custom hook for transaction signing with automatic credential refresh
 * Handles passkey credential inconsistency errors and retries with fresh credentials
 */

/**
 * useTransactionSigning Hook
 * 
 * A custom hook that wraps LazorKit's signAndSendTransaction with:
 * - Automatic credential refresh on passkey cache errors
 * - Retry logic for failed transactions
 * - Cache clearing before reconnect
 * - Automatic retry for transaction size errors
 * 
 * This hook handles the common issue where passkey credentials become
 * inconsistent, causing transaction failures. It automatically:
 * 1. Detects credential-related errors
 * 2. Clears all caches
 * 3. Disconnects and reconnects the wallet
 * 4. Retries the transaction
 * 
 * Usage:
 * ```tsx
 * const { signTransaction } = useTransactionSigning();
 * 
 * const signature = await signTransaction({
 *   instructions: [instruction],
 *   onError: (error) => console.error(error),
 * });
 * ```
 * 
 * @see Tutorial 2: Transactions for more details
 */
import { useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { TransactionInstruction } from '@solana/web3.js';
import { clearAllCaches } from '../cache/clearCache';
import { detectPasskeyCacheIssue, attemptAutoRecovery } from '../utils/passkeyRecovery';
import { isTransactionSizeError } from '../utils/errorHandling';

interface SignTransactionOptions {
  instructions: TransactionInstruction[];
  onError?: (error: Error) => void;
}

const CREDENTIAL_ERROR_INDICATORS = [
  'custom program error: 0x2',
  'Transaction simulation failed',
  'signature',
  'credential',
  'passkey',
];

const DISCONNECT_DELAY = 500;
const RECONNECT_DELAY = 1000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // Base delay for exponential backoff

/**
 * Check if error is due to passkey credential inconsistency
 */
function isCredentialError(error: unknown): boolean {
  const errorObj = error as { message?: string };
  const errorMessage = errorObj?.message || '';
  return CREDENTIAL_ERROR_INDICATORS.some((indicator) =>
    errorMessage.includes(indicator)
  );
}

/**
 * Refresh credentials by disconnecting and reconnecting
 */
async function refreshCredentials(
  disconnect: () => Promise<void>,
  connect: () => Promise<any> // connect can return WalletInfo, we don't need the return value
): Promise<void> {
  await disconnect();
  await new Promise((resolve) => setTimeout(resolve, DISCONNECT_DELAY));
  await connect();
  await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY));
}

/**
 * Custom hook for signing transactions with automatic credential refresh and retry
 */
export function useTransactionSigning() {
  const { signAndSendTransaction, connect, disconnect, smartWalletPubkey } =
    useWallet();

  const signTransaction = useCallback(
    async ({ instructions, onError }: SignTransactionOptions): Promise<string> => {
      if (!signAndSendTransaction || !connect || !disconnect) {
        throw new Error('Wallet not properly initialized');
      }

      let lastError: unknown = null;
      let retryCount = 0;

      // Retry loop for recoverable errors
      while (retryCount <= MAX_RETRY_ATTEMPTS) {
        try {
          return await signAndSendTransaction({ instructions });
        } catch (signError: unknown) {
          lastError = signError;
          
          // Check if error is due to credential inconsistency
          const isCredentialIssue = isCredentialError(signError);
          const isTransactionSizeIssue = isTransactionSizeError(signError) || detectPasskeyCacheIssue(signError);
          
          // If it's a recoverable error and we haven't exceeded retry limit
          if ((isCredentialIssue || isTransactionSizeIssue) && retryCount < MAX_RETRY_ATTEMPTS) {
            const context = '[useTransactionSigning]';
            const errorType = isTransactionSizeIssue ? 'transaction size' : 'credential';
            console.warn(
              `${context} ${errorType} issue detected. Attempting recovery (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})...`
            );

            // Clear all caches before disconnect/reconnect
            const walletAddress = smartWalletPubkey?.toString();
            if (walletAddress) {
              clearAllCaches(walletAddress);
            }

            try {
              // Attempt automatic recovery
              const recoveryResult = await attemptAutoRecovery(
                disconnect,
                connect,
                walletAddress
              );

              if (recoveryResult.success) {
                // Wait with exponential backoff before retry
                const delay = RETRY_DELAY * Math.pow(2, retryCount);
                await new Promise((resolve) => setTimeout(resolve, delay));

                // Retry transaction with fresh credentials
                console.log(
                  `${context} Retrying transaction after recovery (attempt ${retryCount + 1})...`
                );
                retryCount++;
                continue; // Retry the transaction
              } else {
                // Recovery failed, throw error
                throw new Error(recoveryResult.message);
              }
            } catch (reconnectError) {
              // If recovery fails and we've exhausted retries, throw error
              if (retryCount >= MAX_RETRY_ATTEMPTS) {
                const errorMessage = isTransactionSizeIssue
                  ? 'Transaction size error: Passkey cache issue detected. Please disconnect and reconnect your wallet, then try again.\n\n' +
                    'This error occurs when passkey credentials are cached inconsistently, causing transaction size to exceed Solana\'s limit.\n\n' +
                    'Solution: Click disconnect, then reconnect your wallet to refresh credentials.'
                  : 'Passkey credential issue detected. Please disconnect and reconnect your wallet, then try again.\n\n' +
                    'This error occurs when passkey credentials are stored inconsistently, causing signature verification to fail.\n\n' +
                    'Solution: Click disconnect, then reconnect your wallet to refresh credentials.';

                const error = new Error(errorMessage);
                onError?.(error);
                throw error;
              }
              // Otherwise, continue to next retry attempt
              retryCount++;
              continue;
            }
          }

          // If it's not a recoverable error or we've exhausted retries, throw
          const error = signError as Error;
          onError?.(error);
          throw error;
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError as Error;
    },
    [signAndSendTransaction, connect, disconnect, smartWalletPubkey]
  );

  return { signTransaction };
}

