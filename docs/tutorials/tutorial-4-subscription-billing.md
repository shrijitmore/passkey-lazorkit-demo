# Tutorial 4: Subscription Billing with Smart Wallets

This tutorial demonstrates how to implement subscription billing using LazorKit's smart wallets with passkey authentication. Users approve once, and recurring payments can be automated.

> **Reference**: Based on [LazorKit Getting Started Guide](https://docs.lazorkit.com/react-sdk/getting-started) and [signAndSendTransaction API](https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction)

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Setup](./tutorial-1-passkey-wallet.md)
- Completed [Tutorial 2: Sending Transactions](./tutorial-2-transactions.md)
- A connected wallet with some Devnet SOL

## What You'll Learn

- Understanding subscription billing with smart wallets
- Creating subscriptions with one-time passkey approval
- Managing subscription lifecycle (cancel, pause, resume)
- Tracking payment history
- Simulating recurring payments
- Production implementation considerations

## Step 1: Understanding Subscription Billing

### The Problem with Traditional Web3 Subscriptions

In traditional Web3:
1. **Manual approval required**: Users must manually approve each recurring payment
2. **Poor UX**: Users need to remember to approve monthly payments
3. **High friction**: Each payment requires wallet interaction
4. **Abandonment**: Users forget to approve and lose service

### The LazorKit Solution

With LazorKit smart wallets:
- ✅ **One-time approval**: User approves subscription once with passkey
- ✅ **Automated payments**: Recurring payments can be automated (with Clockwork/Streamflow)
- ✅ **Better UX**: Just like Web2 subscriptions but with blockchain transparency
- ✅ **Secure**: All transactions signed with passkey (biometric authentication)

### How It Works

1. **User Subscribes**: User selects a plan and approves with passkey (one-time)
2. **Transaction Created**: Subscription payment transaction is created and signed
3. **Subscription Stored**: Subscription record is saved (localStorage in demo, database in production)
4. **Recurring Payments**: Automated via Solana programs (Clockwork/Streamflow) in production
5. **Payment History**: All payments tracked with transaction signatures

## Step 2: Setting Up Subscription Types

First, define your subscription types:

```typescript
// app/lib/subscription/types.ts
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'expired';
export type SubscriptionPlanId = 'basic' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  planId: SubscriptionPlanId;
  walletAddress: string;
  status: SubscriptionStatus;
  createdAt: number;
  nextBillingDate: number;
  amount: number;
  interval: 'month';
  paymentHistory: PaymentRecord[];
  cancellationDate?: number;
  pausedUntil?: number;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  timestamp: number;
  txSignature: string;
  status: 'success' | 'failed';
}
```

## Step 3: Creating a Subscription

Create a subscription with passkey authentication:

```typescript
// app/components/SubscriptionDemo.tsx
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { addSubscription } from '../lib/subscription/storage';
import { generateSubscriptionId, calculateNextBillingDate } from '../lib/subscription/utils';

// Replace with your actual merchant wallet address
const MERCHANT_WALLET = new PublicKey('YOUR_MERCHANT_WALLET_ADDRESS');
// Note: In this demo, the merchant wallet is: 9T2zGaNBr7bKBBEvQ9AAGNwCG3iL4jVF2Z8TipqikpKG
const RPC_URL = 'https://api.devnet.solana.com';

export default function SubscriptionDemo() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } = useWallet();
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (!isConnected || !smartWalletPubkey || !signAndSendTransaction) {
      return;
    }

    setIsSubscribing(true);

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) throw new Error('Invalid plan');

      // Create transaction instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: MERCHANT_WALLET,
        lamports: plan.price * LAMPORTS_PER_SOL,
      });

      // Sign and send with passkey
      const txSignature = await signAndSendTransaction({
        instructions: [instruction],
      });

      // Wait for confirmation
      const connection = new Connection(RPC_URL, 'confirmed');
      await connection.confirmTransaction(txSignature, 'confirmed');

      // Create subscription record
      const subscription: Subscription = {
        id: generateSubscriptionId(),
        planId: planId as SubscriptionPlanId,
        walletAddress: smartWalletPubkey.toString(),
        status: 'active',
        createdAt: Date.now(),
        nextBillingDate: calculateNextBillingDate(Date.now()),
        amount: plan.price,
        interval: 'month',
        paymentHistory: [
          {
            id: `pay_${Date.now()}`,
            subscriptionId: '',
            amount: plan.price,
            timestamp: Date.now(),
            txSignature,
            status: 'success',
          },
        ],
      };

      subscription.paymentHistory[0].subscriptionId = subscription.id;

      // Save subscription
      addSubscription(smartWalletPubkey.toString(), subscription);

      console.log('Subscription created:', subscription.id);
    } catch (err) {
      console.error('Subscription error:', err);
    } finally {
      setIsSubscribing(false);
    }
  };
}
```

