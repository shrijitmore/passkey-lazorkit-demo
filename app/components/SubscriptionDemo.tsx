'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import SpotlightCard from './SpotlightCard';
import { useTheme } from '../contexts/ThemeContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
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

export default function SubscriptionDemo() {
  const { isConnected } = useWallet();
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedPlan(planId);
    setIsSubscribing(true);

    // Simulate subscription flow
    setTimeout(() => {
      setIsSubscribing(false);
      alert('Subscription activated! (Demo mode)');
    }, 2000);
  };

  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="subscription-demo">
      <div className="text-center mb-12">
        <div className="inline-block glass-strong rounded-xl px-4 py-2 mb-4">
          <span className="text-sm font-semibold text-primary">✨ Advanced Use Case</span>
        </div>
        <h2 className="text-4xl font-bold mb-4">
          <span className="gradient-text">Subscription Billing with Smart Wallets</span>
        </h2>
        <p className="text-xl text-secondary max-w-3xl mx-auto">
          Automate recurring payments with passkey-secured smart wallets. Users approve once, payments happen automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <SpotlightCard
            key={plan.id}
            spotlightColor={isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(168, 85, 247, 0.15)'}
            className="h-full"
          >
            <div
              className={`glass-strong p-8 h-full flex flex-col relative ${
                plan.popular ? 'border-2 border-primary' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 gradient-primary text-white text-xs font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2 text-primary-text">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-secondary">SOL</span>
                  <span className="text-sm text-secondary">/ {plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-secondary">
                    <svg
                      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!isConnected || isSubscribing}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.popular
                    ? 'gradient-primary text-white btn-glow hover:opacity-90'
                    : 'glass text-primary-text hover:bg-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                data-testid={`subscribe-${plan.id}-btn`}
              >
                {isSubscribing && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Processing...
                  </span>
                ) : (
                  'Subscribe Now'
                )}
              </button>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* How It Works */}
      <div className="glass-strong rounded-2xl p-8">
        <h3 className="text-2xl font-bold mb-6 gradient-text">How Subscription Billing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="flex-shrink-0">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary-text">{item.title}</h4>
                <p className="text-sm text-secondary">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 glass rounded-xl border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-primary flex-shrink-0 mt-0.5"
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
              <p className="font-semibold text-primary-text mb-1">Production Implementation</p>
              <p className="text-sm text-secondary">
                This is a demo UI. For production, you'd integrate with Solana programs (like Clockwork or Streamflow) for automated recurring payments. The passkey authentication remains the same!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
