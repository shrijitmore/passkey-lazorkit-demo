'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useRouter } from 'next/navigation';
import { Wallet, Send, CreditCard, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import AppLayout from './components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import TransactionHistory from './components/TransactionHistory';
import { getSubscriptions } from './lib/subscription/storage';
import { WALLET_EVENTS, listenWalletEvent } from './lib/events/walletEvents';

const RPC_URL = 'https://api.devnet.solana.com';

export default function DashboardPage() {
  const { isConnected, smartWalletPubkey, connect, isConnecting } = useWallet();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const prevPubkeyRef = useRef<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!smartWalletPubkey) return;
    setIsLoadingBalance(true);
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const balance = await connection.getBalance(smartWalletPubkey);
      const balanceInSol = balance / LAMPORTS_PER_SOL;
      setBalance(prev => {
        if (prev === null) return balanceInSol;
        const prevRounded = Math.round(prev * 10000) / 10000;
        const newRounded = Math.round(balanceInSol * 10000) / 10000;
        return prevRounded === newRounded ? prev : balanceInSol;
      });
    } catch (err) {
      // Silently handle balance fetch errors
    } finally {
      setIsLoadingBalance(false);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    const pubkeyString = smartWalletPubkey?.toString() || null;
    const pubkeyChanged = prevPubkeyRef.current !== pubkeyString;

    if (pubkeyChanged) {
      prevPubkeyRef.current = pubkeyString;
      if (isConnected && smartWalletPubkey) {
        fetchBalance();
        const interval = setInterval(() => {
          fetchBalance();
        }, 30000);
        return () => clearInterval(interval);
      } else {
        setBalance(null);
      }
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const unsubscribe = listenWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, () => {
        fetchBalance();
      });
      return unsubscribe;
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const subs = getSubscriptions(smartWalletPubkey.toString());
      setSubscriptionCount(subs.filter(s => s.status === 'active').length);
    } else {
      setSubscriptionCount(0);
    }
  }, [isConnected, smartWalletPubkey]);

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      alert('WebAuthn is not supported in this browser. Please use a modern browser.');
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert('WebAuthn requires HTTPS. Please use HTTPS or localhost.');
      return;
    }

    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const usdEquivalent = balance !== null ? (balance * 150).toFixed(2) : '0.00';

  return (
    <AppLayout>
      {!isConnected ? (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center px-4">
          <div className="mb-6 sm:mb-8 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg">
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold text-foreground">Welcome to LazorKit</h2>
          <p className="mb-6 sm:mb-8 max-w-md text-base sm:text-lg text-muted-foreground px-4">
            Connect your wallet with passkey authentication to get started. No passwords, no seed phrases - just your fingerprint or face.
          </p>
          <Button onClick={handleConnect} disabled={isConnecting} size="lg" variant="gradient" className="shadow-lg w-full max-w-xs sm:w-auto">
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2">Connecting...</span>
              </>
            ) : (
              'Connect with Passkey'
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="mb-2 text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Welcome back! Here's your wallet overview.</p>
          </div>

          {/* Balance Card */}
          <Card className="mb-4 sm:mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="p-4 sm:p-6">
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">Total Balance</CardDescription>
              <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 shadow-md">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    {isLoadingBalance && balance === null ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" />
                        <CardTitle className="text-xl sm:text-2xl text-foreground">0.0000</CardTitle>
                      </div>
                    ) : (
                      <CardTitle className="text-xl sm:text-2xl text-foreground">
                        {balance !== null ? balance.toFixed(4) : '0.0000'} SOL
                      </CardTitle>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">USD Equivalent</CardDescription>
                  <p className="text-lg sm:text-xl font-semibold text-foreground">${usdEquivalent}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="mb-4 sm:mb-6 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Balance</CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">
                  {balance !== null ? balance.toFixed(2) : '0.00'} SOL
                </div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Subscriptions</CardTitle>
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">{subscriptionCount}</div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">Transactions</CardTitle>
                <Send className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
                <div className="text-lg sm:text-2xl font-bold text-foreground">Recent</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-4 sm:mb-6">
            <h3 className="mb-3 sm:mb-4 text-base sm:text-xl font-semibold text-foreground">Quick Actions</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <Card 
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg" 
                onClick={() => router.push('/wallet')}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="mb-1 text-sm sm:text-base text-foreground">Send SOL</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Transfer funds</CardDescription>
                    </div>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
              <Card 
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg" 
                onClick={() => router.push('/subscription')}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="mb-1 text-sm sm:text-base text-foreground">Subscriptions</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Manage plans</CardDescription>
                    </div>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="mb-3 sm:mb-4 text-base sm:text-xl font-semibold text-foreground">Recent Transactions</h3>
            <TransactionHistory />
          </div>
        </>
      )}
    </AppLayout>
  );
}
