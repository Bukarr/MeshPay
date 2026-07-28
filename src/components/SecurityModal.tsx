import React, { useState } from 'react';
import { Lock, Fingerprint, X, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  amountDisplay?: string;
  recipientDisplay?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Security Authorization',
  amountDisplay,
  recipientDisplay
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        if (newPin === '1234') {
          setTimeout(() => {
            onSuccess();
            setPin('');
          }, 200);
        } else {
          setError('Invalid PIN code. Try 1234 for demo.');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = () => {
    setIsBiometricScanning(true);
    setError('');
    setTimeout(() => {
      setIsBiometricScanning(false);
      onSuccess();
      setPin('');
    }, 1200);
  };

  const handleQuickAutofill = () => {
    setPin('1234');
    setError('');
    setTimeout(() => {
      onSuccess();
      setPin('');
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-[11px] text-slate-400">Enter 4-digit PIN or Face ID</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary preview */}
        {(amountDisplay || recipientDisplay) && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
            {amountDisplay && <div className="text-xl font-bold text-emerald-400">{amountDisplay}</div>}
            {recipientDisplay && <div className="text-xs text-slate-400 mt-0.5">To: <span className="text-slate-200 font-medium">{recipientDisplay}</span></div>}
          </div>
        )}

        {/* PIN Indicators */}
        <div className="py-6 px-5 text-center">
          <div className="flex justify-center items-center gap-4 mb-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  idx < pin.length 
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-sm shadow-emerald-400/50' 
                    : 'border-slate-700 bg-slate-950'
                }`}
              />
            ))}
          </div>

          {error ? (
            <p className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              {error}
            </p>
          ) : (
            <button 
              onClick={handleQuickAutofill}
              className="text-[11px] text-emerald-400/80 hover:text-emerald-300 flex items-center justify-center gap-1 mx-auto underline"
            >
              <Sparkles className="w-3 h-3" />
              Quick Autofill (Demo: 1234)
            </button>
          )}
        </div>

        {/* Biometric Scan Animation overlay if active */}
        {isBiometricScanning ? (
          <div className="py-8 text-center bg-slate-950 border-t border-slate-800">
            <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Fingerprint className="w-12 h-12 text-emerald-400 animate-pulse" />
              <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping opacity-25" />
            </div>
            <p className="text-xs text-emerald-300 font-medium">Verifying Biometrics...</p>
          </div>
        ) : (
          /* Keypad */
          <div className="p-5 pt-0 bg-slate-950 border-t border-slate-800/80">
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto py-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 font-semibold text-lg text-slate-100 transition-colors flex items-center justify-center active:scale-95"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleBiometric}
                className="h-12 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 text-emerald-400 flex items-center justify-center transition-colors"
                title="Use Face ID / Touch ID"
              >
                <Fingerprint className="w-6 h-6" />
              </button>

              <button
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-xl bg-slate-900 border border-slate-800/80 hover:bg-slate-800 font-semibold text-lg text-slate-100 transition-colors flex items-center justify-center active:scale-95"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="h-12 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ⌫
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
