'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

/**
 * LazorkitProviderWrapper
 * 
 * This component wraps the application with LazorKit's provider, which:
 * 1. Initializes the LazorKit SDK
 * 2. Provides wallet context to all child components via React Context
 * 3. Handles WebAuthn/passkey authentication
 * 4. Manages smart wallet (PDA) creation and session persistence
 * 
 * Reference: https://docs.lazorkit.com/react-sdk/provider
 */

// Official LazorKit Devnet configuration from https://docs.lazorkit.com/react-sdk/getting-started
const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com'; // Official Devnet paymaster

/**
 * LazorKit Provider Wrapper
 * 
 * Configures LazorKit SDK with paymaster support for passkey-based authentication.
 * 
 * CRITICAL: Config must be memoized to prevent infinite re-render loops.
 * LazorKit uses an internal store that triggers re-renders if config object identity changes.
 */
export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  /**
   * Memoize paymasterConfig to prevent object recreation on each render.
   * This is important because React will see it as a new object each time,
   * causing unnecessary re-renders of the LazorkitProvider.
   * 
   * paymasterConfig enables gasless transactions:
   * - paymasterUrl: The Paymaster service pays transaction fees on behalf of users
   * - apiKey: Optional API key if the paymaster service requires authentication
   * 
   * Reference: https://docs.lazorkit.com/react-sdk/provider#paymasterconfig-optional
   */
  const paymasterConfig = useMemo(
    () => ({
      paymasterUrl: PAYMASTER_URL,
      // apiKey: 'YOUR_API_KEY' // Optional: Only needed if paymaster requires authentication
    }),
    [] // Empty deps = config never changes
  );

  /**
   * LazorkitProvider Props (from https://docs.lazorkit.com/react-sdk/provider):
   * 
   * - rpcUrl (required): Solana RPC endpoint URL
   *   Used to interact with the Solana blockchain (query balance, send transactions, etc.)
   * 
   * - portalUrl (optional): LazorKit authentication portal URL
   *   Default: 'https://portal.lazor.sh'
   *   Handles WebAuthn passkey creation and authentication
   *   Only change if self-hosting the portal
   * 
   * - paymasterConfig (optional): Paymaster service configuration
   *   Enables gasless transactions - users don't need SOL for fees
   *   The paymaster pays transaction fees on behalf of users
   * 
   * - passkey (optional): Enable passkey authentication
   *   Default: true
   *   Enables WebAuthn passkey support for wallet authentication
   * 
   * - children: Your application components that need wallet access
   */
  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      paymasterConfig={paymasterConfig}
      // @ts-expect-error - passkey prop exists at runtime but types may be outdated
      passkey={true}
    >
      {children}
    </LazorkitProvider>
  );
}

