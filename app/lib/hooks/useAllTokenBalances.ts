import { useTokens, type TokenInfo } from '../../contexts/TokenContext';

/**
 * Hook to fetch ALL SPL token balances for a wallet.
 * Refactored to use TokenContext for better performance and shared state.
 * 
 * Note: ownerPublicKey argument is maintained for backward compatibility but 
 * the hook now uses the smart wallet pubkey from TokenProvider/useWallet.
 */
export function useAllTokenBalances(ownerPublicKey?: any) {
    try {
        const { tokens, isLoadingTokens, refreshTokens } = useTokens();
        return { tokens, isLoading: isLoadingTokens, refresh: refreshTokens };
    } catch (e) {
        // Fallback for parts of the app not wrapped in TokenProvider (if any)
        console.warn('useAllTokenBalances: TokenProvider not found, falling back to empty state');
        return { tokens: [], isLoading: false, refresh: async () => { } };
    }
}

export type { TokenInfo };
