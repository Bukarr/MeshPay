import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  X, 
  Download, 
  ShieldCheck, 
  Building2, 
  Copy, 
  Check, 
  QrCode, 
  KeyRound,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { Transaction } from '../types';
import { generateTransactionPdf } from '../lib/pdfGenerator';
import { downloadReceiptImage } from '../lib/receiptImageGenerator';
import { generateDynamicCryptoCode, encryptTransactionPayload } from '../lib/qrCrypto';

interface TransactionReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSyncNow?: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  onClose,
  onSyncNow
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Dynamic 5-minute cryptographic code state
  const [cryptoCodeObj, setCryptoCodeObj] = useState(() => generateDynamicCryptoCode());
  const [secondsRemaining, setSecondsRemaining] = useState(300);

  useEffect(() => {
    if (transaction && transaction.status === 'completed') {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  }, [transaction]);

  // Regenerate dynamic code when transaction changes
  useEffect(() => {
    if (transaction) {
      setCryptoCodeObj(generateDynamicCryptoCode());
      setSecondsRemaining(300);
    }
  }, [transaction?.id]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Auto renew code on expiry
          setCryptoCodeObj(generateDynamicCryptoCode());
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining]);

  if (!transaction) return null;

  const isUsdToNgn = transaction.type === 'usd_to_ngn';
  const isReceived = transaction.type === 'nearby_receive' || transaction.type === 'top_up';

  const formatCurrency = (val: number, cur: string) => {
    if (cur === 'USD') return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Encrypted QR payload for anti-hijack security
  const encryptedQrPayload = encryptTransactionPayload(transaction, cryptoCodeObj.code);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cryptoCodeObj.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPdf = () => {
    generateTransactionPdf(transaction);
  };

  const handleDownloadQrImage = () => {
    const canvas = document.getElementById('tx-receipt-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const imageUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = imageUrl;
    downloadLink.download = `MeshPay_Encrypted_QR_${transaction.id}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white relative max-h-[90vh] flex flex-col">
        {/* Top Header Decorative Banner */}
        <div className={`p-5 text-center relative shrink-0 ${
          isReceived
            ? 'bg-gradient-to-b from-emerald-950/90 via-emerald-900/40 to-slate-900 border-b border-emerald-500/30' 
            : 'bg-gradient-to-b from-indigo-950/90 via-slate-900/60 to-slate-900 border-b border-indigo-500/30'
        }`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900/60 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Direction & Status Icon */}
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center shadow-xl relative">
            {isReceived ? (
              <div className="w-full h-full bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ArrowDownLeft className="w-7 h-7 stroke-[3]" />
              </div>
            ) : transaction.status === 'queued_offline' ? (
              <div className="w-full h-full bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
                <Clock className="w-7 h-7 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-full h-full bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <ArrowUpRight className="w-7 h-7 stroke-[3]" />
              </div>
            )}
          </div>

          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border ${
            isReceived
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          }`}>
            <span>{isReceived ? 'Credit Received' : 'Debit Sent'}</span>
            <span>•</span>
            <span>{transaction.status === 'completed' ? 'Settled' : 'Queued'}</span>
          </div>

          <h2 className={`text-2xl font-black tracking-tight ${isReceived ? 'text-emerald-400' : 'text-white'}`}>
            {isReceived ? '+' : '-'}{formatCurrency(transaction.targetAmount, transaction.targetCurrency)}
          </h2>

          <p className="text-[11px] text-slate-400 mt-0.5">
            {isReceived 
              ? (transaction.type === 'top_up' ? 'Account Deposit / Top-up' : 'Incoming P2P Mesh Credit')
              : (isUsdToNgn ? 'USD to NGN Remittance Swap' : 'Outgoing P2P Transfer')}
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>{isReceived ? 'Sender / Payer' : 'Recipient Name'}</span>
              <span className="font-semibold text-slate-100">{transaction.recipientName}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isReceived ? 'Source Detail' : 'Destination Detail'}</span>
              <span className="font-mono text-slate-200">{transaction.recipientDetail}</span>
            </div>

            {transaction.bankName && (
              <div className="flex items-center justify-between text-slate-400">
                <span>{isReceived ? 'Sender Bank' : 'Beneficiary Bank'}</span>
                <span className="font-medium text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {transaction.bankName}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800 my-1 pt-2 flex items-center justify-between text-slate-400">
              <span>{isReceived ? 'Credited Amount' : 'Debited Amount'}</span>
              <span className={`font-bold ${isReceived ? 'text-emerald-400' : 'text-slate-100'}`}>
                {isReceived ? '+' : '-'}{formatCurrency(transaction.sourceAmount, transaction.sourceCurrency)}
              </span>
            </div>

            {isUsdToNgn && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Applied Exchange Rate</span>
                <span className="font-mono text-emerald-400">$1 = ₦{transaction.exchangeRate.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Transfer Fee</span>
              <span className="font-semibold text-emerald-400">₦0.00 (Zero Fee)</span>
            </div>
          </div>

          {/* DYNAMIC 5-MIN CRYPTOGRAPHY CODE CARD */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-950 rounded-2xl border border-indigo-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-300 font-extrabold text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Expiring Verification Code</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold px-2 py-0.5 rounded-full">
                Expires in {timerDisplay}
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/90 p-2.5 rounded-xl border border-indigo-500/30">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Random Crypto Key</div>
                <div className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {cryptoCodeObj.code}
                </div>
              </div>

              {/* REPLACED COPY PAYLOAD BUTTON WITH COPY CODE BUTTON */}
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* HASHED & ENCRYPTED QR CODE SECTION WITH DOWNLOAD */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs hover:underline"
              >
                <QrCode className="w-4 h-4" />
                <span>{showQrCode ? 'Hide Encrypted QR Code' : 'Show Encrypted QR Code'}</span>
              </button>

              <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
                Anti-Hijack Hashed
              </span>
            </div>

            {showQrCode && (
              <div className="pt-2 text-center space-y-3 animate-fadeIn">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-inner border-2 border-emerald-500/40">
                  <QRCodeCanvas
                    id="tx-receipt-qr-canvas"
                    value={encryptedQrPayload}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 max-w-[240px] mx-auto leading-tight">
                    This QR code contains salted HMAC checksums to prevent transaction hijacking across remote devices.
                  </div>

                  <button
                    onClick={handleDownloadQrImage}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download QR Code Image (PNG)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Security Cryptographic Proof */}
          {transaction.isOffline && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Offline Cryptographic Nonce Proof</span>
              </div>
              <div className="font-mono text-[10px] text-slate-400 break-all space-y-0.5">
                <div>Hash: <span className="text-slate-200">{transaction.offlineSignature}</span></div>
                <div>Nonce: <span className="text-slate-200">{transaction.offlineNonce}</span></div>
              </div>
            </div>
          )}

          {/* Timestamp & Reference */}
          <div className="space-y-1 text-[11px] text-slate-400 px-1">
            <div className="flex justify-between">
              <span>Transaction Ref:</span>
              <span className="font-mono text-slate-300">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Initiated Date:</span>
              <span>{new Date(transaction.timestamp).toLocaleString()}</span>
            </div>
            {transaction.syncTimestamp && (
              <div className="flex justify-between text-emerald-400">
                <span>Synced To Ledger:</span>
                <span>{new Date(transaction.syncTimestamp).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>PDF Receipt</span>
            </button>

            <button
              onClick={() => downloadReceiptImage(transaction)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Image (PNG)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