## Step 4: Managing Subscriptions

### Cancel Subscription

```typescript
import { updateSubscription } from '../lib/subscription/storage';

const handleCancel = (subscriptionId: string) => {
  updateSubscription(walletAddress, subscriptionId, {
    status: 'cancelled',
    cancellationDate: Date.now(),
  });
};
```

### Pause Subscription

```typescript
const handlePause = (subscriptionId: string) => {
  const pausedUntil = calculateNextBillingDate(Date.now());
  updateSubscription(walletAddress, subscriptionId, {
    status: 'paused',
    pausedUntil,
  });
};
```

### Resume Subscription

```typescript
const handleResume = (subscriptionId: string) => {
  const nextBillingDate = calculateNextBillingDate(Date.now());
  updateSubscription(walletAddress, subscriptionId, {
    status: 'active',
    pausedUntil: undefined,
    nextBillingDate,
  });
};
```

## Step 5: Payment History

Track all payments for a subscription:

```typescript
// app/components/SubscriptionPaymentHistory.tsx
export default function SubscriptionPaymentHistory({ subscription }: { subscription: Subscription }) {
  return (
    <div>
      <h4>Payment History</h4>
      {subscription.paymentHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((payment) => (
          <div key={payment.id}>
            <div>
              <span>{payment.amount} SOL</span>
              <span>{formatDateTime(payment.timestamp)}</span>
            </div>
            <a
              href={`https://explorer.solana.com/tx/${payment.txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Transaction
            </a>
          </div>
        ))}
    </div>
  );
}
```

## Step 6: Simulating Recurring Payments

For demo purposes, you can simulate recurring payments:

```typescript
// app/components/RecurringPaymentSimulator.tsx
const handleSimulatePayment = async (subscription: Subscription) => {
  if (!isConnected || !smartWalletPubkey || !signAndSendTransaction) return;

  try {
    // Check if billing is due
    if (!isBillingDue(subscription)) {
      throw new Error('Billing not due yet');
    }

    // Create payment transaction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: MERCHANT_WALLET,
      lamports: subscription.amount * LAMPORTS_PER_SOL,
    });

    // Sign and send
    const txSignature = await signAndSendTransaction({
      instructions: [instruction],
    });

    // Wait for confirmation
    const connection = new Connection(RPC_URL, 'confirmed');
    await connection.confirmTransaction(txSignature, 'confirmed');

    // Add payment record and update next billing date
    const updatedSubscription = addPaymentRecord(subscription, {
      amount: subscription.amount,
      timestamp: Date.now(),
      txSignature,
      status: 'success',
    });

    updateSubscription(walletAddress, subscription.id, {
      paymentHistory: updatedSubscription.paymentHistory,
      nextBillingDate: updatedSubscription.nextBillingDate,
    });
  } catch (err) {
    console.error('Payment simulation error:', err);
  }
};
```

**Note**: In production, this would be automated via Clockwork or Streamflow Solana programs.

## Step 7: Production Implementation

### Using Clockwork for Automated Recurring Payments

For production, integrate with [Clockwork](https://clockwork.xyz/) or [Streamflow](https://streamflow.finance/) for automated recurring payments:

```typescript
// Example with Clockwork (pseudo-code)
import { ClockworkProvider } from '@clockwork-xyz/sdk';

