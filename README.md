# Passkey + LazorKit Integration Demo

A Next.js demo application showcasing seamless integration of **Passkey technology with LazorKit** to enhance Solana UX. This project demonstrates passwordless, phishing-resistant wallet authentication using WebAuthn passkeys.

**Built for:** [Superteam Earn - Integrate Passkey technology with LazorKit to 10x Solana UX](https://earn.superteam.fun/listing/integrate-passkey-technology-with-lazorkit-to-10x-solana-ux)

## 🚀 Features

- **Passwordless Authentication**: Users can connect their Solana wallet using biometric authentication (Face ID, Touch ID, or device PIN)
- **No Seed Phrases**: Eliminates the need for users to manage seed phrases or browser extensions
- **Phishing-Resistant**: WebAuthn passkeys provide strong security against phishing attacks
- **Seamless UX**: One-click wallet connection with automatic passkey registration/authentication
- **Smart Wallet Integration**: Leverages LazorKit's smart wallet infrastructure for enhanced security

## 🛠️ Tech Stack

- **Next.js 16** - React framework with App Router
- **LazorKit Wallet** (`@lazorkit/wallet`) - Smart wallet SDK with built-in passkey support
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How It Works

1. **User clicks "Connect Wallet with Passkey"**
2. **LazorKit's `connect()` function** automatically:
   - Checks if user has an existing passkey
   - If new user: Creates a passkey using WebAuthn (biometric prompt)
   - If existing user: Authenticates with existing passkey
   - Creates/connects to a Solana smart wallet
3. **Wallet is ready** - User can now interact with Solana dApps

## 💰 Funding the Wallet (Devnet)

This demo runs on Solana Devnet.

After connecting with a passkey:

1. Copy your wallet address from the app
2. Open [Solana Faucet](https://faucet.solana.com)
3. Paste your wallet address and request 1 SOL on Devnet
4. Return to the app and send a test transaction

The app will show your balance and enable the "Send Test Transaction" button once funded.

## 📁 Project Structure

```
app/
├── components/
│   ├── LazorkitProviderWrapper.tsx  # LazorKit provider configuration
│   └── WalletPanel.tsx               # Main wallet connection UI
├── layout.tsx                        # Root layout with LazorKit provider
└── page.tsx                          # Home page
```

## 🔧 Configuration

The LazorKit provider is configured in `app/components/LazorkitProviderWrapper.tsx`:

- **RPC URL**: Solana Devnet RPC endpoint
- **Portal URL**: LazorKit portal service
- **Paymaster Config**: Gasless transaction support

## 🎨 Key Implementation Details

- **LazorKit Integration**: Uses `LazorkitProvider` and `useWallet` hook for seamless passkey-based wallet connection
- **Automatic Passkey Management**: LazorKit handles passkey registration and authentication internally
- **Smart Wallet**: Each user gets a programmatically derived smart wallet address
- **Error Handling**: Comprehensive error states and user feedback

## 🚢 Deployment

This project can be deployed on Vercel:

```bash
npm run build
```

Or use the Vercel CLI:

```bash
vercel
```

## 📝 License

MIT

## 🙏 Acknowledgments

- [LazorKit](https://lazorkit.com) for the smart wallet SDK
- [Superteam Earn](https://earn.superteam.fun) for the hackathon opportunity
