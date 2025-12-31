# Passkey + LazorKit Integration Demo

A Next.js demo application showcasing seamless integration of **Passkey technology with LazorKit** to enhance Solana UX. This project demonstrates passwordless, phishing-resistant wallet authentication using WebAuthn passkeys.

**Built for:** [Superteam Earn - Integrate Passkey technology with LazorKit to 10x Solana UX](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)

## 🚀 Features

- **Passwordless Authentication**: Users can connect their Solana wallet using biometric authentication (Face ID, Touch ID, or device PIN)
- **No Seed Phrases**: Eliminates the need for users to manage seed phrases or browser extensions
- **Phishing-Resistant**: WebAuthn passkeys provide strong security against phishing attacks
- **Seamless UX**: One-click wallet connection with automatic passkey registration/authentication
- **Smart Wallet Integration**: Leverages LazorKit's smart wallet infrastructure for enhanced security
- **Gasless Transactions**: Built-in Paymaster support for fee-free transactions
- **Session Persistence**: Automatic session management and cross-device access

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router
- **LazorKit Wallet** (`@lazorkit/wallet`) - Smart wallet SDK with built-in passkey support
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Solana Web3.js** - Solana blockchain interaction

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- A modern browser with WebAuthn support (Chrome, Safari, Firefox, Edge)
- A device with biometric authentication (Face ID, Touch ID, or Windows Hello) - **required for passkey creation**

## 🚀 Quick Start

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd passkey-lazorkit-demo

# Install dependencies
npm install
```

### Step 2: Environment Setup

No environment variables are required! The demo is pre-configured for Solana Devnet with:

- **RPC URL**: `https://api.devnet.solana.com` (public Solana Devnet)
- **Portal URL**: `https://portal.lazor.sh` (LazorKit authentication portal)
- **Paymaster URL**: `https://kora.devnet.lazorkit.com` (LazorKit Devnet Paymaster)

All configuration is in `app/components/LazorkitProviderWrapper.tsx`. You can modify these values if needed.

### Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4: Connect Your Wallet

1. Click **"Connect Wallet with Passkey"**
2. Your browser will prompt for biometric authentication (Face ID, Touch ID, or Windows Hello)
3. Approve the passkey creation/authentication
4. Your wallet address will be displayed

### Step 5: Fund Your Wallet (Devnet)

To test transactions, you'll need Devnet SOL:

