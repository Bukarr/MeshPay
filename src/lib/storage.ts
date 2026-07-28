import { Transaction, UserProfile, NearbyPeer, ExchangeRate } from '../types';
import { INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE, INITIAL_TRANSACTIONS, INITIAL_EXCHANGE_RATE } from '../data/mockData';

const KEYS = {
  ACTIVE_USER_ID: 'meshpay_active_user_id',
  USER_1: 'meshpay_user_profile_1',
  USER_2: 'meshpay_user_profile_2',
  USER_3: 'meshpay_user_profile_3',
  TXS_1: 'meshpay_transactions_user_1',
  TXS_2: 'meshpay_transactions_user_2',
  TXS_3: 'meshpay_transactions_user_3',
  EXCHANGE_RATE: 'meshpay_exchange_rate',
  LOGGED_IN: 'meshpay_is_logged_in'
};

export type UserIdType = 'user_1' | 'user_2' | 'user_3';

export function isUserLoggedIn(): boolean {
  try {
    return localStorage.getItem(KEYS.LOGGED_IN) === 'true';
  } catch (e) {
    return false;
  }
}

export function setUserLoggedIn(loggedIn: boolean): void {
  localStorage.setItem(KEYS.LOGGED_IN, loggedIn ? 'true' : 'false');
  window.dispatchEvent(new Event('meshpay_auth_updated'));
}

export function getActiveUserId(): UserIdType {
  try {
    const id = localStorage.getItem(KEYS.ACTIVE_USER_ID) as UserIdType;
    if (id === 'user_2' || id === 'user_3') return id;
  } catch (e) {
    console.error(e);
  }
  return 'user_1';
}

export function switchActiveUserProfile(userId: UserIdType): void {
  localStorage.setItem(KEYS.ACTIVE_USER_ID, userId);
  setUserLoggedIn(true);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
  window.dispatchEvent(new Event('meshpay_transactions_updated'));
}

export function getStoredUserProfile(userId?: UserIdType): UserProfile {
  const currentId = userId || getActiveUserId();
  let key = KEYS.USER_1;
  let defaultProfile = INITIAL_USER_PROFILE;

  if (currentId === 'user_2') {
    key = KEYS.USER_2;
    defaultProfile = SECOND_USER_PROFILE;
  } else if (currentId === 'user_3') {
    key = KEYS.USER_3;
    defaultProfile = THIRD_USER_PROFILE;
  }

  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }

  saveUserProfile(defaultProfile, currentId);
  return defaultProfile;
}

export function saveUserProfile(profile: UserProfile, userId?: UserIdType): void {
  const currentId = userId || getActiveUserId();
  let key = KEYS.USER_1;
  if (currentId === 'user_2') key = KEYS.USER_2;
  if (currentId === 'user_3') key = KEYS.USER_3;

  localStorage.setItem(key, JSON.stringify(profile));
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredTransactions(userId?: UserIdType): Transaction[] {
  const currentId = userId || getActiveUserId();
  let key = KEYS.TXS_1;
  if (currentId === 'user_2') key = KEYS.TXS_2;
  if (currentId === 'user_3') key = KEYS.TXS_3;

  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse transactions', e);
  }

  const initial = currentId === 'user_1' ? INITIAL_TRANSACTIONS : [];
  saveTransactions(initial, currentId);
  return initial;
}

export function saveTransactions(txs: Transaction[], userId?: UserIdType): void {
  const currentId = userId || getActiveUserId();
  let key = KEYS.TXS_1;
  if (currentId === 'user_2') key = KEYS.TXS_2;
  if (currentId === 'user_3') key = KEYS.TXS_3;

  localStorage.setItem(key, JSON.stringify(txs));
  window.dispatchEvent(new Event('meshpay_transactions_updated'));
}

