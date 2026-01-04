'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { getSubscriptions } from '../lib/subscription/storage';
import { formatDate } from '../lib/subscription/utils';
import type { Subscription } from '../lib/subscription/types';
import SubscriptionCard from './SubscriptionCard';
import { useTheme } from '../contexts/ThemeContext';
import { WALLET_EVENTS, listenWalletEvent } from '../lib/events/walletEvents';

export default function SubscriptionManager() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const { theme } = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const walletAddressString = useMemo(
    () => smartWalletPubkey?.toString() || null,
    [smartWalletPubkey]
  );

  const handleUpdate = useCallback(() => {
    if (walletAddressString) {
      const subs = getSubscriptions(walletAddressString);
      setSubscriptions(subs);
    }
  }, [walletAddressString]);

  const refreshSubscriptions = useCallback(() => {
    if (walletAddressString) {
      setIsLoading(true);
      const subs = getSubscriptions(walletAddressString);
      setSubscriptions(subs);
      setIsLoading(false);
    }
  }, [walletAddressString]);

  useEffect(() => {
    if (isConnected && walletAddressString) {
      refreshSubscriptions();
    } else {
      setSubscriptions([]);
      setIsLoading(false);
    }
  }, [isConnected, walletAddressString, refreshSubscriptions]);

  // Listen for subscription events to auto-refresh
  useEffect(() => {
    if (!isConnected || !walletAddressString) return;

    const unsubscribeCreated = listenWalletEvent(
      WALLET_EVENTS.SUBSCRIPTION_CREATED,
      () => {
        refreshSubscriptions();
      }
    );

    const unsubscribeUpdated = listenWalletEvent(
      WALLET_EVENTS.SUBSCRIPTION_UPDATED,
      () => {
        refreshSubscriptions();
      }
    );

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [isConnected, walletAddressString, refreshSubscriptions]);

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === 'active');
  const cancelledSubscriptions = subscriptions.filter((sub) => sub.status === 'cancelled');
  const pausedSubscriptions = subscriptions.filter((sub) => sub.status === 'paused');

  if (!isConnected) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <p className="text-secondary">Please connect your wallet to view subscriptions</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-secondary mt-4">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto" data-testid="subscription-manager">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-3xl font-bold gradient-text">My Subscriptions</h2>
          {isLoading && subscriptions.length > 0 && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          )}
        </div>
        <p className="text-secondary">
          {isLoading && subscriptions.length > 0 ? 'Updating...' : 'Manage your active subscriptions'}
        </p>
      </div>

      {activeSubscriptions.length === 0 && cancelledSubscriptions.length === 0 && pausedSubscriptions.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <svg
            className="w-16 h-16 text-secondary mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-xl text-secondary mb-2">No subscriptions yet</p>
          <p className="text-sm text-secondary">Subscribe to a plan to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeSubscriptions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary-text">Active Subscriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {pausedSubscriptions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary-text">Paused Subscriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pausedSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {cancelledSubscriptions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-primary-text">Cancelled Subscriptions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cancelledSubscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