1. Copy your wallet address from the app
2. Open [Solana Faucet](https://faucet.solana.com)
3. Paste your wallet address and request **1 SOL on Devnet**
4. Return to the app - your balance will update automatically

### Step 6: Test Features

- **Send Transaction**: Click "Send Test Transaction" to send a gasless self-transfer
- **Sign Message**: Click "Sign Message" to sign a message with your passkey
- **View on Explorer**: Click the Solana Explorer link to view your wallet on-chain

That's it! You're ready to explore LazorKit integration.

## 📚 Step-by-Step Tutorials

We've created comprehensive tutorials to help you understand and implement LazorKit features:

1. **[Tutorial 1: Creating a Passkey-Based Wallet](./docs/tutorial-1-passkey-wallet.md)**
   - Setting up LazorKit in your Next.js app
   - Understanding `LazorkitProvider` and `useWallet` hook
   - Implementing passkey authentication flow
   - Smart wallet (PDA) concepts

2. **[Tutorial 2: Gasless Transactions](./docs/tutorial-2-gasless-transactions.md)**
   - Understanding LazorKit's Paymaster service
   - Using `signAndSendTransaction` for fee-free transactions
   - Creating and sending various transaction types
   - Error handling and best practices

3. **[Tutorial 3: Session Persistence](./docs/tutorial-3-session-persistence.md)**
   - How LazorKit manages sessions automatically
   - Auto-reconnect functionality
   - Cross-device access patterns
   - Session lifecycle management

## 🎯 How It Works

1. **User clicks "Connect Wallet with Passkey"**
2. **LazorKit's `connect()` function** automatically:
   - Checks if user has an existing passkey
   - If new user: Creates a passkey using WebAuthn (biometric prompt)
   - If existing user: Authenticates with existing passkey
   - Creates/connects to a Solana smart wallet (PDA)
3. **Wallet is ready** - User can now interact with Solana dApps
4. **Transactions are gasless** - Paymaster covers all fees automatically

## 📁 Project Structure

```
passkey-lazorkit-demo/
├── app/
│   ├── components/
│   │   ├── LazorkitProviderWrapper.tsx  # LazorKit provider configuration
│   │   └── WalletPanel.tsx              # Main wallet connection UI
│   ├── lib/
│   │   └── passkey.ts                    # (Legacy - not used in current implementation)
│   ├── layout.tsx                        # Root layout with LazorKit provider
│   └── page.tsx                          # Home page
├── docs/
│   ├── tutorial-1-passkey-wallet.md     # Tutorial: Passkey wallet setup
│   ├── tutorial-2-gasless-transactions.md # Tutorial: Gasless transactions
│   ├── tutorial-3-session-persistence.md  # Tutorial: Session management
│   ├── CODE_EXPLANATION.md               # Detailed code walkthrough
│   └── TECHNICAL_EXPLANATION.md          # Technical architecture overview
└── README.md                             # This file
```

## 🔧 SDK Installation & Configuration

### Installing LazorKit

```bash
npm install @lazorkit/wallet @solana/web3.js
```

### Configuring LazorKit Provider

The LazorKit provider is configured in `app/components/LazorkitProviderWrapper.tsx`:

```typescript
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"           // Solana RPC endpoint
  portalUrl="https://portal.lazor.sh"              // LazorKit authentication portal
  paymasterConfig={{
    paymasterUrl: "https://kora.devnet.lazorkit.com" // Paymaster for gasless transactions
  }}
>
```

**Configuration Options:**

- **`rpcUrl`** (required): Solana RPC endpoint
  - Devnet: `https://api.devnet.solana.com`
  - Mainnet: Your mainnet RPC URL (e.g., from Helius, QuickNode, etc.)
  
- **`portalUrl`** (optional): LazorKit portal service
  - Default: `https://portal.lazor.sh`
  - Handles WebAuthn passkey creation/authentication

- **`paymasterConfig`** (optional): Paymaster configuration for gasless transactions
  - Devnet: `https://kora.devnet.lazorkit.com`
  - Mainnet: Configure your own paymaster or use LazorKit's mainnet service

**Reference**: [LazorKit React SDK Documentation](https://docs.lazorkit.com/react-sdk/getting-started)

## 🎨 Key Implementation Details

### Core Components

1. **`LazorkitProviderWrapper.tsx`**
   - Wraps the app with `LazorkitProvider`
   - Configures RPC, Portal, and Paymaster URLs
   - Provides wallet context to all child components

2. **`WalletPanel.tsx`**
   - Main UI component demonstrating LazorKit features
   - Uses `useWallet` hook for wallet state and methods
   - Implements: connect, disconnect, send transaction, sign message
   - Real-time balance polling
   - Error handling and user feedback

### Key Features Demonstrated

- **Passkey Authentication**: Automatic WebAuthn passkey creation/authentication
- **Smart Wallets (PDAs)**: Programmatically derived addresses, no seed phrases
- **Gasless Transactions**: Paymaster-sponsored transactions via `signAndSendTransaction`
- **Message Signing**: Sign arbitrary messages with passkey via `signMessage`
- **Session Persistence**: Automatic session management and auto-reconnect
- **Balance Tracking**: Real-time SOL balance updates with polling

### API Usage Examples

**Connect Wallet:**
```typescript
const { connect, isConnected, smartWalletPubkey } = useWallet();
await connect();
```

**Send Gasless Transaction:**
```typescript
const { signAndSendTransaction } = useWallet();
const signature = await signAndSendTransaction({
  instructions: [SystemProgram.transfer({...})]
});
```

**Sign Message:**
```typescript
const { signMessage } = useWallet();
const { signature } = await signMessage("Hello LazorKit!");
```

**Reference**: [useWallet API Documentation](https://docs.lazorkit.com/react-sdk/use-wallet)

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. **Push to GitHub** (if not already done)

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Or use Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```

### Deployment Notes

- ✅ No environment variables needed (pre-configured for Devnet)
- ✅ Works out-of-the-box on Vercel
- ✅ Next.js polyfills are automatically handled
- ✅ WebAuthn requires HTTPS (Vercel provides this automatically)

**Live Demo**: [Deploy your own instance](https://vercel.com/new) or check the repository for deployment links.

## 🔍 Additional Resources

### Documentation

- **[LazorKit Official Docs](https://docs.lazorkit.com/)** - Complete SDK documentation
- **[React SDK Getting Started](https://docs.lazorkit.com/react-sdk/getting-started)** - Quick setup guide
- **[useWallet API Reference](https://docs.lazorkit.com/react-sdk/use-wallet)** - Hook API documentation
- **[LazorkitProvider API](https://docs.lazorkit.com/react-sdk/provider)** - Provider configuration

### Community

- **[LazorKit Telegram](https://t.me/lazorkit)** - Join the community
- **[LazorKit GitHub](https://github.com/lazor-kit/lazor-kit)** - Source code and issues

### Related Tutorials

- **[Tutorial 1: Passkey Wallet](./docs/tutorial-1-passkey-wallet.md)** - Complete setup guide
- **[Tutorial 2: Gasless Transactions](./docs/tutorial-2-gasless-transactions.md)** - Transaction examples
- **[Tutorial 3: Session Persistence](./docs/tutorial-3-session-persistence.md)** - Session management
- **[Code Explanation](./docs/CODE_EXPLANATION.md)** - Detailed code walkthrough
- **[Technical Explanation](./docs/TECHNICAL_EXPLANATION.md)** - Architecture overview

## 🐛 Troubleshooting

### Common Issues

**"WebAuthn not supported"**
- Ensure you're using a modern browser (Chrome, Safari, Firefox, Edge)
- WebAuthn requires HTTPS (or localhost for development)

**"Biometric prompt not appearing"**
- Check device has biometric authentication enabled
- Ensure browser permissions allow biometric access
- Try a different browser or device

**"Transaction fails"**
- Verify wallet has sufficient balance (check Devnet faucet)
- Ensure Paymaster URL is correct
- Check browser console for detailed error messages

**"Balance not updating"**
- Balance polling runs every 5 seconds
- Refresh the page if balance seems stale
- Verify RPC URL is correct and accessible

For more help, see [LazorKit Troubleshooting Guide](https://docs.lazorkit.com/troubleshooting) or join the [Telegram group](https://t.me/lazorkit).

## 📝 License

MIT

## 🙏 Acknowledgments

- [LazorKit](https://lazorkit.com) for the smart wallet SDK
- [Superteam Earn](https://earn.superteam.fun) for the hackathon opportunity
