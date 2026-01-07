/**
 * WalletPanelEnhanced Component
 * 
 * A comprehensive example demonstrating LazorKit SDK integration:
 * - Passkey authentication (connect/disconnect)
 * - Multi-asset Portfolio Display (SOL + USDC)
 * - Total Portfolio Value calculation
 * - Send Transactions (Native SOL & Gasless USDC)
 * - Transaction history
 * 
 * This component showcases the core LazorKit features in a real-world UI.
 */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import TransferModal from './TransferModal';
import TransactionHistory from './TransactionHistory';
import SpotlightCard from '../features/SpotlightCard';
import { useTheme } from '../../contexts/ThemeContext';
import { useBalance } from '../../contexts/BalanceContext';
import { useWebAuthnConnection } from '../../lib/hooks/useWebAuthnConnection';
import { useCopyToClipboard } from '../../lib/hooks/useCopyToClipboard';
import { useTokenBalance } from '../../lib/hooks/useTokenBalance';
import { useSolPrice } from '../../lib/hooks/useSolPrice';
import { getAddressExplorerUrl, getTransactionExplorerUrl } from '../../lib/utils/explorerUrls';
import { FAUCET_URL } from '../../lib/constants/urls';
import { TOKENS } from '../../lib/constants/tokens';
import AlertMessage from '../ui/AlertMessage';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function WalletPanelEnhanced() {
  const { smartWalletPubkey, isConnected, disconnect, error: walletError } = useWallet();
  const { connect, isConnecting, error: connectionError } = useWebAuthnConnection();
  const { theme } = useTheme();

  // Balance Hooks
  const { balance: solBalance, isLoadingBalance: isLoadingSol, refreshBalance: refreshSol } = useBalance();
  const { balance: usdcBalance, isLoading: isLoadingUsdc, refresh: refreshUsdc } = useTokenBalance(smartWalletPubkey, TOKENS.USDC.mint);
  const { price: solPrice, isLoading: isLoadingPrice } = useSolPrice();

  const { copy: copyAddress, copied } = useCopyToClipboard();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHistoryRefreshTrigger, setTxHistoryRefreshTrigger] = useState(0);

  // Calculate Totals
  const portfolioValue = useMemo(() => {
    const solVal = (solBalance || 0) * solPrice;
    const usdcVal = (usdcBalance || 0) * 1; // USDC = $1 approx
    return solVal + usdcVal;
  }, [solBalance, usdcBalance, solPrice]);

  const refreshAll = () => {
    refreshSol();
    refreshUsdc();
  };

  // Fetch USDC balance when wallet connects (on-demand, not auto)
  React.useEffect(() => {
    if (smartWalletPubkey) {
      // Small delay to let things settle
      const timer = setTimeout(() => {
        refreshUsdc();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [smartWalletPubkey]);

  const handleTransferSuccess = (signature: string) => {
    setLastTxSignature(signature);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
    refreshAll();
    setTimeout(() => {
      setTxHistoryRefreshTrigger(prev => prev + 1);
    }, 3000);
  };

  // Handle connect using the hook
  const handleConnect = async () => {
    await connect();
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center gap-4 glass rounded-2xl p-8" data-testid="connecting-state">
        <LoadingSpinner size="lg" color="purple" />
        <p className="text-gray-300">Connecting with passkey…</p>
        <p className="text-sm text-gray-500">Please authenticate with your device</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <SpotlightCard
        spotlightColor={theme === 'dark' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(168, 85, 247, 0.15)'}
        className="max-w-md w-full"
      >
        <div className="glass-strong p-8" data-testid="wallet-connect">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center animate-pulse-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 text-primary-text">Connect Your Wallet</h3>
              <p className="text-secondary text-sm">
                Use passkey authentication - no passwords or seed phrases needed
              </p>
            </div>

            <button
              onClick={handleConnect}
              className="px-8 py-4 gradient-primary text-white rounded-xl hover:opacity-90 transition-all font-semibold text-lg btn-glow w-full"
              data-testid="connect-wallet-btn"
            >
              Connect with Passkey
            </button>

            <div className="glass-dark rounded-lg p-4 w-full">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-primary-text mb-1">Secure & Convenient</p>
                  <p className="text-xs text-secondary">
                    Face ID, Touch ID, or device PIN - your choice, your security
                  </p>
                </div>
              </div>
            </div>

            {(walletError || connectionError) && (
              <AlertMessage
                variant="error"
                message={connectionError || walletError?.message || 'Unknown connection error'}
              />
            )}
          </div>
        </div>
      </SpotlightCard>
    );
  }

  const walletAddress = smartWalletPubkey?.toString() || '';
  const explorerLink = walletAddress ? getAddressExplorerUrl(walletAddress) : '';
  const isLoading = isLoadingSol || isLoadingUsdc || isLoadingPrice;

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
                href={lastTxSignature ? getTransactionExplorerUrl(lastTxSignature) : '#'}
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

      {/* Main Portfolio Card */}
      <div className="glass-strong rounded-2xl p-6" data-testid="wallet-info">
        {/* Header with Disconnect */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1b23] z-10" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-text">Smart Wallet</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-secondary font-mono">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </p>
                <button
                  onClick={() => copyAddress(walletAddress)}
                  className="text-secondary hover:text-primary transition-colors"
                >
                  {copied ? <span className="text-green-400 text-[10px]">Copied</span> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="text-xs px-3 py-1.5 glass rounded-lg hover:bg-white/10 text-secondary hover:text-primary-text transition-all"
          >
            Disconnect
          </button>
        </div>

        {/* Total Portfolio Value */}
        <div className="text-center mb-10">
          <p className="text-sm text-secondary mb-1">Total Portfolio Value</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-secondary font-medium">USD</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-secondary">Devnet Live</span>
            <button onClick={refreshAll} className="ml-1 text-primary hover:text-white transition-colors" title="Refresh">
              <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-3 mb-8">
          {/* SOL Asset */}
          <div className="glass-dark rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-purple-500/30">
                <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-white">Solana</p>
                <p className="text-xs text-secondary">Native Token</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{(solBalance || 0).toFixed(4)} SOL</p>
              <p className="text-xs text-secondary">
                ${((solBalance || 0) * solPrice).toFixed(2)}
              </p>
            </div>
          </div>

          {/* USDC Asset */}
          <div className="glass-dark rounded-xl p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#2775CA]/10 flex items-center justify-center border border-[#2775CA]/30">
                <img src={TOKENS.USDC.logoUrl} alt="USDC" className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-white">USD Coin</p>
                <p className="text-xs text-secondary">Spl Token</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">{(usdcBalance || 0).toFixed(2)} USDC</p>
              <p className="text-xs text-secondary">
                ${(usdcBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-6 py-4 gradient-primary text-white rounded-xl font-semibold transition-all hover:opacity-90 btn-glow"
            data-testid="send-sol-btn"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Assets
            </div>
          </button>

          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-4 glass text-primary-text rounded-xl font-semibold hover:bg-white/10 transition-all"
            data-testid="get-devnet-sol-btn"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Faucet
            </div>
          </a>
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory refreshTrigger={txHistoryRefreshTrigger} />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
