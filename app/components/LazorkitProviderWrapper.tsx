'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

/**
 * LazorKit Provider Wrapper
 * 
 * Note on Paymaster Configuration:
 * - paymasterConfig is included but native SOL transfers use wallet-paid fees
 * - The paymaster may sponsor token transfers or other operations, but native SOL
 *   transfers typically require the wallet to pay transaction fees
 * - This reflects realistic production behavior where paymasters have policies
 *   that may exclude native SOL transfers
 */
export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const paymasterConfig = useMemo(
    () => ({
      paymasterUrl: PAYMASTER_URL,
    }),
    []
  );
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

