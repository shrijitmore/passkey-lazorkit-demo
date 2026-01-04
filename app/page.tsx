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

// Configuration constants
const RPC_URL = 'https://api.devnet.solana.com';
const BALANCE_POLL_INTERVAL = 30000; // 30 seconds

/**
 * Dashboard Page Component
 * 
 * Main landing page showing:
 * - Wallet connection prompt (if not connected)
 * - Balance overview
 * - Subscription statistics
 * - Quick action cards
 * - Recent transaction history
 * 
 * Mobile Optimizations:
 * - Responsive grid layouts
 * - Touch-friendly buttons
 * - Mobile-optimized card layouts
 * - Responsive typography
 */
export default function DashboardPage() {
  const { isConnected, smartWalletPubkey, connect, isConnecting } = useWallet();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
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
    if (isConnected && smartWalletPubkey) {
      const unsubscribe = listenWalletEvent(WALLET_EVENTS.TRANSACTION_COMPLETED, () => {
        // Refresh balance immediately after transaction
        fetchBalance();
      });
      return unsubscribe;
    }
  }, [isConnected, smartWalletPubkey, fetchBalance]);

  /**
   * Effect: Update subscription count when wallet connects/disconnects
   * 
   * - Counts active subscriptions from localStorage
   * - Updates count when wallet state changes
   */
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const subs = getSubscriptions(smartWalletPubkey.toString());
      // Count only active subscriptions
      setSubscriptionCount(subs.filter(s => s.status === 'active').length);
    } else {
      setSubscriptionCount(0);
    }
  }, [isConnected, smartWalletPubkey]);

  /**
   * Handle wallet connection
   * 
   * Validates WebAuthn support and HTTPS before connecting
   */
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
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">Welcome to LazorKit</h2>
          <p className="mb-8 max-w-md text-lg text-muted-foreground">
            Connect your wallet with passkey authentication to get started. No passwords, no seed phrases - just your fingerprint or face.
          </p>
          <Button onClick={handleConnect} disabled={isConnecting} size="lg" variant="gradient" className="shadow-lg">
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect with Passkey'
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 md:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground md:text-base">Welcome back! Here's your wallet overview.</p>
          </div>

          {/* Balance Card */}
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardDescription className="text-muted-foreground">Total Balance</CardDescription>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 shadow-md">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    {isLoadingBalance && balance === null ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <CardTitle className="text-2xl text-foreground">0.0000</CardTitle>
                      </div>
                    ) : (
                      <CardTitle className="text-2xl text-foreground">
                        {balance !== null ? balance.toFixed(4) : '0.0000'} SOL
                      </CardTitle>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <CardDescription className="text-muted-foreground">USD Equivalent</CardDescription>
                  <p className="text-xl font-semibold text-foreground">${usdEquivalent}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Grid */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Balance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {balance !== null ? balance.toFixed(2) : '0.00'} SOL
                </div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{subscriptionCount}</div>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md sm:col-span-2 md:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Transactions</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">Recent</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card 
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg" 
                onClick={() => router.push('/wallet')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="mb-1 text-foreground">Send SOL</CardTitle>
                      <CardDescription>Transfer funds</CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
              <Card 
                className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg" 
                onClick={() => router.push('/subscription')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="mb-1 text-foreground">Subscriptions</CardTitle>
                      <CardDescription>Manage plans</CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-foreground">Recent Transactions</h3>
            <TransactionHistory />
          </div>
        </>
      )}
    </AppLayout>
  );
}
