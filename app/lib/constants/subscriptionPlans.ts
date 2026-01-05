/**
 * Subscription plan constants
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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
] as const;

