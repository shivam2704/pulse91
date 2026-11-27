"""
pulse91/core/services/supabase_service.py
Robust Supabase Database Adapter for Pulse91 Quant Terminal.
Persists Demat holdings, ledger cash balances, orders, and autotrader states
directly into Supabase PostgreSQL tables (portfolio, holdings, orders, etc.).
Strictly surfaces and logs all errors — NO SILENT FAILURES.
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
from dotenv import load_dotenv

# Ensure .env is explicitly loaded from project root
ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

logger = logging.getLogger("pulse91.supabase")

class SupabaseService:
    def __init__(self):
        self.supabase_url = ""
        self.supabase_key = ""
        self.client = None
        self._init_client()

    def _init_client(self):
        self.supabase_url = (os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
        self.supabase_key = (os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or "").strip()

        if self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client, Client
                self.client: Optional[Client] = create_client(self.supabase_url, self.supabase_key)
                logger.info(f"✓ Connected to Supabase at {self.supabase_url}")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                self.client = None
        else:
            logger.warning("Supabase credentials missing in environment. SUPABASE_URL or SUPABASE_KEY not found.")

    @property
    def is_active(self) -> bool:
        if self.client is None and (os.getenv("SUPABASE_URL") or os.getenv("SUPABASE_KEY")):
            self._init_client()
        return self.client is not None

    def _require_client(self):
        if not self.is_active:
            self._init_client()
        if not self.is_active:
            raise RuntimeError("Supabase client is not configured or offline. Please check SUPABASE_URL and SUPABASE_KEY in .env.")

    # --- Portfolio & Cash Ledger ---

    def load_portfolio(self, account_id: str, mode: str = "SANDBOX") -> Optional[Dict[str, Any]]:
        self._require_client()
        try:
            res = self.client.table("portfolio").select("*").eq("account_id", account_id).eq("mode", mode).limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return {
                    "account_id": row["account_id"],
                    "mode": row["mode"],
                    "broker": row["broker"],
                    "initial_balance": float(row["initial_balance"]),
                    "available_cash": float(row["available_cash"])
                }
            return None
        except Exception as e:
            logger.error(f"Supabase load_portfolio error: {e}")
            raise RuntimeError(f"Supabase load_portfolio failed for {account_id}: {e}") from e

    def save_portfolio(self, portfolio: Dict[str, Any]) -> bool:
        self._require_client()
        import uuid
        acc_id = portfolio.get("account_id") or f"GUEST_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "account_id": acc_id,
            "mode": portfolio.get("mode", "SANDBOX"),
            "broker": portfolio.get("broker", "Pulse91 Sandbox Broker"),
            "initial_balance": float(portfolio.get("initial_balance", 10000.0)),
            "available_cash": float(portfolio.get("available_cash", 10000.0)),
            "updated_at": datetime.now().isoformat()
        }
        try:
            self.client.table("portfolio").upsert(payload, on_conflict="account_id,mode").execute()
            return True
        except Exception as e:
            logger.error(f"Supabase save_portfolio error: {e}")
            raise RuntimeError(f"Supabase save_portfolio failed: {e}") from e

    # --- Holdings ---

    def load_holdings(self, account_id: str, mode: str = "SANDBOX") -> List[Dict[str, Any]]:
        self._require_client()
        try:
            res = self.client.table("holdings").select("*").eq("account_id", account_id).eq("mode", mode).execute()
            holdings = []
            if res.data:
                for h in res.data:
                    holdings.append({
                        "symbol": h["symbol"],
                        "company_name": h.get("company_name") or h["symbol"],
                        "quantity": int(h["quantity"]),
                        "avg_buy_price": float(h["avg_buy_price"]),
                        "invested_value": float(h["invested_value"]),
                        "product": h.get("product", "CNC"),
                        "date_bought": str(h.get("date_bought") or datetime.now().strftime("%Y-%m-%d")),
                        "mode": h.get("mode", mode)
                    })
            return holdings
        except Exception as e:
            logger.error(f"Supabase load_holdings error: {e}")
            raise RuntimeError(f"Supabase load_holdings failed for {account_id}: {e}") from e

    def save_holding(self, account_id: str, holding: Dict[str, Any], mode: str = "SANDBOX") -> bool:
        self._require_client()
        payload = {
            "account_id": account_id,
            "mode": holding.get("mode", mode),
            "symbol": holding["symbol"],
            "company_name": holding.get("company_name", holding["symbol"]),
            "quantity": int(holding["quantity"]),
            "avg_buy_price": float(holding["avg_buy_price"]),
            "invested_value": float(holding["invested_value"]),
            "product": holding.get("product", "CNC"),
            "date_bought": holding.get("date_bought") or datetime.now().strftime("%Y-%m-%d")
        }
        try:
            self.client.table("holdings").upsert(payload, on_conflict="account_id,mode,symbol").execute()
            return True
        except Exception as e:
            logger.error(f"Supabase save_holding error: {e}")
            raise RuntimeError(f"Supabase save_holding failed: {e}") from e

    def delete_holding(self, account_id: str, symbol: str, mode: str = "SANDBOX") -> bool:
        self._require_client()
        try:
            self.client.table("holdings").delete().eq("account_id", account_id).eq("mode", mode).eq("symbol", symbol).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase delete_holding error: {e}")
            raise RuntimeError(f"Supabase delete_holding failed: {e}") from e

    def clear_holdings(self, account_id: str, mode: str = "SANDBOX") -> bool:
        self._require_client()
        try:
            self.client.table("holdings").delete().eq("account_id", account_id).eq("mode", mode).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase clear_holdings error: {e}")
            raise RuntimeError(f"Supabase clear_holdings failed: {e}") from e

    # --- Orders ---

    def save_order(self, order: Dict[str, Any]) -> bool:
        self._require_client()
        import uuid
        acc_id = order.get("account_id") or f"GUEST_{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "order_id": order.get("order_id"),
            "account_id": acc_id,
            "mode": order.get("mode", "SANDBOX"),
            "symbol": order.get("symbol"),
            "side": order.get("side", "BUY"),
            "product": order.get("product", "CNC"),
            "quantity": int(order.get("quantity", 0)),
            "price": float(order.get("price", 0.0)),
            "sl_price": float(order["sl_price"]) if order.get("sl_price") is not None else None,
            "target_price": float(order["target_price"]) if order.get("target_price") is not None else None,
            "status": order.get("status", "EXECUTED"),
            "order_session": order.get("order_session", "REGULAR"),
            "created_at": datetime.now().isoformat()
        }
        try:
            self.client.table("orders").insert(payload).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase save_order error: {e}")
            raise RuntimeError(f"Supabase save_order failed: {e}") from e

    def load_orders(self, account_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        self._require_client()
        try:
            res = self.client.table("orders").select("*").eq("account_id", account_id).order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase load_orders error: {e}")
            raise RuntimeError(f"Supabase load_orders failed: {e}") from e

    # --- Autotrader Settings & Logs ---

    def load_autotrader(self) -> Optional[Dict[str, Any]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("autotrader").select("*").eq("id", 1).limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return {
                    "is_active": bool(row["is_active"]),
                    "max_capital_per_trade": float(row["max_capital_per_trade"]),
                    "max_open_positions": int(row["max_open_positions"]),
                    "managed_positions": row.get("managed_positions") or []
                }
        except Exception as e:
            logger.error(f"Supabase load_autotrader error: {e}")
        return None

    def save_autotrader(self, data: Dict[str, Any]) -> bool:
        self._require_client()
        payload = {
            "id": 1,
            "is_active": bool(data.get("is_active", False)),
            "max_capital_per_trade": float(data.get("max_capital_per_trade", 3000.0)),
            "max_open_positions": int(data.get("max_open_positions", 3)),
            "managed_positions": data.get("managed_positions", []),
            "updated_at": datetime.now().isoformat()
        }
        try:
            self.client.table("autotrader").upsert(payload, on_conflict="id").execute()
            return True
        except Exception as e:
            logger.error(f"Supabase save_autotrader error: {e}")
            raise RuntimeError(f"Supabase save_autotrader failed: {e}") from e

    def add_execution_log(self, log: Dict[str, Any]) -> bool:
        self._require_client()
        payload = {
            "log_id": log.get("id") or log.get("log_id") or f"LOG_{int(datetime.now().timestamp())}",
            "symbol": log.get("symbol", ""),
            "action": log.get("action", ""),
            "reason": log.get("reason", ""),
            "details": log.get("details", {})
        }
        try:
            self.client.table("execution_logs").insert(payload).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase add_execution_log error: {e}")
            raise RuntimeError(f"Supabase add_execution_log failed: {e}") from e

    def load_execution_logs(self, limit: int = 25) -> List[Dict[str, Any]]:
        self._require_client()
        try:
            res = self.client.table("execution_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Supabase load_execution_logs error: {e}")
            raise RuntimeError(f"Supabase load_execution_logs failed: {e}") from e

    # --- Key-Value Settings (Preferences) ---

    def get_setting(self, key: str, default: Any = None) -> Any:
        if not self.is_active:
            return default
        try:
            res = self.client.table("settings").select("value").eq("key", key).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0].get("value")
        except Exception as e:
            logger.warning(f"Supabase get_setting warning: {e}")
        return default

    def set_setting(self, key: str, value: Any) -> bool:
        self._require_client()
        payload = {
            "key": key,
            "value": value,
            "updated_at": datetime.now().isoformat()
        }
        try:
            self.client.table("settings").upsert(payload, on_conflict="key").execute()
            return True
        except Exception as e:
            logger.error(f"Supabase set_setting error: {e}")
            raise RuntimeError(f"Supabase set_setting failed: {e}") from e

# Global Singleton Instance
supabase_service = SupabaseService()

