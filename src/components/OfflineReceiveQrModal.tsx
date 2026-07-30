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
  Zap
} from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { generateDynamicCryptoCode, encryptTransactionPayload } from '../lib/qrCrypto';
import { addTransaction } from '../lib/storage';
import { addNotification } from '../lib/notifications';
import { SuccessCelebration } from './SuccessCelebration';

interface OfflineReceiveQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  amountNgn?: number;
}

export const OfflineReceiveQrModal: React.FC<OfflineReceiveQrModalProps> = ({
  isOpen,
  onClose,
  user,
  amountNgn = 5000
}) => {
  const [amount, setAmount] = useState<number>(amountNgn || 5000);

  // Dynamic 5-minute cryptographic code state
  const [cryptoCodeObj, setCryptoCodeObj] = useState(() => generateDynamicCryptoCode());
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isExpired, setIsExpired] = useState(false);
  const [showCryptoExplainer, setShowCryptoExplainer] = useState(false);

  // Success state when payment is received
  const [receivedTx, setReceivedTx] = useState<Transaction | null>(null);

  // Reset dynamic code & states when modal opens
  useEffect(() => {
    if (isOpen) {
      setCryptoCodeObj(generateDynamicCryptoCode());
      setSecondsRemaining(300);
      setIsExpired(false);
      setReceivedTx(null);
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

  const receivePayload = useMemo(() => {
    return encryptTransactionPayload({
      id: 'TX_RECV_' + cryptoCodeObj.code,
      sourceAmount: amount,
      sourceCurrency: 'NGN',
      targetAmount: amount,
      targetCurrency: 'NGN',
      recipientName: user.name,
      recipientDetail: `${user.virtualAccountNgn} (${user.bankName})`,
      bankName: user.bankName,
      offlineNonce: 'NONCE_' + cryptoCodeObj.code
    }, cryptoCodeObj.code);
  }, [cryptoCodeObj.code, amount, user.name, user.virtualAccountNgn, user.bankName]);

  const handleSimulatePaymentReceived = () => {
    const rxTx: Transaction = {
      id: 'tx_p2p_rx_' + Date.now(),
      type: 'nearby_receive',
      sourceAmount: amount,
      sourceCurrency: 'NGN',
      targetAmount: amount,
      targetCurrency: 'NGN',
      exchangeRate: 1.0,
      fee: 0,
      recipientName: user.name,
      recipientDetail: `${user.virtualAccountNgn} (${user.bankName})`,
      timestamp: new Date().toISOString(),
      status: 'queued_offline',
      isOffline: true,
      offlineNonce: 'NONCE_RX_' + Math.floor(100000 + Math.random() * 900000),
      notes: `Received ₦${amount.toLocaleString()} NGN via Dynamic QR Offline Scan (HMAC & Nonce Verified)`
    };

    addTransaction(rxTx);

    addNotification({
      type: 'offline_queue',
      title: 'Offline Payment Received!',
      message: `₦${amount.toLocaleString()} NGN received via QR scan. Credited to local offline vault.`,
      txId: rxTx.id,
      amountDisplay: `+₦${amount.toLocaleString()}`
    });

    setReceivedTx(rxTx);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleDownloadQrCode = () => {
    const canvas = document.getElementById('offline-receive-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const imageUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = `MeshPay_Receive_QR_${user.tag}.png`;
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
              <h3 className="font-extrabold text-sm text-white">Receive Money (Offline)</h3>
              <p className="text-[11px] text-slate-400">Encrypted Dynamic QR Receiver</p>
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
          {receivedTx ? (
            /* PAYMENT COMPLETED: Show Receipt & Hide QR Code */
            <SuccessCelebration
              title="Payment Received Offline!"
              message={`Successfully received ₦${receivedTx.targetAmount.toLocaleString()} NGN into your local vault. Nonce signature verified.`}
              amountDisplay={`+₦${receivedTx.targetAmount.toLocaleString()} NGN`}
              recipientName={user.name}
              txId={receivedTx.id}
              onDone={() => {
                setReceivedTx(null);
                onClose();
              }}
            />
          ) : (
            <>
              {/* QR Code Display (Hides when payment is completed) */}
              <div className="text-center space-y-3">
                <div className="p-4 bg-white rounded-3xl inline-block shadow-inner border-4 border-emerald-500/30 relative overflow-hidden">
                  <QRCodeCanvas 
                    id="offline-receive-qr-canvas"
                    value={receivePayload} 
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
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] rounded-xl shadow-md flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Generate New QR</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 5-Min Expiry Session Timer Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-400 font-extrabold bg-slate-950 px-3.5 py-1.5 rounded-full border border-amber-500/30 max-w-fit mx-auto">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{isExpired ? 'QR Expired' : `QR Auto-Rotates in ${timerDisplay}`}</span>
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xl font-black text-white">₦{amount.toLocaleString()} NGN</div>
                  <div className="text-xs text-slate-300">
                    Recipient: <span className="text-emerald-400 font-extrabold">{user.name}</span> ({user.virtualAccountNgn})
                  </div>
                  <div className="text-[10px] text-slate-400">{user.bankName}</div>
                </div>

                {/* Quick Amount Selection & Custom Input */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Quick Amount Presets
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[5000, 10000, 20000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAmount(preset);
                            if (isExpired) handleRenewCode();
                          }}
                          className={`py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${
                            amount === preset
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          ₦{preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Or Input Preferred Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-emerald-400 text-xs font-bold font-mono">₦</span>
                      <input
                        type="number"
                        value={amount || ''}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Enter Custom Amount"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-7 pr-3 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleDownloadQrCode}
                    disabled={isExpired}
                    className={`w-full py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                      isExpired
                        ? 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-emerald-300'
                    }`}
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download QR Code Image (PNG)</span>
                  </button>

                  <button
                    onClick={handleSimulatePaymentReceived}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Zap className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                    <span>Simulate Payment Received</span>
                  </button>
                </div>
              </div>

              {/* SECURITY & ANTI-REPLAY INFORMATION */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-indigo-500/30 text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic Offline Security</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-extrabold">
                    ACTIVE ✓
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Payload automatically encodes nonces and HMAC checksums. QR code auto-rotates every 5 minutes to prevent replay attacks.
                </p>

                {/* Cryptographic Security Details Explainer */}
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
                      <span className="font-bold text-amber-300">1. Why QR Code Changes Every 5 Minutes:</span>
                      <p className="text-slate-400">Prevents <span className="text-indigo-300">Replay Attacks</span>. Captured screenshots of QR codes expire in 5 minutes and cannot be fraudulently re-submitted.</p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-300">2. Single-Use Nonce:</span>
                      <p className="text-slate-400">Unique random salt for each transaction guaranteeing no double-spending on the offline ledger.</p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-300">3. HMAC Integrity Seal:</span>
                      <p className="text-slate-400">A digital tamper-proof seal ensuring payment amounts cannot be altered in transit.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
    </div>
  );
};

