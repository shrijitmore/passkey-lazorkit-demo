'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Menu, X } from 'lucide-react';
import AppSidebar from './AppSidebar';

export default function AppHeader() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserInitials = () => {
    if (smartWalletPubkey) {
      return smartWalletPubkey.toString().substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 sm:h-16 shrink-0 items-center gap-3 sm:gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">LazorKit Demo</h1>
          {isConnected && (
            <Badge variant="success" className="hidden sm:inline-flex text-xs">
              Connected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {isConnected && smartWalletPubkey && (
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-xs font-semibold text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-xs sm:text-sm font-medium text-foreground">
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
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="fixed left-0 top-0 bottom-0 w-64 sm:w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

