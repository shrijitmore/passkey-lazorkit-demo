/**
 * Error Recovery Component
 * 
 * Displays recovery options when transaction size errors are detected.
 * Provides one-click recovery that clears cache and reconnects the wallet.
 */

'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { AlertCircle, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import LoadingSpinner from './LoadingSpinner';
import { attemptAutoRecovery, type RecoveryResult } from '../../lib/utils/passkeyRecovery';
import type { ErrorInfo } from '../../lib/utils/errorHandling';

interface ErrorRecoveryProps {
  /**
   * The error information to display
   */
  errorInfo: ErrorInfo;

  /**
   * Optional callback when recovery is successful
   */
  onRecoverySuccess?: () => void;

  /**
   * Optional callback to retry the failed transaction after recovery
   */
  onRetry?: () => Promise<void>;

  /**
   * Optional callback when recovery is dismissed
   */
  onDismiss?: () => void;

  /**
   * Whether to show the recovery component
   */
  show: boolean;
}

/**
 * Error Recovery Component
 * 
 * Provides automatic recovery from passkey cache issues that cause
 * transaction size errors. Users can click "Clear Cache & Retry" to
 * automatically disconnect, clear caches, reconnect, and optionally
 * retry the failed transaction.
 * 
 * @example
 * ```tsx
 * <ErrorRecovery
 *   errorInfo={errorInfo}
 *   show={errorInfo.code === 'TRANSACTION_TOO_LARGE'}
 *   onRecoverySuccess={() => console.log('Recovery successful')}
 *   onRetry={async () => await retryTransaction()}
 *   onDismiss={() => setShowRecovery(false)}
 * />
 * ```
 */
export default function ErrorRecovery({
  errorInfo,
  onRecoverySuccess,
  onRetry,
  onDismiss,
  show,
}: ErrorRecoveryProps) {
  const { disconnect, connect, smartWalletPubkey } = useWallet();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRecovery = useCallback(async () => {
    if (!disconnect || !connect) {
      return;
    }

    setIsRecovering(true);
    setRecoveryResult(null);

    try {
      const result = await attemptAutoRecovery(
        disconnect,
        connect,
        smartWalletPubkey?.toString()
      );

      setRecoveryResult(result);
      setIsRecovering(false);

      if (result.success) {
        onRecoverySuccess?.();
        
        // Auto-retry if onRetry is provided
        if (onRetry) {
          setIsRetrying(true);
          try {
            await onRetry();
          } catch (retryError) {
            console.error('[ErrorRecovery] Retry failed:', retryError);
          } finally {
            setIsRetrying(false);
          }
        }
      }
    } catch (error) {
      setRecoveryResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Recovery failed. Please try disconnecting and reconnecting manually.',
      });
      setIsRecovering(false);
    }
  }, [disconnect, connect, smartWalletPubkey, onRecoverySuccess, onRetry]);

  if (!show || !errorInfo.recoverable) {
    return null;
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <CardTitle className="text-yellow-500">Recovery Available</CardTitle>
              <CardDescription className="text-yellow-500/80 mt-1">
                This error can be automatically fixed
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            This error is likely caused by passkey cache inconsistencies. We can automatically clear the cache and reconnect your wallet.
          </p>
        </div>

        {recoveryResult && (
          <div
            className={`p-3 rounded-lg ${
              recoveryResult.success
                ? 'bg-green-500/10 border border-green-500/50'
                : 'bg-red-500/10 border border-red-500/50'
            }`}
          >
            <div className="flex items-start gap-2">
              {recoveryResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    recoveryResult.success ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {recoveryResult.message}
                </p>
                {recoveryResult.error && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {recoveryResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRecovery}
            disabled={isRecovering || isRetrying}
            className="flex-1"
            variant="default"
          >
            {isRecovering ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Recovering...
              </>
            ) : isRetrying ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Retrying Transaction...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache & Retry
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <p className="font-semibold mb-1">What this does:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Clears all application caches</li>
            <li>Disconnects your wallet</li>
            <li>Reconnects your wallet with fresh credentials</li>
            {onRetry && <li>Retries your transaction</li>}
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

