import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Send, 
  Radio, 
  Download,
  Building2,
  Calendar,
  Hash
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsPageProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  triggerAutoSync: () => void;
  isOnline: boolean;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onSelectTransaction,
  triggerAutoSync,
  isOnline
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'usd_to_ngn' | 'nearby' | 'top_up' | 'queued'>('all');

  const filtered = transactions.filter(t => {
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || 
      t.id.toLowerCase().includes(query) ||
      t.recipientName.toLowerCase().includes(query) ||
      t.recipientDetail.toLowerCase().includes(query) ||
      (t.notes && t.notes.toLowerCase().includes(query)) ||
      t.sourceAmount.toString().includes(query) ||
      (t.targetAmount && t.targetAmount.toString().includes(query)) ||
      t.timestamp.toLowerCase().includes(query) ||
      t.type.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterType === 'usd_to_ngn') return t.type === 'usd_to_ngn';
    if (filterType === 'nearby') return t.type === 'nearby_send' || t.type === 'nearby_receive';
    if (filterType === 'top_up') return t.type === 'top_up';
    if (filterType === 'queued') return t.status === 'queued_offline';

    return true;
  });

  return (
    <div className="space-y-4 pb-20 pt-3 px-4 max-w-md mx-auto text-slate-800">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Transaction History</h2>
              <p className="text-[11px] text-slate-500">{transactions.length} total recorded ledger entries</p>
            </div>
          </div>

          <button
            onClick={() => alert('Full transaction ledger statement CSV downloaded!')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Download CSV Statement"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, amount, recipient, date, or type..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'usd_to_ngn', label: 'Remittances ($→₦)' },
            { id: 'nearby', label: 'Offline P2P Mesh' },
            { id: 'top_up', label: 'Deposits / Top-ups' },
            { id: 'queued', label: 'Queued Offline' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium space-y-1">
            <Search className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold">No matching transactions found.</p>
            <p className="text-[11px] text-slate-400">Try searching by ID, amount (e.g. 100), recipient or type.</p>
          </div>
        ) : (
          filtered.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  tx.status === 'queued_offline'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : tx.type === 'usd_to_ngn'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {tx.status === 'queued_offline' ? (
                    <Clock className="w-5 h-5 animate-pulse text-amber-600" />
                  ) : tx.type === 'usd_to_ngn' ? (
                    <Send className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Radio className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span>{tx.recipientName}</span>
                    {tx.status === 'queued_offline' && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                        QUEUED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {new Date(tx.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • {tx.recipientDetail}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ID: {tx.id.slice(0, 16)}...
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

                <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide font-bold">
                  {tx.status === 'queued_offline' ? 'Offline Queued' : 'Settled'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

