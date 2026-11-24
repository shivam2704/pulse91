import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ShieldCheck, Calculator, ArrowRight, TrendingUp, TrendingDown, Percent, Info } from 'lucide-react';

export default function OrderExecutionModal({
  isOpen,
  onClose,
  stock,
  onConfirmOrder,
  availableCash
}) {
  if (!isOpen || !stock) return null;

  const ltp = stock.ltp || 1000;
  
  // Percentages and target levels from trade plan
  const slDefault = stock.trade_plan?.stop_loss_price || Number((ltp * 0.9722).toFixed(2));
  const targetDefault = stock.trade_plan?.target_1_price || Number((ltp * 1.0555).toFixed(2));

  const [product, setProduct] = useState('CNC'); // 'CNC' (Demat Delivery) or 'MIS' (Intraday)
  const [quantity, setQuantity] = useState(10); // Sensible, clear default quantity (10 shares)
  const [slPrice, setSlPrice] = useState(slDefault);
  const [targetPrice, setTargetPrice] = useState(targetDefault);
  const [gttEnabled, setGttEnabled] = useState(true);

  // Sync defaults when stock changes
  useEffect(() => {
    if (stock) {
      const defaultQty = ltp > 5000 ? 2 : (ltp > 2000 ? 5 : (ltp > 500 ? 15 : 50));
      setQuantity(defaultQty);
      setSlPrice(stock.trade_plan?.stop_loss_price || Number((ltp * 0.9722).toFixed(2)));
      setTargetPrice(stock.trade_plan?.target_1_price || Number((ltp * 1.0555).toFixed(2)));
    }
  }, [stock, ltp]);

  // Derived financial calculations with safety for typing / empty inputs
  const effectiveQty = quantity === '' ? 0 : (Number(quantity) || 0);
  const effectiveSl = slPrice === '' ? slDefault : (Number(slPrice) || slDefault);
  const effectiveTarget = targetPrice === '' ? targetDefault : (Number(targetPrice) || targetDefault);

  const totalInvestment = Math.round(ltp * effectiveQty);
  const slDiff = ltp - effectiveSl;
  const slPct = ((effectiveSl - ltp) / ltp) * 100;
  const maxLossINR = Math.round(slDiff * effectiveQty);

  const targetDiff = effectiveTarget - ltp;
  const targetPct = ((effectiveTarget - ltp) / ltp) * 100;
  const maxProfitINR = Math.round(targetDiff * effectiveQty);

  const hasSufficientFunds = (availableCash || 1000000) >= totalInvestment;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalQty = Math.max(1, parseInt(quantity, 10) || 1);
    const finalSl = Number(slPrice) || slDefault;
    const finalTarget = Number(targetPrice) || targetDefault;

    onConfirmOrder({
      symbol: stock.symbol,
      quantity: finalQty,
      side: 'BUY',
      product,
      price: ltp,
      sl_price: gttEnabled ? finalSl : null,
      target_price: gttEnabled ? finalTarget : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingCart className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Execute Demat Order</h3>
                <span className="text-[10px] font-mono bg-[#161f30] text-gray-300 border border-[#24314c] px-2 py-0.5 rounded">
                  {stock.symbol}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Current Market Price: <strong className="text-white font-bold">₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* 1. Product Type Selector */}
          <div>
            <label className="text-gray-400 font-semibold block mb-1.5">Product Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProduct('CNC')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-all text-left flex items-center justify-between ${
                  product === 'CNC'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-[#121724] border-[#1e2638] text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>CNC (Demat Delivery)</span>
                {product === 'CNC' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
              </button>
              <button
                type="button"
                onClick={() => setProduct('MIS')}
                className={`py-2 px-3 rounded-lg font-semibold border transition-all text-left flex items-center justify-between ${
                  product === 'MIS'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                    : 'bg-[#121724] border-[#1e2638] text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>MIS (Intraday Auto-Exit)</span>
                {product === 'MIS' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </button>
            </div>
          </div>

          {/* 2. Order Quantity Selector with Quick-Picks */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-gray-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                Order Quantity & Investment
              </span>
              <span className="text-white font-mono text-xs">
                Total Value: <strong className="text-emerald-400">₹{totalInvestment.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-gray-400 block text-[11px] mb-1">Number of Shares (Qty)</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseInt(val, 10);
                      setQuantity(isNaN(parsed) ? '' : parsed);
                    }
                  }}
                  onBlur={() => {
                    if (!quantity || Number(quantity) < 1) {
                      setQuantity(1);
                    }
                  }}
                  placeholder="10"
                  className="w-full bg-[#181f30] border border-[#27324a] rounded-lg px-3 py-2 font-mono text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Pick Presets */}
              <div className="flex items-end gap-1.5 pb-0.5">
                {[5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`px-2.5 py-1.5 rounded-md font-mono text-xs font-semibold border transition-all ${
                      Number(quantity) === preset
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : 'bg-[#161d2d] text-gray-400 border-[#222b40] hover:text-white hover:bg-[#1a2336]'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Exchange GTT Protection with Clear % and Rupee Profit/Loss */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Exchange GTT Triggers (Stop-Loss & Take-Profit)
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={gttEnabled}
                  onChange={(e) => setGttEnabled(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span>Active</span>
              </label>
            </div>

            {gttEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stop Loss Input with % and Max Loss INR */}
                <div className="bg-[#161c2b] border border-[#222c40] p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px] font-semibold">Stop-Loss Exit</span>
                    <span className="text-red-400 font-mono font-bold text-[11px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      {slPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={slPrice}
                      onChange={(e) => setSlPrice(e.target.value)}
                      onBlur={() => {
                        if (!slPrice || Number(slPrice) <= 0) {
                          setSlPrice(slDefault);
                        }
                      }}
                      className="w-full bg-[#111723] border border-[#253147] rounded px-2.5 py-1.5 font-mono text-red-400 font-bold text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#1e2638]">
                    <span>Max Defined Risk:</span>
                    <strong className="text-red-400 font-mono">-₹{Math.abs(maxLossINR).toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Take-Profit Target Input with % and Expected Profit INR */}
                <div className="bg-[#161c2b] border border-[#222c40] p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px] font-semibold">Take-Profit (Target 1)</span>
                    <span className="text-emerald-400 font-mono font-bold text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      +{targetPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      onBlur={() => {
                        if (!targetPrice || Number(targetPrice) <= 0) {
                          setTargetPrice(targetDefault);
                        }
                      }}
                      className="w-full bg-[#111723] border border-[#253147] rounded px-2.5 py-1.5 font-mono text-emerald-400 font-bold text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#1e2638]">
                    <span>Expected Profit:</span>
                    <strong className="text-emerald-400 font-mono">+₹{Math.abs(maxProfitINR).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Order Execution Summary & Confirmation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1b2336] text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total Investment:</span>
                <span className="font-mono font-bold text-white text-base">
                  ₹{totalInvestment.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">({quantity} Shares)</span>
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono block mt-0.5">
                📱 Automated WhatsApp execution receipt dispatched on fill
              </span>
            </div>

            <button
              type="submit"
              disabled={!hasSufficientFunds}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg disabled:opacity-50"
            >
              Confirm 1-Click Buy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
