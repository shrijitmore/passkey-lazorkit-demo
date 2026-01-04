'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { updateSubscription } from '../lib/subscription/storage';
import { formatDate, calculateNextBillingDate } from '../lib/subscription/utils';
import type { Subscription } from '../lib/subscription/types';
import SubscriptionActions from './SubscriptionActions';
import SubscriptionPaymentHistory from './SubscriptionPaymentHistory';
import SpotlightCard from './SpotlightCard';
import { useTheme } from '../contexts/ThemeContext';

const PLAN_NAMES: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

interface SubscriptionCardProps {
  subscription: Subscription;
  onUpdate: () => void;
}

export default function SubscriptionCard({ subscription, onUpdate }: SubscriptionCardProps) {
  const { smartWalletPubkey } = useWallet();
  const { theme } = useTheme();
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const isDark = theme === 'dark';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'paused':
        return 'text-yellow-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30';
    }
  };

  return (
    <SpotlightCard
      spotlightColor={isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(168, 85, 247, 0.15)'}
      className="h-full"
    >
      <div className="glass-strong p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary-text mb-1">
              {PLAN_NAMES[subscription.planId] || subscription.planId}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold px-2 py-1 rounded border ${getStatusBadge(subscription.status)}`}>
                {subscription.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold gradient-text">{subscription.amount} SOL</div>
            <div className="text-xs text-secondary">per {subscription.interval}</div>
          </div>
        </div>

        <div className="space-y-3 mb-4 flex-1">
          <div className="flex justify-between text-sm">
            <span className="text-secondary">Created:</span>
            <span className="text-primary-text">{formatDate(subscription.createdAt)}</span>
          </div>

          {subscription.status === 'active' && (
            <div className="flex justify-between text-sm mb-4">
              <span className="text-secondary">Next billing:</span>
              <span className="text-primary-text">{formatDate(subscription.nextBillingDate)}</span>
            </div>
          )}

          {subscription.status === 'cancelled' && subscription.cancellationDate && (
            <div className="flex justify-between text-sm mb-4">
              <span className="text-secondary">Cancelled:</span>
              <span className="text-primary-text">{formatDate(subscription.cancellationDate)}</span>
            </div>
          )}

          {subscription.status === 'paused' && subscription.pausedUntil && (
            <div className="flex justify-between text-sm mb-4">
              <span className="text-secondary">Paused until:</span>
              <span className="text-primary-text">{formatDate(subscription.pausedUntil)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-secondary">Payments:</span>
            <span className="text-primary-text">{subscription.paymentHistory.length}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
            className="w-full py-2 px-4 glass rounded-lg text-sm text-primary-text hover:bg-white/10 transition-colors"
          >
            {showPaymentHistory ? 'Hide' : 'View'} Payment History
          </button>

          {showPaymentHistory && (
            <div className="mt-2">
              <SubscriptionPaymentHistory subscription={subscription} />
            </div>
          )}

          <SubscriptionActions
            subscription={subscription}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </SpotlightCard>
  );
}

