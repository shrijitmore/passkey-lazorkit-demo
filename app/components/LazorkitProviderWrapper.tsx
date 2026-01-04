'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com';

/**
 * LazorKit Provider Wrapper
 * 
 * IMPORTANT: Why Paymaster Errors Occur
 * 
 * Even though we don't explicitly use paymaster in our code, the LazorKit SDK
 * automatically routes ALL transactions through the paymaster pipeline when
 * paymasterConfig is provided in the provider.
 * 
 * What happens:
 * 1. We set paymasterConfig in the provider
 * 2. SDK automatically tries to use paymaster for every transaction
 * 3. Paymaster rejects native SOL transfers (policy-level rejection)
 * 4. This causes Error 0x2 (simulation failed)
 * 
 * Solution Options:
 * 
 * Option 1: Remove paymasterConfig (Recommended for native SOL only)
 * - Removes paymaster entirely
 * - All transactions are wallet-paid
 * - No 0x2 errors for native SOL transfers
 * - Use this if you only need native SOL transfers
 * 
 * Option 2: Keep paymasterConfig (For token transfers)
 * - Paymaster available for token transfers (USDC, etc.)
 * - Native SOL transfers will get 0x2 errors (expected)
 * - Users need to disconnect/reconnect to reset wallet state
 * - Use this if you need gasless token transfers
 * 
 * Current setup: paymasterConfig is REMOVED to avoid 0x2 errors
 * If you need paymaster for token transfers, uncomment the paymasterConfig below.
 */
export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Paymaster config is REMOVED to prevent 0x2 errors for native SOL transfers
  // The SDK automatically routes transactions through paymaster when this is set,
  // causing paymaster to reject native SOL transfers (policy-level rejection)
  
  // If you need paymaster for token transfers (USDC, etc.), uncomment this:
  // const paymasterConfig = useMemo(
  //   () => ({
  //     paymasterUrl: PAYMASTER_URL,
  //   }),
  //   []
  // );
  
  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      // paymasterConfig={paymasterConfig} // REMOVED to prevent 0x2 errors
      // @ts-expect-error - passkey prop exists at runtime but types may be outdated
      passkey={true}
    >
      {children}
    </LazorkitProvider>
  );
}

