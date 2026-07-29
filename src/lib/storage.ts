import { Transaction, UserProfile, ExchangeRate, NotificationItem } from '../types';
import { INITIAL_EXCHANGE_RATE, INITIAL_USER_PROFILE, SECOND_USER_PROFILE, THIRD_USER_PROFILE } from '../data/mockData';
import { secureVaultGet, secureVaultSet, secureVaultRemove, verifyVaultIntegrity, isTamperDetected, getLastTamperedKey } from './secureVault';
import { silentSyncStoreAndForwardQueue, getStoreAndForwardQueue } from './storeAndForward';

export { verifyVaultIntegrity, isTamperDetected, getLastTamperedKey };

const KEYS = {
  USER_PROFILE: 'meshpay_custom_user_profile',
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
    phone: '08012345678',
    tag: '$new_user',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    usdBalance: 500,
    ngnBalance: 150000,
    virtualAccountNgn: '9000000001',
    virtualAccountUsd: '400000000001',
    bankName: 'MeshPay Digital Bank / Vault',
    tier: 'Tier 3 (Verified)',
    pin: '1234',
    biometricEnabled: true,
    kycVerified: true,
    publicKey: 'mp_sec_0x' + Math.random().toString(16).substring(2, 10)
  };

  const stored = secureVaultGet<UserProfile>(KEYS.USER_PROFILE, defaultProfile);
  const pKey = getUserKeyPrefix(stored.phone);
  const updatedUserPhoneSpecific = secureVaultGet<UserProfile | null>(`meshpay_user_profile_${pKey}`, null);
  if (updatedUserPhoneSpecific) {
    return updatedUserPhoneSpecific;
  }
  return stored;
}

export function saveUserProfile(profile: UserProfile): void {
  secureVaultSet(KEYS.USER_PROFILE, profile);
  const pKey = getUserKeyPrefix(profile.phone);
  secureVaultSet(`meshpay_user_profile_${pKey}`, profile);
  window.dispatchEvent(new Event('meshpay_profile_updated'));
}

function getUserKeyPrefix(phone?: string): string {
  const p = phone || getStoredUserProfile().phone || '08012345678';
  return p.replace(/\D/g, '').replace(/^234/, '0');
}

export function getStoredTransactions(userPhone?: string): Transaction[] {
  const phoneKey = getUserKeyPrefix(userPhone);
  const key = `meshpay_txs_${phoneKey}`;
  const stored = secureVaultGet<Transaction[] | null>(key, null);
  if (stored) return stored;

  const profile = getStoredUserProfile();
  const seeded = getInitialTransactionsForUser(phoneKey, profile.name);
  secureVaultSet(key, seeded);
  return seeded;
}

function getInitialTransactionsForUser(phoneKey: string, name: string): Transaction[] {
  if (phoneKey.endsWith('08012345678') || name.includes('Adewale')) {
    return [
      {
        id: 'TX_ADE_01',
        type: 'top_up',
        sourceAmount: 250000,
        sourceCurrency: 'NGN',
        targetAmount: 250000,
        targetCurrency: 'NGN',
        exchangeRate: 1,
        fee: 0,
        recipientName: 'Access Bank Deposit',
        recipientDetail: 'Direct Vault Credit (044)',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'completed',
        isOffline: false,
        bankName: 'Access Bank',
        accountNumber: '9021849201'
      },
      {
        id: 'TX_ADE_02',
        type: 'nearby_send',
        sourceAmount: 45000,
        sourceCurrency: 'NGN',
        targetAmount: 45000,
        targetCurrency: 'NGN',
        exchangeRate: 1,
        fee: 0,
        recipientName: 'Fatima Bello',
        recipientDetail: '$fatima_b (BLE Mesh)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        status: 'completed',
        isOffline: true,
        offlineSignature: '0x9f8a3c42b1e',
        bankName: 'MeshPay Digital Bank / Vault',
        accountNumber: '8092318492'
      },
      {
        id: 'TX_ADE_03',
        type: 'usd_to_ngn',
        sourceAmount: 200,
        sourceCurrency: 'USD',
        targetAmount: 305100,
        targetCurrency: 'NGN',
        exchangeRate: 1525.50,
        fee: 1.50,
        recipientName: 'FX Remittance Swap',
        recipientDetail: 'USD to NGN Instant Payout',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: 'completed',
        isOffline: false
      }
    ];
  } else if (phoneKey.endsWith('08098765432') || name.includes('Fatima')) {
    return [
      {
        id: 'TX_FAT_01',
        type: 'nearby_receive',
        sourceAmount: 45000,
        sourceCurrency: 'NGN',
        targetAmount: 45000,
        targetCurrency: 'NGN',
        exchangeRate: 1,
        fee: 0,
        recipientName: 'Adewale Lawson',
        recipientDetail: '$adewale_l (BLE Mesh)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        status: 'completed',
        isOffline: true,
        offlineSignature: '0x3a1b8cf11d',
        bankName: 'MeshPay Digital Bank / Vault',
        accountNumber: '9021849201'
      },
      {
        id: 'TX_FAT_02',
        type: 'usd_to_ngn',
        sourceAmount: 100,
        sourceCurrency: 'USD',
        targetAmount: 152550,
        targetCurrency: 'NGN',
        exchangeRate: 1525.50,
        fee: 1.00,
        recipientName: 'International Remittance',
        recipientDetail: 'USD Wallet to NGN Vault',
        timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
        status: 'completed',
        isOffline: false
      }
    ];
  } else if (phoneKey.endsWith('07011223344') || name.includes('Chinedu')) {
    return [
      {
        id: 'TX_CHI_01',
        type: 'top_up',
        sourceAmount: 85000,
        sourceCurrency: 'NGN',
        targetAmount: 85000,
        targetCurrency: 'NGN',
        exchangeRate: 1,
        fee: 0,
        recipientName: 'Moniepoint POS Settlement',
        recipientDetail: 'Terminal Payout (50515)',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'completed',
        isOffline: false
      }
    ];
  }

  return [
    {
      id: 'TX_NEW_01',
      type: 'top_up',
      sourceAmount: 1000000,
      sourceCurrency: 'NGN',
      targetAmount: 1000000,
      targetCurrency: 'NGN',
      exchangeRate: 1,
      fee: 0,
      recipientName: 'MeshPay Account Opening Bonus',
      recipientDetail: 'Digital Bank Initial Deposit',
      timestamp: new Date().toISOString(),
      status: 'completed',
      isOffline: false,
      bankName: 'MeshPay Digital Bank / Vault'
    }
  ];
}

