import React, { useState, useEffect } from 'react';
import { TrendingUp, Lock, RefreshCcw, ShieldCheck, Clock, ArrowUpRight } from 'lucide-react';
import { ExchangeRate } from '../types';
import { FX_RATE_HISTORY } from '../data/mockData';

interface FxRateChartProps {
  rate: ExchangeRate;
}

export const FxRateChart: React.FC<FxRateChartProps> = ({ rate }) => {
  const [secondsLeft, setSecondsLeft] = useState(899); // 15 mins rate lock

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const maxRate = Math.max(...FX_RATE_HISTORY.map(p => p.rate));
  const minRate = Math.min(...FX_RATE_HISTORY.map(p => p.rate));
  const range = maxRate - minRate || 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl space-y-3">
      {/* Rate Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Live MeshPay FX Rate</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-3 h-3" /> +{rate.change24h}%
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-0.5 flex items-baseline gap-2">
            <span>$1 = ₦{rate.usdToNgn.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-400 font-normal">NGN</span>
          </div>
        </div>

        {/* Lock Rate Countdown Pill */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-right">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Rate Lock</span>
          </div>
          <div className="font-mono text-xs font-bold text-amber-400 mt-0.5">
            {formattedTimer}
          </div>
        </div>
      </div>

      {/* SVG Sparkline FX Chart */}
      <div className="pt-2 pb-1 relative">
        <div className="h-16 w-full flex items-end gap-1">
          {FX_RATE_HISTORY.map((point, index) => {
            const heightPct = Math.max(15, Math.min(100, ((point.rate - minRate) / range) * 100));
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full bg-slate-800/80 rounded-t-sm relative h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm transition-all duration-500 group-hover:from-emerald-400 group-hover:to-cyan-300"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 font-mono">{point.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official vs Parallel comparison */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">CBN Official Rate</span>
          <span className="text-xs font-bold text-slate-300">₦{rate.officialRate.toLocaleString()}/$</span>
        </div>
        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">MeshPay P2P Vault Rate</span>
          <span className="text-xs font-bold text-emerald-400">₦{rate.parallelRate.toLocaleString()}/$</span>
        </div>
      </div>
    </div>
  );
};
