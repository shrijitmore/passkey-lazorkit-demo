import { useState, useCallback, useRef } from 'react';
import { PublicKey } from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { getConnection } from '../rpc/connection';

export interface TokenInfo {
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    logoUrl?: string;
}

// Known token mints on devnet
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; logoUrl: string }> = {
    // SPL Token Faucet USDC-Devnet
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr': {
        symbol: 'USDC',
        name: 'USDC-Devnet',
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
    // Circle's Devnet USDC
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': {
        symbol: 'USDC',
        name: 'Circle USDC (Devnet)',
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
};

/**
 * Hook to fetch ALL SPL token balances for a wallet.
 */
export function useAllTokenBalances(ownerPublicKey: PublicKey | null | string) {
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const lastFetchTime = useRef<number>(0);

    const fetchAllTokens = useCallback(async () => {
        if (!ownerPublicKey) {
            setTokens([]);
            return;
        }

        let owner: PublicKey;
        try {
            if (typeof ownerPublicKey === 'string' && !ownerPublicKey.trim()) {
                setTokens([]);
                return;
            }
            owner = typeof ownerPublicKey === 'string' ? new PublicKey(ownerPublicKey) : ownerPublicKey;
        } catch (e) {
            console.error('useAllTokenBalances: Invalid owner public key', ownerPublicKey);
            setTokens([]);
            return;
        }

        // Debounce: Prevent fetching more than once every 5 seconds
        const now = Date.now();
        if (now - lastFetchTime.current < 5000) {
            console.log('useAllTokenBalances: Skipping fetch (debounce)');
            return;
        }
        lastFetchTime.current = now;

        setIsLoading(true);
        try {
            const connection = getConnection();

            // Fetch accounts from both programs in parallel
            const [standardRes, token2022Res] = await Promise.all([
                connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
                connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })
            ]);

            const accounts = [...standardRes.value, ...token2022Res.value];

            const tokenList: TokenInfo[] = accounts
                .map((account) => {
                    const parsed = account.account.data.parsed.info;
                    const mint = parsed.mint;
                    const balance = parsed.tokenAmount.uiAmount || 0;
                    const decimals = parsed.tokenAmount.decimals;

                    // Look up known token info
                    const known = KNOWN_TOKENS[mint];

                    return {
                        mint,
                        symbol: known?.symbol || 'Unknown',
                        name: known?.name || `Token (${mint.slice(0, 8)}...)`,
                        balance,
                        decimals,
                        logoUrl: known?.logoUrl,
                    };
                })
                .filter((token) => token.balance > 0);

            setTokens(tokenList);
        } catch (err) {
            console.error('Failed to fetch token balances:', err);
        } finally {
            setIsLoading(false);
        }
    }, [ownerPublicKey]);

    return { tokens, isLoading, refresh: fetchAllTokens };
}
