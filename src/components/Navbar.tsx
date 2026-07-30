import React from 'react';
import { ShieldCheck, Zap, RefreshCw, LogOut, Wifi, WifiOff, AlertTriangle, Lock, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  isOnline: boolean;
  isWeakSignal?: boolean;
  tamperAlert?: boolean;
  pendingOfflineCount: number;
  unreadNotificationCount?: number;
  onOpenNotifications: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onToggleCurrency: () => void;
  displayCurrency: 'USD' | 'NGN';
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isOnline,
  isWeakSignal = false,
  tamperAlert = false,
  pendingOfflineCount,
  unreadNotificationCount = 0,
  onOpenNotifications,
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
              {(!isOnline || isWeakSignal) && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/30">
                  {!isOnline ? (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                      <span>Store & Forward (Offline)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      <span>Weak Signal</span>
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls: Notification & Sync Utilities */}
        <div className="flex items-center gap-1.5">
          {/* Notification Center Trigger */}
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors relative"
            title="Notifications & Security Alerts"
          >
            <Bell className="w-4 h-4 text-indigo-400" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-sm">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Sync indicator if pending */}
          {pendingOfflineCount > 0 && (
            <button
              onClick={onOpenSync}
              className="p-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-xs px-2"
              title={`${pendingOfflineCount} Store & Forward transaction(s) queued for silent sync`}
            >
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
              <span className="font-extrabold text-[10px]">{pendingOfflineCount}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


