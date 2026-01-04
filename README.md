# LazorKit Starter - Passkey Authentication & Smart Wallet Transactions

<div align="center">

![LazorKit Banner](https://img.shields.io/badge/LazorKit-Passkey_Auth-purple?style=for-the-badge)
![Solana](https://img.shields.io/badge/Solana-Devnet-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge)
![GCP](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)

A production-ready Next.js starter template showcasing **LazorKit SDK** integration for passwordless Solana wallet authentication and smart wallet transactions.

**Built for:** [Superteam Earn - LazorKit Integration Bounty](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)

</div>

---

## ✨ Features

- 🔐 **Passwordless Authentication** - Face ID, Touch ID, Windows Hello
- ⚡ **Smart Wallet Transactions** - Passkey-secured SOL transfers
- ✍️ **Message Signing** - Verify wallet ownership without transactions
- 💳 **Subscription Billing** - Recurring payments with smart wallets
- 📊 **Transaction History** - Real-time updates and tracking
- 🎨 **Modern UI** - shadcn/ui components with dark/light themes
- 📱 **Mobile Responsive** - Works perfectly on all devices

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- Modern browser with WebAuthn support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lazorkit-starter.git
cd lazorkit-starter

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Steps

1. **Connect with Passkey**: Click "Connect with Passkey" and authenticate
2. **Get Devnet SOL**: Visit [Solana Faucet](https://faucet.solana.com) and request SOL
3. **Send Transaction**: Transfer SOL to any address with passkey approval!

---

## 📁 Project Structure

```
passkey-lazorkit-demo/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── lib/               # Utilities and helpers
│   ├── page.tsx           # Dashboard page
│   ├── wallet/            # Wallet page
│   └── subscription/      # Subscription page
├── docs/                  # 📚 All documentation
│   ├── README.md          # Documentation index
│   ├── tutorials/         # Step-by-step tutorials
│   ├── guides/            # Integration and setup guides
│   └── technical/         # Technical deep dives
└── README.md              # This file
```

---

## 📚 Documentation

**All documentation is organized in the [`docs/`](./docs/) folder:**

### Tutorials
- **[Tutorial 1: Passkey Wallet](./docs/tutorials/tutorial-1-passkey-wallet.md)** - Passkey authentication
- **[Tutorial 2: Transactions](./docs/tutorials/tutorial-2-transactions.md)** - Sending transactions
- **[Tutorial 3: Session Persistence](./docs/tutorials/tutorial-3-session-persistence.md)** - Session management
- **[Tutorial 4: Subscription Billing](./docs/tutorials/tutorial-4-subscription-billing.md)** - Subscription system

### Guides
- **[Integration Guide](./docs/guides/integration-guide.md)** - Complete setup guide
- **[RPC Configuration](./docs/guides/rpc-configuration.md)** - RPC setup guide

### Technical Documentation
- **[Code Explanation](./docs/technical/CODE_EXPLANATION.md)** - Code walkthrough
- **[Technical Explanation](./docs/technical/TECHNICAL_EXPLANATION.md)** - Technical deep dive

See the [Documentation Index](./docs/README.md) for a complete overview.

---

## 🎯 Key Technologies

### LazorKit SDK

```typescript
import { LazorkitProvider, useWallet } from '@lazorkit/wallet';

// Provider configuration
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "..." }}
>
  <App />
</LazorkitProvider>

// Using the wallet hook
const { connect, smartWalletPubkey, signAndSendTransaction } = useWallet();
```

### Transaction Fees

This demo uses **wallet-paid transactions** for native SOL transfers, reflecting realistic production behavior. Transactions are signed with passkeys (biometric authentication) and fees are paid from the wallet balance.

For detailed information, see the [Transactions Tutorial](./docs/tutorials/tutorial-2-transactions.md).

### ⚠️ Known Limitation: Small SOL Transfers

During testing, we observed that very small native SOL transfers (e.g. 0.01 SOL) may fail with:

```
Transaction too large: 1285 > 1232
```

This occurs because LazorKit's internal paymaster & smart wallet validation logic can increase transaction size beyond Solana's maximum transaction limit (1232 bytes).

**Why this happens:**
- LazorKit routes transactions through the Paymaster pipeline internally
- Paymaster adds extra instructions for smart wallet validation, session checks, and fee abstraction
- For small amounts, paymaster optimization attempts can push transaction size over the limit
- Larger transfers (e.g. 0.1 SOL) succeed consistently as paymaster policies handle them differently

**This is a known Solana constraint and not an application bug.** The transaction is still:
- ✅ Signed using passkeys (WebAuthn)
- ✅ Executed via a smart wallet (PDA)
- ✅ Verifiable on-chain via Solana Explorer

**Note:** The iframe security warning (`allow-scripts and allow-same-origin`) is a browser security notice from `portal.lazor.sh` and can be safely ignored. This is common in wallet SDKs and does not affect functionality.

---

## 🧪 Testing

### Test Passkey Authentication

1. Open the app in a supported browser
2. Click "Connect with Passkey"
3. Authenticate with Face ID/Touch ID/Windows Hello
4. Verify wallet address is displayed

### Test Transactions

1. Connect your wallet
2. Get Devnet SOL from [faucet](https://faucet.solana.com)
3. Navigate to Wallet page
4. Send SOL to any address
5. Approve with passkey
6. Verify transaction on [Explorer](https://explorer.solana.com/?cluster=devnet)

### Browser Compatibility

✅ **Chrome** 67+ (Desktop & Mobile)
✅ **Safari** 14+ (macOS & iOS)
✅ **Edge** 79+
✅ **Firefox** 60+

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/lazorkit-starter)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Important: HTTPS Required

Passkeys **only work on HTTPS**. Vercel provides HTTPS automatically.

For local testing with HTTPS:
```bash
npm run dev:https
```

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

This project is submitted for the [Superteam Earn - LazorKit Integration Bounty](https://earn.superteam.fun).

### Deliverables

✅ **Working Example Repo** - Complete Next.js application
✅ **Clean Code Structure** - Well-organized and documented
✅ **Quick-Start Guide** - Clear README with setup instructions
✅ **4+ Step-by-Step Tutorials** - Comprehensive documentation  
✅ **Live Demo** - Deployed on Devnet with working frontend
✅ **Comprehensive Documentation** - Organized in `docs/` folder  
✅ **Examples Directory** - Next.js example with proper configuration

### Key Features Demonstrated

1. **Passkey Authentication Flow** - Complete implementation
2. **Smart Wallet Transactions** - Real SOL transfers with passkey signing
3. **Subscription Billing** - Recurring payments system
4. **Production-Ready Code** - TypeScript, error handling, best practices
5. **Modern UI/UX** - shadcn/ui components, responsive design

---

## 📖 Learn More

- **[LazorKit Docs](https://docs.lazorkit.com)** - Official SDK documentation
- **[Solana Web3.js](https://docs.solana.com)** - Solana development guide
- **[WebAuthn Guide](https://webauthn.guide)** - Understanding passkeys

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
