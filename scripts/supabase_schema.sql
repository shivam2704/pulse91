-- =========================================================================
-- Pulse91 Dalal Street Quant Terminal - Enterprise Production Database Schema
-- Built on PostgreSQL 15+ (Native Supabase Cloud Engine)
-- =========================================================================

-- Enable pgcrypto for hardware-grade credential encryption & UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reusable trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_pulse91_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 1. Demat Portfolio & Cash Ledger (Multi-Account / Sandbox & Live Isolated)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_portfolio (
    account_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('SANDBOX', 'LIVE_DEMAT')),
    broker TEXT NOT NULL DEFAULT 'Pulse91 Sandbox Broker',
    initial_balance NUMERIC(14, 2) NOT NULL DEFAULT 10000.00,
    available_cash NUMERIC(14, 2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (account_id, mode)
);

CREATE TRIGGER trg_portfolio_timestamp
BEFORE UPDATE ON pulse91_portfolio
FOR EACH ROW EXECUTE FUNCTION update_pulse91_timestamp();

-- -------------------------------------------------------------------------
-- 2. Demat Delivery Holdings (CNC) - Strict Mode & Account Isolation
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_holdings (
    id BIGSERIAL PRIMARY KEY,
    account_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('SANDBOX', 'LIVE_DEMAT')),
    symbol TEXT NOT NULL,
    company_name TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    avg_buy_price NUMERIC(14, 4) NOT NULL,
    invested_value NUMERIC(14, 2) NOT NULL,
    product TEXT DEFAULT 'CNC',
    date_bought DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (account_id, mode) REFERENCES pulse91_portfolio(account_id, mode) ON DELETE CASCADE,
    UNIQUE (account_id, mode, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_lookup ON pulse91_holdings(account_id, mode);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON pulse91_holdings(symbol);

CREATE TRIGGER trg_holdings_timestamp
BEFORE UPDATE ON pulse91_holdings
FOR EACH ROW EXECUTE FUNCTION update_pulse91_timestamp();

-- -------------------------------------------------------------------------
-- 3. Open Intraday Positions (MIS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_positions (
    id BIGSERIAL PRIMARY KEY,
    account_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('SANDBOX', 'LIVE_DEMAT')),
    symbol TEXT NOT NULL,
    company_name TEXT,
    quantity INT NOT NULL CHECK (quantity > 0),
    entry_price NUMERIC(14, 4) NOT NULL,
    product TEXT DEFAULT 'MIS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (account_id, mode) REFERENCES pulse91_portfolio(account_id, mode) ON DELETE CASCADE,
    UNIQUE (account_id, mode, symbol)
);

CREATE INDEX IF NOT EXISTS idx_positions_lookup ON pulse91_positions(account_id, mode);

-- -------------------------------------------------------------------------
-- 4. Complete Immutable Order Audit Trail (Append-Only Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    account_id TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('SANDBOX', 'LIVE_DEMAT')),
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
    product TEXT NOT NULL CHECK (product IN ('CNC', 'MIS')),
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(14, 4) NOT NULL,
    sl_price NUMERIC(14, 4),
    target_price NUMERIC(14, 4),
    status TEXT NOT NULL DEFAULT 'EXECUTED',
    order_session TEXT DEFAULT 'REGULAR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fast index for order history & audit queries
CREATE INDEX IF NOT EXISTS idx_orders_history ON pulse91_orders(account_id, mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON pulse91_orders(symbol);

-- -------------------------------------------------------------------------
-- 5. Autonomous Quant Daemon & Auto-Trader Surveillance
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_autotrader (
    id INT PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    max_capital_per_trade NUMERIC(14, 2) NOT NULL DEFAULT 3000.00,
    max_open_positions INT NOT NULL DEFAULT 3,
    managed_positions JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_autotrader_timestamp
BEFORE UPDATE ON pulse91_autotrader
FOR EACH ROW EXECUTE FUNCTION update_pulse91_timestamp();

-- -------------------------------------------------------------------------
-- 6. Quant Execution Decisions & Strategy Audit Logs
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_execution_logs (
    id BIGSERIAL PRIMARY KEY,
    log_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created ON pulse91_execution_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- 7. Application Preferences & WhatsApp Configuration
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_settings_timestamp
BEFORE UPDATE ON pulse91_settings
FOR EACH ROW EXECUTE FUNCTION update_pulse91_timestamp();

-- -------------------------------------------------------------------------
-- 8. Encrypted Broker Credentials Vault (AES-256 Storage)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pulse91_broker_vault (
    account_id TEXT NOT NULL,
    broker TEXT NOT NULL,
    encrypted_api_key TEXT,
    encrypted_secret TEXT,
    client_code TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (account_id, broker)
);

-- -------------------------------------------------------------------------
-- Seed Defaults (Initial Virtual Capital Sandbox)
-- -------------------------------------------------------------------------
INSERT INTO pulse91_portfolio (account_id, mode, broker, initial_balance, available_cash)
VALUES ('PULSE91-DEMAT-SBX-01', 'SANDBOX', 'Pulse91 Sandbox Broker', 10000.00, 10000.00)
ON CONFLICT (account_id, mode) DO UPDATE
SET updated_at = NOW();

INSERT INTO pulse91_autotrader (id, is_active, max_capital_per_trade, max_open_positions, managed_positions)
VALUES (1, FALSE, 3000.00, 3, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
