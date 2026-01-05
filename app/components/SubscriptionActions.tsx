'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { updateSubscription, getSubscriptions } from '../lib/subscription/storage';
import { calculateNextBillingDate } from '../lib/subscription/utils';
import type { Subscription, SubscriptionPlanId } from '../lib/subscription/types';
import { WALLET_EVENTS, dispatchWalletEvent } from '../lib/events/walletEvents';
import AlertMessage from './ui/AlertMessage';
import LoadingSpinner from './ui/LoadingSpinner';

const PLAN_NAMES: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

interface SubscriptionActionsProps {
  subscription: Subscription;
  onUpdate: () => void;
}

export default function SubscriptionActions({ subscription, onUpdate }: SubscriptionActionsProps) {
  const { smartWalletPubkey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    if (!confirm(`Are you sure you want to cancel your ${PLAN_NAMES[subscription.planId]} subscription?`)) {
      return;
    }

    if (!smartWalletPubkey) return;

    setIsProcessing(true);
    setError(null);

    try {
      updateSubscription(smartWalletPubkey.toString(), subscription.id, {
        status: 'cancelled',
        cancellationDate: Date.now(),
      });
      dispatchWalletEvent(WALLET_EVENTS.SUBSCRIPTION_UPDATED, {
        subscriptionId: subscription.id,
        action: 'cancelled',
      });
      onUpdate();
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePause = () => {
    if (!smartWalletPubkey) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pausedUntil = calculateNextBillingDate(Date.now());
      updateSubscription(smartWalletPubkey.toString(), subscription.id, {
        status: 'paused',
        pausedUntil,
      });
      dispatchWalletEvent(WALLET_EVENTS.SUBSCRIPTION_UPDATED, {
        subscriptionId: subscription.id,
        action: 'paused',
      });
      onUpdate();
    } catch (err) {
      setError('Failed to pause subscription');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResume = () => {
    if (!smartWalletPubkey) return;

    setIsProcessing(true);
    setError(null);

    try {
      const nextBillingDate = calculateNextBillingDate(Date.now());
      updateSubscription(smartWalletPubkey.toString(), subscription.id, {
        status: 'active',
        pausedUntil: undefined,
        nextBillingDate,
      });
      dispatchWalletEvent(WALLET_EVENTS.SUBSCRIPTION_UPDATED, {
        subscriptionId: subscription.id,
        action: 'resumed',
      });
      onUpdate();
    } catch (err) {
      setError('Failed to resume subscription');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = (newPlanId: SubscriptionPlanId) => {
    if (!smartWalletPubkey) return;

    if (!confirm(`Upgrade from ${PLAN_NAMES[subscription.planId]} to ${PLAN_NAMES[newPlanId]}?`)) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // In a real implementation, you'd create a new subscription and cancel the old one
      // For this demo, we'll just update the plan
      updateSubscription(smartWalletPubkey.toString(), subscription.id, {
        planId: newPlanId,
      });
      onUpdate();
    } catch (err) {
      setError('Failed to upgrade subscription');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Error message display */}
      {error && (
        <AlertMessage
          variant="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {subscription.status === 'active' && (
        <>
          <button
            onClick={handlePause}
            disabled={isProcessing}
            className="w-full py-2 px-4 glass rounded-lg text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" color="yellow" />
                Processing...
              </>
            ) : (
              'Pause Subscription'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full py-2 px-4 glass rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size="sm" color="gray" />
                Processing...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </button>
        </>
      )}

      {subscription.status === 'paused' && (
        <button
          onClick={handleResume}
          disabled={isProcessing}
          className="w-full py-2 px-4 glass rounded-lg text-sm text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner size="sm" color="gray" />
              Processing...
            </>
          ) : (
            'Resume Subscription'
          )}
        </button>
      )}

      {subscription.status === 'cancelled' && (
        <p className="text-xs text-secondary text-center">This subscription has been cancelled</p>
      )}
    </div>
  );
}

