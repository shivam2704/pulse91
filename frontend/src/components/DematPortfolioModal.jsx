import React from 'react';
import { X, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers, Trash2 } from 'lucide-react';

export default function DematPortfolioModal({
  isOpen,
  onClose,
  portfolio,
  onExitPosition,
  onToggleMode
}) {
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

  const isProfitable = (total_unrealized_pnl || 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2336]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live Demat & Portfolio Overview</h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {mode} ({broker})
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">Account ID: {account_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Broker Selector */}
            <div className="flex items-center gap-1 bg-[#121724] p-1 rounded-lg border border-[#1e2638] text-xs">
              {['Groww', 'DhanHQ', 'Zerodha'].map((b) => (
                <button
                  key={b}
                  onClick={() => onToggleMode(b)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    broker?.toLowerCase().includes(b.toLowerCase())
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <button
              onClick={() => onToggleMode(broker || 'Groww')}
              className="text-xs bg-[#161d2d] hover:bg-[#1e273d] text-gray-300 border border-[#253047] px-3 py-1.5 rounded-lg transition-colors"
            >
              Toggle Sandbox / Live
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portfolio Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-[#121724] border border-[#1d2638] rounded-xl p-3.5">
            <span className="text-[11px] text-gray-400 block">Total Demat Worth</span>
            <span className="text-lg font-mono font-bold text-white">
              ₹{account_net_worth?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-[#121724] border border-[#1d2638] rounded-xl p-3.5">
            <span className="text-[11px] text-gray-400 block">Available Cash Margin</span>
            <span className="text-lg font-mono font-bold text-emerald-400">
              ₹{available_cash?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-[#121724] border border-[#1d2638] rounded-xl p-3.5">
            <span className="text-[11px] text-gray-400 block">Invested Capital</span>
            <span className="text-lg font-mono font-bold text-gray-200">
              ₹{invested_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-[#121724] border border-[#1d2638] rounded-xl p-3.5">
            <span className="text-[11px] text-gray-400 block">Unrealized PnL</span>
            <span className={`text-lg font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfitable ? '+' : ''}₹{total_unrealized_pnl?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              <span className="text-xs ml-1 font-normal">({isProfitable ? '+' : ''}{total_unrealized_pnl_pct}%)</span>
            </span>
          </div>
        </div>

        {/* Demat Holdings Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Demat Holdings ({holdings?.length || 0})
            </h4>
            <span className="text-[11px] text-gray-400">Delivery (CNC)</span>
          </div>
          <div className="overflow-x-auto border border-[#1b2336] rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121724] border-b border-[#1b2336] text-gray-400 text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Avg Buy</th>
                  <th className="py-2.5 px-3">LTP</th>
                  <th className="py-2.5 px-3">Invested</th>
                  <th className="py-2.5 px-3">Current Val</th>
                  <th className="py-2.5 px-3 text-right">PnL (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161d2d]">
                {holdings?.map((h) => {
                  const isHoldingProfitable = (h.unrealized_pnl || 0) >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-[#121724]">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{h.symbol}</td>
                      <td className="py-2.5 px-3 font-mono">{h.quantity}</td>
                      <td className="py-2.5 px-3 font-mono">₹{h.avg_buy_price?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-gray-200">₹{h.ltp?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-400">₹{h.invested_value?.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">₹{h.current_value?.toLocaleString('en-IN')}</td>
                      <td className={`py-2.5 px-3 font-mono text-right font-bold ${
                        isHoldingProfitable ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {isHoldingProfitable ? '+' : ''}₹{h.unrealized_pnl?.toLocaleString('en-IN')}
                        <span className="text-[10px] block font-normal">
                          ({isHoldingProfitable ? '+' : ''}{h.pnl_pct}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Positions Table */}
        {positions && positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Active Open Positions ({positions.length})
              </h4>
              <span className="text-[11px] text-amber-400">3:12 PM Auto-Square-off Active</span>
            </div>
            <div className="overflow-x-auto border border-[#1b2336] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121724] border-b border-[#1b2336] text-gray-400 text-[11px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">LTP</th>
                    <th className="py-2.5 px-3">PnL</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161d2d]">
                  {positions.map((p) => {
                    const isPosProfitable = (p.unrealized_pnl || 0) >= 0;
                    return (
                      <tr key={p.position_id} className="hover:bg-[#121724]">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{p.symbol}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                            {p.product}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">{p.quantity}</td>
                        <td className="py-2.5 px-3 font-mono">₹{p.entry_price?.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-200">₹{p.ltp?.toLocaleString('en-IN')}</td>
                        <td className={`py-2.5 px-3 font-mono font-bold ${
                          isPosProfitable ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {isPosProfitable ? '+' : ''}₹{p.unrealized_pnl?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onExitPosition(p.symbol)}
                            className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold"
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
    </div>
  );
}
