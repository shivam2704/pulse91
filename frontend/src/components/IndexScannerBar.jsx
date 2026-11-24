import React, { useState } from 'react';
import { Search, Play, Filter, Layers, CheckCircle2 } from 'lucide-react';

const INDICES = [
  { key: 'NIFTY_50', label: 'Nifty 50' },
  { key: 'NIFTY_NEXT_50', label: 'Next 50' },
  { key: 'NIFTY_MIDCAP_100', label: 'Midcap 100' },
  { key: 'NIFTY_BANK', label: 'Bank Nifty' },
  { key: 'NIFTY_IT', label: 'Nifty IT' },
  { key: 'NIFTY_AUTO', label: 'Nifty Auto' },
  { key: 'NIFTY_PHARMA', label: 'Nifty Pharma' },
  { key: 'NIFTY_METAL', label: 'Nifty Metal' },
  { key: 'NIFTY_FMCG', label: 'Nifty FMCG' },
];

export default function IndexScannerBar({
  selectedIndex,
  onSelectIndex,
  onScanIndex,
  isScanning,
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) {
  return (
    <div className="bg-[#0e131f] border-b border-[#1b2336] p-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Index Selector Buttons (Clean, hidden native scrollbar, smooth scrolling) */}
        <div className="w-full lg:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5" /> Index:
          </span>
          {INDICES.map((idx) => {
            const isSelected = selectedIndex === idx.key;
            return (
              <button
                key={idx.key}
                onClick={() => onSelectIndex(idx.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 font-semibold'
                    : 'bg-[#151c2b] border border-[#20293d] text-gray-400 hover:text-gray-200 hover:bg-[#1a2336]'
                }`}
              >
                {idx.label}
              </button>
            );
          })}
        </div>

        {/* Search & On-Demand Scan Action */}
        <div className="w-full lg:w-auto flex items-center gap-2.5">
          <form onSubmit={onSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticker (e.g. HAL, TCS)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#141a29] border border-[#222b40] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 font-mono uppercase"
            />
          </form>

          <button
            onClick={() => onScanIndex(selectedIndex)}
            disabled={isScanning}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Index...' : 'Scan Index On-Demand'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