export function saveTransactions(txs: Transaction[], userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  secureVaultSet(`meshpay_txs_${phoneKey}`, txs);
  window.dispatchEvent(new Event('meshpay_transactions_updated'));
}

function creditRecipientIfMeshUser(tx: Transaction, senderPhoneKey?: string): void {
  // Only process outgoing transfers
  if (tx.type === 'nearby_receive' || tx.type === 'top_up') return;

  const senderProfile = getStoredUserProfile();

  const allKnownUsers: UserProfile[] = [
    { ...INITIAL_USER_PROFILE, phone: '08012345678' },
    { ...SECOND_USER_PROFILE, phone: '08098765432' },
    { ...THIRD_USER_PROFILE, phone: '07011223344' }
  ];

  if (senderProfile && !allKnownUsers.some(u => getUserKeyPrefix(u.phone) === getUserKeyPrefix(senderProfile.phone))) {
    allKnownUsers.push(senderProfile);
  }

  const targetAcc = (tx.accountNumber || '').trim();
  const targetDetail = (tx.recipientDetail || '').toLowerCase();
  const targetName = (tx.recipientName || '').toLowerCase();

  const recipient = allKnownUsers.find(u => {
    const uPhoneKey = getUserKeyPrefix(u.phone);
    if (senderPhoneKey && uPhoneKey === senderPhoneKey) return false;

    const uAccNgn = (u.virtualAccountNgn || '').trim();
    const uAccUsd = (u.virtualAccountUsd || '').trim();
    const uTag = (u.tag || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();

    if (targetAcc && (targetAcc === uAccNgn || targetAcc === uAccUsd || targetAcc === u.phone)) {
      return true;
    }
    if (uTag && targetDetail.includes(uTag)) {
      return true;
    }
    if (uName && targetName.includes(uName)) {
      return true;
    }
    return false;
  });

  if (recipient) {
    const recipientPhoneKey = getUserKeyPrefix(recipient.phone);
    const amount = tx.targetAmount || tx.sourceAmount;
    const curr = tx.targetCurrency || tx.sourceCurrency || 'NGN';

    const creditTx: Transaction = {
      id: 'tx_rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'nearby_receive',
      sourceAmount: amount,
      sourceCurrency: curr as any,
      targetAmount: amount,
      targetCurrency: curr as any,
      exchangeRate: 1.0,
      fee: 0,
      recipientName: senderProfile.name || 'MeshPay Peer',
      recipientDetail: `${senderProfile.tag || '$mesh_user'} (MeshPay Digital Bank / Vault)`,
      timestamp: tx.timestamp || new Date().toISOString(),
      status: 'completed',
      isOffline: tx.isOffline || false,
      bankName: senderProfile.bankName || 'MeshPay Digital Bank / Vault',
      accountNumber: senderProfile.virtualAccountNgn,
      notes: `Credit received from ${senderProfile.name} (${senderProfile.tag})`
    };

    const existingRecipientTxs = getStoredTransactions(recipientPhoneKey);
    saveTransactions([creditTx, ...existingRecipientTxs], recipientPhoneKey);

    const storedRecipientProfile = secureVaultGet<UserProfile>(
      `meshpay_user_profile_${recipientPhoneKey}`,
      recipient
    );

    if (curr === 'USD') {
      storedRecipientProfile.usdBalance = (storedRecipientProfile.usdBalance || 0) + amount;
    } else {
      storedRecipientProfile.ngnBalance = (storedRecipientProfile.ngnBalance || 0) + amount;
    }

    secureVaultSet(`meshpay_user_profile_${recipientPhoneKey}`, storedRecipientProfile);

    if (getUserKeyPrefix(senderProfile.phone) === recipientPhoneKey) {
      saveUserProfile(storedRecipientProfile);
    }

    const amountStr = curr === 'USD' ? `$${amount.toLocaleString()}` : `₦${amount.toLocaleString()}`;
    addNotification({
      title: 'Credit Alert Received',
      message: `You received ${amountStr} from ${senderProfile.name} (${senderProfile.tag}).`,
      type: 'transaction'
    }, recipientPhoneKey);
  }
}

export function addTransaction(tx: Transaction, userPhone?: string): void {
  const phoneKey = getUserKeyPrefix(userPhone);
  const allTxs = getStoredTransactions(phoneKey);
  saveTransactions([tx, ...allTxs], phoneKey);

  const profile = getStoredUserProfile();
  if (!userPhone || getUserKeyPrefix(profile.phone) === phoneKey) {
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

  // Auto credit recipient if recipient is a MeshPay user
  creditRecipientIfMeshUser(tx, phoneKey);

  // Generate Transaction Alert Notification for sender
  const amountStr = tx.sourceCurrency === 'NGN' ? `₦${tx.sourceAmount.toLocaleString()}` : `$${tx.sourceAmount.toLocaleString()}`;
  const isReceived = tx.type === 'nearby_receive' || tx.type === 'top_up';
  addNotification({
    title: isReceived ? 'Credit Alert Received' : 'Debit Alert Sent',
    message: `${isReceived ? 'Received' : 'Sent'} ${amountStr} ${isReceived ? 'from' : 'to'} ${tx.recipientName}. (${tx.status === 'queued_offline' ? 'Queued Store & Forward' : 'Completed'})`,
    type: 'transaction'
  }, phoneKey);
}

export function getStoredNotifications(userPhone?: string): NotificationItem[] {
  const phoneKey = getUserKeyPrefix(userPhone);
  const key = `meshpay_notifs_${phoneKey}`;
  const stored = secureVaultGet<NotificationItem[] | null>(key, null);
  if (stored) return stored;

  const profile = getStoredUserProfile();
  const seeded = getInitialNotificationsForUser(phoneKey, profile.name);
  secureVaultSet(key, seeded);
  return seeded;
}

function getInitialNotificationsForUser(phoneKey: string, name: string): NotificationItem[] {
  return [
    {
      id: 'NOTIF_SEC_01',
      title: 'Security Alert: Biometric Vault Locked',
      message: 'Hardware-backed biometric authentication and 4-digit security PIN protection are active.',
      type: 'security',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      read: false
    },
    {
      id: 'NOTIF_TX_01',
      title: 'Transaction Alert: Welcome Bonus',
      message: `Your MeshPay Digital Bank account (${phoneKey}) has been successfully provisioned.`,
      type: 'transaction',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      read: false
    },
    {
      id: 'NOTIF_SYS_01',
      title: 'Store & Forward Mesh Active',
      message: 'Zero-connectivity Store & Forward offline engine is monitoring nearby Bluetooth peers.',
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
  const all = getStoredTransactions();
  const queuedTxs = all.filter(t => t.status === 'queued_offline');
  return queuedTxs;
}

export async function processSyncQueue(
  onProgress?: (step: string, progress: number) => void
): Promise<{ syncedCount: number; errors: string[] }> {
  const res = await silentSyncStoreAndForwardQueue(onProgress);
  if (res.syncedCount > 0) {
    addNotification({
      title: 'Store & Forward Sync Complete',
      message: `Successfully synchronized ${res.syncedCount} queued transaction(s) with MeshPay Core settlement server.`,
      type: 'offline_sync'
    });
  }
  return res;
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
  secureVaultSet(KEYS.LOGGED_IN, false);
  saveExchangeRate(INITIAL_EXCHANGE_RATE);
  window.dispatchEvent(new Event('meshpay_reset'));
}

export function generateOfflineSignature(): { signature: string; nonce: string } {
  const nonce = 'NONCE_' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const hash = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { signature: hash, nonce };
}
