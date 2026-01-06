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

This repository showcases **real-world LazorKit SDK integration** with practical examples:

### Core LazorKit Features

-  **Passkey Authentication** - Complete implementation with Face ID, Touch ID, Windows Hello
-  **Smart Wallet Transactions** - Send SOL with passkey-secured signing (no seed phrases!)
-  **Paymaster Integration** - Gasless transaction support via paymaster configuration
-  **Message Signing** - Verify wallet ownership without on-chain transactions
-  **Transaction History** - Real-time transaction tracking and display

### Additional Examples

-  **Subscription Billing** - Recurring payments system using smart wallets
-  **Modern UI** - Clean, responsive interface with shadcn/ui components
-  **Mobile Responsive** - Works seamlessly on all devices

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
git clone https://github.com/yourusername/lazorkit-starter.git
cd lazorkit-starter

# Install dependencies
npm install

# Start development server with HTTPS (required for transactions)
npm run dev:https
```

Open [https://localhost:3000](https://localhost:3000) in your browser.

> **⚠️ Important:** Transactions require HTTPS. While passkey authentication may work on `http://localhost`, **sending transactions requires HTTPS**. Use `npm run dev:https` to run with HTTPS locally.
>
> **First time setup:** Next.js will automatically generate self-signed certificates. Your browser will show a security warning - click "Advanced" → "Proceed to localhost" to continue. This is safe for local development.

### First Steps

1. **Connect with Passkey**: Click "Connect with Passkey" and authenticate with your device's biometric (Face ID, Touch ID, or Windows Hello)
2. **Get Devnet SOL**: Visit [Solana Faucet](https://faucet.solana.com) and request SOL to your wallet address
3. **Send Transaction**: Navigate to Wallet page and transfer SOL to any address - just approve with your passkey!

### SDK Installation & Configuration

The LazorKit SDK is already configured in this example. Here's how it's set up:

```typescript
// app/components/providers/LazorkitProviderWrapper.tsx
import { LazorkitProvider } from '@lazorkit/wallet';
import { RPC_URL, PORTAL_URL, PAYMASTER_URL } from '../../lib/constants/urls';
import type { PartialLazorkitProviderConfig } from '../../lib/types/lazorkit';

const additionalProps: PartialLazorkitProviderConfig = {
  isDebug: true,
  network: 'devnet',
};

<LazorkitProvider
  rpcUrl={RPC_URL}
  portalUrl={PORTAL_URL}
  paymasterConfig={{ paymasterUrl: PAYMASTER_URL }}
  {...(additionalProps as PartialLazorkitProviderConfig)}
>
  {children}
</LazorkitProvider>
```

**Note**: URLs are centralized in `app/lib/constants/urls.ts` for easier maintenance. Type definitions are available in `app/lib/types/lazorkit.ts` for proper TypeScript support.

See [Integration Guide](./docs/guides/integration-guide.md) for detailed setup instructions.

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
│   ├── README.md                        # Documentation index
│   ├── tutorials/                       # Step-by-step tutorials
│   │   ├── tutorial-1-passkey-wallet.md      # Passkey authentication
│   │   ├── tutorial-2-transactions.md         # Sending transactions
│   │   ├── tutorial-3-session-persistence.md  # Session management
│   │   └── tutorial-4-subscription-billing.md # Subscription system
│   ├── guides/                          # Integration guides
│   │   ├── integration-guide.md         # Complete setup guide
│   │   └── rpc-configuration.md        # RPC setup guide
│   └── technical/                       # Technical documentation
│       ├── CODE_EXPLANATION.md         # Code walkthrough
│       └── TECHNICAL_EXPLANATION.md     # Technical deep dive
└── README.md                            # This file
```

**Key Files for LazorKit Integration:**
- `app/components/providers/LazorkitProviderWrapper.tsx` - SDK provider configuration
- `app/components/wallet/WalletPanelEnhanced.tsx` - Complete wallet example
- `app/components/wallet/TransferModal.tsx` - Transaction sending example
- `app/lib/hooks/useTransactionSigning.ts` - Transaction signing with retry logic
- `app/page.tsx` - Dashboard with connection example

**See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for complete folder organization.**

---

## 📚 Step-by-Step Tutorials

**Learn how to integrate LazorKit SDK with these practical tutorials:**

### Essential Tutorials (Start Here)

1. **[Tutorial 1: Passkey Wallet Setup](./docs/tutorials/tutorial-1-passkey-wallet.md)**
   - How to create a passkey-based wallet
   - WebAuthn authentication flow
   - Connecting to LazorKit smart wallet

2. **[Tutorial 2: Sending Transactions](./docs/tutorials/tutorial-2-transactions.md)**
   - How to trigger transactions with passkey signing
   - Using `signAndSendTransaction` method
   - Handling transaction errors

### Advanced Tutorials

3. **[Tutorial 3: Session Persistence](./docs/tutorials/tutorial-3-session-persistence.md)**
   - How to persist session across devices
   - Managing wallet state
   - Session management best practices

4. **[Tutorial 4: Subscription Billing](./docs/tutorials/tutorial-4-subscription-billing.md)**
   - Subscription service with automated billing
   - Smart wallet recurring payments
   - Payment history tracking

### Additional Guides

- **[Integration Guide](./docs/guides/integration-guide.md)** - Complete setup from scratch
- **[RPC Configuration](./docs/guides/rpc-configuration.md)** - RPC endpoint setup
- **[Code Explanation](./docs/technical/CODE_EXPLANATION.md)** - Detailed code walkthrough
- **[Technical Explanation](./docs/technical/TECHNICAL_EXPLANATION.md)** - How LazorKit works under the hood

See the [Documentation Index](./docs/README.md) for a complete overview.

---

## 🎯 LazorKit SDK Integration

### Core SDK Usage

This example demonstrates the essential LazorKit SDK patterns:

#### 1. Provider Setup

```typescript
// app/components/providers/LazorkitProviderWrapper.tsx
import { LazorkitProvider } from '@lazorkit/wallet';

<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
  isDebug={true}
  network="devnet"
>
  {children}
</LazorkitProvider>
```

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

### Key Features Demonstrated

- ✅ **Passkey Authentication** - No seed phrases, just biometric auth
- ✅ **Smart Wallet** - Program Derived Address (PDA) managed by LazorKit
- ✅ **Paymaster Integration** - Gasless transaction support
- ✅ **Transaction Signing** - Automatic passkey signing for all transactions
- ✅ **Session Management** - Persistent wallet sessions

For detailed examples, see the [tutorials](./docs/tutorials/) or check the code in `app/components/wallet/WalletPanelEnhanced.tsx`.

### ⚠️ Known Issue: Paymaster Transaction Size Error

If you encounter this error:

```
Transaction too large: Transaction size exceeds Solana's 1232 byte limit
```

**Automatic Recovery Available!**

This demo includes **automatic error recovery** for transaction size errors. When this error occurs:

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

## 🧪 Testing

### Test Passkey Authentication

1. Start the dev server with HTTPS: `npm run dev:https`
2. Open [https://localhost:3000](https://localhost:3000) in a supported browser
3. Accept the security warning (self-signed certificate - safe for local dev)
4. Click "Connect with Passkey"
5. Authenticate with Face ID/Touch ID/Windows Hello
6. Verify wallet address is displayed

### Test Transactions

1. Connect your wallet (on HTTPS)
2. Get Devnet SOL from [faucet](https://faucet.solana.com)
3. Navigate to Wallet page
4. Send SOL to any address
5. Approve with passkey
6. Verify transaction on [Explorer](https://explorer.solana.com/?cluster=devnet)

> **Note:** Make sure you're using `https://localhost:3000`, not `http://localhost:3000`. Transactions require HTTPS.

### Browser Compatibility

✅ **Chrome** 67+ (Desktop & Mobile)
✅ **Safari** 14+ (macOS & iOS)
✅ **Edge** 79+
✅ **Firefox** 60+

---

## 🚢 Deployment

### Option 1: Deploy to Vercel (Recommended)

**Why Vercel?** Built by Next.js creators - zero config, automatic HTTPS, free tier.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/lazorkit-starter)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Or use Vercel Dashboard:** Push to GitHub → Import on vercel.com → Deploy (HTTPS automatic)

