import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { BarChart2, RefreshCw, Eye, EyeOff, RotateCcw } from 'lucide-react';

export default function StockCandleChart({ symbol, ltp, tradePlan, vcpData }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const ma20SeriesRef = useRef(null);
  const priceLinesRef = useRef([]);
  const initialFitDoneRef = useRef(false);

  const [candles, setCandles] = useState([]);
  const [timeframe, setTimeframe] = useState('D');
  const [loading, setLoading] = useState(false);
  const [hoverData, setHoverData] = useState(null);
  const [showOverlays, setShowOverlays] = useState(true);

  // 1. Fetch candle data whenever symbol or timeframe changes
  useEffect(() => {
    if (!symbol) return;
    initialFitDoneRef.current = false; // Reset fit lock on symbol or timeframe switch
    let isMounted = true;
    setLoading(true);

    fetch(`/api/v1/scan/candles/${symbol}?timeframe=${timeframe}&count=60`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.candles) {
          setCandles(data.candles);
        }
      })
      .catch((err) => console.warn('Candle fetch error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  // 2. Initialize Lightweight Chart ONCE per symbol lifecycle (NEVER destroy on state/prop updates!)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    // Remove any previous instance cleanly
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {}
      chartRef.current = null;
    }

    try {
      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#090d16' },
          textColor: '#64748b',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace, -apple-system'
        },
        grid: {
          vertLines: { color: 'rgba(30, 41, 59, 0.4)', style: 1 },
          horzLines: { color: 'rgba(30, 41, 59, 0.4)', style: 1 }
        },
        crosshair: {
          vertLine: { color: '#38bdf8', width: 1, style: 2, labelBackgroundColor: '#0284c7' },
          horzLine: { color: '#38bdf8', width: 1, style: 2, labelBackgroundColor: '#0284c7' }
        },
        timeScale: {
          borderColor: '#1e293b',
          timeVisible: true,
          secondsVisible: false
        },
        rightPriceScale: {
          borderColor: '#1e293b',
          autoScale: true,
          scaleMargins: {
            top: 0.08,
            bottom: 0.22 // Leave bottom 22% empty for volume subpanel
          }
        },
        width: container.clientWidth || 600,
        height: 380
      });

      chartRef.current = chart;

      // Candlestick Series
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444'
      });
      candleSeriesRef.current = candleSeries;

      // Volume Series (Confined strictly to bottom 18% with hidden scale)
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume_scale'
      });
      chart.priceScale('volume_scale').applyOptions({
        visible: false,
        scaleMargins: {
          top: 0.82,
          bottom: 0
        }
      });
      volumeSeriesRef.current = volumeSeries;

      // 20-DMA Line Series
      const ma20Series = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 1.5,
        title: '20-SMA'
      });
      ma20SeriesRef.current = ma20Series;

      // Crosshair Hover Listener
      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || !param.seriesData) {
          setHoverData(null);
          return;
        }
        const data = param.seriesData.get(candleSeries);
        const vol = param.seriesData.get(volumeSeries);
        if (data) {
          setHoverData({
            time: param.time,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: vol ? vol.value : null
          });
        }
      });

      const handleResize = () => {
        if (chartRef.current && container) {
          chartRef.current.applyOptions({ width: container.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {}
          chartRef.current = null;
        }
      };
    } catch (err) {
      console.error('Chart initialization error:', err);
    }
  }, [symbol]); // Only re-instantiate when the selected stock symbol changes!

  // 3. Update Candle and Volume Data without wiping zoom / scroll positions
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const formattedCandles = sorted.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    const formattedVolumes = sorted.map((c) => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolumes);

    if (ma20SeriesRef.current && formattedCandles.length > 20) {
      const ma20Data = [];
      for (let i = 19; i < formattedCandles.length; i++) {
        const slice = formattedCandles.slice(i - 19, i + 1);
        const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 20;
        ma20Data.push({ time: formattedCandles[i].time, value: Number(avg.toFixed(2)) });
      }
      ma20SeriesRef.current.setData(ma20Data);
    }

    // Only fit content on INITIAL data load per symbol/timeframe so user zoom/pan is never wiped!
    if (chartRef.current && !initialFitDoneRef.current && formattedCandles.length > 0) {
      chartRef.current.timeScale().fitContent();
      initialFitDoneRef.current = true;
    }
  }, [candles]);

  // 4. Update Price Lines (Pivot, T1, SL) dynamically with explicit % badges
  const pivotBuy = vcpData?.pivot_buy_point;
  const target1 = tradePlan?.target_1_price || tradePlan?.target_1;
  const target2 = tradePlan?.target_2_price || tradePlan?.target_2;
  const stopLoss = tradePlan?.stop_loss_price;

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    const series = candleSeriesRef.current;

    // Clear existing price lines
    priceLinesRef.current.forEach((line) => {
      try {
        series.removePriceLine(line);
      } catch (e) {}
    });
    priceLinesRef.current = [];

    if (!showOverlays) return;

    const basePrice = ltp || (candles.length > 0 ? candles[candles.length - 1].close : null);

    // Pivot Line
    if (pivotBuy) {
      const pct = basePrice ? (((pivotBuy - basePrice) / basePrice) * 100).toFixed(1) : null;
      const pctLabel = pct !== null ? ` (${Number(pct) >= 0 ? '+' : ''}${pct}%)` : '';
      const line = series.createPriceLine({
        price: pivotBuy,
        color: '#06b6d4',
        lineWidth: 1.5,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `PIVOT${pctLabel}`
      });
      priceLinesRef.current.push(line);
    }

    // Target 1 Line
    if (target1) {
      const pct = basePrice ? (((target1 - basePrice) / basePrice) * 100).toFixed(1) : null;
      const pctLabel = pct !== null ? ` (+${Math.abs(Number(pct))}%)` : '';
      const line = series.createPriceLine({
        price: target1,
        color: '#10b981',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `T1${pctLabel}`
      });
      priceLinesRef.current.push(line);
    }

    // Target 2 Line
    if (target2) {
      const pct = basePrice ? (((target2 - basePrice) / basePrice) * 100).toFixed(1) : null;
      const pctLabel = pct !== null ? ` (+${Math.abs(Number(pct))}%)` : '';
      const line = series.createPriceLine({
        price: target2,
        color: '#34d399',
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: true,
        title: `T2${pctLabel}`
      });
      priceLinesRef.current.push(line);
    }

    // Stop Loss Line
    if (stopLoss) {
      const pct = basePrice ? (((stopLoss - basePrice) / basePrice) * 100).toFixed(1) : null;
      const pctLabel = pct !== null ? ` (-${Math.abs(Number(pct))}%)` : '';
      const line = series.createPriceLine({
        price: stopLoss,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: `SL${pctLabel}`
      });
      priceLinesRef.current.push(line);
    }
  }, [showOverlays, pivotBuy, target1, target2, stopLoss, ltp, candles]);

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const latestCandle = candles[candles.length - 1];
  const displayO = hoverData?.open ?? latestCandle?.open;
  const displayH = hoverData?.high ?? latestCandle?.high;
  const displayL = hoverData?.low ?? latestCandle?.low;
  const displayC = hoverData?.close ?? latestCandle?.close ?? ltp;
  const displayV = hoverData?.volume ?? latestCandle?.volume;

  return (
    <div className="bg-[#090d16] border border-[#1b2336] rounded-xl p-4 my-3">
      {/* Top Bar with Timeframe & Clean Overlay Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#161f30]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              {symbol} Candlestick & Volume
            </span>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#131a29] border border-[#20293d] rounded-lg p-0.5">
            {['15m', '1H', 'D', 'W'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Toggle Overlays */}
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
              showOverlays
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-[#141a29] border-[#222b40] text-gray-500'
            }`}
            title="Toggle Quant Breakout Pivot and Target lines"
          >
            {showOverlays ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{showOverlays ? 'Pivot & SL On' : 'Clean Price Only'}</span>
          </button>

          {/* Reset Zoom Button */}
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#141a29] hover:bg-[#1e273d] border border-[#222b40] text-gray-400 hover:text-white transition-all"
            title="Reset chart zoom to fit all candles"
          >
            <RotateCcw className="w-3 h-3 text-gray-400" />
            <span>Reset Zoom</span>
          </button>
        </div>

        {/* OHLC Readout */}
        <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
          <div>O: <span className="text-white">₹{displayO?.toLocaleString('en-IN') ?? '—'}</span></div>
          <div>H: <span className="text-emerald-400">₹{displayH?.toLocaleString('en-IN') ?? '—'}</span></div>
          <div>L: <span className="text-red-400">₹{displayL?.toLocaleString('en-IN') ?? '—'}</span></div>
          <div>C: <span className="text-white font-bold">₹{displayC?.toLocaleString('en-IN') ?? '—'}</span></div>
          {displayV && (
            <div className="hidden md:block">
              Vol: <span className="text-gray-300">{(displayV / 100000).toFixed(1)}L</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full mt-3">
        {loading && (
          <div className="absolute inset-0 bg-[#090d16]/70 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading chart...
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-[360px]" />
      </div>

      {/* Clean Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-2 border-t border-[#141b2b] text-[10px] text-gray-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#f59e0b] rounded"></span> 20-DMA
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#06b6d4] border-t border-dashed border-[#06b6d4]"></span> VCP Breakout Pivot
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#10b981] border-t border-dotted border-[#10b981]"></span> Target 1
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#f43f5e] border-t border-dashed border-[#f43f5e]"></span> Stop Loss
          </span>
        </div>
        <span className="text-gray-500 font-mono">Volume pinned to subpanel • Zero price collision</span>
      </div>
    </div>
  );
}
