'use client';

import { useWallet } from '@lazorkit/wallet';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';

const EXPLORER_URL = 'https://explorer.solana.com';

export default function ProfilePage() {
  const { smartWalletPubkey, isConnected, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!smartWalletPubkey) return;
    try {
      await navigator.clipboard.writeText(smartWalletPubkey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Silently handle copy errors
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

  return (
    <AppLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Profile</h1>
        <p className="text-sm text-muted-foreground md:text-base">Manage your wallet and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Wallet Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Wallet Information</CardTitle>
            <CardDescription>Your wallet details and network information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Wallet Address</label>
              <div className="flex items-center gap-2">
                <Input
                  value={smartWalletPubkey?.toString() || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
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

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Network</label>
                <Input value="Solana Devnet" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Wallet Type</label>
                <Input value="Smart Wallet (LazorKit)" readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Authentication</label>
              <Input value="Passkey (WebAuthn)" readOnly />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
            <CardContent className="p-6">
              <a
                href={`${EXPLORER_URL}/address/${smartWalletPubkey?.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between"
              >
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">View on Explorer</h3>
                  <p className="text-sm text-muted-foreground">See your wallet on Solana Explorer</p>
                </div>
                <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">Disconnect Wallet</h3>
                  <p className="text-sm text-muted-foreground">Disconnect your wallet from this application</p>
                </div>
                <Button variant="outline" onClick={disconnect} className="w-full sm:w-auto">
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
