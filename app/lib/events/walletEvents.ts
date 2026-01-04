export const WALLET_EVENTS = {
  BALANCE_UPDATED: 'wallet:balance-updated',
  SUBSCRIPTION_CREATED: 'wallet:subscription-created',
  SUBSCRIPTION_UPDATED: 'wallet:subscription-updated',
  TRANSACTION_COMPLETED: 'wallet:transaction-completed',
} as const;

export function dispatchWalletEvent(eventName: string, data?: any) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

export function listenWalletEvent(
  eventName: string,
  callback: (data?: any) => void
): () => void {
  if (typeof window !== 'undefined') {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      callback(customEvent.detail);
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }
  return () => {};
}

