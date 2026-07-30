import { Transaction, UserProfile, ExchangeRate, NotificationItem, Currency } from '../types';
import { INITIAL_EXCHANGE_RATE, INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE, PRESET_ACCOUNTS } from '../data/mockData';
import { generateSvgAvatar } from './avatarHelper';
import { secureVaultGet, secureVaultSet, secureVaultRemove, verifyVaultIntegrity, isTamperDetected, getLastTamperedKey } from './secureVault';

export { verifyVaultIntegrity, isTamperDetected, getLastTamperedKey };

const KEYS = {
  USER_PROFILE: 'meshpay_custom_user_profile',
  EXCHANGE_RATE: 'meshpay_exchange_rate',
  LOGGED_IN: 'meshpay_is_logged_in',
  ACTIVE_PHONE: 'meshpay_active_user_phone'
};

export const INITIAL_BASE_BALANCES: Record<string, { usd: number; ngn: number }> = {
  '08012345678': { usd: 2850.00, ngn: 1420000.00 }, // Adewale Lawson
  '08098765432': { usd: 1200.00, ngn: 380000.00 },  // Fatima Bello
  '07011223344': { usd: 450.00,  ngn: 120000.00 },  // Chinedu Okeke
  'default':     { usd: 500.00,  ngn: 250000.00 }
};

export function isUserLoggedIn(): boolean {
  try {
    const loggedIn = secureVaultGet<boolean>(KEYS.LOGGED_IN, true);
    return loggedIn;
  } catch (e) {
    return true;
  }
}

export function setUserLoggedIn(loggedIn: boolean): void {
  secureVaultSet(KEYS.LOGGED_IN, loggedIn);
  window.dispatchEvent(new Event('meshpay_auth_updated'));
}

export function getActiveUserId(): string {
  const profile = getStoredUserProfile();
  if (profile.phone === SECOND_USER_PROFILE.phone) return 'user_2';
  if (profile.phone === THIRD_USER_PROFILE.phone) return 'user_3';
  return 'user_1';
}

export function switchActiveUserProfile(userId: string): void {
  const match = PRESET_ACCOUNTS.find(a => a.userId === userId);
  if (match) {
    saveUserProfile(match.profile);
    setUserLoggedIn(true);
    window.dispatchEvent(new Event('meshpay_profile_updated'));
    window.dispatchEvent(new Event('meshpay_transactions_updated'));
  }
}

export function getUserKeyPrefix(phone?: string): string {
  const p = phone || getRawStoredUserProfile().phone || '08012345678';
  return p.replace(/\D/g, '').replace(/^234/, '0');
}

function getRawStoredUserProfile(): UserProfile {
  const stored = secureVaultGet<UserProfile>(KEYS.USER_PROFILE, INITIAL_USER_PROFILE);
  return stored;
}

export interface CalculatedBalances {
  totalUsd: number;
  totalNgn: number;
  availableUsd: number;
  availableNgn: number;
  pendingOutboundUsd: number;
  pendingOutboundNgn: number;
}

/**
 * Pure Ledger Balance Computation Engine
 * Replays transaction ledger starting from initial base balances to determine exact balance.
 */
export function computeUserLedgerBalances(userPhone?: string): CalculatedBalances {
  const phoneKey = getUserKeyPrefix(userPhone);
  const base = INITIAL_BASE_BALANCES[phoneKey] || INITIAL_BASE_BALANCES['default'];

  let totalUsd = base.usd;
  let totalNgn = base.ngn;
  let pendingOutboundUsd = 0;
  let pendingOutboundNgn = 0;

  const key = `meshpay_txs_${phoneKey}`;
  const txs = secureVaultGet<Transaction[]>(key, []);

  for (const tx of txs) {
    if (tx.status === 'failed') continue;

    const isPending = tx.status === 'queued_offline' || tx.status === 'syncing';

    if (tx.type === 'nearby_receive' || tx.type === 'top_up') {
      // Inbound Credit
      if (tx.targetCurrency === 'USD' || tx.sourceCurrency === 'USD') {
        const amt = tx.targetAmount || tx.sourceAmount;
        totalUsd += amt;
      } else {
        const amt = tx.targetAmount || tx.sourceAmount;
        totalNgn += amt;
      }
    } else {
      // Outbound Debit or Self FX Conversion
      if (tx.sourceCurrency === 'USD') {
        totalUsd -= tx.sourceAmount;
        if (isPending) pendingOutboundUsd += tx.sourceAmount;
        if (tx.type === 'usd_to_ngn') {
          totalNgn += tx.targetAmount;
        }
      } else if (tx.sourceCurrency === 'NGN') {
        totalNgn -= tx.sourceAmount;
        if (isPending) pendingOutboundNgn += tx.sourceAmount;
        if (tx.type === 'ngn_to_usd') {
          totalUsd += tx.targetAmount;
        }
      }
    }
  }

  return {
    totalUsd: Math.max(0, Number(totalUsd.toFixed(2))),
    totalNgn: Math.max(0, Number(totalNgn.toFixed(2))),
    availableUsd: Math.max(0, Number((totalUsd - pendingOutboundUsd).toFixed(2))),
    availableNgn: Math.max(0, Number((totalNgn - pendingOutboundNgn).toFixed(2))),
    pendingOutboundUsd: Number(pendingOutboundUsd.toFixed(2)),
    pendingOutboundNgn: Number(pendingOutboundNgn.toFixed(2))
  };
}

