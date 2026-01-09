'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Send, Download, Shield, RefreshCw } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useBalance } from '../contexts/BalanceContext';
import { useTokens } from '../contexts/TokenContext';
import { TOKENS } from '../lib/constants/tokens';
import QRScanner from '../components/ui/QRScanner';
import SendTab from '../components/wallet/tabs/SendTab';
import ReceiveTab from '../components/wallet/tabs/ReceiveTab';
import VerifyTab from '../components/wallet/tabs/VerifyTab';

export default function WalletPage() {
  const { isConnected } = useWallet();
  const { balance: solBalance, isLoadingBalance: isLoadingSol, refreshBalance: refreshSol } = useBalance();
  const { tokens, isLoadingTokens, refreshTokens } = useTokens();

  // Send form state - kept here to coordinate with QR scanner
  const [recipientAddress, setRecipientAddress] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const usdcToken = tokens.find((t) => t.symbol === 'USDC');
  const usdcBalance = usdcToken?.balance || 0;

  const refreshAll = useCallback(() => {
    refreshSol();
    refreshTokens();
  }, [refreshSol, refreshTokens]);

  const handleScan = useCallback((result: string) => {
    setRecipientAddress(result);
    setShowQRScanner(false);
  }, []);

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
          <TabsList className="flex flex-row w-full h-auto mb-10 sm:mb-8 bg-muted/10 p-1 rounded-2xl backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <TabsTrigger
              value="send"
              className="group flex-1 flex flex-row items-center justify-center gap-1.5 sm:gap-3 py-2.5 sm:py-4 px-1 sm:px-6 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_30px_rgba(var(--primary-rgb),0.7)] data-[state=active]:scale-[1.02] hover:bg-white/5"
            >
              <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-data-[state=active]:scale-110" />
              <span className="font-black tracking-tight text-[9px] sm:text-xs uppercase">Send</span>
            </TabsTrigger>
            <TabsTrigger
              value="receive"
              className="group flex-1 flex flex-row items-center justify-center gap-1.5 sm:gap-3 py-2.5 sm:py-4 px-1 sm:px-6 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_30px_rgba(var(--primary-rgb),0.7)] data-[state=active]:scale-[1.02] hover:bg-white/5"
            >
              <Download className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform group-hover:translate-y-0.5 group-data-[state=active]:scale-110" />
              <span className="font-black tracking-tight text-[9px] sm:text-xs uppercase">Receive</span>
            </TabsTrigger>
            <TabsTrigger
              value="verify"
              className="group flex-1 flex flex-row items-center justify-center gap-1.5 sm:gap-3 py-2.5 sm:py-4 px-1 sm:px-6 rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_30px_rgba(var(--primary-rgb),0.7)] data-[state=active]:scale-[1.02] hover:bg-white/5"
            >
              <Shield className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform group-hover:scale-115 group-data-[state=active]:scale-110" />
              <span className="font-black tracking-tight text-[9px] sm:text-xs uppercase">Verify</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send">
            <SendTab
              onShowScanner={() => setShowQRScanner(true)}
              recipientAddress={recipientAddress}
              setRecipientAddress={setRecipientAddress}
            />
          </TabsContent>

          <TabsContent value="receive">
            <ReceiveTab />
          </TabsContent>

          <TabsContent value="verify">
            <VerifyTab />
          </TabsContent>
        </Tabs>
      </div>

      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />
    </AppLayout>
  );
}
