'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { addSubscription, getSubscriptions } from '../lib/subscription/storage';
import { generateSubscriptionId, calculateNextBillingDate } from '../lib/subscription/utils';
import type { Subscription, SubscriptionPlanId } from '../lib/subscription/types';
import { WALLET_EVENTS, dispatchWalletEvent } from '../lib/events/walletEvents';

/**
 * Subscription plan interface
 * Defines structure for subscription plans
 */
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // Price in SOL
  interval: string; // Billing interval (e.g., 'month')
  features: string[]; // List of features included
  popular?: boolean; // Whether this plan is marked as popular
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0.1,
    interval: 'month',
    features: [
      'Passkey authentication',
      'Basic smart wallet',
      '10 transactions/month',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 0.5,
    interval: 'month',
    features: [
      'Everything in Basic',
      'Unlimited transactions',
      'Priority support',
      'Advanced analytics',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2.0,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Custom integration',
      'Dedicated support',
      'SLA guarantee',
      'White-label option',
    ],
  },
];

// Configuration constants
const MERCHANT_WALLET = new PublicKey('9T2zGaNBr7bKBBEvQ9AAGNwCG3iL4jVF2Z8TipqikpKG'); // Merchant wallet address - receives subscription payments
const RPC_URL = 'https://api.devnet.solana.com';

/**
 * Subscription Demo Component
 * 
 * Features:
 * - Display subscription plans
 * - Handle subscription creation with passkey authentication
 * - Real-time transaction updates
 * - Error handling and success messages
 * 
 * Mobile Optimizations:
 * - Responsive card grid layout
 * - Mobile-friendly button sizes
 * - Touch-optimized interactions
 * - Responsive typography
 */
