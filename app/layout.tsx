import type { ReactNode } from 'react';
import LazorkitProviderWrapper from './components/LazorkitProviderWrapper';

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
