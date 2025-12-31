'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import {
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

/**
 * WalletPanel Component
 * 
 * A comprehensive wallet UI component that demonstrates:
 * - Passkey-based wallet connection
 * - Balance fetching and display
 * - Gasless transaction sending
 * - Session management
 * 
 * Reference: https://docs.lazorkit.com/react-sdk/use-wallet
 */

const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_URL = 'https://explorer.solana.com';
const FAUCET_URL = 'https://faucet.solana.com';

export default function WalletPanel() {
  /**
   * useWallet Hook
   * 
   * Provides wallet state and methods from LazorKit SDK.
   * All methods and properties are documented at: https://docs.lazorkit.com/react-sdk/use-wallet
   * 
   * Available properties:
   * - smartWalletPubkey: PublicKey | null - The smart wallet address (PDA)
   * - isConnected: boolean - Whether wallet is currently connected
   * - isConnecting: boolean - Whether connection is in progress
   * - error: Error | null - Any connection or transaction errors
   * 
   * Available methods:
   * - connect(): Promise<WalletInfo> - Connect wallet (creates/authenticates passkey)
   * - disconnect(): Promise<void> - Disconnect and clear session
   * - signAndSendTransaction(): Promise<string> - Send gasless transaction
   * - signMessage(): Promise<{signature, signedPayload}> - Sign messages
   */
  const {
    smartWalletPubkey,      // PublicKey | null - Smart wallet address (PDA)
    isConnected,             // boolean - Connection status
    isConnecting,            // boolean - Currently connecting
    connect,                 // Function - Initiate wallet connection
    disconnect,              // Function - Disconnect wallet
    error,                   // Error | null - Connection/transaction errors
    signAndSendTransaction, // Function - Send gasless transactions
    signMessage,             // Function - Sign messages with passkey
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Message signing state
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [messageSignature, setMessageSignature] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Solana Connection instance for querying blockchain data
  // Used to fetch balance, confirm transactions, etc.
  const connection = new Connection(RPC_URL, 'confirmed');

  /**
   * Effect: Fetch balance when wallet connects
   * 
   * When wallet connects:
   * 1. Immediately fetch the balance
   * 2. Set up polling to refresh balance every 5 seconds
   * 3. Clean up polling when wallet disconnects
   * 
   * When wallet disconnects:
   * - Clear balance, transaction signature, and errors
   */
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
      // Poll balance every 5 seconds to keep it updated
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    } else {
      // Clear all wallet-related state when disconnected
      setBalance(null);
      setTxSignature(null);
      setTxError(null);
    }
  }, [isConnected, smartWalletPubkey]);

  /**
   * fetchBalance
   * 
   * Fetches the SOL balance of the connected smart wallet from the Solana blockchain.
   * 
   * How it works:
   * 1. Uses Solana Connection to query the blockchain
   * 2. getBalance() returns balance in lamports (smallest unit of SOL)
   * 3. Converts lamports to SOL by dividing by LAMPORTS_PER_SOL (1e9)
   * 
   * Note: This is separate from LazorKit - we're directly querying Solana RPC
   */
  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingBalance(true);
    try {
      // Query Solana blockchain for wallet balance
      const balance = await connection.getBalance(smartWalletPubkey);
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  /**
   * copyAddress
   * 
   * Copies the wallet address to clipboard for easy sharing/funding.
   * Uses the browser's Clipboard API.
   */
  const copyAddress = async () => {
    if (!smartWalletPubkey) return;
    try {
      await navigator.clipboard.writeText(smartWalletPubkey.toString());
      setCopied(true);
      // Reset "Copied!" message after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  /**
   * handleSendTransaction
   * 
   * Sends a gasless transaction using LazorKit's signAndSendTransaction method.
   * 
   * How it works (as per https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction):
   * 
   * 1. Create Transaction Instruction:
   *    - Use Solana's SystemProgram to create a transfer instruction
   *    - This defines WHAT the transaction does (transfer SOL)
   * 
   * 2. Call signAndSendTransaction:
   *    - LazorKit automatically signs with user's passkey (biometric prompt)
   *    - LazorKit submits via Paymaster (gasless - no SOL needed for fees)
   *    - Returns transaction signature
   * 
   * 3. Transaction Flow:
   *    User clicks → Biometric prompt → Passkey signs → Paymaster pays fees → Transaction on-chain
   * 
   * Key Benefits:
   * - No seed phrases: Passkey handles signing
   * - Gasless: Paymaster pays fees
   * - Secure: Private key never leaves device (WebAuthn)
   * 
   * Reference: https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction
   */
  const handleSendTransaction = async () => {
    if (!smartWalletPubkey || !signAndSendTransaction || balance === null || balance === 0) {
      return;
    }

    setIsSendingTx(true);
    setTxError(null);
    setTxSignature(null);

    try {
      /**
       * Step 1: Create Transaction Instruction
       * 
       * SystemProgram.transfer creates a Solana instruction that transfers SOL.
       * We're doing a self-transfer (to same address) for demo purposes.
       * 
       * Parameters:
       * - fromPubkey: Source wallet (our smart wallet)
       * - toPubkey: Destination wallet (same wallet for demo)
       * - lamports: Amount in lamports (0.01 SOL = 10,000,000 lamports)
       */
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: smartWalletPubkey, // Self-transfer for demo
        lamports: 0.01 * LAMPORTS_PER_SOL,
      });

      /**
       * Step 2: Sign and Send Transaction
       * 
       * signAndSendTransaction is LazorKit's core method for executing on-chain actions.
       * 
       * What happens internally:
       * 1. LazorKit prompts user for biometric authentication (Face ID/Touch ID)
       * 2. Passkey signs the transaction in device's Secure Enclave
       * 3. Transaction is sent to Paymaster service
       * 4. Paymaster pays the transaction fees (gasless!)
       * 5. Transaction is submitted to Solana network
       * 6. Returns transaction signature
       * 
       * API Reference: https://docs.lazorkit.com/react-sdk/use-wallet#signandsendtransaction
       * 
       * Optional transactionOptions:
       * - feeToken: 'USDC' - Pay fees in USDC instead of SOL
       * - computeUnitLimit: 500_000 - Max compute units
       * - clusterSimulation: 'devnet' - Network for simulation
       */
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        // Optional: Add transaction options here
        // transactionOptions: {
        //   feeToken: 'USDC',
        //   computeUnitLimit: 500_000,
        //   clusterSimulation: 'devnet',
        // },
      });
      
      setTxSignature(signature);
      // Refresh balance after transaction completes
      setTimeout(fetchBalance, 1000);
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setTxError(err.message || 'Transaction failed');
    } finally {
      setIsSendingTx(false);
    }
  };

  /**
   * handleConnect
   * 
   * Initiates wallet connection using LazorKit's connect method.
   * 
   * How it works (per https://docs.lazorkit.com/react-sdk/use-wallet#connect):
   * 
   * First-time users:
   * 1. Browser prompts for biometric authentication (Face ID/Touch ID/Windows Hello)
   * 2. WebAuthn creates a passkey in device's Secure Enclave
   * 3. LazorKit creates a Program Derived Address (PDA) smart wallet
   * 4. Passkey is linked to the smart wallet
   * 5. Session is stored securely
   * 
   * Returning users:
   * 1. LazorKit checks for existing session
   * 2. If session exists: Attempts to restore silently (may prompt for biometric)
   * 3. If no session: Full authentication flow
   * 
   * Optional connect options:
   * - feeMode: 'paymaster' | 'user' (default: 'paymaster')
   *   - 'paymaster': Transactions are gasless (default)
   *   - 'user': User pays transaction fees
   * 
   * Returns: Promise<WalletInfo> - Contains wallet address and metadata
   * 
   * Reference: https://docs.lazorkit.com/react-sdk/use-wallet#connect
   */
  const handleConnect = async () => {
    try {
      // Connect with default options (feeMode: 'paymaster' for gasless transactions)
      await connect();
      // Optional: Specify fee mode
      // await connect({ feeMode: 'paymaster' }); // or 'user'
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  /**
   * handleSignMessage
   * 
   * Signs a message using the user's passkey.
   * 
   * How it works (per https://docs.lazorkit.com/react-sdk/use-wallet#signmessage):
   * 
   * 1. Prompts user for biometric authentication
   * 2. Passkey signs the message in device's Secure Enclave
   * 3. Returns signature and signed payload
   * 
   * Use cases:
   * - Verify wallet ownership without sending a transaction
   * - Authenticate users off-chain
   * - Sign data for verification purposes
   * 
   * Returns: Promise<{ signature: string, signedPayload: string }>
   * 
   * Reference: https://docs.lazorkit.com/react-sdk/use-wallet#signmessage
   */
  const handleSignMessage = async () => {
    if (!signMessage) return;

    setIsSigningMessage(true);
    setMessageError(null);
    setMessageSignature(null);

    try {
      const message = 'Hello from LazorKit! This message was signed with my passkey.';
      const { signature } = await signMessage(message);
      setMessageSignature(signature);
    } catch (err: any) {
      console.error('Message signing failed:', err);
      setMessageError(err.message || 'Message signing failed');
    } finally {
      setIsSigningMessage(false);
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
        {error && (
          <p className="text-sm text-red-600 mt-2">
            {error.message}
          </p>
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

      {/* Sign Message Button */}
      <button
        onClick={handleSignMessage}
        disabled={isSigningMessage}
        className="w-full px-4 py-3 rounded-lg font-medium transition-colors mb-3 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {isSigningMessage ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Signing Message...
          </span>
        ) : (
          'Sign Message (Demo)'
        )}
      </button>

      {/* Message Signature Result */}
      {messageSignature && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-blue-800 mb-2">
            Message Signed Successfully!
          </p>
          <p className="text-xs text-blue-700 mb-1">Signature:</p>
          <p className="text-xs text-blue-700 mb-2 break-all font-mono">
            {messageSignature}
          </p>
          <p className="text-xs text-blue-600">
            This signature proves you own the wallet without sending a transaction.
          </p>
        </div>
      )}

      {/* Message Signing Error */}
      {messageError && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-xs font-semibold text-red-800 mb-1">
            Message Signing Failed
          </p>
          <p className="text-xs text-red-700">
            {messageError}
          </p>
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
