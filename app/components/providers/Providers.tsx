'use client';

import { ReactNode } from 'react';
import LazorkitProviderWrapper from './LazorkitProviderWrapper';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { BalanceProvider } from '../../contexts/BalanceContext';
import { TokenProvider } from '../../contexts/TokenContext';

/**
 * Combined Providers Wrapper
 * 
 * Wraps the app with ThemeProvider, LazorkitProviderWrapper, BalanceProvider, and TokenProvider.
 * This must be a client component since all providers use React hooks.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LazorkitProviderWrapper>
        <BalanceProvider>
          <TokenProvider>
            {children}
          </TokenProvider>
        </BalanceProvider>
      </LazorkitProviderWrapper>
    </ThemeProvider>
  );
}

