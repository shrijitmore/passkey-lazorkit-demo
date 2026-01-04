import { Subscription } from './types';

const STORAGE_PREFIX = 'subscriptions_';

export function getSubscriptions(walletAddress: string): Subscription[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const key = `${STORAGE_PREFIX}${walletAddress}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading subscriptions from storage:', error);
    return [];
  }
}

export function saveSubscriptions(walletAddress: string, subscriptions: Subscription[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_PREFIX}${walletAddress}`;
    localStorage.setItem(key, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Error saving subscriptions to storage:', error);
  }
}

export function addSubscription(walletAddress: string, subscription: Subscription): void {
  const subscriptions = getSubscriptions(walletAddress);
  subscriptions.push(subscription);
  saveSubscriptions(walletAddress, subscriptions);
}

export function updateSubscription(
  walletAddress: string,
  subscriptionId: string,
  updates: Partial<Subscription>
): void {
  const subscriptions = getSubscriptions(walletAddress);
  const index = subscriptions.findIndex((sub) => sub.id === subscriptionId);
  if (index !== -1) {
    subscriptions[index] = { ...subscriptions[index], ...updates };
    saveSubscriptions(walletAddress, subscriptions);
  }
}

export function getSubscription(
  walletAddress: string,
  subscriptionId: string
): Subscription | undefined {
  const subscriptions = getSubscriptions(walletAddress);
  return subscriptions.find((sub) => sub.id === subscriptionId);
}

export function clearSubscriptions(walletAddress: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `${STORAGE_PREFIX}${walletAddress}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing subscriptions from storage:', error);
  }
}

