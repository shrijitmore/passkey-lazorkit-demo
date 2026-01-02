import type { ReactNode } from 'react';
import LazorkitProviderWrapper from './components/LazorkitProviderWrapper';
import { ThemeProvider } from './contexts/ThemeContext';
import './globals.css';

export const metadata = {
  title: 'LazorKit Demo - Passkey Authentication & Smart Wallet',
  description: 'Experience the future of Solana UX with passkey authentication and smart wallet transactions powered by LazorKit SDK',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <LazorkitProviderWrapper>
            {children}
          </LazorkitProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
