'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Download, Copy, Check, Loader2, Coins, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { getConnection } from '../../../lib/rpc/connection';
import { useCopyToClipboard } from '../../../lib/hooks/useCopyToClipboard';
import { useTransactionSigning } from '../../../lib/hooks/useTransactionSigning';
import { useTokens } from '../../../contexts/TokenContext';
import { TOKENS } from '../../../lib/constants/tokens';
import { FAUCET_URL } from '../../../lib/constants/urls';
import { getOrCreateAssociatedTokenAccountInstruction } from '../../../lib/utils/tokenUtils';
import { parseError } from '../../../lib/utils/errorHandling';

export default function ReceiveTab() {
    const { smartWalletPubkey } = useWallet();
    const { signTransaction } = useTransactionSigning();
    const { refreshTokens } = useTokens();

    const [usdcAta, setUsdcAta] = useState<string>('');
    const [usdcAtaExists, setUsdcAtaExists] = useState<boolean>(false);
    const [creatingAta, setCreatingAta] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const walletAddress = smartWalletPubkey?.toString() || '';
    const { copy: copyAddress, copied } = useCopyToClipboard();
    const { copy: copyAta, copied: copiedAta } = useCopyToClipboard();

    useEffect(() => {
        const fetchAtas = async () => {
            if (smartWalletPubkey) {
                const connection = getConnection();
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

    const createTokenAta = async () => {
        if (!smartWalletPubkey) return;

        setCreatingAta(true);
        setError(null);

        try {
            const connection = getConnection();
            const mint = new PublicKey(TOKENS.USDC_DEV.mint);

            const { address, instruction } = await getOrCreateAssociatedTokenAccountInstruction(
                connection,
                mint,
                smartWalletPubkey,
                smartWalletPubkey,
                true
            );

            if (!instruction) {
                setUsdcAtaExists(true);
                setCreatingAta(false);
                return;
            }

            await signTransaction({
                instructions: [instruction],
                onError: (err) => {
                    const parsed = parseError(err);
                    setError(parsed.userFriendly || parsed.message);
                },
            });

            setUsdcAtaExists(true);
            setUsdcAta(address.toString());
            setTimeout(() => refreshTokens(), 2000);
        } catch (err) {
            console.error(`Failed to create USDC account:`, err);
            const parsed = parseError(err);
            if (parsed.message && (parsed.message.includes('0x0') || parsed.message.includes('already in use'))) {
                setUsdcAtaExists(true);
            } else if (parsed.code === 'INSUFFICIENT_FUNDS' || (parsed.message && (parsed.message.includes('0x1') || parsed.message.includes('Insufficient SOL')))) {
                setError('Insufficient SOL for account rent (~0.002 SOL). Please use the Faucet to get some SOL.');
            } else {
                setError(parsed.userFriendly || parsed.message || `Failed to create USDC account`);
            }
        } finally {
            setCreatingAta(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SOL Receive Card */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" className="w-8 h-8" />
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
                            <Input value={walletAddress} readOnly className="font-mono text-xs flex-1" />
                            <Button variant="outline" size="icon" onClick={() => copyAddress(walletAddress)}>
                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
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
                    {!usdcAtaExists ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-amber-500/10">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-full bg-amber-500/20 flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-400">Cannot Receive USDC Yet!</p>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">You need to initialize your USDC account first.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                                <Button onClick={createTokenAta} disabled={creatingAta} className="w-full font-bold bg-gradient-to-r from-blue-600 to-cyan-500" size="lg">
                                    {creatingAta ? <><LoadingSpinner size="sm" color="white" /> Creating...</> : <><Coins className="h-4 w-4 mr-2" /> Initialize USDC Account</>}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="p-4 bg-white rounded-2xl shadow-2xl inline-block mx-auto">
                                <QRCodeSVG value={usdcAta} size={180} level="H" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Your USDC Address</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">USDC Address</label>
                        <div className="flex items-center gap-2">
                            <Input value={usdcAta || 'Initialize account first...'} readOnly className="font-mono text-xs flex-1" />
                            <Button variant="secondary" size="icon" onClick={() => copyAta(usdcAta || '')} disabled={!usdcAtaExists}>
                                {copiedAta ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    {usdcAtaExists && (
                        <a href={TOKENS.USDC_DEV.faucetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                            <Coins className="h-5 w-5" /> Get USDC-Dev from Faucet
                        </a>
                    )}
                    {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                </CardContent>
            </Card>
        </div>
    );
}
