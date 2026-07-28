import React, { useState } from 'react';
import { Bell, X, Check, Trash2, CheckCheck, Clock, ShieldAlert, CheckCircle2, Sliders, Volume2, VolumeX, Smartphone, Mail } from 'lucide-react';
import { AppNotification, NotificationPreferences, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications, saveNotificationPreferences } from '../lib/notifications';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  onReload: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  preferences,
  onReload
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences>(preferences);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const handleMarkRead = (id: string) => {
    markNotificationAsRead(id);
    onReload();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    onReload();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    onReload();
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = {
      ...localPrefs,
      [key]: typeof localPrefs[key] === 'boolean' ? !localPrefs[key] : localPrefs[key]
    };
    setLocalPrefs(updated);
    saveNotificationPreferences(updated);
    onReload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:justify-end bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[85vh]">
        {/* Panel Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Notifications & Alerts</h3>
              <p className="text-[11px] text-slate-400">{unreadCount} unread account alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-colors ${
                showSettings ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Notification Preferences"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Preferences OR Notification List */}
        {showSettings ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-900">Notification Preferences</h4>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Back to Alerts
              </button>
            </div>

            <div className="space-y-3">
              {/* Push Notifications */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">Push Notifications</span>
                    <span className="text-[11px] text-slate-500">Real-time device alerts for transfers</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.pushNotifications}
                  onChange={() => handleTogglePref('pushNotifications')}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Email Alerts */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">Email Transaction Receipts</span>
                    <span className="text-[11px] text-slate-500">Send PDF receipts to {`user email`}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.emailAlerts}
                  onChange={() => handleTogglePref('emailAlerts')}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* High Value Transfers Approval */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">High-Value Biometric Prompt</span>
                    <span className="text-[11px] text-slate-500">Require Face ID / Touch ID above ${localPrefs.highValueThresholdUsd}</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.highValueApproval}
                  onChange={() => handleTogglePref('highValueApproval')}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* FX Rate Volatility Alerts */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="font-bold text-xs block text-slate-800">FX Rate Volatility Updates</span>
                    <span className="text-[11px] text-slate-500">Notify when USD/NGN rate moves by &gt; 1%</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localPrefs.rateChangeAlerts}
                  onChange={() => handleTogglePref('rateChangeAlerts')}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Pills & Actions */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filter === 'unread'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
                    title="Clear all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Notification List Items */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {filteredNotifs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 mx-auto text-slate-300 opacity-60" />
                  <p className="text-xs font-semibold">No notifications found</p>
                </div>
              ) : (
                filteredNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      !n.read
                        ? 'bg-indigo-50/80 border-indigo-200 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'transaction_success'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : n.type === 'offline_queue'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}>
                        {n.type === 'transaction_success' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : n.type === 'offline_queue' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{n.title}</span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-400 font-mono block pt-1">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