### Option 2: Deploy to Render

**Why Render?** Simple setup, automatic HTTPS, free tier, auto-deploy from GitHub.

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repository
4. Render auto-detects Next.js
5. Click "Create Web Service"
6. HTTPS is automatic

**Or use Render CLI:**
```bash
npm i -g render-cli
render deploy
```

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

**Note:** GCP requires more setup. See [Deployment Guide](./docs/guides/integration-guide.md#deployment) for details.

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
- Production deployments (Vercel, Netlify) provide HTTPS automatically

**See [Local HTTPS Setup Guide](./docs/guides/local-https-setup.md) for detailed instructions.**

---

## 🔧 Configuration

### RPC Rate Limiting

The demo uses Solana's public Devnet RPC which has strict rate limits. For production or heavy testing, use a private RPC provider.

See [RPC Configuration Guide](./docs/guides/rpc-configuration.md) for setup instructions.

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

### Required Deliverables ✅

- ✅ **Working Example Repo** - Complete Next.js 16 application with TypeScript
- ✅ **Clean Code Structure** - Well-organized folder structure with clear separation of concerns
- ✅ **Well-Documented Code** - Comprehensive comments explaining LazorKit integration
- ✅ **Quick-Start Guide** - Clear README with installation, configuration, and setup instructions
- ✅ **4 Step-by-Step Tutorials** - Practical tutorials covering all key LazorKit features
- ✅ **Live Demo** - Deployed on Devnet with working frontend (ready for deployment)

### Key LazorKit Features Demonstrated

This example clearly demonstrates:

1. **Passkey Authentication** - Complete WebAuthn implementation with biometric authentication
   - See: `app/components/wallet/WalletPanelEnhanced.tsx` and `app/page.tsx`
   - Tutorial: [Tutorial 1: Passkey Wallet](./docs/tutorials/tutorial-1-passkey-wallet.md)

2. **Smart Wallet Transactions** - Real SOL transfers with passkey signing
   - See: `app/wallet/page.tsx` and `app/components/wallet/TransferModal.tsx`
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

**See the [tutorials](./docs/tutorials/) for complete examples with error handling and best practices.**

## 📖 Learn More

- **[LazorKit Docs](https://docs.lazorkit.com)** - Official SDK documentation
- **[LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)** - Source code and examples
- **[Solana Web3.js](https://docs.solana.com)** - Solana development guide
- **[WebAuthn Guide](https://webauthn.guide)** - Understanding passkeys
- **[Telegram Group](https://t.me/lazorkit)** - Community support

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

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
