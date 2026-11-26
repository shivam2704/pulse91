import React, { useState } from 'react';
import { X, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers, AlertTriangle, RotateCcw, LogOut, ExternalLink } from 'lucide-react';

const formatINR = (val, decimals = 2) => {
  if (val === undefined || val === null || isNaN(Number(val))) return '₹0.00';
  return '₹' + Number(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export default function DematPortfolioModal({
  isOpen,
  onClose,
  portfolio,
  onExitPosition,
  onResetSandbox,
  onOpenConnectBroker,
  onDisconnectBroker
}) {
  const [confirmExitTarget, setConfirmExitTarget] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen || !portfolio) return null;

  const {
    mode,
    broker,
    account_id,
    account_net_worth,
    available_cash,
    invested_value,
    total_unrealized_pnl,
    total_unrealized_pnl_pct,
    today_pnl,
    holdings,
    positions
  } = portfolio;

  const isProfitable = (Number(total_unrealized_pnl) || 0) >= 0;
  const isSandbox = mode?.toUpperCase() === 'SANDBOX';

  const handleExecuteExit = async (symbol) => {
    setIsExiting(true);
    try {
      if (onExitPosition) {
        await onExitPosition(symbol);
      }
    } finally {
      setIsExiting(false);
      setConfirmExitTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b0f19] border border-[#1e2638] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#171f30] bg-[#0d1322]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isSandbox
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isSandbox ? 'Sandbox Virtual Demat Portfolio' : `Live Demat • ${broker || 'Broker'}`}
                </h3>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isSandbox
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isSandbox ? 'SANDBOX MODE' : 'LIVE DEMAT CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {isSandbox ? 'Account: PULSE91-DEMAT-SBX-01 (Virtual Paper Wallet)' : `Account ID: ${account_id}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {isSandbox ? (
              <>
                {onResetSandbox && (
                  <button
                    disabled={isResetting}
                    onClick={async () => {
                      setIsResetting(true);
                      try {
                        await onResetSandbox();
                      } finally {
                        setIsResetting(false);
                      }
                    }}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 whitespace-nowrap"
                    title="Reset virtual sandbox balance back to ₹10,000"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>Reset (₹10k)</span>
                  </button>
                )}

                {onOpenConnectBroker && (
                  <button
                    onClick={onOpenConnectBroker}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                    title="Authenticate official Groww, DhanHQ, or Zerodha credentials"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Connect Real Broker</span>
                  </button>
                )}
              </>
            ) : (
              onDisconnectBroker && (
                <button
                  onClick={onDisconnectBroker}
                  className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg transition-colors font-semibold flex items-center gap-1.5 whitespace-nowrap"
                  title="Disconnect live broker session and revert to Sandbox"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Broker</span>
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors border border-[#253047]"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Portfolio Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#101524] border border-[#1b2336] rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-gray-400">Total Demat Worth</span>
              <span className="text-lg font-mono font-bold text-white tracking-tight mt-1 truncate">
                {formatINR(account_net_worth)}
              </span>
            </div>

            <div className="bg-[#101524] border border-[#1b2336] rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-gray-400">Available Cash Margin</span>
              <span className="text-lg font-mono font-bold text-emerald-400 tracking-tight mt-1 truncate">
                {formatINR(available_cash)}
              </span>
            </div>

            <div className="bg-[#101524] border border-[#1b2336] rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-gray-400">Invested Capital</span>
              <span className="text-lg font-mono font-bold text-gray-200 tracking-tight mt-1 truncate">
                {formatINR(invested_value)}
              </span>
            </div>

            <div className="bg-[#101524] border border-[#1b2336] rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-gray-400">Unrealized PnL</span>
              <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                <span className={`text-lg font-mono font-bold whitespace-nowrap ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isProfitable ? '+' : ''}{formatINR(total_unrealized_pnl)}
                </span>
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${
                  isProfitable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {isProfitable ? '+' : ''}{total_unrealized_pnl_pct}%
                </span>
              </div>
            </div>
          </div>

          {/* Demat Holdings Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Demat Holdings
                </h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#161d2d] text-gray-300 border border-[#20293d]">
                  {holdings?.length || 0}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Delivery (CNC)</span>
            </div>

            <div className="overflow-x-auto border border-[#1b2336] rounded-xl bg-[#0e1320]">
              <table className="w-full text-xs">
                <thead className="bg-[#121826] border-b border-[#1b2336] text-gray-400 text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3.5 text-left">Symbol</th>
                    <th className="py-2.5 px-3.5 text-right">Qty</th>
                    <th className="py-2.5 px-3.5 text-right">Avg Buy</th>
                    <th className="py-2.5 px-3.5 text-right">LTP</th>
                    <th className="py-2.5 px-3.5 text-right">Invested</th>
                    <th className="py-2.5 px-3.5 text-right">Current Val</th>
                    <th className="py-2.5 px-3.5 text-right">PnL (₹)</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161d2d]">
                  {holdings && holdings.length > 0 ? (
                    holdings.map((h) => {
                      const isHoldingProfitable = (Number(h.unrealized_pnl) || 0) >= 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-[#131a29] transition-colors">
                          <td className="py-2.5 px-3.5 text-left">
                            <span className="font-mono font-bold text-white block">{h.symbol}</span>
                            {h.company_name && (
                              <span className="text-[10px] text-gray-400 block truncate max-w-[130px]">
                                {h.company_name}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-gray-300">{h.quantity}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-gray-300">{formatINR(h.avg_buy_price)}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-medium text-white">{formatINR(h.ltp)}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-gray-400">{formatINR(h.invested_value)}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-white">{formatINR(h.current_value)}</td>
                          <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${
                            isHoldingProfitable ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            <span className="block whitespace-nowrap">
                              {isHoldingProfitable ? '+' : ''}{formatINR(h.unrealized_pnl)}
                            </span>
                            <span className="text-[10px] font-normal block">
                              ({isHoldingProfitable ? '+' : ''}{h.pnl_pct}%)
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => setConfirmExitTarget({
                                symbol: h.symbol,
                                quantity: h.quantity,
                                ltp: h.ltp,
                                invested_value: h.invested_value,
                                current_value: h.current_value,
                                pnl: h.unrealized_pnl
                              })}
                              className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-[11px] font-semibold transition-all whitespace-nowrap"
                            >
                              Sell / Exit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 font-mono text-xs">
                        No Demat holdings found in current portfolio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Intraday Positions Table */}
          {positions && positions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Active Open Positions
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#161d2d] text-gray-300 border border-[#20293d]">
                    {positions.length}
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-medium">3:12 PM Auto-Square-off Active</span>
              </div>

              <div className="overflow-x-auto border border-[#1b2336] rounded-xl bg-[#0e1320]">
                <table className="w-full text-xs">
                  <thead className="bg-[#121826] border-b border-[#1b2336] text-gray-400 text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3.5 text-left">Symbol</th>
                      <th className="py-2.5 px-3.5 text-left">Type</th>
                      <th className="py-2.5 px-3.5 text-right">Qty</th>
                      <th className="py-2.5 px-3.5 text-right">Entry</th>
                      <th className="py-2.5 px-3.5 text-right">LTP</th>
                      <th className="py-2.5 px-3.5 text-right">PnL (₹)</th>
                      <th className="py-2.5 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161d2d]">
                    {positions.map((p) => {
                      const isPosProfitable = (Number(p.unrealized_pnl) || 0) >= 0;
                      return (
                        <tr key={p.position_id || p.symbol} className="hover:bg-[#131a29] transition-colors">
                          <td className="py-2.5 px-3.5 text-left font-mono font-bold text-white">{p.symbol}</td>
                          <td className="py-2.5 px-3.5 text-left">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                              {p.product || 'MIS'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-gray-300">{p.quantity}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono text-gray-300">{formatINR(p.entry_price)}</td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-medium text-white">{formatINR(p.ltp)}</td>
                          <td className={`py-2.5 px-3.5 text-right font-mono font-bold ${
                            isPosProfitable ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {isPosProfitable ? '+' : ''}{formatINR(p.unrealized_pnl)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right">
                            <button
                              onClick={() => setConfirmExitTarget({
                                symbol: p.symbol,
                                quantity: p.quantity,
                                ltp: p.ltp,
                                entry_price: p.entry_price,
                                pnl: p.unrealized_pnl
                              })}
                              className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 text-[11px] font-semibold transition-all whitespace-nowrap"
                            >
                              Square-Off
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal-Embedded Sleek Confirmation Dialog */}
        {confirmExitTarget && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0f1422] border border-[#2a354c] rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Confirm Position Exit</h4>
                  <p className="text-xs text-gray-400 font-mono">Execute Market Order via Gateway</p>
                </div>
              </div>

              <div className="bg-[#141b2d] border border-[#1e273d] rounded-xl p-3.5 space-y-2 mb-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ticker:</span>
                  <span className="font-bold text-white">{confirmExitTarget.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity:</span>
                  <span className="text-gray-200">{confirmExitTarget.quantity} Shares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Market LTP:</span>
                  <span className="text-emerald-400 font-bold">{formatINR(confirmExitTarget.ltp)}</span>
                </div>
                <div className="flex justify-between border-t border-[#1e273d] pt-2">
                  <span className="text-gray-400">Realized PnL:</span>
                  <span className={`font-bold ${
                    (Number(confirmExitTarget.pnl) || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(Number(confirmExitTarget.pnl) || 0) >= 0 ? '+' : ''}{formatINR(confirmExitTarget.pnl)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  disabled={isExiting}
                  onClick={() => setConfirmExitTarget(null)}
                  className="px-4 py-2 rounded-lg bg-[#1a2235] hover:bg-[#232d44] text-gray-300 text-xs font-semibold border border-[#2b3752] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isExiting}
                  onClick={() => handleExecuteExit(confirmExitTarget.symbol)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
                >
                  {isExiting ? 'Processing...' : 'Confirm Market Exit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
