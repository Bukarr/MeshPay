import { Transaction, UserProfile, NearbyPeer, ExchangeRate } from '../types';
import { INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE, INITIAL_TRANSACTIONS, INITIAL_EXCHANGE_RATE } from '../data/mockData';

const KEYS = {
  USER_PROFILE: 'meshpay_custom_user_profile',
  TRANSACTIONS: 'meshpay_custom_transactions',
  EXCHANGE_RATE: 'meshpay_exchange_rate',
  LOGGED_IN: 'meshpay_is_logged_in'
};

export function isUserLoggedIn(): boolean {
  try {
    return localStorage.getItem(KEYS.LOGGED_IN) === 'true' && localStorage.getItem(KEYS.USER_PROFILE) !== null;
  } catch (e) {
    return false;
  }
}

export function setUserLoggedIn(loggedIn: boolean): void {
  localStorage.setItem(KEYS.LOGGED_IN, loggedIn ? 'true' : 'false');
  window.dispatchEvent(new Event('meshpay_auth_updated'));
}

export function getActiveUserId(): string {
  return 'custom_user';
}

export function switchActiveUserProfile(userId: string): void {
  // Switcing profiles is disabled in the single custom user MVP
  setUserLoggedIn(true);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(KEYS.USER_PROFILE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }

  // Return a placeholder un-onboarded profile if none exists
  return {
    name: 'New User',
    email: 'user@meshpay.io',
    tag: '$new_user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usdBalance: 0,
    ngnBalance: 0,
    virtualAccountNgn: '9000000001',
    virtualAccountUsd: '400000000001',
    bankName: 'Wema Bank / MeshPay Vault',
    tier: 'Tier 1 (Unverified)',
    pin: '1234',
    biometricEnabled: true,
    kycVerified: false,
    publicKey: 'mp_sec_0x' + Math.random().toString(16).substring(2, 10)
  };
}

export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse transactions', e);
  }
  return [];
}

export function saveTransactions(txs: Transaction[]): void {
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  window.dispatchEvent(new Event('meshpay_transactions_updated'));
}

export function addTransaction(tx: Transaction): void {
  const allTxs = getStoredTransactions();
  saveTransactions([tx, ...allTxs]);

  const profile = getStoredUserProfile();
  if (tx.sourceCurrency === 'USD') {
    profile.usdBalance = Math.max(0, profile.usdBalance - tx.sourceAmount);
  } else if (tx.sourceCurrency === 'NGN' && tx.type !== 'nearby_receive') {
    profile.ngnBalance = Math.max(0, profile.ngnBalance - tx.sourceAmount);
  }

  if (tx.type === 'nearby_receive' && tx.targetCurrency === 'NGN') {
    profile.ngnBalance += tx.targetAmount;
  }
  saveUserProfile(profile);
}

export function getOfflineQueuedTransactions(): Transaction[] {
  const all = getStoredTransactions();
  return all.filter(t => t.status === 'queued_offline');
}

export async function processSyncQueue(
  onProgress?: (step: string, progress: number) => void
): Promise<{ syncedCount: number; errors: string[] }> {
  const all = getStoredTransactions();
  const queued = all.filter(t => t.status === 'queued_offline');

  if (queued.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  if (onProgress) onProgress('Connecting to MeshPay Core Settlement Ledger...', 20);
  await new Promise(r => setTimeout(r, 600));

  if (onProgress) onProgress('Verifying cryptographic signatures and offline nonces...', 50);
  await new Promise(r => setTimeout(r, 700));

  if (onProgress) onProgress('Reconciling peer balances and clearing interbank settlements...', 80);
  await new Promise(r => setTimeout(r, 600));

  const now = new Date().toISOString();
  const updatedAll = all.map(t => {
    if (t.status === 'queued_offline') {
      return {
        ...t,
        status: 'completed' as const,
        syncTimestamp: now,
        notes: `${t.notes || ''} (Synced via Mesh Engine at ${new Date().toLocaleTimeString()})`
      };
    }
    return t;
  });

  saveTransactions(updatedAll);

  if (onProgress) onProgress('Sync complete! All offline receipts verified.', 100);
  await new Promise(r => setTimeout(r, 300));

  return { syncedCount: queued.length, errors: [] };
}

export function getStoredExchangeRate(): ExchangeRate {
  try {
    const data = localStorage.getItem(KEYS.EXCHANGE_RATE);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse exchange rate', e);
  }
  return INITIAL_EXCHANGE_RATE;
}

export function saveExchangeRate(rate: ExchangeRate): void {
  localStorage.setItem(KEYS.EXCHANGE_RATE, JSON.stringify(rate));
  window.dispatchEvent(new Event('meshpay_rate_updated'));
}

export function resetDemoState(): void {
  localStorage.removeItem(KEYS.USER_PROFILE);
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.setItem(KEYS.LOGGED_IN, 'false');
  saveExchangeRate(INITIAL_EXCHANGE_RATE);
  window.dispatchEvent(new Event('meshpay_reset'));
}

export function generateOfflineSignature(): { signature: string; nonce: string } {
  const nonce = 'NONCE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const hash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { signature: hash, nonce };
}
