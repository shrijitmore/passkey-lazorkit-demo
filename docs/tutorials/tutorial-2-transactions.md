# Tutorial 2: Sending Transactions with LazorKit

This tutorial demonstrates how to send transactions on Solana using LazorKit's smart wallet with passkey authentication.

> **Reference**: Based on [LazorKit Getting Started Guide](https://docs.lazorkit.com/react-sdk/getting-started#4-sending-transactions) and [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Setup](./tutorial-1-passkey-wallet.md)
- A connected wallet with some Devnet SOL (for the transaction amount and fees)

## What You'll Learn

- Understanding transaction fees and paymaster behavior
- Creating transaction instructions
- Using `signAndSendTransaction` method
- Handling transaction results and errors
- Transaction options and configuration

## Step 1: Understanding Transaction Fees

**Important Note on Native SOL Transfers:**

This demo uses **wallet-paid transactions** for native SOL transfers. This reflects realistic production behavior, as paymasters typically have policies that exclude native SOL transfers from sponsorship.

**How it works:**
- Transactions are signed by the user's passkey (biometric authentication)
- Transaction fees are paid from the wallet balance
- This is the standard behavior for native SOL transfers in production
  
**About Paymaster:**

The Paymaster service can sponsor gas fees for certain transaction types (like token transfers), but native SOL transfers typically require wallet-paid fees. The paymaster configuration is included in the provider, but may not apply to all transaction types.

The Paymaster is configured in the `LazorkitProvider`:

```typescript
const paymasterConfig = useMemo(
  () => ({
    paymasterUrl: 'https://kora.devnet.lazorkit.com', // Official Devnet paymaster
  }),
  []
);
```

**Note:** Even with paymaster configured, native SOL transfers in this demo use wallet-paid fees.

**Connection Flow:**
- **First-time users:** Passkey creation → Wallet creation → Connection
- **Returning users:** Passkey authentication → Auto-reconnect
- **All authentication:** Uses biometrics (no passwords or seed phrases)

## Step 2: Understanding `signAndSendTransaction`

According to the [official documentation](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction):

> "The core method for executing on-chain actions. It handles signing the transaction with the user's passkey and submitting it via the Paymaster (bundler)."

**Key Difference from Traditional Wallets:**
- ❌ Traditional: Create Transaction → Sign → Send
- ✅ LazorKit: Create Instructions → `signAndSendTransaction` (handles everything)

The method:
1. Takes **instructions** directly (not a Transaction object)
2. Handles passkey signing automatically
3. Submits transaction (fees paid from wallet for native SOL transfers)
4. Returns the transaction signature

## Transaction Signing: Two Approaches

LazorKit provides two ways to sign and send transactions. Choose the approach that best fits your needs:

### Option 1: Direct `signAndSendTransaction` (Simple)

**When to use:** Quick prototypes, simple transactions, when you don't need automatic retry logic.

```typescript
import { useWallet } from '@lazorkit/wallet';

const { signAndSendTransaction } = useWallet();

// Simple usage
const signature = await signAndSendTransaction({
  instructions: [instruction],
});
```

**Pros:**
- Simple and straightforward
- Direct access to SDK method
- Less code

**Cons:**
- No automatic credential refresh
- No automatic retry logic
- Manual error handling required

### Option 2: `useTransactionSigning` Hook (Recommended)

**When to use:** Production apps, when you need robust error handling and automatic retry logic.

```typescript
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';

const { signTransaction } = useTransactionSigning();

// Recommended usage with automatic retry
const signature = await signTransaction({
  instructions: [instruction],
});
```

**Pros:**
- Automatic credential refresh on errors
- Built-in retry logic with exponential backoff
- Better error handling
- Handles transaction size errors automatically

**Cons:**
- Requires custom hook implementation
- Slightly more setup

**Which to choose?**

- **Use Option 1** for: Quick demos, learning, simple use cases
- **Use Option 2** for: Production apps, complex transactions, better UX

> **Note:** The examples in this tutorial use Option 2 (`useTransactionSigning`) as it's the recommended approach for production applications. You can always switch to Option 1 if you prefer the simpler approach.

**Transaction Signing Process:**
1. User initiates transaction → Create instruction
2. Call `signTransaction` or `signAndSendTransaction`
3. Passkey prompt appears (biometric authentication required)
4. User approves → Transaction signed with passkey
5. Submit to Paymaster/Bundler
6. Fees handled: Native SOL (wallet-paid) or Token transfers (may be sponsored)
7. Broadcast to Solana network
8. Transaction confirmed → Return signature

**Key Points:**
- All transactions require passkey approval (biometric authentication)
- Native SOL transfers: Fees paid from wallet balance
- Token transfers: May be sponsored by paymaster
- Automatic retry logic handles credential refresh and transient errors

## Step 3: Create a Simple Transfer Transaction

Based on the [official example](https://docs.lazorkit.com/react-sdk/getting-started#4-sending-transactions), here's how to send a transfer:

```typescript
// app/components/TransferButton.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function TransferButton() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { signTransaction } = useTransactionSigning();

  const [isSending, setIsSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    if (!smartWalletPubkey || !isConnected) return;

    setIsSending(true);
    setError(null);
    setSignature(null);

    try {
      // 1. Create Instruction (from official docs)
      const destination = new PublicKey('RECIPIENT_ADDRESS');
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: destination,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      });

      // 2. Sign and Send (using useTransactionSigning hook for automatic retry)
      // Note: The actual codebase uses useTransactionSigning hook which handles
      // credential refresh and retry logic automatically
      // Note: For native SOL transfers, transaction fees are paid from your wallet balance
      // Paymaster may sponsor fees for other transaction types (token transfers, etc.)
      const txSignature = await signTransaction({
        instructions: [instruction],
      });
      
      // Alternative: Direct usage (simpler but no automatic retry)
      // const { signAndSendTransaction } = useWallet();
      // const txSignature = await signAndSendTransaction({
      //   instructions: [instruction],
      // });

      setSignature(txSignature);
      console.log('Transaction confirmed:', txSignature);
    } catch (err: any) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return <p>Please connect your wallet first</p>;
  }

  return (
    <div>
      <button
        onClick={handleTransfer}
        disabled={isSending}
      >
        {isSending ? 'Sending...' : 'Send 0.1 SOL'}
      </button>

      {signature && (
        <div>
          <p>Transaction successful!</p>
          <p>Signature: {signature}</p>
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
```

## Step 4: Adding QR Code Scanner for Recipient Address (Optional UX Enhancement)

To improve user experience when sending transactions, you can add a QR code scanner to let users scan wallet addresses instead of typing them manually. This is an optional enhancement that makes it easier to input recipient addresses for transactions.

### Install QR Scanner Library

```bash
npm install qr-scanner
```

### Create QR Scanner Component

Create `app/components/ui/QRScanner.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import LoadingSpinner from './LoadingSpinner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  description?: string;
}

export default function QRScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code to scan a wallet address',
}: QRScannerProps) {
  const scannerRef = useRef<QrScanner | null>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [qrOn, setQrOn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when scanner is closed
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setQrOn(false);
      setError(null);
      return;
    }

    // Initialize scanner when opened
    if (videoElRef?.current && !scannerRef.current) {
      setError(null);
      try {
        scannerRef.current = new QrScanner(
          videoElRef.current,
          (result: QrScanner.ScanResult) => {
            onScan(result.data);
            if (scannerRef.current) {
              scannerRef.current.stop();
              scannerRef.current.destroy();
              scannerRef.current = null;
            }
            setQrOn(false);
            onClose();
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current
          .start()
          .then(() => setQrOn(true))
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('Permission denied')) {
              setError('Camera permission denied. Please allow camera access.');
            } else {
              setError(`Failed to start camera: ${errorMessage}`);
            }
            setQrOn(false);
          });
      } catch (err) {
        setError(`Failed to initialize scanner: ${err instanceof Error ? err.message : String(err)}`);
        setQrOn(false);
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '1 / 1' }}>
            <video ref={videoElRef} className="w-full h-full object-cover" />
            {!qrOn && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <div className="text-center">
                  <LoadingSpinner size="lg" color="primary" />
                  <p className="text-xs text-muted-foreground mt-2">Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Use QR Scanner in Send Form

Add QR scanner to your send transaction form:

```tsx
import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { QrCode } from 'lucide-react';
import QRScanner from '../components/ui/QRScanner';

export function SendForm() {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleScan = (result: string) => {
    try {
      // Validate if the scanned result is a valid Solana address
      new PublicKey(result);
      setRecipientAddress(result);
      setShowQRScanner(false);
    } catch (e) {
      // Invalid address - show error
      console.error('Invalid Solana address scanned');
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Enter Solana wallet address or scan QR code"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowQRScanner(true)}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>

      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
}
```

**Key Points:**
- QR scanner uses device camera to scan QR codes
- Scanned addresses are validated as Solana PublicKeys
- Scanner automatically closes after successful scan
- Handles camera permission errors gracefully

## Step 5: Understanding Transaction Options

According to the [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction), you can pass optional configuration:

```typescript
const signature = await signAndSendTransaction({
  instructions: [instruction1, instruction2], // Array of instructions
  transactionOptions: {
    feeToken: 'USDC',              // Optional: Pay fees in USDC instead of SOL
    computeUnitLimit: 500_000,     // Optional: Max compute units
    addressLookupTableAccounts: [], // Optional: For v0 transactions
    clusterSimulation: 'devnet',    // Optional: Network for simulation
  },
});
```

**Available Options** (from [API documentation](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)):

- `feeToken` (string, optional): Token address for gas fees (e.g. USDC)
- `computeUnitLimit` (number, optional): Max compute units for the transaction
- `addressLookupTableAccounts` (AddressLookupTableAccount[], optional): Lookup tables for versioned (v0) transactions
- `clusterSimulation` ('devnet' | 'mainnet', optional): Network to use for simulation

## Step 6: Creating Different Types of Transaction Instructions

### Transfer SOL

```typescript
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const transferInstruction = SystemProgram.transfer({
  fromPubkey: senderPubkey,
  toPubkey: recipientPubkey,
  lamports: 1 * LAMPORTS_PER_SOL, // 1 SOL
});
```

### Transfer Tokens (SPL Token) - Gasless!

To send SPL tokens (like USDC) with gasless sponsorship (Paymaster), you need to:
1.  Get the Mint Address (e.g., Devnet USDC)
2.  Handle Associated Token Accounts (ATA) for sender and recipient
3.  Create the transfer instruction

```typescript
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from '@solana/spl-token';

const handleTokenTransfer = async () => {
  const usdcMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Devnet USDC
  const amount = 10 * 1000000; // 10 USDC (6 decimals)

  const instructions = [];

  // 1. Get Sender ATA
  const senderAta = await getAssociatedTokenAddress(
    usdcMint,
    smartWalletPubkey
  );

  // 2. Get Recipient ATA - and create if needed
  const recipientAta = await getAssociatedTokenAddress(
    usdcMint,
    recipientPubkey
  );

  // Check if recipient account exists (if not, add creation instruction)
  // Note: For smart wallets, we can just optimistically add the create instruction 
  // if we're unsure, or check strict existence via connection.getAccountInfo
  // In our helper utilities, we check first.
  
  // 3. Create Transfer Instruction
  const transferIx = createTransferInstruction(
    senderAta,
    recipientAta,
    smartWalletPubkey,
    amount,
    [],
    TOKEN_PROGRAM_ID
  );
  
  instructions.push(transferIx);

  // 4. Sign and Send
  // The Paymaster will likely sponsor this transaction because it's a token transfer!
  const signature = await signTransaction({
    instructions,
  });
};
```

**Key Takeaway:** Unlike native SOL transfers where you pay the fee, **LazorKit Paymasters frequently sponsor SPL Token transfers**, making them completely gasless for the user!

### Multiple Instructions in One Transaction

```typescript
const signature = await signAndSendTransaction({
  instructions: [
    instruction1,
    instruction2,
    instruction3,
  ],
});
```

All instructions execute atomically - either all succeed or all fail.

## Step 7: Error Handling for Transactions

According to the [official documentation](https://docs.lazorkit.com/react-sdk/getting-started), handle errors gracefully with proper TypeScript typing and realistic error patterns:

```typescript
const handleSendTransaction = async () => {
  try {
    // Note: For native SOL transfers, transaction fees are paid from your wallet balance
    // Paymaster may sponsor fees for other transaction types (token transfers, etc.)
    const signature = await signTransaction({
      instructions: [instruction],
    });
    
    // Success handling
    setSignature(signature);
    console.log('Transaction successful:', signature);
  } catch (err: unknown) {
    // Proper TypeScript error handling with type guards
    const error = err as { message?: string; name?: string };
    
    // User cancelled passkey prompt
    if (error.name === 'NotAllowedError') {
      setError('Transaction cancelled by user');
      return;
    }
    
    // Check for specific error messages
    const errorMessage = error.message?.toLowerCase() || '';
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
      // User cancelled the transaction
      setError('Transaction cancelled by user');
    } else if (errorMessage.includes('insufficient') || errorMessage.includes('not enough')) {
      // Not enough balance for the transaction amount
      setError('Insufficient balance. Please ensure you have enough SOL for the transaction amount and fees.');
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      // Rate limit hit
      setError('Too many requests. Please wait a moment and try again.');
    } else if (errorMessage.includes('network') || errorMessage.includes('rpc')) {
      // Network/RPC error
      setError('Network error. Please check your connection and try again.');
    } else if (errorMessage.includes('transaction too large')) {
      // Transaction size error (passkey cache issue)
      setError('Transaction size error. Try clearing your browser cache and reconnecting your wallet.');
    } else {
      // Generic error
      setError(error.message || 'Transaction failed. Please try again.');
    }
    
    console.error('Transaction failed:', error);
  }
};
```

**Key Error Handling Patterns:**

1. **Type Safety:** Use `err: unknown` with type guards for proper TypeScript error handling
2. **User Cancellation:** Check for `NotAllowedError` when user cancels passkey prompt
3. **Balance Errors:** Provide clear messages about insufficient funds
4. **Rate Limiting:** Handle 429 errors with user-friendly messages
5. **Network Errors:** Distinguish between network and RPC issues
6. **Transaction Size:** Guide users to clear cache for transaction size errors

## Step 8: Complete Transaction Example with Balance Check

Here's a complete example that checks balance before sending (based on the actual `WalletPanelEnhanced.tsx` implementation in this repository):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getConnection } from '../lib/rpc/connection';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';

export default function TransactionExample() {
  const {
    smartWalletPubkey,
    isConnected,
  } = useWallet();
  const { signTransaction } = useTransactionSigning();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connection = getConnection();

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
      // Poll balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
      setSignature(null);
      setError(null);
    }
  }, [isConnected, smartWalletPubkey]);

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingBalance(true);
    try {
      const balance = await connection.getBalance(smartWalletPubkey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleSend = async () => {
    if (!smartWalletPubkey || balance === null || balance === 0) {
      return;
    }

    setIsSending(true);
    setError(null);
    setSignature(null);

    try {
      // Create a simple self-transfer instruction (0.01 SOL)
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: smartWalletPubkey, // Self-transfer for demo
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction using useTransactionSigning hook
      // This hook handles signing with passkey, automatic credential refresh, and retry logic
      // Note: The actual codebase uses useTransactionSigning for better error handling
      // Note: For native SOL transfers, transaction fees are paid from your wallet balance
      // Paymaster may sponsor fees for other transaction types (token transfers, etc.)
      const txSignature = await signTransaction({
        instructions: [instruction],
      });
      
      // Alternative: Direct usage (simpler but no automatic retry)
      // const { signAndSendTransaction } = useWallet();
      // const txSignature = await signAndSendTransaction({
      //   instructions: [instruction],
      // });

      setSignature(txSignature);
      // Refresh balance after transaction
      setTimeout(fetchBalance, 1000);
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  if (!isConnected) {
    return <p>Connect your wallet first</p>;
  }

  const hasBalance = balance !== null && balance > 0;

  return (
    <div>
      <p>Balance: {isLoadingBalance ? 'Loading...' : (balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...')}</p>
      <button
        onClick={handleSend}
        disabled={!hasBalance || isSending}
      >
        {isSending ? 'Sending Transaction...' : 'Send Test Transaction'}
      </button>
      {signature && (
        <div>
          <p>Transaction successful!</p>
          <p>Signature: {signature}</p>
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Solana Explorer
          </a>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}
```

**Note**: This example matches the actual implementation in `WalletPanelEnhanced.tsx` in this repository, including balance polling (30 seconds), error handling, and transaction state management.

## Testing Your Transaction Implementation

Before deploying to production, test your transaction implementation thoroughly. Use this checklist to ensure everything works correctly:

### Test Scenarios

#### 1. First-time User Flow

Test the complete flow for a new user:

- [ ] **Connect wallet (passkey creation)**
  - Click "Connect Wallet with Passkey"
  - Browser prompts for biometric authentication (Face ID, Touch ID, Windows Hello)
  - Passkey is created and stored securely
  - Wallet address is displayed

- [ ] **Verify address displayed**
  - Check that wallet address is a valid Solana address (44 characters, base58)
  - Address should start with a valid Solana address prefix
  - Copy address functionality works

- [ ] **Check balance shows 0 SOL**
  - Balance should display as 0.00000000 SOL
  - Loading state shows while fetching balance
  - Error handling works if RPC is unavailable

- [ ] **Request from faucet**
  - Copy wallet address
  - Visit [Solana Faucet](https://faucet.solana.com)
  - Request 1 SOL (Devnet)
  - Wait ~30 seconds for confirmation

- [ ] **Verify balance updates**
  - Balance should update to show ~1 SOL
  - Balance polling works (updates every 30 seconds)
  - Balance refreshes after transactions

#### 2. Returning User Flow

Test session persistence and reconnection:

- [ ] **Refresh page**
  - Close and reopen browser tab
  - Wallet should attempt to auto-reconnect
  - Loading state shows during reconnection

- [ ] **Should auto-reconnect**
  - Wallet reconnects automatically if session is valid
  - No need to click "Connect" again
  - Wallet address persists

- [ ] **Balance persists**
  - Balance should be displayed immediately
  - No need to wait for balance fetch
  - Balance updates correctly after reconnection

#### 3. Transaction Flow

Test sending transactions:

- [ ] **Send 0.1 SOL**
  - Enter valid recipient address
  - Enter amount: 0.1 SOL
  - Click "Send Transaction"
  - Passkey prompt appears

- [ ] **Approve with passkey**
  - Use biometric authentication (Face ID, Touch ID, Windows Hello)
  - Transaction is signed with passkey
  - Loading state shows "Sending Transaction..."

- [ ] **Verify transaction on Explorer**
  - Transaction signature is displayed
  - Click "View on Explorer" link
  - Transaction appears on Solana Explorer
  - Transaction status is "Success"
  - Balance decreases by transaction amount + fees

#### 4. Error Handling Tests

Test error scenarios:

- [ ] **Insufficient balance**
  - Try to send more SOL than available
  - Error message displays: "Insufficient balance"
  - Transaction is not sent

- [ ] **Invalid recipient address**
  - Enter invalid Solana address
  - Error message displays before sending
  - Transaction button is disabled

- [ ] **User cancels passkey prompt**
  - Click "Send Transaction"
  - Cancel the passkey prompt
  - Error message: "Transaction cancelled by user"
  - No transaction is sent

- [ ] **Network error**
  - Disconnect internet
  - Try to send transaction
  - Error message: "Network error"
  - Retry functionality works

### Step-by-Step Testing Instructions

1. **Start your development server:**
   ```bash
   npm run dev:https
   ```

2. **Open browser DevTools:**
   - Press F12 or right-click → Inspect
   - Go to Console tab to see logs
   - Go to Network tab to monitor requests

3. **Test each scenario:**
   - Follow the checklist above
   - Check console for errors
   - Verify network requests succeed
   - Test on different browsers (Chrome, Safari, Firefox)

4. **Test on mobile:**
   - Use your phone's browser
   - Test passkey authentication (Face ID, Touch ID)
   - Verify responsive design works

5. **Test edge cases:**
   - Very small amounts (0.001 SOL)
   - Very large amounts (if you have enough balance)
   - Multiple transactions in quick succession
   - Transaction while balance is updating

### Automated Testing (Optional)

For production apps, consider adding automated tests:

```typescript
// Example: Jest test for transaction
describe('Transaction Flow', () => {
  it('should send transaction successfully', async () => {
    // Mock wallet connection
    // Mock transaction signing
    // Verify transaction signature
  });
  
  it('should handle insufficient balance', async () => {
    // Mock insufficient balance
    // Verify error message
  });
});
```

## Common Issues and Solutions

### Issue: "Transaction simulation failed"
**Solution:** Check that you have sufficient balance for the transaction amount (not fees - those are paid by Paymaster).

### Issue: "User rejected the request"
**Solution:** User cancelled the biometric prompt. This is expected behavior - handle gracefully.

### Issue: "Network error"
**Solution:** Check your RPC URL and network connection. Try using a different RPC endpoint.

### Issue: "Insufficient funds for transaction"

**What it means:** Your wallet doesn't have enough SOL to cover both the transaction amount and fees.

**Check:**
- You have enough SOL for the transaction amount
- Native SOL transfers use wallet-paid fees (not sponsored by paymaster)
- Minimum balance required: transaction amount + ~0.000005 SOL for fees

**Solution:**
1. Verify your balance: `connection.getBalance(smartWalletPubkey)`
2. Ensure balance > transaction amount + 0.000005 SOL
3. If balance is insufficient, fund your wallet from a faucet or another wallet
4. For native SOL transfers, fees are always paid from wallet balance

**Example:**
```typescript
const balance = await connection.getBalance(smartWalletPubkey);
const balanceSOL = balance / LAMPORTS_PER_SOL;
const requiredBalance = sendAmount + 0.000005; // Amount + fees

if (balanceSOL < requiredBalance) {
  setError(`Insufficient balance. Need ${requiredBalance} SOL, have ${balanceSOL.toFixed(8)} SOL`);
}
```

### Issue: "RPC rate limit exceeded (429)"

**What it means:** You've exceeded the rate limit for your RPC endpoint. Public RPC endpoints have strict rate limits.

**Solution:**
1. **Use a private RPC provider** (recommended for production):
   - [Helius](https://www.helius.dev/) - Free tier available
   - [QuickNode](https://www.quicknode.com/) - Free tier available
   - [Alchemy](https://www.alchemy.com/) - Free tier available

2. **Update your RPC URL:**
```typescript
// In app/lib/constants/urls.ts
export const RPC_URL = 'https://your-helius-endpoint.com';
```

3. **See [RPC Configuration Guide](../guides/rpc-configuration.md)** for detailed setup instructions

**Temporary workaround:**
- Wait 1-2 minutes before retrying
- Reduce the frequency of balance checks
- Implement request throttling in your code

### Issue: "Transaction too large: Transaction size exceeds Solana's 1232 byte limit"
**What it means:** Transactions may fail with this error. Follow these troubleshooting steps:

**Troubleshooting Steps:**

1. **First, check if you have sufficient balance:**
   - Verify your wallet balance is enough for the transaction amount
   - Ensure you have enough SOL to cover transaction fees
   - If balance is insufficient, fund your wallet and try again

2. **If you have sufficient balance, this is likely a passkey cache problem:**
   - **Root Cause**: Passkey cache inconsistencies can cause the paymaster pipeline to create oversized transactions
   - When passkey credentials are cached inconsistently, transaction size calculation can exceed Solana's 1232 byte limit
   - This can happen with any transaction amount, not just small ones

**Solution - Clear Cache and Reconnect:**

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

## Quick Reference

### Essential Imports

```typescript
// Wallet hooks
import { useWallet } from '@lazorkit/wallet';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';

// Solana Web3.js
import { 
  SystemProgram, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  Connection 
} from '@solana/web3.js';

// Connection utility
import { getConnection } from '../lib/rpc/connection';
```

### Common Operations

#### Connect Wallet

```typescript
const { connect, isConnected, smartWalletPubkey } = useWallet();

// Connect
await connect();

// Check connection
if (isConnected && smartWalletPubkey) {
  console.log('Connected:', smartWalletPubkey.toString());
}
```

#### Get Balance

```typescript
const connection = getConnection();
const balance = await connection.getBalance(smartWalletPubkey);
const balanceSOL = balance / LAMPORTS_PER_SOL;
console.log(`Balance: ${balanceSOL} SOL`);
```

#### Transfer SOL

```typescript
// Option 1: Using useTransactionSigning (Recommended)
const { signTransaction } = useTransactionSigning();

const instruction = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: recipientPubkey,
  lamports: amount * LAMPORTS_PER_SOL,
});

// Note: For native SOL transfers, fees are paid from wallet balance
const signature = await signTransaction({
  instructions: [instruction],
});

// Option 2: Direct usage (Simple)
const { signAndSendTransaction } = useWallet();

const signature = await signAndSendTransaction({
  instructions: [instruction],
});
```

#### Confirm Transaction

```typescript
const connection = getConnection();
await connection.confirmTransaction(signature, 'confirmed');
```

#### View Transaction on Explorer

```typescript
const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
window.open(explorerUrl, '_blank');
```

### Error Handling Pattern

```typescript
try {
  const signature = await signTransaction({ instructions: [instruction] });
  // Success
} catch (err: unknown) {
  const error = err as { message?: string; name?: string };
  
  if (error.name === 'NotAllowedError') {
    // User cancelled
  } else if (error.message?.includes('insufficient')) {
    // Insufficient balance
  } else {
    // Generic error
  }
}
```

## Key Takeaways

- ✅ LazorKit handles signing and fee payment automatically
- ✅ Use `signAndSendTransaction` with instructions (not Transaction objects)
- ✅ Native SOL transfers use wallet-paid fees (realistic production behavior)
- ✅ Paymaster may sponsor fees for other transaction types (token transfers, etc.)
- ✅ Always handle errors gracefully
- ✅ Verify transactions on Solana Explorer

## Next Steps

- Implement token transfers (see examples above)
- Create multi-instruction transactions
- Learn about session persistence ([Tutorial 3: Session Persistence](./tutorial-3-session-persistence.md))

## Additional Resources

- [LazorKit Transaction Docs](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)
- [LazorKit Getting Started - Transactions](https://docs.lazorkit.com/react-sdk/getting-started#4-sending-transactions)
- [Solana Transaction Guide](https://docs.solana.com/developing/programming-model/transactions)
- [SPL Token Program](https://spl.solana.com/token)

## Summary

In this tutorial, you learned:
- ✅ How transaction fees work (wallet-paid for native SOL transfers)
- ✅ How the Paymaster service can sponsor fees for certain transaction types
- ✅ How to use `signAndSendTransaction` method
- ✅ How to create different types of transaction instructions (SOL transfers, token transfers, multiple instructions)
- ✅ How to handle transaction errors and common issues
- ✅ How to add QR scanner for easier recipient address input (optional UX enhancement)
- ✅ Best practices for transaction handling

Your users can now send transactions with passkey authentication!

