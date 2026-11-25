import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Layers, X, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';

const INDICES = [
  { key: 'NIFTY_50', label: 'Nifty 50' },
  { key: 'NIFTY_NEXT_50', label: 'Next 50' },
  { key: 'NIFTY_MIDCAP_100', label: 'Midcap 100' },
  { key: 'NIFTY_SMALLCAP_100', label: 'Smallcap 100' },
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
  onSearchSubmit,
  onSelectStock
}) {
  const [suggestions, setSuggestions] = useState({ indices: [], stocks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Debounced search query fetch
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions({ indices: [], stocks: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/scan/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions({
            indices: data.indices || [],
            stocks: data.stocks || []
          });
          setIsOpen(true);
        }
      } catch (e) {
        console.warn('Search suggestions error:', e);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectIndexItem = (key) => {
    onSelectIndex(key);
    onScanIndex(key);
    setIsOpen(false);
  };

  const handleSelectStockItem = (symbol) => {
    if (onSelectStock) {
      onSelectStock(symbol);
    }
    setIsOpen(false);
  };

  const hasResults = suggestions.indices.length > 0 || suggestions.stocks.length > 0;

  return (
    <div className="bg-[#0e131f] border-b border-[#1b2336] px-3 sm:px-6 py-2.5">
      <div className="w-full max-w-[1850px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
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

        {/* Intelligent Autocomplete Search Bar & On-Demand Action */}
        <div className="w-full lg:w-auto flex items-center gap-2.5">
          <div ref={searchContainerRef} className="relative flex-1 sm:w-72">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search ticker or index (e.g. HAL, SMALLCAP)..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim() && hasResults) setIsOpen(true);
                }}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[#141a29] border border-[#222b40] rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 font-mono uppercase"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {isOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-[#101625] border border-[#222e46] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#182236]">
                {/* 1. Matching Indices Section */}
                {suggestions.indices.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-emerald-400" />
                      <span>NSE Indices</span>
                    </div>
                    {suggestions.indices.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectIndexItem(item.key)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#182236] transition-colors flex items-center justify-between group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-gray-400 line-clamp-1">
                            {item.description} ({item.count} constituents)
                          </span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                          Scan <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Matching Stocks Section */}
                {suggestions.stocks.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>NSE Constituent Stocks</span>
                    </div>
                    {suggestions.stocks.map((stock) => (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => handleSelectStockItem(stock.symbol)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#182236] transition-colors flex items-center justify-between group"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                              {stock.symbol}
                            </span>
                            <span className="text-[11px] text-gray-300 line-clamp-1">
                              {stock.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {stock.sector}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white">
                            ₹{stock.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[9px] text-emerald-400/80">
                            Click for Candlestick
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Matches Found */}
                {!isLoading && !hasResults && (
                  <div className="p-4 text-center text-xs text-gray-400">
                    <p className="font-semibold text-gray-300">No matching ticker or index found</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Search for stocks (e.g. HAL, TCS) or indices (e.g. SMALLCAP, AUTO)
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="p-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Searching NSE Database...</span>
                  </div>
                )}
              </div>
            )}
          </div>

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
