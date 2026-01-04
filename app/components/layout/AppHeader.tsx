'use client';

import { useWallet } from '@lazorkit/wallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

export default function AppHeader() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const getUserInitials = () => {
    if (smartWalletPubkey) {
      return smartWalletPubkey.toString().substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-base font-semibold text-foreground md:text-lg">LazorKit Demo</h1>
        {isConnected && (
          <Badge variant="success" className="hidden sm:inline-flex">
            Connected
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isConnected && smartWalletPubkey && (
          <div className="hidden items-center gap-3 sm:flex">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-semibold text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {smartWalletPubkey.toString().substring(0, 6)}...
                {smartWalletPubkey.toString().slice(-4)}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

