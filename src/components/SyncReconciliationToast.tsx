import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { SyncToastPayload } from '../lib/backgroundSync';

interface SyncReconciliationToastProps {
  onViewActivity?: () => void;
}

export const SyncReconciliationToast: React.FC<SyncReconciliationToastProps> = ({ onViewActivity }) => {
  const [toastData, setToastData] = useState<SyncToastPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleSyncToast = (e: Event) => {
      const customEvt = e as CustomEvent<SyncToastPayload>;
      if (customEvt.detail && customEvt.detail.syncedCount > 0) {
        setToastData(customEvt.detail);
        setVisible(true);

        // Auto hide after 8 seconds
        const timer = setTimeout(() => {
          setVisible(false);
        }, 8000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('meshpay_sync_reconciliation_toast', handleSyncToast);
    return () => {
      window.removeEventListener('meshpay_sync_reconciliation_toast', handleSyncToast);
    };
  }, []);

  if (!visible || !toastData) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-fadeIn transition-all">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl shadow-2xl p-4 text-white flex items-start gap-3 backdrop-blur-xl bg-slate-900/95">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-xs text-emerald-400 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sync Reconciliation Complete</span>
            </div>
            <button
              onClick={() => setVisible(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            Resolved <span className="font-extrabold text-emerald-300">{toastData.syncedCount} offline transaction(s)</span> automatically with MeshPay core settlement node!
          </p>

          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400/90 font-mono">
              <ShieldCheck className="w-3 h-3" />
              HMAC Seal Verified
            </span>

            {onViewActivity && (
              <button
                onClick={() => {
                  setVisible(false);
                  onViewActivity();
                }}
                className="text-indigo-400 font-extrabold hover:underline flex items-center gap-1"
              >
                <span>View Receipts</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
