'use client';

import type { Subscription } from '../lib/subscription/types';
import { formatDateTime } from '../lib/subscription/utils';

const EXPLORER_BASE_URL = 'https://explorer.solana.com';

interface SubscriptionPaymentHistoryProps {
  subscription: Subscription;
}

export default function SubscriptionPaymentHistory({ subscription }: SubscriptionPaymentHistoryProps) {
  if (subscription.paymentHistory.length === 0) {
    return (
      <div className="glass rounded-lg p-4 text-center text-sm text-secondary">
        No payment history yet
      </div>
    );
  }

  return (
    <div className="glass rounded-lg p-4 max-h-64 overflow-y-auto">
      <h4 className="text-sm font-semibold text-primary-text mb-3">Payment History</h4>
      <div className="space-y-2">
        {subscription.paymentHistory
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-2 glass rounded text-xs"
            >
              <div>
                <div className="text-primary-text font-medium">
                  {payment.amount} SOL
                </div>
                <div className="text-secondary">{formatDateTime(payment.timestamp)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    payment.status === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {payment.status}
                </span>
                <a
                  href={`${EXPLORER_BASE_URL}/tx/${payment.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

