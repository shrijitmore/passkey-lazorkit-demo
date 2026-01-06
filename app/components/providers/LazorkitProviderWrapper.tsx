'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '../../lib/constants/urls';
import type { PartialLazorkitProviderConfig } from '../../lib/types/lazorkit';

/**
 * LazorKit Provider Wrapper
 * 
 * This component wraps your app with the LazorKit SDK provider, enabling passkey authentication
 * and smart wallet functionality throughout your application.
 * 
 * Key Features Configured:
 * - Passkey Authentication: WebAuthn-based biometric authentication (Face ID, Touch ID, Windows Hello)
 * - Smart Wallet: Program Derived Address (PDA) managed by LazorKit
 * - Paymaster: Gas sponsorship for transactions (configured but may not apply to all transaction types)
 * 
 * Configuration:
 * - rpcUrl: Solana RPC endpoint (Devnet for testing)
 * - portalUrl: LazorKit authentication portal
 * - paymasterConfig: Paymaster service for gasless transactions
 * - isDebug: true - Enables debug logging for development
 * - network: 'devnet' - Sets the Solana network
 * 
 * Usage:
 * Wrap your app root with this component in your layout.tsx:
 * 
 * ```tsx
 * <LazorkitProviderWrapper>
 *   <YourApp />
 * </LazorkitProviderWrapper>
 * ```
 * 
 * Then use the useWallet hook anywhere in your app:
 * ```tsx
 * const { connect, smartWalletPubkey, signAndSendTransaction } = useWallet();
 * ```
 * 
 * @see https://docs.lazorkit.com/ - Official LazorKit documentation
 */
export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Memoize paymasterConfig to prevent object recreation on each render
  // Paymaster is enabled by providing paymasterConfig with paymasterUrl
  const paymasterConfig = useMemo(
    () => ({
      paymasterUrl: PAYMASTER_URL,
      // Paymaster is enabled when paymasterConfig is provided
    }),
    []
  );

  // Additional provider props that may not be in official SDK types but are supported at runtime
  const additionalProps: PartialLazorkitProviderConfig = {
    isDebug: true,
    network: 'devnet',
  };

  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      paymasterConfig={paymasterConfig}
      {...(additionalProps as PartialLazorkitProviderConfig)}
    >
      {children}
    </LazorkitProvider>
  );
}

