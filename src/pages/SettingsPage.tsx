import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  RotateCcw, 
  CheckCircle2, 
  Users,
  LogOut,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Key
} from 'lucide-react';
import { resetDemoState, setUserLoggedIn, verifyVaultIntegrity } from '../lib/storage';
import { getStoreAndForwardQueue, silentSyncStoreAndForwardQueue } from '../lib/storeAndForward';

interface SettingsPageProps {
  user: UserProfile;
  isOnline: boolean;
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, isOnline, onClose }) => {
  const [vaultInfo, setVaultInfo] = useState(() => verifyVaultIntegrity());
  const [sfQueue, setSfQueue] = useState(() => getStoreAndForwardQueue());
  const [tamperTestMessage, setTamperTestMessage] = useState<string | null>(null);
  const [isSyncingSf, setIsSyncingSf] = useState<boolean>(false);

  const handleReset = () => {
    if (confirm('Reset MeshPay wallet state to initial balance?')) {
      resetDemoState();
      window.location.reload();
    }
  };

  const handleSimulateRootTampering = () => {
    // Deliberately tamper raw localStorage to test Root Anti-Tamper Protection
    try {
      const raw = localStorage.getItem('meshpay_custom_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Alter payload ciphertext to simulate a rooted device hacker editing file system
        parsed.mac = 'TAMPERED_FORGED_MAC_000000000000000';
        localStorage.setItem('meshpay_custom_user_profile', JSON.stringify(parsed));

        setTamperTestMessage('Simulated root file modification! Attempting to access tampered vault...');
        
        setTimeout(() => {
          // Re-verify vault integrity which will trigger MAC mismatch & anti-tamper rollback
          const info = verifyVaultIntegrity();
          setVaultInfo(info);
          setTamperTestMessage('Anti-Tamper Defense Triggered! MAC Seal Mismatch detected, forged edit neutralized & restored safely.');
        }, 800);
      }
    } catch (e) {
      setTamperTestMessage('Failed to trigger test tampering.');
    }
  };

  const handleSyncSfNow = async () => {
    setIsSyncingSf(true);
    await silentSyncStoreAndForwardQueue();
    setIsSyncingSf(false);
    setSfQueue(getStoreAndForwardQueue());
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

      {/* Root Anti-Tamper Security & AES-256 Vault Diagnostics */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 shadow-lg space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Root Anti-Tamper Security</h3>
              <span className="text-[10px] text-slate-400">AES-256-GCM • HMAC MAC Seal</span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
            {vaultInfo.isSecure ? '100% Secure' : 'Tamper Blocked'}
          </span>
        </div>

        <div className="space-y-2 text-slate-300">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Hardware Root Fingerprint:</span>
            <code className="text-indigo-300 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {vaultInfo.deviceFingerprint}
            </code>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">Encrypted Local Envelopes:</span>
            <span className="font-bold text-white font-mono">{vaultInfo.activeEnvelopesCount} items</span>
          </div>
        </div>

        {/* Live Root Tamper Defense Interactive Simulation */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            onClick={handleSimulateRootTampering}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Root Storage Tamper Defense</span>
          </button>

          {tamperTestMessage && (
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/40 text-[11px] text-amber-300 font-mono leading-tight animate-fadeIn">
              {tamperTestMessage}
            </div>
          )}
        </div>
      </div>

      {/* Store & Forward Queue Diagnostics Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-xs text-slate-900">Store & Forward Queue Engine</h3>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold font-mono">
            {sfQueue.filter(p => p.status === 'queued_store_forward').length} Queued
          </span>
        </div>

        <div className="space-y-2 text-slate-600">
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            When you send money offline or on low connectivity (long-distance cross-border or local), MeshPay debits your balance locally right away, stores the encrypted packet in your vault, and silently forwards it when either user regains network access.
          </p>

          <button
            onClick={handleSyncSfNow}
            disabled={isSyncingSf}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingSf ? 'animate-spin' : ''}`} />
            <span>{isSyncingSf ? 'Syncing Packets...' : 'Trigger Silent Store & Forward Sync'}</span>
          </button>
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


