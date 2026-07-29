import React from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  Users,
  LogOut
} from 'lucide-react';
import { resetDemoState, setUserLoggedIn } from '../lib/storage';

interface SettingsPageProps {
  user: UserProfile;
  isOnline: boolean;
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, isOnline, onClose }) => {
  const handleReset = () => {
    if (confirm('Reset MeshPay wallet state to initial balance?')) {
      resetDemoState();
      window.location.reload();
    }
  };

  const handleLogout = () => {
    setUserLoggedIn(false);
    window.location.reload();
  };

  return (
    <div className="space-y-4 pb-20 pt-3 px-4 max-w-md mx-auto text-slate-800">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-3">
        <div className="relative w-20 h-20 mx-auto">
          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover border-2 border-indigo-600 shadow-sm" />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white font-bold" />
          </span>
        </div>

        <div>
          <h2 className="font-extrabold text-base text-slate-900">{user.name}</h2>
          <p className="text-xs text-slate-500 font-mono">{user.email} • {user.tag}</p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>{user.tier}</span>
        </div>
      </div>

      {/* Account Details & Virtual Vault Info */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Account Credentials</h3>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 font-medium">
          <div className="flex justify-between">
            <span className="text-slate-500">NGN Virtual Account</span>
            <span className="font-mono font-bold text-slate-900">{user.virtualAccountNgn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Settlement Bank</span>
            <span className="font-bold text-indigo-600">{user.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">USD Routing Vault</span>
            <span className="font-mono text-slate-900">{user.virtualAccountUsd}</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Key & Security */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">P2P Mesh Security</h3>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              Security PIN
            </span>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">{user.pin}</span>
          </div>

          <div className="border-t border-slate-200 my-1 pt-2">
            <span className="text-slate-500 font-bold block mb-1">ECDSA Public Key Signature:</span>
            <code className="text-[10px] text-slate-700 bg-white border border-slate-200 p-2 rounded-xl block font-mono break-all">
              {user.publicKey}
            </code>
          </div>
        </div>
      </div>

      {/* Wallet Management */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Wallet Operations</h3>

        <button
          onClick={handleReset}
          className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Reset Wallet State</span>
        </button>
      </div>
    </div>
  );
};


