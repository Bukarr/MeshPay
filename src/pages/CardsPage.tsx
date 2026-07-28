import React, { useState } from 'react';
import { CreditCard, Lock, Eye, EyeOff, Copy, Check, ShieldCheck, Zap, Plus } from 'lucide-react';
import { UserProfile } from '../types';

interface CardsPageProps {
  user: UserProfile;
}

export const CardsPage: React.FC<CardsPageProps> = ({ user }) => {
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [isFrozenUsd, setIsFrozenUsd] = useState(false);
  const [copiedUsd, setCopiedUsd] = useState(false);

  const handleCopyUsd = () => {
    navigator.clipboard.writeText('5399 4012 8920 1928');
    setCopiedUsd(true);
    setTimeout(() => setCopiedUsd(false), 2000);
  };

  return (
    <div className="space-y-4 pb-20 pt-3 px-4 max-w-md mx-auto text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">Virtual Mastercard & Cards</h2>
            <p className="text-[11px] text-slate-500">Multi-currency USD & NGN Instant Virtual Cards</p>
          </div>
        </div>
      </div>

      {/* Primary Virtual USD Card */}
      <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
        isFrozenUsd
          ? 'bg-slate-900 border-slate-800 opacity-60 grayscale text-slate-400'
          : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/40 text-white'
      }`}>
        {/* Hologram sheen */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            <span className="font-black text-sm tracking-wider">FLASHPAY VAULT</span>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">
            USD VIRTUAL
          </span>
        </div>

        {/* Chip & NFC symbol */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 to-amber-500 p-1 flex flex-col justify-between shadow">
            <div className="w-full h-1 bg-amber-700/40 rounded-sm" />
            <div className="w-1/2 h-2 bg-amber-700/40 rounded-sm" />
          </div>
          <span className="text-xs text-slate-400 font-mono">3D Secure • P2P Mesh Enabled</span>
        </div>

        {/* Card Number */}
        <div className="mb-4">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Card Number</div>
          <div className="font-mono text-lg font-bold tracking-widest text-white flex items-center justify-between">
            <span>{showCardNumber ? '5399 4012 8920 1928' : '5399 •••• •••• 1928'}</span>
            <button
              onClick={() => setShowCardNumber(!showCardNumber)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expiry & CVV */}
        <div className="flex justify-between items-end pt-3 border-t border-slate-800">
          <div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Card Holder</div>
            <div className="text-xs font-semibold text-slate-200">{user.name}</div>
          </div>

          <div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Expires</div>
            <div className="text-xs font-mono font-semibold text-slate-200">08/29</div>
          </div>

          <div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">CVV</div>
            <div className="text-xs font-mono font-semibold text-indigo-400">
              {showCardNumber ? '892' : '•••'}
            </div>
          </div>
        </div>
      </div>

      {/* Card Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={handleCopyUsd}
          className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {copiedUsd ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
          <span>{copiedUsd ? 'Copied Number!' : 'Copy Card No.'}</span>
        </button>

        <button
          onClick={() => setIsFrozenUsd(!isFrozenUsd)}
          className={`p-3.5 border rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
            isFrozenUsd
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4 text-amber-600" />
          <span>{isFrozenUsd ? 'Unfreeze Card' : 'Freeze Card'}</span>
        </button>
      </div>

      {/* Security info */}
      <div className="p-4 bg-white border border-slate-200 rounded-3xl text-xs text-slate-600 flex items-center gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
        <span className="font-medium">Cards are issued via PCI-DSS Compliant FlashPay Partner with auto-spend limits.</span>
      </div>
    </div>
  );
};

