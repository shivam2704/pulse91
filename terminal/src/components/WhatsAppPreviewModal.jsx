import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, Send } from 'lucide-react';

export default function WhatsAppPreviewModal({
  isOpen,
  onClose,
  stock,
  onSendWhatsApp
}) {
  if (!isOpen || !stock) return null;

  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(localStorage.getItem('pulse91_whatsapp_phone') || '');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const { symbol, company_name, ltp, confluence_score, verdict, horizon_name, trade_plan, pillars } = stock;
  const p1 = pillars?.pillar_1_market_regime?.details?.nifty_trend || 'Bullish';
  const p2 = pillars?.pillar_2_sector_momentum?.details?.summary || '';
  const p3 = pillars?.pillar_3_technical_structure?.details?.volume_surge || '';
  const p4 = pillars?.pillar_4_institutional_footprint?.details?.delivery_percentage || '';

  const messageText = `📊 *PULSE91 DALAL STREET ALERT*
━━━━━━━━━━━━━━━━━━━━
🎯 *${symbol}* — ${company_name}
*LTP:* ₹${ltp?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
*Verdict:* *${verdict}* (Score: ${confluence_score}/100)
*Time Horizon:* ${horizon_name}

📈 *TRADE EXECUTION PLAN:*
• *Buy Zone:* ${trade_plan?.entry_range}
• *Stop-Loss:* ₹${Number(trade_plan?.stop_loss_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (-${trade_plan?.stop_loss_pct}%)
• *Target 1:* ₹${Number(trade_plan?.target_1_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+${trade_plan?.target_1_pct}%)
• *Target 2:* ₹${Number(trade_plan?.target_2_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+${trade_plan?.target_2_pct}%)
• *Risk/Reward:* ${trade_plan?.risk_reward_ratio}

🔍 *5-PILLAR CONFLUENCE PROOFS:*
✅ *Market:* ${p1}
✅ *Sector RS:* ${p2}
✅ *Technicals:* Volume ${p3}
✅ *Delivery:* ${p4}
━━━━━━━━━━━━━━━━━━━━
⚡ *Pulse91 Terminal:* Execute in 1-Click via Demat`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    setSending(true);
    await onSendWhatsApp(symbol, phone);
    setSending(false);
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">WhatsApp Trade Alert Preview</h3>
              <p className="text-xs text-gray-400 font-mono">{symbol} High-Confluence Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview Box */}
        <div className="mt-4 bg-[#080b11] border border-[#1b2336] rounded-xl p-4 font-mono text-xs text-gray-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {messageText}
        </div>

        {/* Dispatch Controls */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter mobile number (optional)..."
              className="flex-1 bg-[#141a29] border border-[#222b40] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none placeholder:text-gray-500"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-[#161d2d] hover:bg-[#1e273d] text-gray-200 border border-[#253047] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
              title="Copy formatted alert to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {sentSuccess ? '✓ Alert Queued for WhatsApp Dispatch' : sending ? 'Dispatching...' : phone.trim() ? 'Dispatch Live WhatsApp Alert' : 'Enter Number Above to Dispatch Alert'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
