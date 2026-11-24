import React, { useState } from 'react';
import { X, ShoppingCart, ShieldCheck, Calculator, ArrowRight } from 'lucide-react';

export default function OrderExecutionModal({
  isOpen,
  onClose,
  stock,
  onConfirmOrder,
  availableCash
}) {
  if (!isOpen || !stock) return null;

  const ltp = stock.ltp || 1000;
  const slDefault = stock.trade_plan?.stop_loss_price || Math.round(ltp * 0.97);
  const targetDefault = stock.trade_plan?.target_1_price || Math.round(ltp * 1.05);

  const [product, setProduct] = useState('CNC'); // 'CNC' (Delivery) or 'MIS' (Intraday)
  const [riskBudget, setRiskBudget] = useState(2500); // Risk per trade in INR
  const [slPrice, setSlPrice] = useState(slDefault);
  const [targetPrice, setTargetPrice] = useState(targetDefault);
  const [gttEnabled, setGttEnabled] = useState(true);

  // Auto Position Sizing calculation
  const riskPerShare = Math.max(1.0, ltp - slPrice);
  const calculatedQty = Math.max(1, Math.floor(riskBudget / riskPerShare));
  const [customQty, setCustomQty] = useState(calculatedQty);

  const finalQty = customQty;
  const totalCapitalRequired = Math.round(ltp * finalQty);
  const hasSufficientFunds = (availableCash || 785400) >= totalCapitalRequired;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmOrder({
      symbol: stock.symbol,
      quantity: finalQty,
      side: 'BUY',
      product,
      price: ltp,
      sl_price: gttEnabled ? slPrice : null,
      target_price: gttEnabled ? targetPrice : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingCart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Execute Demat Order</h3>
              <p className="text-xs text-gray-400 font-mono">
                {stock.symbol} @ ₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Product Type Selector */}
          <div>
            <label className="text-gray-400 font-semibold block mb-1.5">Product Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProduct('CNC')}
                className={`py-2 rounded-lg font-semibold border transition-all ${
                  product === 'CNC'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-[#121724] border-[#1e2638] text-gray-400'
                }`}
              >
                CNC (Demat Delivery)
              </button>
              <button
                type="button"
                onClick={() => setProduct('MIS')}
                className={`py-2 rounded-lg font-semibold border transition-all ${
                  product === 'MIS'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-300'
                    : 'bg-[#121724] border-[#1e2638] text-gray-400'
                }`}
              >
                MIS (Intraday 3:12 PM Auto-Exit)
              </button>
            </div>
          </div>

          {/* Auto Position Sizing Calculator */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-gray-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                Auto Position Sizer (Risk Management)
              </span>
              <span className="text-emerald-400 font-mono">₹{riskBudget} Risk</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block text-[11px] mb-1">Max Risk per Trade (₹)</label>
                <input
                  type="number"
                  value={riskBudget}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 500;
                    setRiskBudget(val);
                    setCustomQty(Math.max(1, Math.floor(val / riskPerShare)));
                  }}
                  className="w-full bg-[#181f30] border border-[#27324a] rounded-lg px-2.5 py-1.5 font-mono text-white text-xs"
                />
              </div>

              <div>
                <label className="text-gray-400 block text-[11px] mb-1">Calculated Quantity</label>
                <input
                  type="number"
                  value={customQty}
                  onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#181f30] border border-[#27324a] rounded-lg px-2.5 py-1.5 font-mono text-emerald-400 font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* GTT Orders */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Exchange GTT Protection (Hardware Fault Safe)
              </span>
              <input
                type="checkbox"
                checked={gttEnabled}
                onChange={(e) => setGttEnabled(e.target.checked)}
                className="rounded accent-emerald-500"
              />
            </div>

            {gttEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block text-[11px] mb-1">Stop-Loss Trigger (₹)</label>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(parseFloat(e.target.value))}
                    className="w-full bg-[#181f30] border border-[#27324a] rounded-lg px-2.5 py-1.5 font-mono text-red-400 text-xs"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block text-[11px] mb-1">Take-Profit Target (₹)</label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                    className="w-full bg-[#181f30] border border-[#27324a] rounded-lg px-2.5 py-1.5 font-mono text-emerald-400 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1b2336] text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Total Required Margin</span>
              <span className="font-mono font-bold text-white text-sm">
                ₹{totalCapitalRequired.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="submit"
              disabled={!hasSufficientFunds}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg disabled:opacity-50"
            >
              Confirm 1-Click Buy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
