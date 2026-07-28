import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Key,
  Wifi
} from 'lucide-react';
import { PRESET_ACCOUNTS } from '../data/mockData';
import { switchActiveUserProfile, UserIdType } from '../lib/storage';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedAccount, setSelectedAccount] = useState(PRESET_ACCOUNTS[0]);
  const [email, setEmail] = useState(PRESET_ACCOUNTS[0].profile.email);
  const [password, setPassword] = useState(PRESET_ACCOUNTS[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // When user clicks any of the 3 preset login cards
  const handleSelectPresetCard = (account: typeof PRESET_ACCOUNTS[0]) => {
    setSelectedAccount(account);
    setEmail(account.profile.email);
    setPassword(account.password);

    // Auto verify and log in
    setVerifying(true);
    setStatusText(`Auto-filling credentials for ${account.profile.name}...`);

    setTimeout(() => {
      setStatusText(`Verifying 256-bit ECDSA Key Vault (${account.profile.tag})...`);
    }, 400);

    setTimeout(() => {
      switchActiveUserProfile(account.userId);
      setVerifying(false);
      onLoginSuccess();
    }, 1100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter email and password');

    setVerifying(true);
    setStatusText(`Verifying MeshPay Vault Keys for ${email}...`);

    setTimeout(() => {
      // Find matching preset or default to selected
      const match = PRESET_ACCOUNTS.find(a => a.profile.email.toLowerCase() === email.toLowerCase()) || selectedAccount;
      switchActiveUserProfile(match.userId);
      setVerifying(false);
      onLoginSuccess();
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center px-4 py-8 max-w-md mx-auto relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 space-y-5">
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 flex items-center justify-center mx-auto border border-indigo-400/30">
            <Zap className="w-8 h-8 fill-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="font-black text-2xl tracking-tight text-white">MeshPay</h1>
              <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                Mesh Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Cross-Border Remittance & Offline Peer-to-Peer Settlement Engine
            </p>
          </div>
        </div>

        {/* SIMULATED 3 LOGINS QUICK-SELECT DIV */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="font-extrabold text-xs text-slate-200">
                Preset Test Logins <span className="text-indigo-400 text-[10px] font-mono">(Click to Auto-Fill & Login)</span>
              </h3>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>

          {/* 3 Clickable Cards Div */}
          <div className="space-y-2">
            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = selectedAccount.userId === acc.userId;
              return (
                <div
                  key={acc.userId}
                  onClick={() => handleSelectPresetCard(acc)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-900/20 ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.profile.avatar}
                      alt={acc.profile.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white group-hover:text-indigo-300 transition-colors">
                          {acc.profile.name}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded">
                          {acc.profile.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{acc.profile.email}</span>
                        <span className="text-emerald-400 font-bold">{acc.balanceText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <span className="px-2 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold transition-all group-hover:scale-105 shadow-sm block">
                      Auto Fill
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@meshpay.io"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono font-medium text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Vault Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono font-medium text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {verifying ? (
              <div className="p-3 bg-indigo-950/80 border border-indigo-700/60 rounded-2xl text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-indigo-400 animate-spin" />
                <span>{statusText || 'Verifying Credentials...'}</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Sign In & Open Mesh Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Protected by ECDSA Offline Signatures & AES-256 Vault Encryption</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