export default function SubscriptionDemo() {
  const { isConnected, smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  /**
   * Fetch wallet balance
   * Used to check if user has sufficient funds before subscribing
   */
  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const balance = await connection.getBalance(smartWalletPubkey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Balance fetch error:', err);
    }
  };

  /**
   * Handle subscription creation
   * 
   * Process:
   * 1. Validate wallet connection
   * 2. Check wallet balance (sufficient funds)
   * 3. Check for existing active subscription
   * 4. Create transfer instruction to merchant wallet
   * 5. Sign transaction with passkey
   * 6. Confirm transaction on blockchain
   * 7. Save subscription to localStorage
   * 8. Dispatch events for UI updates
   * 
   * Error Handling:
   * - Validates wallet connection
   * - Checks sufficient balance (including fees)
   * - Prevents duplicate subscriptions
   * - Handles transaction failures gracefully with user-friendly messages
   */
  const handleSubscribe = async (planId: string) => {
    // Validate wallet is connected
    if (!isConnected || !smartWalletPubkey || !signAndSendTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if user already has an active subscription for this plan
    const existingSubscriptions = getSubscriptions(smartWalletPubkey.toString());
    const activeSubscription = existingSubscriptions.find(
      (sub) => sub.planId === planId && sub.status === 'active'
    );
    
    if (activeSubscription) {
      setError(`You already have an active ${SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name} subscription`);
      return;
    }

    setSelectedPlan(planId);
    setIsSubscribing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      // Fetch current balance (fresh fetch, not relying on state)
      const balanceConnection = new Connection(RPC_URL, 'confirmed');
      const currentBalanceLamports = await balanceConnection.getBalance(smartWalletPubkey);
      const currentBalance = currentBalanceLamports / LAMPORTS_PER_SOL;
      setBalance(currentBalance);
      
      // Check if user has sufficient balance
      // Smart wallets need some SOL for rent exemption (~0.00089 SOL) + transaction fees (~0.000005 SOL)
      const rentExemption = 0.00089; // Minimum rent exemption for accounts
      const estimatedFee = 0.000005; // Estimated transaction fee
      const requiredAmount = plan.price + rentExemption + estimatedFee;
      
      if (currentBalance < requiredAmount) {
        throw new Error(
          `Insufficient balance. You need ${requiredAmount.toFixed(4)} SOL (${plan.price.toFixed(4)} SOL for subscription + ${rentExemption.toFixed(4)} SOL for rent + ~${estimatedFee.toFixed(6)} SOL for fees), but you have ${currentBalance.toFixed(4)} SOL. Please add more SOL to your wallet.`
        );
      }
      
      // Additional check: ensure wallet has minimum balance for smart wallet operations
      if (currentBalance < 0.001) {
        throw new Error(
          `Wallet balance too low. Smart wallets need at least 0.001 SOL for operations. You have ${currentBalance.toFixed(4)} SOL. Please add more SOL to your wallet.`
        );
      }

      // Create transaction instruction for subscription payment
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: MERCHANT_WALLET,
        lamports: plan.price * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction with passkey
      // IMPORTANT: Use wallet-paid transaction only (no paymaster flags)
      // - Paymasters typically reject native SOL transfers (policy-level)
      // - Wallet-paid transactions avoid simulation failures (0x2 errors)
      // - This reflects production-accurate behavior
      // DO NOT pass paymaster, skipPaymaster, or custom flags
      // DO NOT retry manually - let LazorKit handle it
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

      // Update payment record with subscription ID
      subscription.paymentHistory[0].subscriptionId = subscription.id;

      // Save subscription to storage
      addSubscription(smartWalletPubkey.toString(), subscription);

      // Dispatch events for automatic updates
      dispatchWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, {
        signature: txSignature,
        type: 'subscription',
      });
      dispatchWalletEvent(WALLET_EVENTS.BALANCE_UPDATED);
      dispatchWalletEvent(WALLET_EVENTS.SUBSCRIPTION_CREATED, {
        subscriptionId: subscription.id,
        planId: subscription.planId,
      });

      setSuccessMessage(`Successfully subscribed to ${plan.name}! Transaction: ${txSignature.substring(0, 8)}...`);
      setSelectedPlan(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      let errorMessage = 'Subscription failed. Please try again.';
      
      // Handle specific error cases with user-friendly messages
      if (errorObj?.message) {
        if (errorObj.message.includes('0x2') || errorObj.message.includes('custom program error: 0x2') || errorObj.message.includes('InsufficientFunds') || errorObj.message.includes('insufficient funds')) {
          // Error 0x2 in LazorKit context usually means:
          // 1. Paymaster rejected the transaction (native SOL transfers not sponsored)
          // 2. Smart wallet config state issue (needs reconnect)
          // 3. Transaction size/compute issues
          const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
          const planName = plan?.name || 'the selected plan';
          const planPrice = plan?.price || 0;
          
          errorMessage = `❌ Transaction Failed (Error 0x2)\n\n🔍 What's happening:\nThe LazorKit SDK is routing your transaction through the paymaster, but paymasters reject native SOL transfers at policy level. This is expected behavior, not a bug.\n\nYour balance: ${balance !== null ? balance.toFixed(4) : 'checking...'} SOL\nPlan cost: ${planPrice} SOL + ~0.001 SOL fees\n\n✅ FIX (Do this now):\n\n1. DISCONNECT your wallet (click Log Out in sidebar)\n2. CLEAR browser storage:\n   • Press F12 (open DevTools)\n   • Go to "Application" tab\n   • Click "Storage" → "Clear site data"\n   • Or: Right-click page → "Inspect" → "Application" → "Clear storage"\n3. RELOAD the page (F5 or Ctrl+R)\n4. RECONNECT your wallet with passkey\n5. Try subscribing again\n\n💡 Why this works:\nThis resets the corrupted smart wallet config state that's causing the paymaster to reject your transaction.\n\n📝 Note: This demo uses wallet-paid transactions (not gasless) for native SOL transfers, which is production-accurate behavior.`;
        } else if (errorObj.message.includes('Insufficient balance') || errorObj.message.includes('balance too low')) {
          errorMessage = errorObj.message;
        } else if (errorObj.message.includes('Transaction simulation failed') || errorObj.message.includes('Paymaster') || errorObj.message.includes('[Paymaster]')) {
          const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
          errorMessage = `❌ Transaction Simulation Failed\n\n🔍 What's happening:\nThe paymaster is rejecting your native SOL transfer (policy-level rejection). This happens because LazorKit SDK routes transactions through paymaster internally, but paymasters don't sponsor native SOL transfers.\n\nYour balance: ${balance !== null ? balance.toFixed(4) : 'checking...'} SOL\nPlan cost: ${plan?.price || 'plan price'} SOL + ~0.001 SOL fees\n\n✅ FIX (Do this now):\n\n1. DISCONNECT wallet (Log Out in sidebar)\n2. CLEAR browser storage (F12 → Application → Clear site data)\n3. RELOAD page (F5)\n4. RECONNECT wallet with passkey\n5. Try again\n\n💡 This resets the corrupted smart wallet state causing the paymaster rejection.`;
        } else {
          errorMessage = errorObj.message;
        }
      }
      
      setError(errorMessage);
      console.error('Subscription error:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected, smartWalletPubkey]);

  return (
    <div className="w-full" data-testid="subscription-demo">
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="whitespace-pre-line text-sm text-destructive">{error}</p>
          {(error.includes('0x2') || error.includes('Paymaster') || error.includes('simulation failed') || error.includes('[Paymaster]')) && (
            <div className="mt-4 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
              <p className="text-xs font-semibold text-yellow-400">⚡ Quick Fix Guide:</p>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-yellow-300">
                <li>Disconnect wallet (Log Out in sidebar)</li>
                <li>Press F12 → Application tab → Clear site data</li>
                <li>Reload page (F5)</li>
                <li>Reconnect wallet</li>
                <li>Try subscribing again</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <p className="text-sm text-green-400">{successMessage}</p>
          <a
            href="#subscriptions"
            className="mt-2 inline-block text-xs text-blue-400 underline hover:text-blue-300"
          >
            View My Subscriptions →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative flex h-full min-h-[500px] flex-col overflow-hidden transition-all hover:shadow-lg ${
              plan.popular
                ? 'border-2 border-primary/50 bg-gradient-to-br from-card via-card to-card/80'
                : 'border border-border'
            }`}
          >
            <CardHeader className="pb-4 pt-6">
              {plan.popular && (
                <div className="mb-4 flex justify-center">
                  <Badge
                    variant="default"
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-md"
                  >
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="mt-4 flex flex-wrap items-baseline gap-1">
                <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                  {plan.price}
                </span>
                <span className="text-base text-muted-foreground md:text-lg">SOL</span>
                <span className="text-xs text-muted-foreground md:text-sm">/ {plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col overflow-hidden">
              <ul className="mb-6 flex-1 space-y-3 overflow-y-auto">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4">
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!isConnected || isSubscribing}
                  variant={plan.popular ? 'gradient' : 'outline'}
                  size="lg"
                  className="w-full"
                  data-testid={`subscribe-${plan.id}-btn`}
                >
                  {isSubscribing && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            How Subscription Billing Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'User Subscribes',
                description: 'User selects a plan and approves subscription with passkey (one-time)',
              },
              {
                step: '2',
                title: 'Smart Wallet Setup',
                description: 'LazorKit creates a smart wallet with recurring payment permissions',
              },
              {
                step: '3',
                title: 'Auto Billing',
                description: 'Payments happen automatically each month. No manual approval needed!',
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4" data-testid={`how-it-works-${index}`}>
                <div className="flex shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-lg font-bold text-white shadow-md">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-lg border border-primary/20 bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <svg
                className="mt-0.5 h-6 w-6 shrink-0 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="mb-1 font-semibold text-foreground">Production Implementation</p>
                <p className="text-sm text-muted-foreground">
                  This is a demo UI. For production, you'd integrate with Solana programs (like Clockwork or Streamflow) for automated recurring payments. The passkey authentication remains the same!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
