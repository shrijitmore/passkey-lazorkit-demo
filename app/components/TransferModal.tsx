'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (signature: string) => void;
}

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!smartWalletPubkey || !signAndSendTransaction) return;
    
    setIsSending(true);
    setError(null);

    try {
      // Validate recipient address
      const recipientPubkey = new PublicKey(recipient);
      const amountLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      if (amountLamports <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Create transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: amountLamports,
      });

      // Sign and send with gasless transaction via LazorKit
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });

      onSuccess(signature);
      setRecipient('');
      setAmount('');
      onClose();
    } catch (err: unknown) {
      console.error('Transfer failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed. Please check the address and amount.';
      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="transfer-modal">
      <div className="glass-strong rounded-2xl p-6 max-w-md w-full relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          data-testid="close-modal-btn"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 gradient-text">Send SOL</h2>
        
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="recipient-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="amount-input"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg" data-testid="transfer-error">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="glass rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-purple-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">Gasless Transaction</span>
            </div>
            <p className="text-xs text-gray-400">
              No transaction fees! LazorKit&apos;s paymaster will cover the gas costs.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full px-6 py-3 gradient-purple-pink text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            data-testid="send-transfer-btn"
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </span>
            ) : (
              'Send SOL'
            )}
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