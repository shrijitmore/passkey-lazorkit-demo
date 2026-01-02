# Tutorial: Creating a Passkey-Based Solana Wallet

Learn how to implement passwordless authentication for Solana wallets using WebAuthn passkeys and LazorKit SDK.

## What You'll Learn

- How passkeys work with Solana
- Implementing passkey authentication flow
- Creating a smart wallet without seed phrases
- Best practices for passkey UX

---

## Understanding Passkeys

### What are Passkeys?

Passkeys are a **FIDO2/WebAuthn** standard for passwordless authentication:

- **No passwords**: Use biometric authentication (Face ID, Touch ID, Windows Hello)
- **Phishing-resistant**: Cryptographic proof of authentication
- **Device-bound**: Private keys never leave your device
- **Cross-platform**: Works across devices via cloud sync

### How Passkeys Work with Solana

1. **User Registration**:
   - User clicks "Connect with Passkey"
   - Browser generates a key pair (private + public key)
   - Private key stored securely on device
   - Public key sent to LazorKit portal

2. **Smart Wallet Creation**:
   - LazorKit derives a Solana wallet address
   - Wallet is linked to the passkey
   - User gets a real Solana address

3. **Authentication**:
   - User authenticates with biometric
   - Device signs challenge with private key
   - LazorKit verifies and grants access

4. **Transactions**:
   - User approves transaction with passkey
   - Transaction signed and sent to Solana
   - All gasless via paymaster

---

## Implementation Guide

### Step 1: Setup LazorKit Provider

First, wrap your app with `LazorkitProvider`:

```tsx
// app/components/LazorkitProviderWrapper.tsx
'use client';

import { LazorkitProvider } from '@lazorkit/wallet';
import { useMemo, type ReactNode } from 'react';

const RPC_URL = 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://kora.devnet.lazorkit.com'; // Official Devnet paymaster

export default function LazorkitProviderWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const paymasterConfig = useMemo(
    () => ({
      paymasterUrl: PAYMASTER_URL,
    }),
    []
  );

  return (
    <LazorkitProvider
      rpcUrl={RPC_URL}
      portalUrl={PORTAL_URL}
      paymasterConfig={paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}
```

**What's happening:**
- `rpcUrl`: Solana network endpoint
- `portalUrl`: LazorKit's passkey management service
- `paymasterConfig`: Enables gasless transactions

### Step 2: Create Connect Component

Build a simple connect button:

```tsx
// app/components/ConnectButton.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';

export default function ConnectButton() {
  const { isConnected, isConnecting, connect, disconnect, error } = useWallet();

  if (isConnecting) {
    return (
      <button disabled>
        <span className="animate-spin">⏳</span>
        Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <button onClick={disconnect}>
        Disconnect
      </button>
    );
  }

  return (
    <div>
      <button onClick={connect}>
        🔐 Connect with Passkey
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
```

**Key Points:**
- `useWallet()`: Hook providing wallet state and methods
- `connect()`: Triggers passkey authentication
- `isConnecting`: Shows loading state
- `error`: Handles authentication errors

### Step 3: Display Wallet Information

Show the connected wallet:

```tsx
// app/components/WalletInfo.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';
import { useEffect, useState } from 'react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC_URL = 'https://api.devnet.solana.com';

export default function WalletInfo() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      fetchBalance();
    }
  }, [isConnected, smartWalletPubkey]);

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;
    
    const connection = new Connection(RPC_URL, 'confirmed');
    const balance = await connection.getBalance(smartWalletPubkey);
    setBalance(balance / LAMPORTS_PER_SOL);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="wallet-info">
      <h3>Wallet Connected ✅</h3>
      <p>
        <strong>Address:</strong>
        <br />
        <code>{smartWalletPubkey?.toString()}</code>
      </p>
      <p>
        <strong>Balance:</strong> {balance?.toFixed(4)} SOL
      </p>
    </div>
  );
}
```

**Breakdown:**
- `smartWalletPubkey`: User's Solana wallet address (PublicKey object)
- `getBalance()`: Fetches SOL balance from blockchain
- `LAMPORTS_PER_SOL`: Converts lamports to SOL (1 SOL = 1,000,000,000 lamports)

### Step 4: Handle First-Time vs Returning Users

LazorKit automatically handles this:

```tsx
const handleConnect = async () => {
  try {
    await connect();
    // LazorKit will:
    // - Check if user has a passkey
    // - If new: Create passkey + wallet
    // - If returning: Authenticate with existing passkey
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      // User cancelled passkey prompt
      console.log('User cancelled authentication');
    } else if (err.name === 'InvalidStateError') {
      // Passkey already exists
      console.log('Passkey already registered');
    } else {
      console.error('Connection failed:', err);
    }
  }
};
```

---

## Advanced: Passkey Flow Breakdown

### Registration Flow (First-Time Users)

```tsx
// This happens automatically inside connect()

// 1. User clicks "Connect with Passkey"
connect();

// 2. LazorKit checks if passkey exists
const hasPasskey = await checkPasskeyExists();

if (!hasPasskey) {
  // 3. Create new passkey
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge,
      rp: { name: "Your App", id: window.location.hostname },
      user: {
        id: randomUserId,
        name: "user@example.com",
        displayName: "User"
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "required"
      },
      timeout: 60000,
      attestation: "none"
    }
  });

  // 4. Send public key to LazorKit portal
  await sendToPortal(credential.id, credential.response.publicKey);

  // 5. Portal creates Solana wallet
  const walletAddress = await deriveWallet(credential.id);

  // 6. User is connected!
}
```

