'use client';

import WalletPanel from '@/app/components/WalletPanel';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col gap-6 items-center">
        <h1 className="text-2xl font-semibold mb-4">
          Passkey + LazorKit Demo
        </h1>
        <p className="text-gray-600 mb-4">
          Connect your wallet using passkey authentication
        </p>
        <WalletPanel />
      </div>
    </main>
  );
}
