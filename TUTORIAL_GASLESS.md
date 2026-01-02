# Tutorial: Gasless Transactions with LazorKit

Learn how to implement **zero-fee transactions** on Solana using LazorKit's paymaster infrastructure. Your users never need SOL for gas!

## What You'll Learn

- How gasless transactions work
- Implementing paymaster configuration
- Sending transactions without gas fees
- Best practices for production use

---

## Understanding Gasless Transactions

### The Problem with Traditional Transactions

In traditional Web3:

1. **User needs tokens for gas**: Even if they have USDC, they need SOL for fees
2. **Bad onboarding UX**: New users must buy SOL before using your app
3. **Complex wallet management**: Users need to maintain gas balances
4. **Failed transactions**: Transactions fail if gas balance too low

### The LazorKit Solution

With LazorKit's paymaster:

✅ **No gas needed**: Users can send transactions with 0 SOL balance
✅ **Better onboarding**: New users can transact immediately
✅ **Simplified UX**: Users don't think about gas at all
✅ **You control costs**: You decide which transactions to sponsor

---

## How Gasless Transactions Work

### Traditional Transaction Flow

```
1. User creates transaction
2. User signs transaction
3. User pays gas fee from their wallet
4. Transaction sent to network
5. Network validates and processes
```

### LazorKit Gasless Flow

```
1. User creates transaction
2. User signs transaction with passkey
3. LazorKit adds paymaster signature
4. Paymaster pays gas fee
5. Transaction sent to network
6. Network validates and processes
```

**Key Difference**: The **paymaster** covers the transaction fee, not the user!

---

## Implementation Guide

### Step 1: Configure Paymaster

Set up LazorKit with paymaster support:

```tsx
// app/components/LazorkitProviderWrapper.tsx
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com'; // 🔑 Official Devnet paymaster

export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  // Configure paymaster
  const paymasterConfig = useMemo(
    () => ({
      paymasterUrl: PAYMASTER_URL,
      // Optional: Add custom policies
      // maxGasPrice: 0.0001, // Max gas to sponsor per transaction
      // allowedInstructions: ['transfer'], // Only allow specific operations
    }),
    []
  );

  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      paymasterConfig={paymasterConfig} // 🔑 Enable gasless transactions
    >
      {children}
    </LazorkitProvider>
  );
}
```

**Configuration Options:**

- `paymasterUrl`: Endpoint for paymaster service
- `maxGasPrice`: Maximum gas to sponsor (optional)
- `allowedInstructions`: Whitelist of operations (optional)
- `customPolicies`: Advanced filtering (optional)

### Step 2: Send Gasless SOL Transfer

Create a function to send SOL without gas fees:

```tsx
// app/components/GaslessTransfer.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

export default function GaslessTransfer() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartWalletPubkey || !signAndSendTransaction) return;

    setIsSending(true);
    try {
      // Create transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: new PublicKey(recipient),
        lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
      });

      // 🔥 Send gasless transaction
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });

      console.log('✅ Transaction sent (gasless!):', signature);
      setTxSignature(signature);
    } catch (err) {
      console.error('❌ Transaction failed:', err);
      alert('Transaction failed. Please check console.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleTransfer}>
      <h3>Send SOL (Gasless) ⚡</h3>
      
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />
      
      <input
        type="number"
        step="0.001"
        placeholder="Amount (SOL)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <button type="submit" disabled={isSending}>
        {isSending ? 'Sending...' : 'Send SOL (No Gas Fees!)'}\n      </button>

      {txSignature && (
        <div className="success">
          <p>✅ Transaction successful!</p>
          <p>🔗 Signature: {txSignature}</p>
          <p>💰 Gas fee: $0.00 (covered by paymaster)</p>
        </div>
      )}
    </form>
  );
}
```

**What's Happening:**

1. User creates transfer instruction
2. User signs with passkey (no gas required!)
3. `signAndSendTransaction()` sends to LazorKit
4. LazorKit's paymaster adds signature + covers gas
5. Transaction submitted to Solana
6. User pays $0 in fees!

