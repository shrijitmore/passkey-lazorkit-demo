'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { type ReactNode } from 'react';

const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';

/**
 * LazorKit Provider Wrapper
 * 
 * Configuration:
 * - Paymaster REMOVED - all transactions use normal wallet-paid fees
 * - No gasless transactions - users pay their own transaction fees
 * - Direct Solana transactions without any paymaster intervention
 */
export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      // @ts-expect-error - passkey prop exists at runtime but types may be outdated
      passkey={true}
    >
      {children}
    </LazorkitProvider>
  );
}

