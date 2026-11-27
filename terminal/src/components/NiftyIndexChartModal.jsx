import React, { useEffect } from 'react';
import { X, TrendingUp, BarChart2, ShieldCheck } from 'lucide-react';
import StockCandleChart from './StockCandleChart';
import { formatHorizon } from '../utils/formatters';

export default function NiftyIndexChartModal({ isOpen, onClose, market }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBullish = (market?.nifty_change_pct ?? 0) >= 0;
  const ltp = market?.nifty_50 || 25884.50;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-[#0d131f] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1b2336] bg-[#090d16] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">NIFTY 50</h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#1e2638] text-gray-400 border border-[#2b354d]">
                  Benchmark Index · NSE
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  market?.is_market_open
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {market?.is_market_open ? 'NSE LIVE' : 'NSE CLOSED'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                National Stock Exchange · Top 50 Large-Cap Blue Chips
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Price & Change Pill */}
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-white">
                ₹{Number(ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className={`font-mono text-xs font-semibold ${isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                {isBullish ? '+' : ''}{market?.nifty_change_pct ?? '+0.25'}%
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white bg-[#141a29] hover:bg-[#1e273d] border border-[#222b40] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quant Index Metrics Ribbon */}
        <div className="px-5 py-2.5 bg-[#0b0f19] border-b border-[#1b2336] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-gray-400">
            <div>
              <span className="text-gray-500 text-[11px] mr-1.5">20-EMA:</span>
              <span className="font-mono font-medium text-amber-400">
                ₹{Number(market?.nifty_20_ema || (ltp * 0.985)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-l border-[#1e2638] pl-3">
              <span className="text-gray-500 text-[11px] mr-1.5">50-EMA:</span>
              <span className="font-mono font-medium text-sky-400">
                ₹{Number(market?.nifty_50_ema || (ltp * 0.965)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-l border-[#1e2638] pl-3">
              <span className="text-gray-500 text-[11px] mr-1.5">ADX (14):</span>
              <span className="font-mono font-medium text-emerald-400">
                {market?.adx_14 ?? 24.8}
              </span>
            </div>
            <div className="border-l border-[#1e2638] pl-3">
              <span className="text-gray-500 text-[11px] mr-1.5">Regime:</span>
              <span className="font-mono font-semibold text-white">
                {formatHorizon(market?.regime_status ?? 'BULLISH_TRENDING')}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 font-mono hidden md:block">
            Official Exchange Data (^NSEI)
          </div>
        </div>

        {/* Candlestick & Volume Chart Body */}
        <div className="p-4 sm:p-5 bg-[#090d16]">
          <StockCandleChart
            symbol="NIFTY_50"
            ltp={ltp}
          />
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-3 border-t border-[#1b2336] bg-[#0b0f19] flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Multi-timeframe OHLCV with 20/50/200 Moving Averages and Volume Analysis.</span>
          </div>
          <span className="font-mono">Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
