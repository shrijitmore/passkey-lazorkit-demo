/**
 * TransferModal Component
 * 
 * Modal component for sending SOL transactions using LazorKit SDK.
 * 
 * This component demonstrates:
 * - Creating transaction instructions
 * - Using signAndSendTransaction() with passkey signing
 * - Handling transaction states (signing, confirming, success, error)
 * - Error handling and user feedback
 * 
 * Key LazorKit Integration:
 * ```tsx
 * const { signAndSendWithRetry } = useTransactionSigning();
 * 
 * // Create instruction
 * const instruction = SystemProgram.transfer({
 *   fromPubkey: smartWalletPubkey,
 *   toPubkey: recipientPubkey,
 *   lamports: amountLamports,
 * });
 * 
 * // Sign and send (passkey signing happens automatically)
 * const signature = await signAndSendWithRetry({
 *   instructions: [instruction],
 *   walletAddress: smartWalletPubkey.toString(),
 * });
 * ```
 * 
 * @see Tutorial 2: Transactions for detailed explanation
 */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';
import { getConnection } from '../lib/rpc/connection';
import { WALLET_EVENTS, dispatchWalletEvent } from '../lib/events/walletEvents';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';
import { parseError } from '../lib/utils/errorHandling';
import { useBalance } from '../contexts/BalanceContext';
import AlertMessage from './ui/AlertMessage';
import TransactionStatus from './ui/TransactionStatus';
import LoadingSpinner from './ui/LoadingSpinner';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (signature: string) => void;
}

type TransactionStatusType = 'idle' | 'signing' | 'confirming' | 'success' | 'error';

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { smartWalletPubkey } = useWallet();
  const { signTransaction } = useTransactionSigning();
  const { balance } = useBalance();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTxStatus('idle');
      setError(null);
      setTxSignature(null);
      setRecipient('');
      setAmount('');
    }
  }, [isOpen]);

  const handleTransfer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!smartWalletPubkey) {
      setError('Wallet not connected');
      return;
    }
    
    setTxStatus('signing');
    setError(null);
    setTxSignature(null);

    try {
      // Validate recipient address
      const recipientPubkey = new PublicKey(recipient);
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      if (amountLamports <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (balance !== null && parseFloat(amount) > balance) {
        throw new Error(`Insufficient balance. You have ${balance.toFixed(4)} SOL but trying to send ${amount} SOL.`);
      }

      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: amountLamports,
      });

      setTxStatus('signing');
      
      // Sign transaction with automatic credential refresh
      const signature = await signTransaction({
        instructions: [instruction],
        onError: (error) => {
          const errorInfo = parseError(error);
          setError(errorInfo.userFriendly || errorInfo.message);
        },
      });

      setTxSignature(signature);
      setTxStatus('confirming');

      const connection = getConnection();
      await connection.confirmTransaction(signature, 'confirmed');

      setTxStatus('success');

      // Dispatch events for automatic updates
      dispatchWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, {
        signature,
        type: 'transfer',
      });
      dispatchWalletEvent(WALLET_EVENTS.BALANCE_UPDATED);
      
      setTimeout(() => {
        onSuccess(signature);
        onClose();
      }, 3000);
    } catch (err: unknown) {
      setTxStatus('error');
      const errorInfo = parseError(err);
      setError(errorInfo.userFriendly || errorInfo.message || 'Transfer failed. Please check the address and amount.');
    }
  }, [smartWalletPubkey, balance, signTransaction, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" data-testid="transfer-modal">
      <div className="glass-strong rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full relative animate-scale-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors z-10"
          data-testid="close-modal-btn"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 gradient-text pr-8">Send SOL</h2>
        
        <form onSubmit={handleTransfer} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="recipient-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-300">
              Amount (SOL)
            </label>
              {balance !== null && (
                <span className="text-xs text-gray-400">
                  Available: {balance.toFixed(4)} SOL
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.001"
              min="0.001"
              max={balance !== null ? balance : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="amount-input"
            />
          </div>

          {/* Error message display */}
          {error && (
            <AlertMessage
              variant="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {/* Transaction info */}
          <div className="glass rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-primary">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">Transaction</span>
            </div>
            <p className="text-xs text-secondary">
              Transaction fees will be paid from your wallet balance. Native SOL transfers use wallet-paid fees.
            </p>
          </div>

          {/* Transaction status display */}
          {(txStatus === 'signing' || txStatus === 'confirming' || txStatus === 'success') && (
            <TransactionStatus
              status={txStatus}
              signature={txSignature || undefined}
            />
          )}

          <button
            type="submit"
            disabled={txStatus !== 'idle' && txStatus !== 'error'}
            className="w-full px-4 sm:px-6 py-3 text-sm sm:text-base gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            data-testid="send-transfer-btn"
          >
            {txStatus === 'signing' && (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                Signing...
              </span>
            )}
            {txStatus === 'confirming' && (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" color="white" />
                Confirming...
              </span>
            )}
            {txStatus === 'success' && (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Success!
              </span>
            )}
            {(txStatus === 'idle' || txStatus === 'error') && 'Send SOL'}
          </button>
        </form>

        <style jsx>{`
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scale-in {
            animation: scale-in 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}