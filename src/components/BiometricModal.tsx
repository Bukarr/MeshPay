import React, { useState, useEffect } from 'react';
import { Fingerprint, Scan, ShieldCheck, Lock, X, AlertCircle, KeyRound, CheckCircle2, Sparkles } from 'lucide-react';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amountDisplay: string;
  recipientDisplay: string;
  thresholdUsd?: number;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amountDisplay,
  recipientDisplay,
  thresholdUsd = 100
}) => {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'pin_fallback'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScanState('idle');
      setScanProgress(0);
      setPin('');
      setPinError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerScan = () => {
    setScanState('scanning');
    setScanProgress(15);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setScanState('verifying');
          setTimeout(() => {
            setScanProgress(100);
            setScanState('success');
            setTimeout(() => {
              onSuccess();
            }, 800);
          }, 600);
          return 90;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handlePinSubmit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setPinError('');

      if (newPin.length === 6) {
        if (newPin === '123456' || newPin === '123400') {
          setScanState('success');
          setTimeout(() => {
            onSuccess();
          }, 600);
        } else {
          setPinError('Invalid PIN code. Try 123456 for demo.');
          setTimeout(() => setPin(''), 800);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Biometric Check</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-mono">
                  HIGH VALUE
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Security Authorization</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            This transfer exceeds <strong className="text-emerald-400">${thresholdUsd} USD</strong> and requires biometric verification or hardware passkey authorization.
          </p>
        </div>

        {/* Transaction Brief */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Authorizing Transfer</span>
          <div className="text-xl font-extrabold text-indigo-600">{amountDisplay}</div>
          <div className="text-xs text-slate-600 font-medium mt-0.5">To: {recipientDisplay}</div>
        </div>

        {/* Biometric Interactive Body */}
        {scanState !== 'pin_fallback' ? (
          <div className="p-6 text-center space-y-6">
            {/* Visual Scanner Area */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {scanState === 'scanning' && (
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 border-t-indigo-600 animate-spin" />
              )}
              {scanState === 'verifying' && (
                <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-50" />
              )}

              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all ${
                scanState === 'success'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : scanState === 'scanning' || scanState === 'verifying'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
              }`}>
                {scanState === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 animate-bounce" />
                ) : scanState === 'scanning' ? (
                  <Scan className="w-12 h-12 animate-pulse" />
                ) : scanState === 'verifying' ? (
                  <Fingerprint className="w-12 h-12 animate-pulse" />
                ) : (
                  <Fingerprint className="w-12 h-12" />
                )}
              </div>
            </div>

            {/* Status Messages */}
            <div>
              {scanState === 'idle' && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">Tap Sensor or Scan Face ID</h4>
                  <p className="text-xs text-slate-500">Touch the sensor or look directly at your screen camera</p>
                </div>
              )}
              {scanState === 'scanning' && (
                <div className="space-y-1">
                  <h4 className="font-bold text-indigo-600 text-sm">Scanning Biometrics ({scanProgress}%)</h4>
                  <p className="text-xs text-slate-500">Reading facial geometry & device secure enclave...</p>
                </div>
              )}
              {scanState === 'verifying' && (
                <div className="space-y-1">
                  <h4 className="font-bold text-indigo-600 text-sm">Verifying Hardware Passkey</h4>
                  <p className="text-xs text-slate-500">Validating cryptographic key signature...</p>
                </div>
              )}
              {scanState === 'success' && (
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-600 text-sm">Identity Verified!</h4>
                  <p className="text-xs text-emerald-700">Authorizing transaction clearance...</p>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {scanState === 'idle' && (
              <div className="space-y-2">
                <button
                  onClick={triggerScan}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>Authenticate with Face ID / Touch ID</span>
                </button>

                <button
                  onClick={() => setScanState('pin_fallback')}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Use 6-Digit PIN Instead</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* PIN Fallback View */
          <div className="p-6 text-center space-y-4">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">Enter 6-Digit Security PIN</h4>
              <p className="text-xs text-slate-500">Demo PIN: <strong className="text-indigo-600 font-mono">123456</strong></p>
            </div>

            {/* PIN Indicators */}
            <div className="flex justify-center items-center gap-3 py-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    idx < pin.length
                      ? 'bg-indigo-600 border-indigo-600 scale-110'
                      : 'border-slate-300 bg-white'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {pinError}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinSubmit(digit)}
                  className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base active:scale-95 transition-all"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={() => setScanState('idle')}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-indigo-600 flex items-center justify-center text-xs font-bold"
                title="Back to Biometrics"
              >
                <Fingerprint className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePinSubmit('0')}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-base active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={() => setPin((prev) => prev.slice(0, -1))}
                className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold text-xs"
              >
                ⌫
              </button>
            </div>

            <button
              onClick={() => {
                setPin('123456');
                setTimeout(() => {
                  setScanState('success');
                  setTimeout(() => onSuccess(), 600);
                }, 300);
              }}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-fill Demo PIN (123456)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
