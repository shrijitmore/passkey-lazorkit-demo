'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Shield, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { parseError } from '../../../lib/utils/errorHandling';

export default function VerifyTab() {
    const { signMessage } = useWallet();
    const [messageToSign, setMessageToSign] = useState('');
    const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
    const [signature, setSignature] = useState<string | null>(null);
    const [signError, setSignError] = useState<string | null>(null);

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

    return (
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
    );
}
