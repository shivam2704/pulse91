import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ShieldCheck, Calculator, ArrowRight, TrendingUp, TrendingDown, Percent, Info, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';

export default function OrderExecutionModal({
  isOpen,
  onClose,
  stock,
  onConfirmOrder,
  availableCash,
  onViewDemat
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Sync defaults when stock changes
  useEffect(() => {
    if (stock) {
      const defaultQty = ltp > 5000 ? 2 : (ltp > 2000 ? 5 : (ltp > 500 ? 15 : 50));
      setQuantity(defaultQty);
      setSlPrice(stock.trade_plan?.stop_loss_price || Number((ltp * 0.9722).toFixed(2)));
      setTargetPrice(stock.trade_plan?.target_1_price || Number((ltp * 1.0555).toFixed(2)));
      setReceipt(null);
      setSubmitError(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalQty = Math.max(1, parseInt(quantity, 10) || 1);
    const finalSl = Number(slPrice) || slDefault;
    const finalTarget = Number(targetPrice) || targetDefault;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const orderPayload = {
        symbol: stock.symbol,
        quantity: finalQty,
        side: 'BUY',
        product,
        price: ltp,
        sl_price: gttEnabled ? finalSl : null,
        target_price: gttEnabled ? finalTarget : null
      };
      const result = await onConfirmOrder(orderPayload);
      if (result && result.success !== false) {
        setReceipt({
          symbol: stock.symbol,
          quantity: finalQty,
          price: ltp,
          totalInvestment,
          slPrice: gttEnabled ? finalSl : null,
          targetPrice: gttEnabled ? finalTarget : null,
          product,
          broker: result.broker || 'SANDBOX DEMAT',
          orderId: result.order_id || `ORD-${Date.now().toString().slice(-6)}`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      } else {
        setSubmitError(result?.detail || 'Failed to place order.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Error executing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-lg border ${
              receipt
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {receipt ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShoppingCart className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {receipt ? 'Order Executed & Filled! 🚀' : 'Execute Demat Order'}
                </h3>
                <span className="text-[10px] font-mono bg-[#161f30] text-gray-300 border border-[#24314c] px-2 py-0.5 rounded">
                  {stock.symbol}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {receipt
                  ? `Executed in Demat Portfolio • Ref: ${receipt.orderId}`
                  : <>Current Market Price: <strong className="text-white font-bold">₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></>
                }
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

        {/* RECEIPT VIEW */}
        {receipt ? (
          <div className="mt-4 space-y-4 text-xs">
            {/* Status card */}
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  STATUS: 100% FILLED (SANDBOX DEMAT)
                </span>
                <span className="font-mono text-[11px] text-gray-400">{receipt.timestamp}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-900/30 font-mono text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Filled Quantity</span>
                  <strong className="text-white font-bold text-sm">{receipt.quantity} Shares</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Execution Price</span>
                  <strong className="text-emerald-300 font-bold text-sm">₹{receipt.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Total Capital Allocated</span>
                  <strong className="text-white font-bold">₹{receipt.totalInvestment.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Product Mode</span>
                  <strong className="text-blue-400 font-bold">{receipt.product} (Demat Delivery)</strong>
                </div>
              </div>
            </div>

            {/* AutoTrader & GTT Target Details */}
            {receipt.targetPrice && (
              <div className="p-3 bg-[#131b2c] border border-[#202b40] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Auto-Trader Daemon Active
                  </span>
                  <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Active Monitoring
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-[#0c101a] rounded border border-emerald-500/20">
                    <span className="text-gray-400 text-[10px] block">Target 1 (+5.55%)</span>
                    <strong className="text-emerald-400">₹{receipt.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="p-2 bg-[#0c101a] rounded border border-rose-500/20">
                    <span className="text-gray-400 text-[10px] block">Stop-Loss (-2.78%)</span>
                    <strong className="text-rose-400">₹{receipt.slPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  💡 The background Auto-Trader cycle will autonomously square off this position once Target 1 or Stop-Loss is touched.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              {onViewDemat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewDemat();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View in Demat Portfolio
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#1b2336] hover:bg-[#253147] text-gray-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            {submitError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-mono">
                ⚠️ {submitError}
              </div>
            )}

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
                  <div>
                    <span className="block font-bold">CNC</span>
                    <span className="text-[10px] opacity-75">Delivery (Hold in Demat)</span>
                  </div>
                  {product === 'CNC' && <div className="w-2 h-2 rounded-full bg-emerald-400"></div>}
                </button>
                <button
                  type="button"
                  onClick={() => setProduct('MIS')}
                  className={`py-2 px-3 rounded-lg font-semibold border transition-all text-left flex items-center justify-between ${
                    product === 'MIS'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-[#121724] border-[#1e2638] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div>
                    <span className="block font-bold">MIS</span>
                    <span className="text-[10px] opacity-75">Intraday (Square off 15:15)</span>
                  </div>
                  {product === 'MIS' && <div className="w-2 h-2 rounded-full bg-emerald-400"></div>}
                </button>
              </div>
            </div>

            {/* 2. Quantity & Capital Calculator */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 font-semibold block mb-1.5">Quantity (Shares)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onBlur={() => {
                    if (!quantity || Number(quantity) <= 0) {
                      setQuantity(10);
                    }
                  }}
                  className="w-full bg-[#121724] border border-[#1e2638] rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="text-gray-400 font-semibold block mb-1.5">Required Margin / Cash</label>
                <div className="w-full bg-[#121724] border border-[#1e2638] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm flex items-center justify-between">
                  <span>₹{totalInvestment.toLocaleString('en-IN')}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    hasSufficientFunds ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {hasSufficientFunds ? 'Sufficient' : 'Insufficient'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Quantity Presets */}
            <div className="flex items-center gap-1.5 -mt-2">
              <span className="text-[10px] text-gray-500 font-semibold uppercase">Presets:</span>
              {[5, 10, 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    quantity === preset
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-[#10141f] text-gray-400 border-[#1a2334] hover:text-white hover:bg-[#161d2d]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* 3. Institutional Trade Plan & GTT Stop-Loss / Target */}
            <div className="border border-[#1b2336] rounded-xl p-3 bg-[#0d121c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-gray-200">Institutional Risk Protection (GTT OCO)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGttEnabled(!gttEnabled)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                    gttEnabled
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {gttEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {gttEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Stop-Loss Input Card */}
                  <div className="bg-[#090d15] p-2.5 rounded-lg border border-rose-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-rose-400" /> Stop-Loss
                      </span>
                      <span className="text-rose-400 font-mono font-bold text-[11px] bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
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
                        className="w-full bg-[#111723] border border-[#253147] rounded px-2.5 py-1.5 font-mono text-rose-400 font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-[#1e2638]">
                      <span>Risk Amount:</span>
                      <strong className="text-rose-400 font-mono">-₹{Math.abs(maxLossINR).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Target 1 Input Card */}
                  <div className="bg-[#090d15] p-2.5 rounded-lg border border-emerald-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-[11px] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" /> Target 1
                      </span>
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
                disabled={!hasSufficientFunds || isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  'Confirm 1-Click Buy'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
