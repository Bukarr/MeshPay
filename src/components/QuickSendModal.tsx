import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  Lock, 
  ArrowRight,
  UserCheck,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { UserProfile, Transaction, Currency } from '../types';
import { PRESET_ACCOUNTS, INITIAL_NEARBY_PEERS } from '../data/mockData';
import { getTrustProfile, UserTrustProfile } from '../lib/trustScore';
import { addTransaction, getStoredUserProfile } from '../lib/storage';
import { addNotification } from '../lib/notifications';

interface QuickSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onTransactionComplete: (tx: Transaction) => void;
  initialRecipientTag?: string;
}

export const QuickSendModal: React.FC<QuickSendModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTransactionComplete,
  initialRecipientTag = '$fatima_b'
}) => {
  // Frequent contacts derived from system peers
  const frequentContacts = [
    {
      name: 'Fatima Bello',
      tag: '$fatima_b',
      bank: 'GTBank Vault',
      account: '8092318492',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      userIdMatch: 'user_2'
    },
    {
      name: 'Chinedu Okeke',
      tag: '$chinedu_tech',
      bank: 'Moniepoint MFB',
      account: '7039102938',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      userIdMatch: 'user_3'
    },
    {
      name: 'Adewale Lawson',
      tag: '$adewale_l',
      bank: 'MeshPay Account',
      account: '9021849201',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      userIdMatch: 'user_1'
    },
    {
      name: 'David Kalu (Vendor)',
      tag: '$kalu_groceries',
      bank: 'OPay',
      account: '9012948102',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      userIdMatch: null
    }
  ].filter(c => c.tag.toLowerCase() !== currentUser.tag.toLowerCase());

  const [selectedContact, setSelectedContact] = useState(frequentContacts[0] || {
    name: 'Fatima Bello',
    tag: '$fatima_b',
    bank: 'GTBank Vault',
    account: '8092318492',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    userIdMatch: 'user_2'
  });

  const [currency, setCurrency] = useState<Currency>('NGN');
  const [amount, setAmount] = useState<number>(5000);
  const [note, setNote] = useState<string>('Quick Send');
  const [trustProfile, setTrustProfile] = useState<UserTrustProfile>(() => getTrustProfile(selectedContact.tag));
  const [isProcessing, setIsProcessing] = useState(false);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (initialRecipientTag) {
      const match = frequentContacts.find(c => c.tag.toLowerCase() === initialRecipientTag.toLowerCase());
      if (match) {
        setSelectedContact(match);
        setTrustProfile(getTrustProfile(match.tag));
      }
    }
  }, [initialRecipientTag]);

  if (!isOpen) return null;

  const handleSelectContact = (contact: typeof frequentContacts[0]) => {
    setSelectedContact(contact);
    setTrustProfile(getTrustProfile(contact.tag));
  };

  const handleExecuteQuickSend = () => {
    if (amount <= 0) return alert('Please select or enter a valid amount');

    // Check balance
    if (currency === 'NGN' && amount > currentUser.ngnBalance) {
      return alert(`Insufficient NGN balance. You have ₦${currentUser.ngnBalance.toLocaleString()} NGN.`);
    }
    if (currency === 'USD' && amount > currentUser.usdBalance) {
      return alert(`Insufficient USD balance. You have $${currentUser.usdBalance.toLocaleString()} USD.`);
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Create outgoing transaction for sender
      const tx: Transaction = {
        id: 'tx_qs_' + Date.now(),
        type: currency === 'USD' ? 'usd_to_ngn' : 'nearby_send',
        sourceAmount: amount,
        sourceCurrency: currency,
        targetAmount: amount,
        targetCurrency: currency,
        exchangeRate: 1.0,
        fee: 0,
        recipientName: selectedContact.name,
        recipientDetail: `${selectedContact.tag} (${selectedContact.bank})`,
        timestamp: new Date().toISOString(),
        status: 'completed',
        isOffline: false,
        bankName: selectedContact.bank,
        accountNumber: selectedContact.account,
        notes: `${note} • Quick Send (Trust Score: ${trustProfile.trustScore}/100)`
      };

      addTransaction(tx);

      // Add Notification
      addNotification({
        type: 'transaction_success',
        title: 'Quick Send Successful',
        message: `Sent ${currency === 'USD' ? '$' : '₦'}${amount.toLocaleString()} to ${selectedContact.name} (${selectedContact.tag}).`,
        txId: tx.id,
        amountDisplay: `${currency === 'USD' ? '$' : '₦'}${amount.toLocaleString()}`
      });

      setIsProcessing(false);
      setSuccessTx(tx);
      onTransactionComplete(tx);
    }, 800);
  };

  const presetNgnAmounts = [1000, 2000, 5000, 10000, 20000];
  const presetUsdAmounts = [5, 10, 20, 50, 100];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">One-Tap Quick Send</h3>
              <p className="text-[11px] text-slate-400">Instant transfer with Trust Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {successTx ? (
            <div className="py-6 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg text-white">Transfer Completed!</h4>
                <p className="text-xs text-slate-300">
                  Sent <strong className="text-emerald-400">{currency === 'USD' ? '$' : '₦'}{amount.toLocaleString()}</strong> to <strong className="text-white">{selectedContact.name}</strong>
                </p>
                <div className="text-[11px] text-slate-400 font-mono pt-1">
                  Recipient Trust Score verified ({trustProfile.trustScore}/100)
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Select Frequent Contact Row */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  Select Frequent Contact
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {frequentContacts.map((contact) => {
                    const isSelected = selectedContact.tag === contact.tag;
                    const contactTrust = getTrustProfile(contact.tag);
                    return (
                      <div
                        key={contact.tag}
                        onClick={() => handleSelectContact(contact)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                        <div className="truncate flex-1">
                          <div className="font-bold text-xs text-white truncate">{contact.name}</div>
                          <div className="text-[10px] text-indigo-400 font-mono truncate">{contact.tag}</div>
                          <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Trust: {contactTrust.trustScore}/100</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Contact Trust Badge Inspector Card */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Anti-Fraud Security Check</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    trustProfile.trustScore >= 90
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {trustProfile.trustScore >= 90 ? 'Very Safe Recipient' : 'Moderate Caution'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] block">Verified Name & Bank</span>
                    <span className="text-white font-bold">{selectedContact.name} ({selectedContact.bank})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Trust Score</span>
                    <span className="text-emerald-400 font-black text-sm">{trustProfile.trustScore} / 100</span>
                  </div>
                </div>

                {trustProfile.warningNote && (
                  <div className="p-2 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-200 text-[11px] flex items-center gap-1.5 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{trustProfile.warningNote}</span>
                  </div>
                )}
              </div>

              {/* Currency & Amount Selection */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    Select Quick Amount
                  </label>

                  <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('NGN');
                        setAmount(5000);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        currency === 'NGN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      NGN (₦)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrency('USD');
                        setAmount(10);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        currency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(currency === 'NGN' ? presetNgnAmounts : presetUsdAmounts).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`px-3 py-2 rounded-xl text-xs font-black font-mono transition-all shrink-0 ${
                        amount === preset
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                          : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {currency === 'USD' ? `$${preset}` : `₦${preset.toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Field */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-slate-400 font-bold">
                    <span>Enter Custom Amount</span>
                    <span>Available: {currency === 'USD' ? `$${currentUser.usdBalance.toLocaleString()}` : `₦${currentUser.ngnBalance.toLocaleString()}`}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-black text-slate-400 text-base">
                      {currency === 'USD' ? '$' : '₦'}
                    </span>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-black text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Optional Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Payment Note</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Lunch & drinks / Quick transfer"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              {isProcessing ? (
                <div className="p-3.5 bg-indigo-950 border border-indigo-700 rounded-2xl text-indigo-200 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <Zap className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>Verifying ECDSA Key & Executing Transfer...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteQuickSend}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    One-Tap Send {currency === 'USD' ? `$${amount.toLocaleString()}` : `₦${amount.toLocaleString()}`} to {selectedContact.name.split(' ')[0]}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center shrink-0">
          Instant settlement with 256-bit ECDSA cryptographic proof
        </div>

      </div>
    </div>
  );
};
