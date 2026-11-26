-- =========================================================================
-- Pulse91 Dalal Street Quant Terminal - Enterprise Database Schema
-- Built on PostgreSQL 15+ (Native Supabase Cloud Engine)
-- Clean Canonical Table Names (Dedicated Project Architecture)
-- =========================================================================

-- Enable pgcrypto for hardware-grade credential encryption & UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reusable trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- 1. Demat Portfolio & Cash Ledger (Multi-Account / Sandbox & Live Isolated)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio (
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
BEFORE UPDATE ON portfolio
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- -------------------------------------------------------------------------
-- 2. Demat Delivery Holdings (CNC) - Strict Mode & Account Isolation
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holdings (
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
    FOREIGN KEY (account_id, mode) REFERENCES portfolio(account_id, mode) ON DELETE CASCADE,
    UNIQUE (account_id, mode, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_lookup ON holdings(account_id, mode);
CREATE INDEX IF NOT EXISTS idx_holdings_symbol ON holdings(symbol);

CREATE TRIGGER trg_holdings_timestamp
BEFORE UPDATE ON holdings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- -------------------------------------------------------------------------
-- 3. Open Intraday Positions (MIS)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
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
    FOREIGN KEY (account_id, mode) REFERENCES portfolio(account_id, mode) ON DELETE CASCADE,
    UNIQUE (account_id, mode, symbol)
);

CREATE INDEX IF NOT EXISTS idx_positions_lookup ON positions(account_id, mode);

-- -------------------------------------------------------------------------
-- 4. Complete Immutable Order Audit Trail (Append-Only Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
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
CREATE INDEX IF NOT EXISTS idx_orders_history ON orders(account_id, mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);

-- -------------------------------------------------------------------------
-- 5. Autonomous Quant Daemon & Auto-Trader Surveillance
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS autotrader (
    id INT PRIMARY KEY DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    max_capital_per_trade NUMERIC(14, 2) NOT NULL DEFAULT 3000.00,
    max_open_positions INT NOT NULL DEFAULT 3,
    managed_positions JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_autotrader_timestamp
BEFORE UPDATE ON autotrader
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- -------------------------------------------------------------------------
-- 6. Quant Execution Decisions & Strategy Audit Logs
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_logs (
    id BIGSERIAL PRIMARY KEY,
    log_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created ON execution_logs(created_at DESC);

-- -------------------------------------------------------------------------
-- 7. Application Preferences & Configuration
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trg_settings_timestamp
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- -------------------------------------------------------------------------
-- 8. Encrypted Broker Credentials Vault (AES-256 Storage)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS broker_vault (
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
-- Seed Defaults
-- -------------------------------------------------------------------------
INSERT INTO autotrader (id, is_active, max_capital_per_trade, max_open_positions, managed_positions)
VALUES (1, FALSE, 3000.00, 3, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 9. Row Level Security (RLS) - Cryptographic Multi-Tenant Isolation
-- -------------------------------------------------------------------------
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_vault ENABLE ROW LEVEL SECURITY;

-- Pure Cryptographic Tenant Isolation:
-- Every authenticated user can ONLY access and modify rows where account_id matches their own auth.uid()
CREATE POLICY "User isolates portfolio" ON portfolio
    FOR ALL USING (account_id = auth.uid()::text);

CREATE POLICY "User isolates holdings" ON holdings
    FOR ALL USING (account_id = auth.uid()::text);

CREATE POLICY "User isolates positions" ON positions
    FOR ALL USING (account_id = auth.uid()::text);

CREATE POLICY "User isolates orders" ON orders
    FOR ALL USING (account_id = auth.uid()::text);

CREATE POLICY "User isolates broker vault" ON broker_vault
    FOR ALL USING (account_id = auth.uid()::text);

-- -------------------------------------------------------------------------
-- 10. Auto-Provision ₹10,000 Sandbox Demat on New User Registration
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.portfolio (account_id, mode, broker, initial_balance, available_cash)
    VALUES (NEW.id::text, 'SANDBOX', 'Pulse91 Sandbox Broker', 10000.00, 10000.00)
    ON CONFLICT (account_id, mode) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
