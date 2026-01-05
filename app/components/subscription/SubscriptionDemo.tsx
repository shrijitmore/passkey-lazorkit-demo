'use client';

import { useState, useMemo, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection } from '../../lib/rpc/connection';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import AlertMessage from '../ui/AlertMessage';
import LoadingSpinner from '../ui/LoadingSpinner';
import { addSubscription, getSubscriptions } from '../../lib/subscription/storage';
import { generateSubscriptionId, calculateNextBillingDate } from '../../lib/subscription/utils';
import type { Subscription, SubscriptionPlanId } from '../../lib/subscription/types';
import { WALLET_EVENTS, dispatchWalletEvent } from '../../lib/events/walletEvents';
import { useTransactionSigning } from '../../lib/hooks/useTransactionSigning';
import { parseError } from '../../lib/utils/errorHandling';
import { SUBSCRIPTION_PLANS } from '../../lib/constants/subscriptionPlans';

// Merchant wallet address - receives subscription payments
const MERCHANT_WALLET = new PublicKey('9T2zGaNBr7bKBBEvQ9AAGNwCG3iL4jVF2Z8TipqikpKG');

export default function SubscriptionDemo() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { signTransaction } = useTransactionSigning();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubscribe = useCallback(async (planId: string) => {
    if (!isConnected || !smartWalletPubkey) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if user already has an active subscription for this plan
    const existingSubscriptions = getSubscriptions(smartWalletPubkey.toString());
    const activeSubscription = existingSubscriptions.find(
      (sub) => sub.planId === planId && sub.status === 'active'
    );
    
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (activeSubscription) {
      setError(`You already have an active ${plan?.name} subscription`);
      return;
    }

    if (!plan) {
      setError('Invalid plan selected');
      return;
    }

    setSelectedPlan(planId);
    setIsSubscribing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create transaction instruction for subscription payment
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: MERCHANT_WALLET,
        lamports: plan.price * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction with automatic credential refresh
      const txSignature = await signTransaction({
        instructions: [instruction],
        onError: (error) => {
          const errorInfo = parseError(error);
          setError(errorInfo.userFriendly || errorInfo.message);
        },
      });

      // Wait for confirmation
      const connection = getConnection();
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
      const errorInfo = parseError(err);
      setError(errorInfo.userFriendly || errorInfo.message || 'Subscription failed. Please try again.');
      console.error('Subscription error:', err);
    } finally {
      setIsSubscribing(false);
    }
  }, [isConnected, smartWalletPubkey, signTransaction]);

  return (
    <div className="w-full px-4 sm:px-0" data-testid="subscription-demo">
      {/* Error message display */}
      {error && (
        <AlertMessage
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Success message display */}
      {successMessage && (
        <AlertMessage
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
          actionLink={{
            href: '#subscriptions',
            text: 'View My Subscriptions',
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
          <Card
            key={plan.id}
            className={`relative flex h-full flex-col overflow-hidden transition-all hover:shadow-lg ${
              plan.popular
                ? 'border-2 border-primary/50 bg-gradient-to-br from-card via-card to-card/80'
                : 'border border-border'
            }`}
          >
            <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-6">
              {plan.popular && (
                <div className="mb-3 sm:mb-4 flex justify-center">
                  <Badge
                    variant="default"
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 px-3 sm:px-4 py-1 text-xs font-bold text-white shadow-md"
                  >
                    MOST POPULAR
                  </Badge>
                </div>
              )}
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">{plan.name}</CardTitle>
              <div className="mt-3 sm:mt-4 flex flex-wrap items-baseline gap-1">
                <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-3xl sm:text-4xl font-bold text-transparent">
                  {plan.price}
                </span>
                <span className="text-base sm:text-lg text-muted-foreground">SOL</span>
                <span className="text-xs sm:text-sm text-muted-foreground">/ {plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col overflow-hidden px-4 sm:px-6">
              <ul className="mb-4 sm:mb-6 flex-1 space-y-2 sm:space-y-3 overflow-y-auto">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-cyan-400" />
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-3 sm:pt-4">
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!isConnected || isSubscribing}
                  variant={plan.popular ? 'gradient' : 'outline'}
                  size="lg"
                  className="w-full text-sm sm:text-base py-3 sm:py-4"
                  data-testid={`subscribe-${plan.id}-btn`}
                >
                  {isSubscribing && isSelected ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* How It Works */}
      <Card className="mt-8 sm:mt-12">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-xl sm:text-2xl font-bold text-transparent">
            How Subscription Billing Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
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
              <div key={index} className="flex gap-3 sm:gap-4" data-testid={`how-it-works-${index}`}>
                <div className="flex shrink-0">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-base sm:text-lg font-bold text-white shadow-md">
                    {item.step}
                  </div>
                </div>
                <div>
                  <h4 className="mb-1 sm:mb-2 text-sm sm:text-base font-semibold text-foreground">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 rounded-lg border border-primary/20 bg-muted/50 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg
                className="mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary"
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
                <p className="mb-1 text-sm sm:text-base font-semibold text-foreground">Production Implementation</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
