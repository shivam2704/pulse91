import React, { useState } from 'react';
import { Zap, Play, Pause, RefreshCw, ShieldAlert, Target, ShoppingBag, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, PhoneCall, ShieldCheck, X, LogOut, Loader2 } from 'lucide-react';

export default function PortfolioPositionsPanel({
  demat,
  searchQuery,
  autotrader,
  whatsAppPhone,
  onOpenWhatsAppModal,
  onToggleAutotrader,
  onRunCycle,
  onExitPosition,
  onSelectStock,
  isRefreshing
}) {
  const [exitTarget, setExitTarget] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  const filterByQuery = (item) => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const sym = (item.trading_symbol || item.symbol || '').toLowerCase();
    const name = (item.company_name || '').toLowerCase();
    return sym.includes(q) || name.includes(q);
  };

  const holdings = (demat?.holdings || []).filter(filterByQuery);
  const positions = (demat?.positions || []).filter(filterByQuery);
  const managed = autotrader?.managed_positions || [];
  const logs = autotrader?.recent_logs || [];
  const isActive = autotrader?.is_active ?? false;

  const handleConfirmExit = async () => {
    if (!exitTarget) return;
    setIsExiting(true);
    try {
      await onExitPosition(exitTarget.symbol);
      setExitTarget(null);
    } finally {
      setIsExiting(false);
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
                Monitors high-confluence setups. Automatically enters at VCP breakout pivots, books profit at dynamic ATR Target 1, cuts loss at trailing Stop-Loss, and dispatches WhatsApp alerts.
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
              <strong className="text-emerald-400 font-mono text-sm">Dynamic ATR (1:2 R:R)</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Auto-Cut Loss</span>
              <strong className="text-red-400 font-mono text-sm">Dynamic ATR Defense</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-gray-400 font-semibold block uppercase">Max Allocation / Position</span>
              <strong className="text-white font-mono text-sm">₹{Number(autotrader?.max_capital_per_trade || 3000).toLocaleString('en-IN')} (Max {autotrader?.max_open_positions || 3} Setups)</strong>
            </div>
          </div>

          <div className="bg-[#121724] border border-[#1b2336] p-3 rounded-lg flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <PhoneCall className={`w-4 h-4 shrink-0 ${whatsAppPhone ? 'text-emerald-400' : 'text-gray-500'}`} />
              <div>
                <span className="text-[10px] text-gray-400 font-semibold block uppercase">WhatsApp Alert Target</span>
                {whatsAppPhone ? (
                  <strong className="text-emerald-400 font-mono text-xs">{whatsAppPhone}</strong>
                ) : (
                  <span className="text-amber-400 font-mono text-xs">Not Linked</span>
                )}
              </div>
            </div>
            {!whatsAppPhone && onOpenWhatsAppModal && (
              <button
                onClick={onOpenWhatsAppModal}
                className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold transition-all shrink-0"
              >
                Link Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1.5 Auto-Trader Live Surveillance Roster */}
      <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1b2336] gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Auto-Trader Active Surveillance Roster</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {managed.length} Positions Under Live Surveillance
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live tick monitoring. Daemon automatically sells at Target 1 or executes ATR Stop-Loss defense.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
              isActive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isActive ? 'Live Monitoring Active' : 'Auto-Execution Paused'}
            </span>
          </div>
        </div>

        {managed.length === 0 ? (
          <div className="py-6 text-center text-gray-500 font-mono text-xs bg-[#090d16] rounded-lg border border-[#151c2d]">
            No stocks currently under Auto-Trader surveillance. Click "Activate Auto-Trader" above to auto-sync your Demat holdings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {managed.map((m) => {
              const ltp = m.current_ltp || m.entry_price;
              const pnl = m.unrealized_pnl ?? ((ltp - m.entry_price) * m.quantity);
              const pnlPct = m.unrealized_pnl_pct ?? (((ltp - m.entry_price) / (m.entry_price || 1)) * 100);
              const isProfit = pnl >= 0;

              return (
                <div
                  key={m.symbol}
                  onClick={() => onSelectStock && onSelectStock(m.symbol)}
                  className="bg-[#101522] border border-[#1e273c] hover:border-emerald-500/40 rounded-xl p-3.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#182133]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {m.symbol}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-[#161d2d] px-1.5 py-0.5 rounded">
                        {m.quantity} Qty
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      m.health === 'NEAR_TARGET'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                        : m.health === 'NEAR_STOP_LOSS'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-[#151e2f] text-gray-300 border border-[#223048]'
                    }`}>
                      {m.health === 'NEAR_TARGET' ? '🎯 Near Target' : (m.health === 'NEAR_STOP_LOSS' ? '⚠️ Near SL' : '● Safe & Active')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Entry / LTP</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-gray-400">₹{m.entry_price?.toFixed(2)}</span>
                        <span className="text-gray-600">→</span>
                        <strong className="text-white font-bold">₹{ltp?.toFixed(2)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">PnL</span>
                      <strong className={`font-bold block mt-0.5 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl > 0 ? '+' : ''}₹{pnl.toFixed(2)} ({pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-[#182133] font-mono text-[11px]">
                    <div className="p-1.5 bg-[#0a0e17] rounded border border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[9px] uppercase">Target 1</span>
                        <span className="text-emerald-400 text-[10px] font-bold">₹{m.target_1?.toFixed(2)}</span>
                      </div>
                      <span className="text-[9px] text-emerald-400/80 block mt-0.5">
                        {m.dist_to_target_pct > 0 ? `${m.dist_to_target_pct}% away` : 'Reached!'}
                      </span>
                    </div>

                    <div className="p-1.5 bg-[#0a0e17] rounded border border-rose-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-[9px] uppercase">Stop-Loss</span>
                        <span className="text-rose-400 text-[10px] font-bold">₹{m.stop_loss?.toFixed(2)}</span>
                      </div>
                      <span className="text-[9px] text-rose-400/80 block mt-0.5">
                        {m.dist_to_sl_pct > 0 ? `${m.dist_to_sl_pct}% buffer` : 'Breached!'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              {(demat?.total_unrealized_pnl ?? 0) >= 0 ? '+' : '-'}₹{Math.abs(demat?.total_unrealized_pnl ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  const ltp = pos.ltp ?? pos.current_price ?? pos.entry_price;
                  const pnl = pos.unrealized_pnl ?? ((ltp - pos.entry_price) * pos.quantity);
                  const pnlPct = pos.pnl_pct ?? (((ltp - pos.entry_price) / (pos.entry_price || 1)) * 100);
                  const isPositive = pnl >= 0;

                  return (
                    <tr
                      key={pos.position_id || pos.symbol}
                      className="hover:bg-[#131926] transition-colors cursor-pointer"
                      onClick={() => onSelectStock(pos.symbol)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          {pos.symbol}
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                        </div>
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
                        ₹{(pos.current_value ?? (pos.quantity * ltp)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {pnl > 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setExitTarget({
                            symbol: pos.symbol,
                            companyName: pos.company_name || pos.symbol,
                            quantity: pos.quantity,
                            product: 'MIS',
                            buyPrice: pos.entry_price,
                            ltp: ltp,
                            currentValue: pos.quantity * ltp,
                            pnl: pnl,
                            pnlPct: pnlPct
                          })}
                          className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Sell / Exit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* 2. Demat Delivery Holdings */}
                {holdings.map((h) => {
                  const buyPrice = h.avg_buy_price ?? h.buy_price ?? 0;
                  const ltp = h.ltp ?? h.current_price ?? buyPrice;
                  const pnl = h.unrealized_pnl ?? h.pnl ?? ((ltp - buyPrice) * h.quantity);
                  const pnlPct = h.pnl_pct ?? (((ltp - buyPrice) / (buyPrice || 1)) * 100);
                  const isPositive = pnl >= 0;

                  return (
                    <tr
                      key={h.symbol}
                      className="hover:bg-[#131926] transition-colors cursor-pointer"
                      onClick={() => onSelectStock(h.symbol)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          {h.symbol}
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          CNC (Demat)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">{h.quantity}</td>
                      <td className="py-3 px-3 font-mono text-right text-gray-300">
                        ₹{buyPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right font-bold text-white">
                        ₹{ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-gray-200">
                        ₹{(h.current_value ?? (h.quantity * ltp)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-3 font-mono text-right font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {pnl > 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setExitTarget({
                            symbol: h.symbol,
                            companyName: h.company_name || h.symbol,
                            quantity: h.quantity,
                            product: 'CNC',
                            buyPrice: buyPrice,
                            ltp: ltp,
                            currentValue: h.current_value ?? (h.quantity * ltp),
                            pnl: pnl,
                            pnlPct: pnlPct
                          })}
                          className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Sell / Exit
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

      {/* 4. Sleek Institutional Exit / Square-Off Confirmation Modal */}
      {exitTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-md shadow-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <LogOut className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">Confirm Position Square-Off</h3>
                    <span className="text-[10px] font-mono bg-[#161f30] text-gray-300 border border-[#24314c] px-2 py-0.5 rounded">
                      {exitTarget.symbol}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Instant Market Order Execution • {exitTarget.product} Demat
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExitTarget(null)}
                className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Financial Breakdown */}
            <div className="mt-4 space-y-3.5 text-xs">
              {/* Settlement Card */}
              <div className="p-3.5 bg-[#121826] border border-[#1e273c] rounded-xl space-y-2.5">
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Shares to Square-Off</span>
                    <strong className="text-white font-bold text-sm">{exitTarget.quantity} Shares</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Current Market LTP</span>
                    <strong className="text-white font-bold text-sm">₹{exitTarget.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="pt-2 border-t border-[#1b2336]">
                    <span className="text-gray-400 block text-[10px] uppercase">Original Buy Price</span>
                    <span className="text-gray-300 font-bold">₹{exitTarget.buyPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1b2336]">
                    <span className="text-gray-400 block text-[10px] uppercase">Total Proceeds</span>
                    <strong className="text-emerald-400 font-bold">₹{exitTarget.currentValue?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

              {/* Realized PnL Impact Card */}
              <div className={`p-3 rounded-xl border font-mono ${
                exitTarget.pnl >= 0
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 text-[10px] uppercase font-sans font-semibold">Realized PnL Impact:</span>
                  <strong className="text-sm font-bold font-mono">
                    {exitTarget.pnl > 0 ? '+' : ''}₹{exitTarget.pnl?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({exitTarget.pnlPct > 0 ? '+' : ''}{exitTarget.pnlPct?.toFixed(2)}%)
                  </strong>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">
                  Funds will be instantly returned to Demat Available Cash and Auto-Trader surveillance will be deregistered.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setExitTarget(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#161d2d] hover:bg-[#20293d] text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExiting}
                  onClick={handleConfirmExit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isExiting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Sell...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Confirm Market Exit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
