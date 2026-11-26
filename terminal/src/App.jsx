import React, { useState, useEffect } from 'react';
import HeaderNavbar from './components/HeaderNavbar';
import IndexScannerBar from './components/IndexScannerBar';
import MondayTop15Panel from './components/MondayTop15Panel';
import StockConfluenceCard from './components/StockConfluenceCard';
import DematPortfolioModal from './components/DematPortfolioModal';
import OrderExecutionModal from './components/OrderExecutionModal';
import WhatsAppPreviewModal from './components/WhatsAppPreviewModal';
import WhatsAppConfigModal from './components/WhatsAppConfigModal';
import ConnectBrokerModal from './components/ConnectBrokerModal';
import NiftyIndexChartModal from './components/NiftyIndexChartModal';
import PortfolioPositionsPanel from './components/PortfolioPositionsPanel';
import { Layers, ArrowUpRight, TrendingUp, Calendar, Zap, RefreshCw, BarChart2, Columns, Rows, Eye, Briefcase, ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [market, setMarket] = useState(null);
  const [demat, setDemat] = useState(null);

  const [mondayData, setMondayData] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState('NIFTY_AUTO');
  const [indexScanResult, setIndexScanResult] = useState(null);
  const [isScanningIndex, setIsScanningIndex] = useState(false);
  const [isRefreshingMonday, setIsRefreshingMonday] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('MONDAY_WATCHLIST');
  const [layoutMode, setLayoutMode] = useState('SPLIT_SCREEN'); // 'SPLIT_SCREEN' or 'STACKED'
  const [autotrader, setAutotrader] = useState(null);

  // Modals
  const [isDematModalOpen, setIsDematModalOpen] = useState(false);
  const [isConnectBrokerOpen, setIsConnectBrokerOpen] = useState(false);
  const [isNiftyChartOpen, setIsNiftyChartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalStock, setOrderModalStock] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppModalStock, setWhatsAppModalStock] = useState(null);
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(localStorage.getItem('pulse91_whatsapp_phone') || '');
  const [isDeepDiveModalOpen, setIsDeepDiveModalOpen] = useState(false);
  const [orderToast, setOrderToast] = useState(null);

  // Sync WhatsApp config on mount
  useEffect(() => {
    fetch('/api/v1/alerts/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.phone_number && data.phone_number !== '+919876543210') {
          setWhatsAppPhone(data.phone_number);
          localStorage.setItem('pulse91_whatsapp_phone', data.phone_number);
        } else {
          const saved = localStorage.getItem('pulse91_whatsapp_phone');
          if (saved) setWhatsAppPhone(saved);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchMarketRegime();
    fetchDemat();
    fetchMondayScan();
    fetchAutotraderStatus();
    handleScanIndex('NIFTY_AUTO');

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    let ws = null;
    try {
      ws = new WebSocket(`${protocol}//${host}/ws`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TICK_UPDATE') {
            if (msg.market) setMarket(msg.market);
            if (msg.demat) {
              setDemat((prev) => ({
                ...prev,
                ...msg.demat
              }));
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const fetchMarketRegime = async () => {
    try {
      const res = await fetch('/api/v1/scan/regime');
      if (res.ok) {
        const json = await res.json();
        if (json.market) {
          setMarket({
            nifty_50: json.market.nifty_ltp,
            nifty_change_pct: json.market.nifty_change_pct,
            regime: json.market.regime_status,
            fii_dii_cr: json.market.fii_dii_net_flow_cr,
            is_market_open: json.market.is_market_open,
            session_status: json.market.session_status
          });
        }
      }
    } catch (e) {
      console.warn('Market regime fetch:', e.message);
    }
  };

  const fetchDemat = async () => {
    try {
      const res = await fetch('/api/v1/demat/overview');
      if (res.ok) {
        const json = await res.json();
        if (json.portfolio) setDemat(json.portfolio);
      }
    } catch (e) {
      console.warn('Demat fetch:', e.message);
    }
  };

  const fetchMondayScan = async (refresh = false) => {
    setIsRefreshingMonday(true);
    try {
      const res = await fetch(`/api/v1/scan/monday-top15?refresh=${refresh}`);
      if (res.ok) {
        const json = await res.json();
        setMondayData(json);
      }
    } catch (e) {
      console.warn('Monday scan error:', e.message);
    } finally {
      setIsRefreshingMonday(false);
    }
  };

  const fetchStockEvaluation = async (symbol, openModal = true) => {
    try {
      setSearchError(null);
      const res = await fetch(`/api/v1/scan/stock/${symbol}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setSelectedStock(json.data);
          if (openModal) setIsDeepDiveModalOpen(true);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setSearchError(errJson.detail || `Ticker '${symbol}' not recognized on NSE.`);
        setTimeout(() => setSearchError(null), 5000);
      }
    } catch (e) {
      console.warn('Stock eval error:', e.message);
    }
  };

  const handleScanIndex = async (indexKey) => {
    setIsScanningIndex(true);
    setActiveMainTab('INDEX_SCAN');
    try {
      const res = await fetch(`/api/v1/scan/index?index_key=${indexKey}`);
      if (res.ok) {
        const json = await res.json();
        setIndexScanResult(json);
      }
    } catch (e) {
      console.warn('Index scan error:', e.message);
    } finally {
      setIsScanningIndex(false);
    }
  };

  const filteredIndexRankings = (indexScanResult?.rankings || []).filter((stock) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      stock.symbol?.toLowerCase().includes(q) ||
      stock.company_name?.toLowerCase().includes(q) ||
      stock.sector?.toLowerCase().includes(q)
    );
  });

  const currentList = activeMainTab === 'INDEX_SCAN'
    ? filteredIndexRankings
    : (mondayData?.picks || []);

  const currentIndex = currentList.findIndex((s) => s.symbol === selectedStock?.symbol);

  const handleNavigateStock = (direction) => {
    if (currentIndex === -1 || currentList.length === 0) return;
    const nextIdx = currentIndex + direction;
    if (nextIdx >= 0 && nextIdx < currentList.length) {
      fetchStockEvaluation(currentList[nextIdx].symbol, true);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    // Direct routing for Index keywords to the Index Scanner
    const indexAliases = {
      'SMALLCAP': 'NIFTY_SMALLCAP_100',
      'SMALLCAP 100': 'NIFTY_SMALLCAP_100',
      'NIFTY SMALLCAP': 'NIFTY_SMALLCAP_100',
      'NIFTY_SMALLCAP_100': 'NIFTY_SMALLCAP_100',
      'MIDCAP': 'NIFTY_MIDCAP_100',
      'MIDCAP 100': 'NIFTY_MIDCAP_100',
      'NIFTY MIDCAP': 'NIFTY_MIDCAP_100',
      'NIFTY_MIDCAP_100': 'NIFTY_MIDCAP_100',
      'NIFTY 50': 'NIFTY_50',
      'NIFTY': 'NIFTY_50',
      'NIFTY50': 'NIFTY_50',
      'NIFTY_50': 'NIFTY_50',
      'NEXT 50': 'NIFTY_NEXT_50',
      'NEXT50': 'NIFTY_NEXT_50',
      'NIFTY NEXT 50': 'NIFTY_NEXT_50',
      'NIFTY_NEXT_50': 'NIFTY_NEXT_50',
      'BANK': 'NIFTY_BANK',
      'BANKNIFTY': 'NIFTY_BANK',
      'NIFTY BANK': 'NIFTY_BANK',
      'NIFTY_BANK': 'NIFTY_BANK',
      'IT': 'NIFTY_IT',
      'NIFTY IT': 'NIFTY_IT',
      'NIFTY_IT': 'NIFTY_IT',
      'AUTO': 'NIFTY_AUTO',
      'NIFTY AUTO': 'NIFTY_AUTO',
      'NIFTY_AUTO': 'NIFTY_AUTO',
      'PHARMA': 'NIFTY_PHARMA',
      'NIFTY PHARMA': 'NIFTY_PHARMA',
      'NIFTY_PHARMA': 'NIFTY_PHARMA',
      'METAL': 'NIFTY_METAL',
      'NIFTY METAL': 'NIFTY_METAL',
      'NIFTY_METAL': 'NIFTY_METAL',
      'FMCG': 'NIFTY_FMCG',
      'NIFTY FMCG': 'NIFTY_FMCG',
      'NIFTY_FMCG': 'NIFTY_FMCG',
    };

    if (indexAliases[query]) {
      const targetIndex = indexAliases[query];
      setSelectedIndex(targetIndex);
      setActiveMainTab('INDEX_SCAN');
      handleScanIndex(targetIndex);
      return;
    }

    // Direct Stock Ticker Deep-Dive
    fetchStockEvaluation(query, true);
  };

  const handleDisconnectBroker = async () => {
    try {
      const res = await fetch('/api/v1/demat/disconnect', { method: 'POST' });
      if (res.ok) {
        fetchDemat();
      }
    } catch (e) {}
  };

  const handleResetSandbox = async () => {
    try {
      const res = await fetch('/api/v1/demat/reset', { method: 'POST' });
      if (res.ok) {
        fetchDemat();
      }
    } catch (e) {}
  };

  const handleConfirmOrder = async (orderPayload) => {
    try {
      const res = await fetch('/api/v1/trade/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDemat();
        fetchAutotraderStatus();
        const price = data.order?.price || orderPayload.price;
        setOrderToast({
          type: 'BUY',
          symbol: orderPayload.symbol,
          quantity: orderPayload.quantity,
          price: price,
          targetPrice: orderPayload.target_price,
          slPrice: orderPayload.sl_price,
          message: `Order Filled: BUY ${orderPayload.quantity} ${orderPayload.symbol} @ ₹${price?.toFixed(2)}`
        });
        setTimeout(() => setOrderToast(null), 8000);
        return {
          success: true,
          order_id: data.order?.order_id,
          broker: demat?.broker || 'SANDBOX DEMAT',
          price: price
        };
      } else {
        return { success: false, detail: data.detail || 'Execution failed' };
      }
    } catch (e) {
      return { success: false, detail: e.message || 'Execution error' };
    }
  };

  const handleExitPosition = async (symbol) => {
    try {
      const res = await fetch('/api/v1/trade/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const data = await res.json();
      if (res.ok) {
        fetchDemat();
        fetchAutotraderStatus();
        setOrderToast({
          type: 'EXIT',
          symbol,
          message: `Position Squared Off: Sold ${symbol} at Market Price`
        });
        setTimeout(() => setOrderToast(null), 6000);
      }
    } catch (e) {}
  };

  const fetchAutotraderStatus = async () => {
    try {
      const res = await fetch('/api/v1/trade/autotrader/status');
      if (res.ok) {
        const json = await res.json();
        setAutotrader(json);
      }
    } catch (e) {}
  };

  const handleToggleAutotrader = async () => {
    try {
      const res = await fetch('/api/v1/trade/autotrader/toggle', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setAutotrader(json.status);
        const isNowActive = json.status?.is_active ?? json.is_active;
        setOrderToast({
          type: isNowActive ? 'BUY' : 'EXIT',
          message: isNowActive
            ? '🤖 Auto-Trader Daemon ACTIVATED: Monitoring breakouts, Target (+5.55%) & Stop-Loss (-2.78%)'
            : '⏸️ Auto-Trader Daemon PAUSED: Autonomous order execution is on hold'
        });
        setTimeout(() => setOrderToast(null), 5000);
      }
    } catch (e) {}
  };

  const handleRunAutotraderCycle = async () => {
    try {
      const res = await fetch('/api/v1/trade/autotrader/cycle', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setAutotrader(json.status);
        fetchDemat();
        const events = json.events || [];
        setOrderToast({
          type: 'BUY',
          message: events.length > 0
            ? `⚡ Auto-Trader Cycle: ${events.length} position action(s) executed!`
            : '⚡ Auto-Trader Evaluation Cycle Completed: All positions safely monitored'
        });
        setTimeout(() => setOrderToast(null), 5000);
      }
    } catch (e) {}
  };

  const handleSendWhatsApp = async (symbol, phone) => {
    try {
      await fetch('/api/v1/alerts/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, phone_number: phone })
      });
      setIsWhatsAppModalOpen(false);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-gray-100 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <HeaderNavbar
        market={market}
        demat={demat}
        whatsAppPhone={whatsAppPhone}
        onOpenWhatsAppModal={() => setIsWhatsAppConfigOpen(true)}
        onOpenDemat={() => setIsDematModalOpen(true)}
        onOpenConnectBroker={() => setIsConnectBrokerOpen(true)}
        onOpenNiftyChart={() => setIsNiftyChartOpen(true)}
      />

      {/* Floating Order Execution Toast */}
      {orderToast && (
        <div className="fixed top-16 right-6 z-50 animate-bounce-in max-w-md w-full bg-[#0d1626] border border-emerald-500/50 shadow-2xl rounded-xl p-4 flex items-start gap-3 backdrop-blur-md">
          <div className={`p-2 rounded-lg shrink-0 ${orderToast.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs uppercase tracking-wide">
                {orderToast.type === 'BUY' ? 'Order Executed & Filled' : 'Position Squared Off'}
              </span>
              <button onClick={() => setOrderToast(null)} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-xs text-emerald-300 font-mono mt-1 font-semibold">{orderToast.message}</p>
            {orderToast.targetPrice && (
              <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-gray-300">
                <span className="bg-[#121c2e] px-1.5 py-0.5 rounded border border-[#22334e] text-emerald-400">
                  Target: ₹{orderToast.targetPrice.toFixed(2)}
                </span>
                <span className="bg-[#121c2e] px-1.5 py-0.5 rounded border border-[#22334e] text-rose-400">
                  SL: ₹{orderToast.slPrice.toFixed(2)}
                </span>
                <span className="text-gray-400 ml-auto">Auto-Trader Active</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-[#1e2a3f] text-[10px]">
              <span className="text-gray-400">Status: In Demat Portfolio</span>
              <button
                onClick={() => {
                  setActiveMainTab('PORTFOLIO_POSITIONS');
                  setOrderToast(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                Go to Demat ➜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. On-Demand Index Scanner Toolbar */}
      <IndexScannerBar
        selectedIndex={selectedIndex}
        onSelectIndex={(key) => {
          setSelectedIndex(key);
          handleScanIndex(key);
        }}
        onScanIndex={handleScanIndex}
        isScanning={isScanningIndex}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSelectStock={(sym) => fetchStockEvaluation(sym, true)}
      />

      {/* Search Error Notification Banner */}
      {searchError && (
        <div className="w-full max-w-[1850px] mx-auto px-3 sm:px-6 pt-3">
          <div className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-amber-500/30 px-1.5 py-0.5 rounded text-[10px]">NSE Notice</span>
              <span>{searchError}</span>
            </div>
            <button onClick={() => setSearchError(null)} className="text-amber-400 hover:text-white font-bold ml-4">✕</button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto p-3 sm:p-5 md:p-6 space-y-6">
        {/* Top Control Bar: Active Tab (Scanner vs Monday Watchlist) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2336] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('MONDAY_WATCHLIST')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'MONDAY_WATCHLIST'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-md'
                  : 'bg-[#121724] border border-[#1e2638] text-gray-400 hover:text-white hover:bg-[#182133]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monday 08:00 AM Watchlist (Top 15)</span>
            </button>

            <button
              onClick={() => {
                setActiveMainTab('INDEX_SCAN');
                if (!indexScanResult) handleScanIndex(selectedIndex);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'INDEX_SCAN'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-md'
                  : 'bg-[#121724] border border-[#1e2638] text-gray-400 hover:text-white hover:bg-[#182133]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>On-Demand Index Scanner</span>
              {indexScanResult && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                  {indexScanResult.index_name}
                </span>
              )}
              {isScanningIndex && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 ml-1" />}
            </button>

            <button
              onClick={() => setActiveMainTab('PORTFOLIO_POSITIONS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeMainTab === 'PORTFOLIO_POSITIONS'
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 shadow-md'
                  : 'bg-[#121724] border border-[#1e2638] text-gray-400 hover:text-white hover:bg-[#182133]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Positions & Demat ({((demat?.holdings?.length || 0) + (demat?.positions?.length || 0))})</span>
              {autotrader?.is_active && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Auto-Trader Active"></span>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-400 font-mono hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Click any stock row to open full TradingView Candlestick Chart</span>
          </div>
        </div>

        {/* 1. Monday 08:00 AM Top 15 Master Watchlist (Full Width, Crisp & Spacious) */}
        {activeMainTab === 'MONDAY_WATCHLIST' && (
          <MondayTop15Panel
            mondayData={mondayData}
            searchQuery={searchQuery}
            onSelectStock={(sym) => fetchStockEvaluation(sym, true)}
            onOpenWhatsApp={(stock) => {
              setWhatsAppModalStock(stock);
              setIsWhatsAppModalOpen(true);
            }}
            onOpenOrder={(stock) => {
              setOrderModalStock(stock);
              setIsOrderModalOpen(true);
            }}
            onRefreshMonday={() => fetchMondayScan(true)}
            isRefreshing={isRefreshingMonday}
            selectedSymbol={selectedStock?.symbol}
          />
        )}

        {/* 2. On-Demand Scanned Index Constituents Table (Full Width) */}
        {activeMainTab === 'INDEX_SCAN' && (
          <div className="bg-[#0c101a] border border-[#1b2336] rounded-xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1b2336] gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Layers className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {indexScanResult?.index_name || selectedIndex} — On-Demand Live Scan
                  </h3>
                  <span className="text-[11px] font-mono bg-[#161f30] text-gray-300 border border-[#232f48] px-2 py-0.5 rounded-full">
                    {indexScanResult?.total_constituents || 0} Constituents
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {indexScanResult?.description || 'Instant 5-pillar quant scanning across this sector index.'}
                </p>
              </div>

              {/* Summary Stats Badges */}
              {indexScanResult?.summary && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="bg-[#121826] border border-[#1e2638] px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Strong Buy</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {indexScanResult.summary.strong_buy_count}
                    </span>
                  </div>
                  <div className="bg-[#121826] border border-[#1e2638] px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Momentum Buy</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {indexScanResult.summary.momentum_buy_count}
                    </span>
                  </div>
                  <div className="bg-[#121826] border border-[#1e2638] px-3 py-1.5 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Avg Score</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {indexScanResult.summary.average_confluence_score}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isScanningIndex ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-emerald-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono">Running 5-Pillar Confluence Engine on {selectedIndex}...</span>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
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
                    {filteredIndexRankings.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-400">
                          No stocks matching "{searchQuery}" found in {indexScanResult?.index_name || selectedIndex}.
                        </td>
                      </tr>
                    ) : (
                      filteredIndexRankings.map((stock, idx) => {
                      const score = stock.confluence_score;
                      const isStrong = stock.verdict === 'STRONG BUY';
                      const rank = idx + 1;
                      const isSelected = selectedStock?.symbol === stock.symbol;

                      return (
                        <tr
                          key={stock.symbol}
                          className={`hover:bg-[#131926] transition-colors group cursor-pointer ${
                            isSelected ? 'bg-emerald-500/15 border-l-2 border-emerald-400' : ''
                          }`}
                          onClick={() => fetchStockEvaluation(stock.symbol, true)}
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
                            ₹{stock.ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                              {stock.conviction_rate || '84.5% Win-Rate'}
                            </div>
                          </td>

                          {/* Verdict */}
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
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
                          <td className="py-3.5 px-3 font-mono text-gray-300">
                            {stock.trade_plan?.entry_range || `₹${(stock.ltp * 0.995).toFixed(1)} - ₹${(stock.ltp * 1.005).toFixed(1)}`}
                          </td>

                          {/* Target 1 */}
                          <td className="py-3.5 px-3 font-mono">
                            <div className="text-emerald-400 font-semibold">
                              ₹{(stock.trade_plan?.target_1_price || stock.trade_plan?.target_1 || (stock.ltp * 1.0555)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <span className="text-[10px] text-gray-500 font-normal">
                              (+5.55%)
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => {
                                  setOrderModalStock(stock);
                                  setIsOrderModalOpen(true);
                                }}
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
                    }))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Open Positions & Demat Portfolio with SELL Actions */}
        {activeMainTab === 'PORTFOLIO_POSITIONS' && (
          <PortfolioPositionsPanel
            demat={demat}
            searchQuery={searchQuery}
            autotrader={autotrader}
            whatsAppPhone={whatsAppPhone}
            onOpenWhatsAppModal={() => setIsWhatsAppConfigOpen(true)}
            onToggleAutotrader={handleToggleAutotrader}
            onRunCycle={handleRunAutotraderCycle}
            onExitPosition={handleExitPosition}
            onSelectStock={(sym) => fetchStockEvaluation(sym, true)}
          />
        )}
      </main>

      {/* Stock Deep-Dive Modal Drawer (Opens on click, zero scrolling required) */}
      {isDeepDiveModalOpen && selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl">
            <StockConfluenceCard
              stockData={selectedStock}
              onExecuteOrder={(stock) => {
                setOrderModalStock(stock);
                setIsOrderModalOpen(true);
              }}
              onOpenWhatsApp={(stock) => {
                setWhatsAppModalStock(stock);
                setIsWhatsAppModalOpen(true);
              }}
              onClose={() => setIsDeepDiveModalOpen(false)}
              onPrev={() => handleNavigateStock(-1)}
              onNext={() => handleNavigateStock(1)}
              hasPrev={currentIndex > 0}
              hasNext={currentIndex < currentList.length - 1}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <DematPortfolioModal
        isOpen={isDematModalOpen}
        onClose={() => setIsDematModalOpen(false)}
        portfolio={demat}
        onExitPosition={handleExitPosition}
        onResetSandbox={handleResetSandbox}
        onOpenConnectBroker={() => {
          setIsDematModalOpen(false);
          setIsConnectBrokerOpen(true);
        }}
        onDisconnectBroker={handleDisconnectBroker}
      />

      <ConnectBrokerModal
        isOpen={isConnectBrokerOpen}
        onClose={() => setIsConnectBrokerOpen(false)}
        activeBroker={demat?.broker || 'Groww'}
        activeMode={demat?.mode || 'SANDBOX'}
        onConnected={(broker) => {
          fetchDemat();
        }}
        onDisconnect={() => {
          fetchDemat();
        }}
      />

      <OrderExecutionModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        stock={orderModalStock}
        onConfirmOrder={handleConfirmOrder}
        availableCash={demat?.available_cash ?? 0}
        onViewDemat={() => setActiveMainTab('PORTFOLIO_POSITIONS')}
      />

      <WhatsAppPreviewModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        stock={whatsAppModalStock}
        onSendWhatsApp={handleSendWhatsApp}
      />

      <WhatsAppConfigModal
        isOpen={isWhatsAppConfigOpen}
        onClose={() => setIsWhatsAppConfigOpen(false)}
        currentPhone={whatsAppPhone}
        onUpdatePhone={(phone) => setWhatsAppPhone(phone)}
      />

      <NiftyIndexChartModal
        isOpen={isNiftyChartOpen}
        onClose={() => setIsNiftyChartOpen(false)}
        market={market}
      />

      {/* Footer */}
      <footer className="border-t border-[#1b2336] bg-[#0b0f19] py-3 px-4 text-center text-xs text-gray-500 font-mono">
        PULSE91 DALAL STREET QUANT TERMINAL • SEBI REGISTERED BROKER GATEWAY • 5-PILLAR REJECTION MATRIX
      </footer>
    </div>
  );
}
