import { useState, useCallback, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../rpc/connection';

/**
 * Hook to fetch SPL token balance on-demand (not on mount).
 * This prevents excessive RPC calls and rate limiting (429 errors).
 * 
 * Usage:
 * const { balance, isLoading, refresh } = useTokenBalance(pubkey, mintAddress);
 * // Call refresh() when you want to fetch/update the balance
 */
export function useTokenBalance(ownerPublicKey: PublicKey | null, mintAddress: string) {
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchTime = useRef<number>(0);

    const fetchBalance = useCallback(async () => {
        if (!ownerPublicKey) {
            setBalance(null);
            return;
        }

        // Debounce: Prevent fetching more than once every 5 seconds
        const now = Date.now();
        if (now - lastFetchTime.current < 5000) {
            console.log('useTokenBalance: Skipping fetch (debounce)');
            return;
        }
        lastFetchTime.current = now;

        setIsLoading(true);
        try {
            const connection = getConnection();
            const mint = new PublicKey(mintAddress);

            const { value: accounts } = await connection.getParsedTokenAccountsByOwner(
                ownerPublicKey,
                { mint }
            );

            if (accounts.length > 0) {
                const uiAmount = accounts[0].account.data.parsed.info.tokenAmount.uiAmount;
                setBalance(uiAmount || 0);
            } else {
                setBalance(0);
            }
        } catch (err) {
            console.error('Failed to fetch token balance:', err);
            // Don't set to 0 on error if we had a previous value
            if (balance === null) setBalance(0);
        } finally {
            setIsLoading(false);
        }
    }, [ownerPublicKey, mintAddress]);

    return { balance, isLoading, refresh: fetchBalance };
}
