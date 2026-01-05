/**
 * TransactionStatus Component
 * 
 * Displays transaction status with appropriate styling and messages.
 * Shows different states: signing, confirming, success, and error.
 * 
 * @example
 * ```tsx
 * <TransactionStatus 
 *   status="signing" 
 *   message="Please approve the biometric prompt"
 * />
 * <TransactionStatus 
 *   status="success" 
 *   signature={txSignature}
 * />
 * ```
 */

import { Check, ExternalLink } from 'lucide-react';
import { getTransactionExplorerUrl } from '../../lib/utils/explorerUrls';

export type TransactionStatusType = 'signing' | 'confirming' | 'success' | 'error';

interface TransactionStatusProps {
  /**
   * Current transaction status
   */
  status: TransactionStatusType;
  
  /**
   * Transaction signature (required for success status)
   */
  signature?: string;
  
  /**
   * Optional custom message to display
   */
  message?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get status-specific configuration
 */
function getStatusConfig(status: TransactionStatusType): {
  icon: React.ReactNode;
  title: string;
  defaultMessage: string;
  containerClass: string;
  textClass: string;
  iconClass: string;
} {
  switch (status) {
    case 'signing':
      return {
        icon: (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        title: 'Signing Transaction',
        defaultMessage:
          'A biometric prompt (Face ID, Touch ID, or Windows Hello) should appear. Please approve it to sign the transaction.',
        containerClass: 'border-2 border-yellow-500/30',
        textClass: 'text-yellow-400',
        iconClass: 'text-yellow-400',
      };
    case 'confirming':
      return {
        icon: (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        title: 'Confirming Transaction',
        defaultMessage: 'Waiting for on-chain confirmation. This usually takes a few seconds.',
        containerClass: 'border-2 border-blue-500/30',
        textClass: 'text-blue-400',
        iconClass: 'text-blue-400',
      };
    case 'success':
      return {
        icon: (
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
        ),
        title: 'Transaction Successful!',
        defaultMessage:
          'Your transaction has been confirmed on-chain. Transaction fees were paid by your wallet.',
        containerClass: 'border-2 border-green-500/30',
        textClass: 'text-green-400',
        iconClass: 'text-green-400',
      };
    case 'error':
      return {
        icon: (
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        title: 'Transaction Failed',
        defaultMessage: 'The transaction could not be completed. Please try again.',
        containerClass: 'border-2 border-red-500/30',
        textClass: 'text-red-400',
        iconClass: 'text-red-400',
      };
  }
}

export default function TransactionStatus({
  status,
  signature,
  message,
  className = '',
}: TransactionStatusProps) {
  const config = getStatusConfig(status);
  const displayMessage = message || config.defaultMessage;
  const explorerUrl = signature && status === 'success' 
    ? getTransactionExplorerUrl(signature) 
    : null;

  return (
    <div
      className={`glass rounded-lg p-3 sm:p-4 ${config.containerClass} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Status icon */}
        {config.icon}

        {/* Status content */}
        <div className="flex-1">
          <p className={`text-xs sm:text-sm font-semibold ${config.textClass} mb-1`}>
            {config.title}
          </p>
          <p className="text-xs text-gray-300 mb-1.5 sm:mb-2">{displayMessage}</p>

          {/* Explorer link (only for successful transactions with signature) */}
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1 break-all"
            >
              View on Solana Explorer
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

