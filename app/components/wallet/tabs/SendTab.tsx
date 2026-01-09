'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { LAMPORTS_PER_SOL, SystemProgram, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { Send, QrCode, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { useBalance } from '../../../contexts/BalanceContext';
import { useTokens } from '../../../contexts/TokenContext';
import { useTransactionSigning } from '../../../lib/hooks/useTransactionSigning';
import { parseError } from '../../../lib/utils/errorHandling';
import { getTransactionExplorerUrl } from '../../../lib/utils/explorerUrls';
import { TOKENS as TOKEN_CONSTANTS } from '../../../lib/constants/tokens';
import { getOrCreateAssociatedTokenAccountInstruction, createSPLTransferInstruction } from '../../../lib/utils/tokenUtils';
import { getConnection } from '../../../lib/rpc/connection';
import { WALLET_EVENTS, dispatchWalletEvent } from '../../../lib/events/walletEvents';

interface SendTabProps {
    onShowScanner: () => void;
    recipientAddress: string;
    setRecipientAddress: (val: string) => void;
}

type TokenType = 'SOL' | 'USDC';

export default function SendTab({ onShowScanner, recipientAddress, setRecipientAddress }: SendTabProps) {
    const { smartWalletPubkey } = useWallet();
    const { signTransaction } = useTransactionSigning();
    const { balance: solBalance, refreshBalance } = useBalance();
    const { tokens, refreshTokens } = useTokens();

    const [tokenType, setTokenType] = useState<TokenType>('SOL');
    const [sendAmount, setSendAmount] = useState('');
    const [txStatus, setTxStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const usdcToken = tokens.find((t) => t.symbol === 'USDC');
    const usdcBalance = usdcToken?.balance || 0;

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
                const usdcMint = new PublicKey(TOKEN_CONSTANTS.USDC_DEV.mint);
                const { address: senderAta, tokenProgramId } = await getOrCreateAssociatedTokenAccountInstruction(
                    connection, usdcMint, smartWalletPubkey, smartWalletPubkey, true
                );
                const { address: recipientAta, instruction: createAtaIx } = await getOrCreateAssociatedTokenAccountInstruction(
                    connection, usdcMint, recipientPubkey, smartWalletPubkey, true
                );
                if (createAtaIx) {
                    const RENT_EXEMPT_MIN = 0.0021;
                    if (solBalance !== null && solBalance < RENT_EXEMPT_MIN) {
                        throw new Error(`Recipient needs a USDC account, but you have insufficient SOL for the account creation rent. You need at least ${RENT_EXEMPT_MIN} SOL.`);
                    }
                    instructions.push(createAtaIx);
                }
                instructions.push(createSPLTransferInstruction(senderAta, recipientAta, smartWalletPubkey, amountVal, TOKEN_CONSTANTS.USDC_DEV.decimals, tokenProgramId));
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

            setTimeout(() => {
                setSendAmount('');
                setRecipientAddress('');
                setTxStatus('idle');
                setTxSignature(null);
                refreshBalance();
                refreshTokens();
            }, 3000);
        } catch (err: unknown) {
            setTxStatus('error');
            const parsed = parseError(err);
            setError(parsed.userFriendly || parsed.message || 'Transaction failed');
        }
    }, [smartWalletPubkey, solBalance, usdcBalance, tokenType, sendAmount, recipientAddress, signTransaction, setRecipientAddress, refreshBalance, refreshTokens]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-foreground">Send Assets</CardTitle>
                <CardDescription>Transfer SOL or USDC to another wallet</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="flex p-1.5 bg-muted/20 rounded-xl backdrop-blur-md border border-white/5">
                        <button
                            type="button"
                            onClick={() => setTokenType('SOL')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${tokenType === 'SOL'
                                ? 'bg-background text-foreground shadow-[0_4px_15px_rgba(0,0,0,0.5)] scale-[1.03] border border-white/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            SOL
                        </button>
                        <button
                            type="button"
                            onClick={() => setTokenType('USDC')}
                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${tokenType === 'USDC'
                                ? 'bg-background text-foreground shadow-[0_4px_15px_rgba(0,0,0,0.5)] scale-[1.03] border border-white/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            USDC
                            <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-500 font-bold border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                GASLESS
                            </span>
                        </button>
                    </div>

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
                                onClick={onShowScanner}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            >
                                <QrCode className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

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

                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground">
                            {tokenType === 'SOL'
                                ? '⚡ Transaction fee: ~0.000005 SOL (wallet-paid)'
                                : '✨ Transaction fee: Sponsored by Paymaster (Gasless)'}
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

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
    );
}
