/**
 * TokenContext
 * 
 * Centralized context for managing SPL token balances with:
 * - Automatic token fetching when wallet connects
 * - Shared state between Dashboard and Wallet pages
 * - Debouncing to prevent excessive RPC calls
 * - Event-driven updates (refreshes on transaction completion)
 * 
 * This context reduces redundant RPC calls when navigating between pages.
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { getConnection } from '../lib/rpc/connection';
import { WALLET_EVENTS, listenWalletEvent } from '../lib/events/walletEvents';

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
    'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr': {
        symbol: 'USDC',
        name: 'USDC-Devnet',
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': {
        symbol: 'USDC',
        name: 'Circle USDC (Devnet)',
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
};

interface TokenContextType {
    tokens: TokenInfo[];
    isLoadingTokens: boolean;
    refreshTokens: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
    const { smartWalletPubkey, isConnected } = useWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    const lastFetchTime = useRef<number>(0);
    const fetchInProgress = useRef<boolean>(false);

    const fetchTokens = useCallback(async (force = false) => {
        if (!smartWalletPubkey || !isConnected || fetchInProgress.current) {
            return;
        }

        const now = Date.now();
        if (!force && now - lastFetchTime.current < 5000) {
            console.log('[TokenContext] Skipping fetch (debounce)');
            return;
        }

        fetchInProgress.current = true;
        setIsLoadingTokens(true);
        lastFetchTime.current = now;

        try {
            const connection = getConnection();

            // Fetch from both programs
            const [standardRes, token2022Res] = await Promise.all([
                connection.getParsedTokenAccountsByOwner(smartWalletPubkey, { programId: TOKEN_PROGRAM_ID }),
                connection.getParsedTokenAccountsByOwner(smartWalletPubkey, { programId: TOKEN_2022_PROGRAM_ID })
            ]);

            const accounts = [...standardRes.value, ...token2022Res.value];

            const tokenList: TokenInfo[] = accounts
                .map((account) => {
                    const parsed = account.account.data.parsed.info;
                    const mint = parsed.mint;
                    const balance = parsed.tokenAmount.uiAmount || 0;
                    const decimals = parsed.tokenAmount.decimals;

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
            console.error('[TokenContext] Failed to fetch token balances:', err);
        } finally {
            setIsLoadingTokens(false);
            fetchInProgress.current = false;
        }
    }, [smartWalletPubkey, isConnected]);

    // Initial fetch
    useEffect(() => {
        if (isConnected && smartWalletPubkey) {
            fetchTokens();
        } else {
            setTokens([]);
        }
    }, [isConnected, smartWalletPubkey, fetchTokens]);

    // Event updates
    useEffect(() => {
        if (!isConnected || !smartWalletPubkey) return;

        const unsubscribe = listenWalletEvent(
            WALLET_EVENTS.TRANSACTION_COMPLETED,
            () => fetchTokens(true)
        );

        const unsubscribeBalance = listenWalletEvent(
            WALLET_EVENTS.BALANCE_UPDATED,
            () => fetchTokens(true)
        );

        return () => {
            unsubscribe();
            unsubscribeBalance();
        };
    }, [isConnected, smartWalletPubkey, fetchTokens]);

    const value = useMemo(() => ({
        tokens,
        isLoadingTokens,
        refreshTokens: () => fetchTokens(true)
    }), [tokens, isLoadingTokens, fetchTokens]);

    return (
        <TokenContext.Provider value={value}>
            {children}
        </TokenContext.Provider>
    );
}

export function useTokens() {
    const context = useContext(TokenContext);
    if (context === undefined) {
        throw new Error('useTokens must be used within a TokenProvider');
    }
    return context;
}
