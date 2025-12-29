'use client';

import { useEffect, useState } from 'react';
import {
  registerPasskey,
  authenticatePasskey,
  hasPasskey,
} from '@/app/lib/passkey';

export default function PasskeyAuth({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Run only in browser after mount
  useEffect(() => {
    setMounted(true);
    setRegistered(hasPasskey());
  }, []);

  // Prevent SSR / hydration issues
  if (!mounted) {
    return null;
  }

  async function handleRegister() {
    setLoading(true);
    try {
      await registerPasskey();
      setRegistered(true);
      onAuthenticated();
    } catch (err) {
      console.error(err);
      alert('Passkey registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    try {
      await authenticatePasskey();
      onAuthenticated();
    } catch (err) {
      console.error(err);
      alert('Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!registered ? (
        <button
          onClick={handleRegister}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Create account with Passkey
        </button>
      ) : (
        <button
          onClick={handleLogin}
          disabled={loading}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Login with Passkey
        </button>
      )}
    </div>
  );
}