### Step 3: Monitor Transaction Status

Track transaction confirmation:

```tsx
import { Connection } from '@solana/web3.js';

const connection = new Connection(RPC_URL, 'confirmed');

const handleTransferWithConfirmation = async () => {
  try {
    // Send transaction
    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });

    console.log('Transaction sent:', signature);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      signature,
      'confirmed'
    );

    if (confirmation.value.err) {
      console.error('Transaction failed:', confirmation.value.err);
    } else {
      console.log('✅ Transaction confirmed!');
      console.log('💰 Gas paid by: Paymaster');
    }
  } catch (err) {
    console.error('Transaction error:', err);
  }
};
```

---

## Advanced Use Cases

### 1. Token Transfers (SPL Tokens)

Send tokens without gas fees:

```tsx
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token';

const sendToken = async (
  mintAddress: PublicKey,
  recipient: PublicKey,
  amount: number
) => {
  if (!smartWalletPubkey || !signAndSendTransaction) return;

  // Get token accounts
  const fromTokenAccount = await getAssociatedTokenAddress(
    mintAddress,
    smartWalletPubkey
  );
  
  const toTokenAccount = await getAssociatedTokenAddress(
    mintAddress,
    recipient
  );

  // Create transfer instruction
  const instruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    smartWalletPubkey,
    amount
  );

  // 🔥 Send gasless
  const signature = await signAndSendTransaction({
    instructions: [instruction],
  });

  console.log('Token sent (gasless!):', signature);
};
```

### 2. NFT Minting

Mint NFTs without gas fees:

```tsx
import { createMintInstruction } from '@metaplex-foundation/mpl-token-metadata';

const mintNFT = async (metadata: NFTMetadata) => {
  if (!smartWalletPubkey || !signAndSendTransaction) return;

  const mintInstructions = await createNFTMintInstructions({
    payer: smartWalletPubkey,
    metadata,
  });

  // 🔥 Mint without gas fees
  const signature = await signAndSendTransaction({
    instructions: mintInstructions,
  });

  console.log('NFT minted (gasless!):', signature);
};
```

### 3. Smart Contract Interactions

Call programs without gas:

```tsx
import { TransactionInstruction } from '@solana/web3.js';

const callProgram = async (
  programId: PublicKey,
  data: Buffer,
  accounts: AccountMeta[]
) => {
  const instruction = new TransactionInstruction({
    keys: accounts,
    programId,
    data,
  });

  // 🔥 Execute gasless
  const signature = await signAndSendTransaction({
    instructions: [instruction],
  });

  console.log('Program called (gasless!):', signature);
};
```

### 4. Batch Transactions

Send multiple operations gasless:

```tsx
const batchOperations = async () => {
  const instructions = [
    // Transfer SOL
    SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: recipient1,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    }),
    // Transfer to another
    SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: recipient2,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    }),
    // Create account
    SystemProgram.createAccount({
      fromPubkey: smartWalletPubkey!,
      newAccountPubkey: newAccount,
      lamports: rentExemptBalance,
      space: 165,
      programId: TOKEN_PROGRAM_ID,
    }),
  ];

  // 🔥 All gasless in one transaction!
  const signature = await signAndSendTransaction({
    instructions,
  });

  console.log('Batch executed (gasless!):', signature);
};
```

---

## Best Practices

### 1. Show Gas Savings to Users

```tsx
<div className="gas-info">
  <p>⚡ Gasless Transaction</p>
  <p>Transaction fee: <s>~$0.01</s> <strong>$0.00</strong></p>
  <p>Covered by LazorKit</p>
</div>
```

### 2. Handle Paymaster Errors

```tsx
try {
  await signAndSendTransaction({ instructions });
} catch (err: any) {
  if (err.message.includes('paymaster')) {
    console.error('Paymaster error:', err);
    alert('Gasless transaction unavailable. Please try again later.');
  } else {
    console.error('Transaction error:', err);
    alert('Transaction failed. Please check your balance.');
  }
}
```

