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

  const isReceived = transaction.type === 'nearby_receive' || 
                     transaction.type === 'top_up' || 
                     transaction.type === 'remittance_receive' ||
                     (transaction.notes || '').toLowerCase().includes('received');
  
  const isUsdToNgn = transaction.type === 'usd_to_ngn' || (transaction.sourceCurrency === 'USD' && transaction.targetCurrency === 'NGN');

  const formatCurrency = (val: number, cur: string) => {
    if (cur === 'USD') return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    return `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const displayCurrency = isReceived 
    ? (transaction.targetCurrency || transaction.sourceCurrency || 'NGN') 
    : (transaction.sourceCurrency || 'NGN');
  
  const displayAmount = isReceived 
    ? (transaction.targetAmount !== undefined ? transaction.targetAmount : transaction.sourceAmount)
    : transaction.sourceAmount;

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
            <span>{isReceived ? '📥 INCOMING CREDIT RECEIVED' : '📤 OUTGOING DEBIT SENT'}</span>
            <span>•</span>
            <span>{transaction.status === 'completed' ? 'Settled' : 'Queued'}</span>
          </div>

          <h2 className={`text-2xl font-black tracking-tight font-mono ${isReceived ? 'text-emerald-400' : 'text-white'}`}>
            {isReceived ? '+' : '-'}{formatCurrency(displayAmount, displayCurrency)}
          </h2>

          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
            {isReceived 
              ? (transaction.type === 'top_up' ? 'Account Deposit / Top-up' : 'Incoming P2P Mesh Credit')
              : (isUsdToNgn ? 'USD to NGN Remittance Swap' : 'Outgoing P2P Transfer')}
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold text-slate-300">{isReceived ? 'Sender Contact' : 'Recipient Contact'}</span>
              <span className="font-extrabold text-white text-sm">{transaction.recipientName}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>{isReceived ? 'Sender Tag / Account' : 'Recipient Tag / Account'}</span>
              <span className="font-mono text-emerald-300 font-bold">{transaction.recipientDetail}</span>
            </div>

            {transaction.bankName && (
              <div className="flex items-center justify-between text-slate-400">
                <span>{isReceived ? 'Origin Bank Node' : 'Destination Bank Node'}</span>
                <span className="font-medium text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {transaction.bankName}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800 my-1 pt-2 flex items-center justify-between text-slate-400">
              <span>{isReceived ? 'Credited Net Amount' : 'Debited Net Amount'}</span>
              <span className={`font-bold font-mono ${isReceived ? 'text-emerald-400' : 'text-slate-100'}`}>
                {isReceived ? '+' : '-'}{formatCurrency(displayAmount, displayCurrency)}
              </span>
            </div>

            {isUsdToNgn && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Applied Remittance Rate</span>
                <span className="font-mono text-emerald-400">$1 USD = ₦{transaction.exchangeRate.toLocaleString()} NGN</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Network Transfer Fee</span>
              <span className="font-semibold text-emerald-400">Zero Fee (Mesh Network)</span>
            </div>
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

