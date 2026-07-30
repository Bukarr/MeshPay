import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { isPwaInstallable, promptPwaInstall } from '../lib/backgroundSync';

export const PwaInstallBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState<boolean>(() => isPwaInstallable());
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handlePwaReady = () => setCanInstall(true);
    window.addEventListener('meshpay_pwa_installable', handlePwaReady);
    return () => window.removeEventListener('meshpay_pwa_installable', handlePwaReady);
  }, []);

  const handleInstall = async () => {
    const success = await promptPwaInstall();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setDismissed(true), 3000);
    }
  };

  if (dismissed || (!canInstall && !installedSuccess)) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-2 animate-fadeIn">
      <div className="bg-gradient-to-r from-indigo-900/90 to-slate-900 border border-indigo-500/40 rounded-2xl p-3 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1 font-extrabold text-xs text-white">
              <span>Install MeshPay Web App</span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </div>
            <p className="text-[10px] text-indigo-200">
              {installedSuccess ? 'App Installed Successfully!' : 'Native Home Screen & Offline Wallet Experience'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!installedSuccess ? (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <Download className="w-3 h-3" />
              <span>Install</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Installed</span>
            </span>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