### Authentication Flow (Returning Users)

```tsx
// 1. User clicks "Connect with Passkey"
connect();

// 2. Browser prompts for authentication
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: randomChallenge,
    allowCredentials: [{ id: storedCredentialId, type: "public-key" }],
    userVerification: "required",
    timeout: 60000
  }
});

// 3. Verify signature
const isValid = await verifySignature(assertion);

if (isValid) {
  // 4. Retrieve wallet address
  const walletAddress = await getWalletForCredential(assertion.id);
  
  // 5. User is connected!
}
```

---

## Best Practices

### 1. Clear User Communication

```tsx
<div className="passkey-info">
  <h3>🔐 Secure & Simple</h3>
  <p>No passwords or seed phrases needed</p>
  <p>Use Face ID, Touch ID, or Windows Hello</p>
  <button onClick={connect}>Connect with Passkey</button>
</div>
```

### 2. Handle Errors Gracefully

```tsx
const { error } = useWallet();

const getErrorMessage = (error: Error) => {
  if (error.name === 'NotAllowedError') {
    return 'Authentication cancelled. Please try again.';
  }
  if (error.message.includes('timeout')) {
    return 'Authentication timed out. Please try again.';
  }
  return 'Connection failed. Please check your connection.';
};

if (error) {
  return (
    <div className="error">
      <p>{getErrorMessage(error)}</p>
      <button onClick={connect}>Retry</button>
    </div>
  );
}
```

### 3. Show Loading States

```tsx
if (isConnecting) {
  return (
    <div className="connecting">
      <div className="spinner" />
      <p>Authenticating with your device...</p>
      <p className="hint">Check your phone or computer for a prompt</p>
    </div>
  );
}
```

### 4. Add Success Feedback

```tsx
const [justConnected, setJustConnected] = useState(false);

const handleConnect = async () => {
  await connect();
  setJustConnected(true);
  setTimeout(() => setJustConnected(false), 3000);
};

if (justConnected) {
  return (
    <div className="success">
      ✅ Connected successfully!
    </div>
  );
}
```

---

## Testing Checklist

### Desktop Testing

- [ ] Test in Chrome with Windows Hello
- [ ] Test in Safari with Touch ID (Mac)
- [ ] Test in Firefox with security key
- [ ] Test with Face ID (Mac with Face ID)
- [ ] Verify passkey works after browser restart
- [ ] Test cancelling authentication

### Mobile Testing

- [ ] Test in Safari (iOS) with Face ID
- [ ] Test in Safari (iOS) with Touch ID
- [ ] Test in Chrome (Android) with fingerprint
- [ ] Test in Chrome (Android) with face unlock
- [ ] Verify passkey syncs across devices (iCloud/Google)

### Cross-Device Testing

- [ ] Create passkey on desktop
- [ ] Try connecting on mobile (should work if synced)
- [ ] Create passkey on mobile
- [ ] Try connecting on desktop (should work if synced)

---

## Common Issues

### Issue: "Passkey not supported"

**Cause**: Old browser or HTTP (not HTTPS)

**Solution**:
- Use HTTPS (required for WebAuthn)
- Update browser to latest version
- Check [caniuse.com/webauthn](https://caniuse.com/webauthn)

### Issue: "User verification failed"

**Cause**: Biometric authentication disabled or failed

**Solution**:
- Enable Face ID/Touch ID in device settings
- Try alternative authentication method
- Check device supports user verification

### Issue: "Timeout"

**Cause**: User took too long to authenticate

**Solution**:
```tsx
const passkeyOptions = {
  timeout: 120000, // Increase timeout to 2 minutes
};
```

### Issue: "Passkey already exists"

**Cause**: User trying to register again

**Solution**:
```tsx
try {
  await connect();
} catch (err: any) {
  if (err.name === 'InvalidStateError') {
    // Passkey exists, try authentication instead
    await authenticateExisting();
  }
}
```

---

## Security Considerations

### 1. Private Keys Never Leave Device

✅ **Good**: Passkey private keys are stored in secure hardware
❌ **Bad**: Never try to export or access private keys directly

### 2. Phishing Protection

✅ **Good**: Passkeys are bound to your domain
❌ **Bad**: Attacker can't phish passkeys on fake domain

### 3. User Verification Required

```tsx
const config = {
  authenticatorSelection: {
    userVerification: 'required', // ✅ Always require biometric
    residentKey: 'required',      // ✅ Store credential on device
  }
};
```

### 4. Challenge Validation

- Always use random challenges
- Verify challenges on backend
- Challenges should be single-use

---

## Next Steps

1. **Add Recovery Options**: Implement account recovery for lost devices
2. **Multi-Device Support**: Test passkey sync across devices
3. **Custom Branding**: Customize the authentication prompt
4. **Analytics**: Track authentication success rates

---

## Resources

- **WebAuthn Guide**: [webauthn.guide](https://webauthn.guide)
- **FIDO Alliance**: [fidoalliance.org](https://fidoalliance.org)
- **LazorKit Docs**: [docs.lazorkit.com](https://docs.lazorkit.com)
- **Passkey.io**: [passkeys.io](https://passkeys.io)

---

**Happy coding! 🚀**
