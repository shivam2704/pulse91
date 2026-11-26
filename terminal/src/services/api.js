/**
 * pulse91/terminal/src/services/api.js
 * Centralized Typed API Client for Pulse91 Dalal Street Quant Terminal.
 * Replaces scattered fetch calls with unified, robust, error-handled endpoints.
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
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
    getMondayTop15: () => request('/api/v1/scan/monday-top15'),
    scanIndex: (indexKey, limit = null) => {
      const q = limit ? `?limit=${limit}` : '';
      return request(`/api/v1/scan/index/${indexKey}${q}`);
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
      body: JSON.stringify({ initial_capital: capital })
    }),
    switchMode: (payload) => request('/api/v1/demat/mode', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    connectBroker: (payload) => request('/api/v1/demat/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  // Trade Execution & Algorithmic Autotrader
  trade: {
    placeOrder: (orderPayload) => request('/api/v1/trade/order', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    }),
    exitPosition: (symbol) => request('/api/v1/trade/exit', {
      method: 'POST',
      body: JSON.stringify({ symbol })
    }),
    getAutotraderStatus: () => request('/api/v1/trade/autotrader/status'),
    toggleAutotrader: () => request('/api/v1/trade/autotrader/toggle', { method: 'POST' }),
    runAutotraderCycle: () => request('/api/v1/trade/autotrader/cycle', { method: 'POST' }),
    configureAutotrader: (config) => request('/api/v1/trade/autotrader/config', {
      method: 'POST',
      body: JSON.stringify(config)
    })
  },

  // WhatsApp & Webhook Alerts
  alerts: {
    getConfig: () => request('/api/v1/alerts/config'),
    updateConfig: (phone, webhook = null) => request('/api/v1/alerts/config', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, webhook_url: webhook })
    }),
    sendTest: (phone) => request('/api/v1/alerts/test', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone })
    }),
    dispatchStockAlert: (symbol, phone = null) => request('/api/v1/alerts/whatsapp', {
      method: 'POST',
      body: JSON.stringify({ symbol, phone_number: phone })
    })
  }
};

export default api;
