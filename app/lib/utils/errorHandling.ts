/**
 * Centralized error handling utilities
 */

import { detectPasskeyCacheIssue } from './passkeyRecovery';

export interface ErrorInfo {
  message: string;
  userFriendly?: string;
  code?: string;
  recoverable?: boolean;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unknown error occurred';
}

/**
 * Parse error and return user-friendly message
 */
export function parseError(error: unknown): ErrorInfo {
  const message = getErrorMessage(error);
  const errorObj = error as { message?: string; name?: string; code?: string };

  // TLS/HTTPS errors
  if (
    message.includes('TLS certificate') ||
    message.includes('certificate errors') ||
    message.includes('WebAuthn is not supported')
  ) {
    return {
      message,
      userFriendly:
        '❌ Transactions require HTTPS!\n\nCurrent issue: TLS certificate error or missing HTTPS\n\nSolutions:\n1. **For Local Development:** Run "npm run dev:https" then use https://localhost:3000\n   - Next.js will auto-generate certificates\n   - Accept the browser security warning (safe for local dev)\n2. **For Production:** Deploy to Vercel/Netlify (HTTPS provided automatically)\n\n⚠️ Important: While passkey authentication may work on http://localhost, sending transactions requires HTTPS.\n\nQuick fix: Make sure you\'re using https://localhost:3000, not http://localhost:3000',
      code: 'TLS_ERROR',
    };
  }

  // Signing errors
  if (message.includes('Signing failed') || message.includes('signing')) {
    return {
      message,
      userFriendly:
        'Transaction signing failed after clicking "Approve".\n\nWhat should happen:\n1. You see "Review Transaction" modal ✅\n2. You click "Approve" ✅\n3. Biometric prompt appears (Face ID/Touch ID/Windows Hello) ❌ NOT APPEARING\n4. You approve the prompt\n5. Transaction completes\n\nPossible causes:\n• Passkey may not be properly configured for transaction signing\n• Browser may be blocking the biometric prompt\n• LazorKit SDK may need re-initialization\n\nTry these fixes:\n1. Disconnect wallet and reconnect (this recreates passkey)\n2. Check browser console (F12) for detailed errors\n3. Try a different browser (Chrome, Firefox, Edge)\n4. Clear browser cache and cookies\n5. Ensure you\'re on HTTPS or localhost\n6. Check if WebAuthn is enabled: Open console and type: window.PublicKeyCredential',
      code: 'SIGNING_ERROR',
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('Signing timeout')) {
    return {
      message,
      userFriendly:
        'Signing timeout: No biometric prompt appeared.\n\nThis means the passkey signing isn\'t triggering.\n\nTry:\n1. Disconnect and reconnect your wallet\n2. Check browser console (F12) for errors\n3. Verify passkey was created: Check if you saw a biometric prompt when connecting\n4. Try a different browser\n5. Contact LazorKit support if issue persists',
      code: 'TIMEOUT_ERROR',
    };
  }

  // NotAllowedError
  if (message.includes('NotAllowedError') || errorObj?.name === 'NotAllowedError') {
    return {
      message,
      userFriendly:
        'Biometric authentication was canceled. Please try again and approve the prompt when it appears.',
      code: 'NOT_ALLOWED',
    };
  }

  // User cancelled
  if (message.includes('User cancelled') || message.includes('canceled')) {
    return {
      message,
      userFriendly:
        'You canceled the authentication. Please try again and approve the biometric prompt.',
      code: 'USER_CANCELLED',
    };
  }

  // Insufficient funds
  if (
    message.includes('custom program error: 0x2') ||
    message.includes('InsufficientFunds') ||
    message.includes('insufficient funds')
  ) {
    return {
      message,
      userFriendly:
        'Insufficient funds error (0x2).\n\nThis usually means:\n• Smart wallet may not be initialized yet\n• Balance might be locked or reserved\n• Transaction needs more SOL than available (including fees)\n\nTry:\n• Verify balance on Solana Explorer\n• Try sending a smaller amount (0.01 SOL)\n• Make sure you funded the correct wallet address\n• The smart wallet might need initialization - try disconnecting and reconnecting',
      code: 'INSUFFICIENT_FUNDS',
    };
  }

  // Simulation failed
  if (
    message.includes('simulation failed') ||
    message.includes('Transaction simulation')
  ) {
    return {
      message,
      userFriendly:
        'Transaction simulation failed.\n\nThis means the transaction would fail on-chain.\n\nCommon causes:\n• Insufficient balance (including fees)\n• Invalid recipient address\n• Network issues\n\nTry:\n• Check your balance\n• Verify the recipient address is valid\n• Try a smaller amount\n• Wait a moment and try again',
      code: 'SIMULATION_FAILED',
    };
  }

  // Transaction too large - likely passkey cache issue
  if (message.includes('Transaction too large') || message.includes('too large') || message.includes('1232 byte limit')) {
    const isPasskeyCacheIssue = detectPasskeyCacheIssue(error);

    return {
      message,
      userFriendly:
        'Transaction too large: Transaction size exceeds Solana\'s 1232 byte limit.\n\nTroubleshooting Steps:\n\n1. First, check if you have sufficient balance:\n   • Verify your wallet balance is enough for the transaction amount\n   • Ensure you have enough SOL to cover transaction fees\n   • If balance is insufficient, fund your wallet and try again\n\n2. If you have sufficient balance, this is likely a passkey cache problem:\n   • Root Cause: Passkey cache inconsistencies can cause the paymaster pipeline to create oversized transactions\n   • When passkey credentials are cached inconsistently, transaction size calculation can exceed Solana\'s limit\n   • This can happen with any transaction amount\n\nSolution - Clear Cache and Reconnect:\n\nDisconnect wallet, clear cache and site data, then reconnect:\n\n• Chrome/Edge: Settings → Privacy → Clear browsing data → Select "Cached images and files" and "Site data"\n• Firefox: Settings → Privacy → Clear Data → Select "Cached Web Content" and "Site Preferences"\n• Safari: Develop → Empty Caches (enable Develop menu in Preferences)\n\nAfter clearing cache and reconnecting, you should be able to send transactions of any amount.\n\nNote: This is a passkey cache issue, not a transaction size limitation. Your transaction is still signed with passkeys and executed via smart wallet.',
      code: 'TRANSACTION_TOO_LARGE',
      recoverable: isPasskeyCacheIssue,
    };
  }

  // Default
  return {
    message,
    userFriendly: message,
    recoverable: false,
  };
}

/**
 * Check if an error is a transaction size error
 * 
 * @param error - The error to check
 * @returns true if the error is a transaction size error
 * 
 * @example
 * ```ts
 * try {
 *   await signAndSendTransaction({ instructions });
 * } catch (error) {
 *   if (isTransactionSizeError(error)) {
 *     // Handle transaction size error
 *   }
 * }
 * ```
 */
export function isTransactionSizeError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('Transaction too large') ||
    message.includes('too large') ||
    message.includes('1232 byte limit') ||
    message.includes('transaction size')
  );
}

