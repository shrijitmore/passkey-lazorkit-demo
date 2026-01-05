/**
 * BalanceDisplay Component
 * 
 * A reusable component for displaying wallet balance with loading state.
 * Supports optional refresh button and USD equivalent display.
 * 
 * @example
 * ```tsx
 * <BalanceDisplay 
 *   balance={1.5} 
 *   isLoading={false}
 *   showRefresh={true}
 *   onRefresh={refreshBalance}
 *   usdEquivalent="225.00"
 * />
 * ```
 */

import { RefreshCw } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface BalanceDisplayProps {
  /**
   * Current balance in SOL (null if not loaded)
   */
  balance: number | null;
  
  /**
   * Whether balance is currently loading
   */
  isLoading: boolean;
  
  /**
   * Show refresh button (default: false)
   */
  showRefresh?: boolean;
  
  /**
   * Callback when refresh button is clicked
   */
  onRefresh?: () => void;
  
  /**
   * USD equivalent to display (optional)
   */
  usdEquivalent?: string;
  
  /**
   * Number of decimal places to show (default: 4)
   */
  decimals?: number;
  
  /**
   * Show loading spinner when balance is null (default: true)
   */
  showLoadingWhenNull?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Size variant for the balance display
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Get size-specific classes
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): {
  balance: string;
  label: string;
} {
  switch (size) {
    case 'sm':
      return {
        balance: 'text-lg sm:text-xl',
        label: 'text-xs',
      };
    case 'md':
      return {
        balance: 'text-xl sm:text-2xl',
        label: 'text-xs sm:text-sm',
      };
    case 'lg':
      return {
        balance: 'text-2xl sm:text-3xl md:text-4xl',
        label: 'text-sm sm:text-base',
      };
  }
}

export default function BalanceDisplay({
  balance,
  isLoading,
  showRefresh = false,
  onRefresh,
  usdEquivalent,
  decimals = 4,
  showLoadingWhenNull = true,
  className = '',
  size = 'md',
}: BalanceDisplayProps) {
  const sizeClasses = getSizeClasses(size);
  const displayBalance = balance !== null ? balance.toFixed(decimals) : '0.'.padEnd(decimals + 2, '0');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Balance value */}
      <div className="flex-1 min-w-0">
        {isLoading && balance === null && showLoadingWhenNull ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className={`font-bold text-foreground ${sizeClasses.balance}`}>
              {displayBalance}
            </span>
          </div>
        ) : (
          <div>
            <span className={`font-bold text-foreground ${sizeClasses.balance}`}>
              {displayBalance} SOL
            </span>
            {usdEquivalent && (
              <p className={`text-muted-foreground mt-1 ${sizeClasses.label}`}>
                ≈ ${usdEquivalent} USD
              </p>
            )}
          </div>
        )}
      </div>

      {/* Refresh button */}
      {showRefresh && onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh balance"
          aria-label="Refresh balance"
          type="button"
        >
          <RefreshCw
            className={`h-4 w-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      )}
    </div>
  );
}

