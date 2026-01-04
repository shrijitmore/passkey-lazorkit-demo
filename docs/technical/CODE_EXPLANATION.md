# Code Explanation: How Our Implementation Works

This document explains how our LazorKit integration works, step-by-step, with references to the official documentation.

## Project Structure

```
passkey-lazorkit-demo/
├── app/
│   ├── components/
│   │   ├── LazorkitProviderWrapper.tsx  # LazorKit provider setup
│   │   ├── Providers.tsx                # Combined providers wrapper
│   │   ├── WalletPanelEnhanced.tsx      # Main wallet UI component
│   │   ├── TransferModal.tsx             # Transaction modal
│   │   └── ...                          # Other components
│   ├── layout.tsx                        # Root layout with Providers
│   └── page.tsx                          # Home page
├── docs/
│   ├── tutorials/                        # Step-by-step tutorials
│   │   ├── tutorial-1-passkey-wallet.md
│   │   ├── tutorial-2-transactions.md
│   │   ├── tutorial-3-session-persistence.md
│   │   └── tutorial-4-subscription-billing.md
│   ├── guides/                           # Integration guides
│   ├── technical/                        # Technical documentation
│   │   ├── TECHNICAL_EXPLANATION.md
│   │   └── CODE_EXPLANATION.md          # This file
└── README.md
```

## Component-by-Component Explanation

### 1. Providers.tsx

**Purpose**: Combined wrapper component that includes all providers (LazorKit, Theme, etc.).

**How it works**:

```typescript
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

**Why it exists**: 
- Keeps layout.tsx clean (server component)
- Allows combining multiple providers (Theme, LazorKit, etc.)
- Makes it easy to add/remove providers
- In this demo, it wraps both `ThemeProvider` and `LazorkitProviderWrapper`

### 2. LazorkitProviderWrapper.tsx

**Purpose**: Wraps the app with LazorKit's provider to enable wallet functionality everywhere.

**How it works**:

```typescript
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "https://kora.devnet.lazorkit.com" }}
  passkey={true}
>
```

**What each prop does**:

1. **rpcUrl** (required):
   - Connects to Solana blockchain
   - Used to query balance, send transactions, etc.
   - We use Devnet for testing

2. **portalUrl** (optional):
   - LazorKit's authentication portal
   - Handles WebAuthn passkey creation/authentication
   - Default: `https://portal.lazor.sh`

3. **paymasterConfig** (optional):
   - Paymaster configuration (may sponsor fees for certain transaction types)
   - **Note**: Native SOL transfers typically use wallet-paid fees
   - Official Devnet: `https://kora.devnet.lazorkit.com`

4. **passkey** (optional):
   - Enables passkey authentication
   - Set to `true` to use WebAuthn passkeys

