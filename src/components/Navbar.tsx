import React, { useState } from 'react';
import { ShieldCheck, Zap, RefreshCw, LogOut, Wifi, WifiOff, AlertTriangle, Lock, Bell, UserCheck, ChevronDown, CheckCircle2, X } from 'lucide-react';
import { UserProfile } from '../types';
import { PRESET_ACCOUNTS } from '../data/mockData';
import { switchActiveUserProfile } from '../lib/storage';

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
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleSwitchAccount = (userId: string) => {
    switchActiveUserProfile(userId);
    setShowAccountModal(false);
    window.location.reload();
  };

  const isUsdAccount = user.usdBalance > 0 && user.ngnBalance === 0;

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-sm border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          {/* App Title & Account Switch Pill */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base tracking-tight text-white">MeshPay</h1>
                {(!isOnline || isWeakSignal) && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/30">
                    {!isOnline ? (
                      <>
                        <WifiOff className="w-2.5 h-2.5 text-amber-400" />
                        <span>Offline</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                        <span>Weak</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center/Right side controls: Account Switch Pill, Notification & Settings */}
          <div className="flex items-center gap-1.5">
            {/* Account Switcher Pill */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition-all shadow-sm"
              title="Switch Demo Accounts"
            >
              <img src={user.avatar} alt={user.name} className="w-4.5 h-4.5 rounded-full object-cover border border-indigo-400" />
              <div className="text-left font-bold text-[11px] leading-tight">
                <span className="text-white block max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                <span className="text-emerald-400 text-[9px] font-mono block">
                  {isUsdAccount ? '$USD' : '₦NGN'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

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

      {/* Account Switcher Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">Switch Demo Account</h3>
              </div>
              <button
                onClick={() => setShowAccountModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an account below to test cross-border payments between US Diaspora ($USD) and Nigerian Resident (₦NGN):
            </p>

            <div className="space-y-2">
              {PRESET_ACCOUNTS.map((acc) => {
                const isCurrent = acc.profile.phone === user.phone;
                return (
                  <div
                    key={acc.userId}
                    onClick={() => handleSwitchAccount(acc.userId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-indigo-950/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img src={acc.profile.avatar} alt={acc.profile.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{acc.profile.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-indigo-400 font-mono">{acc.roleLabel}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.balanceText}</div>
                      </div>
                    </div>

                    {isCurrent && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
              MeshPay Multi-Ledger Sandbox Engine
            </div>
          </div>
        </div>
      )}
    </>
  );
};


