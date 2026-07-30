import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  ShieldCheck, 
  Upload, 
  KeyRound, 
  AlertTriangle,
  Lock,
  Copy,
  Check,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { UserProfile, Transaction } from '../types';
import { addTransaction, generateOfflineSignature } from '../lib/storage';
import { addNotification } from '../lib/notifications';
import { INITIAL_NEARBY_PEERS } from '../data/mockData';
import { 
  decryptAndVerifyQrPayload, 
  generateDynamicCryptoCode,
  EncryptedTxPayload,
  encryptTransactionPayload 
} from '../lib/qrCrypto';
import { BiometricModal } from './BiometricModal';
import { SuccessCelebration } from './SuccessCelebration';

interface OfflineSendQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onTransactionComplete?: (tx: Transaction) => void;
}

export const OfflineSendQrModal: React.FC<OfflineSendQrModalProps> = ({
  isOpen,
  onClose,
  user,
  onTransactionComplete
}) => {
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCryptoExplainer, setShowCryptoExplainer] = useState(false);

  // Dynamic 5-minute code state
  const [cryptoCodeObj, setCryptoCodeObj] = useState(() => generateDynamicCryptoCode());
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isExpired, setIsExpired] = useState(false);

  // Scanned & Verified Payload State
  const [verifiedTx, setVerifiedTx] = useState<EncryptedTxPayload | null>(null);
  const [scannedRecipient, setScannedRecipient] = useState<{
    name: string;
    tag: string;
    account: string;
    bank: string;
  } | null>(null);

  const [sendAmount, setSendAmount] = useState<number>(5000);
  const [sendNote, setSendNote] = useState<string>('Offline Encrypted QR Payment');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [lastCompletedTx, setLastCompletedTx] = useState<Transaction | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer for 5-minute dynamic code
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

  const handleRegenerateCode = () => {
    setCryptoCodeObj(generateDynamicCryptoCode());
    setSecondsRemaining(300);
    setIsExpired(false);
  };

  const stopCameraStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setPaymentSuccess(false);
      setScannedRecipient(null);
      setVerifiedTx(null);
      setScanError(null);
      setCameraError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(cryptoCodeObj.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const processRawQrString = (rawText: string) => {
    setScanError(null);
    const verification = decryptAndVerifyQrPayload(rawText);

    if (!verification.valid || !verification.txData) {
      setScanError(verification.error || 'Failed to decrypt or verify QR code payload');
      return;
    }

    const txData = verification.txData;
    setVerifiedTx(txData);
    setSendAmount(txData.targetAmount || 5000);
    setScannedRecipient({
      name: txData.recipientName,
      tag: txData.recipientName,
      account: txData.recipientDetail,
      bank: txData.bankName || 'Settlement Bank'
    });

    stopCameraStream();
  };

  const handleStartCamera = async () => {
    stopCameraStream();
    setCameraError(null);
    setScanError(null);
    setIsScanningCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();

        const scanFrame = () => {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              if (code && code.data) {
                processRawQrString(code.data);
                return;
              }
            }
          }
          animFrameRef.current = requestAnimationFrame(scanFrame);
        };

        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setIsScanningCamera(false);
      setCameraError('Camera access unavailable or blocked. You can upload a QR image file below.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanError(null);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          processRawQrString(code.data);
        } else {
          setScanError('No valid MeshPay QR code detected in the uploaded image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSimulatedPeer = (peer: typeof INITIAL_NEARBY_PEERS[0]) => {
    stopCameraStream();
    const simulatedQr = encryptTransactionPayload({
      id: 'tx_sim_' + Date.now(),
      sourceAmount: 5000,
      sourceCurrency: 'NGN',
      targetAmount: 5000,
      targetCurrency: 'NGN',
      recipientName: peer.name,
      recipientDetail: `${peer.accountNumber} (${peer.bankName})`,
      bankName: peer.bankName,
      offlineNonce: 'NONCE_PEER_' + peer.id
    });

    processRawQrString(simulatedQr);
  };

  const handleInitiateSend = () => {
    if (!scannedRecipient) return;
    if (sendAmount <= 0) return alert('Please enter a valid amount');
    if (sendAmount > user.ngnBalance) return alert('Insufficient NGN balance in offline vault');
    if (isExpired) return alert('QR code session has expired. Please regenerate a 5-minute code.');

    setShowAuthModal(true);
  };

  const handleAuthorizationSuccess = () => {
    if (!scannedRecipient) return;
    setShowAuthModal(false);

    try {
      const { signature, nonce } = generateOfflineSignature();

      const tx: Transaction = {
        id: 'tx_p2p_off_' + Date.now(),
        type: 'nearby_send',
        sourceAmount: sendAmount,
        sourceCurrency: 'NGN',
        targetAmount: sendAmount,
        targetCurrency: 'NGN',
        exchangeRate: 1.0,
        fee: 0,
        recipientName: scannedRecipient.name,
        recipientDetail: `${scannedRecipient.tag} (${scannedRecipient.bank})`,
        timestamp: new Date().toISOString(),
        status: 'queued_offline',
        isOffline: true,
        offlineSignature: signature,
        offlineNonce: nonce,
        notes: `${sendNote} (Verified via Encrypted QR Scan & Biometric Signature)`
      };

      addTransaction(tx);
      setLastCompletedTx(tx);

      addNotification({
        type: 'offline_queue',
        title: 'Encrypted Offline Payment Executed',
        message: `Sent ₦${sendAmount.toLocaleString()} NGN to ${scannedRecipient.name} via verified QR scan.`,
        txId: tx.id,
        amountDisplay: `₦${sendAmount.toLocaleString()}`
      });

      onClose();
      if (onTransactionComplete) onTransactionComplete(tx);
    } catch (err: any) {
      alert(err.message || 'Offline payment failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-950 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/30 font-bold">
              <Camera className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Scan QR to Send Money</h3>
              <p className="text-[11px] text-slate-400">Offline Camera & Image Scanner</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCameraStream();
              onClose();
            }} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {paymentSuccess ? (
            <SuccessCelebration
              title="P2P Payment Confirmed!"
              message={`Successfully sent ₦${sendAmount.toLocaleString()} NGN to ${scannedRecipient?.name}. Signed with offline cryptographic signature.`}
              amountDisplay={`₦${sendAmount.toLocaleString()} NGN`}
              recipientName={scannedRecipient?.name}
              txId={lastCompletedTx?.id}
              onDone={() => {
                stopCameraStream();
                onClose();
              }}
            />
          ) : (
            <div className="space-y-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              {/* 5-Min Expiry Warning Banner */}
              {isExpired && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>QR Code Expired (5-Min Limit Exceeded)</span>
                  </div>
                  <button
                    onClick={handleRegenerateCode}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] flex items-center gap-1 shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renew</span>
                  </button>
                </div>
              )}

              {/* Camera Scanner Viewfinder */}
              <div className="relative w-full h-48 bg-slate-950 rounded-2xl border-2 border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden">
                {isScanningCamera ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-8 border-2 border-emerald-400 rounded-2xl pointer-events-none animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
                    </div>

                    <button
                      onClick={stopCameraStream}
                      className="absolute bottom-2 px-3 py-1 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold border border-slate-700"
                    >
                      Stop Camera
                    </button>
                  </div>
                ) : verifiedTx ? (
                  <div className="text-center p-3 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                    <div className="font-extrabold text-xs text-white">{verifiedTx.recipientName}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {verifiedTx.recipientDetail}
                    </div>
                    <span className="inline-block text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                      ✓ Anti-Hijack Checksum Verified
                    </span>
                  </div>
                ) : (
                  <div className="text-center space-y-2 p-3">
                    <Camera className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-medium">Scan Recipient QR Code via Camera or Upload Image</p>
                    
                    <div className="flex gap-2 justify-center pt-1">
                      <button
                        onClick={handleStartCamera}
                        disabled={isExpired}
                        className={`px-3.5 py-2 rounded-xl text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md ${
                          isExpired ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Camera Scanner</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExpired}
                        className={`px-3 py-2 rounded-xl border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 ${
                          isExpired ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Upload QR Image</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{cameraError}</span>
                </div>
              )}

              {scanError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Simulated Peer QR Tokens */}
              {!verifiedTx && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Or Select Nearby Peer QR Token:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {INITIAL_NEARBY_PEERS.slice(0, 2).map((peer) => (
                      <button
                        key={peer.id}
                        onClick={() => handleSelectSimulatedPeer(peer)}
                        disabled={isExpired}
                        className={`p-2 bg-slate-950 border border-slate-800 rounded-xl text-left flex items-center gap-2 transition-all ${
                          isExpired ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-500'
                        }`}
                      >
                        <img src={peer.avatar} alt={peer.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div className="truncate">
                          <div className="font-bold text-[11px] text-white truncate">{peer.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono truncate">{peer.handle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* VERIFIED DETAILS & SEND FORM */}
              {verifiedTx && scannedRecipient && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-emerald-500/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-extrabold text-xs text-white">Recipient: {scannedRecipient.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{scannedRecipient.account}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>Amount to Transfer (NGN)</span>
                      <span>Vault: ₦{user.ngnBalance.toLocaleString()}</span>
                    </div>
                    <input
                      type="number"
                      value={sendAmount || ''}
                      onChange={(e) => setSendAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-lg font-black text-emerald-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleInitiateSend}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Authorize & Confirm ₦{sendAmount.toLocaleString()} Transfer</span>
                  </button>
                </div>
              )}

              {/* Security & Anti-Replay Session Badge */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-indigo-500/30 text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-indigo-300 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>5-Min Security Session</span>
                  </span>
                  <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    isExpired ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isExpired ? 'EXPIRED' : `Valid: ${timerDisplay}`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Camera QR scanner automatically validates encrypted payloads, single-use Nonce tokens, and HMAC checksums in offline mode.
                </p>

                {/* Learn Cryptographic Concepts */}
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
                      <span className="font-bold text-amber-300">1. Dynamic QR (Anti-Replay):</span>
                      <p className="text-slate-400">Rotates every 5 minutes so captured QR images cannot be re-used.</p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-300">2. Single-Use Nonce:</span>
                      <p className="text-slate-400">A cryptographic random string guaranteeing no double-spending.</p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-300">3. HMAC Integrity:</span>
                      <p className="text-slate-400">Ensures transfer amounts cannot be altered in transit.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      {/* Biometric Authorization Modal overlay (PIN / Liveness / Fingerprint) */}
      <BiometricModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthorizationSuccess}
        amountDisplay={`₦${sendAmount.toLocaleString()} NGN`}
        recipientDisplay={`${scannedRecipient?.name || ''} (${scannedRecipient?.bank || ''})`}
      />
    </div>
  );
};
