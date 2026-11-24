import React, { useState } from 'react';
import { Zap, Play, Pause, RefreshCw, ShieldAlert, Target, ShoppingBag, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, PhoneCall } from 'lucide-react';

export default function PortfolioPositionsPanel({
  demat,
  autotrader,
  onToggleAutotrader,
  onRunCycle,
  onExitPosition,
  onSelectStock,
  isRefreshing
}) {
  const [exitingSymbol, setExitingSymbol] = useState(null);

  const holdings = demat?.holdings || [];
  const positions = demat?.positions || [];
  const managed = autotrader?.managed_positions || [];
  const logs = autotrader?.recent_logs || [];
  const isActive = autotrader?.is_active ?? false;

  const handleExit = async (symbol) => {
    if (!window.confirm(`Are you sure you want to SELL / Exit ${symbol} at current market price?`)) return;
    setExitingSymbol(symbol);
    try {
      await onExitPosition(symbol);
    } finally {
      setExitingSymbol(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Autonomous Quant Execution Controller */}
      <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1b2336]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isActive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Autonomous Quant Auto-Trader Daemon
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}>
                  {isActive ? '● ACTIVE & SCANNING' : '○ PAUSED'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Monitors Monday Top 15 setups. Automatically enters at VCP breakout pivots, books profit at Target (+5.55%), cuts loss at Stop (-2.78%), and dispatches WhatsApp alerts on execution.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRunCycle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151c2b] hover:bg-[#1e273d] text-gray-300 border border-[#243048] text-xs font-semibold transition-all"
              title="Run 1 instant evaluation cycle across all positions & setups"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evaluate Cycle</span>
            </button>

            <button
              onClick={onToggleAutotrader}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
                isActive
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'Pause Auto-Trader' : 'Activate Auto-Trader'}</span>
            </button>
          </div>
        </div>

        {/* Quant Execution Strategy Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <Target className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Auto-Sell Target</span>
              <strong className="text-emerald-400 font-mono text-sm">+5.55% (Target 1 Hit)</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Auto-Cut Loss</span>
              <strong className="text-red-400 font-mono text-sm">-2.78% (Capital Defense)</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Max Allocation / Position</span>
              <strong className="text-white font-mono text-sm">₹50,000 (Max 5 Setups)</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">WhatsApp Alert Target</span>
              <strong className="text-emerald-400 font-mono text-xs">{autotrader?.notification_phone || '+91 98765 43210'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Demat Holdings & Open Positions (With Explicit SELL Buttons) */}
      <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2336] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>Active Portfolio & Open Positions</span>
              <span className="text-[11px] font-mono bg-[#161d2d] text-emerald-400 border border-[#222b40] px-2 py-0.5 rounded-full">
                {holdings.length + positions.length} Open Deals
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live Demat tracking. Click <strong>Sell / Exit</strong> on any holding to execute square-off and dispatch WhatsApp notification.
            </p>
          </div>

          <div className="font-mono text-right">
            <div className="text-[10px] text-gray-400 uppercase">Unrealized PnL</div>
            <div className={`text-base font-bold ${
              (demat?.total_unrealized_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              ₹{(demat?.total_unrealized_pnl ?? 0) >= 0 ? '+' : ''}
              {(demat?.total_unrealized_pnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {holdings.length === 0 && positions.length === 0 ? (
          <div className="py-8 text-center text-gray-500 font-mono text-xs">
            No open positions or holdings in Demat. Use 1-Click Buy or activate Auto-Trader.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1b2336] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Ticker</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Buy Price</th>
                  <th className="py-3 px-3 text-right">Current LTP</th>
                  <th className="py-3 px-3 text-right">Current Value</th>
                  <th className="py-3 px-3 text-right">Unrealized PnL</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161d2d]">
                {/* 1. Open Intraday / Swing Positions */}
                {positions.map((pos) => {
                  const ltp = pos.current_price || pos.entry_price;
                  const pnl = (ltp - pos.entry_price) * pos.quantity;
                  const pnlPct = ((ltp - pos.entry_price) / pos.entry_price) * 100;
                  const isPositive = pnl >= 0;

                  return (
                    <tr
                      key={pos.position_id || pos.symbol}
                      className="hover:bg-[#131926] transition-colors cursor-pointer"
                      onClick={() => onSelectStock(pos.symbol)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                        {pos.symbol}
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                          MIS (Swing)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">{pos.quantity}</td>
                      <td className="py-3 px-3 font-mono text-right text-gray-300">
                        ₹{pos.entry_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-white">
                        ₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">
                        ₹{(pos.quantity * ltp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPositive ? '+' : ''}₹{pnl.toFixed(2)} ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleExit(pos.symbol)}
                          disabled={exitingSymbol === pos.symbol}
                          className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {exitingSymbol === pos.symbol ? 'Selling...' : 'Sell / Exit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* 2. Demat Delivery Holdings */}
                {holdings.map((h) => {
                  const ltp = h.current_price || h.avg_buy_price;
                  const pnl = h.pnl ?? ((ltp - h.avg_buy_price) * h.quantity);
                  const pnlPct = h.pnl_pct ?? (((ltp - h.avg_buy_price) / h.avg_buy_price) * 100);
                  const isPositive = pnl >= 0;

                  return (
                    <tr
                      key={h.symbol}
                      className="hover:bg-[#131926] transition-colors cursor-pointer"
                      onClick={() => onSelectStock(h.symbol)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                        {h.symbol}
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          CNC (Demat)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">{h.quantity}</td>
                      <td className="py-3 px-3 font-mono text-right text-gray-300">
                        ₹{h.avg_buy_price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-white">
                        ₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">
                        ₹{(h.current_value || (h.quantity * ltp)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isPositive ? '+' : ''}₹{pnl.toFixed(2)} ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleExit(h.symbol)}
                          disabled={exitingSymbol === h.symbol}
                          className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {exitingSymbol === h.symbol ? 'Selling...' : 'Sell / Exit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Real-Time Deal Execution & WhatsApp Notification Logs */}
      <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1b2336] mb-3">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Executed Deals & WhatsApp Notification Feed</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Executions
            </span>
          </h3>
          <span className="text-xs text-gray-500 font-mono">
            Every deal triggers an automated WhatsApp receipt
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="py-4 text-center text-gray-500 font-mono text-xs">
            No trade execution events yet.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const isBuy = log.action === 'BUY';
              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#111622] border border-[#1b2336] gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-mono font-bold text-white">{log.symbol}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300 font-mono">
                      {log.quantity} Qty @ ₹{log.price?.toFixed(2)}
                    </span>
                    <span className="text-gray-400 hidden md:inline">• {log.reason}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400 justify-end">
                    <span>{log.timestamp}</span>
                    {log.whatsapp_notified && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Alert Sent</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
