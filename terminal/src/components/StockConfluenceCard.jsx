import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Target, ArrowRight, TrendingUp, Layers, Percent, BarChart3, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StockCandleChart from './StockCandleChart';
import StockOrderBookPanel from './StockOrderBookPanel';
import { formatINR, formatBuyZone, formatHorizon } from '../utils/formatters';

export default function StockConfluenceCard({
  stockData,
  dematMode,
  onExecuteOrder,
  onOpenWhatsApp,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) {
  if (!stockData) return null;

  const { symbol, company_name, sector, ltp, confluence_score, verdict, horizon_name, conviction_rate, trade_plan, pillars, minervini_vcp, trend_template, canslim, stockbee } = stockData;
  const isStrong = verdict === 'STRONG BUY';

  return (
    <div className="bg-[#0c101a] border border-[#1d263a] rounded-xl p-5 mb-6 shadow-2xl">
      {/* Top Banner with Navigation & Close */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2336]">
        <div className="flex items-center gap-3">
          {(onPrev || onNext) && (
            <div className="flex items-center bg-[#141a29] border border-[#20283d] rounded-lg p-0.5 mr-1">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Stock"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Stock"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xl text-white">{symbol}</span>
              <span className="text-sm text-gray-400 font-medium">— {company_name}</span>
              <span className="text-xs bg-[#161d2d] text-gray-400 border border-[#222b40] px-2 py-0.5 rounded">
                {sector}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span>LTP: <strong className="font-mono text-white text-sm">{formatINR(ltp)}</strong></span>
              <span>•</span>
              <span>Horizon: <strong className="text-gray-200">{formatHorizon(horizon_name)}</strong></span>
            </div>
          </div>
        </div>

        {/* Score & Verdict Header & Close */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">5-Pillar Score</div>
            <div className="flex items-center gap-1 justify-end font-mono">
              <span className="text-2xl font-bold text-white">{confluence_score}</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">{conviction_rate}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-center ${
              isStrong ? 'badge-strong-buy' : 'badge-momentum-buy'
            }`}>
              {verdict}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onExecuteOrder(stockData)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                1-Click Buy
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-gray-400 bg-[#141b2a] border border-[#20293d] px-2 py-1 rounded font-mono">
                📱 Auto WhatsApp on Fill
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#222d42] text-gray-400 hover:text-white transition-colors ml-2"
              title="Close Deep-Dive"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Trade Execution Plan Card */}
      <div className="bg-[#111726] border border-[#1e283d] rounded-lg p-3.5 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-gray-400 block text-[11px]">Recommended Buy Zone</span>
          <span className="font-mono font-bold text-white text-xs">{formatBuyZone(trade_plan?.entry_range, ltp)}</span>
        </div>
        <div>
          <span className="text-gray-400 block text-[11px]">Stop-Loss Level</span>
          <span className="font-mono font-bold text-red-400 text-xs">
            {formatINR(trade_plan?.stop_loss_price)} (-{Number(trade_plan?.stop_loss_pct || 0).toFixed(2)}%)
          </span>
        </div>
        <div>
          <span className="text-gray-400 block text-[11px]">Target 1 (1:2 R:R)</span>
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {formatINR(trade_plan?.target_1_price)} (+{Number(trade_plan?.target_1_pct || 0).toFixed(2)}%)
          </span>
        </div>
        <div>
          <span className="text-gray-400 block text-[11px]">Target 2 (1:3.2 R:R)</span>
          <span className="font-mono font-bold text-emerald-400 text-xs">
            {formatINR(trade_plan?.target_2_price)} (+{Number(trade_plan?.target_2_pct || 0).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* TradingView Lightweight Candlestick Chart + Orders & Depth Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="lg:col-span-2">
          <StockCandleChart
            symbol={symbol}
            ltp={ltp}
            tradePlan={{
              target_1: trade_plan?.target_1_price,
              target_2: trade_plan?.target_2_price,
              stop_loss_price: trade_plan?.stop_loss_price
            }}
            vcpData={minervini_vcp}
          />
        </div>
        <div className="lg:col-span-1">
          <StockOrderBookPanel
            symbol={symbol}
            ltp={ltp}
            dematMode={dematMode}
            onExecuteOrder={() => onExecuteOrder && onExecuteOrder(stockData)}
          />
        </div>
      </div>

      {/* 5-Pillar Scorecard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4 text-xs">
        {/* Pillar 1 */}
        <div className="bg-[#0f1422] border border-[#1b2336] rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336] mb-2">
            <span className="text-gray-400 font-semibold text-[11px]">1. Market Regime</span>
            <span className="font-mono font-bold text-white">{pillars?.pillar_1_market_regime?.score}/20</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-1">
            <p className="text-emerald-400 font-medium">
              ✓ {pillars?.pillar_1_market_regime?.details?.nifty_trend}
            </p>
            <p className="text-gray-400">
              Strength: {pillars?.pillar_1_market_regime?.details?.trend_strength}
            </p>
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-[#0f1422] border border-[#1b2336] rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336] mb-2">
            <span className="text-gray-400 font-semibold text-[11px]">2. Sector RS</span>
            <span className="font-mono font-bold text-white">{pillars?.pillar_2_sector_momentum?.score}/20</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-1">
            <p className="text-emerald-400 font-medium">
              ✓ RS: {pillars?.pillar_2_sector_momentum?.details?.relative_strength_vs_nifty}x vs Nifty
            </p>
            <p className="text-gray-400 text-[10px]">
              {pillars?.pillar_2_sector_momentum?.details?.quadrant}
            </p>
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-[#0f1422] border border-[#1b2336] rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336] mb-2">
            <span className="text-gray-400 font-semibold text-[11px]">3. Technicals</span>
            <span className="font-mono font-bold text-white">{pillars?.pillar_3_technical_structure?.score}/25</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-1">
            <p className="text-emerald-400 font-medium">
              ✓ {pillars?.pillar_3_technical_structure?.details?.supertrend}
            </p>
            <p className="text-gray-400">
              RSI: {pillars?.pillar_3_technical_structure?.details?.rsi_14}
            </p>
            <p className="text-gray-400">
              Volume: {pillars?.pillar_3_technical_structure?.details?.volume_surge}
            </p>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-[#0f1422] border border-[#1b2336] rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336] mb-2">
            <span className="text-gray-400 font-semibold text-[11px]">4. Delivery / F&O</span>
            <span className="font-mono font-bold text-white">{pillars?.pillar_4_institutional_footprint?.score}/20</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-1">
            <p className="text-emerald-400 font-medium">
              ✓ Delivery: {pillars?.pillar_4_institutional_footprint?.details?.delivery_percentage}
            </p>
            <p className="text-gray-400">
              PCR: {pillars?.pillar_4_institutional_footprint?.details?.option_pcr}
            </p>
          </div>
        </div>

        {/* Pillar 5 */}
        <div className="bg-[#0f1422] border border-[#1b2336] rounded-lg p-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b2336] mb-2">
            <span className="text-gray-400 font-semibold text-[11px]">5. Fundamentals</span>
            <span className="font-mono font-bold text-white">{pillars?.pillar_5_fundamental_health?.score}/15</span>
          </div>
          <div className="text-[11px] text-gray-300 space-y-1">
            <p className="text-emerald-400 font-medium">
              ✓ YoY PAT: {pillars?.pillar_5_fundamental_health?.details?.pat_growth_yoy}
            </p>
            <p className="text-gray-400 text-[10px]">
              {pillars?.pillar_5_fundamental_health?.details?.earnings_calendar}
            </p>
          </div>
        </div>
      </div>

      {/* Minervini VCP & CANSLIM Reverse-Engineered Section */}
      <div className="mt-4 pt-4 border-t border-[#1b2336] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* VCP Box */}
        <div className="bg-[#111726] border border-[#20293d] rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
              Mark Minervini VCP
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
              {minervini_vcp?.execution_state || 'READY'}
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-gray-300">
            <p><strong>Contractions:</strong> <span className="font-mono text-white">{minervini_vcp?.contractions}</span></p>
            <p><strong>Pivot Buy Point:</strong> <span className="font-mono text-emerald-400 font-bold">₹{minervini_vcp?.pivot_buy_point}</span></p>
            <p className="text-gray-400 text-[10px]">{minervini_vcp?.volume_dryup_pct}</p>
          </div>
        </div>

        {/* Trend Template Box */}
        <div className="bg-[#111726] border border-[#20293d] rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-blue-400 text-[11px] uppercase tracking-wider">
              8-Point Trend Template
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold">
              {trend_template?.passed_criteria_count} Passed
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-gray-300">
            <p><strong>Stage:</strong> <span className="text-white">{trend_template?.is_stage_2_uptrend ? 'Confirmed Stage 2 Uptrend' : 'Stage 1 Base'}</span></p>
            <p><strong>Relative Strength Rank:</strong> <span className="font-mono text-emerald-400 font-bold">{trend_template?.rs_rank}/99</span></p>
            <p className="text-gray-400 text-[10px]">+{trend_template?.pct_above_52w_low}% above 52w low</p>
          </div>
        </div>

        {/* CANSLIM & Stockbee Box */}
        <div className="bg-[#111726] border border-[#20293d] rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
              {"William O'Neil CANSLIM"}
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
              {canslim?.canslim_composite_score}/100
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-gray-300">
            <p><strong>Quarterly Growth:</strong> <span className="text-emerald-400 font-mono font-bold">{canslim?.quarterly_eps_growth}</span></p>
            <p><strong>Rating:</strong> <span className="text-white">{canslim?.canslim_grade}</span></p>
            <p className="text-gray-400 text-[10px]">{stockbee?.setup_type}: {stockbee?.volume_multiple}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
