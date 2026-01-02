# Tutorial 3: Session Persistence Across Devices with LazorKit

This tutorial explains how LazorKit handles session persistence, allowing users to seamlessly reconnect their wallet across different devices and browser sessions.

> **Reference**: Based on [LazorKit useWallet connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect) and [LazorKit Overview](https://docs.lazorkit.com/react-sdk)

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Setup](./tutorial-1-passkey-wallet.md)
- Understanding of WebAuthn and passkeys

## What You'll Learn

- How LazorKit manages sessions
- Auto-reconnect functionality
- Cross-device wallet access
- Session lifecycle management
- Best practices for session handling

## Step 1: Understanding Session Persistence

According to the [LazorKit documentation](https://docs.lazorkit.com/react-sdk), LazorKit provides:

> "Better UX: Seamless session persistence and auto-reconnect"

LazorKit's session management:

- **Remembers users**: After the first connection, users can reconnect without re-authenticating
- **Cross-device access**: The same wallet can be accessed from different devices (if passkey is synced)
- **Secure storage**: Session data is stored securely using WebAuthn credentials
- **Auto-reconnect**: Automatically restores wallet connection on page load

## Step 2: How Auto-Reconnect Works

According to the [useWallet connect API documentation](https://docs.lazorkit.com/react-sdk/use-wallet#connect):

> "Trigger the connection flow. If the user has previously connected, this will try to restore their session automatically without showing a pop-up."

When you call `connect()`, LazorKit:

1. **First checks** if a session exists in secure storage
2. **If session exists**: Attempts to restore it silently
3. **If no session**: Prompts for passkey authentication
4. **On success**: Creates/restores the smart wallet

**Important**: Auto-reconnect only happens when you explicitly call `connect()`. If you want automatic reconnection on page load, you need to call `connect()` in a `useEffect` hook. The default `WalletPanel` component in this repository uses manual connection (user clicks button), but you can implement auto-reconnect as shown below.

Here's how to implement auto-reconnect in code:

```typescript
'use client';

import { useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';

export default function AutoReconnectExample() {
  const {
    isConnected,
    isConnecting,
    connect,
    smartWalletPubkey,
  } = useWallet();

  // Auto-reconnect on mount
  useEffect(() => {
    // This will attempt to restore session if it exists
    // If no session exists, it won't show a prompt
    connect().catch(() => {
      // Silently fail if no session exists
      // User will need to click connect button
    });
  }, []);

  if (isConnecting) {
    return <div>Restoring session...</div>;
  }

  if (isConnected) {
    return (
      <div>
        <p>Wallet connected: {smartWalletPubkey?.toString()}</p>
        <p>Session restored automatically!</p>
      </div>
    );
  }

  return (
    <button onClick={() => connect()}>
      Connect Wallet
    </button>
  );
}
```

## Step 3: Manual Session Management

You can also manually control when to attempt reconnection:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';

export default function ManualSessionManagement() {
  const {
    isConnected,
    connect,
    disconnect,
    smartWalletPubkey,
  } = useWallet();

  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);

  // Attempt reconnect once on mount
  useEffect(() => {
    if (!hasAttemptedReconnect) {
      setHasAttemptedReconnect(true);
      connect().catch(() => {
        // No existing session
        console.log('No existing session found');
      });
    }
  }, [hasAttemptedReconnect]);

  const handleDisconnect = async () => {
    await disconnect();
    // After disconnect, session is cleared
    // Next connect() will require full authentication
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {smartWalletPubkey?.toString()}</p>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect()}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
```

## Step 4: Understanding Session Lifecycle

### Session Creation

1. **First Connection:**
   ```
   User clicks "Connect" 
   → Biometric prompt appears
   → Passkey created/authenticated
   → Smart wallet created/restored
   → Session stored securely
   ```

2. **Subsequent Connections:**
   ```
   User clicks "Connect" OR page loads
   → LazorKit checks for existing session
   → If found: Restores silently (may prompt for biometric)
   → If not found: Full authentication flow
   ```

### Session Storage

LazorKit stores session data securely:
- Uses WebAuthn credentials (passkeys)
- Stored in browser's secure storage
- Never exposes private keys
- Can be synced across devices (if passkey is synced via iCloud/Google)

## Step 5: Cross-Device Access

LazorKit supports cross-device wallet access when:

1. **Passkey is synced**: User's passkey is synced via:
   - iCloud Keychain (iOS/Mac)
   - Google Password Manager (Android/Chrome)
   - Windows Hello (Windows)

2. **Same account**: User uses the same account on both devices

3. **WebAuthn support**: Both devices support WebAuthn

**Example Flow:**
```
Device 1 (iPhone):
1. User connects wallet → Passkey created
2. Passkey synced to iCloud

Device 2 (Mac):
1. User opens app
2. LazorKit detects synced passkey
3. User authenticates with Touch ID
4. Same wallet is restored!
```

## Step 6: Implementing Session State Management

Here's a complete example with proper session state management:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@lazorkit/wallet';

export default function SessionManager() {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    smartWalletPubkey,
    error,
  } = useWallet();

  const [sessionStatus, setSessionStatus] = useState<
    'checking' | 'restored' | 'new' | 'none'
  >('checking');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Attempt silent reconnect
        await connect();
        setSessionStatus('restored');
      } catch (err) {
        // No existing session
        setSessionStatus('none');
      }
    };

    checkSession();
  }, []);

  // Update status when connection changes
  useEffect(() => {
    if (isConnected && sessionStatus === 'checking') {
      setSessionStatus('restored');
    } else if (isConnected && sessionStatus === 'none') {
      setSessionStatus('new');
    }
  }, [isConnected, sessionStatus]);

  const handleConnect = async () => {
    setSessionStatus('checking');
    try {
      await connect();
    } catch (err) {
      setSessionStatus('none');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setSessionStatus('none');
  };

  if (isConnecting) {
    return (
      <div>
        <p>
          {sessionStatus === 'checking'
            ? 'Checking for existing session...'
            : 'Connecting...'}
        </p>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div>
        <h2>Wallet Connected</h2>
        <p>Address: {smartWalletPubkey?.toString()}</p>
        <p>
          Session: {sessionStatus === 'restored' ? 'Restored' : 'New'}
        </p>
        <button onClick={handleDisconnect}>Disconnect</button>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleConnect}>Connect Wallet</button>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  );
}
```

## Step 7: Best Practices

### 1. Always Handle Connection States

```typescript
const { isConnected, isConnecting, connect } = useWallet();

// Show loading state
if (isConnecting) {
  return <LoadingSpinner />;
}

// Show connect button if not connected
if (!isConnected) {
  return <ConnectButton onClick={connect} />;
}

// Show wallet UI if connected
return <WalletUI />;
```

### 2. Provide Clear User Feedback

```typescript
const [connectionMessage, setConnectionMessage] = useState('');

const handleConnect = async () => {
  setConnectionMessage('Connecting...');
  try {
    await connect();
    setConnectionMessage('Connected successfully!');
  } catch (err) {
    setConnectionMessage('Connection failed. Please try again.');
  }
};
```

### 3. Handle Disconnection Gracefully

According to the [disconnect API](https://docs.lazorkit.com/react-sdk/use-wallet#disconnect):

> "Signs the user out and wipes any cached session data from local storage."

```typescript
const handleDisconnect = async () => {
  try {
    await disconnect();
    // Clear any app-specific state
    setUserData(null);
    setTransactions([]);
  } catch (err) {
    console.error('Disconnect failed:', err);
  }
};
```

## Step 8: Testing Session Persistence

### Test 1: Same Device, Same Browser

1. Connect wallet
2. Refresh the page
3. **Expected**: Wallet should auto-reconnect

### Test 2: Same Device, Different Browser

1. Connect wallet in Chrome
2. Open same app in Firefox
3. **Expected**: Full authentication required (different browser = different storage)

### Test 3: Different Device (if passkey synced)

1. Connect wallet on iPhone
2. Open app on Mac (same iCloud account)
3. **Expected**: Can authenticate and access same wallet

## Common Questions

### Q: How long does a session last?
**A:** Sessions persist until the user explicitly disconnects or clears browser data.

### Q: Can I force a re-authentication?
**A:** Yes, call `disconnect()` first, then `connect()` will require full authentication.

### Q: What happens if the user clears browser data?
**A:** The session is lost, but the wallet can be restored by re-authenticating with the same passkey.

### Q: Is the session secure?
**A:** Yes, sessions use WebAuthn credentials stored in the device's Secure Enclave. Private keys never leave the device.

## Key Takeaways

- ✅ LazorKit automatically manages session persistence
- ✅ Sessions are stored securely using WebAuthn
- ✅ Auto-reconnect works seamlessly via `connect()` method
- ✅ Cross-device access is supported when passkeys are synced
- ✅ Always handle connection states in your UI
- ✅ Use `disconnect()` to clear sessions

## Next Steps

- Implement session state management in your app
- Add user-friendly connection status indicators
- Test cross-device access (if applicable)
- Explore other LazorKit features

## Additional Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [useWallet connect API](https://docs.lazorkit.com/react-sdk/use-wallet#connect)
- [useWallet disconnect API](https://docs.lazorkit.com/react-sdk/use-wallet#disconnect)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [Passkey Sync Guide](https://developers.google.com/identity/passkeys)

## Summary

In this tutorial, you learned:
- ✅ How LazorKit manages session persistence
- ✅ How auto-reconnect works via `connect()` method
- ✅ How to implement session state management
- ✅ How cross-device access works with synced passkeys
- ✅ Best practices for session handling

Your users can now seamlessly reconnect their wallet across sessions and devices!

