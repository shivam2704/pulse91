import React from 'react';
import { Calendar } from 'lucide-react';
import ScannerTable from './ScannerTable';

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
      <ScannerTable
        stocks={picks}
        selectedSymbol={selectedSymbol}
        onSelectStock={onSelectStock}
        onBuyStock={onOpenOrder}
        emptyMessage={
          searchQuery?.trim()
            ? `No stocks matching "${searchQuery}" found in Monday Top 15.`
            : 'No Monday Top 15 setups loaded yet.'
        }
        useWeeklyRank={true}
      />
    </div>
  );
}
