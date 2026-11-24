import React, { useState } from 'react';
import { X, ShieldCheck, Key, Lock, ArrowRight, ExternalLink, CheckCircle, AlertCircle, User, Smartphone } from 'lucide-react';

const BROKERS_CONFIG = {
  Groww: {
    id: 'Groww',
    name: 'Groww Trade API',
    tagline: 'Official growwapi SDK (API Key + Secret)',
    portalUrl: 'https://groww.in/trade-api',
    helpGuide: 'Go to groww.in/trade-api -> Generate API Key & Secret. The token exchange happens dynamically.',
    fields: [
      { key: 'apiKey', label: 'Groww API Key (JWT Header)', placeholder: 'Paste eyJraWQiOi... token', type: 'text', icon: Key },
      { key: 'apiSecret', label: 'Groww API Secret', placeholder: 'Paste 32-char Secret Key', type: 'password', icon: Lock }
    ]
  },
  DhanHQ: {
    id: 'DhanHQ',
    name: 'DhanHQ API v2',
    tagline: 'Official dhanhq SDK (Client ID + Permanent Access Token)',
    portalUrl: 'https://dhanhq.co',
    helpGuide: 'Dhan Mobile/Web -> Profile -> Access DhanHQ API -> Generate Access Token.',
    fields: [
      { key: 'clientId', label: 'Dhan Client ID', placeholder: 'e.g. 1000123456', type: 'text', icon: User },
      { key: 'accessToken', label: 'Dhan Access Token (JWT)', placeholder: 'Paste generated DhanHQ Access Token...', type: 'password', icon: Key }
    ]
  },
  Zerodha: {
    id: 'Zerodha',
    name: 'Zerodha Kite Connect',
    tagline: 'Official kiteconnect v3 (API Key + Access / Request Token)',
    portalUrl: 'https://kite.trade',
    helpGuide: 'kite.trade -> Create App -> Copy API Key, Secret and morning Access Token.',
    fields: [
      { key: 'apiKey', label: 'Kite API Key', placeholder: 'e.g. 2s8f09d8f...', type: 'text', icon: Key },
      { key: 'accessToken', label: 'Kite Access Token (or Daily Request Token)', placeholder: 'Paste daily access_token...', type: 'password', icon: Lock },
      { key: 'apiSecret', label: 'Kite API Secret (Optional if token provided)', placeholder: 'Paste API Secret...', type: 'password', icon: Lock }
    ]
  },
  AngelOne: {
    id: 'AngelOne',
    name: 'Angel One SmartAPI',
    tagline: 'Official smartapi-python (Client Code + MPIN + TOTP)',
    portalUrl: 'https://smartapi.angelone.in',
    helpGuide: 'smartapi.angelone.in -> Create App -> Use Client Code, MPIN and 6-digit Authenticator TOTP.',
    fields: [
      { key: 'apiKey', label: 'SmartAPI Key', placeholder: 'Paste SmartAPI App Key...', type: 'text', icon: Key },
      { key: 'clientId', label: 'Angel Client Code', placeholder: 'e.g. S123456', type: 'text', icon: User },
      { key: 'pin', label: 'Angel MPIN / Password', placeholder: '4 or 6-digit MPIN', type: 'password', icon: Lock },
      { key: 'totp', label: 'TOTP Secret Key or 6-Digit Code', placeholder: 'e.g. 123456 or Base32 Secret', type: 'text', icon: Smartphone }
    ]
  }
};

export default function ConnectBrokerModal({
  isOpen,
  onClose,
  activeBroker,
  activeMode,
  onConnected,
  onDisconnect
}) {
  if (!isOpen) return null;

  const [selectedBroker, setSelectedBroker] = useState('Groww');
  const [formData, setFormData] = useState({
    apiKey: '',
    apiSecret: '',
    clientId: '',
    accessToken: '',
    pin: '',
    totp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const currentBroker = BROKERS_CONFIG[selectedBroker] || BROKERS_CONFIG.Groww;

  const handleInputChange = (fieldKey, value) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      broker: selectedBroker,
      api_key: formData.apiKey || formData.clientId,
      api_secret: formData.apiSecret || formData.accessToken,
      client_id: formData.clientId,
      access_token: formData.accessToken,
      pin: formData.pin,
      totp_secret: formData.totp,
      account_id: `${selectedBroker.toUpperCase()}-${formData.clientId || 'USER'}`
    };

    try {
      const res = await fetch('/api/v1/demat/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          onConnected(selectedBroker);
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Authentication failed. Check your API credentials.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Network connection error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/v1/demat/disconnect', { method: 'POST' });
      onDisconnect();
      setStatusMessage({ type: 'success', text: 'Disconnected broker. Returned to Sandbox mode.' });
      setTimeout(onClose, 1000);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-[#1e2638] rounded-2xl w-full max-w-lg shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1b2336]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Direct Demat Connection</h3>
              <p className="text-xs text-gray-400">Authentic SEBI broker SDK integrations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#161d2d] hover:bg-[#20293d] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Broker Selector Tabs */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Select Live Demat Broker:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(BROKERS_CONFIG).map((key) => {
              const b = BROKERS_CONFIG[key];
              const isSelected = selectedBroker === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedBroker(key);
                    setStatusMessage(null);
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                      : 'bg-[#121724] border-[#1e2638] text-gray-400 hover:text-gray-200 hover:bg-[#161e30]'
                  }`}
                >
                  {b.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Broker Meta & Official Docs Link */}
        <div className="mt-3.5 bg-[#101625] border border-[#1b2538] rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between text-gray-200 font-semibold mb-1">
            <span>{currentBroker.name}</span>
            <a
              href={currentBroker.portalUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              API Portal <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">{currentBroker.helpGuide}</p>
        </div>

        {/* Dynamic Credentials Form */}
        <form onSubmit={handleConnect} className="mt-4 space-y-3 text-xs">
          {currentBroker.fields.map((f) => {
            const IconComponent = f.icon || Key;
            return (
              <div key={f.key}>
                <label className="text-gray-300 font-semibold block mb-1">
                  {f.label}:
                </label>
                <div className="relative">
                  <IconComponent className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={formData[f.key] || ''}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    required={!f.label.includes('Optional')}
                    className="w-full bg-[#131928] border border-[#20293d] rounded-lg pl-9 pr-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>
            );
          })}

          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            {activeMode === 'LIVE_DEMAT' && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isSubmitting}
                className="text-xs text-red-400 hover:underline"
              >
                Disconnect & Return to Sandbox
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg bg-[#141b2a] text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying with Broker...' : `Connect ${selectedBroker}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
