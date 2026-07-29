import React, { useState } from 'react';
import { 
  Send, 
  Radio, 
  ArrowDownLeft, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Copy,
  Check,
  Building2,
  Clock,
  Sparkles,
  History,
  TrendingUp,
  ShieldCheck,
  Zap,
  UserCheck,
  ShieldAlert,
  Search,
  QrCode,
  Camera
} from 'lucide-react';
import { UserProfile, Transaction, ExchangeRate } from '../types';
import { FxRateChart } from '../components/FxRateChart';
import { QuickSendModal } from '../components/QuickSendModal';
import { TrustScoreBoardModal } from '../components/TrustScoreBoardModal';
import { getTrustProfile } from '../lib/trustScore';

interface DashboardPageProps {
  user: UserProfile;
  transactions: Transaction[];
  exchangeRate: ExchangeRate;
  isOnline: boolean;
  onNavigate: (tab: 'remit' | 'nearby' | 'activity') => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenReceiveQr: () => void;
  onOpenSendQr?: () => void;
  pendingOfflineCount: number;
  triggerAutoSync: () => void;
  onTransactionComplete?: (tx: Transaction) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  transactions,
  exchangeRate,
  isOnline,
  onNavigate,
  onSelectTransaction,
  onOpenReceiveQr,
  onOpenSendQr,
  pendingOfflineCount,
  triggerAutoSync,
  onTransactionComplete
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Total Valuation Calculations
  const totalValuationNgn = Math.round(user.ngnBalance + (user.usdBalance * exchangeRate.usdToNgn));
  const totalValuationUsd = parseFloat(((user.ngnBalance / exchangeRate.usdToNgn) + user.usdBalance).toFixed(2));

  // Quick Send & Trust Board Modal states
  const [showQuickSend, setShowQuickSend] = useState(false);
  const [quickSendTag, setQuickSendTag] = useState('$fatima_b');
  const [showTrustBoard, setShowTrustBoard] = useState(false);
  const [trustBoardTarget, setTrustBoardTarget] = useState('$fatima_b');

  const recentTxs = transactions.slice(0, 4);

  const frequentContacts = [
    {
      name: 'Fatima Bello',
      tag: '$fatima_b',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Chinedu Okeke',
      tag: '$chinedu_tech',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Adewale Lawson',
      tag: '$adewale_l',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'David Kalu',
      tag: '$kalu_groceries',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    }
  ].filter(c => c.tag.toLowerCase() !== user.tag.toLowerCase());

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(user.virtualAccountNgn);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleOpenQuickSendContact = (tag: string) => {
    setQuickSendTag(tag);
    setShowQuickSend(true);
  };

