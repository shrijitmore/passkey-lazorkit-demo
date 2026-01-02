'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  SystemProgram,
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
} from '@solana/web3.js';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (signature: string) => void;
}

// Transaction status for UI feedback
type TransactionStatus = 'idle' | 'signing' | 'sending' | 'confirming' | 'success' | 'error';

const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_BASE_URL = 'https://explorer.solana.com/tx';

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch balance when modal opens
  useEffect(() => {
    if (isOpen && smartWalletPubkey) {
      const fetchBalance = async () => {
        try {
          const connection = new Connection(RPC_URL, 'confirmed');
          const balance = await connection.getBalance(smartWalletPubkey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (err) {
          // Silently handle balance fetch errors
        }
      };
      fetchBalance();
    }
    // Reset state when modal opens
    if (isOpen) {
      setTxStatus('idle');
      setError(null);
      setTxSignature(null);
    }
  }, [isOpen, smartWalletPubkey]);

  const handleTransfer = async (e: React.FormEvent) => {
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

      // Check balance if available
      if (balance !== null && parseFloat(amount) > balance) {
        throw new Error(`Insufficient balance. You have ${balance.toFixed(4)} SOL but trying to send ${amount} SOL.`);
      }

      // Create transfer instruction
      // This is a native SOL transfer using SystemProgram.transfer
      // The wallet will pay transaction fees from its balance
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: amountLamports,
      });

      // Sign and send transaction with LazorKit
      // Paymaster is configured and will attempt to sponsor the transaction
      if (!signAndSendTransaction) {
        throw new Error('Signing function not available');
      }
      
      // Sign transaction with passkey (triggers WebAuthn biometric prompt)
      setTxStatus('signing');
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });
      
      setTxSignature(signature);
      setTxStatus('confirming');

      // Wait for transaction confirmation
      const connection = new Connection(RPC_URL, 'confirmed');
      await connection.confirmTransaction(signature, 'confirmed');

      setTxStatus('success');
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onSuccess(signature);
        setRecipient('');
        setAmount('');
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setTxStatus('error');
      let errorMessage = 'Transfer failed. Please check the address and amount.';
      
      const errorObj = err as { message?: string; name?: string; cause?: any };
      
      if (errorObj?.message?.includes('TLS certificate') || errorObj?.message?.includes('certificate errors') || errorObj?.message?.includes('WebAuthn is not supported')) {
        errorMessage = '❌ WebAuthn requires HTTPS or localhost!\n\nCurrent issue: TLS certificate error\n\nSolutions:\n1. Use localhost: http://localhost:3000 (recommended for dev)\n2. Enable HTTPS: Run "npm run dev:https" then use https://localhost:3000\n3. Deploy to HTTPS: Use Vercel/Netlify for production\n\nQuick fix: Make sure you\'re accessing via localhost, not 127.0.0.1 or an IP address';
      } else if (errorObj?.message?.includes('Signing failed') || errorObj?.message?.includes('signing')) {
        errorMessage = 'Transaction signing failed after clicking "Approve".\n\nWhat should happen:\n1. You see "Review Transaction" modal ✅\n2. You click "Approve" ✅\n3. Biometric prompt appears (Face ID/Touch ID/Windows Hello) ❌ NOT APPEARING\n4. You approve the prompt\n5. Transaction completes\n\nPossible causes:\n• Passkey may not be properly configured for transaction signing\n• Browser may be blocking the biometric prompt\n• LazorKit SDK may need re-initialization\n\nTry these fixes:\n1. Disconnect wallet and reconnect (this recreates passkey)\n2. Check browser console (F12) for detailed errors\n3. Try a different browser (Chrome, Firefox, Edge)\n4. Clear browser cache and cookies\n5. Ensure you\'re on HTTPS or localhost\n6. Check if WebAuthn is enabled: Open console and type: window.PublicKeyCredential';
      } else if (errorObj?.message?.includes('timeout') || errorObj?.message?.includes('Signing timeout')) {
        errorMessage = 'Signing timeout: No biometric prompt appeared.\n\nThis means the passkey signing isn\'t triggering.\n\nTry:\n1. Disconnect and reconnect your wallet\n2. Check browser console (F12) for errors\n3. Verify passkey was created: Check if you saw a biometric prompt when connecting\n4. Try a different browser\n5. Contact LazorKit support if issue persists';
      } else if (errorObj?.message?.includes('NotAllowedError') || errorObj?.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was canceled. Please try again and approve the prompt when it appears.';
      } else if (errorObj?.message?.includes('User cancelled') || errorObj?.message?.includes('canceled')) {
        errorMessage = 'You canceled the authentication. Please try again and approve the biometric prompt.';
      } else if (errorObj?.message?.includes('custom program error: 0x2') || errorObj?.message?.includes('InsufficientFunds') || errorObj?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds error (0x2).\n\nThis usually means:\n• Smart wallet may not be initialized yet\n• Balance might be locked or reserved\n• Transaction needs more SOL than available (including fees)\n\nTry:\n• Verify balance on Solana Explorer\n• Try sending a smaller amount (0.01 SOL)\n• Make sure you funded the correct wallet address\n• The smart wallet might need initialization - try disconnecting and reconnecting';
      } else if (errorObj?.message?.includes('simulation failed') || errorObj?.message?.includes('Transaction simulation')) {
        errorMessage = 'Transaction simulation failed.\n\nThis means the transaction would fail on-chain.\n\nCommon causes:\n• Insufficient balance (including fees)\n• Invalid recipient address\n• Network issues\n\nTry:\n• Check your balance\n• Verify the recipient address is valid\n• Try a smaller amount\n• Wait a moment and try again';
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      }
      
      setError(errorMessage);
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="amount-input"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg" data-testid="transfer-error">
              <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Gasless transaction info */}
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

          {/* Transaction status indicators */}
          {txStatus === 'signing' && (
            <div className="glass rounded-lg p-4 border-2 border-yellow-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-yellow-400 mb-1">Signing Transaction</p>
                  <p className="text-xs text-gray-300">
                    A biometric prompt (Face ID, Touch ID, or Windows Hello) should appear. Please approve it to sign the transaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {txStatus === 'confirming' && (
            <div className="glass rounded-lg p-4 border-2 border-blue-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-1">Confirming Transaction</p>
                  <p className="text-xs text-gray-300">
                    Waiting for on-chain confirmation. This usually takes a few seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {txStatus === 'success' && txSignature && (
            <div className="glass rounded-lg p-4 border-2 border-green-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400 mb-2">Transaction Successful!</p>
                  <p className="text-xs text-gray-300 mb-2">
                    Your transaction has been confirmed on-chain. Transaction fees were paid by your wallet.
                  </p>
                  <a
                    href={`${EXPLORER_BASE_URL}/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                  >
                    View on Solana Explorer
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={txStatus !== 'idle' && txStatus !== 'error'}
            className="w-full px-6 py-3 gradient-purple-pink text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            data-testid="send-transfer-btn"
          >
            {txStatus === 'signing' && (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Signing...
              </span>
            )}
            {txStatus === 'confirming' && (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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