import React from 'react';
import { Activity, ShieldCheck, Wallet, RefreshCw, BarChart2, Bell, MessageSquare } from 'lucide-react';

export default function HeaderNavbar({
  market,
  demat,
  whatsAppPhone,
  onOpenWhatsAppModal,
  onOpenDemat,
  onOpenConnectBroker,
  onToggleMode
}) {
  const isMarketBullish = market.nifty_change_pct >= 0;
  const isSandbox = demat.mode === 'SANDBOX';

  return (
    <header className="bg-[#0b0f19] border-b border-[#1b2336] sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="w-full max-w-[1850px] mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Brand & Market Session */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 tracking-wider">
              91
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-base text-white tracking-tight">PULSE91</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#1e2638] text-gray-400">
                Quant
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#1f2738] text-xs whitespace-nowrap">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              market.is_market_open ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
            }`}></span>
            <span className={`font-medium ${market.is_market_open ? 'text-emerald-400' : 'text-gray-400'}`}>
              {market.is_market_open ? 'NSE LIVE' : 'NSE CLOSED'}
            </span>
            <span className="text-gray-600">|</span>
            <span className="font-mono text-gray-400 text-[11px]">
              {market.is_market_open ? '09:15 - 15:30 IST' : 'Opens 09:15 AM'}
            </span>
          </div>
        </div>

        {/* Live Index Tickers */}
        <div className="hidden lg:flex items-center gap-3 text-xs whitespace-nowrap shrink-0">
          <div className="flex items-center gap-2 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#1e2638]">
            <span className="text-gray-400 font-semibold text-[11px]">NIFTY 50</span>
            <span className="font-mono font-bold text-white">
              {market.nifty_50 ? market.nifty_50.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '25,884.50'}
            </span>
            <span className={`font-mono font-medium ${isMarketBullish ? 'text-emerald-400' : 'text-red-400'}`}>
              {isMarketBullish ? '+' : ''}{market.nifty_change_pct !== undefined && market.nifty_change_pct !== null ? market.nifty_change_pct : '+2.11'}%
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-2 bg-[#121824] px-3 py-1.5 rounded-lg border border-[#1e2638]">
            <span className="text-gray-400 font-semibold text-[11px]">FII/DII FLOW</span>
            <span className="font-mono text-emerald-400 font-medium">
              +{market.fii_dii_cr || '1,850'} Cr
            </span>
          </div>
        </div>

        {/* Demat Connect, WhatsApp Notifications & Portfolio Stats */}
        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          {/* Interactive WhatsApp Alerts Gateway Link */}
          <button
            onClick={onOpenWhatsAppModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all whitespace-nowrap shrink-0 ${
              whatsAppPhone
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#121824] hover:bg-[#1a2336] border-[#1e2638] text-gray-300 hover:text-white'
            }`}
            title="Configure or test WhatsApp Instant Trade Execution Receipts"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">
              {whatsAppPhone ? 'WhatsApp' : 'Link WhatsApp'}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#162235] text-emerald-400 border border-emerald-500/20 uppercase font-sans">
              {whatsAppPhone ? 'Active' : 'Setup'}
            </span>
          </button>

          {/* Connect Broker Button */}
          <button
            onClick={onOpenConnectBroker}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
              isSandbox
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isSandbox ? 'Sandbox (₹10k)' : `Live (${demat.broker || 'Groww'})`}</span>
          </button>

          {/* Demat Portfolio Pill */}
          <button
            onClick={onOpenDemat}
            className="flex items-center gap-2 bg-[#141a29] hover:bg-[#1a2336] border border-[#222b40] px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Wallet className="w-3.5 h-3.5 text-gray-400" />
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[11px] text-gray-400">Demat:</span>
              <span className="font-bold text-white text-xs">
                ₹{demat.net_worth ? Math.round(demat.net_worth).toLocaleString('en-IN') : '10,000'}
              </span>
              <span className={`text-[11px] font-medium ${
                (demat.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                ({(demat.unrealized_pnl || 0) >= 0 ? '+' : ''}₹{Math.round(demat.unrealized_pnl || 0).toLocaleString('en-IN')})
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