  const handleOpenTrustBoardForTarget = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTrustBoardTarget(tag);
    setShowTrustBoard(true);
  };

  return (
    <div className="space-y-4 pb-20 pt-3 px-4 max-w-md mx-auto text-slate-800">
      {/* Vault Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Vault Balances</h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isOnline ? 'Online Sync' : 'Offline Vault'}
            </span>
          </div>

          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-500 hover:text-indigo-600 p-1 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showBalance ? 'Hide' : 'Show'}</span>
          </button>
        </div>

        {/* Unified Single Currency Naira Vault Account Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-2xl bg-emerald-600 text-slate-950 font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                ₦
              </span>
              <div>
                <span className="text-xs font-black text-white block">MeshPay Single-Currency Vault</span>
                <span className="text-[10px] text-emerald-400 font-bold">Nigerian Naira (NGN)</span>
              </div>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5 text-indigo-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{showBalance ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          {/* Primary NGN Balance Display & USD Equivalent Below */}
          <div className="space-y-1.5 mt-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Account Vault Balance</span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{showBalance ? `₦${user.ngnBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` : '••••••••'}</span>
            </div>
            {/* USD Equivalent Value below balance */}
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wide">USD Equivalent:</span>
              <span>{showBalance ? `≈ $${(user.ngnBalance / exchangeRate.usdToNgn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '••••••••'}</span>
            </div>
          </div>

          {/* Bank Account Info & Interbank Details */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Virtual Bank Account</span>
              <div className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{user.bankName}</span>
              </div>
            </div>

            <button
              onClick={handleCopyAccount}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="w-3 h-3 text-emerald-400" />
              <span>{copiedAccount ? 'Copied' : user.virtualAccountNgn}</span>
            </button>
          </div>

          {/* Footer of Card with Live Rate */}
          <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-[10px]">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Live Rate: $1 USD = ₦{exchangeRate.usdToNgn.toLocaleString()} NGN
            </span>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              Single-Currency Vault
            </span>
          </div>
        </div>
      </div>

      {/* QUICK SEND ACTION BAR & FREQUENT CONTACTS */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-800/80 rounded-3xl p-4 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Zap className="w-4 h-4 text-indigo-300 fill-indigo-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white">Quick Send</h3>
              <p className="text-[10px] text-indigo-200">1-tap instant transfer to frequent contacts</p>
            </div>
          </div>

          <button
            onClick={() => {
              setQuickSendTag('$fatima_b');
              setShowQuickSend(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
          >
            <span>Quick Send ⚡</span>
          </button>
        </div>

        {/* Frequent Contacts Scroll Pill Row with Trust Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {frequentContacts.map((contact) => {
            const trust = getTrustProfile(contact.tag);
            return (
              <div
                key={contact.tag}
                onClick={() => handleOpenQuickSendContact(contact.tag)}
                className="flex items-center gap-2 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shrink-0 group"
              >
                <div className="relative shrink-0">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-600"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-slate-900 flex items-center justify-center text-[7px] text-white font-black">
                    ✓
                  </span>
                </div>

                <div className="text-left pr-1">
                  <div className="font-bold text-[11px] text-white leading-tight group-hover:text-indigo-300">
                    {contact.name.split(' ')[0]}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono font-semibold">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{trust.trustScore}/100</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleOpenTrustBoardForTarget(contact.tag, e)}
                  title="Inspect Trust Score Board"
                  className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* TRUST SCORE BOARD BANNER LAUNCHER */}
      <div 
        onClick={() => {
          setTrustBoardTarget('$fatima_b');
          setShowTrustBoard(true);
        }}
        className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs text-slate-900">MeshPay Trust & Anti-Fraud Board</h4>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded font-mono">
                Active Sentinel
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Verify recipient trust rating, report scam handles & check dispute history.
            </p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* Quick Action Bar */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onNavigate('remit')}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="text-xs">Send Money</span>
          </button>

          <button
            onClick={onOpenSendQr}
            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-bold border border-emerald-500/30 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">Scan & Pay</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={onOpenReceiveQr}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <QrCode className="w-4.5 h-4.5 mb-1 text-emerald-600" />
            <span className="text-[10px] leading-tight font-extrabold">Receive QR</span>
          </button>

          <button
            onClick={() => onNavigate('nearby')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all relative"
          >
            {pendingOfflineCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            )}
            <Radio className="w-4.5 h-4.5 mb-1 text-indigo-600" />
            <span className="text-[10px] leading-tight font-extrabold">Offline Radar</span>
          </button>

          <button
            onClick={() => onNavigate('activity')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <History className="w-4.5 h-4.5 mb-1 text-slate-700" />
            <span className="text-[10px] leading-tight font-extrabold">History</span>
          </button>
        </div>
      </div>

      {/* Live FX Rate Sparkline Chart Component */}
      <FxRateChart rate={exchangeRate} />

      {/* Pending Sync Alert Banner if offline queue exists */}
      {pendingOfflineCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900">
                {pendingOfflineCount} Offline Transaction(s) Queued
              </h4>
              <p className="text-[11px] text-amber-700">
                {isOnline ? 'Online connection restored! Tap to reconcile.' : 'Stored securely with P2P cryptographic nonce.'}
              </p>
            </div>
          </div>

          <button
            onClick={triggerAutoSync}
            disabled={!isOnline}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
              isOnline
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Sync Now
          </button>
        </div>
      )}

      {/* Recent Activity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Recent Activity</h3>
          <button
            onClick={() => onNavigate('activity')}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Send className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">No transactions recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto">
              Your real transactions will appear here. Tap Quick Send or Send Money to test instant transfer!
            </p>
            <button
              onClick={() => {
                setQuickSendTag('$fatima_b');
                setShowQuickSend(true);
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-sm hover:bg-indigo-700"
            >
              Make First Quick Send
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold ${
                    tx.type === 'usd_to_ngn'
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : tx.type === 'nearby_send'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {tx.type === 'usd_to_ngn' ? '$→₦' : tx.type === 'nearby_send' ? 'P2P' : 'IN'}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{tx.recipientName}</span>
                      {tx.status === 'queued_offline' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          OFFLINE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {tx.recipientDetail}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-extrabold text-xs ${
                    tx.type === 'nearby_receive' || tx.type === 'top_up' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {tx.type === 'usd_to_ngn' ? `$${tx.sourceAmount}` : `₦${tx.sourceAmount.toLocaleString()}`}
                  </div>
                  {tx.type === 'usd_to_ngn' && (
                    <div className="text-[10px] text-emerald-600 font-mono font-bold">
                      → ₦{tx.targetAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK SEND MODAL */}
      <QuickSendModal
        isOpen={showQuickSend}
        onClose={() => setShowQuickSend(false)}
        currentUser={user}
        initialRecipientTag={quickSendTag}
        onTransactionComplete={(tx) => {
          if (onTransactionComplete) onTransactionComplete(tx);
        }}
      />

      {/* TRUST SCORE BOARD MODAL */}
      <TrustScoreBoardModal
        isOpen={showTrustBoard}
        onClose={() => setShowTrustBoard(false)}
        currentUser={user}
        initialSearchTarget={trustBoardTarget}
      />
    </div>
  );
};


