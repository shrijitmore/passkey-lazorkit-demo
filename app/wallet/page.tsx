'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, LAMPORTS_PER_SOL, SystemProgram, PublicKey } from '@solana/web3.js';
import { Send, Download, Copy, Check, Loader2, MessageSquare, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { WALLET_EVENTS, listenWalletEvent, dispatchWalletEvent } from '../lib/events/walletEvents';

// Configuration constants
const RPC_URL = 'https://api.devnet.solana.com';
const EXPLORER_URL = 'https://explorer.solana.com';
const BALANCE_POLL_INTERVAL = 30000; // 30 seconds - balance refresh interval

/**
 * Wallet Page Component
 * 
 * Features:
 * - Send SOL transactions with passkey authentication
 * - Receive SOL with QR code
 * - Verify wallet ownership with message signing
 * - Real-time balance updates
 * - Transaction history integration
 * - Fully responsive mobile design
 * 
 * Mobile Optimizations:
 * - Responsive tabs layout
 * - Mobile-friendly QR code size
 * - Touch-optimized buttons
 * - Responsive card layouts
 */
export default function WalletPage() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction, signMessage } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState('');
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  // Ref to track previous pubkey to prevent unnecessary re-renders
  const prevPubkeyRef = useRef<string | null>(null);

  /**
   * Fetch wallet balance from Solana blockchain
   * 
   * Optimizations:
   * - Only updates state if balance actually changed (rounded to 4 decimals)
   * - Prevents unnecessary re-renders
   * - Handles errors gracefully
   */
  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    
    setIsLoadingBalance(true);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const balance = await connection.getBalance(smartWalletPubkey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      
      // Only update state if balance actually changed (rounded to 4 decimals)
      // This prevents unnecessary re-renders
      setBalance(prev => {
        if (prev === null) return balanceInSol;
        const prevRounded = Math.round(prev * 10000) / 10000;
        const newRounded = Math.round(balanceInSol * 10000) / 10000;
        return prevRounded === newRounded ? prev : balanceInSol;
      });
    } catch (err) {
      // Silently handle balance fetch errors (network issues, etc.)
      console.error('Balance fetch error:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartWalletPubkey]);

  /**
   * Effect: Set up balance polling when wallet connects
   * 
   * - Fetches balance immediately on connect
   * - Sets up polling interval (30 seconds)
   * - Clears balance when wallet disconnects
   * - Only runs when pubkey actually changes (optimization)
   */
  useEffect(() => {
    const pubkeyString = smartWalletPubkey?.toString() || null;
    const pubkeyChanged = prevPubkeyRef.current !== pubkeyString;

    if (pubkeyChanged) {
      prevPubkeyRef.current = pubkeyString;
      
      if (isConnected && smartWalletPubkey) {
        // Fetch balance immediately
        fetchBalance();
        
        // Set up polling interval for automatic balance updates
        const interval = setInterval(() => {
          fetchBalance();
        }, BALANCE_POLL_INTERVAL);
        
        // Cleanup: clear interval on unmount or disconnect
        return () => clearInterval(interval);
      } else {
        // Clear balance when wallet disconnects
        setBalance(null);
      }
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  /**
   * Effect: Listen for transaction completion events
   * 
   * - Automatically refreshes balance after transactions
   * - Real-time updates without polling delay
   * - Cleans up event listener on unmount
   */
  useEffect(() => {
    if (!isConnected || !smartWalletPubkey) return;

    const unsubscribe = listenWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, () => {
      // Refresh balance immediately after transaction
      fetchBalance();
    });

    // Cleanup: remove event listener
    return unsubscribe;
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  /**
   * Copy wallet address to clipboard
   * Shows success feedback for 2 seconds
   */
  const handleCopy = async () => {
    if (!smartWalletPubkey) return;
    try {
      await navigator.clipboard.writeText(smartWalletPubkey.toString());
      setCopied(true);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silently handle copy errors (clipboard API not available, etc.)
      console.error('Copy error:', err);
    }
  };

  /**
   * Handle SOL transfer transaction
   * 
   * Process:
   * 1. Validate inputs (recipient address, amount)
   * 2. Create transfer instruction
   * 3. Sign with passkey (biometric authentication)
   * 4. Send transaction to blockchain
   * 5. Wait for confirmation
   * 6. Dispatch events for UI updates
   * 
   * Error Handling:
   * - Validates recipient address format
   * - Checks sufficient balance
   * - Handles transaction failures gracefully
   */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartWalletPubkey || !signAndSendTransaction) {
      setError('Wallet not connected');
      return;
    }

    setTxStatus('signing');
    setError(null);
    setTxSignature(null);

    try {
      const recipientPubkey = new PublicKey(recipientAddress);
      const amountLamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL;

      if (amountLamports <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (balance !== null && parseFloat(sendAmount) > balance) {
        throw new Error(`Insufficient balance. You have ${balance.toFixed(4)} SOL`);
      }

      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: amountLamports,
      });

      setTxStatus('signing');
      const signature = await signAndSendTransaction({
        instructions: [instruction],
      });

      setTxSignature(signature);
      setTxStatus('confirming');

      const connection = new Connection(RPC_URL, 'confirmed');
      await connection.confirmTransaction(signature, 'confirmed');

      setTxStatus('success');
      dispatchWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, {
        signature,
        type: 'transfer',
      });
      dispatchWalletEvent(WALLET_EVENTS.BALANCE_UPDATED);

      setTimeout(() => {
        setSendAmount('');
        setRecipientAddress('');
        setTxStatus('idle');
        setTxSignature(null);
      }, 3000);
    } catch (err: unknown) {
      setTxStatus('error');
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Transaction failed. Please try again.');
    }
  };

  /**
   * Handle message signing for wallet verification
   * 
   * Process:
   * 1. Validate message input
   * 2. Sign message with passkey (biometric authentication)
   * 3. Display signature for verification
   * 
   * Benefits:
   * - No transaction fees (off-chain signing)
   * - No transaction size limits
   * - Proves wallet ownership without spending SOL
   * - Useful for authentication/verification flows
   */
  const handleSignMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate signMessage function is available
    if (!signMessage) {
      setSignError('Sign message not available');
      return;
    }

    // Validate message is not empty
    if (!messageToSign.trim()) {
      setSignError('Please enter a message to sign');
      return;
    }

    setSignStatus('signing');
    setSignError(null);
    setSignature(null);

    try {
      // Sign message with passkey (triggers biometric prompt)
      const result = await signMessage(messageToSign);
      setSignature(result.signature);
      setSignStatus('success');
      
      // Clear form after 5 seconds
      setTimeout(() => {
        setMessageToSign('');
        setSignStatus('idle');
        setSignature(null);
      }, 5000);
    } catch (err: unknown) {
      setSignStatus('error');
      const errorObj = err as { message?: string };
      setSignError(errorObj?.message || 'Message signing failed. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="mb-4 text-xl font-semibold">Please connect your wallet</p>
              <p className="text-muted-foreground">Navigate to Dashboard to connect</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const walletAddress = smartWalletPubkey?.toString() || '';
  const usdEquivalent = balance !== null ? (balance * 150).toFixed(2) : '0.00';

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Wallet</h1>
        <p className="text-sm text-muted-foreground md:text-base">Send and receive SOL on Solana Devnet</p>
      </div>

      {/* Balance Card */}
      <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f7931a] shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <CardDescription className="text-muted-foreground">SOL Balance</CardDescription>
              {isLoadingBalance && balance === null ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <CardTitle className="text-2xl text-foreground md:text-3xl">0.00000000</CardTitle>
                </div>
              ) : (
                <CardTitle className="text-2xl text-foreground md:text-3xl">
                  {balance !== null ? balance.toFixed(8) : '0.00000000'}
                </CardTitle>
              )}
            </div>
          </div>
          <CardDescription className="mt-2 text-muted-foreground">≈ ${usdEquivalent} USD</CardDescription>
        </CardHeader>
      </Card>

      {/* Send/Receive/Verify Tabs - Responsive layout */}
      <Tabs defaultValue="send" className="w-full">
        {/* Tab Navigation - Responsive grid (3 columns on mobile, adapts to screen size) */}
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="send" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background">
            <Send className="h-4 w-4" />
            <span className="hidden xs:inline">Send</span>
          </TabsTrigger>
          <TabsTrigger value="receive" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background">
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">Receive</span>
          </TabsTrigger>
          <TabsTrigger value="verify" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background">
            <Shield className="h-4 w-4" />
            <span className="hidden xs:inline">Verify</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Send SOL</CardTitle>
              <CardDescription>Transfer SOL to another wallet address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-medium text-foreground">
                    Recipient Address
                  </label>
                  <Input
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter Solana wallet address"
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-foreground">
                    Amount (SOL)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00000000"
                    required
                  />
                  {balance !== null && (
                    <p className="text-xs text-muted-foreground">
                      Available: {balance.toFixed(4)} SOL
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {txStatus === 'success' && txSignature && (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                    <p className="mb-2 text-sm font-medium text-green-400">Transaction Successful!</p>
                    <a
                      href={`${EXPLORER_URL}/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={txStatus !== 'idle' && txStatus !== 'error'}
                  variant="gradient"
                  className="w-full"
                  size="lg"
                >
                  {txStatus === 'signing' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing...
                    </>
                  )}
                  {txStatus === 'confirming' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  )}
                  {txStatus === 'success' && (
                    <>
                      <Check className="h-4 w-4" />
                      Success!
                    </>
                  )}
                  {(txStatus === 'idle' || txStatus === 'error') && (
                    <>
                      <Send className="h-4 w-4" />
                      Send Transaction
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receive" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Receive SOL</CardTitle>
              <CardDescription>Share this address to receive SOL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* QR Code - Responsive size for mobile */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-md">
                  {walletAddress ? (
                    <QRCodeSVG
                      value={walletAddress}
                      size={200} // Smaller on mobile, scales up on larger screens
                      level="H" // High error correction for better scanning
                      includeMargin={false}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      className="sm:w-[232px] sm:h-[232px]"
                    />
                  ) : (
                    <div className="flex h-[200px] w-[200px] sm:h-[232px] sm:w-[232px] items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your Wallet Address</label>
                <div className="flex items-center gap-2">
                  <Input value={walletAddress} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-400">Address copied to clipboard!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                Verify Wallet Ownership
              </CardTitle>
              <CardDescription>
                Sign a message with your passkey to verify wallet ownership. No transaction fees required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignMessage} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Message to Sign
                  </label>
                  <Input
                    id="message"
                    value={messageToSign}
                    onChange={(e) => setMessageToSign(e.target.value)}
                    placeholder="Enter a message to sign (e.g., 'Hello LazorKit')"
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be signed with your passkey to prove wallet ownership.
                  </p>
                </div>

                {signError && (
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{signError}</p>
                  </div>
                )}

                {signStatus === 'success' && signature && (
                  <div className="space-y-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      <p className="text-sm font-medium text-green-400">Message Signed Successfully!</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Signature:</label>
                      <div className="rounded-md bg-background/50 p-2">
                        <p className="break-all font-mono text-xs text-foreground">{signature}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This signature proves you own the wallet without sending any transaction.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={signStatus !== 'idle' && signStatus !== 'error'}
                  variant="gradient"
                  className="w-full"
                  size="lg"
                >
                  {signStatus === 'signing' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing with Passkey...
                    </>
                  )}
                  {signStatus === 'success' && (
                    <>
                      <Check className="h-4 w-4" />
                      Signed!
                    </>
                  )}
                  {(signStatus === 'idle' || signStatus === 'error') && (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Sign Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
