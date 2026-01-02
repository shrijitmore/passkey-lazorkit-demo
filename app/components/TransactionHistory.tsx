'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection } from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_URL = 'https://explorer.solana.com';

interface Transaction {
  signature: string;
  timestamp: number;
  type: string;
}

interface TransactionHistoryProps {
  refreshTrigger?: number; // Increment this to trigger a refresh
}

export default function TransactionHistory({ refreshTrigger }: TransactionHistoryProps = {}) {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false); // Cache: only fetch once per wallet connection
  const lastRefreshTriggerRef = useRef<number | undefined>(undefined);

  const fetchTransactions = useCallback(async () => {
    if (!smartWalletPubkey) return;
    
    setIsLoading(true);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      // Limit to 5 transactions to reduce RPC calls
      const signatures = await connection.getSignaturesForAddress(smartWalletPubkey, { limit: 5 });
      
      const txs: Transaction[] = signatures.map(sig => ({
        signature: sig.signature,
        timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
        type: sig.err ? 'Failed' : 'Success',
      }));
      
      setTransactions(txs);
    } catch (err: unknown) {
      console.error('Failed to fetch transactions:', err);
      // Don't show error to user for rate limiting - it's expected on public RPC
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('429') || message.includes('rate limit')) {
        console.warn('RPC rate limited - this is normal on public Devnet RPC. Consider using a private RPC provider.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      // Fetch if first time OR if refreshTrigger changed
      const shouldRefresh = !hasFetchedRef.current || 
        (refreshTrigger !== undefined && refreshTrigger !== lastRefreshTriggerRef.current);
      
      if (shouldRefresh) {
        fetchTransactions();
        hasFetchedRef.current = true;
        lastRefreshTriggerRef.current = refreshTrigger;
      }
    } else {
      setTransactions([]);
      hasFetchedRef.current = false; // Reset when disconnected
      lastRefreshTriggerRef.current = undefined;
    }
  }, [isConnected, smartWalletPubkey, refreshTrigger, fetchTransactions]);

  if (!isConnected) return null;

  return (
    <div className="glass rounded-2xl p-6" data-testid="transaction-history">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold gradient-text">Transaction History</h3>
        <button
          onClick={fetchTransactions}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          disabled={isLoading}
          data-testid="refresh-history-btn"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8" data-testid="no-transactions">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, index) => (
            <a
              key={tx.signature}
              href={`${EXPLORER_URL}/tx/${tx.signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-dark rounded-lg p-4 hover:border-purple-500/50 transition-all card-hover"
              data-testid={`transaction-item-${index}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${
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
                  <p className="text-sm font-mono text-gray-300 truncate">
                    {tx.signature}
                  </p>
                </div>
                <svg className="w-4 h-4 text-purple-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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