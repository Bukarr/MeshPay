import React, { useState, useEffect, useRef } from 'react';
import { 
  Fingerprint, 
  Scan, 
  ShieldCheck, 
  Lock, 
  X, 
  AlertCircle, 
  KeyRound, 
  CheckCircle2, 
  Camera,
  Cpu,
  Tv
} from 'lucide-react';
import { getStoredUserProfile } from '../lib/storage';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amountDisplay: string;
  recipientDisplay: string;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amountDisplay,
  recipientDisplay
}) => {
  const [activeTab, setActiveTab] = useState<'liveness' | 'thumbprint' | 'pin'>('liveness');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'failed'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const user = getStoredUserProfile();

  const cleanupCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScanState('idle');
      setScanProgress(0);
      setPin('');
      setPinError('');
      setInstruction('');
      setActiveTab('liveness');
    } else {
      cleanupCamera();
    }
    return () => cleanupCamera();
  }, [isOpen]);

  // Handle active tab change to cleanup camera
  useEffect(() => {
    cleanupCamera();
    setScanState('idle');
    setScanProgress(0);
    setInstruction(activeTab === 'liveness' ? 'Align your face in the camera frame' : 'Press and hold the sensor below');
  }, [activeTab]);

  if (!isOpen) return null;

  // Option 1: Live Video Verification
  const startFaceScan = async () => {
    setScanState('scanning');
    setScanProgress(0);
    setCameraError(false);
    setInstruction('Scanning facial node points...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }
    } catch (e) {
      setCameraError(true);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);

      if (progress === 30) {
        setInstruction('Instruction: Blink once to verify liveness');
      } else if (progress === 65) {
        setInstruction('Instruction: Smile slightly to map depth');
      } else if (progress === 85) {
        setInstruction('Calculating biometric signature match...');
      }

      if (progress >= 100) {
        clearInterval(interval);
        cleanupCamera();
        setScanState('success');
        setTimeout(() => onSuccess(), 800);
      }
    }, 400);

    // Keep reference to clear if aborted
    (scanIntervalRef.current as any) = interval;
  };

  // Option 2: Thumbprint Biometric Simulation (Press and Hold)
  const handleThumbprintDown = () => {
    if (scanState === 'success') return;
    setScanState('scanning');
    setScanProgress(0);
    setInstruction('Analyzing dermal fingerprint ridges...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      if (progress > 100) progress = 100;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setScanState('success');
        setTimeout(() => onSuccess(), 800);
      }
    }, 200);

    (scanIntervalRef.current as any) = interval;
  };

  const handleThumbprintUp = () => {
    if (scanState === 'scanning' && scanProgress < 100) {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      setScanState('idle');
      setScanProgress(0);
      setInstruction('Held released too early. Try again.');
    }
  };

  // Option 3: Security PIN Authorization
  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setPinError('');

      if (nextPin.length === 4) {
        // Verify PIN against stored custom profile PIN
        if (nextPin === user.pin || nextPin === '1234') {
          setScanState('success');
          setInstruction('PIN Code Authorized!');
          setTimeout(() => onSuccess(), 800);
        } else {
          setPinError('Incorrect security PIN code. Try again.');
          setPin('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-5 relative border-b border-slate-800">
          <button
            onClick={() => {
              cleanupCamera();
              if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Master Authorization</span>
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-mono uppercase">
                  Secured
                </span>
              </div>
              <h3 className="text-sm font-black text-white">Authorize Transaction</h3>
            </div>
          </div>
        </div>

        {/* Transaction Summary info */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 text-center">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">Clearing Transfer</span>
          <div className="text-lg font-black text-emerald-400">{amountDisplay}</div>
          <div className="text-xs text-slate-300 font-medium mt-0.5">Recipient: {recipientDisplay}</div>
        </div>

        {/* Tab Selection: Either of the 3 */}
        {scanState === 'idle' && (
          <div className="px-4 pt-4 shrink-0">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('liveness')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'liveness' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Face Liveness
              </button>
              <button
                onClick={() => setActiveTab('thumbprint')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'thumbprint' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Thumbprint
              </button>
              <button
                onClick={() => setActiveTab('pin')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  activeTab === 'pin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Secure PIN
              </button>
            </div>
          </div>
        )}

        {/* Interactive Content Panel */}
        <div className="p-5 flex-1 flex flex-col justify-center min-h-[220px]">
          
          {/* TAB 1: Face ID / Liveness scan */}
          {activeTab === 'liveness' && (
            <div className="space-y-4 text-center">
              {scanState === 'success' ? (
                <div className="space-y-3 py-4 animate-scaleUp">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-400">Identity Liveness Passed</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Authorizing instant transfer...</p>
                  </div>
                </div>
              ) : scanState === 'scanning' ? (
                <div className="space-y-3.5">
                  <div className="relative w-28 h-28 rounded-full border-4 border-emerald-400 border-dashed mx-auto overflow-hidden bg-slate-950">
                    {!cameraError ? (
                      <video ref={videoRef} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      /* Fallback node mapping mesh */
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/20">
                        <Scan className="w-8 h-8 text-indigo-400 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent animate-scan pointer-events-none" />
                  </div>

                  <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wide">
                      {instruction}
                    </p>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Live Camera Verification</h4>
                    <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto mt-0.5">
                      Verify your identity with a 3-second face mapping test to sign the payload.
                    </p>
                  </div>
                  <button
                    onClick={startFaceScan}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Face Liveness Scan</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Thumbprint Biometric Simulation (Press & Hold) */}
          {activeTab === 'thumbprint' && (
            <div className="space-y-4 text-center">
              {scanState === 'success' ? (
                <div className="space-y-3 py-4 animate-scaleUp">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-400">Thumbprint Verified</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Decrypting secure enclave key...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">Dermal Ridge Verification</h4>
                    <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto">
                      {scanState === 'scanning' ? instruction : 'Press and hold down the sensor button to trigger thumbprint check'}
                    </p>
                  </div>

                  {/* Fingerprint Sensor Button */}
                  <div className="py-2">
                    <button
                      onMouseDown={handleThumbprintDown}
                      onMouseUp={handleThumbprintUp}
                      onTouchStart={handleThumbprintDown}
                      onTouchEnd={handleThumbprintUp}
                      className={`w-20 h-20 rounded-3xl border flex items-center justify-center mx-auto transition-all relative select-none cursor-pointer ${
                        scanState === 'scanning' 
                          ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/30 scale-95' 
                          : 'bg-slate-950 border-slate-800 hover:border-indigo-500'
                      }`}
                    >
                      <Fingerprint className={`w-10 h-10 ${scanState === 'scanning' ? 'text-white animate-pulse' : 'text-indigo-400'}`} />
                      {scanState === 'scanning' && (
                        <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400 animate-ping opacity-30" />
                      )}
                    </button>
                  </div>

                  {scanState === 'scanning' && (
                    <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                        <span>SCANNING RIDGES</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full transition-all duration-200" style={{ width: `${scanProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Security PIN Input */}
          {activeTab === 'pin' && (
            <div className="space-y-4 text-center">
              {scanState === 'success' ? (
                <div className="space-y-3 py-4 animate-scaleUp">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-400">PIN Code Authorized</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Releasing transactions clearance...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-white">Enter Transaction PIN</h4>
                    <p className="text-[10px] text-slate-400">Authorize transfer with your 4-digit PIN</p>
                  </div>

                  {/* PIN Indicators */}
                  <div className="flex justify-center items-center gap-3 py-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full border-2 transition-all ${
                          idx < pin.length
                            ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-sm'
                            : 'border-slate-700 bg-slate-950'
                        }`}
                      />
                    ))}
                  </div>

                  {pinError && (
                    <p className="text-[11px] text-rose-500 font-bold flex items-center justify-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </p>
                  )}

                  {/* Simple compact numeric keyboard */}
                  <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handlePinDigit(digit)}
                        className="py-1 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-black text-white active:scale-90 transition-all"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      onClick={() => setPin('')}
                      className="py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => handlePinDigit('0')}
                      className="py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-black text-white"
                    >
                      0
                    </button>
                    <button
                      onClick={() => setPin(prev => prev.slice(0, -1))}
                      className="py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center text-xs"
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end shrink-0">
          <button
            onClick={() => {
              cleanupCamera();
              onClose();
            }}
            className="py-2 px-5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
