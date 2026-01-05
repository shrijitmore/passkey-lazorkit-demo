/**
 * URL Constants
 * 
 * Centralized URL constants for the application.
 * All external service URLs should be defined here for easy maintenance.
 * 
 * @example
 * ```tsx
 * import { EXPLORER_BASE_URL, FAUCET_URL } from '@/lib/constants/urls';
 * 
 * const txUrl = `${EXPLORER_BASE_URL}/tx/${signature}?cluster=devnet`;
 * ```
 */

/**
 * Solana Explorer base URL
 * Used for viewing transactions and addresses on-chain
 */
export const EXPLORER_BASE_URL = 'https://explorer.solana.com';

/**
 * Solana Faucet URL
 * Used for getting devnet SOL for testing
 */
export const FAUCET_URL = 'https://faucet.solana.com';

/**
 * Solana RPC URL (Devnet)
 * Used for connecting to Solana blockchain
 */
export const RPC_URL = 'https://api.devnet.solana.com';

/**
 * LazorKit Portal URL
 * Used for LazorKit SDK configuration
 */
export const PORTAL_URL = 'https://portal.lazor.sh';

/**
 * LazorKit Paymaster URL (Devnet)
 * Official Devnet paymaster for gas sponsorship
 */
export const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