export function addTransaction(tx: Transaction): void {
  const currentUserId = getActiveUserId();
  const otherUserId = currentUserId === 'user_1' ? 'user_2' : 'user_1';

  // 1. Add to sender's transaction history
  const senderTxs = getStoredTransactions(currentUserId);
  saveTransactions([tx, ...senderTxs], currentUserId);

  // 2. Update sender's balance
  const senderProfile = getStoredUserProfile(currentUserId);
  if (tx.sourceCurrency === 'USD') {
    senderProfile.usdBalance = Math.max(0, senderProfile.usdBalance - tx.sourceAmount);
  } else if (tx.sourceCurrency === 'NGN' && tx.type !== 'nearby_receive') {
    senderProfile.ngnBalance = Math.max(0, senderProfile.ngnBalance - tx.sourceAmount);
  }

  if (tx.type === 'nearby_receive' && tx.targetCurrency === 'NGN') {
    senderProfile.ngnBalance += tx.targetAmount;
  }
  saveUserProfile(senderProfile, currentUserId);

  // 3. REAL P2P SIMULATION: If transferring to or receiving from the other user profile ($fatima_b or $adewale_l)
  const otherProfile = getStoredUserProfile(otherUserId);
  const isMatchTag = tx.recipientName.toLowerCase().includes(otherProfile.name.toLowerCase()) ||
                     tx.recipientDetail.toLowerCase().includes(otherProfile.tag.toLowerCase());

  if (isMatchTag || tx.type === 'nearby_send') {
    // Credit the recipient profile in storage!
    if (tx.targetCurrency === 'NGN') {
      otherProfile.ngnBalance += tx.targetAmount;
    } else if (tx.targetCurrency === 'USD') {
      otherProfile.usdBalance += tx.targetAmount;
    }
    saveUserProfile(otherProfile, otherUserId);

    // Add corresponding received transaction to recipient's ledger!
    const recipientTx: Transaction = {
      id: 'tx_p2p_recv_' + Date.now(),
      type: 'nearby_receive',
      sourceAmount: tx.targetAmount,
      sourceCurrency: tx.targetCurrency,
      targetAmount: tx.targetAmount,
      targetCurrency: tx.targetCurrency,
      exchangeRate: 1.0,
      fee: 0,
      recipientName: senderProfile.name,
      recipientDetail: `${senderProfile.tag} (${senderProfile.virtualAccountNgn})`,
      timestamp: new Date().toISOString(),
      status: tx.status,
      isOffline: tx.isOffline,
      offlineSignature: tx.offlineSignature,
      offlineNonce: tx.offlineNonce,
      notes: `Received P2P payment from ${senderProfile.name}`
    };

    const recipientTxs = getStoredTransactions(otherUserId);
    saveTransactions([recipientTx, ...recipientTxs], otherUserId);
  }
}

export function getOfflineQueuedTransactions(): Transaction[] {
  const all = getStoredTransactions();
  return all.filter(t => t.status === 'queued_offline');
}

export async function processSyncQueue(
  onProgress?: (step: string, progress: number) => void
): Promise<{ syncedCount: number; errors: string[] }> {
  const currentUserId = getActiveUserId();
  const all = getStoredTransactions(currentUserId);
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

  saveTransactions(updatedAll, currentUserId);

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
  saveUserProfile(INITIAL_USER_PROFILE, 'user_1');
  saveUserProfile(SECOND_USER_PROFILE, 'user_2');
  saveUserProfile(THIRD_USER_PROFILE, 'user_3');
  saveTransactions(INITIAL_TRANSACTIONS, 'user_1');
  saveTransactions([], 'user_2');
  saveTransactions([], 'user_3');
  saveExchangeRate(INITIAL_EXCHANGE_RATE);
  localStorage.setItem(KEYS.ACTIVE_USER_ID, 'user_1');
  setUserLoggedIn(true);
  window.dispatchEvent(new Event('meshpay_reset'));
}

export function generateOfflineSignature(): { signature: string; nonce: string } {
  const nonce = 'NONCE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const hash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { signature: hash, nonce };
}