### 3. Add Transaction Limits

Prevent abuse:

```tsx
const paymasterConfig = {
  paymasterUrl: PAYMASTER_URL,
  policies: {
    maxTransactionSize: 1232, // Max bytes
    maxGasPrice: 0.0001, // Max SOL to sponsor
    rateLimit: {
      maxPerMinute: 5,
      maxPerHour: 50,
    },
  },
};
```

### 4. Monitor Paymaster Status

Check if paymaster is available:

```tsx
const checkPaymasterStatus = async () => {
  try {
    const response = await fetch(`${PAYMASTER_URL}/status`);
    const data = await response.json();
    
    if (!data.available) {
      console.warn('Paymaster unavailable');
      // Show fallback option
    }
  } catch (err) {
    console.error('Paymaster check failed:', err);
  }
};
```

---

## Cost Management

### Understanding Paymaster Costs

**Typical Solana transaction fees:**
- Simple transfer: ~$0.00001 - $0.0001
- Token transfer: ~$0.0001 - $0.001
- NFT mint: ~$0.001 - $0.01
- Complex smart contract: ~$0.01+

**Monthly costs (example app):**
- 1,000 users
- 10 transactions/user/month
- Average fee: $0.0001/tx
- **Total: $1/month**

### Optimizing Costs

1. **Batch Operations**: Combine multiple operations
2. **Use Compute Units Wisely**: Optimize smart contract calls
3. **Set Transaction Limits**: Prevent abuse
4. **Monitor Usage**: Track costs per user

### Production Considerations

For production apps with high volume:

```tsx
// Option 1: Use LazorKit's production paymaster
const paymasterConfig = {
  paymasterUrl: 'https://kora.mainnet.lazorkit.com', // Mainnet paymaster
  apiKey: process.env.LAZORKIT_API_KEY,
};

// Option 2: Run your own paymaster
const paymasterConfig = {
  paymasterUrl: 'https://paymaster.yourdomain.com',
  apiKey: process.env.YOUR_API_KEY,
};

// Option 3: Hybrid approach
const paymasterConfig = {
  paymasterUrl: shouldSponsor ? PAID_PAYMASTER : undefined,
  // Sponsor for new users, require gas after X transactions
};
```

---

## Security Considerations

### 1. Prevent Abuse

```tsx
// Backend validation
app.post('/api/validate-transaction', async (req, res) => {
  const { user, transaction } = req.body;
  
  // Check user limits
  const txCount = await getUserTransactionCount(user);
  if (txCount > DAILY_LIMIT) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // Validate transaction
  if (!isValidTransaction(transaction)) {
    return res.status(400).json({ error: 'Invalid transaction' });
  }
  
  res.json({ approved: true });
});
```

### 2. Whitelist Operations

```tsx
const paymasterConfig = {
  paymasterUrl: PAYMASTER_URL,
  allowedInstructions: [
    'transfer', // SOL transfers
    'transferChecked', // Token transfers
    'createAccount', // Account creation
    // Block expensive operations
  ],
};
```

### 3. Set Gas Limits

```tsx
const paymasterConfig = {
  paymasterUrl: PAYMASTER_URL,
  maxGasPrice: 0.0001, // Max 0.0001 SOL per transaction
};
```

---

## Testing

### Testing Gasless Transactions

1. **Test on Devnet**:
```bash
# Use Devnet for testing
RPC_URL=https://api.devnet.solana.com
```

2. **Verify Zero Balance Works**:
```tsx
const testGaslessWithZeroBalance = async () => {
  // Connect wallet (should have 0 SOL balance)
  await connect();
  
  // Attempt transfer
  const signature = await signAndSendTransaction({
    instructions: [transferInstruction],
  });
  
  console.log('✅ Transaction sent with 0 SOL balance!');
};
```

3. **Monitor Transaction Fees**:
```tsx
const connection = new Connection(RPC_URL, 'confirmed');

const tx = await connection.getTransaction(signature, {
  maxSupportedTransactionVersion: 0,
});

console.log('Fee:', tx?.meta?.fee, 'lamports');
console.log('Fee payer:', tx?.transaction.message.accountKeys[0]);
// Fee payer should be paymaster, not user!
```

