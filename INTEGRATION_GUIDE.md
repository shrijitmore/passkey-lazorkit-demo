# LazorKit Integration Guide

A comprehensive, step-by-step guide to integrating LazorKit SDK into your Next.js application for passwordless passkey authentication and gasless Solana transactions.

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

### Step 3: Install Optional Dependencies

For enhanced passkey functionality:

```bash
npm install @simplewebauthn/browser @simplewebauthn/types
```

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
const PAYMASTER_URL = 'https://lazorkit-paymaster.onrender.com';

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
    >
      {children}
    </LazorkitProvider>
  );
}
```

**Key Points:**
- `RPC_URL`: Solana RPC endpoint (use Devnet for testing)
- `PORTAL_URL`: LazorKit's portal service for passkey management
- `paymasterConfig`: Enables gasless transactions
- `useMemo`: Prevents unnecessary re-renders

### Step 2: Update Root Layout

Update `app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import LazorkitProviderWrapper from './components/LazorkitProviderWrapper';
import './globals.css';

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

Enables gasless transactions:

```typescript
paymasterConfig: {
  paymasterUrl: 'https://lazorkit-paymaster.onrender.com'
}
```

**How it works:**
- Paymaster signs transactions
- Covers SOL transaction fees
- Users don't need SOL for gas
- Great for onboarding new users

### Environment Variables (Optional)

Create `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
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

Create `app/components/WalletPanel.tsx`:

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

export default function WalletPanel() {
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
4. **signAndSendTransaction()**: Sends gasless transactions

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

    // Send transaction (gasless!)
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
- No need to request user approval for gas fees
- Paymaster automatically covers transaction costs
- User only needs to approve the transaction via passkey

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
5. Transaction sent gasless!

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

#### 3. "Transaction failed"

**Check:**
- Sufficient balance
- Valid recipient address
- RPC connection status
- Paymaster availability

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
