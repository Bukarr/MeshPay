import React from 'react';
import Lottie from 'lottie-react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

interface SuccessCelebrationProps {
  title?: string;
  message?: string;
  amountDisplay?: string;
  recipientName?: string;
  txId?: string;
  onDone?: () => void;
}

// Lottie JSON animation data for a celebratory success tick with particle rings
const successLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Success Check",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { 
          a: 1, 
          k: [
            { t: 0, s: [0, 0, 100], e: [110, 110, 100] },
            { t: 25, s: [110, 110, 100], e: [100, 100, 100] }
          ] 
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [140, 140] },
              p: { a: 0, k: [0, 0] }
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.062, 0.725, 0.505, 1] }, // Emerald-500
              o: { a: 0, k: 100 }
            }
          ]
        },
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-30, 2], [-8, 24], [34, -20]],
                  c: false
                }
              }
            },
            {
              ty: "st",
              c: { a: 0, k: [1, 1, 1, 1] },
              w: { a: 0, k: 12 },
              lc: 2,
              lj: 2
            }
          ]
        }
      ]
    }
  ]
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  title = "P2P Payment Confirmed!",
  message = "Transaction signed & queued with offline cryptographic proof.",
  amountDisplay,
  recipientName,
  txId,
  onDone
}) => {
  React.useEffect(() => {
    // Fire celebratory confetti cannons
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899']
      });

      const timeout = setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#10b981', '#34d399', '#6EE7B7']
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#34d399', '#6EE7B7']
        });
      }, 250);

      return () => clearTimeout(timeout);
    } catch (err) {
      console.warn("Confetti effect unavailable:", err);
    }
  }, []);

  return (
    <div className="py-6 px-4 text-center space-y-4 animate-fadeIn">
      {/* Lottie Animation Container */}
      <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
        <Lottie 
          animationData={successLottieData}
          loop={false}
          className="w-32 h-32 relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
        />
        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Cryptographic Proof</span>
        </div>

        <h3 className="font-black text-lg text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">{message}</p>
      </div>

      {(amountDisplay || recipientName) && (
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 text-left space-y-1.5">
          {amountDisplay && (
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-slate-400 font-bold">Amount Transferred:</span>
              <span className="text-base font-black text-emerald-400 font-mono">{amountDisplay}</span>
            </div>
          )}
          {recipientName && (
            <div className="flex justify-between items-baseline">
              <span className="text-[11px] text-slate-400 font-bold">Beneficiary:</span>
              <span className="text-xs font-bold text-white">{recipientName}</span>
            </div>
          )}
          {txId && (
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-500">Transaction Ref:</span>
              <span className="text-[10px] text-slate-400 font-mono font-bold truncate max-w-[140px]">{txId}</span>
            </div>
          )}
        </div>
      )}

      {onDone && (
        <button
          onClick={onDone}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          Done & Return to App
        </button>
      )}
    </div>
  );
};
