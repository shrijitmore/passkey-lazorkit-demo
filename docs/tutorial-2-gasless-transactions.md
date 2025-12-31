# Tutorial 2: Sending Gasless Transactions with LazorKit

This tutorial demonstrates how to send transactions on Solana using LazorKit's gasless transaction feature powered by the Paymaster service. Users won't need SOL for transaction fees!

> **Reference**: Based on [LazorKit Getting Started Guide](https://docs.lazorkit.com/react-sdk/getting-started#4-sending-transactions) and [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Setup](./tutorial-1-passkey-wallet.md)
- A connected wallet with some Devnet SOL (for the transaction amount, not fees)

## What You'll Learn

- Understanding the Paymaster service
- Creating transaction instructions
- Using `signAndSendTransaction` method
- Handling transaction results and errors
- Transaction options and configuration

## Step 1: Understanding Paymaster

According to the [LazorKit documentation](https://docs.lazorkit.com/), the **Paymaster** service enables gas sponsorship. Transactions can be paid for by an external relayer, removing the requirement for users to hold SOL for network fees.

**How it works:**
- Users don't need SOL for gas fees
- Transactions are still signed by the user's passkey
- The Paymaster pays the network fees
- Enables true gasless transactions

The Paymaster is configured in the `LazorkitProvider`:

```typescript
const paymasterConfig = useMemo(
  () => ({
    paymasterUrl: 'https://kora.devnet.lazorkit.com', // Official Devnet paymaster
  }),
  []
);
```

## Step 2: Understanding `signAndSendTransaction`

According to the [official documentation](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction):

> "The core method for executing on-chain actions. It handles signing the transaction with the user's passkey and submitting it via the Paymaster (bundler)."

**Key Difference from Traditional Wallets:**
- ❌ Traditional: Create Transaction → Sign → Send
- ✅ LazorKit: Create Instructions → `signAndSendTransaction` (handles everything)

The method:
1. Takes **instructions** directly (not a Transaction object)
2. Handles passkey signing automatically
3. Submits via Paymaster for gasless execution
4. Returns the transaction signature

## Step 3: Create a Simple Transfer Transaction

Based on the [official example](https://docs.lazorkit.com/react-sdk/getting-started#4-sending-transactions), here's how to send a transfer:

```typescript
// app/components/TransferButton.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function TransferButton() {
  const {
    signAndSendTransaction,
    smartWalletPubkey,
    isConnected,
  } = useWallet();

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

      // 2. Sign and Send (from official docs)
      const txSignature = await signAndSendTransaction({
        instructions: [instruction],
      });

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

## Step 4: Understanding Transaction Options

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

## Step 5: Creating Different Types of Instructions

### Transfer SOL

```typescript
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const transferInstruction = SystemProgram.transfer({
  fromPubkey: senderPubkey,
  toPubkey: recipientPubkey,
  lamports: 1 * LAMPORTS_PER_SOL, // 1 SOL
});
```

### Transfer Tokens (SPL Token)

```typescript
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

// Get token accounts
const fromTokenAccount = await getAssociatedTokenAddress(
  tokenMint,
  senderPubkey
);
const toTokenAccount = await getAssociatedTokenAddress(
  tokenMint,
  recipientPubkey
);

// Create transfer instruction
const tokenTransferInstruction = createTransferInstruction(
  fromTokenAccount,
  toTokenAccount,
  senderPubkey,
  1000000, // Amount (with decimals)
  []
);
```

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

## Step 6: Error Handling Best Practices

According to the [official documentation](https://docs.lazorkit.com/react-sdk/getting-started), handle errors gracefully:

```typescript
const handleSendTransaction = async () => {
  try {
    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });
    // Success handling
  } catch (error) {
    // Handle specific error types
    if (error.message?.includes('User rejected')) {
      // User cancelled the transaction
      setError('Transaction cancelled by user');
    } else if (error.message?.includes('insufficient funds')) {
      // Not enough balance for the transaction amount
      setError('Insufficient balance');
    } else if (error.message?.includes('network')) {
      // Network/RPC error
      setError('Network error. Please try again.');
    } else {
      // Generic error
      setError(error.message || 'Transaction failed');
    }
  }
};
```

## Step 7: Complete Example with Balance Check

Here's a complete example that checks balance before sending (based on the actual `WalletPanel.tsx` implementation in this repository):

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';

export default function TransactionExample() {
  const {
    smartWalletPubkey,
    isConnected,
    signAndSendTransaction,
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connection = new Connection(RPC_URL, 'confirmed');

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
      // Poll balance every 5 seconds
      const interval = setInterval(fetchBalance, 5000);
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
    if (!smartWalletPubkey || !signAndSendTransaction || balance === null || balance === 0) {
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

      // Sign and send transaction using LazorKit's signAndSendTransaction
      // This method handles signing with passkey and submission via Paymaster
      const txSignature = await signAndSendTransaction({
        instructions: [instruction],
      });

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

**Note**: This example matches the actual implementation in `WalletPanel.tsx` in this repository, including balance polling, error handling, and transaction state management.

## Common Issues and Solutions

### Issue: "Transaction simulation failed"
**Solution:** Check that you have sufficient balance for the transaction amount (not fees - those are paid by Paymaster).

### Issue: "User rejected the request"
**Solution:** User cancelled the biometric prompt. This is expected behavior - handle gracefully.

### Issue: "Network error"
**Solution:** Check your RPC URL and network connection. Try using a different RPC endpoint.

### Issue: "Insufficient funds"
**Solution:** Ensure you have enough SOL for the transaction amount (fees are handled by Paymaster).

## Key Takeaways

- ✅ LazorKit handles signing and fee payment automatically
- ✅ Use `signAndSendTransaction` with instructions (not Transaction objects)
- ✅ Transactions are gasless via Paymaster
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
- ✅ How the Paymaster service enables gasless transactions
- ✅ How to use `signAndSendTransaction` method
- ✅ How to create different types of transaction instructions
- ✅ How to handle transaction errors
- ✅ Best practices for transaction handling

Your users can now send transactions without needing SOL for gas fees!

