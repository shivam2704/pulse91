import React, { useState, useEffect } from 'react';
import { X, MessageSquare, ShieldCheck, Check, Send, ExternalLink, Bell, Smartphone, Settings } from 'lucide-react';

export default function WhatsAppConfigModal({
  isOpen,
  onClose,
  currentPhone,
  onUpdatePhone
}) {
  if (!isOpen) return null;

  const [phoneNumber, setPhoneNumber] = useState(
    currentPhone ? currentPhone.replace(/^\+91/, '') : (localStorage.getItem('pulse91_whatsapp_phone')?.replace(/^\+91/, '') || '')
  );
  const [notifyBuySell, setNotifyBuySell] = useState(true);
  const [notifyTargets, setNotifyTargets] = useState(true);
  const [notifyMorning, setNotifyMorning] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [testPreview, setTestPreview] = useState(null);

  const cleanPhoneFull = phoneNumber.trim() ? (phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+91${phoneNumber.trim()}`) : '';

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      if (!phoneNumber.trim()) {
        localStorage.removeItem('pulse91_whatsapp_phone');
        onUpdatePhone('');
        await fetch('/api/v1/alerts/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: '' })
        });
        setStatusMessage({ type: 'success', text: 'WhatsApp notifications disabled.' });
        setTimeout(() => onClose(), 800);
        return;
      }

      const res = await fetch('/api/v1/alerts/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: cleanPhoneFull })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('pulse91_whatsapp_phone', cleanPhoneFull);
        onUpdatePhone(cleanPhoneFull);
        setStatusMessage({ type: 'success', text: `WhatsApp linked to ${cleanPhoneFull}!` });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to link WhatsApp.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to backend alert router.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!phoneNumber.trim()) {
      setStatusMessage({ type: 'error', text: 'Enter a mobile number to receive a test alert.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/v1/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: cleanPhoneFull })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Test alert dispatched to ${cleanPhoneFull}!` });
        setTestPreview(data.preview);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to send test alert.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not reach alert engine.' });
    } finally {
      setIsTesting(false);
    }
  };

  const openWhatsAppDirect = () => {
    if (cleanPhoneFull) {
      const cleanNum = cleanPhoneFull.replace('+', '');
      window.open(`https://wa.me/${cleanNum}?text=Pulse91%20Terminal%20Connected%20Successfully!`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c101a] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Link WhatsApp Gateway
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-normal">
                  Realtime Receipts
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Automated trade notifications dispatched directly to your mobile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-mono border flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/15 border-red-500/40 text-red-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Mobile Number Input */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-4 space-y-2">
            <label className="text-gray-300 font-semibold block flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              WhatsApp Mobile Number
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#181f30] border border-[#27324a] rounded-lg px-3 py-2 text-gray-400 font-mono text-xs">
                <span>🇮🇳 +91</span>
              </div>
              <input
                type="tel"
                placeholder="98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-[#181f30] border border-[#27324a] rounded-lg px-3 py-2 font-mono text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-gray-500 font-mono">
              Enter your 10-digit Indian mobile number connected to WhatsApp.
            </p>
          </div>

          {/* Alert Toggles */}
          <div className="bg-[#121724] border border-[#1e2838] rounded-xl p-4 space-y-2.5">
            <span className="text-gray-300 font-semibold block flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              Alert Dispatch Preferences
            </span>
            <div className="space-y-2 text-[11px]">
              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={notifyBuySell}
                  onChange={(e) => setNotifyBuySell(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span>Instant Deal Fill Receipts (Buy & Sell executions with exact price & qty)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={notifyTargets}
                  onChange={(e) => setNotifyTargets(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span>Target 1 & Stop-Loss Dynamic ATR Automated Triggers</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-gray-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={notifyMorning}
                  onChange={(e) => setNotifyMorning(e.target.checked)}
                  className="rounded accent-emerald-500 cursor-pointer"
                />
                <span>Pre-Market 09:15 AM High-Confluence Momentum Watchlist</span>
              </label>
            </div>
          </div>

          {/* Test Preview Box (If triggered) */}
          {testPreview && (
            <div className="bg-[#090d16] border border-[#1a2336] rounded-xl p-3 font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
              <div className="text-[10px] text-emerald-400 font-bold uppercase pb-1 mb-1 border-b border-[#1b2336] flex items-center justify-between">
                <span>WhatsApp Message Preview</span>
                <span className="text-gray-500">SEBI Hardware Fault-Safe</span>
              </div>
              {testPreview}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#1b2336]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isTesting || !phoneNumber.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#161d2d] hover:bg-[#20293d] border border-[#27324a] text-gray-200 hover:text-white font-semibold transition-all disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isTesting ? 'Sending...' : '⚡ Send Test Alert'}</span>
              </button>

              {cleanPhoneFull && (
                <button
                  type="button"
                  onClick={openWhatsAppDirect}
                  className="flex items-center justify-center p-2 rounded-xl bg-[#161d2d] hover:bg-[#20293d] border border-[#27324a] text-emerald-400 hover:text-emerald-300 transition-all"
                  title="Open chat in WhatsApp Web"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving || !phoneNumber.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg disabled:opacity-40"
            >
              {isSaving ? 'Linking...' : 'Save & Link WhatsApp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
