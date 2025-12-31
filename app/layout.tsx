import type { ReactNode } from 'react';
import LazorkitProviderWrapper from './components/LazorkitProviderWrapper';
import './globals.css';

export const metadata = {
  title: 'LazorKit Demo - Passkey Authentication & Gasless Transactions',
  description: 'Experience the future of Solana UX with passkey authentication and gasless transactions powered by LazorKit SDK',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LazorkitProviderWrapper>
          {children}
        </LazorkitProviderWrapper>
      </body>
    </html>
  );
}
