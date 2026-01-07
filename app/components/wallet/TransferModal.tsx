/**
 * TransferModal Component
 * 
 * Modal component for sending SOL and SPL Token transactions using LazorKit SDK.
 * 
 * This component demonstrates:
 * - Creating transaction instructions for Native SOL and SPL Tokens
 * - Using signAndSendTransaction() with passkey signing
 * - Handling transaction states (signing, confirming, success, error)
 * - Error handling and user feedback
 * - Automatic ATA (Associated Token Account) creation for recipients
 * 
 * Key LazorKit Integration:
 * ```tsx
 * const { signTransaction } = useTransactionSigning();
 * 
 * // For SPL Tokens (USDC):
 * // 1. Check/Create recipient's token account
 * // 2. Create transfer instruction
 * // 3. Batch instructions in one atomic transaction
 * const txSignature = await signTransaction({
 *   instructions: [createAtaIx, transferIx],
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
  TransactionInstruction,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getConnection } from '../../lib/rpc/connection';
import { WALLET_EVENTS, dispatchWalletEvent } from '../../lib/events/walletEvents';
import { useTransactionSigning } from '../../lib/hooks/useTransactionSigning';
import { parseError } from '../../lib/utils/errorHandling';
import { useBalance } from '../../contexts/BalanceContext';
import { TOKENS } from '../../lib/constants/tokens';
import { getOrCreateAssociatedTokenAccountInstruction, createSPLTransferInstruction } from '../../lib/utils/tokenUtils';
import AlertMessage from '../ui/AlertMessage';
import TransactionStatus from '../ui/TransactionStatus';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorRecovery from '../ui/ErrorRecovery';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (signature: string) => void;
}

type TransactionStatusType = 'idle' | 'signing' | 'confirming' | 'success' | 'error';
type TokenType = 'SOL' | 'USDC';

export default function TransferModal({ isOpen, onClose, onSuccess }: TransferModalProps) {
  const { smartWalletPubkey } = useWallet();
  const { signTransaction } = useTransactionSigning();
  const { balance } = useBalance();

  const [tokenType, setTokenType] = useState<TokenType>('SOL');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txStatus, setTxStatus] = useState<TransactionStatusType>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<ReturnType<typeof parseError> | null>(null);

  // Token balance state
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingUsdc, setIsLoadingUsdc] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTxStatus('idle');
      setError(null);
      setTxSignature(null);
      setRecipient('');
      setAmount('');
      setTokenType('SOL');
      fetchUsdcBalance();
    }
  }, [isOpen]);

  // Fetch USDC Balance
  const fetchUsdcBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingUsdc(true);
    try {
      const connection = getConnection();
      const usdcMint = new PublicKey(TOKENS.USDC.mint);

      const { value: accounts } = await connection.getParsedTokenAccountsByOwner(
        smartWalletPubkey,
        { mint: usdcMint }
      );

      if (accounts.length > 0) {
        const balance = accounts[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
        setUsdcBalance(balance);
      } else {
        setUsdcBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch USDC balance:', err);
      // Don't set error state here, just show 0 balance
      setUsdcBalance(0);
    } finally {
      setIsLoadingUsdc(false);
    }
  }, [smartWalletPubkey]);

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
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipient);
      } catch {
        throw new Error('Invalid recipient address');
      }

      const amountVal = parseFloat(amount);
      if (isNaN(amountVal) || amountVal <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const instructions: TransactionInstruction[] = [];
      const connection = getConnection();

      if (tokenType === 'SOL') {
        // Native SOL Transfer
        if (balance !== null && amountVal > balance) {
          throw new Error(`Insufficient SOL balance. Available: ${balance.toFixed(4)} SOL`);
        }

        const lamports = Math.floor(amountVal * LAMPORTS_PER_SOL);
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: smartWalletPubkey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );
      } else {
        // USDC Transfer (SPL Token)
        if (usdcBalance !== null && amountVal > usdcBalance) {
          throw new Error(`Insufficient USDC balance. Available: ${usdcBalance} USDC`);
        }

        const usdcMint = new PublicKey(TOKENS.USDC.mint);

        // 1. Get Sender ATA
        const { address: senderAta, instruction: createSenderAtaIx } =
          await getOrCreateAssociatedTokenAccountInstruction(
            connection,
            usdcMint,
            smartWalletPubkey,
            smartWalletPubkey // payer
          );

        // Sender should ideally already have an account if they have balance, 
        // but safe to include logic or handle accordingly.
        // Lazy: We assume if balance > 0, account exists.

        // 2. Get Recipient ATA - and create if needed!
        const { address: recipientAta, instruction: createRecipientAtaIx } =
          await getOrCreateAssociatedTokenAccountInstruction(
            connection,
            usdcMint,
            recipientPubkey,
            smartWalletPubkey // payer: Sender pays for ATA creation (rent)
          );

        if (createRecipientAtaIx) {
          instructions.push(createRecipientAtaIx);
        }

        // 3. Create Transfer Instruction
        instructions.push(
          createSPLTransferInstruction(
            senderAta,
            recipientAta,
            smartWalletPubkey,
            amountVal,
            TOKENS.USDC.decimals
          )
        );
      }

      setTxStatus('signing');

      // Sign transaction with automatic credential refresh
      const signature = await signTransaction({
        instructions,
        onError: (error) => {
          const parsedError = parseError(error);
          setErrorInfo(parsedError);
          setError(parsedError.userFriendly || parsedError.message);
        },
      });

      setTxSignature(signature);
      setTxStatus('confirming');

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
      const parsedError = parseError(err);
      setErrorInfo(parsedError);
      setError(parsedError.userFriendly || parsedError.message || 'Transfer failed. Check address and balance.');
    }
  }, [smartWalletPubkey, balance, usdcBalance, signTransaction, onSuccess, onClose, tokenType, recipient, amount]);

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

        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 gradient-text">Send Assets</h2>

        {/* Token Selector */}
        <div className="flex p-1 bg-white/5 rounded-lg mb-6">
          <button
            onClick={() => setTokenType('SOL')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tokenType === 'SOL'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            SOL
          </button>
          <button
            onClick={() => setTokenType('USDC')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${tokenType === 'USDC'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            USDC
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-bold border border-green-500/30">
              GASLESS
            </span>
          </button>
        </div>

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
                Amount ({tokenType})
              </label>
              <div className="text-xs text-gray-400">
                {tokenType === 'SOL' ? (
                  <span>Available: {balance !== null ? balance.toFixed(4) : '...'} SOL</span>
                ) : (
                  <span className="flex items-center gap-1">
                    Available: {isLoadingUsdc ? <LoadingSpinner size="sm" /> : usdcBalance ?? '0'} USDC
                  </span>
                )}
              </div>
            </div>
            <input
              type="number"
              step={tokenType === 'SOL' ? "0.001" : "0.000001"}
              min={tokenType === 'SOL' ? "0.001" : "0.000001"}
              max={
                tokenType === 'SOL'
                  ? (balance ?? undefined)
                  : (usdcBalance ?? undefined)
              }
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={tokenType === 'SOL' ? "0.1" : "10.00"}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white/5 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
              required
              data-testid="amount-input"
            />
          </div>

          {/* USDC Faucet Hint */}
          {tokenType === 'USDC' && (usdcBalance === 0 || usdcBalance === null) && !isLoadingUsdc && (
            <div className="text-xs text-center p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300">
              Need Devnet USDC? <a href="https://spl-token-faucet.com/?token-name=USDC-Devnet" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">Get some here</a> to test gasless transfers!
            </div>
          )}

          {/* Error message display */}
          {error && (
            <AlertMessage
              variant="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {/* Error recovery component */}
          {errorInfo && (
            <ErrorRecovery
              errorInfo={errorInfo}
              show={errorInfo.recoverable === true && txStatus === 'error'}
              onRecoverySuccess={() => {
                setError(null);
                setErrorInfo(null);
              }}
              onRetry={async () => {
                // Simple reset for now
                setError(null);
                setErrorInfo(null);
              }}
              onDismiss={() => {
                setErrorInfo(null);
              }}
            />
          )}

          {/* Transaction info */}
          <div className="glass rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-primary">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">Transaction Fee</span>
            </div>
            {tokenType === 'SOL' ? (
              <p className="text-xs text-secondary">
                Native SOL transfers typically use wallet-paid fees (approx 0.000005 SOL).
              </p>
            ) : (
              <p className="text-xs text-green-400 font-medium">
                ✨ Sponsored by Paymaster (Gasless)
              </p>
            )}
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
            className={`w-full px-4 sm:px-6 py-3 text-sm sm:text-base text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow ${tokenType === 'SOL'
                ? 'gradient-primary'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
              }`}
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
            {(txStatus === 'idle' || txStatus === 'error') && `Send ${tokenType}`}
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