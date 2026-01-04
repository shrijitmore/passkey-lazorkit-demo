'use client';

import { ReactNode, useState } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Main application layout component
 * 
 * Features:
 * - Responsive sidebar (desktop: always visible, mobile: drawer menu)
 * - Mobile hamburger menu integration
 * - Consistent header across all pages
 * - Proper overflow handling for mobile and desktop
 */
export default function AppLayout({ children }: AppLayoutProps) {
  // State to control mobile sidebar visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - Hidden on mobile, visible on large screens */}
      <aside className="hidden lg:block lg:relative lg:z-0">
        <AppSidebar />
      </aside>

      {/* Mobile Sidebar Overlay - Visible when menu is open on mobile */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Mobile sidebar drawer */}
          <aside className="fixed left-0 top-0 z-50 h-full w-64 lg:hidden">
            <AppSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-0">
        {/* Header with mobile menu button */}
        <AppHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        
        {/* Main content with responsive padding */}
        <main className="flex-1 overflow-y-auto relative z-0">
          <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

