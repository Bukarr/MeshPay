import { Transaction, UserProfile, ExchangeRate } from '../types';
import { INITIAL_EXCHANGE_RATE } from '../data/mockData';
import { secureVaultGet, secureVaultSet, secureVaultRemove, verifyVaultIntegrity, isTamperDetected, getLastTamperedKey } from './secureVault';
import { silentSyncStoreAndForwardQueue, getStoreAndForwardQueue } from './storeAndForward';

export { verifyVaultIntegrity, isTamperDetected, getLastTamperedKey };

const KEYS = {
  USER_PROFILE: 'meshpay_custom_user_profile',
  TRANSACTIONS: 'meshpay_custom_transactions',
  EXCHANGE_RATE: 'meshpay_exchange_rate',
  LOGGED_IN: 'meshpay_is_logged_in'
};

export function isUserLoggedIn(): boolean {
  try {
    const loggedIn = secureVaultGet<boolean>(KEYS.LOGGED_IN, false);
    return loggedIn && secureVaultGet<UserProfile | null>(KEYS.USER_PROFILE, null) !== null;
  } catch (e) {
    return false;
  }
}

export function setUserLoggedIn(loggedIn: boolean): void {
  secureVaultSet(KEYS.LOGGED_IN, loggedIn);
  window.dispatchEvent(new Event('meshpay_auth_updated'));
}

export function getActiveUserId(): string {
  return 'custom_user';
}

export function switchActiveUserProfile(userId: string): void {
  setUserLoggedIn(true);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredUserProfile(): UserProfile {
  const defaultProfile: UserProfile = {
    name: 'New User',
    email: 'user@meshpay.io',
    tag: '$new_user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usdBalance: 500,
    ngnBalance: 150000,
    virtualAccountNgn: '9000000001',
    virtualAccountUsd: '400000000001',
    bankName: 'Wema Bank / MeshPay Vault',
    tier: 'Tier 3 (Verified)',
    pin: '1234',
    biometricEnabled: true,
    kycVerified: true,
    publicKey: 'mp_sec_0x' + Math.random().toString(16).substring(2, 10)
  };

  return secureVaultGet<UserProfile>(KEYS.USER_PROFILE, defaultProfile);
}

export function saveUserProfile(profile: UserProfile): void {
  secureVaultSet(KEYS.USER_PROFILE, profile);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredTransactions(): Transaction[] {
  return secureVaultGet<Transaction[]>(KEYS.TRANSACTIONS, []);
}

export function saveTransactions(txs: Transaction[]): void {
  secureVaultSet(KEYS.TRANSACTIONS, txs);
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
  const queuedTxs = all.filter(t => t.status === 'queued_offline');
  const sfQueue = getStoreAndForwardQueue().filter(p => p.status === 'queued_store_forward');
  
  // Return combined unique queued count
  return queuedTxs;
}

export async function processSyncQueue(
  onProgress?: (step: string, progress: number) => void
): Promise<{ syncedCount: number; errors: string[] }> {
  // Delegate to Store & Forward Silent Sync engine
  return await silentSyncStoreAndForwardQueue(onProgress);
}

export function getStoredExchangeRate(): ExchangeRate {
  return secureVaultGet<ExchangeRate>(KEYS.EXCHANGE_RATE, INITIAL_EXCHANGE_RATE);
}

export function saveExchangeRate(rate: ExchangeRate): void {
  secureVaultSet(KEYS.EXCHANGE_RATE, rate);
  window.dispatchEvent(new Event('meshpay_rate_updated'));
}

export function resetDemoState(): void {
  secureVaultRemove(KEYS.USER_PROFILE);
  secureVaultRemove(KEYS.TRANSACTIONS);
  secureVaultSet(KEYS.LOGGED_IN, false);
  saveExchangeRate(INITIAL_EXCHANGE_RATE);
  window.dispatchEvent(new Event('meshpay_reset'));
}

export function generateOfflineSignature(): { signature: string; nonce: string } {
  const nonce = 'NONCE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const hash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { signature: hash, nonce };
}