export function getAvailableBalance(userPhone: string | undefined, currency: Currency): number {
  const balances = computeUserLedgerBalances(userPhone);
  return currency === 'USD' ? balances.availableUsd : balances.availableNgn;
}

export function validateBalanceForTransfer(
  userPhone: string | undefined, 
  currency: Currency, 
  amount: number
): { valid: boolean; available: number; error?: string } {
  const available = getAvailableBalance(userPhone, currency);
  if (amount > available) {
    const symbol = currency === 'USD' ? '$' : '₦';
    return {
      valid: false,
      available,
      error: `Double-Spend Prevented: Amount (${symbol}${amount.toLocaleString()}) exceeds your available balance (${symbol}${available.toLocaleString()}) including pending offline queue.`
    };
  }
  return { valid: true, available };
}

export function getStoredUserProfile(userPhone?: string): UserProfile {
  const rawProfile = getRawStoredUserProfile();
  const phoneKey = getUserKeyPrefix(userPhone || rawProfile.phone);
  
  // If specific phone requested, try to load that profile
  let targetProfile = rawProfile;
  if (userPhone && getUserKeyPrefix(rawProfile.phone) !== phoneKey) {
    const matchedPreset = PRESET_ACCOUNTS.find(a => getUserKeyPrefix(a.profile.phone) === phoneKey);
    if (matchedPreset) {
      targetProfile = matchedPreset.profile;
    } else {
      targetProfile = secureVaultGet<UserProfile>(`meshpay_user_profile_${phoneKey}`, rawProfile);
    }
  }

  const balances = computeUserLedgerBalances(phoneKey);

  return {
    ...targetProfile,
    usdBalance: balances.totalUsd,
    ngnBalance: balances.totalNgn
  };
}

