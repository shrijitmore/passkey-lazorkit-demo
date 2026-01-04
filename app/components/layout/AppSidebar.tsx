'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Wallet, CreditCard, User, LogOut } from 'lucide-react';
import { useWallet } from '@lazorkit/wallet';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Wallet', href: '/wallet', icon: <Wallet className="h-5 w-5" /> },
  { title: 'Subscription', href: '/subscription', icon: <CreditCard className="h-5 w-5" /> },
  { title: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { disconnect, smartWalletPubkey, isConnected } = useWallet();

  const handleLogout = () => {
    disconnect();
    router.push('/');
    onNavigate?.();
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const getUserInitials = () => {
    if (smartWalletPubkey) {
      return smartWalletPubkey.toString().substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex h-screen w-64 sm:w-72 lg:w-64 shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 border-b border-border px-4 sm:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span className="text-base sm:text-lg font-semibold text-foreground">LazorKit</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'flex w-full items-center gap-2 sm:gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className={cn(isActive && 'text-cyan-400')}>{item.icon}</span>
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-3 sm:p-4">
        {isConnected && smartWalletPubkey && (
          <div className="mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-sm font-semibold text-white">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs sm:text-sm font-medium text-foreground">
                {smartWalletPubkey.toString().substring(0, 4)}...
                {smartWalletPubkey.toString().slice(-4)}
              </p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
          </div>
        )}
        <Separator className="my-3 sm:my-4" />
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 sm:gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

