/**
 * Wallet Page
 * 
 * Complete wallet management:
 * - Send Assets (SOL and USDC with gasless option)
 * - Receive Assets (separate addresses for SOL and USDC with faucets)
 * - Message signing for verification
 */
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { LAMPORTS_PER_SOL, SystemProgram, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { getConnection } from '../lib/rpc/connection';
import { Send, Download, Copy, Check, Shield, RefreshCw, Loader2, QrCode, ExternalLink, Coins } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { WALLET_EVENTS, dispatchWalletEvent } from '../lib/events/walletEvents';
import { useBalance } from '../contexts/BalanceContext';
import { useTransactionSigning } from '../lib/hooks/useTransactionSigning';
import { useAllTokenBalances } from '../lib/hooks/useAllTokenBalances';
import { parseError } from '../lib/utils/errorHandling';
import { useCopyToClipboard } from '../lib/hooks/useCopyToClipboard';
import { getTransactionExplorerUrl } from '../lib/utils/explorerUrls';
import { TOKENS } from '../lib/constants/tokens';
import { FAUCET_URL } from '../lib/constants/urls';
import { getOrCreateAssociatedTokenAccountInstruction, createSPLTransferInstruction } from '../lib/utils/tokenUtils';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import QRScanner from '../components/ui/QRScanner';

type TokenType = 'SOL' | 'USDC';

export default function WalletPage() {
  const { smartWalletPubkey, isConnected, signMessage } = useWallet();
  const { signTransaction } = useTransactionSigning();
  const { balance: solBalance, isLoadingBalance: isLoadingSol, refreshBalance: refreshSol } = useBalance();
  const { tokens, isLoading: isLoadingTokens, refresh: refreshTokens } = useAllTokenBalances(smartWalletPubkey);

  // Send form state
  const [tokenType, setTokenType] = useState<TokenType>('SOL');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Receive state
  const [usdcAta, setUsdcAta] = useState<string>('');
  const [usdcAtaExists, setUsdcAtaExists] = useState<boolean>(false);
  const [creatingAta, setCreatingAta] = useState<boolean>(false);

  // Verify state
  const [messageToSign, setMessageToSign] = useState('');
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const [showQRScanner, setShowQRScanner] = useState(false);

  const walletAddress = useMemo(() => smartWalletPubkey?.toString() || '', [smartWalletPubkey]);
  const { copy: copyAddress, copied } = useCopyToClipboard();
  const { copy: copyAta, copied: copiedAta } = useCopyToClipboard();

  const selectedAta = usdcAta;
  const selectedAtaExists = usdcAtaExists;

  // Fetch Token ATA addresses and check if they exist
  useEffect(() => {
    const fetchAtas = async () => {
      if (smartWalletPubkey) {
        const connection = getConnection();

        // Fetch USDC
        try {
          const usdcMint = new PublicKey(TOKENS.USDC_DEV.mint);
          const ata = await getAssociatedTokenAddress(usdcMint, smartWalletPubkey, true);
          setUsdcAta(ata.toString());
          const info = await connection.getAccountInfo(ata);
          setUsdcAtaExists(info !== null);
        } catch (e) {
          console.error('Failed to get USDC ATA:', e);
          setUsdcAtaExists(false);
        }
      }
    };
    fetchAtas();
  }, [smartWalletPubkey]);

  // Fetch tokens on mount
  useEffect(() => {
    if (smartWalletPubkey) {
      const timer = setTimeout(() => refreshTokens(), 1000);
      return () => clearTimeout(timer);
    }
  }, [smartWalletPubkey]);

  // Helper to get token balances
  const usdcToken = tokens.find((t: any) => t.symbol === 'USDC');
  const usdcBalance = usdcToken?.balance || 0;

  const refreshAll = () => {
    refreshSol();
    refreshTokens();
  };

  // Create Token ATA
  // The ATA must exist on-chain before tokens can be received
  const createTokenAta = async () => {
    if (!smartWalletPubkey) return;

    setCreatingAta(true);
    setError(null);
    console.log(`[WalletPage] Attempting to create USDC account...`);

    try {
      const connection = getConnection();
      const mint = new PublicKey(TOKENS.USDC_DEV.mint);

      const { address, instruction } = await getOrCreateAssociatedTokenAccountInstruction(
        connection,
        mint,
        smartWalletPubkey,
        smartWalletPubkey,
        true // allowOwnerOffCurve: required for PDA-based smart wallets
      );

      if (!instruction) {
        console.log(`[WalletPage] USDC account already exists at ${address.toString()}`);
        setUsdcAtaExists(true);
        setCreatingAta(false);
        return;
      }

      console.log(`[WalletPage] Sending transaction to create USDC account...`);
      // Sign and send the transaction to create the ATA
      // Note: If solBalance is 0, the Paymaster may sponsor this if configured!
      await signTransaction({
        instructions: [instruction],
        onError: (err) => {
          const parsed = parseError(err);
          setError(parsed.userFriendly || parsed.message);
        },
      });

      console.log(`[WalletPage] USDC account created successfully!`);
      setUsdcAtaExists(true);
      setUsdcAta(address.toString());

      // Refresh tokens to pick up the new account
      setTimeout(() => refreshTokens(), 2000);
    } catch (err) {
      console.error(`[WalletPage] Failed to create USDC account:`, err);
      const parsed = parseError(err);

      // Special handling for common errors
      if (parsed.message && (parsed.message.includes('0x0') || parsed.message.includes('already in use'))) {
        console.log(`[WalletPage] Account for USDC already exists. Marking as exists.`);
        setUsdcAtaExists(true);
        return;
      }

      // If it's a balance error, provide a helpful tip about gasless/faucet
      if (parsed.code === 'INSUFFICIENT_FUNDS' || (parsed.message && (parsed.message.includes('0x1') || parsed.message.includes('Insufficient SOL')))) {
        setError('Insufficient SOL for account rent (~0.002 SOL). While transaction fees are covered by Paymaster, Solana requires a small amount of SOL for account storage rent. Please use the Faucet link below to get some SOL.');
      } else {
        setError(parsed.userFriendly || parsed.message || `Failed to create USDC account`);
      }
    } finally {
      setCreatingAta(false);
    }
  };

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
      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(recipientAddress);
      } catch {
        throw new Error('Invalid recipient address');
      }

      const amountVal = parseFloat(sendAmount);
      if (isNaN(amountVal) || amountVal <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const instructions: TransactionInstruction[] = [];
      const connection = getConnection();

      if (tokenType === 'SOL') {
        if (solBalance !== null && amountVal > solBalance) {
          throw new Error(`Insufficient SOL. Available: ${solBalance.toFixed(4)} SOL`);
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
        if (amountVal > usdcBalance) {
          throw new Error(`Insufficient USDC. Available: ${usdcBalance.toFixed(2)} USDC`);
        }
        const usdcMint = new PublicKey(TOKENS.USDC_DEV.mint);
        const { address: senderAta } = await getOrCreateAssociatedTokenAccountInstruction(
          connection, usdcMint, smartWalletPubkey, smartWalletPubkey
        );
        const { address: recipientAta, instruction: createAtaIx } = await getOrCreateAssociatedTokenAccountInstruction(
          connection, usdcMint, recipientPubkey, smartWalletPubkey
        );
        if (createAtaIx) {
          // PROACTIVE RENT CHECK: If we need to create an ATA, ensure sender has enough SOL
          const RENT_EXEMPT_MIN = 0.0021; // Standard ATA rent is approx 0.00204 SOL
          if (solBalance !== null && solBalance < RENT_EXEMPT_MIN) {
            throw new Error(`Recipient needs a USDC account, but you have insufficient SOL for the account creation rent. You need at least ${RENT_EXEMPT_MIN} SOL. Use the Faucet to get some!`);
          }
          instructions.push(createAtaIx);
        }
        instructions.push(createSPLTransferInstruction(senderAta, recipientAta, smartWalletPubkey, amountVal, TOKENS.USDC_DEV.decimals));
      }

      const sig = await signTransaction({
        instructions,
        onError: (err) => {
          const parsed = parseError(err);
          setError(parsed.userFriendly || parsed.message);
        },
      });

      setTxSignature(sig);
      setTxStatus('confirming');
      await connection.confirmTransaction(sig, 'confirmed');
      setTxStatus('success');

      dispatchWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, { signature: sig, type: 'transfer' });
      dispatchWalletEvent(WALLET_EVENTS.BALANCE_UPDATED);

      setTimeout(() => {
        setSendAmount('');
        setRecipientAddress('');
        setTxStatus('idle');
        setTxSignature(null);
        refreshAll();
      }, 3000);
    } catch (err: unknown) {
      setTxStatus('error');
      const parsed = parseError(err);
      setError(parsed.userFriendly || parsed.message || 'Transaction failed');
    }
  }, [smartWalletPubkey, solBalance, tokens, tokenType, sendAmount, recipientAddress, signTransaction]);

  const handleScan = useCallback((result: string) => {
    try {
      new PublicKey(result);
      setRecipientAddress(result);
      setShowQRScanner(false);
      setError(null);
    } catch {
      setError('Invalid Solana address scanned');
    }
  }, []);

  const handleSignMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signMessage || !messageToSign.trim()) {
      setSignError('Please enter a message');
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
      const parsed = parseError(err);
      setSignError(parsed.userFriendly || parsed.message || 'Signing failed');
    }
  }, [signMessage, messageToSign]);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground text-sm">Send and receive assets on Solana Devnet</p>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshAll} disabled={isLoadingSol || isLoadingTokens}>
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingSol || isLoadingTokens) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Balance Overview */}
        <Card className="border-primary/20">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* SOL ASSET */}
            <div className="glass-dark rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Solana</p>
                  <p className="text-xs text-muted-foreground font-mono">{(solBalance || 0).toFixed(4)} SOL</p>
                </div>
              </div>
            </div>

            {/* USDC ASSET */}
            <div className="glass-dark rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <img src={TOKENS.USDC_DEV.logoUrl} alt="USDC-Dev" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">USD Coin</p>
                  <p className="text-xs text-muted-foreground font-mono">{(usdcBalance || 0).toFixed(2)} USDC</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Send</span>
            </TabsTrigger>
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Receive</span>
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Verify</span>
            </TabsTrigger>
          </TabsList>

          {/* SEND TAB */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Send Assets</CardTitle>
                <CardDescription>Transfer SOL or USDC to another wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSend} className="space-y-4">
                  {/* Token Selector */}
                  <div className="flex p-1 bg-muted rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTokenType('SOL')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${tokenType === 'SOL'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      SOL
                    </button>
                    <button
                      type="button"
                      onClick={() => setTokenType('USDC')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${tokenType === 'USDC'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      USDC
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-500 font-bold">
                        GASLESS
                      </span>
                    </button>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Recipient Address</label>
                    <div className="relative">
                      <Input
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="Enter Solana wallet address"
                        className="pr-10 font-mono text-sm"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQRScanner(true)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        title="Scan QR Code"
                      >
                        <QrCode className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Amount ({tokenType})</label>
                      <span className="text-xs text-muted-foreground">
                        Available: {tokenType === 'SOL' ? (solBalance || 0).toFixed(4) : usdcBalance.toFixed(2)} {tokenType}
                      </span>
                    </div>
                    <Input
                      type="number"
                      step={tokenType === 'SOL' ? '0.001' : '0.01'}
                      min="0"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder={tokenType === 'SOL' ? '0.1' : '10.00'}
                      required
                    />
                  </div>

                  {/* Fee Info */}
                  <div className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">
                      {tokenType === 'SOL'
                        ? '⚡ Transaction fee: ~0.000005 SOL (wallet-paid)'
                        : '✨ Transaction fee: Sponsored by Paymaster (Gasless)'}
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Success */}
                  {txStatus === 'success' && txSignature && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <p className="text-sm font-medium text-green-500 mb-1">Transaction Successful!</p>
                      <a
                        href={getTransactionExplorerUrl(txSignature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        View on Explorer <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={txStatus !== 'idle' && txStatus !== 'error'}
                    variant="gradient"
                    className="w-full"
                    size="lg"
                  >
                    {txStatus === 'signing' && <><LoadingSpinner size="sm" color="white" /> Signing...</>}
                    {txStatus === 'confirming' && <><LoadingSpinner size="sm" color="white" /> Confirming...</>}
                    {txStatus === 'success' && <><Check className="h-4 w-4" /> Success!</>}
                    {(txStatus === 'idle' || txStatus === 'error') && <><Send className="h-4 w-4" /> Send {tokenType}</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RECEIVE TAB */}
          <TabsContent value="receive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* SOL Receive Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                      alt="SOL"
                      className="w-8 h-8"
                    />
                    <div>
                      <CardTitle className="text-foreground">Receive SOL</CardTitle>
                      <CardDescription>Native Solana Token</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-white rounded-lg shadow">
                      {walletAddress ? (
                        <QRCodeSVG value={walletAddress} size={160} level="H" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Wallet Address</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={walletAddress}
                        readOnly
                        className="font-mono text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyAddress(walletAddress)}
                        className="flex-shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <a
                    href={FAUCET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Coins className="h-4 w-4" />
                    Get Devnet SOL (Faucet)
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>

              {/* Token Receive Card */}
              <Card className="glass-strong border-purple-500/20">
                <CardHeader className="pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2775CA]/10 flex items-center justify-center border border-[#2775CA]/30">
                      <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" alt="USDC" className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">Receive USDC</CardTitle>
                      <CardDescription>Get your address to receive gasless USDC</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Account Status and Setup */}
                  {!selectedAtaExists ? (
                    <div className="space-y-4">
                      {/* Warning Banner */}
                      <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/10">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-amber-500/20 flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-400">Cannot Receive USDC Yet!</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                              You need to initialize your USDC account first. Without this, wallets like Phantom <strong>will fail</strong> when trying to send USDC to you.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Setup Card */}
                      <div className="p-5 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            1
                          </div>
                          <div>
                            <p className="text-base font-bold text-foreground">Initialize USDC Account</p>
                            <p className="text-xs text-muted-foreground">One-time setup • Requires ~0.002 SOL for rent</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          Solana requires a token account (ATA) to hold SPL tokens like USDC. This creates your personal USDC vault on the blockchain.
                        </p>

                        <Button
                          onClick={() => createTokenAta()}
                          disabled={creatingAta}
                          className="w-full font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/20"
                          size="lg"
                        >
                          {creatingAta ? (
                            <>
                              <LoadingSpinner size="sm" color="white" />
                              <span className="ml-2">Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <Coins className="h-4 w-4 mr-2" />
                              Initialize USDC Account
                            </>
                          )}
                        </Button>

                        {/* Get SOL hint */}
                        <p className="text-[11px] text-muted-foreground text-center mt-3">
                          Need SOL? Get some from the <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Solana Faucet</a> first.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Success Badge */}
                      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-green-500/10 border border-green-500/30 w-fit mx-auto">
                        <Check className="h-4 w-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">USDC Account Ready</span>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-white/5">
                          {selectedAta ? (
                            <QRCodeSVG value={selectedAta} size={180} level="H" />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                            </div>
                          )}
                        </div>

                        <div className="text-center">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            Your USDC Address
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Send USDC-Dev to this address from Phantom or any wallet
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Display */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">USDC Token Address</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={selectedAta || 'Initialize account first...'}
                        readOnly
                        className="font-mono text-xs flex-1 bg-white/5 border-white/10 h-11"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => copyAta(selectedAta || '')}
                        className="h-11 w-11 shrink-0"
                        disabled={!selectedAtaExists}
                      >
                        {copiedAta ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Faucet Link */}
                  {selectedAtaExists && (
                    <a
                      href={TOKENS.USDC_DEV.faucetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20"
                    >
                      <Coins className="h-5 w-5" />
                      Get USDC-Dev from Faucet
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VERIFY TAB */}
          <TabsContent value="verify">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Shield className="h-5 w-5" />
                  Verify Wallet Ownership
                </CardTitle>
                <CardDescription>
                  Sign a message with your passkey to prove wallet ownership. No transaction fees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignMessage} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Message to Sign</label>
                    <Input
                      value={messageToSign}
                      onChange={(e) => setMessageToSign(e.target.value)}
                      placeholder="Enter a message (e.g., Hello LazorKit)"
                      className="font-mono"
                      required
                    />
                  </div>

                  {signError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                      <p className="text-sm text-destructive">{signError}</p>
                    </div>
                  )}

                  {signStatus === 'success' && signature && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
                      <p className="text-sm font-medium text-green-500 flex items-center gap-2">
                        <Check className="h-4 w-4" /> Message Signed Successfully!
                      </p>
                      <div className="bg-background/50 p-2 rounded">
                        <p className="font-mono text-xs text-foreground break-all">{signature}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={signStatus !== 'idle' && signStatus !== 'error'}
                    variant="gradient"
                    className="w-full"
                    size="lg"
                  >
                    {signStatus === 'signing' && <><LoadingSpinner size="sm" color="white" /> Signing...</>}
                    {signStatus === 'success' && <><Check className="h-4 w-4" /> Signed!</>}
                    {(signStatus === 'idle' || signStatus === 'error') && <><Shield className="h-4 w-4" /> Sign Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />
    </AppLayout >
  );
}
