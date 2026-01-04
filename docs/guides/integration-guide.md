# LazorKit Integration Guide

A comprehensive, step-by-step guide to integrating LazorKit SDK into your Next.js application for passwordless passkey authentication and smart wallet transactions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Project Setup](#project-setup)
4. [Configuration](#configuration)
5. [Building the UI](#building-the-ui)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** v18+ installed
- **npm** or **yarn** package manager
- Basic knowledge of React and Next.js
- Understanding of Solana blockchain concepts

## Installation

### Step 1: Create a Next.js Project

```bash
npx create-next-app@latest lazorkit-demo
cd lazorkit-demo
```

When prompted, select:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- App Router: **Yes**

### Step 2: Install LazorKit SDK

```bash
npm install @lazorkit/wallet @solana/web3.js
```

### Step 3: Install Optional Dependencies (Optional)

**Note**: The LazorKit SDK handles passkey functionality internally. The following packages are only needed if you want to implement custom WebAuthn flows:

```bash
npm install @simplewebauthn/browser @simplewebauthn/types
```

For most use cases, you don't need these packages as LazorKit SDK provides all passkey functionality out of the box.

---

## Project Setup

### Step 1: Create Provider Wrapper

Create `app/components/LazorkitProviderWrapper.tsx`:

```tsx
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

// Configuration constants
const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com'; // Official Devnet paymaster

export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Memoize config to prevent re-renders
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

**Key Points:**
- `RPC_URL`: Solana RPC endpoint (use Devnet for testing)
- `PORTAL_URL`: LazorKit's portal service for passkey management
- `paymasterConfig`: Paymaster configuration (may sponsor fees for certain transaction types)
- `useMemo`: Prevents unnecessary re-renders

### Step 2: Create Providers Wrapper (Optional but Recommended)

For better organization, especially if you have multiple providers (like theme providers), create a `Providers.tsx` component:

```tsx
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

**Note**: If you only need LazorKit, you can skip this step and use `LazorkitProviderWrapper` directly in the layout.

### Step 3: Update Root Layout

Update `app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import Providers from './components/Providers';
import './globals.css';

export const metadata = {
  title: 'LazorKit Demo - Passkey Authentication & Smart Wallet',
  description: 'Experience the future of Solana UX with passkey authentication',
};

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

**Alternative (Direct Usage)**: If you don't need a Providers wrapper, you can use `LazorkitProviderWrapper` directly:

```tsx
import LazorkitProviderWrapper from './components/LazorkitProviderWrapper';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LazorkitProviderWrapper>
          {children}
        </LazorkitProviderWrapper>
      </body>
    </html>
  );
}
```

---

## Configuration

### Understanding LazorKit Configuration

#### RPC URL

```typescript
rpcUrl: 'https://api.devnet.solana.com'  // For testing
rpcUrl: 'https://api.mainnet-beta.solana.com'  // For production
```

**Options:**
- Solana public RPC (free, rate-limited)
- QuickNode, Helius, or Alchemy (paid, higher performance)
- Self-hosted RPC node

#### Portal URL

The LazorKit portal manages passkey operations:

```typescript
portalUrl: 'https://portal.lazor.sh'
```

**What it does:**
- Handles WebAuthn passkey creation
- Manages passkey authentication
- Stores public key credentials securely
- Provides recovery mechanisms

#### Paymaster Configuration

Paymaster can sponsor transaction fees for certain transaction types:

```typescript
paymasterConfig: {
  paymasterUrl: 'https://kora.devnet.lazorkit.com' // Official Devnet paymaster
}
```

**How it works:**
- Paymaster can sponsor fees for token transfers and other operations
- **Note**: Native SOL transfers typically use wallet-paid fees (realistic production behavior)
- Paymaster configuration is included but may not apply to all transaction types
- For native SOL transfers, users pay fees from their wallet balance

### Environment Variables (Optional)

Create `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

Then update your provider:

```tsx
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
const PORTAL_URL = process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL!;
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL!;
```

---

## Building the UI

### Step 1: Create Wallet Component

Create `app/components/WalletPanelEnhanced.tsx` (or a simpler `WalletPanel.tsx`):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';

export default function WalletPanelEnhanced() {
  const {
    smartWalletPubkey,    // User's wallet address
    isConnected,           // Connection status
    isConnecting,          // Loading state
    connect,               // Connect function
    disconnect,            // Disconnect function
    error,                 // Error state
    signAndSendTransaction // Send transactions
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
    }
  }, [isConnected, smartWalletPubkey]);

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    const connection = new Connection(RPC_URL, 'confirmed');
    const balance = await connection.getBalance(smartWalletPubkey);
    setBalance(balance / LAMPORTS_PER_SOL);
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  // Show loading state
  if (isConnecting) {
    return <div>Connecting with passkey…</div>;
  }

  // Show connect button
  if (!isConnected) {
    return (
      <button onClick={handleConnect}>
        Connect Wallet with Passkey
      </button>
    );
  }

  // Show wallet info
  return (
    <div>
      <p>Connected: {smartWalletPubkey?.toString()}</p>
      <p>Balance: {balance?.toFixed(4)} SOL</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

**Key Concepts:**

1. **useWallet Hook**: Provides all wallet functionality
2. **smartWalletPubkey**: The user's Solana wallet address
3. **connect()**: Triggers passkey authentication
4. **signAndSendTransaction()**: Sends transactions with passkey signing

### Step 2: Implementing Transactions

Add a transfer function:

```tsx
const handleTransfer = async (recipient: string, amount: number) => {
  if (!smartWalletPubkey || !signAndSendTransaction) return;

  try {
    const recipientPubkey = new PublicKey(recipient);
    const amountLamports = amount * LAMPORTS_PER_SOL;

    // Create transfer instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: recipientPubkey,
      lamports: amountLamports,
    });

      // Send transaction (signed with passkey)
      // IMPORTANT: Use wallet-paid transaction only (no paymaster flags)
      // - Paymasters typically reject native SOL transfers (policy-level)
      // - Wallet-paid transactions avoid simulation failures (0x2 errors)
      // - This reflects production-accurate behavior
      // DO NOT pass paymaster, skipPaymaster, or custom flags
      // DO NOT retry manually - let LazorKit handle it
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });

    console.log('Transaction successful:', signature);
  } catch (err) {
    console.error('Transaction failed:', err);
  }
};
```

**Important Notes:**
- User approves transaction via passkey (biometric authentication)
- For native SOL transfers, transaction fees are paid from wallet balance
- Paymaster may sponsor fees for other transaction types (token transfers, etc.)
- This reflects realistic production behavior where native SOL transfers use wallet-paid fees

---

## Testing

### Step 1: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 2: Test Passkey Authentication

1. Click "Connect Wallet with Passkey"
2. Your browser will prompt for biometric authentication
3. Use Face ID, Touch ID, or Windows Hello
4. Wallet connects automatically

**First-time users:**
- Browser creates a new passkey
- Passkey is stored securely on your device
- No passwords or seed phrases needed

**Returning users:**
- Browser uses existing passkey
- Instant authentication
- Works across devices (if synced)

### Step 3: Get Devnet SOL

1. Copy your wallet address
2. Visit [Solana Faucet](https://faucet.solana.com)
3. Paste address and request 1 SOL (Devnet)
4. Wait ~30 seconds for confirmation

### Step 4: Send Test Transaction

1. Enter a recipient address
2. Enter amount (e.g., 0.1 SOL)
3. Click "Send"
4. Approve with passkey
5. Transaction sent successfully! (Fees paid from wallet balance for native SOL transfers)

**Note:** If you see an iframe security warning (`allow-scripts and allow-same-origin`), this is a browser security notice from `portal.lazor.sh` and can be safely ignored. This is common in wallet SDKs and does not affect functionality.

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Important Considerations

1. **HTTPS Required**: Passkeys only work on HTTPS
2. **Domain Configuration**: Update passkey RP ID for your domain
3. **Mainnet**: Switch RPC URL to mainnet for production
4. **Paymaster**: Consider your own paymaster for production

---

## Troubleshooting

### Common Issues

#### Error 0x2: "Transaction simulation failed" or "custom program error: 0x2"

**What it means:**
In LazorKit + smart wallet flows, error 0x2 typically indicates one of these issues:

1. **Paymaster rejection** (most common):
   - Paymasters reject native SOL transfers at policy level
   - Transaction is routed through paymaster but gets rejected
   - This is expected behavior, not a bug

2. **Smart wallet config state issue**:
   - Wallet config update loop corrupted internal state
   - Wallet appears connected but execution fails
   - Requires wallet reconnect to fix

3. **Transaction size/compute issues**:
   - Paymaster adds extra instructions
   - Retry logic inflates transaction size
   - Transaction exceeds limits

**Solutions (try in order):**

1. **Disconnect and reconnect wallet** - Resets smart wallet state (most common fix)
2. **Clear browser storage** - Application → Storage → Clear site data, then reload
3. **Use fresh browser profile/incognito** - Resets all cached state
4. **Check balance** - Ensure sufficient SOL for transaction + fees (~0.001 SOL)
5. **Wait and retry** - Network congestion can cause temporary failures

**Important Notes:**
- This demo uses wallet-paid transactions (not gasless) for native SOL transfers
- This is production-accurate behavior and avoids paymaster-related failures
- Error 0x2 is typically a paymaster/wallet state issue, not insufficient funds
- DO NOT pass paymaster flags or retry manually - let LazorKit handle it

**Code Pattern (Correct):**
```typescript
// ✅ Correct: Simple wallet-paid transaction
const signature = await signAndSendTransaction({
  instructions: [instruction],
});

// ❌ Wrong: Don't pass paymaster flags
const signature = await signAndSendTransaction({
  instructions: [instruction],
  paymaster: false, // Don't do this
  skipPaymaster: true, // Don't do this
});
```

#### Other Common Issues

#### 1. "Passkey not supported"

**Solution**: Ensure you're using HTTPS and a supported browser:
- Chrome 67+
- Safari 14+
- Firefox 60+
- Edge 79+

#### 2. "Connection failed"

**Possible causes:**
- Browser blocked passkey prompt
- User cancelled authentication
- Network issues

**Solution**:
```tsx
const handleConnect = async () => {
  try {
    await connect();
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      alert('Passkey authentication was cancelled');
    } else {
      alert('Connection failed. Please try again.');
    }
  }
};
```

#### 3. "Transaction failed" or "Error 0x2"

**What it means:**
In LazorKit + smart wallet flows, error 0x2 typically indicates one of these issues:

1. **Paymaster rejection** (most common):
   - Paymasters reject native SOL transfers at policy level
   - Transaction is routed through paymaster but gets rejected
   - This is expected behavior, not a bug

2. **Smart wallet config state issue**:
   - Wallet config update loop corrupted internal state
   - Wallet appears connected but execution fails
   - Requires wallet reconnect to fix

3. **Transaction size/compute issues**:
   - Paymaster adds extra instructions
   - Retry logic inflates transaction size
   - Transaction exceeds limits

**Solutions (try in order):**

1. **Disconnect and reconnect wallet** - Resets smart wallet state (most common fix)
2. **Clear browser storage** - Application → Storage → Clear site data, then reload
3. **Use fresh browser profile/incognito** - Resets all cached state
4. **Check balance** - Ensure sufficient SOL for transaction + fees (~0.001 SOL)
5. **Wait and retry** - Network congestion can cause temporary failures

**Important Notes:**
- This demo uses wallet-paid transactions (not gasless) for native SOL transfers
- This is production-accurate behavior and avoids paymaster-related failures
- Error 0x2 is typically a paymaster/wallet state issue, not insufficient funds
- DO NOT pass paymaster flags or retry manually - let LazorKit handle it

**Code Pattern (Correct):**
```typescript
// ✅ Correct: Simple wallet-paid transaction
const signature = await signAndSendTransaction({
  instructions: [instruction],
});

// ❌ Wrong: Don't pass paymaster flags
const signature = await signAndSendTransaction({
  instructions: [instruction],
  paymaster: false, // Don't do this
  skipPaymaster: true, // Don't do this
});
```

**Other checks:**
- Sufficient balance
- Valid recipient address
- RPC connection status

#### 4. "Localhost not working"

**Solution**: Use `localhost` (not `127.0.0.1`) and HTTPS:
```bash
next dev --experimental-https
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
const { error } = useWallet();

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={connect}>Retry</button>
    </div>
  );
}
```

### 2. Loading States

Show loading indicators:

```tsx
if (isConnecting) {
  return <LoadingSpinner />;
}
```

### 3. Transaction Confirmations

Wait for transaction confirmation:

```tsx
const signature = await signAndSendTransaction({...});
const connection = new Connection(RPC_URL, 'confirmed');
await connection.confirmTransaction(signature, 'confirmed');
```

### 4. Memoization

Memoize expensive operations:

```tsx
const connection = useMemo(
  () => new Connection(RPC_URL, 'confirmed'),
  []
);
```

---

## Next Steps

1. **Explore Advanced Features**:
   - Token transfers (SPL tokens)
   - NFT minting
   - Smart contract interactions

2. **Customize UI**:
   - Add your branding
   - Improve error messages
   - Add animations

3. **Production Readiness**:
   - Set up monitoring
   - Add analytics
   - Implement recovery flows

4. **Read More**:
   - [LazorKit Documentation](https://docs.lazorkit.com)
   - [Solana Web3.js Guide](https://docs.solana.com/developing/clients/javascript-api)
   - [WebAuthn Guide](https://webauthn.guide/)

---

## Additional Resources

- **LazorKit GitHub**: [github.com/lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit)
- **Telegram Community**: [t.me/lazorkit](https://t.me/lazorkit)
- **Solana Devnet Faucet**: [faucet.solana.com](https://faucet.solana.com)
- **Solana Explorer**: [explorer.solana.com](https://explorer.solana.com)

---

**Built with ❤️ for Superteam Earn**
