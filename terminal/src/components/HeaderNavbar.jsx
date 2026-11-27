import React from 'react';
import { Activity, ShieldCheck, Wallet, RefreshCw, BarChart2, Bell, MessageSquare, Loader2, User } from 'lucide-react';

export default function HeaderNavbar({
  market,
  demat,
  whatsAppPhone,
  onOpenWhatsAppModal,
  onOpenDemat,
  onOpenConnectBroker,
  onOpenNiftyChart,
  currentUser,
  onOpenAuthModal
}) {
  const isMarketBullish = (market?.nifty_change_pct ?? 0) >= 0;
  const isSandbox = demat?.mode === 'SANDBOX';

  return (
    <header className="bg-[#0b0f19] border-b border-[#1b2336] sticky top-0 z-40 px-2 sm:px-4 py-2 select-none w-full">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand & Market Session Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0d1422] border border-emerald-500/40 flex items-center justify-center shadow-sm shadow-emerald-500/10">
              <svg className="w-4 h-4" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M8 38H18L24 23L31 46L39 17L45 32H56" stroke="#34d399" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="56" cy="32" r="4" fill="#10b981"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-base text-white tracking-tight">PULSE91</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#1e2638] text-gray-400">
                Quant
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2.5 border-l border-[#1f2738] text-xs whitespace-nowrap">
            {market ? (
              <>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  market.is_market_open ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}></span>
                <span className={`font-medium ${market.is_market_open ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {market.is_market_open ? 'NSE LIVE' : 'NSE CLOSED'}
                </span>
                <span className="hidden md:inline text-gray-600">|</span>
                <span className="hidden md:inline font-mono text-gray-400 text-[11px]">
                  {market.is_market_open ? '09:15 - 15:30' : 'Opens 09:15 AM'}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></span>
                <span className="text-gray-400 font-mono text-[11px]">Connecting...</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Index Tickers (Middle) */}
        <div className="hidden xl:flex items-center gap-2 text-xs whitespace-nowrap">
          <button
            type="button"
            onClick={onOpenNiftyChart}
            title="Click to view NIFTY 50 Benchmark Interactive Candlestick Chart"
            className="flex items-center gap-2 bg-[#121824] hover:bg-[#151f33] px-2.5 py-1.5 rounded-lg border border-[#1e2638] hover:border-emerald-500/50 transition-all cursor-pointer group text-left shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              <span className="text-gray-400 group-hover:text-gray-200 font-semibold text-[11px] transition-colors">NIFTY 50</span>
            </div>
            {market?.nifty_50 ? (
              <>
                <span className="font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {Number(market.nifty_50).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className={`font-mono font-medium ${isMarketBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isMarketBullish ? '+' : ''}{market.nifty_change_pct}%
                </span>
              </>
            ) : (
              <div className="w-20 h-4 bg-[#1b2336] rounded animate-pulse"></div>
            )}
          </button>

          <div 
            className="hidden 2xl:flex items-center gap-2 bg-[#121824] hover:bg-[#151f33] px-2.5 py-1.5 rounded-lg border border-[#1e2638] hover:border-emerald-500/30 transition-all cursor-help"
            title={market?.fii_cr != null && market?.dii_cr != null ? `FII: ₹${Number(market.fii_cr).toLocaleString('en-IN')} Cr | DII: ₹${Number(market.dii_cr).toLocaleString('en-IN')} Cr` : 'Institutional Flow'}
          >
            <span className="text-gray-400 font-semibold text-[11px]">FII/DII</span>
            {market?.fii_dii_cr != null ? (
              <span className={`font-mono font-medium ${Number(market.fii_dii_cr) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Number(market.fii_dii_cr) >= 0 ? '+' : ''}{Number(market.fii_dii_cr).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
              </span>
            ) : (
              <div className="w-14 h-4 bg-[#1b2336] rounded animate-pulse"></div>
            )}
          </div>
        </div>

        {/* Right Section: WhatsApp, Demat, Mode & User Authentication */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap ml-auto">
          {/* Alerts Link */}
          <button
            onClick={onOpenWhatsAppModal}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all whitespace-nowrap shrink-0 ${
              whatsAppPhone
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#121824] hover:bg-[#1a2336] border-[#1e2638] text-gray-400 hover:text-white'
            }`}
            title="Configure WhatsApp Trade Notifications"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${whatsAppPhone ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span className="hidden 2xl:inline">
              {whatsAppPhone ? 'WhatsApp' : 'Alerts'}
            </span>
          </button>

          {/* Sandbox / Live Mode Switcher */}
          {demat ? (
            <button
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal?.();
                } else {
                  onOpenConnectBroker?.();
                }
              }}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                isSandbox
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
              }`}
              title={isSandbox ? (!currentUser ? 'Guest Mode: Sign in to connect real Demat broker' : 'Click to connect real broker') : 'Live Demat Connected'}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isSandbox ? 'Sandbox' : `Live (${demat.broker || 'Groww'})`}</span>
            </button>
          ) : (
            <div className="w-16 h-7 bg-[#121824] border border-[#1e2638] rounded-lg animate-pulse"></div>
          )}

          {/* Demat Portfolio Pill */}
          {demat ? (
            <button
              onClick={onOpenDemat}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#141a29] hover:bg-[#1a2336] border border-[#222b40] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0"
              title={`Net Worth: ₹${Number(demat.account_net_worth || demat.net_worth || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} | Available Cash: ₹${Number(demat.available_cash || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} | Invested: ₹${Number(demat.invested_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} — Click for full breakdown`}
            >
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[11px] text-gray-400 hidden sm:inline">Demat:</span>
                <span className="font-bold text-white text-xs">
                  ₹{Math.round(demat.account_net_worth || demat.net_worth || 0).toLocaleString('en-IN')}
                </span>
                <span className={`hidden 2xl:inline text-[11px] font-medium ${
                  (demat.total_unrealized_pnl || demat.unrealized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  ({(demat.total_unrealized_pnl || demat.unrealized_pnl || 0) >= 0 ? '+' : ''}₹{Math.round(demat.total_unrealized_pnl || demat.unrealized_pnl || 0).toLocaleString('en-IN')})
                </span>
              </div>
            </button>
          ) : (
            <div className="w-24 h-7 bg-[#121824] border border-[#1e2638] rounded-lg animate-pulse"></div>
          )}

          {/* User Authentication Pill - Anchored with guaranteed right-side padding */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all whitespace-nowrap shrink-0 ml-1 ${
              currentUser
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-emerald-300 font-semibold shadow-sm'
            }`}
            title={currentUser ? `Signed in as ${currentUser.email}` : 'Sign in to sync your portfolio'}
          >
            {currentUser ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[90px] truncate">{currentUser.email?.split('@')[0]}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
