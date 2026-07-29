import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Volume2, 
  KeyRound, 
  Download
} from 'lucide-react';
import { UserProfile } from '../types';
import { generateDynamicCryptoCode, encryptTransactionPayload } from '../lib/qrCrypto';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPlayingSoundWave, setIsPlayingSoundWave] = useState(false);

  // Dynamic 5-minute cryptographic code state
  // Generated once and kept in state for 300 seconds
  const [cryptoCodeObj, setCryptoCodeObj] = useState(() => generateDynamicCryptoCode());
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  // Reset or renew dynamic code when modal opens or timer expires
  useEffect(() => {
    if (isOpen) {
      setCryptoCodeObj(generateDynamicCryptoCode());
      setSecondsRemaining(300);
      if (amountNgn) {
        setAmount(amountNgn);
      }
    }
  }, [isOpen, amountNgn]);

  // Countdown timer for 5-minute (300 seconds) code expiry
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Auto renew code after 5 minutes
          setCryptoCodeObj(generateDynamicCryptoCode());
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // CRITICAL FIX: Memoize receivePayload so that it DOES NOT re-calculate every second on timer tick.
  // The QR code string will ONLY change when cryptoCodeObj.code or user/amount changes (i.e. every 5 minutes).
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

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cryptoCodeObj.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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

  const handleEmitSound = () => {
    setIsPlayingSoundWave(true);
    setTimeout(() => setIsPlayingSoundWave(false), 3500);
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
              <h3 className="font-extrabold text-sm text-white">Scan to Receive Money</h3>
              <p className="text-[11px] text-slate-400">Offline Encrypted QR & Soundwave</p>
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
          {/* QR Code Display (Static for 5 minutes) */}
          <div className="text-center space-y-3">
            <div className="p-4 bg-white rounded-3xl inline-block shadow-inner border-4 border-emerald-500/30 relative">
              <QRCodeCanvas 
                id="offline-receive-qr-canvas"
                value={receivePayload} 
                size={180} 
                level="H" 
                includeMargin={true} 
              />
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
                      onClick={() => setAmount(preset)}
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

            <button
              onClick={handleDownloadQrCode}
              className="w-full py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download QR Code Image (PNG)</span>
            </button>
          </div>

          {/* 5-MINUTE DYNAMIC VERIFICATION CODE CARD */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-950 rounded-2xl border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>5-Minute Security Code</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold px-2 py-0.5 rounded-full">
                Changes in {timerDisplay}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/30">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Dynamic Verification Key</div>
                <div className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {cryptoCodeObj.code}
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Ultrasonic soundwave broadcast option */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
            <div className="text-xs font-extrabold text-slate-300 flex items-center justify-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Ultrasonic Soundwave Broadcast</span>
            </div>
            <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">
              Emits high-frequency offline token to nearby peer microphone.
            </p>
            <button
              onClick={handleEmitSound}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold transition-colors flex items-center justify-center gap-1.5"
            >
              <Volume2 className={`w-3.5 h-3.5 text-emerald-400 ${isPlayingSoundWave ? 'animate-bounce' : ''}`} />
              <span>{isPlayingSoundWave ? 'Broadcasting Soundwave...' : 'Emit Ultrasound Token'}</span>
            </button>
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
    </div>
  );
};
