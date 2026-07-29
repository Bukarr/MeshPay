import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCheck, 
  RefreshCw, 
  Zap, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead
}) => {
  const [filter, setFilter] = useState<'all' | 'transaction' | 'security' | 'system'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (filter === 'transaction') return n.type === 'transaction';
    if (filter === 'security') return n.type === 'security';
    if (filter === 'system') return n.type === 'system' || n.type === 'offline_sync';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case 'transaction':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
      case 'offline_sync':
        return <RefreshCw className="w-4 h-4 text-indigo-500" />;
      case 'system':
      default:
        return <Zap className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm">Notifications & Alerts</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Security warnings, transfers, & system events</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills & Mark All Read */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex gap-1 shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'transaction', label: 'Transfers' },
              { id: 'security', label: 'Security' },
              { id: 'system', label: 'System' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notification Items List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium space-y-1">
              <Bell className="w-8 h-8 text-slate-300 mx-auto opacity-50" />
              <p className="font-bold text-slate-600">No notifications found.</p>
              <p className="text-[11px] text-slate-400">You are all caught up!</p>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition-all cursor-pointer ${
                  !n.read ? 'bg-indigo-50/60 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.type === 'security'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : n.type === 'transaction'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}>
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs text-slate-900">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                  </div>

                  <span className="text-[9px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTime(n.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
