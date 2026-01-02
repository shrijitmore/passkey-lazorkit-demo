'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

// Define config values as constants to ensure stable references
// Using official LazorKit Devnet configuration from https://docs.lazorkit.com/react-sdk/getting-started
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
  // 🔒 CRITICAL: Memoize config so object identity never changes
  // This prevents LazorKit's internal store from triggering infinite re-renders
  const config = useMemo(
    () => ({
      rpcUrl: RPC_URL,
      portalUrl: PORTAL_URL,
      paymasterConfig: {
        paymasterUrl: PAYMASTER_URL,
      },
      passkey: true as any, // passkey prop exists at runtime but types may be outdated
    }),
    [] // Empty deps = config never changes
  );

  return <LazorkitProvider {...config}>{children}</LazorkitProvider>;
}

