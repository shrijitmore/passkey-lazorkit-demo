/**
 * Cache clearing utilities
 * Clears all application caches when wallet is disconnected/reconnected
 * to prevent stale data from causing credential inconsistencies
 */

import { clearBalanceCache } from '../../contexts/BalanceContext';
import { clearSubscriptions } from '../subscription/storage';

/**
 * Clear all application caches
 * Should be called when disconnecting/reconnecting wallet to fix credential issues
 * 
 * @param walletAddress - Optional wallet address to clear caches for specific wallet
 */
export function clearAllCaches(walletAddress?: string): void {
  console.log('[clearAllCaches] Clearing all caches', walletAddress ? `for wallet: ${walletAddress}` : '');
  
  // Clear balance cache and pending requests
  clearBalanceCache(walletAddress);
  
  // Clear subscription storage if wallet address is provided
  if (walletAddress) {
    try {
      clearSubscriptions(walletAddress);
      console.log('[clearAllCaches] Cleared subscription storage for wallet:', walletAddress);
    } catch (error) {
      console.error('[clearAllCaches] Error clearing subscription storage:', error);
    }
  }
  
  // Clear any other localStorage items related to wallet/LazorKit
  if (typeof window !== 'undefined') {
    try {
      // Clear any wallet-specific localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('lazorkit_') || 
          key.startsWith('wallet_') || 
          key.startsWith('passkey_') ||
          key.startsWith('webauthn_') ||
          key.startsWith('credential_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('[clearAllCaches] Cleared localStorage key:', key);
      });
    } catch (error) {
      console.error('[clearAllCaches] Error clearing localStorage:', error);
    }
  }
  
  console.log('[clearAllCaches] Cache clearing completed');
}

