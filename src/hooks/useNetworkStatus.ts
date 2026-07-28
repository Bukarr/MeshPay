import { useState, useEffect, useCallback } from 'react';
import { getOfflineQueuedTransactions, processSyncQueue } from '../lib/storage';

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

  const [syncState, setSyncState] = useState<SyncProgressState>({
    isSyncing: false,
    stepMessage: '',
    progressPercent: 0,
    lastSyncedCount: 0
  });

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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      conn.addEventListener('change', checkConnectionQuality);
    }

    checkConnectionQuality();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, [checkConnectionQuality]);

  const triggerAutoSync = useCallback(async () => {
    const queued = getOfflineQueuedTransactions();
    if (queued.length === 0) return;

    setSyncState({
      isSyncing: true,
      stepMessage: 'Connecting to MeshPay Ledger... Reconciling offline nonces',
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

      setSyncState({
        isSyncing: false,
        stepMessage: `Synced ${result.syncedCount} transaction(s) successfully!`,
        progressPercent: 100,
        lastSyncedCount: result.syncedCount
      });

      setTimeout(() => {
        setSyncState(s => ({ ...s, stepMessage: '', progressPercent: 0 }));
      }, 4000);
    } catch (err) {
      setSyncState({
        isSyncing: false,
        stepMessage: 'Sync failed. Will auto-retry when connection stabilizes.',
        progressPercent: 0,
        lastSyncedCount: 0
      });
    }
  }, []);

  // When coming back online, auto-trigger sync if queue is not empty
  useEffect(() => {
    if (realOnline && !isWeakSignal) {
      const queued = getOfflineQueuedTransactions();
      if (queued.length > 0) {
        triggerAutoSync();
      }
    }
  }, [realOnline, isWeakSignal, triggerAutoSync]);

  return {
    isOnline: realOnline,
    isWeakSignal,
    syncState,
    triggerAutoSync,
    pendingOfflineCount: getOfflineQueuedTransactions().length
  };
}

