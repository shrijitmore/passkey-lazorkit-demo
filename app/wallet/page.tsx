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
  const { copy: copyUsdcAta, copied: copiedUsdc } = useCopyToClipboard();

  // Fetch USDC ATA address and check if it exists
  useEffect(() => {
    const fetchAta = async () => {
      if (smartWalletPubkey) {
        try {
          const connection = getConnection();
          const usdcMint = new PublicKey(TOKENS.USDC.mint);
          // allowOwnerOffCurve: true is required because LazorKit smart wallets are PDAs
          const ata = await getAssociatedTokenAddress(usdcMint, smartWalletPubkey, true);
          setUsdcAta(ata.toString());

          // Check if ATA actually exists on-chain
          try {
            const accountInfo = await connection.getAccountInfo(ata);
            setUsdcAtaExists(accountInfo !== null);
          } catch {
            setUsdcAtaExists(false);
          }
        } catch (e) {
          console.error('Failed to get USDC ATA:', e);
          setUsdcAta(smartWalletPubkey.toString());
          setUsdcAtaExists(false);
        }
      }
    };
    fetchAta();
  }, [smartWalletPubkey]);

  // Fetch tokens on mount
  useEffect(() => {
    if (smartWalletPubkey) {
      const timer = setTimeout(() => refreshTokens(), 1000);
      return () => clearTimeout(timer);
    }
  }, [smartWalletPubkey]);

  // Helper to get USDC balance from tokens array
  const usdcToken = tokens.find(t => t.symbol === 'USDC');
  const usdcBalance = usdcToken?.balance || 0;

  const refreshAll = () => {
    refreshSol();
    refreshTokens();
  };

  // Create USDC ATA - THIS IS THE KEY MISSING PIECE!
  // The ATA must exist on-chain before tokens can be received
  const createUsdcAta = async () => {
    if (!smartWalletPubkey) return;

    setCreatingAta(true);
    setError(null);

    try {
      const connection = getConnection();
      const usdcMint = new PublicKey(TOKENS.USDC.mint);

      const { address, instruction } = await getOrCreateAssociatedTokenAccountInstruction(
        connection,
        usdcMint,
        smartWalletPubkey,
        smartWalletPubkey
      );

      if (!instruction) {
        // ATA already exists
        setUsdcAtaExists(true);
        setCreatingAta(false);
        return;
      }

      // Sign and send the transaction to create the ATA
      await signTransaction({
        instructions: [instruction],
        onError: (err) => {
          const parsed = parseError(err);
          setError(parsed.userFriendly || parsed.message);
        },
      });

      // Update state
      setUsdcAtaExists(true);
      setUsdcAta(address.toString());

      // Refresh tokens to pick up the new account
      setTimeout(() => refreshTokens(), 2000);
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.userFriendly || parsed.message || 'Failed to create token account');
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
        const usdcMint = new PublicKey(TOKENS.USDC.mint);
        const { address: senderAta } = await getOrCreateAssociatedTokenAccountInstruction(
          connection, usdcMint, smartWalletPubkey, smartWalletPubkey
        );
        const { address: recipientAta, instruction: createAtaIx } = await getOrCreateAssociatedTokenAccountInstruction(
          connection, usdcMint, recipientPubkey, smartWalletPubkey
        );
        if (createAtaIx) instructions.push(createAtaIx);
        instructions.push(createSPLTransferInstruction(senderAta, recipientAta, smartWalletPubkey, amountVal, TOKENS.USDC.decimals));
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
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                  alt="SOL"
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-xs text-muted-foreground">SOL Balance</p>
                  <p className="text-lg font-bold text-foreground">{(solBalance || 0).toFixed(4)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={TOKENS.USDC.logoUrl} alt="USDC" className="w-8 h-8" />
                <div>
                  <p className="text-xs text-muted-foreground">USDC Balance</p>
                  <p className="text-lg font-bold text-foreground">{usdcBalance.toFixed(2)}</p>
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

              {/* USDC Receive Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={TOKENS.USDC.logoUrl} alt="USDC" className="w-8 h-8" />
                      <div>
                        <CardTitle className="text-foreground">Receive USDC</CardTitle>
                        <CardDescription>SPL Token (Devnet)</CardDescription>
                      </div>
                    </div>
                    {/* Account status indicator */}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${usdcAtaExists
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                      {usdcAtaExists ? '✓ Ready' : '⚠ Setup Required'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show Create Account button if ATA doesn't exist */}
                  {!usdcAtaExists && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-3">
                      <p className="text-sm text-yellow-500 font-medium">
                        ⚠️ Token Account Required
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Before you can receive USDC, you need to create a token account.
                        This is a one-time setup that requires a small transaction.
                      </p>
                      <Button
                        onClick={createUsdcAta}
                        disabled={creatingAta}
                        variant="gradient"
                        className="w-full"
                      >
                        {creatingAta ? (
                          <>
                            <LoadingSpinner size="sm" color="white" />
                            <span className="ml-2">Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <Coins className="h-4 w-4 mr-2" />
                            Create USDC Account
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* QR Code and Address (always show, but indicate if not ready) */}
                  <div className="flex justify-center">
                    <div className={`p-3 bg-white rounded-lg shadow ${!usdcAtaExists ? 'opacity-50' : ''}`}>
                      {usdcAta ? (
                        <QRCodeSVG value={usdcAta} size={160} level="H" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">USDC Token Account</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={usdcAta}
                        readOnly
                        className="font-mono text-xs flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyUsdcAta(usdcAta)}
                        className="flex-shrink-0"
                      >
                        {copiedUsdc ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Faucet link - only enabled when account exists */}
                  <a
                    href="https://spl-token-faucet.com/?token-name=USDC-Devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${usdcAtaExists
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-muted text-muted-foreground cursor-not-allowed pointer-events-none'
                      }`}
                  >
                    <Coins className="h-4 w-4" />
                    Get Devnet USDC (Faucet)
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {usdcAtaExists && (
                    <p className="text-xs text-center text-green-500">
                      ✓ Your account is ready to receive USDC!
                    </p>
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
