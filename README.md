# LazorKit Integration Example - Next.js Starter

<div align="center">

![LazorKit Banner](https://img.shields.io/badge/LazorKit-Passkey_Auth-purple?style=for-the-badge)
![Solana](https://img.shields.io/badge/Solana-Devnet-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge)

**A practical Next.js example demonstrating LazorKit SDK integration for passwordless Solana wallet authentication and smart wallet transactions.**

> **Built for:** [Superteam Earn - LazorKit Integration Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)
> 
> **Goal:** Help Solana developers get started with LazorKit by providing clear, practical integration examples.

</div>

---

## ✨ What This Example Demonstrates

**This isn't just a demo—it's a complete, production-ready example** that shows you how to build the future of Web3 UX. No seed phrases, no passwords, just biometric magic.

### 🔐 Core LazorKit Features

-  **🔑 Passkey Authentication** - Face ID, Touch ID, Windows Hello. Complete implementation that just works.
-  **💸 Smart Wallet Transactions** - Send SOL with a simple biometric approval. No seed phrases needed!
-  **⚡ Paymaster Integration** - Gasless transactions for supported types. Users don't pay fees!
-  **✍️ Message Signing** - Verify wallet ownership without spending SOL
-  **📊 Transaction History** - Real-time tracking with beautiful UI
-  **📷 QR Code Scanner** - Point, scan, send. No more typing long addresses!
-  **🔄 Error Recovery** - Smart automatic recovery from passkey cache issues

### 🎁 Bonus Features

-  **💳 Subscription Billing** - Build Netflix-style subscriptions on Solana. One approval, recurring payments.
-  **📱 Premium Mobile UX** - Works flawlessly on 320px screens. Yes, really!
-  **🎨 Modern UI** - Glassmorphism, smooth animations, and that premium feel
-  **🚀 Production Ready** - Error handling, retry logic, and all the essential stuff

---

## 🌐 Live Demo

**Deployed on Devnet:** [View Live Demo](https://passkey-lazorkit-demo.onrender.com)

> **Note:** The live demo is deployed on Devnet. You can test passkey authentication and transactions. Get Devnet SOL from the [Solana Faucet](https://faucet.solana.com) to test transactions.


---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- Modern browser with WebAuthn support (Chrome, Safari, Firefox, Edge)
- **HTTPS or localhost** (required for WebAuthn/passkeys)

### Installation

```bash
# Clone the repository
git clone https://github.com/shrijitmore/passkey-lazorkit-demo.git
cd passkey-lazorkit-demo

# Install dependencies
npm install

# Start development server with HTTPS (required for transactions)
npm run dev:https
```

Open [https://localhost:3000](https://localhost:3000) in your browser.

> **⚠️ Important:** Transactions require HTTPS. While passkey authentication may work on `http://localhost`, **sending transactions requires HTTPS**. Use `npm run dev:https` to run with HTTPS locally.
>
> **First time setup:** Next.js will automatically generate self-signed certificates. Your browser will show a security warning - click "Advanced" → "Proceed to localhost" to continue. This is safe for local development.

### First Steps (3 Minutes to Success!)

1. **🔐 Connect with Passkey** - Click "Connect with Passkey" and use Face ID/Touch ID/Windows Hello
2. **💰 Get Devnet SOL** - Visit [Solana Faucet](https://faucet.solana.com) and request SOL to your wallet
3. **🚀 Send Your First Transaction** - Go to Wallet page, enter an address, and approve with your passkey!

**That's it!** You just sent a transaction without a seed phrase. Welcome to the future of Web3. 🎉

### SDK Installation & Configuration

The LazorKit SDK is already configured in this example. Here's how it's set up:

```typescript
// app/components/providers/LazorkitProviderWrapper.tsx
import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo } from 'react';
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '../../lib/constants/urls';
import type { PartialLazorkitProviderConfig } from '../../lib/types/lazorkit';

const paymasterConfig = useMemo(
  () => ({ paymasterUrl: PAYMASTER_URL }),
  []
);

const additionalProps: PartialLazorkitProviderConfig = {
  isDebug: true,
  network: 'devnet',
};

<LazorkitProvider
  rpcUrl={RPC_URL}
  portalUrl={PORTAL_URL}
  paymasterConfig={paymasterConfig}
  {...(additionalProps as PartialLazorkitProviderConfig)}
>
  {children}
</LazorkitProvider>
```

**Note**: URLs are centralized in `app/lib/constants/urls.ts` for easier maintenance. Type definitions are available in `app/lib/types/lazorkit.ts` for proper TypeScript support. The `paymasterConfig` is memoized to prevent object recreation on each render.

---

## 📁 Project Structure

```
passkey-lazorkit-demo/
├── app/
│   ├── components/
│   │   ├── providers/                   # React Context Providers
│   │   │   ├── LazorkitProviderWrapper.tsx  # LazorKit SDK provider setup
│   │   │   └── Providers.tsx            # Combined providers wrapper
│   │   ├── wallet/                      # Wallet-related components
│   │   │   ├── WalletPanelEnhanced.tsx  # Main wallet UI example
│   │   │   ├── TransferModal.tsx         # Transaction sending example
│   │   │   └── TransactionHistory.tsx   # Transaction history example
│   │   ├── subscription/                # Subscription-related components
│   │   │   ├── SubscriptionDemo.tsx     # Subscription billing example
│   │   │   └── ...                      # Other subscription components
│   │   ├── ui/                          # Reusable UI components
│   │   │   ├── QRScanner.tsx            # QR code scanner component
│   │   │   ├── ErrorRecovery.tsx        # Error recovery UI component
│   │   │   └── ...                      # Other UI components
│   │   └── ...                          # Other component folders
│   ├── lib/
│   │   ├── hooks/
│   │   │   ├── useTransactionSigning.ts    # Transaction signing hook
│   │   │   └── useWebAuthnConnection.ts     # WebAuthn connection hook
│   │   ├── utils/
│   │   │   ├── errorHandling.ts         # Error handling utilities
│   │   │   └── explorerUrls.ts          # Solana Explorer URL helpers
│   │   ├── rpc/
│   │   │   └── connection.ts            # Solana RPC connection singleton
│   │   └── constants/
│   │       └── urls.ts                  # URL constants
│   ├── contexts/
│   │   └── BalanceContext.tsx            # Balance management context
│   ├── page.tsx                         # Dashboard page
│   ├── wallet/page.tsx                  # Wallet management page
│   └── subscription/page.tsx            # Subscription page
├── docs/
│   └── tutorials/                       # Step-by-step tutorials
│       ├── tutorial-1-passkey-wallet.md      # Passkey authentication
│       ├── tutorial-2-transactions.md         # Sending transactions
│       ├── tutorial-3-session-persistence.md  # Session management
│       └── tutorial-4-subscription-billing.md # Subscription system
└── README.md                            # This file
```

**Key Files for LazorKit Integration:**
- `app/components/providers/LazorkitProviderWrapper.tsx` - SDK provider configuration
- `app/components/wallet/WalletPanelEnhanced.tsx` - Complete wallet example
- `app/components/wallet/TransferModal.tsx` - Transaction sending example
- `app/lib/hooks/useTransactionSigning.ts` - Transaction signing with retry logic
- `app/page.tsx` - Dashboard with connection example

---

## 📚 Step-by-Step Tutorials

**Ready to build?** Follow these tutorials to master LazorKit integration. Each tutorial builds on the previous one, so we recommend following them in order.

### 🎯 Start Here (Essential)

1. **[Tutorial 1: Passkey Wallet Setup](./docs/tutorials/tutorial-1-passkey-wallet.md)**
   - Create your first passkey-based wallet
   - Understand WebAuthn authentication flow
   - Connect to LazorKit smart wallet in minutes

2. **[Tutorial 2: Sending Transactions](./docs/tutorials/tutorial-2-transactions.md)**
   - Send SOL with just a biometric approval
   - Master the `signAndSendTransaction` method
   - Handle errors like a pro

### 🚀 Level Up (Advanced)

3. **[Tutorial 3: Session Persistence](./docs/tutorials/tutorial-3-session-persistence.md)**
   - Keep users logged in across devices
   - Manage wallet state like a pro
   - Learn session management best practices

4. **[Tutorial 4: Subscription Billing](./docs/tutorials/tutorial-4-subscription-billing.md)**
   - Build Netflix-style subscriptions on Solana
   - Implement recurring payments with smart wallets
   - Track payment history

---

## 🎯 LazorKit SDK Integration

**Quick Reference:** Here are the essential patterns you'll use in your app. For complete examples, check out the tutorials above.

#### 1. Provider Setup

```typescript
// app/components/providers/LazorkitProviderWrapper.tsx
import { LazorkitProvider } from '@lazorkit/wallet';
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '../../lib/constants/urls';

const paymasterConfig = useMemo(
  () => ({ paymasterUrl: PAYMASTER_URL }),
  []
);

<LazorkitProvider
  rpcUrl={RPC_URL}
  portalUrl={PORTAL_URL}
  paymasterConfig={paymasterConfig}
  isDebug={true}
  network="devnet"
>
  {children}
</LazorkitProvider>
```

> **Note:** In the actual codebase, URLs are centralized in `app/lib/constants/urls.ts` and the provider uses `useMemo` for optimization. See `LazorkitProviderWrapper.tsx` for the complete implementation.

#### 2. Passkey Authentication

```typescript
// Using the wallet hook
import { useWallet } from '@lazorkit/wallet';

const { connect, smartWalletPubkey, isConnected } = useWallet();

// Connect with passkey (triggers biometric prompt)
await connect();
```

#### 3. Sending Transactions

```typescript
const { signAndSendTransaction, smartWalletPubkey } = useWallet();
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Create transaction instruction
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: recipientPubkey,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

// Sign and send (passkey signing happens automatically)
const signature = await signAndSendTransaction({
  instructions: [instruction],
});
```

### What You Get

- ✅ **Passkey Authentication** - No seed phrases, just biometric auth
- ✅ **Smart Wallet** - Program Derived Address (PDA) managed by LazorKit
- ✅ **Paymaster Integration** - Gasless transaction support (for supported types)
- ✅ **Transaction Signing** - Automatic passkey signing for all transactions
- ✅ **Session Management** - Persistent wallet sessions across page reloads

> **💡 Pro Tip:** Check out `app/components/wallet/WalletPanelEnhanced.tsx` to see a complete production-ready implementation.

### 💰 Receiving USDC/SPL Tokens

**Quick Tip:** Before you can receive SPL tokens from external wallets, you must first **initialize your token account**. Here's how:

#### ⚠️ Important: Multiple USDC Tokens on Devnet

**Heads up!** There are multiple USDC tokens on Devnet, which can be confusing:

| Token | Mint Address | Source |
|-------|-------------|--------|
| **USDC-Dev** (default) | `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr` | [spl-token-faucet.com](https://spl-token-faucet.com) |
| Circle USDC | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | [Circle Faucet](https://faucet.circle.com) |

This demo uses **USDC-Dev** by default, which is compatible with Phantom and most Devnet wallets.

#### Why Phantom Shows "Failed to generate a valid transaction"

**The Issue:** Solana requires an **Associated Token Account (ATA)** to exist before receiving SPL tokens. Your LazorKit smart wallet is a PDA (Program Derived Address), and external wallets cannot create the ATA for you—you need to create it first.

#### How to receive USDC:

1. Navigate to **Wallet → Receive tab**
2. Look for the **"Cannot Receive USDC Yet!"** warning banner
3. Click **"Initialize USDC Account"** (requires ~0.002 SOL for rent)
4. Wait for confirmation
5. Get USDC-Dev from the [SPL Token Faucet](https://spl-token-faucet.com/?token-name=USDC-Dev)
6. Now you can receive USDC from any wallet! ✅

> **💡 Tip:** Get Devnet SOL from the [Solana Faucet](https://faucet.solana.com) first if you need SOL for the rent cost.

### ⚠️ Troubleshooting: Transaction Size Error

**If you see this error:**
```
Transaction too large: Transaction size exceeds Solana's 1232 byte limit
```

**Don't panic!** This demo includes automatic error recovery. When this happens:

1. **Automatic Recovery UI** will appear with a "Clear Cache & Retry" button
2. Click the button to automatically:
   - Clear all application caches
   - Disconnect and reconnect your wallet
   - Retry the transaction
3. The recovery process handles everything automatically

**Manual Troubleshooting (if automatic recovery doesn't work):**

1. **First, check if you have sufficient balance:**
   - Verify your wallet balance is enough for the transaction amount
   - Ensure you have enough SOL to cover transaction fees
   - If balance is insufficient, fund your wallet and try again

2. **If you have sufficient balance, this is likely a passkey cache problem:**
   - **Root Cause**: Passkey cache inconsistencies can cause the paymaster pipeline to create oversized transactions
   - When passkey credentials are cached inconsistently, transaction size calculation can exceed Solana's 1232 byte limit
   - This can happen with any transaction amount, not just small ones

**Manual Solution - Clear Cache and Reconnect:**

**Disconnect wallet, clear cache and site data, then reconnect** - This resolves cached passkey credential issues:

- **Chrome/Edge**: Settings → Privacy → Clear browsing data → Select "Cached images and files" and "Site data"
- **Firefox**: Settings → Privacy → Clear Data → Select "Cached Web Content" and "Site Preferences"
- **Safari**: Develop → Empty Caches (enable Develop menu in Preferences)

After clearing cache and reconnecting, you should be able to send transactions of any amount (including very small amounts like 0.001 SOL).

**Important Notes:**
- This is a passkey cache issue, not a transaction size limitation
- The transaction is still signed using passkeys (WebAuthn)
- The transaction is still executed via a smart wallet (PDA)
- All transactions are verifiable on-chain via Solana Explorer
- The demo includes automatic retry logic (up to 2 retries) with exponential backoff

**Note:** The iframe security warning (`allow-scripts and allow-same-origin`) is a browser security notice from `portal.lazor.sh` and can be safely ignored. This is common in wallet SDKs and does not affect functionality.

---

## 🧪 Testing Your Integration

**Ready to test?** Here's a quick checklist to verify everything works:

### ✅ Test Passkey Authentication

1. Start the dev server: `npm run dev:https`
2. Open [https://localhost:3000](https://localhost:3000) in your browser
3. Accept the security warning (it's safe—just a self-signed cert for local dev)
4. Click "Connect with Passkey"
5. Authenticate with Face ID/Touch ID/Windows Hello
6. ✅ Verify your wallet address is displayed

### ✅ Test Transactions

1. Connect your wallet (make sure you're on HTTPS!)
2. Get some Devnet SOL from the [faucet](https://faucet.solana.com)
3. Navigate to the Wallet page
4. Send SOL to any address
5. Approve with your passkey
6. ✅ Check your transaction on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

> **⚠️ Remember:** Always use `https://localhost:3000`, not `http://localhost:3000`. Transactions require HTTPS!

### Browser Compatibility

✅ **Chrome** 67+ (Desktop & Mobile)
✅ **Safari** 14+ (macOS & iOS)
✅ **Edge** 79+
✅ **Firefox** 60+

---

## 🚢 Deployment

### Option 1: Deploy to Render (Recommended)

**Why Render?** Simple setup, automatic HTTPS, free tier, auto-deploy from GitHub.

**Quick Steps:**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Web Service on Render**
   - Go to [render.com](https://render.com) and sign up/login with GitHub
   - Click "New" → "Web Service"
   - Connect your repository
   - Render auto-detects Next.js, but verify these settings:
     - **Name**: `passkey-lazorkit-demo` (or your choice)
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
   - Click "Create Web Service"

3. **Wait for Build** (2-5 minutes for first build)
   - Render automatically provides HTTPS
   - Your app URL: `https://your-project.onrender.com`

> **💡 Tip:** Subsequent deployments are faster. Render auto-deploys on every push to your main branch.

### Option 2: Deploy to Vercel

**Why Vercel?** Built by Next.js creators - zero config, automatic HTTPS, free tier.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/shrijitmore/passkey-lazorkit-demo)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Or use Vercel Dashboard:** Push to GitHub → Import on vercel.com → Deploy (HTTPS automatic)

### Option 3: Deploy to Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Option 4: Deploy to Google Cloud Platform (GCP)

**Using Cloud Run:**
```bash
npm run build
gcloud run deploy lazorkit-demo --source . --platform managed --region us-central1 --allow-unauthenticated
```

**Using App Engine:** Create `app.yaml` and run `gcloud app deploy`

**Note:** GCP requires more setup. See the deployment section above for basic instructions.

### Important: HTTPS Required for Transactions

**Transactions require HTTPS** - this is a requirement for LazorKit transactions, not just passkey authentication.

#### Local Development with HTTPS

For local development, use the HTTPS development server:

```bash
npm run dev:https
```

Then open [https://localhost:3000](https://localhost:3000) in your browser.

**First Time Setup:**
1. Next.js will automatically generate self-signed certificates in `.next/certificates/`
2. Your browser will show a security warning (this is normal for self-signed certs)
3. Click "Advanced" → "Proceed to localhost" (or similar)
4. The certificate is safe for local development

**Why HTTPS is Required:**
- Passkey authentication may work on `http://localhost` for basic connection
- **Transactions require HTTPS** - LazorKit's transaction signing pipeline needs secure context
- Production deployments (Render, Vercel, Netlify) provide HTTPS automatically

**Troubleshooting HTTPS:**
- If port 3000 is in use: `npm run dev:https -- -p 3001` (then use `https://localhost:3001`)
- Browser security warning is normal for self-signed certificates - click "Advanced" → "Proceed to localhost"
- For production, all recommended platforms provide HTTPS automatically

---

## 🔧 Configuration

### RPC Configuration

The demo uses Solana's **public Devnet RPC** (`https://api.devnet.solana.com`) by default, which works perfectly for development and demos. This is configured in `app/lib/constants/urls.ts`.

**For Production or Heavy Usage (Optional):**

If you need higher rate limits or better performance, you can optionally use a private RPC provider:

1. **Helius** - 100,000 requests/day free tier
   - Sign up at [helius.dev](https://www.helius.dev/)
   - Update `app/lib/constants/urls.ts`:
   ```typescript
   export const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY';
   ```

2. **QuickNode** - 1M requests/month free tier
   - Sign up at [quicknode.com](https://www.quicknode.com/)
   - Update `app/lib/constants/urls.ts`:
   ```typescript
   export const RPC_URL = 'https://YOUR_ENDPOINT.solana-devnet.quiknode.pro/YOUR_KEY';
   ```

3. **Alchemy** - 300M compute units/month free tier
   - Sign up at [alchemy.com](https://www.alchemy.com/)
   - Update `app/lib/constants/urls.ts`:
   ```typescript
   export const RPC_URL = 'https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY';
   ```

**Note:** The public RPC is sufficient for this demo. Private providers are only needed if you hit rate limits or need production-grade performance.

### Environment Variables (Optional)

Create `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

---

## 🏆 Bounty Submission

This project is submitted for the **Superteam Earn - LazorKit Integration Bounty**.

### ✅ Required Deliverables

- [x] **Working Example Repo** - Complete Next.js 16 (React 19) application with TypeScript
- [x] **Clean Code Structure** - Well-organized folder structure with clear separation of concerns
- [x] **Well-Documented Code** - Comprehensive comments explaining LazorKit integration
- [x] **Quick-Start Guide** - Clear README with installation, configuration, and setup instructions
- [x] **4 Step-by-Step Tutorials** - Located in [`docs/tutorials/`](./docs/tutorials/) (2x the requirement)
- [x] **Live Demo** - Deployed on Render at [https://passkey-lazorkit-demo.onrender.com](https://passkey-lazorkit-demo.onrender.com)

### 🎯 What Makes This Special

1. **📱 Premium Mobile UX** - Works flawlessly on 320px screens. Most "responsive" apps break here—this one doesn't.
2. **🔧 Advanced Solutions** - Custom `useTransactionSigning` hook that automatically fixes WebAuthn credential issues (a real-world problem solved).
3. **📚 Comprehensive Learning** - 4 detailed tutorials covering everything from basics to advanced subscription billing.
4. **🚀 Production Ready** - Centralized constants, singleton patterns, and modular architecture—perfect starter template.

### Key LazorKit Features Demonstrated

This example clearly demonstrates:

1. **Passkey Authentication** - Complete WebAuthn implementation with biometric authentication
   - See: `app/components/wallet/WalletPanelEnhanced.tsx` and `app/page.tsx`
   - Tutorial: [Tutorial 1: Passkey Wallet](./docs/tutorials/tutorial-1-passkey-wallet.md)

2. **Smart Wallet Transactions** - Real SOL transfers with passkey signing
   - See: `app/wallet/page.tsx` (complete wallet page with Send/Receive/Verify tabs and QR scanner)
   - See: `app/components/wallet/TransferModal.tsx` (transaction modal component)
   - See: `app/components/ui/QRScanner.tsx` (QR code scanner for wallet addresses)
   - Tutorial: [Tutorial 2: Transactions](./docs/tutorials/tutorial-2-transactions.md)

3. **Paymaster Integration** - Gasless transaction support
   - See: `app/components/providers/LazorkitProviderWrapper.tsx`
   - Configured with official Devnet paymaster

4. **Session Persistence** - Wallet state management across page reloads
   - Tutorial: [Tutorial 3: Session Persistence](./docs/tutorials/tutorial-3-session-persistence.md)

5. **Subscription Billing** - Recurring payments with smart wallets
   - See: `app/components/subscription/SubscriptionDemo.tsx`
   - Tutorial: [Tutorial 4: Subscription Billing](./docs/tutorials/tutorial-4-subscription-billing.md)

### Code Quality

- ✅ **TypeScript** - Full type safety throughout
- ✅ **Error Handling** - Comprehensive error handling with user-friendly messages
- ✅ **Best Practices** - React hooks, context API, singleton patterns
- ✅ **Reusable Components** - Modular, reusable UI components
- ✅ **Performance Optimized** - Memoization, request deduplication, caching

---

## 💡 Key Integration Points

### 1. Provider Setup (Required)
```typescript
// app/components/providers/LazorkitProviderWrapper.tsx
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
>
  <App />
</LazorkitProvider>
```

### 2. Passkey Authentication
```typescript
// Using the wallet hook
const { connect, smartWalletPubkey, isConnected } = useWallet();

// Connect triggers biometric prompt (Face ID, Touch ID, Windows Hello)
await connect();
```

### 3. Sending Transactions
```typescript
const { signAndSendTransaction } = useWallet();

// Create instruction
const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: recipientPubkey,
  lamports: 0.1 * LAMPORTS_PER_SOL,
});

// Sign and send (passkey signing happens automatically)
const signature = await signAndSendTransaction({
  instructions: [instruction],
});
```

### 4. Message Signing
```typescript
const { signMessage } = useWallet();

// Sign message for wallet verification (no transaction needed)
const signature = await signMessage("Hello, LazorKit!");
```

> **💡 Want more?** Check out the [tutorials](./docs/tutorials/) for complete examples with error handling and best practices.

## 📖 Learn More

**Ready to dive deeper?** Here are some helpful resources:

- **[LazorKit Docs](https://docs.lazorkit.com)** - Official SDK documentation
- **[LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)** - Source code and examples
- **[Solana Web3.js](https://docs.solana.com)** - Solana development guide
- **[WebAuthn Guide](https://webauthn.guide)** - Understanding passkeys
- **[Telegram Group](https://t.me/lazorkit)** - Get help from the community

---

## 📄 License

MIT License - feel free to use this starter for your projects!

---

## 🙏 Acknowledgments

- **LazorKit Team** - For the amazing SDK and support
- **Superteam** - For organizing the bounty
- **Solana Foundation** - For the incredible blockchain infrastructure

---

<div align="center">

**Built with ❤️ for Superteam Earn**

⭐ Star this repo if you found it helpful!

</div>
