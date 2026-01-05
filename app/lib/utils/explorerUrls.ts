/**
 * Explorer URL Utilities
 * 
 * Functions to generate Solana Explorer URLs for transactions and addresses.
 * Provides consistent URL construction across the application.
 * 
 * @example
 * ```tsx
 * const txUrl = getTransactionExplorerUrl(signature);
 * const addressUrl = getAddressExplorerUrl(walletAddress);
 * ```
 */

import { EXPLORER_BASE_URL } from '../constants/urls';

/**
 * Solana cluster types
 */
export type SolanaCluster = 'devnet' | 'mainnet' | 'testnet';

/**
 * Generate Solana Explorer URL for a transaction
 * 
 * @param signature - Transaction signature (base58 string)
 * @param cluster - Solana cluster (defaults to 'devnet')
 * @returns Full URL to view transaction on Solana Explorer
 * 
 * @example
 * ```tsx
 * const url = getTransactionExplorerUrl('5j7s8...', 'devnet');
 * // Returns: 'https://explorer.solana.com/tx/5j7s8...?cluster=devnet'
 * ```
 */
export function getTransactionExplorerUrl(
  signature: string,
  cluster: SolanaCluster = 'devnet'
): string {
  if (!signature) {
    throw new Error('Transaction signature is required');
  }

  return `${EXPLORER_BASE_URL}/tx/${signature}?cluster=${cluster}`;
}

/**
 * Generate Solana Explorer URL for an address
 * 
 * @param address - Wallet address (base58 string)
 * @param cluster - Solana cluster (defaults to 'devnet')
 * @returns Full URL to view address on Solana Explorer
 * 
 * @example
 * ```tsx
 * const url = getAddressExplorerUrl('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'devnet');
 * // Returns: 'https://explorer.solana.com/address/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM?cluster=devnet'
 * ```
 */
export function getAddressExplorerUrl(
  address: string,
  cluster: SolanaCluster = 'devnet'
): string {
  if (!address) {
    throw new Error('Address is required');
  }

  return `${EXPLORER_BASE_URL}/address/${address}?cluster=${cluster}`;
}

