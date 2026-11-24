import React from 'react';
import { Activity, ShieldCheck, Wallet, RefreshCw, BarChart2, Bell } from 'lucide-react';

export default function HeaderNavbar({ market, demat, onOpenDemat, onOpenConnectBroker, onToggleMode }) {
  const isMarketBullish = market.nifty_change_pct >= 0;
  const isSandbox = demat.mode === 'SANDBOX';

  return (
    <header className="bg-[#0b0f19] border-b border-[#1b2336] sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Market Session */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 tracking-wider">
              91
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">PULSE91</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#1e2638] text-gray-400">
                  Dalal Street Quant
                </span>
              </div>
              <p className="text-[11px] text-gray-500">Minervini VCP • CANSLIM • Demat Gateway</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#1f2738] text-xs">
            <span className={`w-2 h-2 rounded-full ${
              market.is_market_open ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
            }`}></span>
            <span className={`font-medium ${market.is_market_open ? 'text-emerald-400' : 'text-gray-400'}`}>
              {market.is_market_open ? 'NSE/BSE LIVE' : 'NSE/BSE CLOSED'}
            </span>
            <span className="text-gray-600">|</span>
            <span className="font-mono text-gray-400">
              {market.is_market_open ? '09:15 - 15:30 IST' : 'Opens 09:15 AM'}
            </span>
          </div>
        </div>

        {/* Live Index Tickers */}
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#1e2638]">
            <span className="text-gray-400 font-semibold">NIFTY 50</span>
            <span className="font-mono font-bold text-white">
              {market.nifty_50 ? market.nifty_50.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '24,280.50'}
            </span>
            <span className={`font-mono font-medium ${isMarketBullish ? 'text-emerald-400' : 'text-red-400'}`}>
              {isMarketBullish ? '+' : ''}{market.nifty_change_pct || '+0.42'}%
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#1e2638]">
            <span className="text-gray-400 font-semibold">FII/DII FLOW</span>
            <span className="font-mono text-emerald-400 font-medium">
              +{market.fii_dii_cr || '1,850'} Cr
            </span>
          </div>
        </div>

        {/* Demat Connect, WhatsApp Notifications & Portfolio Stats */}
        <div className="flex items-center gap-2.5">
          {/* WhatsApp Execution Alerts Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121824] border border-[#1e2638] text-[11px] text-gray-400 font-mono" title="Automated WhatsApp alerts are triggered whenever any buy or sell deal executes">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-300">WhatsApp Alerts:</span>
            <span className="text-emerald-400 font-semibold">+91 98765 43210</span>
          </div>

          {/* Connect Broker Button */}
          <button
            onClick={onOpenConnectBroker}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSandbox
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSandbox ? 'Sandbox (₹10L)' : `Live (${demat.broker || 'Groww'})`}</span>
            <span className="text-[10px] text-gray-400 underline ml-0.5 font-normal">Connect</span>
          </button>

          {/* Demat Portfolio Pill */}
          <button
            onClick={onOpenDemat}
            className="flex items-center gap-2 bg-[#141a29] hover:bg-[#1a2336] border border-[#222b40] px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 text-gray-400" />
            <div className="text-left">
              <span className="text-[10px] text-gray-400 block leading-tight">DEMAT WORTH</span>
              <span className="font-mono font-bold text-white text-xs">
                ₹{demat.net_worth ? demat.net_worth.toLocaleString('en-IN') : '10,00,000'}
              </span>
            </div>
            <span className={`text-[11px] font-mono font-medium pl-1 ${
              (demat.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(demat.unrealized_pnl || 0) >= 0 ? '+' : ''}₹{Math.round(demat.unrealized_pnl || 0).toLocaleString('en-IN')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
