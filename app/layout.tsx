import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Providers from './components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'LazorKit Demo - Passkey Authentication & Smart Wallet',
  description: 'Experience the future of Solana UX with passkey authentication and smart wallet transactions powered by LazorKit SDK',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' }
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
