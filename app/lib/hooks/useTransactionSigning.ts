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
 * const { signAndSendWithRetry } = useTransactionSigning();
 * 
 * const signature = await signAndSendWithRetry({
 *   instructions: [instruction],
 *   walletAddress: smartWalletPubkey.toString(),
 * });
 * ```
 * 
 * @see Tutorial 2: Transactions for more details
 */
import { useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { TransactionInstruction } from '@solana/web3.js';
import { clearAllCaches } from '../cache/clearCache';

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
 * Custom hook for signing transactions with automatic credential refresh
 */
export function useTransactionSigning() {
  const { signAndSendTransaction, connect, disconnect, smartWalletPubkey } =
    useWallet();

  const signTransaction = useCallback(
    async ({ instructions, onError }: SignTransactionOptions): Promise<string> => {
      if (!signAndSendTransaction || !connect || !disconnect) {
        throw new Error('Wallet not properly initialized');
      }

      try {
        return await signAndSendTransaction({ instructions });
      } catch (signError: unknown) {
        // Check if error is due to credential inconsistency
        if (isCredentialError(signError)) {
          const context = '[useTransactionSigning]';
          console.error(
            `${context} Passkey credential inconsistency detected. Attempting to refresh credentials...`
          );

          // Clear all caches before disconnect/reconnect
          const walletAddress = smartWalletPubkey?.toString();
          if (walletAddress) {
            clearAllCaches(walletAddress);
          }

          try {
            // Refresh credentials
            await refreshCredentials(disconnect, connect);

            // Retry transaction with fresh credentials
            console.log(
              `${context} Retrying transaction with refreshed credentials...`
            );
            return await signAndSendTransaction({ instructions });
          } catch (reconnectError) {
            const errorMessage =
              'Passkey credential issue detected. Please disconnect and reconnect your wallet, then try again.\n\n' +
              'This error occurs when passkey credentials are stored inconsistently, causing signature verification to fail.\n\n' +
              'Solution: Click disconnect, then reconnect your wallet to refresh credentials.';

            const error = new Error(errorMessage);
            onError?.(error);
            throw error;
          }
        }

        // Re-throw if it's not a credential issue
        const error = signError as Error;
        onError?.(error);
        throw error;
      }
    },
    [signAndSendTransaction, connect, disconnect, smartWalletPubkey]
  );

  return { signTransaction };
}