---

## Common Issues

### Issue: "Insufficient funds"

**Cause**: Paymaster configuration missing or incorrect

**Solution**:
```tsx
// Verify paymaster is configured
const { paymasterConfig } = useLazorkit();
console.log('Paymaster:', paymasterConfig?.paymasterUrl);

// Should output: https://kora.devnet.lazorkit.com
```

### Issue: "Transaction too large"

**Cause**: Transaction exceeds paymaster limits

**Solution**:
```tsx
// Split into multiple transactions
const batch1 = instructions.slice(0, 3);
const batch2 = instructions.slice(3);

await signAndSendTransaction({ instructions: batch1 });
await signAndSendTransaction({ instructions: batch2 });
```

### Issue: "Paymaster unavailable"

**Cause**: Paymaster service down or rate limited

**Solution**:
```tsx
// Add fallback logic
try {
  await signAndSendTransaction({ instructions });
} catch (err) {
  if (err.message.includes('paymaster')) {
    // Fallback: Ask user to pay gas
    alert('Gasless service unavailable. Transaction requires small fee.');
    // Use regular transaction method
  }
}
```

---

## Production Checklist

- [ ] Paymaster endpoint configured correctly
- [ ] Error handling for paymaster failures
- [ ] Transaction limits set
- [ ] Rate limiting implemented
- [ ] Cost monitoring in place
- [ ] User communication about gasless feature
- [ ] Fallback for paymaster unavailability
- [ ] Testing on Devnet complete
- [ ] Mainnet testing with small amounts
- [ ] Analytics tracking gasless transaction success rate

---

## Real-World Examples

### Example 1: Onboarding Flow

```tsx
const onboardNewUser = async () => {
  // 1. User connects with passkey (no wallet setup!)
  await connect();
  
  // 2. Airdrop welcome NFT (gasless!)
  await mintWelcomeNFT();
  
  // 3. User can immediately start using app
  // No need to buy SOL or understand gas fees!
};
```

### Example 2: E-Commerce Checkout

```tsx
const checkoutWithCrypto = async (items: CartItem[]) => {
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.price, 0);
  
  // Transfer USDC to merchant (gasless!)
  const signature = await signAndSendTransaction({
    instructions: [
      createTransferInstruction({
        source: userUSDCAccount,
        destination: merchantUSDCAccount,
        amount: total * 1_000_000, // USDC has 6 decimals
        owner: smartWalletPubkey!,
      }),
    ],
  });
  
  // User paid $0 in gas fees!
  console.log('Payment completed (gasless!):', signature);
};
```

### Example 3: Gaming Rewards

```tsx
const claimGameReward = async (rewardAmount: number) => {
  // Mint reward tokens to user (gasless!)
  const signature = await signAndSendTransaction({
    instructions: [
      createMintToInstruction({
        mint: REWARD_TOKEN_MINT,
        destination: userTokenAccount,
        authority: gameAuthority,
        amount: rewardAmount,
      }),
    ],
  });
  
  console.log('Reward claimed (no gas!):', signature);
};
```

---

## Next Steps

1. **Implement Your First Gasless Transaction**: Start with simple SOL transfer
2. **Add Token Support**: Enable gasless token transfers
3. **Monitor Costs**: Track paymaster usage and costs
4. **Optimize**: Batch operations to reduce transaction count
5. **Scale**: Move to production paymaster when ready

---

## Resources

- **LazorKit Paymaster Docs**: [docs.lazorkit.com/paymaster](https://docs.lazorkit.com)
- **Solana Transaction Guide**: [docs.solana.com/developing/programming-model/transactions](https://docs.solana.com)
- **Gas Optimization**: [docs.solana.com/developing/programming-model/runtime#compute-budget](https://docs.solana.com)

---

**Ready to eliminate gas fees? Let's build! 🚀**
