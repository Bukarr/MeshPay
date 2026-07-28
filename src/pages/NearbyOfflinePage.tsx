import React, { useState } from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Volume2, 
  Zap, 
  ShieldCheck, 
  UserCheck, 
  Send, 
  RefreshCw, 
  QrCode, 
  Lock, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { UserProfile, NearbyPeer, Transaction } from '../types';
import { useNearbyScan } from '../hooks/useNearbyScan';
import { SecurityModal } from '../components/SecurityModal';
import { getOfflineQueuedTransactions } from '../lib/storage';
import { addNotification } from '../lib/notifications';

interface NearbyOfflinePageProps {
  user: UserProfile;
  isOnline: boolean;
  onTransactionComplete: (tx: Transaction) => void;
  triggerAutoSync: () => void;
  onOpenReceiveQr: () => void;
}

export const NearbyOfflinePage: React.FC<NearbyOfflinePageProps> = ({
  user,
  isOnline,
  onTransactionComplete,
  triggerAutoSync,
  onOpenReceiveQr
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'queue'>('radar');
  const { isScanning, discoveredPeers, startScan, sendOfflineNearbyPayment } = useNearbyScan();

  const [selectedPeer, setSelectedPeer] = useState<NearbyPeer | null>(null);
  const [sendAmount, setSendAmount] = useState<number>(5000);
  const [note, setNote] = useState<string>('Lunch & drinks split');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  const queuedTxs = getOfflineQueuedTransactions();

  const handlePeerSelect = (peer: NearbyPeer) => {
    setSelectedPeer(peer);
  };

  const handleInitiateOfflinePayment = () => {
    if (!selectedPeer) return;
    if (sendAmount <= 0) return alert('Please enter a valid amount');
    if (sendAmount > user.ngnBalance) return alert('Insufficient NGN balance in local vault');

    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (!selectedPeer) return;

    const tx = sendOfflineNearbyPayment(selectedPeer, sendAmount, note, !isOnline);

    addNotification({
      type: isOnline ? 'transaction_success' : 'offline_queue',
      title: 'Offline P2P Transfer Executed',
      message: `Sent ₦${sendAmount.toLocaleString()} NGN to ${selectedPeer.name} via Bluetooth mesh protocol.`,
      txId: tx.id,
      amountDisplay: `₦${sendAmount.toLocaleString()}`
    });

    setSelectedPeer(null);
    onTransactionComplete(tx);
  };

  return (
    <div className="space-y-4 pb-20 pt-3 px-4 max-w-md mx-auto text-slate-800">
      {/* Mesh Radar Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-900">Offline Local Mesh Radar</h2>
              <p className="text-[11px] text-slate-500">Bluetooth LE • Acoustic Tokens • 10m Radius</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {isOnline ? 'Online Mesh' : 'Offline Vault'}
            </span>
          </div>
        </div>

        {/* Tab switcher: Radar Scanner vs Offline Queue */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'radar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Radar Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all relative ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Offline Queue ({queuedTxs.length})</span>
            {queuedTxs.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping absolute top-1.5 right-2" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'radar' ? (
        <>
          {/* Radar Scanner Visual Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center relative overflow-hidden space-y-4 text-white">
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border border-indigo-500/30 ${isScanning ? 'animate-ping' : ''}`} />
              <div className={`absolute inset-4 rounded-full border border-indigo-500/20 ${isScanning ? 'animate-pulse' : ''}`} />
              <div className="absolute inset-10 rounded-full border border-indigo-500/10" />

              <div className="w-14 h-14 rounded-2xl bg-slate-950 border-2 border-indigo-400 p-0.5 z-10 shadow-lg shadow-indigo-500/30">
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              </div>

              {isScanning && (
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin opacity-80" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white">
                {isScanning ? 'Scanning Mesh Frequencies...' : `Discovered ${discoveredPeers.length} Nearby Peers`}
              </h3>
              <p className="text-xs text-slate-400">
                Peer-to-peer acoustic & BLE token exchange within 10 meters
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-1">
              <button
                onClick={startScan}
                disabled={isScanning}
                className="px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isScanning ? 'animate-spin' : ''}`} />
                <span>Rescan</span>
              </button>

              <button
                onClick={onOpenReceiveQr}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan / Upload QR</span>
              </button>

              <button
                onClick={onOpenReceiveQr}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:bg-indigo-700"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Receive Code</span>
              </button>
            </div>
          </div>

          {/* Discovered Peers List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
              Discovered Devices ({discoveredPeers.length})
            </h3>

            <div className="space-y-2">
              {discoveredPeers.map((peer) => (
                <div
                  key={peer.id}
                  onClick={() => handlePeerSelect(peer)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPeer?.id === peer.id
                      ? 'bg-indigo-50 border-indigo-600 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={peer.avatar}
                      alt={peer.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{peer.name}</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded font-bold">
                          {peer.connectionType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {peer.handle} • {peer.distanceMeters}m away • {peer.bankName}
                      </div>
                    </div>
                  </div>

                  <button className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm">
                    Pay
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Peer Offline Send Form Drawer */}
          {selectedPeer && (
            <div className="bg-white border-2 border-indigo-600 rounded-3xl p-5 shadow-lg space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <img src={selectedPeer.avatar} alt={selectedPeer.name} className="w-8 h-8 rounded-2xl object-cover" />
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900">Send Offline Money to {selectedPeer.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedPeer.bankName} • {selectedPeer.accountNumber}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPeer(null)} className="text-xs font-bold text-slate-400 hover:text-slate-700">
                  Cancel
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-bold">
                  <span>Amount (NGN)</span>
                  <span>Local Vault: ₦{user.ngnBalance.toLocaleString()}</span>
                </div>
                <input
                  type="number"
                  value={sendAmount || ''}
                  onChange={(e) => setSendAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-2xl font-black text-indigo-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Offline Memo / Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                onClick={handleInitiateOfflinePayment}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Send ₦{sendAmount.toLocaleString()} Offline Now</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* OFFLINE QUEUE TAB */
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Offline Ledger Queue</h3>
              <p className="text-xs text-slate-500">Transactions stored with local ECDSA nonces</p>
            </div>

            <button
              onClick={triggerAutoSync}
              disabled={!isOnline || queuedTxs.length === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isOnline && queuedTxs.length > 0
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Force Ledger Sync</span>
            </button>
          </div>

          {queuedTxs.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-900">All Offline Queues Synced</h4>
              <p className="text-xs text-slate-500 max-w-[240px] mx-auto">
                No pending offline transactions in your local vault memory.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {queuedTxs.map((tx) => (
                <div key={tx.id} className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{tx.recipientName}</span>
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                          QUEUED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{tx.recipientDetail}</div>
                    </div>
                    <div className="font-extrabold text-xs text-amber-800">
                      ₦{tx.sourceAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl text-[10px] font-mono text-slate-500 break-all border border-amber-100 space-y-0.5">
                    <div>Proof Hash: <span className="text-slate-800 font-bold">{tx.offlineSignature}</span></div>
                    <div>Nonce: <span className="text-slate-800 font-bold">{tx.offlineNonce}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Security Modal */}
      <SecurityModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        title="Authorize Offline P2P Payment"
        amountDisplay={`₦${sendAmount.toLocaleString()} NGN`}
        recipientDisplay={selectedPeer ? `${selectedPeer.name} (${selectedPeer.bankName})` : ''}
      />
    </div>
  );
};

