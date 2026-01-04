# Tutorial 1: Creating a Passkey-Based Wallet with LazorKit

This tutorial will guide you through integrating LazorKit to create a passkey-based Solana wallet. By the end, users will be able to connect their wallet using biometric authentication (Face ID, Touch ID, or Windows Hello) without managing seed phrases.

> **Reference**: Based on [LazorKit Getting Started Guide](https://docs.lazorkit.com/react-sdk/getting-started) and [useWallet API](https://docs.lazorkit.com/react-sdk/use-wallet)

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of React and Next.js
- A modern browser with WebAuthn support (Chrome, Safari, Edge)

## What You'll Learn

- How to install and configure LazorKit
- How to set up the LazorKit Provider
- How to implement passkey-based wallet connection
- How to handle wallet state and errors
- Understanding Smart Wallets (PDAs)

## Step 1: Install Dependencies

Install the required packages as shown in the [official documentation](https://docs.lazorkit.com/react-sdk/getting-started#1-installation):

```bash
npm install @lazorkit/wallet @solana/web3.js
```

**Note**: The documentation also mentions `@coral-xyz/anchor` for Anchor program interactions, but it's optional for basic wallet operations. This repository uses `@lazorkit/wallet` and `@solana/web3.js` as shown in `package.json`.

## Step 2: Polyfills for Next.js (If Needed)

According to the [LazorKit documentation](https://docs.lazorkit.com/react-sdk/getting-started#nextjs), Next.js usually handles module resolution, but if you encounter `Buffer` errors, add this to your `layout.tsx` or provider:

```typescript
// layout.tsx or providers.tsx
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
}
```

**Important**: Always ensure wallet logic runs on the client-side with `'use client'` directive.

## Step 3: Set Up the LazorKit Provider

The `LazorkitProvider` is the foundation of your LazorKit integration. It wraps your app and provides wallet context to all components.

According to the [official documentation](https://docs.lazorkit.com/react-sdk/getting-started#provider-implementation), here's the default Devnet configuration:

```typescript
// app/components/LazorkitProviderWrapper.tsx
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

// Default Devnet configuration from LazorKit docs
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
      passkey={true} // Enable passkey authentication
    >
      {children}
    </LazorkitProvider>
  );
}
```

**Key Configuration Options** (from [LazorkitProvider API](https://docs.lazorkit.com/react-sdk/provider)):

- `rpcUrl` (required): Your Solana RPC endpoint (Devnet, Mainnet, or custom)
- `portalUrl` (optional): LazorKit's authentication portal (default: `https://portal.lazor.sh`)
- `paymasterConfig` (optional): Paymaster configuration (may sponsor fees for certain transaction types)
  - `paymasterUrl`: The API endpoint for the paymaster
  - `apiKey`: Your API key if the service requires one
  - **Note**: Native SOL transfers typically use wallet-paid fees

## Step 4: Wrap Your App with the Provider

In your root layout (`app/layout.tsx`), wrap your application. For better organization, especially if you have multiple providers, create a `Providers.tsx` wrapper:

```typescript
// app/components/Providers.tsx
'use client';

import { ReactNode } from 'react';
import LazorkitProviderWrapper from './LazorkitProviderWrapper';
import { ThemeProvider } from '../contexts/ThemeContext'; // If you have a theme provider

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LazorkitProviderWrapper>
        {children}
      </LazorkitProviderWrapper>
    </ThemeProvider>
  );
}
```

**Note**: In this demo, `Providers.tsx` includes both `ThemeProvider` and `LazorkitProviderWrapper`. If you don't need a theme provider, you can use `LazorkitProviderWrapper` directly.

Then in your root layout:

```typescript
// app/layout.tsx
import type { ReactNode } from 'react';
import Providers from './components/Providers';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Note**: You can also use `LazorkitProviderWrapper` directly in the layout if you don't need a wrapper component.

## Step 5: Implement the Wallet Connection Component

According to the [official Getting Started guide](https://docs.lazorkit.com/react-sdk/getting-started#3-connect-button), create a component that uses the `useWallet` hook. Here's a basic example:

```typescript
// app/components/ConnectButton.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';

export function ConnectButton() {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting, 
    smartWalletPubkey,
    error 
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  if (isConnecting) {
    return <div>Connecting with passkey…</div>;
  }

  if (isConnected && smartWalletPubkey) {
    return (
      <div>
        <p>Connected: {smartWalletPubkey.toString().slice(0, 6)}...</p>
        <button onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleConnect} 
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

**Note**: This is a basic example. In this repository, the actual `WalletPanelEnhanced.tsx` component includes additional features like:
- Balance fetching and display
- Copy address functionality
- Transaction sending with `signAndSendTransaction`
- Explorer links
- Faucet instructions
- Comprehensive error handling

You can view the complete implementation in `app/components/WalletPanelEnhanced.tsx`.

## Step 6: Understanding the Connection Flow

According to the [useWallet documentation](https://docs.lazorkit.com/react-sdk/use-wallet#connect), when you call `connect()`:

> "Trigger the connection flow. If the user has previously connected, this will try to restore their session automatically without showing a pop-up."

**First-time users:**
1. Browser prompts for biometric authentication (Face ID/Touch ID/Windows Hello)
2. A WebAuthn credential (passkey) is created in the device's Secure Enclave
3. LazorKit creates a Program Derived Address (PDA) smart wallet
4. The passkey is linked to this smart wallet

**Returning users:**
1. LazorKit checks for existing session
2. If session exists: Attempts to restore silently (may prompt for biometric)
3. If no session: Full authentication flow

## Step 7: Understanding Smart Wallets (PDAs)

According to the [LazorKit documentation](https://docs.lazorkit.com/), accounts are Program Derived Addresses (PDAs) controlled by the LazorKit on-chain program.

**Key benefits:**
- **No seed phrases**: Users never see or manage private keys
- **Recovery**: Logic for key rotation and recovery
- **Policies**: On-chain spending limits and access controls
- **Session Keys**: Ephemeral keys for scoped application access

The `smartWalletPubkey` you receive is a PDA controlled by LazorKit's on-chain program, not a traditional keypair.

## Step 8: Handle Connection States

The `useWallet` hook provides several state variables (from [useWallet API](https://docs.lazorkit.com/react-sdk/use-wallet)):

```typescript
const {
  smartWalletPubkey,  // PublicKey | null - The wallet address
  isConnected,         // boolean - Connection status
  isConnecting,        // boolean - Currently connecting
  connect,            // Function - Initiate connection
  disconnect,         // Function - Disconnect wallet
  error,              // Error | null - Any errors
} = useWallet();
```

**Best Practices:**

- Show loading state when `isConnecting` is true
- Display errors clearly to users
- Always check `isConnected` before performing wallet operations
- Use `smartWalletPubkey` to display the wallet address

## Step 9: Connect Options

According to the [connect API documentation](https://docs.lazorkit.com/react-sdk/use-wallet#connect), you can pass options:

```typescript
await connect({ 
  feeMode: 'paymaster' // or 'user' (default: 'paymaster')
});
```

- `feeMode: 'paymaster'`: Paymaster may sponsor fees (default, but native SOL transfers typically use wallet-paid fees)
- `feeMode: 'user'`: User pays transaction fees

## Step 10: Testing the Integration

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the app

3. Click "Connect Wallet"

4. Complete the biometric authentication

5. Verify the wallet address is displayed

## Common Issues and Solutions

### Issue: "User cancelled the operation"
**Solution:** This is normal if the user dismisses the biometric prompt. Handle gracefully in your UI.

### Issue: "WebAuthn not supported"
**Solution:** Ensure you're using a modern browser (Chrome, Safari, Edge) and HTTPS (or localhost for development).

### Issue: "Buffer is not defined"
**Solution:** Add the Buffer polyfill as shown in Step 2.

### Issue: "Connection timeout"
**Solution:** Check your RPC URL and network connection. Devnet can sometimes be slow.

## Next Steps

Now that you have a working passkey-based wallet connection, you can:
- Display wallet balance
- Send transactions (see [Tutorial 2: Transactions](./tutorial-2-transactions.md))
- Implement session persistence (see [Tutorial 3: Session Persistence](./tutorial-3-session-persistence.md))

## Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit Getting Started Guide](https://docs.lazorkit.com/react-sdk/getting-started)
- [useWallet API Reference](https://docs.lazorkit.com/react-sdk/use-wallet)
- [LazorkitProvider API Reference](https://docs.lazorkit.com/react-sdk/provider)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Solana Program Derived Addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)

## Summary

In this tutorial, you learned:
- ✅ How to install and configure LazorKit
- ✅ How to set up LazorKit Provider with correct configuration
- ✅ How to implement passkey-based wallet connection
- ✅ How to handle wallet states and errors
- ✅ Understanding of Smart Wallets (PDAs)

Your users can now connect their Solana wallet using biometrics without seed phrases!

