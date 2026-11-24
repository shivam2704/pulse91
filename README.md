# Pulse91 — Dalal Street Intelligent Quant Terminal & Live Demat Gateway

Pulse91 is an institutional-grade quant trading terminal engineered specifically for the Indian Stock Market (NSE & BSE). It bridges quantitative stock screening (Minervini VCP, 8-Point Trend Template, CANSLIM Fundamentals, and Sector Relative Strength) with direct broker Demat connectivity (Groww, DhanHQ, Zerodha Kite, and Angel One).

---

## 🏛️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    Pulse91 React 18 Institutional UI    │
                      │  (Lightweight Charts v5 • Obsidian UI) │
                      └──────────────────┬─────────────────────┘
                                         │ WebSocket / REST
                                         ▼
                      ┌────────────────────────────────────────┐
                      │         FastAPI Quant Server           │
                      │  - Scanner Router    - Demat Router    │
                      │  - Trade Router      - Alerts Router   │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼───────────────────────────────┐
        ▼                                ▼                               ▼
┌──────────────────┐           ┌──────────────────┐           ┌────────────────────┐
│ 5-Pillar Engine  │           │ Autonomous Agent │           │ Live Broker Engine │
│ - Market Regime  │           │ - Auto-Buy Pivot │           │ - Groww (SDK)      │
│ - Sector RS vs N │           │ - Auto-Sell T1   │           │ - DhanHQ (SDK)     │
│ - Minervini VCP  │           │ - Stop-Loss Cut  │           │ - Zerodha Kite     │
│ - Smart Delivery │           │ - WhatsApp Alert │           │ - Angel SmartAPI   │
│ - CANSLIM PAT    │           │                  │           │ - Sandbox (₹10L)   │
└──────────────────┘           └──────────────────┘           └────────────────────┘
```

---

## ⚡ Core Capabilities

1. **5-Pillar Confluence Engine**:
   - **Pillar 1: Market Regime**: Evaluates NIFTY 50 trend, 50-EMA filter, ADX trend strength, and net FII/DII institutional cash flow.
   - **Pillar 2: Sector Relative Strength**: Computes sector outperformance factor vs NIFTY 50 to ensure capital is deployed in leading sectors.
   - **Pillar 3: Technical Structure & Minervini VCP**: Reverse-engineered Mark Minervini Volatility Contraction Pattern (T1/T2/T3/T4 contractions), 8-Point Trend Template, and Stockbee Episodic Pivots.
   - **Pillar 4: Institutional Delivery & Derivatives**: Scans NSE Bhavcopy delivery percentages (>55% accumulation threshold) and Option Chain Put-Call Ratio (PCR).
   - **Pillar 5: CANSLIM Fundamental Health**: Minimum +20% YoY quarterly PAT expansion, ROCE > 15%, and low Debt/Equity buffer.

2. **Autonomous Quant Auto-Trader Daemon**:
   - Background autonomous scanner that monitors Monday setups.
   - Auto-executes BUY orders at VCP breakout pivot points with volume surge.
   - Auto-executes SELL orders at Target 1 (+5.55%) or cuts losses at Stop-Loss (-2.78%).
   - Automated WhatsApp receipts dispatched immediately upon fill.

3. **Multi-Broker Gateway**:
   - **Groww**: Dynamic bearer token authentication via official `growwapi` SDK.
   - **DhanHQ**: Seamless access via official `dhanhq` SDK v2.3.0 (`DhanContext`).
   - **Zerodha Kite**: Session handshake via `kiteconnect` v5.2.2.
   - **Angel One**: Authenticated MPIN + TOTP generator via `smartapi-python` and `pyotp`.
   - **Pulse91 Sandbox**: Virtual ₹10,00,000 INR Demat environment for zero-risk paper trading.

4. **Institutional TradingView Candlestick Chart**:
   - TradingView `lightweight-charts` v5.3.0 modular engine.
   - Subpanel volume histogram pinned to bottom 18% with zero price scale collision.
   - Pivot, Target 1, Target 2, Stop-Loss, and 20-DMA price overlays with 1-click clean mode.

---

## 🚀 Getting Started

### 1. Core Quant Server
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn pulse91.core.main:app --host 0.0.0.0 --port 8000
```

### 2. Trading Terminal (UI)
```bash
cd pulse91/terminal
npm install
npm run build # or npm run dev
```

Visit: `http://localhost:8000`

---

## 🔒 Security & Privacy
- Zero credential logging; API keys and demat tokens are stored in local session memory.
- Strictly adheres to NSE/BSE market trading hours (09:15 - 15:30 IST).
