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

Create `app/components/providers/LazorkitProviderWrapper.tsx`:

```tsx
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

// Import URL constants from centralized location
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '../../lib/constants/urls';

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

  // Additional provider props with proper TypeScript types
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
```

**Key Points:**
- URLs are imported from `../../lib/constants/urls.ts` (centralized configuration)
- Type definitions are imported from `../../lib/types/lazorkit.ts` for proper TypeScript support
- `RPC_URL`: Solana RPC endpoint (use Devnet for testing)
- `PORTAL_URL`: LazorKit's portal service for passkey management
- `paymasterConfig`: Paymaster configuration (may sponsor fees for certain transaction types)
- `isDebug: true`: Enables debug logging for development
- `network: 'devnet'`: Sets the Solana network
- `useMemo`: Prevents unnecessary re-renders
- Proper TypeScript types are used instead of `as any` assertions

### Step 2: Create Providers Wrapper (Optional but Recommended)

For better organization, especially if you have multiple providers (like theme providers), create a `Providers.tsx` component:

```tsx
// app/components/providers/Providers.tsx
'use client';

import { ReactNode } from 'react';
import LazorkitProviderWrapper from './LazorkitProviderWrapper';
import { ThemeProvider } from '../../contexts/ThemeContext'; // If you have a theme provider

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
import Providers from './components/providers/Providers';
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
import LazorkitProviderWrapper from './components/providers/LazorkitProviderWrapper';

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

Create `app/components/wallet/WalletPanelEnhanced.tsx` (or a simpler `WalletPanel.tsx`):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

import { getConnection } from '../../lib/rpc/connection';
import { useTransactionSigning } from '../../lib/hooks/useTransactionSigning';

export default function WalletPanelEnhanced() {
  const {
    smartWalletPubkey,    // User's wallet address
    isConnected,           // Connection status
    isConnecting,          // Loading state
    connect,               // Connect function
    disconnect,            // Disconnect function
    error,                 // Error state
  } = useWallet();
  const { signTransaction } = useTransactionSigning();

  const [balance, setBalance] = useState<number | null>(null);

  // Fetch balance when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
    }
  }, [isConnected, smartWalletPubkey]);

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    const connection = getConnection();
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
4. **useTransactionSigning Hook**: Wraps transaction signing with automatic credential refresh and retry logic

### Step 2: Implementing Transactions

Add a transfer function:

```tsx
// Note: Import useTransactionSigning hook at the top of the component
import { useTransactionSigning } from '../../lib/hooks/useTransactionSigning';

const handleTransfer = async (recipient: string, amount: number) => {
  if (!smartWalletPubkey) return;

  const { signTransaction } = useTransactionSigning();

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
      // Note: For native SOL transfers, fees are paid from wallet balance
      // Note: useTransactionSigning hook handles automatic credential refresh and retry logic
      const signature = await signTransaction({
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

### Step 1: Start Development Server with HTTPS

**⚠️ Important:** Transactions require HTTPS. Use the HTTPS development server:

```bash
npm run dev:https
```

Open [https://localhost:3000](https://localhost:3000)

**First Time Setup:**
- Next.js will automatically generate self-signed certificates
- Your browser will show a security warning - click "Advanced" → "Proceed to localhost"
- This is safe for local development

**Note:** While passkey authentication may work on `http://localhost`, **sending transactions requires HTTPS**.

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

### Option 1: Deploy to Vercel (Recommended)

**Why Vercel?**
- Built by Next.js creators - zero configuration needed
- Automatic HTTPS (required for transactions)
- Free tier with generous limits
- One-click deployment
- Global CDN included

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Or use the Vercel Dashboard:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click "Deploy" (automatic HTTPS included)

### Option 2: Deploy to Google Cloud Platform (GCP)

**Using Cloud Run (Recommended for GCP):**

```bash
# Build the Next.js app
npm run build

# Create a Dockerfile (if not exists)
# Then deploy to Cloud Run:
gcloud run deploy lazorkit-demo \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Using App Engine:**

1. Create `app.yaml`:
```yaml
runtime: nodejs20
env: standard
automatic_scaling:
  min_instances: 1
```

2. Deploy:
```bash
gcloud app deploy
```

**Note:** GCP requires more setup (Dockerfile, app.yaml, billing account). Vercel is faster for Next.js apps.

### Option 3: Deploy to Render

**Why Render?**
- Simple setup with automatic HTTPS
- Free tier available
- Auto-deploy from GitHub
- Good Next.js support

**Steps:**
1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Render auto-detects Next.js configuration
5. Click "Create Web Service"
6. HTTPS is provided automatically

**Or use Render CLI:**
```bash
# Install Render CLI
npm i -g render-cli

# Deploy
render deploy
```

### Option 4: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Important Considerations

1. **HTTPS Required**: Transactions require HTTPS (not just passkey authentication)
2. **Local Development**: Use `npm run dev:https` for local HTTPS with auto-generated certificates
3. **Domain Configuration**: Update passkey RP ID for your domain in production
4. **Mainnet**: Switch RPC URL to mainnet for production
5. **Paymaster**: Consider your own paymaster for production

See [Local HTTPS Setup Guide](./local-https-setup.md) for detailed instructions.

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
npm run dev:https
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
import { getConnection } from '../../lib/rpc/connection';

const signature = await signTransaction({...});
const connection = getConnection();
await connection.confirmTransaction(signature, 'confirmed');
```

**Note**: In the actual codebase, we use `getConnection()` which provides a singleton Connection instance. This is more efficient than creating new connections or memoizing, and prevents multiple connection instances.

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
