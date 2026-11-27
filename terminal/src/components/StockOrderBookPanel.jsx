import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Lock, RefreshCw, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function StockOrderBookPanel({ symbol, ltp, dematMode, onExecuteOrder }) {
  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' | 'DEPTH'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [candles5m, setCandles5m] = useState([]);
  const [loadingDepth, setLoadingDepth] = useState(false);

  const isLiveDemat = dematMode === 'LIVE_DEMAT';

  const fetchOrders = async () => {
    if (!symbol) return;
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await api.trade.getHistory();
      const allOrders = data?.orders || [];
      const filtered = allOrders.filter(
        (o) => String(o.symbol || '').toUpperCase() === String(symbol).toUpperCase()
      );
      setOrders(filtered);
    } catch (err) {
      setOrdersError(err?.message || 'Failed to load orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchIntradayPressure = async () => {
    if (!symbol) return;
    setLoadingDepth(true);
    try {
      const res = await api.scan.getCandles(symbol, '5m', 24);
      if (res?.candles) {
        setCandles5m(res.candles.slice(-24));
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingDepth(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchIntradayPressure();
  }, [symbol]);

  // Compute real intraday buy vs sell candle volume pressure (zero simulated bid/ask numbers)
  let buyVol = 0;
  let sellVol = 0;
  for (const c of candles5m) {
    if (c.close >= c.open) buyVol += c.volume || 0;
    else sellVol += c.volume || 0;
  }
  const totalVol = buyVol + sellVol;
  const buyPct = totalVol > 0 ? Math.round((buyVol / totalVol) * 100) : 50;
  const sellPct = 100 - buyPct;

  return (
    <div className="bg-[#090d16] border border-[#1b2336] rounded-xl p-3.5 my-3 flex flex-col h-[392px]">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1b2336]">
        <div className="flex items-center bg-[#131a29] border border-[#20293d] rounded-lg p-0.5 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Orders ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DEPTH')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeTab === 'DEPTH'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Market Depth</span>
          </button>
        </div>

        {activeTab === 'ORDERS' && (
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loadingOrders}
            title="Refresh Orders"
            className="p-1.5 rounded-lg bg-[#131a29] hover:bg-[#1a2336] border border-[#20293d] text-gray-400 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'ORDERS' ? (
        <div className="flex-1 overflow-y-auto mt-2.5 space-y-2 pr-0.5">
          {loadingOrders && orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading {symbol} orders...</span>
            </div>
          ) : ordersError ? (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{ordersError}</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-3">
              <BookOpen className="w-7 h-7 text-gray-600 mb-2" />
              <p className="text-xs text-gray-400 font-medium">
                No orders placed for <span className="text-white font-mono">{symbol}</span> yet.
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Executed Sandbox & GTT orders for this ticker appear here in real time.
              </p>
              {onExecuteOrder && (
                <button
                  type="button"
                  onClick={onExecuteOrder}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Place {symbol} Order
                </button>
              )}
            </div>
          ) : (
            orders.map((ord) => {
              const isBuy = String(ord.side).toUpperCase() === 'BUY';
              return (
                <div
                  key={ord.order_id || ord.id}
                  className="bg-[#0f1524] border border-[#1b2438] rounded-lg p-2.5 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {ord.side}
                      </span>
                      <span className="font-mono font-bold text-white">{ord.quantity} Qty</span>
                      <span className="text-[10px] font-mono text-gray-500">{ord.product}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161f32] text-gray-300 border border-[#232f48]">
                      {ord.status === 'AMO_EXECUTED' ? 'AMO Filled' : ord.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-400">Fill Price:</span>
                    <span className="text-white font-semibold">{formatINR(ord.price)}</span>
                  </div>

                  {(ord.target_price || ord.sl_price) && (
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#182134]">
                      <span className="text-emerald-400">
                        T1: {ord.target_price ? formatINR(ord.target_price) : '—'}
                      </span>
                      <span className="text-red-400">
                        SL: {ord.sl_price ? formatINR(ord.sl_price) : '—'}
                      </span>
                    </div>
                  )}

                  <div className="text-[10px] text-gray-500 font-mono truncate">
                    {ord.created_at
                      ? new Date(ord.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : ord.timestamp}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mt-2.5 flex flex-col justify-between gap-3">
          {/* Real Candle Volume Pressure */}
          <div className="bg-[#0f1524] border border-[#1b2438] rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-300">
                5m Intraday Volume Pressure
              </span>
              {loadingDepth && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
            </div>

            <div className="w-full h-2.5 bg-[#1b2336] rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${buyPct}%` }}
              ></div>
              <div
                className="bg-red-500 h-full transition-all"
                style={{ width: `${sellPct}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Buy Vol {buyPct}%
              </span>
              <span className="text-red-400 flex items-center gap-1">
                Sell Vol {sellPct}%
                <TrendingDown className="w-3 h-3" />
              </span>
            </div>

            <div className="text-[10px] text-gray-500 font-mono pt-1 border-t border-[#182134] flex justify-between">
              <span>Last LTP: {formatINR(ltp)}</span>
              <span>24 Bars (5m)</span>
            </div>
          </div>

          {/* Level 2 Order Book Notice */}
          <div className="bg-[#0f1524] border border-amber-500/25 rounded-lg p-3 text-center space-y-2 my-auto">
            <div className="w-9 h-9 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">
              {isLiveDemat ? 'Live Broker Depth Feed Ready' : 'Level 2 Depth Requires Live Broker'}
            </h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              {isLiveDemat
                ? '5-level Bid/Ask streaming activates during NSE live market hours (09:15 – 15:30 IST).'
                : 'Yahoo Finance provides OHLCV bars only. Connect Zerodha, DhanHQ, or Groww in Live mode for real-time 5-level Bids & Asks.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
