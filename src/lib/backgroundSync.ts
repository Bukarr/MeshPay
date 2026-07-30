/**
 * Background Sync Reconciliation Service & PWA Manager for MeshPay
 * 
 * 1. Automatic Background Sync: Automatically detects online status restoration and executes 
 *    cryptographic reconciliation of pending offline & store-and-forward transactions.
 * 2. Background Worker Listener: Listens for service worker messages when app is backgrounded.
 * 3. Toast Event Dispatcher: Fires custom toast event when sync succeeds.
 * 4. PWA Installation Handler: Captures beforeinstallprompt event for seamless web app installation.
 */

import { silentSyncStoreAndForwardQueue, getStoreAndForwardQueue } from './storeAndForward';
import { getOfflineQueuedTransactions, processSyncQueue } from './storage';

export interface SyncToastPayload {
  syncedCount: number;
  timestamp: number;
  details: string;
}

let deferredInstallPrompt: any = null;

/**
 * Register Service Worker & Background Sync
 */
export function initBackgroundSyncAndPwa(): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Request Background Sync if supported
        if ('sync' in reg) {
          (reg as any).sync.register('meshpay-offline-sync').catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });

    // Listen for messages from Service Worker (e.g., when background sync fires in SW)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MESHPAY_BACKGROUND_SYNC_REQUEST') {
        executeReconciliationProcess('sw_trigger');
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSwMessage);
  }

  // 2. Online Event Listener
  const handleOnline = () => {
    // Attempt automatic background reconciliation when network restores
    setTimeout(() => {
      executeReconciliationProcess('online_event');
    }, 1000);
  };

  window.addEventListener('online', handleOnline);

  // 3. PWA Installation Event Listener
  const handleBeforeInstall = (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    window.dispatchEvent(new Event('meshpay_pwa_installable'));
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstall);

  // Periodic network check every 30s to catch silent network recovery
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      const queuedCount = getOfflineQueuedTransactions().length + getStoreAndForwardQueue().filter(p => p.status === 'queued_store_forward').length;
      if (queuedCount > 0) {
        executeReconciliationProcess('periodic_check');
      }
    }
  }, 30000);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    clearInterval(intervalId);
  };
}

let isReconciling = false;

/**
 * Executes the background sync reconciliation process and dispatches toast alert
 */
export async function executeReconciliationProcess(source: string = 'manual'): Promise<number> {
  if (isReconciling) return 0;

  const queuedTxs = getOfflineQueuedTransactions();
  const queuedSf = getStoreAndForwardQueue().filter(p => p.status === 'queued_store_forward');
  const totalQueued = queuedTxs.length + queuedSf.length;

  if (totalQueued === 0) return 0;

  isReconciling = true;

  try {
    // 1. Reconcile Store & Forward Queue
    const sfResult = await silentSyncStoreAndForwardQueue();

    // 2. Reconcile standard offline queue if any
    const stdResult = await processSyncQueue();

    const totalSynced = sfResult.syncedCount + stdResult.syncedCount;

    if (totalSynced > 0) {
      // Dispatch custom toast notification event
      const toastPayload: SyncToastPayload = {
        syncedCount: totalSynced,
        timestamp: Date.now(),
        details: `Successfully reconciled ${totalSynced} pending offline transaction(s) with MeshPay Core Ledger.`
      };

      window.dispatchEvent(
        new CustomEvent('meshpay_sync_reconciliation_toast', { detail: toastPayload })
      );

      // Trigger Web Notification if app is in background and permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('⚡ MeshPay Sync Reconciliation', {
            body: toastPayload.details,
            icon: '/icon-192.svg'
          });
        } catch (e) {}
      }
    }

    isReconciling = false;
    return totalSynced;
  } catch (err) {
    isReconciling = false;
    console.error('Background sync reconciliation error:', err);
    return 0;
  }
}

/**
 * Check if app can be installed as PWA
 */
export function isPwaInstallable(): boolean {
  return !!deferredInstallPrompt;
}

/**
 * Prompt user to install PWA app
 */
export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return choiceResult.outcome === 'accepted';
  } catch (err) {
    return false;
  }
}