const scheduleRecurringPayment = async (subscription: Subscription) => {
  const clockwork = new ClockworkProvider(connection, wallet);
  
  // Create a thread that executes monthly
  await clockwork.thread.create({
    id: `subscription-${subscription.id}`,
    schedule: '0 0 1 * *', // First day of every month
    instruction: createPaymentInstruction(subscription),
  });
};
```

### Database Storage

In production, store subscriptions in a database instead of localStorage:

```typescript
// Backend API
POST /api/subscriptions
{
  "planId": "pro",
  "walletAddress": "...",
  "txSignature": "..."
}

GET /api/subscriptions/:walletAddress
// Returns all subscriptions for wallet

PUT /api/subscriptions/:id
// Update subscription (cancel, pause, etc.)
```

## Best Practices

### 1. Validate Before Creating

```typescript
const handleSubscribe = async (planId: string) => {
  // Check if user already has active subscription for this plan
  const existing = getSubscriptions(walletAddress).find(
    (sub) => sub.planId === planId && sub.status === 'active'
  );
  
  if (existing) {
    throw new Error('Already subscribed to this plan');
  }
  
  // Check balance
  const balance = await connection.getBalance(smartWalletPubkey);
  if (balance < plan.price * LAMPORTS_PER_SOL) {
    throw new Error('Insufficient balance');
  }
  
  // Proceed with subscription...
};
```

### 2. Handle Errors Gracefully

```typescript
try {
  await handleSubscribe(planId);
} catch (err: unknown) {
  const errorObj = err as { message?: string };
  
  if (errorObj?.message?.includes('insufficient')) {
    setError('Insufficient balance for subscription');
  } else if (errorObj?.message?.includes('cancelled')) {
    setError('Transaction was cancelled');
  } else {
    setError('Subscription failed. Please try again.');
  }
}
```

### 3. Show Clear Status

```typescript
const getStatusBadge = (status: SubscriptionStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400';
    case 'paused':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'cancelled':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-secondary/20 text-secondary';
  }
};
```

## Common Questions

### Q: How do recurring payments work in production?

**A**: In production, you'd integrate with Solana programs like Clockwork or Streamflow that execute transactions on a schedule. The passkey authentication flow remains the same - users approve once, and the program handles recurring payments automatically.

### Q: What happens if a payment fails?

**A**: You should:
1. Mark the payment as failed in payment history
2. Notify the user
3. Retry the payment (with user notification)
4. Pause subscription if multiple failures occur

### Q: Can users have multiple subscriptions?

**A**: Yes! The demo supports multiple subscriptions. In production, you'd typically allow one active subscription per plan, but users can have subscriptions to different plans.

### Q: How do I handle subscription upgrades?

**A**: You can:
1. Create a new subscription with the upgraded plan
2. Cancel the old subscription
3. Prorate the billing if needed

## Key Takeaways

- ✅ Subscriptions use one-time passkey approval
- ✅ All payments are tracked with transaction signatures
- ✅ Subscription lifecycle can be managed (cancel, pause, resume)
- ✅ In production, integrate with Clockwork/Streamflow for automation
- ✅ Payment history provides full transparency
- ✅ Passkey authentication ensures security

## Next Steps

- Implement subscription management UI
- Add payment retry logic
- Integrate with Clockwork/Streamflow for production
- Add subscription analytics
- Implement upgrade/downgrade flows

## Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [Clockwork Documentation](https://docs.clockwork.xyz/)
- [Streamflow Documentation](https://docs.streamflow.finance/)
- [Solana Program Development](https://docs.solana.com/developing/programming-model/overview)

## Summary

In this tutorial, you learned:
- How to create subscriptions with passkey authentication
- How to manage subscription lifecycle
- How to track payment history
- How to simulate recurring payments
- Production implementation considerations

Your users can now subscribe to services with a single passkey approval, and recurring payments can be automated in production!

