'use client';

import AppLayout from '../components/layout/AppLayout';
import SubscriptionDemo from '../components/SubscriptionDemo';
import SubscriptionManager from '../components/SubscriptionManager';

export default function SubscriptionPage() {
  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6 md:mb-8 px-4 sm:px-0">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Manage your subscription plans and billing</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        <SubscriptionDemo />
        <SubscriptionManager />
      </div>
    </AppLayout>
  );
}