export function saveUserProfile(profile: UserProfile): void {
  secureVaultSet(KEYS.USER_PROFILE, profile);
  const pKey = getUserKeyPrefix(profile.phone);
  secureVaultSet(`meshpay_user_profile_${pKey}`, profile);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

export function getStoredTransactions(userPhone?: string): Transaction[] {
  const phoneKey = getUserKeyPrefix(userPhone);
  const key = `meshpay_txs_${phoneKey}`;
  const stored = secureVaultGet<Transaction[] | null>(key, null);
  if (stored) return stored;

  const seeded: Transaction[] = [];
  secureVaultSet(key, seeded);
  return seeded;
}

export function saveTransactions(txs: Transaction[], userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  secureVaultSet(`meshpay_txs_${phoneKey}`, txs);
  window.dispatchEvent(new Event('meshpay_transactions_updated'));
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

function findMatchingPeerUser(targetAcc?: string, targetDetail?: string, targetName?: string): UserProfile | undefined {
  const allKnownUsers: UserProfile[] = [
    INITIAL_USER_PROFILE,
    SECOND_USER_PROFILE,
    THIRD_USER_PROFILE
  ];

  const tAcc = (targetAcc || '').trim();
  const tDetail = (targetDetail || '').toLowerCase();
  const tName = (targetName || '').toLowerCase();

  return allKnownUsers.find(u => {
    const uAccNgn = (u.virtualAccountNgn || '').trim();
    const uAccUsd = (u.virtualAccountUsd || '').trim();
    const uPhone = (u.phone || '').trim();
    const uTag = (u.tag || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();

    if (tAcc && (tAcc === uAccNgn || tAcc === uAccUsd || tAcc === uPhone)) return true;
    if (uTag && tDetail.includes(uTag)) return true;
    if (uName && tName.includes(uName)) return true;
    return false;
  });
}

/**
 * Multi-Device Simulated BLE Mesh Peer Broadcast Delivery:
 * Writes transaction to both Sender's ledger and Recipient's ledger immediately.
 */
export function addTransaction(tx: Transaction, userPhone?: string): void {
  const senderProfile = getStoredUserProfile(userPhone);
  const senderPhoneKey = getUserKeyPrefix(senderProfile.phone);

  // 1. Anti-Double-Spend Check for Outbound Payments
  if (tx.type !== 'nearby_receive' && tx.type !== 'top_up') {
    const check = validateBalanceForTransfer(senderPhoneKey, tx.sourceCurrency, tx.sourceAmount);
    if (!check.valid) {
      throw new Error(check.error || 'Insufficient available balance.');
    }
  }

  // 2. Save Sender's Transaction
  const senderTxs = getStoredTransactions(senderPhoneKey);
  // Ensure idempotent deduplication by ID
  const filteredSenderTxs = senderTxs.filter(t => t.id !== tx.id);
  saveTransactions([tx, ...filteredSenderTxs], senderPhoneKey);

  // 3. BLE Mesh Peer Broadcast to Recipient Ledger (if recipient is a recognized Mesh user)
  if (tx.type !== 'nearby_receive' && tx.type !== 'top_up') {
    const recipient = findMatchingPeerUser(tx.accountNumber, tx.recipientDetail, tx.recipientName);

    if (recipient && getUserKeyPrefix(recipient.phone) !== senderPhoneKey) {
      const recipientPhoneKey = getUserKeyPrefix(recipient.phone);
      const amount = tx.targetAmount || tx.sourceAmount;
      const curr = tx.targetCurrency || tx.sourceCurrency || 'NGN';

      const creditTx: Transaction = {
        id: tx.id, // SAME ID & NONCE for idempotent multi-node reconciliation!
        type: 'nearby_receive',
        sourceAmount: amount,
        sourceCurrency: curr,
        targetAmount: amount,
        targetCurrency: curr,
        exchangeRate: tx.exchangeRate || 1.0,
        fee: 0,
        recipientName: senderProfile.name,
        recipientDetail: `${senderProfile.tag} (MeshPay Account)`,
        timestamp: tx.timestamp || new Date().toISOString(),
        status: tx.status, // Same pending or completed status
        isOffline: tx.isOffline,
        offlineSignature: tx.offlineSignature,
        offlineNonce: tx.offlineNonce,
        bankName: senderProfile.bankName,
        accountNumber: senderProfile.virtualAccountNgn,
        notes: `Received from ${senderProfile.name} (${senderProfile.tag}) via BLE Mesh (${tx.isOffline ? 'Queued Store & Forward' : 'Settled'})`
      };

      const recipientTxs = getStoredTransactions(recipientPhoneKey);
      const filteredRecipientTxs = recipientTxs.filter(t => t.id !== tx.id);
      saveTransactions([creditTx, ...filteredRecipientTxs], recipientPhoneKey);

      // Notification for recipient
      const amountStr = curr === 'USD' ? `$${amount.toLocaleString()}` : `₦${amount.toLocaleString()}`;
      addNotification({
        title: 'BLE Mesh Payment Received',
        message: `Received ${amountStr} from ${senderProfile.name} (${senderProfile.tag}). ${tx.status === 'queued_offline' ? 'Pending backend sync.' : 'Settled.'}`,
        type: 'transaction'
      }, recipientPhoneKey);
    }
  }

  // Notification for sender
  const amountStr = tx.sourceCurrency === 'NGN' ? `₦${tx.sourceAmount.toLocaleString()}` : `$${tx.sourceAmount.toLocaleString()}`;
  const isReceived = tx.type === 'nearby_receive' || tx.type === 'top_up';
  addNotification({
    title: isReceived ? 'Credit Alert Received' : 'Debit Alert Sent',
    message: `${isReceived ? 'Received' : 'Sent'} ${amountStr} ${isReceived ? 'from' : 'to'} ${tx.recipientName}. (${tx.status === 'queued_offline' ? 'Queued Store & Forward' : 'Completed'})`,
    type: 'transaction'
  }, senderPhoneKey);
}

export function getStoredNotifications(userPhone?: string): NotificationItem[] {
  const phoneKey = getUserKeyPrefix(userPhone);
  const key = `meshpay_notifs_${phoneKey}`;
  const stored = secureVaultGet<NotificationItem[] | null>(key, null);
  if (stored) return stored;

  const profile = getStoredUserProfile(phoneKey);
  const seeded = getInitialNotificationsForUser(phoneKey, profile.name);
  secureVaultSet(key, seeded);
  return seeded;
}

function getInitialNotificationsForUser(phoneKey: string, name: string): NotificationItem[] {
  return [
    {
      id: 'NOTIF_SEC_01',
      title: 'Security Alert: Biometric Vault Active',
      message: 'AES-256 encrypted vault and local ledger integrity protection active.',
      type: 'security',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      read: false
    },
    {
      id: 'NOTIF_SYS_01',
      title: 'Store & Forward Mesh Active',
      message: 'Zero-connectivity Store & Forward offline engine is active.',
      type: 'offline_sync',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      read: true
    }
  ];
}

export function saveNotifications(notifications: NotificationItem[], userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  secureVaultSet(`meshpay_notifs_${phoneKey}`, notifications);
  window.dispatchEvent(new Event('meshpay_notifications_updated'));
}

export function addNotification(
  notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>,
  userPhone?: string
): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  const current = getStoredNotifications(phoneKey);
  const newNotif: NotificationItem = {
    ...notif,
    id: 'NOTIF_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    read: false
  };
  saveNotifications([newNotif, ...current], phoneKey);
}

export function markAllNotificationsRead(userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  const current = getStoredNotifications(phoneKey);
  const updated = current.map(n => ({ ...n, read: true }));
  saveNotifications(updated, phoneKey);
}

export function markNotificationRead(id: string, userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  const current = getStoredNotifications(phoneKey);
  const updated = current.map(n => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated, phoneKey);
}

export function getOfflineQueuedTransactions(): Transaction[] {
  const allKnownPhones = ['08012345678', '08098765432', '07011223344'];
  const activeUser = getStoredUserProfile();
  const activePhoneKey = getUserKeyPrefix(activeUser.phone);
  if (!allKnownPhones.includes(activePhoneKey)) {
    allKnownPhones.push(activePhoneKey);
  }

  const queuedTxs: Transaction[] = [];
  const seenIds = new Set<string>();

  for (const phone of allKnownPhones) {
    const txs = getStoredTransactions(phone);
    for (const t of txs) {
      if (t.status === 'queued_offline' && !seenIds.has(t.id)) {
        seenIds.add(t.id);
        queuedTxs.push(t);
      }
    }
  }

  return queuedTxs;
}

/**
 * Reconciles all queued offline transactions across accounts idempotently.
 */
export async function processSyncQueue(
  onProgress?: (step: string, progress: number) => void
): Promise<{ syncedCount: number; errors: string[] }> {
  const allKnownPhones = ['08012345678', '08098765432', '07011223344'];
  const activeUser = getStoredUserProfile();
  const activePhoneKey = getUserKeyPrefix(activeUser.phone);
  if (!allKnownPhones.includes(activePhoneKey)) {
    allKnownPhones.push(activePhoneKey);
  }

  if (onProgress) onProgress('Scanning offline ledger for queued transactions...', 25);
  await new Promise(r => setTimeout(r, 400));

  let syncedCount = 0;
  const now = new Date().toISOString();

  for (const phone of allKnownPhones) {
    const txs = getStoredTransactions(phone);
    let updated = false;

    const newTxs = txs.map(t => {
      if (t.status === 'queued_offline') {
        updated = true;
        syncedCount++;
        return {
          ...t,
          status: 'completed' as const,
          syncTimestamp: now,
          notes: `${t.notes || ''} (Synced to core ledger at ${new Date().toLocaleTimeString()})`
        };
      }
      return t;
    });

    if (updated) {
      saveTransactions(newTxs, phone);
    }
  }

  if (onProgress) onProgress(`Synchronized ${syncedCount} queued transaction(s)!`, 100);
  await new Promise(r => setTimeout(r, 300));

  if (syncedCount > 0) {
    addNotification({
      title: 'Store & Forward Ledger Synchronized',
      message: `Successfully synchronized ${syncedCount} queued transaction(s) with MeshPay Core settlement server.`,
      type: 'offline_sync'
    });
  }

  window.dispatchEvent(new Event('meshpay_transactions_updated'));
  window.dispatchEvent(new Event('meshpay_profile_updated'));

  return { syncedCount, errors: [] };
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
  secureVaultSet(KEYS.LOGGED_IN, true);
  saveExchangeRate(INITIAL_EXCHANGE_RATE);
  window.dispatchEvent(new Event('meshpay_reset'));
}

export function generateOfflineSignature(): { signature: string; nonce: string } {
  const nonce = 'NONCE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const hash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { signature: hash, nonce };
}
