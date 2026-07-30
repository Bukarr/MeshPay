import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, 
  QrCode, 
  Download,
  ShieldCheck,
  HelpCircle,
  RefreshCw,
  Clock,
  Zap,
  Users,
  AlertTriangle,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, Transaction, RecentReceiver } from '../types';
import { generateDynamicCryptoCode, encryptTransactionPayload } from '../lib/qrCrypto';
import { addTransaction, getRecentOfflineReceivers } from '../lib/storage';
import { addNotification } from '../lib/notifications';
import { SuccessCelebration } from './SuccessCelebration';
import { BiometricModal } from './BiometricModal';

interface OfflineReceiveQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  amountNgn?: number;
  onSelectRecentRecipient?: (recipient: RecentReceiver) => void;
}

export const OfflineReceiveQrModal: React.FC<OfflineReceiveQrModalProps> = ({
  isOpen,
  onClose,
  user,
  amountNgn = 5000,
  onSelectRecentRecipient
}) => {
  const [amount, setAmount] = useState<number>(amountNgn || 5000);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [authorizedTx, setAuthorizedTx] = useState<Transaction | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState<boolean>(false);

  const recentRecipients = useMemo(() => {
    return getRecentOfflineReceivers(user.phone);
  }, [isOpen, user.phone]);

  // Dynamic 5-minute cryptographic code state
  const [cryptoCodeObj, setCryptoCodeObj] = useState(() => generateDynamicCryptoCode());
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isExpired, setIsExpired] = useState(false);
  const [showCryptoExplainer, setShowCryptoExplainer] = useState(false);

  // Reset dynamic code & states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCryptoCodeObj(generateDynamicCryptoCode());
      setSecondsRemaining(300);
      setIsExpired(false);
      setIsAuthorized(false);
      setAuthorizedTx(null);
      if (amountNgn) {
        setAmount(amountNgn);
      }
    }
  }, [isOpen, amountNgn]);

  // Countdown timer for 5-minute (300 seconds) code expiry
  useEffect(() => {
    if (!isOpen) return;
    setIsExpired(false);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleRenewCode = () => {
    setCryptoCodeObj(generateDynamicCryptoCode());
    setSecondsRemaining(300);
    setIsExpired(false);
  };

  // Sender details QR payload
  const sendPayload = useMemo(() => {
    return encryptTransactionPayload({
      id: authorizedTx?.id || 'TX_SEND_' + cryptoCodeObj.code,
      sourceAmount: amount,
      sourceCurrency: 'NGN',
      targetAmount: amount,
      targetCurrency: 'NGN',
      recipientName: user.name, // The sender's name
      recipientDetail: `${user.virtualAccountNgn || user.phone} (MeshPay)`, // The sender's account detail
      bankName: 'MeshPay Account',
      offlineNonce: 'NONCE_' + cryptoCodeObj.code,
      created_at: cryptoCodeObj.expiresAt - 5 * 60 * 1000
    }, cryptoCodeObj.code);
  }, [cryptoCodeObj.code, cryptoCodeObj.expiresAt, amount, user.name, user.virtualAccountNgn, user.phone, authorizedTx]);

  const isOverBalance = amount > user.ngnBalance;

  const handleAuthorizeAndGenerate = () => {
    if (isOverBalance) {
      alert(`Strict Balance Limit Enforced: You cannot transact more than your available offline balance (₦${user.ngnBalance.toLocaleString()})`);
      return;
    }
    if (amount <= 0) {
      alert('Please enter a valid amount to send.');
      return;
    }

    // Trigger fingerprint/PIN authentication before generating QR
    setShowBiometricModal(true);
  };

  const executeAuthorizeAndGenerate = () => {
    setShowBiometricModal(false);

    const tx: Transaction = {
      id: 'tx_p2p_off_send_' + Date.now(),
      type: 'nearby_send',
      sourceAmount: amount,
      sourceCurrency: 'NGN',
      targetAmount: amount,
      targetCurrency: 'NGN',
      exchangeRate: 1.0,
      fee: 0,
      recipientName: 'Nearby Mesh Receiver',
      recipientDetail: 'Scanned via Handshake',
      timestamp: new Date().toISOString(),
      status: 'queued_offline',
      isOffline: true,
      offlineNonce: 'NONCE_' + cryptoCodeObj.code,
      notes: `Sent ₦${amount.toLocaleString()} NGN via Offline QR Handshake (Hashed Nonce: ${cryptoCodeObj.code})`
    };

    addTransaction(tx);
    setAuthorizedTx(tx);
    setIsAuthorized(true);

    addNotification({
      type: 'offline_queue',
      title: 'Funds Debited & Locked in QR',
      message: `₦${amount.toLocaleString()} NGN debited from your local balance. Show this QR to the receiver to complete transaction instantly.`,
      txId: tx.id,
      amountDisplay: `-₦${amount.toLocaleString()}`
    });
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleDownloadQrCode = () => {
    const canvas = document.getElementById('offline-send-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const imageUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = `MeshPay_Send_QR_${user.tag}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-950 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Send Money Offline (Show QR)</h3>
              <p className="text-[11px] text-slate-400">Encrypted Dynamic QR Sender</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {isAuthorized ? (
            /* FUNDS DEBITED & QR DISPLAYED */
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-3xl inline-block shadow-inner border-4 border-indigo-500/30 relative overflow-hidden">
                <QRCodeCanvas 
                  id="offline-send-qr-canvas"
                  value={sendPayload} 
                  size={180} 
                  level="H" 
                  includeMargin={true} 
                />
                {isExpired && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-white space-y-2 animate-fadeIn">
                    <div className="font-extrabold text-xs text-amber-400">QR Code Expired</div>
                    <p className="text-[10px] text-slate-300">5-minute safety threshold reached</p>
                    <button
                      onClick={handleRenewCode}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow-md flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Generate New QR</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 5-Min Expiry Session Timer Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-indigo-300 font-extrabold bg-slate-950 px-3.5 py-1.5 rounded-full border border-indigo-500/30 max-w-fit mx-auto">
                <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{isExpired ? 'QR Expired' : `QR Valid: ${timerDisplay}`}</span>
              </div>

              <div className="text-center space-y-1">
                <div className="text-2xl font-black text-white">₦{amount.toLocaleString()} NGN</div>
                <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Funds Secured & Debited From Your Vault</span>
                </div>
                <p className="text-[10px] text-slate-400 px-4 leading-relaxed">
                  Receiver must scan this QR on their device. Balance will instantly credit to their account offline.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadQrCode}
                  disabled={isExpired}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                    isExpired
                      ? 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-indigo-300'
                  }`}
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download QR Code Image (PNG)</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md"
                >
                  Done (Close Screen)
                </button>
              </div>
            </div>
          ) : (
            /* PRE-AUTHORIZATION AMOUNT INPUT */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="text-xs text-slate-400 font-semibold">Your Offline Vault Balance</div>
                <div className="text-2xl font-black text-indigo-400">₦{user.ngnBalance.toLocaleString()} NGN</div>
              </div>

              {/* Amount Selection & Custom Input */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Select Amount to Send
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 25000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAmount(preset);
                        }}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          amount === preset
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        ₦{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Or Enter Custom Amount (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-indigo-400 text-sm font-bold font-mono">₦</span>
                    <input
                      type="number"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter Custom Amount"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-sm font-bold text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                {isOverBalance && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[11px] flex items-start gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-black block">Strict Overdraft Prevention</span>
                      <span>You cannot generate a payment larger than your balance (₦{user.ngnBalance.toLocaleString()} NGN).</span>
                    </div>
                  </div>
                )}
              </div>

              {/* RECENT RECIPIENTS */}
              {recentRecipients && recentRecipients.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Recent Recipients</span>
                    </span>
                    <span className="text-[9px] text-indigo-300 font-bold">Tap to Pre-fill Amount</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-0.5">
                    {recentRecipients.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => {
                          setAmount(5000); // Reset or set default
                          if (onSelectRecentRecipient) {
                            onSelectRecentRecipient(rec);
                          }
                        }}
                        className="flex items-center gap-2 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all text-left group"
                      >
                        {rec.avatar ? (
                          <img
                            src={rec.avatar}
                            alt={rec.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover border border-indigo-500/10 shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-900/60 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                            {rec.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="truncate min-w-0">
                          <div className="text-[10px] font-black text-white group-hover:text-indigo-400 transition-colors truncate">
                            {rec.name}
                          </div>
                          <div className="text-[8px] text-slate-500 truncate">
                            MeshPay Account
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleAuthorizeAndGenerate}
                disabled={isOverBalance || amount <= 0}
                className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isOverBalance || amount <= 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Authorize & Show Send QR (₦{amount.toLocaleString()})</span>
              </button>
            </div>
          )}

          {/* SECURITY & ANTI-REPLAY INFORMATION */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-500/30 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-indigo-300 font-extrabold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict Security Protocols</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold">
                ENFORCED ✓
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Every payment QR code is uniquely encrypted with a single-use nonce, timestamp, and HMAC signature. Handshake expires in 5 minutes to prevent replay attacks.
            </p>

            <button
              onClick={() => setShowCryptoExplainer(!showCryptoExplainer)}
              className="w-full py-1 text-[10px] text-indigo-300 hover:text-white font-extrabold flex items-center justify-between border-t border-indigo-900/60 pt-2"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How Offline Security Works (Nonce & HMAC)</span>
              </span>
              <span>{showCryptoExplainer ? '▲ Hide' : '▼ Info'}</span>
            </button>

            {showCryptoExplainer && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[10px] text-slate-300 leading-relaxed animate-fadeIn">
                <div>
                  <span className="font-bold text-amber-300">1. Strict Double-Spend Protection:</span>
                  <p className="text-slate-400">Funds are immediately debited from your local balance before the QR code is generated. It cannot exceed your wallet limit.</p>
                </div>
                <div>
                  <span className="font-bold text-amber-300">2. Single-Use Nonce Security:</span>
                  <p className="text-slate-400">Ensures that each offline transfer handshake can only be scanned and processed once by the receiver.</p>
                </div>
                <div>
                  <span className="font-bold text-amber-300">3. Tamper-Proof Cryptographic Seal:</span>
                  <p className="text-slate-400">Receiver's app automatically verifies the HMAC checksum. The transaction amount is strictly locked and cannot be altered by the scanning device.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      <BiometricModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={executeAuthorizeAndGenerate}
        amountDisplay={`₦${amount.toLocaleString()}`}
        recipientDisplay="Generate Secure Send QR"
      />
    </div>
  );
};
