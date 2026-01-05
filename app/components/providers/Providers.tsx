'use client';

import { ReactNode } from 'react';
import LazorkitProviderWrapper from './LazorkitProviderWrapper';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { BalanceProvider } from '../../contexts/BalanceContext';

/**
 * Combined Providers Wrapper
 * 
 * Wraps the app with ThemeProvider, LazorkitProviderWrapper, and BalanceProvider.
 * This must be a client component since all providers use React hooks.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LazorkitProviderWrapper>
        <BalanceProvider>
          {children}
        </BalanceProvider>
      </LazorkitProviderWrapper>
    </ThemeProvider>
  );
}

