/**
 * Supported SPL Tokens on Devnet
 * 
 * Note: There are multiple USDC tokens on Devnet!
 * - Circle's official Devnet USDC
 * - SPL Faucet USDC-Dev (commonly used by Phantom and other wallets)
 */
export const TOKENS = {
    // Circle's Official Devnet USDC
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin (Circle Devnet)',
        mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
        decimals: 6,
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        faucetUrl: 'https://faucet.circle.com/',
    },
    // SPL Token Faucet USDC-Dev (used by Phantom and spl-token-faucet.com)
    USDC_DEV: {
        symbol: 'USDC-Dev',
        name: 'USDC-Dev (Phantom/SPL Faucet)',
        mint: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr',
        decimals: 6,
        logoUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        faucetUrl: 'https://spl-token-faucet.com/?token-name=USDC-Dev',
    },
};

// For backward compatibility
export const DEFAULT_USDC = TOKENS.USDC_DEV;
