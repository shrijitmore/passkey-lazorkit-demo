/**
 * BalanceContext
 * 
 * Centralized context for managing wallet balance with:
 * - Automatic balance fetching when wallet connects
 * - Caching to reduce RPC calls
 * - Request deduplication (prevents multiple simultaneous requests)
 * - Event-driven updates (refreshes on transaction completion)
 * - Optimistic UI (shows cached balance immediately)
 * 
 * This context demonstrates best practices for:
 * - Managing Solana RPC calls efficiently
 * - Caching and request deduplication
 * - Event-driven state updates
 * 
 * Usage:
 * ```tsx
 * const { balance, isLoadingBalance, refreshBalance } = useBalance();
 * ```
 * 
 * Features:
 * - 5-second cache TTL
 * - Automatic refresh on transaction completion
 * - Timeout protection (10 seconds)
 * - Optimistic UI updates
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection } from '../lib/rpc/connection';
import { WALLET_EVENTS, listenWalletEvent } from '../lib/events/walletEvents';

interface BalanceContextType {
  balance: number | null;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

// Request deduplication: track pending requests by wallet address
const pendingRequests = new Map<string, Promise<number>>();
const balanceCache = new Map<string, { balance: number; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds cache

/**
 * Clear balance cache and pending requests for a specific wallet or all wallets
 * Exported for use in cache clearing utilities
 */
export function clearBalanceCache(walletAddress?: string): void {
  if (walletAddress) {
    console.log('[BalanceContext] Clearing balance cache for wallet:', walletAddress);
    balanceCache.delete(walletAddress);
    pendingRequests.delete(walletAddress);
  } else {
    console.log('[BalanceContext] Clearing all balance caches');
    balanceCache.clear();
    pendingRequests.clear();
  }
}

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const isMountedRef = useRef(true);

  // Request deduplication: prevent simultaneous identical requests
  const fetchBalance = useCallback(async (): Promise<number | null> => {
    if (!smartWalletPubkey || !isConnected) {
      return null;
    }

    const walletAddress = smartWalletPubkey.toString();

    // Check cache first - show cached value immediately for better UX
    const cached = balanceCache.get(walletAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[BalanceContext] Using cached balance:', cached.balance);
      setBalance(cached.balance);
      setIsLoadingBalance(false);
      return cached.balance;
    }

    // Show cached value while fetching fresh data (optimistic UI)
    if (cached) {
      console.log('[BalanceContext] Showing stale cached balance while fetching:', cached.balance);
      setBalance(cached.balance);
    }

    // Check if request is already pending
    const pendingRequest = pendingRequests.get(walletAddress);
    if (pendingRequest) {
      try {
        console.log('[BalanceContext] Waiting for pending request');
        const result = await pendingRequest;
        console.log('[BalanceContext] Got result from pending request:', result);
        setBalance(result);
        setIsLoadingBalance(false);
        return result;
      } catch (err) {
        console.error('[BalanceContext] Pending request failed:', err);
        // If pending request fails, continue to make new request
      }
    }

    // Create new request with timeout
    setIsLoadingBalance(true);
    const requestPromise = (async () => {
      try {
        const connection = getConnection();
        
        // Use Promise.race with timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Balance fetch timeout')), 10000); // 10 second timeout
        });

        const balancePromise = connection.getBalance(smartWalletPubkey, 'processed');
        const balance = await Promise.race([balancePromise, timeoutPromise]);
        
        const balanceInSol = balance / LAMPORTS_PER_SOL;

        // Update cache
        balanceCache.set(walletAddress, {
          balance: balanceInSol,
          timestamp: Date.now(),
        });

        // Always update state - remove isMounted check as it might be preventing updates
        setBalance(balanceInSol);
        setIsLoadingBalance(false);

        return balanceInSol;
      } catch (err) {
        console.error('[BalanceContext] Error fetching balance:', err);
        
        // If error but we have cached value, keep showing it
        const cached = balanceCache.get(walletAddress);
        if (cached) {
          console.log('[BalanceContext] Error occurred, showing cached balance:', cached.balance);
          setBalance(cached.balance);
        }
        
        setIsLoadingBalance(false);
        throw err;
      } finally {
        // Remove from pending requests after completion
        pendingRequests.delete(walletAddress);
      }
    })();

    // Store pending request
    pendingRequests.set(walletAddress, requestPromise);

    try {
      const result = await requestPromise;
      console.log('[BalanceContext] Request completed successfully, balance:', result);
      // Ensure balance is set (in case state update was missed)
      if (result !== null && isMountedRef.current) {
        setBalance(result);
        setIsLoadingBalance(false);
      }
      return result;
    } catch (err) {
      console.error('[BalanceContext] Request failed:', err);
      // Return cached value if available, even if stale
      const cached = balanceCache.get(walletAddress);
      if (cached) {
        console.log('[BalanceContext] Returning cached balance after error:', cached.balance);
        setBalance(cached.balance);
      }
      setIsLoadingBalance(false);
      return cached ? cached.balance : null;
    }
  }, [smartWalletPubkey, isConnected]);

  // Store fetchBalance in a ref to avoid infinite loops
  const fetchBalanceRef = useRef(fetchBalance);
  
  // Update ref when fetchBalance changes
  useEffect(() => {
    fetchBalanceRef.current = fetchBalance;
  }, [fetchBalance]);

  // Refresh balance (public API)
  const refreshBalance = useCallback(async () => {
    if (!smartWalletPubkey || !isConnected) {
      return;
    }

    // Clear cache to force fresh fetch
    const walletAddress = smartWalletPubkey.toString();
    balanceCache.delete(walletAddress);
    pendingRequests.delete(walletAddress);

    await fetchBalanceRef.current();
  }, [smartWalletPubkey, isConnected]);

  // Initial fetch when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const walletAddress = smartWalletPubkey.toString();
      console.log('[BalanceContext] Wallet connected, fetching balance for:', walletAddress);
      // Check cache first - show immediately if available
      const cached = balanceCache.get(walletAddress);
      if (cached) {
        console.log('[BalanceContext] Found cached balance on connect:', cached.balance);
        setBalance(cached.balance);
        setIsLoadingBalance(false);
      }
      // Fetch fresh balance in background
      fetchBalanceRef.current();
    } else {
      console.log('[BalanceContext] Wallet disconnected, clearing balance');
      setBalance(null);
      setIsLoadingBalance(false);
    }
  }, [isConnected, smartWalletPubkey]);

  // Listen for transaction events to refresh balance
  useEffect(() => {
    if (!isConnected || !smartWalletPubkey) return;

    const unsubscribe = listenWalletEvent(
      WALLET_EVENTS.TRANSACTION_COMPLETED,
      () => {
        // Clear cache and refresh on transaction
        const walletAddress = smartWalletPubkey.toString();
        balanceCache.delete(walletAddress);
        fetchBalanceRef.current();
      }
    );

    const unsubscribeBalance = listenWalletEvent(
      WALLET_EVENTS.BALANCE_UPDATED,
      () => {
        // Clear cache and refresh on balance update event
        const walletAddress = smartWalletPubkey.toString();
        balanceCache.delete(walletAddress);
        fetchBalanceRef.current();
      }
    );

    return () => {
      unsubscribe();
      unsubscribeBalance();
    };
  }, [isConnected, smartWalletPubkey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      balance,
      isLoadingBalance,
      refreshBalance,
    }),
    [balance, isLoadingBalance, refreshBalance]
  );

  return (
    <BalanceContext.Provider value={contextValue}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}