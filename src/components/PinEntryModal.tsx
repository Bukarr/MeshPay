import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PinEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userPin: string;
  title?: string;
  amountDisplay?: string;
  recipientDisplay?: string;
}

export const PinEntryModal: React.FC<PinEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userPin,
  title = 'Verify Transaction PIN',
  amountDisplay,
  recipientDisplay
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (isSuccess) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        if (newPin === userPin) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
            setPin('');
            setIsSuccess(false);
          }, 600);
        } else {
          setError('Invalid 4-digit security PIN. Access denied.');
          // Shake effect and clear
          setTimeout(() => setPin(''), 800);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div id="pin-entry-modal" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white transform transition-all scale-100 opacity-100"
      >
        {/* Header */}
        <div className="px-5 py-4.5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{title}</h3>
              <p className="text-[10px] text-slate-400">Strict numeric authorization required</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Banner */}
        {(amountDisplay || recipientDisplay) && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-1">
            {amountDisplay && <div className="text-xl font-black text-indigo-400">{amountDisplay}</div>}
            {recipientDisplay && (
              <div className="text-[11px] text-slate-400 font-medium">
                Recipient: <span className="text-slate-200 font-extrabold">{recipientDisplay}</span>
              </div>
            )}
          </div>
        )}

        {/* Indicators */}
        <div className="py-6 px-5 text-center">
          <div className="flex justify-center items-center gap-5 mb-3.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isSuccess 
                    ? 'bg-emerald-400 border-emerald-400 scale-110 shadow-md shadow-emerald-400/30'
                    : idx < pin.length 
                      ? 'bg-indigo-400 border-indigo-400 scale-110 shadow-md shadow-indigo-400/30' 
                      : 'border-slate-700 bg-slate-950'
                }`}
              />
            ))}
          </div>

          {isSuccess ? (
            <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              PIN Verified Successfully
            </p>
          ) : error ? (
            <p className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4" />
              {error}
            </p>
          ) : (
            <p className="text-xs text-slate-400 font-semibold">
              Enter your 4-digit security PIN to unlock
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="p-5 pt-0 bg-slate-950 border-t border-slate-800/50">
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto py-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeyPress(digit)}
                className="h-12.5 rounded-2xl bg-slate-900 border border-slate-800/60 hover:bg-slate-800 font-black text-lg text-slate-100 transition-all active:scale-95 flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            
            {/* Backspace */}
            <button
              onClick={handleBackspace}
              className="h-12.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800 font-bold text-slate-400 transition-all active:scale-95 flex items-center justify-center"
            >
              <Delete className="w-5 h-5 text-rose-400" />
            </button>

            {/* Zero */}
            <button
              onClick={() => handleKeyPress('0')}
              className="h-12.5 rounded-2xl bg-slate-900 border border-slate-800/60 hover:bg-slate-800 font-black text-lg text-slate-100 transition-all active:scale-95 flex items-center justify-center"
            >
              0
            </button>

            {/* Clear */}
            <button
              onClick={() => setPin('')}
              className="h-12.5 rounded-2xl bg-slate-900/50 hover:bg-slate-800 font-bold text-xs text-slate-400 hover:text-white transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider font-extrabold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
