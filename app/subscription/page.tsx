'use client';

import AppLayout from '../components/layout/AppLayout';
import SubscriptionDemo from '../components/SubscriptionDemo';
import SubscriptionManager from '../components/SubscriptionManager';

export default function SubscriptionPage() {
  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Subscriptions</h1>
        <p className="text-sm text-muted-foreground md:text-base">Manage your subscription plans and billing</p>
      </div>

      <div className="space-y-8">
        <SubscriptionDemo />
        <SubscriptionManager />
      </div>
    </AppLayout>
  );
}
