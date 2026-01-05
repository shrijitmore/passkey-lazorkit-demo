'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { getConnection } from '../../lib/rpc/connection';
import { getTransactionExplorerUrl } from '../../lib/utils/explorerUrls';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Transaction {
  signature: string;
  timestamp: number;
  type: string;
}

interface TransactionHistoryProps {
  refreshTrigger?: number;
}

export default function TransactionHistory({ refreshTrigger }: TransactionHistoryProps = {}) {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const lastRefreshTriggerRef = useRef<number | undefined>(undefined);
  const lastPubkeyRef = useRef<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!smartWalletPubkey) {
      setTransactions([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const connection = getConnection();
      // Limit to 5 transactions to reduce RPC calls
      // Note: getSignaturesForAddress requires at least 'confirmed' commitment
      const signatures = await connection.getSignaturesForAddress(
        smartWalletPubkey, 
        { limit: 5 },
        'confirmed' // Use 'confirmed' commitment as required by this method
      );
      
      const txs: Transaction[] = signatures.map(sig => ({
        signature: sig.signature,
        timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
        type: sig.err ? 'Failed' : 'Success',
      }));
      
      setTransactions(txs);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      console.error('[TransactionHistory] Error fetching transactions:', err);
      setError(errorMessage);
      // Don't clear existing transactions on error, just show the error
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    const pubkeyString = smartWalletPubkey?.toString() || null;
    const pubkeyChanged = lastPubkeyRef.current !== pubkeyString;
    
    if (isConnected && smartWalletPubkey) {
      // Fetch if first time, pubkey changed, OR if refreshTrigger changed
      const shouldRefresh = !hasFetchedRef.current || pubkeyChanged ||
        (refreshTrigger !== undefined && refreshTrigger !== lastRefreshTriggerRef.current);
      
      if (shouldRefresh) {
        fetchTransactions();
        hasFetchedRef.current = true;
        lastRefreshTriggerRef.current = refreshTrigger;
        lastPubkeyRef.current = pubkeyString;
      }
    } else {
      // Only update if we have transactions to clear (prevent unnecessary re-renders)
      if (transactions.length > 0) {
      setTransactions([]);
      }
      hasFetchedRef.current = false; // Reset when disconnected
      lastRefreshTriggerRef.current = undefined;
      lastPubkeyRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, smartWalletPubkey, refreshTrigger]); // Removed fetchTransactions from deps to prevent loops

  if (!isConnected) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6" data-testid="transaction-history">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-bold gradient-text">Transaction History</h3>
        <button
          onClick={fetchTransactions}
          className="text-sm text-primary hover:text-primary-text transition-colors"
          disabled={isLoading}
          data-testid="refresh-history-btn"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="primary" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 break-words">{error}</p>
          <p className="text-xs text-red-300/70 mt-1">Click refresh to try again</p>
        </div>
      )}

      {transactions.length === 0 && !isLoading ? (
        <div className="text-center py-8" data-testid="no-transactions">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm">No transactions yet</p>
          {smartWalletPubkey && (
            <p className="text-xs text-gray-500 mt-2">
              Wallet: {smartWalletPubkey.toString().substring(0, 8)}...
            </p>
          )}
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="md" color="primary" />
          <p className="text-gray-400 text-sm mt-3">Loading transactions...</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {transactions.map((tx, index) => (
            <a
              key={tx.signature}
              href={getTransactionExplorerUrl(tx.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-dark rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-all card-hover"
              data-testid={`transaction-item-${index}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-1">
                    <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                      tx.type === 'Success' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-gray-300 break-all">
                    {tx.signature}
                  </p>
                </div>
                <svg className="w-4 h-4 text-primary ml-1 sm:ml-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}