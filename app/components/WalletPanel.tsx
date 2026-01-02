'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_URL = 'https://explorer.solana.com';
const FAUCET_URL = 'https://faucet.solana.com';

export default function WalletPanel() {
  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    error,
    signAndSendTransaction,
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingBalance(true);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const balance = await connection.getBalance(smartWalletPubkey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartWalletPubkey]);

  // Fetch balance when wallet connects
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
      // Poll balance every 15 seconds (reduced from 5s to avoid rate limiting)
      const interval = setInterval(fetchBalance, 15000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
      setTxSignature(null);
      setTxError(null);
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

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

  const handleSendTransaction = async () => {
    if (!smartWalletPubkey || !signAndSendTransaction || balance === null || balance === 0) {
      return;
    }

    setIsSendingTx(true);
    setTxError(null);
    setTxSignature(null);

    try {
      // Create a simple self-transfer instruction (0.01 SOL)
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: smartWalletPubkey, // Self-transfer for demo
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      // Sign and send transaction using LazorKit's signAndSendTransaction
      // This method handles signing with passkey and submission via Paymaster
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });
      
      setTxSignature(signature);
      // Refresh balance after transaction (with delay to avoid rate limiting)
      setTimeout(fetchBalance, 2000);
    } catch (err: unknown) {
      console.error('Transaction failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setTxError(errorMessage);
    } finally {
      setIsSendingTx(false);
    }
  };

  const handleConnect = async () => {
    setConnectError(null);
    
    // Check if WebAuthn is supported
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setConnectError('WebAuthn is not supported in this browser. Please use a modern browser like Chrome, Safari, Firefox, or Edge.');
      return;
    }

    // Check if we're on HTTPS or localhost (required for WebAuthn)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setConnectError('WebAuthn requires HTTPS. Please use HTTPS or localhost.');
      return;
    }

    try {
      // With passkey={true} on LazorkitProvider, connect() should handle:
      // 1. Creating passkey if it doesn't exist (triggers WebAuthn/biometric prompt)
      // 2. Creating smart wallet with the passkey
      // 3. Reconnecting if passkey and wallet already exist
      await connect();
      setConnectError(null); // Clear error on success
    } catch (err: unknown) {
      console.error('Connection failed:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect wallet';
      
      const errorObj = err as { message?: string; name?: string };

      if (errorObj?.message?.includes('passkeyPublicKey')) {
        errorMessage = 'Passkey creation failed. Please ensure:\n• Your device supports biometric authentication (Face ID, Touch ID, Windows Hello)\n• You approve the biometric prompt when it appears\n• Your browser supports WebAuthn\n• You are not blocking the authentication prompt';
      } else if (errorObj?.message?.includes('NotAllowedError') || errorObj?.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was canceled or denied. Please try again and approve the prompt.';
      } else if (errorObj?.message?.includes('NotSupportedError') || errorObj?.name === 'NotSupportedError') {
        errorMessage = 'Your device or browser does not support passkeys. Please use a device with Face ID, Touch ID, or Windows Hello.';
      } else if (errorObj?.message?.includes('InvalidStateError') || errorObj?.name === 'InvalidStateError') {
        errorMessage = 'A passkey already exists. Please try disconnecting and reconnecting.';
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      }
      
      setConnectError(errorMessage);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        <p className="text-gray-500">Connecting with passkey…</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-4 items-center">
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          Connect Wallet with Passkey
        </button>
        <p className="text-sm text-gray-500 max-w-md text-center">
          Click to create or sign in with your passkey. No password or seed phrase needed!
        </p>
        {(error || connectError) && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 max-w-md">
            <p className="font-semibold mb-1">Connection Error:</p>
            <p className="whitespace-pre-line">{connectError || error?.message || 'Unknown error'}</p>
            <p className="text-xs text-red-600 mt-2">
              💡 Tip: Make sure you approve the biometric prompt (Face ID, Touch ID, or Windows Hello) when it appears.
            </p>
          </div>
        )}
      </div>
    );
  }

  const walletAddress = smartWalletPubkey?.toString() || '';
  const explorerLink = `${EXPLORER_URL}/address/${walletAddress}?cluster=devnet`;
  const hasBalance = balance !== null && balance > 0;

  return (
    <div className="border rounded-lg p-6 max-w-md bg-white shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-4">
        <svg
          className="w-6 h-6 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="font-semibold text-lg">Wallet Connected</h2>
      </div>

      {/* Wallet Address Section */}
      <div className="bg-gray-50 rounded p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">Smart Wallet Address</p>
          <button
            onClick={copyAddress}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-sm break-all font-mono">
          {walletAddress}
        </p>
        <a
          href={explorerLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center gap-1"
        >
          View on Solana Explorer
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Network and Balance */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Network: Solana Devnet</p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500">Balance:</p>
          {isLoadingBalance ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
          ) : (
            <p className="text-sm font-semibold">
              {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
            </p>
          )}
        </div>
      </div>

      {/* Faucet Instructions */}
      {!hasBalance && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            Fund Your Wallet
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            To send a test transaction, you need Devnet SOL:
          </p>
          <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1 mb-3">
            <li>Copy your wallet address above</li>
            <li>Open the Solana Faucet</li>
            <li>Paste your address and request 1 SOL on Devnet</li>
            <li>Return here and send a test transaction</li>
          </ol>
          <a
            href={FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            Open Solana Faucet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Send Transaction Button */}
      <button
        onClick={handleSendTransaction}
        disabled={!hasBalance || isSendingTx}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-colors mb-4 ${
          hasBalance && !isSendingTx
            ? 'bg-black text-white hover:bg-gray-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isSendingTx ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Sending Transaction...
          </span>
        ) : (
          'Send Test Transaction'
        )}
      </button>

      {/* Transaction Result */}
      {txSignature && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-green-800 mb-2">
            Transaction Successful!
          </p>
          <p className="text-xs text-green-700 mb-2 break-all font-mono">
            {txSignature}
          </p>
          <a
            href={`${EXPLORER_URL}/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-700 hover:text-green-900 inline-flex items-center gap-1"
          >
            View on Solana Explorer
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Transaction Error */}
      {txError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-1">
            Transaction Failed
          </p>
          <p className="text-xs text-red-700">
            {txError}
          </p>
        </div>
      )}

      {/* Disconnect Button */}
      <button
        onClick={disconnect}
        className="w-full px-4 py-2 text-sm border rounded hover:bg-gray-50 transition-colors"
      >
        Disconnect
      </button>

      {/* Connection Error */}
      {error && (
        <p className="mt-2 text-xs text-red-600 text-center">
          {error.message}
        </p>
      )}
    </div>
  );
}
