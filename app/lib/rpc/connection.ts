/**
 * Solana RPC Connection Singleton
 * 
 * Provides a single Connection instance to the Solana RPC endpoint.
 * This prevents creating multiple Connection objects, which can cause:
 * - Excessive RPC calls
 * - Rate limiting issues
 * - Performance problems
 * 
 * Usage:
 * ```tsx
 * import { getConnection } from '@/lib/rpc/connection';
 * 
 * const connection = getConnection();
 * const balance = await connection.getBalance(walletAddress);
 * ```
 * 
 * Commitment Level:
 * - 'processed' - Faster, doesn't wait for confirmation (used for balance queries)
 * - 'confirmed' - Waits for confirmation (required for some methods like getSignaturesForAddress)
 */
import { Connection, Commitment } from '@solana/web3.js';
import { RPC_URL } from '../constants/urls';

/**
 * Commitment level for RPC queries
 * 'processed' is faster than 'confirmed' for balance queries
 * Note: Some methods (like getSignaturesForAddress) require 'confirmed'
 */
const COMMITMENT: Commitment = 'processed';

// Singleton Connection instance to reuse across the app
let connectionInstance: Connection | null = null;

/**
 * Get or create the shared Solana RPC connection instance
 * 
 * This prevents creating multiple Connection objects and reduces RPC overhead.
 * All components should use this function instead of creating new Connection instances.
 * 
 * @returns Singleton Connection instance
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(RPC_URL, COMMITMENT);
  }
  return connectionInstance;
}

/**
 * Get the RPC URL (for reference)
 * 
 * @returns The RPC URL string
 */
export function getRpcUrl(): string {
  return RPC_URL;
}

