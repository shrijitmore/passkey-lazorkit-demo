/**
 * Wallet Page
 * 
 * Complete wallet management page demonstrating LazorKit SDK integration:
 * - Send SOL transactions with passkey signing
 * - Receive SOL (display QR code and address)
 * - Message signing for wallet verification
 * - Balance display with refresh
 * 
 * This page shows how to:
 * 1. Use useWallet() hook to get wallet state
 * 2. Create transaction instructions
 * 3. Sign and send transactions with signAndSendTransaction()
 * 4. Sign messages with signMessage()
 * 5. Handle transaction errors gracefully
 * 
 * Key LazorKit Methods Used:
 * - signAndSendTransaction({ instructions }) - Signs with passkey and sends transaction
 * - signMessage(message) - Signs a message for wallet verification
 * - smartWalletPubkey - The wallet address (PDA)
 * 
 * @see Tutorial 2: Transactions for detailed explanation
 */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { LAMPORTS_PER_SOL, SystemProgram, PublicKey } from '@solana/web3.js';
import { getConnection } from '../lib/rpc/connection';
import { Send, Download, Copy, Check, MessageSquare, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { WALLET_EVENTS, dispatchWalletEvent } from '../lib/events/walletEvents';
import { useBalance } from '../contexts/BalanceContext';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';
import { parseError } from '../lib/utils/errorHandling';
import { useCopyToClipboard } from '../lib/hooks/useCopyToClipboard';
import { getTransactionExplorerUrl } from '../lib/utils/explorerUrls';
import AlertMessage from '../components/ui/AlertMessage';
import TransactionStatus from '../components/ui/TransactionStatus';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function WalletPage() {
  const { smartWalletPubkey, isConnected, signMessage } = useWallet();
  const { signTransaction } = useTransactionSigning();
  const { balance, isLoadingBalance, refreshBalance } = useBalance();
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [messageToSign, setMessageToSign] = useState('');
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const walletAddress = useMemo(() => smartWalletPubkey?.toString() || '', [smartWalletPubkey]);
  const usdEquivalent = useMemo(() => (balance !== null ? (balance * 150).toFixed(2) : '0.00'), [balance]);
  const [qrSize, setQrSize] = useState(232);
  
  // Use copy to clipboard hook
  const { copy: copyAddress, copied } = useCopyToClipboard();

  // Calculate responsive QR code size
  useEffect(() => {
    const updateQrSize = () => {
      if (typeof window !== 'undefined') {
        const maxSize = Math.min(232, window.innerWidth - 120);
        setQrSize(Math.max(200, maxSize));
      }
    };
    
    updateQrSize();
    window.addEventListener('resize', updateQrSize);
    return () => window.removeEventListener('resize', updateQrSize);
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartWalletPubkey) {
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
      const errorInfo = parseError(err);
      setError(errorInfo.userFriendly || errorInfo.message || 'Transaction failed. Please try again.');
    }
  }, [smartWalletPubkey, balance, sendAmount, recipientAddress, signTransaction]);

  const handleSignMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signMessage) {
      setSignError('Sign message not available');
      return;
    }

    if (!messageToSign.trim()) {
      setSignError('Please enter a message to sign');
      return;
    }

    setSignStatus('signing');
    setSignError(null);
    setSignature(null);

    try {
      const result = await signMessage(messageToSign);
      setSignature(result.signature);
      setSignStatus('success');
      
      setTimeout(() => {
        setMessageToSign('');
        setSignStatus('idle');
        setSignature(null);
      }, 5000);
    } catch (err: unknown) {
      setSignStatus('error');
      const errorInfo = parseError(err);
      setSignError(errorInfo.userFriendly || errorInfo.message || 'Message signing failed. Please try again.');
    }
  }, [signMessage, messageToSign]);

  const explorerUrl = useMemo(
    () => (txSignature ? getTransactionExplorerUrl(txSignature) : ''),
    [txSignature]
  );

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


  return (
    <AppLayout>
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Wallet</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Send and receive SOL on Solana Devnet</p>
      </div>

      {/* Balance Card */}
      <Card className="mb-4 sm:mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#f7931a] shadow-md">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <CardDescription className="text-xs sm:text-sm text-muted-foreground">SOL Balance</CardDescription>
                {isLoadingBalance && balance === null ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
                    <CardTitle className="text-xl sm:text-2xl md:text-3xl text-foreground">0.00000000</CardTitle>
                  </div>
                ) : (
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl text-foreground truncate">
                    {balance !== null ? balance.toFixed(8) : '0.00000000'}
                  </CardTitle>
                )}
              </div>
            </div>
            <button
              onClick={refreshBalance}
              disabled={isLoadingBalance}
              className="p-2 rounded-lg hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Refresh balance"
              aria-label="Refresh balance"
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground ${isLoadingBalance ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <CardDescription className="mt-2 text-xs sm:text-sm text-muted-foreground">≈ ${usdEquivalent} USD</CardDescription>
        </CardHeader>
      </Card>

      {/* Send/Receive/Verify Tabs */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 sm:p-1.5 h-auto min-h-[52px] sm:min-h-[48px] gap-1 sm:gap-2 mb-4 sm:mb-6">
          <TabsTrigger 
            value="send" 
            className="flex flex-col items-center justify-center gap-1 text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-background px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 h-auto min-h-[48px] sm:min-h-[44px] transition-all touch-manipulation"
          >
            <Send className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
            <span className="leading-tight font-medium">Send</span>
          </TabsTrigger>
          <TabsTrigger 
            value="receive" 
            className="flex flex-col items-center justify-center gap-1 text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-background px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 h-auto min-h-[48px] sm:min-h-[44px] transition-all touch-manipulation"
          >
            <Download className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
            <span className="leading-tight font-medium">Receive</span>
          </TabsTrigger>
          <TabsTrigger 
            value="verify" 
            className="flex flex-col items-center justify-center gap-1 text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-background px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 h-auto min-h-[48px] sm:min-h-[44px] transition-all touch-manipulation"
          >
            <Shield className="h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
            <span className="leading-tight font-medium">Verify</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-4 sm:mt-6">
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
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-destructive break-words">{error}</p>
                  </div>
                )}

                {txStatus === 'success' && txSignature && (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 sm:p-4">
                    <p className="mb-2 text-xs sm:text-sm font-medium text-green-400">Transaction Successful!</p>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline break-all"
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
                      <LoadingSpinner size="sm" color="white" />
                      Signing...
                    </>
                  )}
                  {txStatus === 'confirming' && (
                    <>
                      <LoadingSpinner size="sm" color="white" />
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

        <TabsContent value="receive" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg text-foreground">Receive SOL</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Share this address to receive SOL</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3 sm:p-4 shadow-md max-w-full">
                  {walletAddress ? (
                    <QRCodeSVG
                      value={walletAddress}
                      size={qrSize}
                      level="H"
                      includeMargin={false}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      className="max-w-full h-auto"
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
                <label className="text-xs sm:text-sm font-medium text-foreground">Your Wallet Address</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={walletAddress} 
                    readOnly 
                    className="font-mono text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3" 
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyAddress(walletAddress)}
                    className="shrink-0 h-10 w-10 sm:h-11 sm:w-11"
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

        <TabsContent value="verify" className="mt-4 sm:mt-6">
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
                  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-destructive break-words">{signError}</p>
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
                      <LoadingSpinner size="sm" color="white" />
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
