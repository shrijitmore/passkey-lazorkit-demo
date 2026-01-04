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

