# Technical Explanation: How LazorKit Works

This document explains how LazorKit works under the hood, based on the [official LazorKit documentation](https://docs.lazorkit.com/).

## Architecture Overview

LazorKit is a **Passkey-native Solana wallet SDK** that replaces seed phrases with WebAuthn biometric authentication. Here's how it works:

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Device                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Secure Enclave (Hardware Security Module)          │  │
│  │  - Stores WebAuthn Passkey (Private Key)            │  │
│  │  - Never leaves device                                │  │
│  │  - Biometric authentication (Face ID/Touch ID)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LazorKit SDK (@lazorkit/wallet)                     │  │
│  │  - Manages passkey authentication                     │  │
│  │  - Creates/connects to smart wallet (PDA)            │  │
│  │  - Handles transaction signing                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  LazorKit Portal (portal.lazor.sh)                    │  │
│  │  - WebAuthn credential management                     │  │
│  │  - Session management                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Solana Blockchain                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Smart Wallet (PDA)                                   │  │
│  │  - Program Derived Address                            │  │
│  │  - Controlled by LazorKit on-chain program           │  │
│  │  - Features: Recovery, Policies, Session Keys         │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Paymaster Service (kora.devnet.lazorkit.com)        │  │
│  │  - Pays transaction fees on behalf of users           │  │
│  │  - Enables gasless transactions                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. LazorkitProvider

**Purpose**: Initializes the LazorKit SDK and provides wallet context to all components.

**How it works**:
- Wraps your app with React Context
- Initializes connection to LazorKit Portal
- Configures Paymaster for gasless transactions
- Sets up RPC connection to Solana

**Configuration** (from [Provider API](https://docs.lazorkit.com/react-sdk/provider)):
```typescript
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"        // Required: Solana RPC endpoint
  portalUrl="https://portal.lazor.sh"          // Optional: Default portal
  paymasterConfig={{                           // Optional: Gasless transactions
    paymasterUrl: "https://kora.devnet.lazorkit.com"
  }}
>
```

**Reference**: [LazorkitProvider Documentation](https://docs.lazorkit.com/react-sdk/provider)

### 2. useWallet Hook

**Purpose**: Provides wallet state and methods to interact with the wallet.

**Available Properties** (from [useWallet API](https://docs.lazorkit.com/react-sdk/use-wallet)):

| Property | Type | Description |
|----------|------|-------------|
| `smartWalletPubkey` | `PublicKey \| null` | The smart wallet address (PDA) |
| `isConnected` | `boolean` | Whether wallet is currently connected |
| `isConnecting` | `boolean` | Whether connection is in progress |
| `error` | `Error \| null` | Connection or transaction errors |

**Available Methods**:

#### `connect(options?)`

**What it does**:
1. Checks for existing session in secure storage
2. If session exists: Attempts silent restore (may prompt for biometric)
3. If no session: Full WebAuthn authentication flow
4. Creates/restores smart wallet (PDA)
5. Returns `WalletInfo` object

**Options**:
```typescript
await connect({ 
  feeMode: 'paymaster' // or 'user' (default: 'paymaster')
});
```

**Reference**: [connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect)

#### `disconnect()`

**What it does**:
- Signs user out
- Wipes cached session data from local storage
- Clears wallet state

**Reference**: [disconnect API](https://docs.lazorkit.com/react-sdk/use-wallet#disconnect)

#### `signMessage(message)`

**What it does**:
- Requests user to sign a plain text message using their passkey
- Useful for verifying ownership without sending a transaction
- Returns signature and signed payload

**Usage**:
```typescript
const { signature, signedPayload } = await signMessage('Hello LazorKit');
```

**Reference**: [signMessage API](https://docs.lazorkit.com/react-sdk/use-wallet#signmessage)

#### `signAndSendTransaction(payload)`

**What it does** (from [API docs](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)):
> "The core method for executing on-chain actions. It handles signing the transaction with the user's passkey and submitting it via the Paymaster (bundler)."

**Process**:
1. Takes transaction instructions (not a Transaction object)
2. Prompts user for biometric authentication
3. Passkey signs transaction in Secure Enclave
4. Sends to Paymaster service
5. Paymaster pays fees and submits to Solana
6. Returns transaction signature

**Payload Structure** (from [Types](https://docs.lazorkit.com/react-sdk/types)):
```typescript
{
  instructions: TransactionInstruction[];
  transactionOptions?: {
    feeToken?: string;                    // Pay fees in USDC, etc.
    computeUnitLimit?: number;            // Max compute units
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    clusterSimulation?: 'devnet' | 'mainnet';
  };
}
```

**Reference**: [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## How Passkey Authentication Works

### WebAuthn Flow

1. **Registration (First Time)**:
   ```
   User clicks "Connect" 
   → Browser prompts for biometric (Face ID/Touch ID)
   → WebAuthn creates credential in Secure Enclave
   → Credential ID stored securely
   → LazorKit creates smart wallet (PDA)
   → Passkey linked to smart wallet
   ```

2. **Authentication (Subsequent Times)**:
   ```
   User clicks "Connect" OR page loads
   → LazorKit checks for existing session
   → If found: Silent restore (may prompt biometric)
   → If not found: Full authentication flow
   → Smart wallet restored
   ```

### Security Model

- **Private keys never leave device**: Stored in Secure Enclave
- **No seed phrases**: Users never see or manage keys
- **Phishing-resistant**: WebAuthn credentials are domain-bound
- **Hardware-backed**: Uses device's Secure Enclave (Touch ID/Face ID)

**Reference**: [LazorKit Core Concepts](https://docs.lazorkit.com/#biometric-authentication)

## Smart Wallets (PDAs)

### What are PDAs?

Program Derived Addresses (PDAs) are addresses derived from a program ID and seeds, not from a private key.

**Benefits** (from [LazorKit docs](https://docs.lazorkit.com/#smart-wallets)):
- **Recovery**: Logic for key rotation and recovery
- **Policies**: On-chain spending limits and access controls
- **Session Keys**: Ephemeral keys for scoped application access

### How LazorKit Uses PDAs

1. User authenticates with passkey
2. LazorKit derives a PDA from:
   - Program ID (LazorKit's on-chain program)
   - User's passkey credential ID
3. This PDA becomes the user's smart wallet address
4. The on-chain program controls the wallet, not a traditional keypair

**Reference**: [Solana PDAs](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)

## Paymaster Service

### How Gasless Transactions Work

The Paymaster service enables gas sponsorship (from [LazorKit docs](https://docs.lazorkit.com/#paymaster)):

1. User creates transaction instruction
2. User signs with passkey (biometric prompt)
3. Transaction sent to Paymaster service
4. Paymaster pays the transaction fees
5. Transaction submitted to Solana network
6. User receives transaction signature

**Key Points**:
- Users don't need SOL for gas fees
- Transactions are still signed by user's passkey
- Paymaster pays fees on behalf of users
- Enables true gasless transactions

**Configuration**:
```typescript
paymasterConfig: {
  paymasterUrl: 'https://kora.devnet.lazorkit.com', // Official Devnet paymaster
  apiKey: 'YOUR_API_KEY' // Optional: Only if required
}
```

**Reference**: [LazorKit Paymaster](https://docs.lazorkit.com/#paymaster)

## Session Persistence

### How Sessions Work

According to the [connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect):

> "Trigger the connection flow. If the user has previously connected, this will try to restore their session automatically without showing a pop-up."

**Session Storage**:
- Uses WebAuthn credentials (passkeys)
- Stored in browser's secure storage
- Never exposes private keys
- Can be synced across devices (if passkey is synced via iCloud/Google)

**Session Lifecycle**:
1. **First Connection**: Creates passkey and session
2. **Subsequent Connections**: Restores session silently
3. **Disconnect**: Clears session from storage
4. **Cross-Device**: Works if passkey is synced

**Reference**: [Session Persistence Tutorial](./tutorial-3-session-persistence.md)

## Transaction Flow

### Complete Transaction Journey

```
1. User Action
   ↓
2. Create Instruction (SystemProgram.transfer, etc.)
   ↓
3. Call signAndSendTransaction({ instructions: [...] })
   ↓
4. LazorKit prompts for biometric (Face ID/Touch ID)
   ↓
5. Passkey signs transaction in Secure Enclave
   ↓
6. Transaction sent to Paymaster service
   ↓
7. Paymaster pays fees and submits to Solana
   ↓
8. Transaction confirmed on-chain
   ↓
9. Returns transaction signature
```

**Key Differences from Traditional Wallets**:
- ❌ Traditional: Create Transaction → Sign with keypair → Send → Pay fees
- ✅ LazorKit: Create Instructions → signAndSendTransaction (handles everything)

**Reference**: [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## Type Definitions

### WalletInfo

Returned by `connect()` method (from [Types](https://docs.lazorkit.com/react-sdk/types)):

```typescript
interface WalletInfo {
  credentialId: string;      // Unique WebAuthn credential ID (Base64)
  passkeyPubkey: number[];  // Raw public key bytes of the passkey
  smartWallet: string;       // **YOUR SOLANA WALLET ADDRESS** (Base58)
  walletDevice: string;      // Internal PDA for device management
  platform: string;         // Platform info (e.g. 'web', 'macIntel')
  accountName?: string;     // The user's account name (if available)
}
```

**Note**: `useWallet` hook exposes `smartWalletPubkey` (PublicKey) directly, not the full `WalletInfo` object.

### SignAndSendTransactionPayload

Transaction payload structure (from [Types](https://docs.lazorkit.com/react-sdk/types)):

```typescript
interface SignAndSendTransactionPayload {
  instructions: TransactionInstruction[];
  transactionOptions?: {
    feeToken?: string;
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    computeUnitLimit?: number;
    clusterSimulation?: 'devnet' | 'mainnet';
  };
}
```

**Reference**: [Type Definitions](https://docs.lazorkit.com/react-sdk/types)

## Key Differences: React SDK vs React Native SDK

| Feature | React SDK (Web) | React Native SDK (Mobile) |
|---------|----------------|---------------------------|
| **Package** | `@lazorkit/wallet` | `@lazorkit/wallet-mobile-adapter` |
| **Authentication** | Browser WebAuthn | Native passkey integration |
| **Connect Method** | `connect()` | `connect({ redirectUrl })` |
| **Transactions** | Direct signing | Portal-based signing |
| **Session** | Browser storage | Native secure storage |

**This project uses React SDK** (Next.js web app).

**References**:
- [React SDK](https://docs.lazorkit.com/react-sdk)
- [React Native SDK](https://docs.lazorkit.com/react-native-sdk)

## Security Considerations

### What Makes LazorKit Secure?

1. **Hardware Security**: Passkeys stored in device's Secure Enclave
2. **No Key Exposure**: Private keys never leave the device
3. **Domain Binding**: WebAuthn credentials are bound to domain
4. **Phishing Resistant**: Can't be tricked into signing on wrong domain
5. **Biometric Protection**: Requires Face ID/Touch ID/Windows Hello

### Best Practices

1. **Always use HTTPS**: WebAuthn requires secure context
2. **Handle errors gracefully**: User may cancel biometric prompt
3. **Validate transactions**: Check balance before sending
4. **Use official endpoints**: Use official LazorKit portal and paymaster URLs

## Common Patterns

### Pattern 1: Auto-Reconnect

```typescript
useEffect(() => {
  connect().catch(() => {
    // Silently fail if no session exists
  });
}, []);
```

### Pattern 2: Manual Connection

```typescript
const handleConnect = async () => {
  try {
    await connect();
  } catch (err) {
    // Handle error
  }
};
```

### Pattern 3: Transaction with Options

```typescript
const signature = await signAndSendTransaction({
  instructions: [instruction],
  transactionOptions: {
    feeToken: 'USDC',
    computeUnitLimit: 500_000,
    clusterSimulation: 'devnet',
  },
});
```

## Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [React SDK Getting Started](https://docs.lazorkit.com/react-sdk/getting-started)
- [useWallet API Reference](https://docs.lazorkit.com/react-sdk/use-wallet)
- [LazorkitProvider API Reference](https://docs.lazorkit.com/react-sdk/provider)
- [Type Definitions](https://docs.lazorkit.com/react-sdk/types)
- [Troubleshooting Guide](https://docs.lazorkit.com/troubleshooting)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Solana Program Derived Addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)

