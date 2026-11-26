/**
 * pulse91/terminal/src/services/api.js
 * Centralized Typed API Client for Pulse91 Dalal Street Quant Terminal.
 * Supports Supabase JWT Auth and 2-Hour Auto-Expiring Cookie Guest Isolation.
 */

import { getAccessToken } from './supabaseAuth';

const BASE_URL = '';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, maxAgeSeconds = 3600) { // 1 Hour TTL
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

export function getOrCreateGuestId() {
  let gid = getCookie('pulse91_guest_id');
  if (!gid) {
    gid = 'GUEST_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setCookie('pulse91_guest_id', gid, 3600); // 1 hour auto-expire
  }
  return gid;
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = await getAccessToken().catch(() => null);
  const guestId = getOrCreateGuestId();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : { 'X-Guest-ID': guestId }),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  // Scanner & Quant Analytics
  scan: {
    getIndices: () => request('/api/v1/scan/indices'),
    getRegime: () => request('/api/v1/scan/regime'),
    getMondayTop15: (refresh = false) => request(`/api/v1/scan/monday-top15${refresh ? '?refresh=true' : ''}`),
    scanIndex: (indexKey, limit = null, refresh = false) => {
      const params = new URLSearchParams();
      params.append('index_key', indexKey);
      if (limit) params.append('limit', limit);
      if (refresh) params.append('force_refresh', 'true');
      return request(`/api/v1/scan/index?${params.toString()}`);
    },
    getStockDeepDive: (symbol) => request(`/api/v1/scan/stock/${symbol}`),
    getCandles: (symbol, timeframe = 'D', count = null) => {
      const q = count ? `&count=${count}` : '';
      return request(`/api/v1/scan/candles/${symbol}?timeframe=${timeframe}${q}`);
    }
  },

  // Demat & Portfolio Ledger
  demat: {
    getOverview: () => request('/api/v1/demat/overview'),
    resetSandbox: (capital = 10000.0) => request('/api/v1/demat/reset', {
      method: 'POST',
      body: JSON.stringify({ amount: capital })
    }),
    switchMode: (payload) => request('/api/v1/demat/mode', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    connectBroker: (payload) => request('/api/v1/demat/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    disconnectBroker: () => request('/api/v1/demat/disconnect', {
      method: 'POST'
    })
  },

  // Trade Execution & Risk
  trade: {
    placeOrder: (orderPayload) => request('/api/v1/trade/order', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    }),
    exitPosition: (symbol) => request('/api/v1/trade/exit', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    }),
    getHistory: () => request('/api/v1/trade/history'),
    getAutotraderStatus: () => request('/api/v1/trade/autotrader/status'),
    toggleAutotrader: (isActive) => request('/api/v1/trade/autotrader/toggle', {
      method: 'POST',
      body: JSON.stringify({ is_active: isActive })
    }),
    runAutotraderCycle: () => request('/api/v1/trade/autotrader/cycle', {
      method: 'POST'
    })
  },

  // Alerts & Notifications
  alerts: {
    getLogs: () => request('/api/v1/alerts/logs'),
    formatWhatsApp: (symbol) => request(`/api/v1/alerts/whatsapp/format?symbol=${symbol}`, {
      method: 'POST'
    }),
    sendWhatsApp: (symbol, phone) => request('/api/v1/alerts/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ symbol, phone_number: phone })
    }),
    updateWhatsAppConfig: (config) => request('/api/v1/alerts/whatsapp/config', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  }
};
