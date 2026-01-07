/**
 * Dashboard Page
 * 
 * Main dashboard showing portfolio overview:
 * - Total Portfolio Value (SOL + all SPL tokens)
 * - Individual asset balances (dynamically shows ALL tokens)
 * - Recent transaction history
 * - Navigation to Wallet and Subscriptions
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { useRouter } from 'next/navigation';
import { Wallet, Send, CreditCard, ArrowRight, RefreshCw, Coins } from 'lucide-react';
import AppLayout from './components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import TransactionHistory from './components/wallet/TransactionHistory';
import { getSubscriptions } from './lib/subscription/storage';
import { useBalance } from './contexts/BalanceContext';
import { useWebAuthnConnection } from './lib/hooks/useWebAuthnConnection';
import { useAllTokenBalances } from './lib/hooks/useAllTokenBalances';
import { useSolPrice } from './lib/hooks/useSolPrice';
import LoadingSpinner from './components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { connect, isConnecting } = useWebAuthnConnection();
  const { balance: solBalance, isLoadingBalance: isLoadingSol, refreshBalance: refreshSol } = useBalance();
  const { tokens, isLoading: isLoadingTokens, refresh: refreshTokens } = useAllTokenBalances(smartWalletPubkey);
  const { price: solPrice } = useSolPrice();
  const router = useRouter();
  const [subscriptionCount, setSubscriptionCount] = useState(0);

  // Fetch tokens when wallet connects
  useEffect(() => {
    if (smartWalletPubkey) {
      const timer = setTimeout(() => refreshTokens(), 1500);
      return () => clearTimeout(timer);
    }
  }, [smartWalletPubkey]);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      const subs = getSubscriptions(smartWalletPubkey.toString());
      setSubscriptionCount(subs.filter(s => s.status === 'active').length);
    } else {
      setSubscriptionCount(0);
    }
  }, [isConnected, smartWalletPubkey]);

  const handleConnect = async () => {
    await connect();
  };

  const refreshAll = () => {
    refreshSol();
    refreshTokens();
  };

  // Calculate portfolio value (SOL + all tokens assumed $1 each for stablecoins)
  const portfolioValue = useMemo(() => {
    const solVal = (solBalance || 0) * solPrice;
    // For tokens, assume stablecoins are $1
    const tokensVal = tokens.reduce((sum, token) => {
      if (token.symbol === 'USDC' || token.symbol === 'USDT') {
        return sum + token.balance;
      }
      return sum; // Unknown tokens not counted in USD value
    }, 0);
    return solVal + tokensVal;
  }, [solBalance, tokens, solPrice]);

  const isLoading = isLoadingSol || isLoadingTokens;

  return (
    <AppLayout>
      {!isConnected ? (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center px-4">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground">Welcome to LazorKit</h2>
          <p className="mb-8 max-w-md text-lg text-muted-foreground">
            Connect your wallet with passkey authentication. No passwords, no seed phrases.
          </p>
          <Button onClick={handleConnect} disabled={isConnecting} size="lg" variant="gradient" className="shadow-lg">
            {isConnecting ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span className="ml-2">Connecting...</span>
              </>
            ) : (
              'Connect with Passkey'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Your portfolio overview</p>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshAll} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Total Portfolio Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground">Total Portfolio Value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-foreground">
                  ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-muted-foreground text-sm">USD</span>
              </div>
            </CardContent>
          </Card>

          {/* Asset Cards */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Assets</h3>

            {/* SOL Card */}
            <Card className="hover:border-purple-500/30 transition-colors">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <img
                      src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                      alt="SOL"
                      className="w-7 h-7"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Solana</p>
                    <p className="text-xl font-bold text-foreground truncate">
                      {(solBalance || 0).toFixed(4)} SOL
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${((solBalance || 0) * solPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Token Cards */}
            {tokens.map((token) => (
              <Card key={token.mint} className="hover:border-blue-500/30 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {token.logoUrl ? (
                        <img src={token.logoUrl} alt={token.symbol} className="w-7 h-7" />
                      ) : (
                        <Coins className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{token.name}</p>
                      <p className="text-xl font-bold text-foreground truncate">
                        {token.balance.toFixed(token.decimals > 4 ? 4 : 2)} {token.symbol}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-muted-foreground">Value</p>
                      <p className="text-lg font-semibold text-foreground">
                        {token.symbol === 'USDC' || token.symbol === 'USDT'
                          ? `$${token.balance.toFixed(2)}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty state for tokens */}
            {tokens.length === 0 && !isLoadingTokens && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No SPL tokens yet. Get some from a faucet!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg group"
              onClick={() => router.push('/wallet')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Send className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">Send & Receive</CardTitle>
                      <CardDescription>Transfer assets</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg group"
              onClick={() => router.push('/subscription')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-foreground">Subscriptions</CardTitle>
                      <CardDescription>{subscriptionCount} active plan{subscriptionCount !== 1 ? 's' : ''}</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Recent Transactions</h3>
            <TransactionHistory />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
