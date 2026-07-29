import { useState, useEffect, useCallback } from 'react';
import { getOfflineQueuedTransactions, processSyncQueue, isTamperDetected } from '../lib/storage';
import { getStoreAndForwardQueue, StoreAndForwardPacket } from '../lib/storeAndForward';

export interface SyncProgressState {
  isSyncing: boolean;
  stepMessage: string;
  progressPercent: number;
  lastSyncedCount: number;
}

export function useNetworkStatus() {
  const [realOnline, setRealOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [isWeakSignal, setIsWeakSignal] = useState<boolean>(false);
  const [sfQueue, setSfQueue] = useState<StoreAndForwardPacket[]>(() => getStoreAndForwardQueue());
  const [tamperAlert, setTamperAlert] = useState<boolean>(() => isTamperDetected());

  const [syncState, setSyncState] = useState<SyncProgressState>({
    isSyncing: false,
    stepMessage: '',
    progressPercent: 0,
    lastSyncedCount: 0
  });

  const refreshQueue = useCallback(() => {
    setSfQueue(getStoreAndForwardQueue());
    setTamperAlert(isTamperDetected());
  }, []);

  const checkConnectionQuality = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      setRealOnline(false);
      setIsWeakSignal(false);
      return;
    }

    setRealOnline(true);

    // Network Information API check if supported by browser
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const isSlow = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.rtt > 800 || conn.saveData;
      setIsWeakSignal(!!isSlow);
    } else {
      setIsWeakSignal(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => checkConnectionQuality();
    const handleOffline = () => {
      setRealOnline(false);
      setIsWeakSignal(false);
    };
    const handleSfUpdated = () => refreshQueue();
    const handleTamperAlert = () => setTamperAlert(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('meshpay_store_forward_updated', handleSfUpdated);
    window.addEventListener('meshpay_transactions_updated', handleSfUpdated);
    window.addEventListener('meshpay_security_tamper_detected', handleTamperAlert);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', checkConnectionQuality);
    }

    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('meshpay_store_forward_updated', handleSfUpdated);
      window.removeEventListener('meshpay_transactions_updated', handleSfUpdated);
      window.removeEventListener('meshpay_security_tamper_detected', handleTamperAlert);
      if (conn) {
        conn.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, [checkConnectionQuality, refreshQueue]);

  const triggerAutoSync = useCallback(async () => {
    const queuedCount = getOfflineQueuedTransactions().length + getStoreAndForwardQueue().filter(p => p.status === 'queued_store_forward').length;
    if (queuedCount === 0) return;

    setSyncState({
      isSyncing: true,
      stepMessage: 'Store & Forward: Connecting to Mesh Core Node... Validating Nonces',
      progressPercent: 15,
      lastSyncedCount: 0
    });

    try {
      const result = await processSyncQueue((msg, pct) => {
        setSyncState(s => ({
          ...s,
          stepMessage: msg,
          progressPercent: pct
        }));
      });

      refreshQueue();

      setSyncState({
        isSyncing: false,
        stepMessage: `Synced ${result.syncedCount} Store & Forward transaction(s) successfully!`,
        progressPercent: 100,
        lastSyncedCount: result.syncedCount
      });

      setTimeout(() => {
        setSyncState(s => ({ ...s, stepMessage: '', progressPercent: 0 }));
      }, 4000);
    } catch (err) {
      setSyncState({
        isSyncing: false,
        stepMessage: 'Sync failed. Will auto-retry silently when connection stabilizes.',
        progressPercent: 0,
        lastSyncedCount: 0
      });
    }
  }, [refreshQueue]);

  // When coming back online, silently auto-trigger sync if store-and-forward queue has items
  useEffect(() => {
    if (realOnline && !isWeakSignal) {
      const queuedCount = getOfflineQueuedTransactions().length + getStoreAndForwardQueue().filter(p => p.status === 'queued_store_forward').length;
      if (queuedCount > 0) {
        triggerAutoSync();
      }
    }
  }, [realOnline, isWeakSignal, triggerAutoSync]);

  const pendingOfflineCount = getOfflineQueuedTransactions().length + sfQueue.filter(p => p.status === 'queued_store_forward').length;

  return {
    isOnline: realOnline,
    isWeakSignal,
    isStoreAndForwardActive: !realOnline || isWeakSignal,
    sfQueue,
    tamperAlert,
    syncState,
    triggerAutoSync,
    pendingOfflineCount
  };
}
