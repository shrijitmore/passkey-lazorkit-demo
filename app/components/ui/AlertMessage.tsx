/**
 * AlertMessage Component
 * 
 * A reusable component for displaying alert messages (error, success, warning, info).
 * Provides consistent styling and behavior across the application.
 * 
 * @example
 * ```tsx
 * <AlertMessage 
 *   variant="error" 
 *   message="Something went wrong" 
 *   onClose={() => setError(null)}
 * />
 * ```
 */

import { X } from 'lucide-react';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

interface AlertMessageProps {
  /**
   * The message text to display
   */
  message: string;
  
  /**
   * The variant/type of alert (determines styling)
   */
  variant: AlertVariant;
  
  /**
   * Optional callback when user clicks close button
   * If provided, a close button will be shown
   */
  onClose?: () => void;
  
  /**
   * Optional action link to display below the message
   */
  actionLink?: {
    href: string;
    text: string;
  };
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get styling classes based on alert variant
 */
function getVariantStyles(variant: AlertVariant): {
  container: string;
  text: string;
  border: string;
} {
  switch (variant) {
    case 'error':
      return {
        container: 'bg-destructive/10',
        text: 'text-destructive',
        border: 'border-destructive/50',
      };
    case 'success':
      return {
        container: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/50',
      };
    case 'warning':
      return {
        container: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
      };
    case 'info':
      return {
        container: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/50',
      };
  }
}

export default function AlertMessage({
  message,
  variant,
  onClose,
  actionLink,
  className = '',
}: AlertMessageProps) {
  const styles = getVariantStyles(variant);

  return (
    <div
      className={`mb-4 sm:mb-6 rounded-lg border ${styles.border} ${styles.container} p-3 sm:p-4 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Message content */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm ${styles.text} break-words whitespace-pre-line`}>
            {message}
          </p>
          
          {/* Optional action link */}
          {actionLink && (
            <a
              href={actionLink.href}
              className={`mt-2 inline-block text-xs ${variant === 'success' ? 'text-blue-400' : styles.text} underline hover:opacity-80 transition-opacity`}
            >
              {actionLink.text} →
            </a>
          )}
        </div>

        {/* Close button (only shown if onClose is provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors ${styles.text} opacity-70 hover:opacity-100`}
            aria-label="Close alert"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

