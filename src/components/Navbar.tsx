import React from 'react';
import { ShieldCheck, Zap, RefreshCw, Users, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
interface NavbarProps {
  user: UserProfile;
  isOnline: boolean;
  pendingOfflineCount: number;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onToggleCurrency: () => void;
  displayCurrency: 'USD' | 'NGN';
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  pendingOfflineCount,
  onOpenSync,
  onOpenSettings,
  onToggleCurrency,
  displayCurrency,
  onLogout
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-sm border-b border-slate-800">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Title: MeshPay */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg tracking-tight text-white">MeshPay</h1>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls: Currency & Utilities */}
        <div className="flex items-center gap-1.5">
          {/* Active User Name Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>{user.name.split(' ')[0]}</span>
          </div>

          {/* Currency Toggle */}
          <button
            onClick={onToggleCurrency}
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-colors text-slate-300"
            title="Toggle currency view"
          >
            <span className={displayCurrency === 'USD' ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}>USD</span>
            <span className="text-slate-600">/</span>
            <span className={displayCurrency === 'NGN' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}>NGN</span>
          </button>

          {/* Sync indicator if pending */}
          {pendingOfflineCount > 0 && (
            <button
              onClick={onOpenSync}
              className="p-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-xs px-2"
              title={`${pendingOfflineCount} transaction(s) queued`}
            >
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="font-extrabold text-[10px]">{pendingOfflineCount}</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Log out to Login Page"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};


