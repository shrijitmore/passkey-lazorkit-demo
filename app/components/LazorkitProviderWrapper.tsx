'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

// Define config values as constants to ensure stable references
// Using official LazorKit Devnet configuration from https://docs.lazorkit.com/react-sdk/getting-started
const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com'; // Official Devnet paymaster

export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Memoize paymasterConfig to prevent object recreation on each render
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

