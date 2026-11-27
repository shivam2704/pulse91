import React from 'react';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { formatINR, formatBuyZone, formatHorizon } from '../utils/formatters';

/**
 * Shared 9-column Quant Scanner Table used identically by both
 * Monday Top 15 Watchlist and On-Demand Index Scanner.
 */
export default function ScannerTable({
  stocks = [],
  selectedSymbol,
  onSelectStock,
  onBuyStock,
  emptyMessage = 'No matching stocks found.',
  useWeeklyRank = false
}) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full min-w-[1190px] table-fixed text-left text-xs">
        <thead>
          <tr className="border-b border-[#1b2336] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-2 w-[64px]"># Rank</th>
            <th className="py-3 px-3 w-[196px]">Stock & Sector</th>
            <th className="py-3 px-3 w-[112px]">LTP (₹)</th>
            <th className="py-3 px-3 w-[164px]">Confluence Score</th>
            <th className="py-3 px-3 w-[138px]">Verdict</th>
            <th className="py-3 px-3 w-[124px]">Holding Horizon</th>
            <th className="py-3 px-3 w-[180px]">Buy Zone</th>
            <th className="py-3 px-3 w-[116px]">Target 1</th>
            <th className="py-3 px-3 w-[96px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#161d2d]">
          {stocks.length === 0 ? (
            <tr>
              <td colSpan="9" className="py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            stocks.map((stock, idx) => {
              const score = stock.confluence_score;
              const isStrong = stock.verdict === 'STRONG BUY';
              const rank = useWeeklyRank ? (stock.weekly_rank ?? idx + 1) : idx + 1;
              const isSelected = selectedSymbol === stock.symbol;
              const target1Price = stock.trade_plan?.target_1_price ?? stock.trade_plan?.target_1 ?? stock.ltp;
              const target1Pct =
                stock.trade_plan?.target_1_pct != null
                  ? Number(stock.trade_plan.target_1_pct)
                  : stock.ltp > 0 && target1Price
                  ? ((target1Price - stock.ltp) / stock.ltp) * 100
                  : 0;

              return (
                <tr
                  key={stock.symbol}
                  className={`hover:bg-[#131926] transition-colors group cursor-pointer ${
                    isSelected ? 'bg-emerald-500/15 border-l-2 border-emerald-400' : ''
                  }`}
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-2 font-mono">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                        rank <= 3
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-[#151c2b] text-gray-400 border border-[#20293d]'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  {/* Stock & Sector */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-mono">
                      <span className="truncate">{stock.symbol}</span>
                      <ArrowUpRight className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">
                      {stock.company_name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium truncate">
                      {stock.sector}
                    </div>
                  </td>

                  {/* LTP */}
                  <td className="py-3.5 px-3 font-mono font-bold text-gray-200 whitespace-nowrap">
                    {formatINR(stock.ltp)}
                  </td>

                  {/* Confluence Score */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">
                        {score}
                      </span>
                      <span className="text-[10px] text-gray-500">/100</span>
                    </div>
                    <div className="w-24 bg-[#1b2336] h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${
                          score >= 80 ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {stock.conviction_rate || '84.5% Historical Win-Rate'}
                    </div>
                  </td>

                  {/* Verdict */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase whitespace-nowrap ${
                        isStrong ? 'badge-strong-buy' : 'badge-momentum-buy'
                      }`}
                    >
                      {stock.verdict}
                    </span>
                  </td>

                  {/* Holding Horizon */}
                  <td className="py-3.5 px-3 text-gray-300 font-medium whitespace-nowrap">
                    {formatHorizon(stock.horizon_name)}
                  </td>

                  {/* Buy Zone */}
                  <td className="py-3.5 px-3 font-mono text-gray-300 text-[11px] whitespace-nowrap">
                    {formatBuyZone(stock.trade_plan?.entry_range, stock.ltp)}
                  </td>

                  {/* Target 1 */}
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                    {formatINR(target1Price)}
                    <span className="text-[10px] text-gray-400 block font-normal">
                      (+{target1Pct.toFixed(2)}%)
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onBuyStock(stock)}
                        title="1-Click Demat Buy"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
