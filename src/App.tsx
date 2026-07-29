import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { TransactionReceiptModal } from './components/TransactionReceiptModal';
import { OfflineReceiveQrModal } from './components/OfflineReceiveQrModal';
import { OfflineSendQrModal } from './components/OfflineSendQrModal';

import { DashboardPage } from './pages/DashboardPage';
import { RemittancePage } from './pages/RemittancePage';
import { NearbyOfflinePage } from './pages/NearbyOfflinePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

import { useNetworkStatus } from './hooks/useNetworkStatus';
import { 
  getStoredUserProfile, 
  getStoredTransactions, 
  getStoredExchangeRate,
  getActiveUserId,
  isUserLoggedIn,
  setUserLoggedIn
} from './lib/storage';
import { Transaction, Currency } from './types';
import { Radio, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  const {
    isOnline,
    isWeakSignal,
    tamperAlert,
    syncState,
    triggerAutoSync,
    pendingOfflineCount
  } = useNetworkStatus();

  // Auth & Storage State
  const [isLoggedIn, setIsLoggedIn] = useState(() => isUserLoggedIn());
  const [user, setUser] = useState(() => getStoredUserProfile());
  const [transactions, setTransactions] = useState(() => getStoredTransactions());
  const [exchangeRate, setExchangeRate] = useState(() => getStoredExchangeRate());

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiveQr, setShowReceiveQr] = useState<boolean>(false);
  const [showSendQr, setShowSendQr] = useState<boolean>(false);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');

  // Reload local state on custom window storage events
  const reloadData = useCallback(() => {
    setIsLoggedIn(isUserLoggedIn());
    setUser(getStoredUserProfile());
    setTransactions(getStoredTransactions());
    setExchangeRate(getStoredExchangeRate());
  }, []);

  useEffect(() => {
    window.addEventListener('meshpay_auth_updated', reloadData);
    window.addEventListener('meshpay_profile_updated', reloadData);
    window.addEventListener('meshpay_transactions_updated', reloadData);
    window.addEventListener('meshpay_rate_updated', reloadData);
    window.addEventListener('meshpay_reset', reloadData);

    return () => {
      window.removeEventListener('meshpay_auth_updated', reloadData);
      window.removeEventListener('meshpay_profile_updated', reloadData);
      window.removeEventListener('meshpay_transactions_updated', reloadData);
      window.removeEventListener('meshpay_rate_updated', reloadData);
      window.removeEventListener('meshpay_reset', reloadData);
    };
  }, [reloadData]);

  const handleTransactionComplete = (tx: Transaction) => {
    setSelectedTransaction(tx);
    reloadData();
  };

  const handleLogout = () => {
    setUserLoggedIn(false);
  };

  const toggleCurrency = () => {
    setDisplayCurrency(prev => (prev === 'USD' ? 'NGN' : 'USD'));
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={reloadData} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-600 selection:text-white pb-16">
      {/* Main Header Navbar */}
      <Navbar
        user={user}
        isOnline={isOnline}
        isWeakSignal={isWeakSignal}
        tamperAlert={tamperAlert}
        pendingOfflineCount={pendingOfflineCount}
        onOpenSync={triggerAutoSync}
        onOpenSettings={() => setActiveTab('profile')}
        onToggleCurrency={toggleCurrency}
        displayCurrency={displayCurrency}
        onLogout={handleLogout}
      />

      {/* Rooted Device Anti-Tamper Security Banner */}
      {tamperAlert && (
        <div className="bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs max-w-md mx-auto font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span>Root Anti-Tamper Violation Neutralized! Local Storage HMAC seal verified & restored.</span>
          </div>
        </div>
      )}

      {/* Automatic Network / Weak Signal Detection & Suggestion Banner */}
      {(!isOnline || isWeakSignal) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 shadow-md flex items-center justify-between text-xs max-w-md mx-auto font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 shrink-0 text-slate-950 animate-bounce" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            )}
            <span>
              {!isOnline ? 'You are offline.' : 'Weak internet signal.'} Switch to Offline Pay?
            </span>
          </div>
          <button
            onClick={() => {
              setActiveTab('nearby');
            }}
            className="bg-slate-950 text-white font-extrabold px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-all shrink-0 text-[11px] flex items-center gap-1 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Pay Offline</span>
          </button>
        </div>
      )}

      {/* Sync Status Banner */}
      {syncState.stepMessage && (
        <div className="bg-indigo-900 text-white font-medium px-4 py-2 text-xs flex items-center justify-between max-w-md mx-auto shadow-sm">
          <span className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-indigo-300' : 'text-emerald-400'}`} />
            {syncState.stepMessage}
          </span>
          {syncState.isSyncing && (
            <span className="font-mono text-indigo-300 font-bold">{syncState.progressPercent}%</span>
          )}
        </div>
      )}

      {/* Main App Content Container */}
      <main className="min-h-[calc(100vh-120px)]">
        {activeTab === 'dashboard' && (
          <DashboardPage
            user={user}
            transactions={transactions}
            exchangeRate={exchangeRate}
            isOnline={isOnline}
            onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onOpenReceiveQr={() => setShowReceiveQr(true)}
            onOpenSendQr={() => setShowSendQr(true)}
            pendingOfflineCount={pendingOfflineCount}
            triggerAutoSync={triggerAutoSync}
            onTransactionComplete={handleTransactionComplete}
          />
        )}

        {activeTab === 'remit' && (
          <RemittancePage
            user={user}
            exchangeRate={exchangeRate}
            isOnline={isOnline}
            onTransactionComplete={handleTransactionComplete}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyOfflinePage
            user={user}
            isOnline={isOnline}
            onTransactionComplete={handleTransactionComplete}
            triggerAutoSync={triggerAutoSync}
            onOpenReceiveQr={() => setShowReceiveQr(true)}
            onOpenSendQr={() => setShowSendQr(true)}
          />
        )}

        {activeTab === 'activity' && (
          <TransactionsPage
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            triggerAutoSync={triggerAutoSync}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'profile' && (
          <SettingsPage
            user={user}
            isOnline={isOnline}
            onClose={() => setActiveTab('dashboard')}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        pendingOfflineCount={pendingOfflineCount}
      />

      {/* Modals */}
      <TransactionReceiptModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onSyncNow={triggerAutoSync}
      />

      <OfflineReceiveQrModal
        isOpen={showReceiveQr}
        onClose={() => setShowReceiveQr(false)}
        user={user}
        amountNgn={5000}
      />

      <OfflineSendQrModal
        isOpen={showSendQr}
        onClose={() => setShowSendQr(false)}
        user={user}
        onTransactionComplete={handleTransactionComplete}
      />
    </div>
  );
}

