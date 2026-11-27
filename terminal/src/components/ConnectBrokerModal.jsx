import React, { useState } from 'react';
import { X, ShieldCheck, Key, Lock, ArrowRight, ExternalLink, CheckCircle, AlertCircle, User, Smartphone } from 'lucide-react';
import { api } from '../services/api';

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
  onDisconnect,
  currentUser,
  onOpenAuthModal
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
      const data = await api.demat.connectBroker(payload);
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          onConnected(selectedBroker);
          onClose();
        }, 1500);
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Authentication failed. Check your API credentials.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Authentication error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);
    try {
      await api.demat.disconnectBroker();
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

        {/* Guest Lock Guard: If not signed in, show Sign In barrier */}
        {!currentUser ? (
          <div className="mt-5 p-6 bg-[#121826] border border-amber-500/30 rounded-xl text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3.5">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Sign In Required for Real Broker Integration</h4>
            <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto leading-relaxed">
              To safeguard real funds and encrypt your API keys in your private vault, connecting live broker accounts (Groww, Zerodha, Dhan, Angel One) is restricted to authenticated users.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthModal?.();
                }}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto bg-[#1a2336] hover:bg-[#222f47] text-gray-300 text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Continue in Sandbox
              </button>
            </div>
          </div>
        ) : (
          /* Form for authenticated users */
          <>
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
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                >
                  <span>API Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                {currentBroker.helpGuide}
              </p>
            </div>

            {/* Connect Form */}
            <form onSubmit={handleConnect} className="mt-4 space-y-3">
              {currentBroker.fields.map((field) => {
                const IconComponent = field.icon;
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      {field.label}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-gray-500 pointer-events-none">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        required
                        className="w-full bg-[#121724] border border-[#1e2638] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/80 font-mono transition-colors"
                      />
                    </div>
                  </div>
                );
              })}

              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                {activeMode === 'LIVE_DEMAT' && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDisconnect}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Disconnect
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ml-auto"
                >
                  <span>{isSubmitting ? 'Authenticating...' : `Connect ${selectedBroker} Account`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
