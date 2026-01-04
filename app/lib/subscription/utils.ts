import { Subscription, PaymentRecord } from './types';

export function calculateNextBillingDate(currentDate: number, interval: 'month' = 'month'): number {
  const date = new Date(currentDate);
  if (interval === 'month') {
    date.setMonth(date.getMonth() + 1);
  }
  return date.getTime();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isBillingDue(subscription: Subscription): boolean {
  return Date.now() >= subscription.nextBillingDate && subscription.status === 'active';
}

export function generateSubscriptionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function addPaymentRecord(
  subscription: Subscription,
  payment: Omit<PaymentRecord, 'id' | 'subscriptionId'>
): Subscription {
  const paymentRecord: PaymentRecord = {
    id: generatePaymentId(),
    subscriptionId: subscription.id,
    ...payment,
  };
  
  return {
    ...subscription,
    paymentHistory: [...subscription.paymentHistory, paymentRecord],
    nextBillingDate: calculateNextBillingDate(Date.now()),
  };
}

