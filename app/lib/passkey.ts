import {
    startRegistration,
    startAuthentication,
  } from '@simplewebauthn/browser';
  import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
  } from '@simplewebauthn/types';
  
  const STORAGE_KEY = 'passkey-user';
  
  /**
   * Generate a base64url-encoded random challenge
   */
  function generateChallenge(): string {
    const buffer = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  
  /**
   * Register a new passkey
   * Browser-only, real WebAuthn
   */
  export async function registerPasskey() {
    if (typeof window === 'undefined') {
      throw new Error('registerPasskey must run in the browser');
    }
  
    const options: PublicKeyCredentialCreationOptionsJSON = {
      challenge: generateChallenge(),
      rp: {
        name: 'Passkey LazorKit Demo',
        id: window.location.hostname,
      },
      user: {
        id: generateChallenge(),
        name: 'demo-user',
        displayName: 'Demo User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };
  
    const registration = await startRegistration({ optionsJSON: options });
  
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        credentialId: registration.id,
      })
    );
  
    return registration;
  }
  
  /**
   * Authenticate using an existing passkey
   */
  export async function authenticatePasskey() {
    if (typeof window === 'undefined') {
      throw new Error('authenticatePasskey must run in the browser');
    }
  
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) throw new Error('No passkey registered');
  
    const { credentialId } = JSON.parse(stored);
  
    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: generateChallenge(),
      allowCredentials: [
        {
          id: credentialId,
          type: 'public-key',
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    };
  
    const authentication = await startAuthentication({ optionsJSON: options });
  
    return authentication;
  }
  
  /**
   * Check if a passkey is registered (browser-safe)
   */
  export function hasPasskey(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(STORAGE_KEY));
  }
  