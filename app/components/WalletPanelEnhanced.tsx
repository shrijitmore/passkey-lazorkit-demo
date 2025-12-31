'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import TransferModal from './TransferModal';
import TransactionHistory from './TransactionHistory';

const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_URL = 'https://explorer.solana.com';
const FAUCET_URL = 'https://faucet.solana.com';

export default function WalletPanelEnhanced() {
  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const connection = new Connection(RPC_URL, 'confirmed');

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
      // Poll balance every 5 seconds
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
      setLastTxSignature(null);
      setShowSuccess(false);
    }
  }, [isConnected, smartWalletPubkey]);

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingBalance(true);
    try {
      const balance = await connection.getBalance(smartWalletPubkey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const copyAddress = async () => {
    if (!smartWalletPubkey) return;
    try {
      await navigator.clipboard.writeText(smartWalletPubkey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTransferSuccess = (signature: string) => {
    setLastTxSignature(signature);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
    fetchBalance();
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 glass rounded-2xl p-8" data-testid="connecting-state">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        <p className="text-gray-300">Connecting with passkey…</p>
        <p className="text-sm text-gray-500">Please authenticate with your device</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full" data-testid="wallet-connect">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 gradient-purple-pink rounded-full flex items-center justify-center animate-pulse-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 text-sm">
              Use passkey authentication - no passwords or seed phrases needed
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="px-8 py-4 gradient-purple-pink text-white rounded-xl hover:opacity-90 transition-all font-semibold text-lg btn-glow w-full"
            data-testid="connect-wallet-btn"
          >
            Connect with Passkey
          </button>

          <div className="glass-dark rounded-lg p-4 w-full">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Secure & Convenient</p>
                <p className="text-xs text-gray-400">
                  Face ID, Touch ID, or device PIN - your choice, your security
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 w-full" data-testid="connection-error">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const walletAddress = smartWalletPubkey?.toString() || '';
  const explorerLink = `${EXPLORER_URL}/address/${walletAddress}?cluster=devnet`;
  const hasBalance = balance !== null && balance > 0;

  return (
    <div className="w-full max-w-4xl space-y-6" data-testid="wallet-panel">
      {/* Success Message */}
      {showSuccess && lastTxSignature && (
        <div className="glass-strong rounded-2xl p-4 border-2 border-green-500/30 animate-scale-in" data-testid="success-message">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Transaction Successful!</p>
              <a
                href={`${EXPLORER_URL}/tx/${lastTxSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                View on Explorer
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Info Card */}
      <div className="glass-strong rounded-2xl p-6" data-testid="wallet-info">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-purple-pink rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400">Smart Wallet</p>
              <p className="font-semibold text-white">Connected</p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="text-sm text-gray-400 hover:text-white transition-colors"
            data-testid="disconnect-btn"
          >
            Disconnect
          </button>
        </div>

        {/* Balance */}
        <div className="glass-dark rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-400 mb-2">Total Balance</p>
          <div className="flex items-end gap-3">
            {isLoadingBalance ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400 border-t-transparent"></div>
            ) : (
              <>
                <p className="text-4xl font-bold gradient-text">
                  {balance !== null ? balance.toFixed(4) : '0.0000'}
                </p>
                <p className="text-lg text-gray-400 mb-1">SOL</p>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Solana Devnet</p>
        </div>

        {/* Address */}
        <div className="glass-dark rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-400 mb-2">Wallet Address</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-mono text-white truncate flex-1">
              {walletAddress}
            </p>
            <div className="flex gap-2">
              <button
                onClick={copyAddress}
                className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all text-sm"
                data-testid="copy-address-btn"
              >
                {copied ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </span>
                ) : (
                  <span className="text-purple-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all"
                data-testid="explorer-link"
              >
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowTransferModal(true)}
            disabled={!hasBalance}
            className={`px-6 py-4 gradient-purple-pink text-white rounded-xl font-semibold transition-all ${
              hasBalance ? 'hover:opacity-90 btn-glow' : 'opacity-50 cursor-not-allowed'
            }`}
            data-testid="send-sol-btn"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send SOL
            </div>
          </button>
          
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 glass text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
            data-testid="get-devnet-sol-btn"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Get Devnet SOL
            </div>
          </a>
        </div>

        {/* Gasless Feature Highlight */}
        {!hasBalance && (
          <div className="mt-6 glass-dark rounded-xl p-4 border-2 border-yellow-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-400 mb-1">Fund Your Wallet</p>
                <p className="text-xs text-gray-400">
                  Get Devnet SOL from the faucet to start testing. All transactions are gasless thanks to LazorKit!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <TransactionHistory />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
