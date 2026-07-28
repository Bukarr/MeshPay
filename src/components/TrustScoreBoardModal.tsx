import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  X, 
  CheckCircle2, 
  Flag, 
  UserCheck, 
  Lock, 
  Activity, 
  Info, 
  Sparkles,
  ShieldAlert,
  ThumbsUp
} from 'lucide-react';
import { getTrustProfile, reportAccountFraud, UserTrustProfile, TrustReport } from '../lib/trustScore';
import { UserProfile } from '../types';

interface TrustScoreBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialSearchTarget?: string;
}

export const TrustScoreBoardModal: React.FC<TrustScoreBoardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSearchTarget = '$fatima_b'
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchTarget);
  const [profile, setProfile] = useState<UserTrustProfile>(() => getTrustProfile(initialSearchTarget));
  const [showReportForm, setShowReportForm] = useState(false);

  // Fraud Report Form fields
  const [reportCategory, setReportCategory] = useState<TrustReport['category']>('phishing');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setReportSubmitted(false);
    setShowReportForm(false);
    setProfile(getTrustProfile(query));
  };

  const handleQuickSelect = (tag: string) => {
    handleSearch(tag);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return alert('Please describe the suspicious activity');

    const updated = reportAccountFraud(
      profile.identifier,
      currentUser.name,
      reportReason,
      reportCategory
    );

    setProfile(updated);
    setReportSubmitted(true);
    setShowReportForm(false);
    setReportReason('');
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500 text-white border-emerald-400';
    if (score >= 75) return 'bg-emerald-600 text-white border-emerald-500';
    if (score >= 60) return 'bg-amber-500 text-slate-950 border-amber-400';
    return 'bg-rose-600 text-white border-rose-500';
  };

  const getRiskLabelColor = (level: UserTrustProfile['riskLevel']) => {
    switch (level) {
      case 'VERY_SAFE':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'SAFE':
        return 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30';
      case 'MODERATE':
        return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
      case 'HIGH_RISK':
      case 'FRAUD_FLAGGED':
        return 'text-rose-300 bg-rose-500/20 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Trust Score Board</h3>
              <p className="text-[11px] text-slate-400">Anti-Fraud & Peer Reputation Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Tag ($handle), Bank Account or Name..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
            <span className="text-slate-500 font-bold shrink-0">Quick Lookup:</span>
            {['$fatima_b', '$adewale_l', '$chinedu_tech', '$kalu_groceries', '$suspicious_bot'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleQuickSelect(tag)}
                className={`px-2 py-0.5 rounded-lg border font-mono transition-all shrink-0 ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Main Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Report Alert Notification if newly submitted */}
          {reportSubmitted && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Fraud Report Submitted & Logged!</strong>
                <p className="text-[11px] text-emerald-300">
                  Trust score updated. Future senders will be notified of safety flags before processing transfers to this account.
                </p>
              </div>
            </div>
          )}

          {/* User Score Header Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Target Account
                </span>
                <h2 className="text-base font-black text-white">{profile.name}</h2>
                <div className="text-xs text-indigo-400 font-mono font-bold">
                  {profile.identifier}
                </div>
              </div>

              {/* Big Score Gauge Badge */}
              <div className="text-center">
                <div className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-black shadow-lg ${getScoreBadgeColor(profile.trustScore)}`}>
                  <span className="text-lg leading-none">{profile.trustScore}</span>
                  <span className="text-[8px] opacity-80 uppercase tracking-tighter">/ 100</span>
                </div>
                <span className="text-[9px] text-slate-400 font-extrabold block mt-1">Trust Rating</span>
              </div>
            </div>

            {/* Risk Badge Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getRiskLabelColor(profile.riskLevel)}`}>
                Risk Level: {profile.riskLevel.replace('_', ' ')}
              </span>

              <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                {profile.kycTier}
              </span>
            </div>

            {/* Warning Note if low score */}
            {profile.warningNote && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-semibold">
                  {profile.warningNote}
                </p>
              </div>
            )}
          </div>

          {/* Breakdown Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Account Longevity</span>
              <div className="font-extrabold text-sm text-white">{profile.accountAgeMonths} Months</div>
              <span className="text-[10px] text-slate-500 font-mono">Mesh P2P Member</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Successful Transfers</span>
              <div className="font-extrabold text-sm text-emerald-400">{profile.completedTxCount} Txns</div>
              <span className="text-[10px] text-slate-500 font-mono">Clean settlement</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Community Fraud Reports</span>
              <div className={`font-extrabold text-sm ${profile.fraudReportsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {profile.fraudReportsCount} Reported
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Community flags</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">Hardware Security</span>
              <div className="font-extrabold text-xs text-indigo-300 truncate">
                {profile.ecdsaHardwareVerified ? 'ECDSA Vault' : 'Standard Key'}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Hardware Enclave</span>
            </div>
          </div>

          {/* Safety & Verification Checklist */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Security & Identity Verification Flags
            </h4>
            <div className="space-y-1.5">
              {profile.safetyFlags.map((flag, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  {flag.includes('⚠️') ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-medium text-[11px]">{flag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Reporting Action Section */}
          {!showReportForm ? (
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowReportForm(true)}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Flag className="w-3.5 h-3.5 text-rose-400" />
                <span>Report Suspicious / Fraud Activity</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="p-4 bg-slate-950 rounded-2xl border border-rose-900/60 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4" />
                  File Fraud / Suspicious Activity Report
                </span>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Report Category</label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value as TrustReport['category'])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-medium text-white focus:outline-none"
                >
                  <option value="impersonation">Identity Impersonation / Fake Profile</option>
                  <option value="phishing">Phishing / Scam Payment Request</option>
                  <option value="non_payment">Unfulfilled P2P Service / Non-Payment</option>
                  <option value="fake_proof">Fake Payment Proof / Altered Receipt</option>
                  <option value="suspicious_activity">General Suspicious Activity</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Details & Evidence</label>
                <textarea
                  rows={2}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the suspicious or fraudulent behavior..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-medium text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all"
              >
                Submit Fraud Report to Mesh Network
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" />
            256-bit Cryptographic Anti-Fraud Sentinel
          </span>
          <button onClick={onClose} className="text-slate-300 hover:text-white font-bold">
            Close Board
          </button>
        </div>

      </div>
    </div>
  );
};
