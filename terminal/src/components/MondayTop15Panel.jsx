import React from 'react';
import { Calendar, TrendingUp, ShieldAlert, Target, MessageSquare, ShoppingCart, ArrowUpRight, Award } from 'lucide-react';

export default function MondayTop15Panel({
  mondayData,
  searchQuery,
  onSelectStock,
  onOpenWhatsApp,
  onOpenOrder,
  onRefreshMonday,
  isRefreshing,
  selectedSymbol
}) {
  const allPicks = mondayData?.picks || [];
  const picks = allPicks.filter(p => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.symbol?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.sector?.toLowerCase().includes(q)
    );
  });
  const topSectors = mondayData?.top_outperforming_sectors || [];

  return (
    <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 mb-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1b2336]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Monday 08:00 AM Master Weekly Watchlist
            </h2>
            <span className="text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
              Top 15 Filtered Setups
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Generated via 5-Pillar Confluence Engine across Nifty 500. Rejecting 95% low-probability noise.
          </p>
        </div>

        {/* Outperforming Sectors & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-[#121724] px-3 py-1.5 rounded-lg border border-[#1d2638]">
            <span className="font-semibold text-gray-300">Leading Sectors:</span>
            {topSectors.map((sec, i) => (
              <span key={i} className="text-emerald-400 font-medium">
                {sec}{i < topSectors.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>

          <button
            onClick={onRefreshMonday}
            disabled={isRefreshing}
            className="text-xs bg-[#151c2b] hover:bg-[#1a2336] text-gray-300 border border-[#222b40] px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'Scanning...' : 'Re-run 8 AM Scan'}
          </button>
        </div>
      </div>

      {/* Top 15 Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1b2336] text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-2"># Rank</th>
              <th className="py-3 px-3">Stock & Sector</th>
              <th className="py-3 px-3">LTP (₹)</th>
              <th className="py-3 px-3">Confluence Score</th>
              <th className="py-3 px-3">Verdict</th>
              <th className="py-3 px-3">Holding Horizon</th>
              <th className="py-3 px-3">Buy Zone</th>
              <th className="py-3 px-3">Target 1</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161d2d]">
            {picks.map((stock) => {
              const score = stock.confluence_score;
              const isStrong = stock.verdict === 'STRONG BUY';
              const rank = stock.weekly_rank;

              const isCurrent = selectedSymbol === stock.symbol;

              return (
                <tr
                  key={stock.symbol}
                  className={`hover:bg-[#131926] transition-colors group cursor-pointer ${
                    isCurrent ? 'bg-emerald-500/15 border-l-2 border-emerald-400' : ''
                  }`}
                  onClick={() => onSelectStock(stock.symbol)}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-2 font-mono">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                      rank <= 3
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-[#151c2b] text-gray-400 border border-[#20293d]'
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Stock & Sector */}
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-mono">
                      {stock.symbol}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[170px]">
                      {stock.company_name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {stock.sector}
                    </div>
                  </td>

                  {/* LTP */}
                  <td className="py-3.5 px-3 font-mono font-bold text-gray-200">
                    ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {stock.conviction_rate}
                    </div>
                  </td>

                  {/* Verdict Badge */}
                  <td className="py-3.5 px-3">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                      isStrong ? 'badge-strong-buy' : 'badge-momentum-buy'
                    }`}>
                      {stock.verdict}
                    </span>
                  </td>

                  {/* Holding Horizon */}
                  <td className="py-3.5 px-3 text-gray-300 font-medium">
                    {stock.horizon_name}
                  </td>

                  {/* Buy Zone */}
                  <td className="py-3.5 px-3 font-mono text-gray-300 text-[11px]">
                    {stock.trade_plan?.entry_range}
                  </td>

                  {/* Target 1 */}
                  <td className="py-3.5 px-3 font-mono text-emerald-400 font-semibold">
                    ₹{stock.trade_plan?.target_1_price?.toLocaleString('en-IN')}
                    <span className="text-[10px] text-gray-400 block font-normal">
                      (+{stock.trade_plan?.target_1_pct}%)
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => onOpenOrder(stock)}
                        title="1-Click Demat Buy"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
