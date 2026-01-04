'use client';

import { ReactNode } from 'react';
import LazorkitProviderWrapper from './LazorkitProviderWrapper';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * Combined Providers Wrapper
 * 
 * Wraps the app with both ThemeProvider and LazorkitProviderWrapper.
 * This must be a client component since both providers use React hooks.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LazorkitProviderWrapper>
        {children}
      </LazorkitProviderWrapper>
    </ThemeProvider>
  );
}