**Reference**: [LazorkitProvider API](https://docs.lazorkit.com/react-sdk/provider)

### 3. WalletPanelEnhanced.tsx

**Purpose**: Main UI component that demonstrates all LazorKit features.

#### useWallet Hook

```typescript
const {
  smartWalletPubkey,      // PublicKey | null
  isConnected,            // boolean
  isConnecting,           // boolean
  connect,                // Function
  disconnect,             // Function
  error,                  // Error | null
  signAndSendTransaction, // Function
  signMessage,            // Function
} = useWallet();
```

**What each property/method does**:

- **smartWalletPubkey**: The smart wallet address (PDA). This is what you use to receive funds.
- **isConnected**: True when wallet is connected, false otherwise.
- **isConnecting**: True during connection process (shows loading state).
- **connect()**: Initiates wallet connection. Creates/authenticates passkey.
- **disconnect()**: Clears session and disconnects wallet.
- **error**: Any errors from connection or transactions.
- **signAndSendTransaction()**: Sends transactions with passkey signing (fees paid from wallet for native SOL transfers).
- **signMessage()**: Signs messages without sending transactions.

**Reference**: [useWallet API](https://docs.lazorkit.com/react-sdk/use-wallet)

#### Connection Flow

**When user clicks "Connect Wallet"**:

```typescript
const handleConnect = async () => {
  await connect();
};
```

**What happens internally**:

1. **First-time user**:
   - Browser shows biometric prompt (Face ID/Touch ID)
   - WebAuthn creates passkey in Secure Enclave
   - LazorKit creates smart wallet (PDA)
   - Session stored securely
   - `isConnected` becomes `true`
   - `smartWalletPubkey` is set

2. **Returning user**:
   - LazorKit checks for existing session
   - If found: Silent restore (may prompt biometric)
   - If not found: Full authentication flow
   - `isConnected` becomes `true`

**Reference**: [connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect)

#### Balance Fetching

```typescript
const fetchBalance = async () => {
  const balance = await connection.getBalance(smartWalletPubkey);
  setBalance(balance / LAMPORTS_PER_SOL);
};
```

**How it works**:
- Uses Solana `Connection` to query blockchain
- `getBalance()` returns balance in lamports
- Converts to SOL (1 SOL = 1,000,000,000 lamports)
- Polls every 30 seconds to keep balance updated

**Note**: This is separate from LazorKit - we're directly querying Solana RPC.

#### Transaction Sending

```typescript
const handleSendTransaction = async () => {
  // 1. Create instruction
  const instruction = SystemProgram.transfer({
    fromPubkey: smartWalletPubkey,
    toPubkey: smartWalletPubkey,
    lamports: 0.01 * LAMPORTS_PER_SOL,
  });

  // 2. Sign and send
  const signature = await signAndSendTransaction({
    instructions: [instruction],
  });
};
```

**What happens step-by-step**:

1. **Create Instruction**:
   - `SystemProgram.transfer()` creates a Solana instruction
   - Defines: transfer 0.01 SOL from wallet to itself (demo)

2. **Call signAndSendTransaction**:
   - LazorKit prompts for biometric (Face ID/Touch ID)
   - Passkey signs transaction in Secure Enclave
   - Transaction fees are paid from wallet balance (native SOL transfers)
   - Transaction submitted to Solana network
   - Returns transaction signature
   
   **Note**: For native SOL transfers, fees are paid by the wallet. Paymaster may sponsor other transaction types, but native SOL transfers typically use wallet-paid fees.

3. **Result**:
   - Transaction signature displayed
   - Link to Solana Explorer
   - Balance refreshed

**Reference**: [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

#### Message Signing

```typescript
const handleSignMessage = async () => {
  const { signature } = await signMessage('Hello from LazorKit!');
};
```

**What it does**:
- Signs a message with user's passkey
- No transaction sent (off-chain)
- Useful for wallet ownership verification
- Returns signature and signed payload

**Reference**: [signMessage API](https://docs.lazorkit.com/react-sdk/use-wallet#signmessage)

## Data Flow Diagrams

### Connection Flow

```
User clicks "Connect"
    ↓
connect() called
    ↓
LazorKit checks for session
    ↓
┌─────────────────┬─────────────────┐
│ Session exists? │ No session      │
│ Yes             │                 │
│                 │                 │
│ Silent restore  │ Full auth flow  │
│ (may prompt     │ (biometric      │
│  biometric)     │  prompt)        │
└─────────────────┴─────────────────┘
    ↓
Passkey authenticates
    ↓
Smart wallet (PDA) created/restored
    ↓
isConnected = true
smartWalletPubkey = <wallet address>
```

### Transaction Flow

```
User clicks "Send Transaction"
    ↓
Create instruction (SystemProgram.transfer)
    ↓
Call signAndSendTransaction({ instructions: [...] })
    ↓
Browser prompts for biometric (Face ID/Touch ID)
    ↓
Passkey signs in Secure Enclave
    ↓
Transaction fees paid from wallet balance
    ↓
Transaction submitted to Solana
    ↓
Returns transaction signature
    ↓
Display signature + Explorer link
```

**Note**: For native SOL transfers, fees are paid by the wallet. Paymaster configuration may be present but typically doesn't sponsor native SOL transfers.

## Key Concepts Explained

### 1. Smart Wallets (PDAs)

**What is a PDA?**
- Program Derived Address
- Not controlled by a private key
- Controlled by an on-chain program

**How LazorKit uses PDAs**:
- Each user gets a unique PDA
- Derived from: Program ID + User's passkey credential ID
- The PDA is the user's wallet address
- LazorKit's on-chain program controls it

**Benefits**:
- No seed phrases needed
- Built-in recovery mechanisms
- On-chain policies and spending limits

**Reference**: [LazorKit Smart Wallets](https://docs.lazorkit.com/#smart-wallets)

### 2. Transaction Fees

**Native SOL Transfers (This Demo)**:
1. User creates transaction
2. User signs with passkey
3. Transaction fees paid from wallet balance
4. Transaction submitted to Solana

**Result**: Transactions are signed with passkeys, fees are paid by wallet (realistic production behavior).

**About Paymaster**:
- Paymaster can sponsor fees for certain transaction types (like token transfers)
- Native SOL transfers typically require wallet-paid fees due to paymaster policies
- Paymaster configuration is included but may not apply to all transaction types

**Configuration**:
```typescript
paymasterConfig: {
  paymasterUrl: 'https://kora.devnet.lazorkit.com'
}
```

**Reference**: [LazorKit Paymaster](https://docs.lazorkit.com/#paymaster)

### 3. Session Persistence

**How sessions work**:
- Stored securely using WebAuthn
- `connect()` automatically restores if session exists
- Cleared when `disconnect()` is called

**Auto-reconnect**:
```typescript
// On page load, attempt to restore session
useEffect(() => {
  connect().catch(() => {
    // No session exists - user needs to click connect
  });
}, []);
```

**Reference**: [connect API - Auto-restore](https://docs.lazorkit.com/react-sdk/use-wallet#connect)

## API Method Reference

### connect(options?)

**Purpose**: Connect wallet (create/authenticate passkey)

**Options**:
```typescript
await connect({ 
  feeMode: 'paymaster' // or 'user' (default: 'paymaster')
});
```

**Returns**: `Promise<WalletInfo>`

**Reference**: [connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect)

### disconnect()

**Purpose**: Disconnect wallet and clear session

**Returns**: `Promise<void>`

**Reference**: [disconnect API](https://docs.lazorkit.com/react-sdk/use-wallet#disconnect)

### signMessage(message)

**Purpose**: Sign a message with passkey (off-chain)

**Parameters**:
- `message`: string - The message to sign

**Returns**: `Promise<{ signature: string, signedPayload: string }>`

**Reference**: [signMessage API](https://docs.lazorkit.com/react-sdk/use-wallet#signmessage)

### signAndSendTransaction(payload)

**Purpose**: Send transaction with passkey signing (fees paid from wallet for native SOL transfers)

**Parameters**:
```typescript
{
  instructions: TransactionInstruction[];
  transactionOptions?: {
    feeToken?: string;
    computeUnitLimit?: number;
    addressLookupTableAccounts?: AddressLookupTableAccount[];
    clusterSimulation?: 'devnet' | 'mainnet';
  };
}
```

**Returns**: `Promise<string>` - Transaction signature

**Reference**: [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## State Management

### Connection States

```typescript
isConnecting  →  isConnected  →  smartWalletPubkey
    ↓                ↓                    ↓
  true            false               null
(loading)      (not connected)    (no address)
```

### Transaction States

```typescript
isSendingTx  →  txSignature  →  txError
    ↓               ↓              ↓
  true          (success)      (failure)
(sending)      (signature)    (error msg)
```

## Error Handling

### Connection Errors

```typescript
if (error) {
  // Display error.message to user
  // Common errors:
  // - "User cancelled the operation"
  // - "WebAuthn not supported"
  // - "Connection timeout"
}
```

### Transaction Errors

```typescript
try {
  await signAndSendTransaction({ instructions: [...] });
} catch (err) {
  // Handle specific errors:
  // - User rejected
  // - Insufficient funds
  // - Network errors
}
```

## Best Practices Implemented

1. **Memoized Config**: Paymaster config is memoized to prevent re-renders
2. **Balance Polling**: Automatically refreshes balance every 30 seconds
3. **Error Handling**: All errors are caught and displayed to users
4. **Loading States**: Shows loading indicators during async operations
5. **State Cleanup**: Clears state when wallet disconnects
6. **Type Safety**: Full TypeScript support with proper types

## Official Documentation References

All implementation follows these official docs:

- [LazorKit Overview](https://docs.lazorkit.com/)
- [React SDK Getting Started](https://docs.lazorkit.com/react-sdk/getting-started)
- [LazorkitProvider API](https://docs.lazorkit.com/react-sdk/provider)
- [useWallet API](https://docs.lazorkit.com/react-sdk/use-wallet)
- [Type Definitions](https://docs.lazorkit.com/react-sdk/types)
- [Troubleshooting](https://docs.lazorkit.com/troubleshooting)

## Summary

Our implementation:

✅ Uses official LazorKit React SDK (`@lazorkit/wallet`)
✅ Follows all official documentation patterns
✅ Implements all core features (connect, disconnect, signMessage, signAndSendTransaction)
✅ Uses official Devnet configuration
✅ Includes comprehensive error handling
✅ Demonstrates passkey-authenticated transactions with wallet-paid fees
✅ Shows session persistence
✅ Provides detailed code comments
✅ Matches official API signatures exactly

Everything is production-ready and follows LazorKit best practices!

