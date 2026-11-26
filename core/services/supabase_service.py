"""
pulse91/core/services/supabase_service.py
Robust Supabase Database Adapter for Pulse91 Quant Terminal.
Persists Demat holdings, ledger cash balances, orders, and autotrader states
directly into Supabase PostgreSQL tables.
Gracefully falls back to local session state if SUPABASE_URL / KEY are not set.
"""

import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger("pulse91.supabase")

class SupabaseService:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "").strip()
        self.supabase_key = os.getenv("SUPABASE_KEY", "").strip()
        self.client = None
        self._init_client()

    def _init_client(self):
        if self.supabase_url and self.supabase_key:
            try:
                from supabase import create_client, Client
                self.client: Optional[Client] = create_client(self.supabase_url, self.supabase_key)
                logger.info(f"✓ Connected to Supabase at {self.supabase_url}")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {e}")
                self.client = None
        else:
            logger.info("Supabase credentials not configured in environment. Operating in local mode.")

    @property
    def is_active(self) -> bool:
        return self.client is not None

    # --- Portfolio & Cash Ledger ---

    def load_portfolio(self, account_id: str, mode: str = "SANDBOX") -> Optional[Dict[str, Any]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("pulse91_portfolio").select("*").eq("account_id", account_id).eq("mode", mode).limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return {
                    "account_id": row["account_id"],
                    "mode": row["mode"],
                    "broker": row["broker"],
                    "initial_balance": float(row["initial_balance"]),
                    "available_cash": float(row["available_cash"])
                }
        except Exception as e:
            logger.warning(f"Supabase load_portfolio error: {e}")
        return None

    def save_portfolio(self, portfolio: Dict[str, Any]) -> bool:
        if not self.is_active:
            return False
        try:
            payload = {
                "account_id": portfolio.get("account_id", "PULSE91-DEMAT-SBX-01"),
                "mode": portfolio.get("mode", "SANDBOX"),
                "broker": portfolio.get("broker", "Pulse91 Sandbox Broker"),
                "initial_balance": float(portfolio.get("initial_balance", 10000.0)),
                "available_cash": float(portfolio.get("available_cash", 10000.0)),
                "updated_at": datetime.now().isoformat()
            }
            self.client.table("pulse91_portfolio").upsert(payload, on_conflict="account_id,mode").execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase save_portfolio error: {e}")
            return False

    # --- Holdings ---

    def load_holdings(self, account_id: str, mode: str = "SANDBOX") -> Optional[List[Dict[str, Any]]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("pulse91_holdings").select("*").eq("account_id", account_id).eq("mode", mode).execute()
            if res.data is not None:
                holdings = []
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
            logger.warning(f"Supabase load_holdings error: {e}")
        return None

    def save_holding(self, account_id: str, holding: Dict[str, Any], mode: str = "SANDBOX") -> bool:
        if not self.is_active:
            return False
        try:
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
            self.client.table("pulse91_holdings").upsert(payload, on_conflict="account_id,mode,symbol").execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase save_holding error: {e}")
            return False

    def delete_holding(self, account_id: str, symbol: str, mode: str = "SANDBOX") -> bool:
        if not self.is_active:
            return False
        try:
            self.client.table("pulse91_holdings").delete().eq("account_id", account_id).eq("mode", mode).eq("symbol", symbol).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase delete_holding error: {e}")
            return False

    def clear_holdings(self, account_id: str, mode: str = "SANDBOX") -> bool:
        if not self.is_active:
            return False
        try:
            self.client.table("pulse91_holdings").delete().eq("account_id", account_id).eq("mode", mode).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase clear_holdings error: {e}")
            return False

    # --- Orders ---

    def save_order(self, order: Dict[str, Any]) -> bool:
        if not self.is_active:
            return False
        try:
            payload = {
                "order_id": order.get("order_id"),
                "account_id": order.get("account_id", "PULSE91-DEMAT-SBX-01"),
                "symbol": order.get("symbol"),
                "side": order.get("side", "BUY"),
                "product": order.get("product", "CNC"),
                "quantity": int(order.get("quantity", 0)),
                "price": float(order.get("price", 0.0)),
                "sl_price": float(order["sl_price"]) if order.get("sl_price") else None,
                "target_price": float(order["target_price"]) if order.get("target_price") else None,
                "status": order.get("status", "EXECUTED"),
                "order_session": order.get("order_session", "REGULAR"),
                "created_at": datetime.now().isoformat()
            }
            self.client.table("pulse91_orders").insert(payload).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase save_order error: {e}")
            return False

    def load_orders(self, account_id: str, limit: int = 50) -> Optional[List[Dict[str, Any]]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("pulse91_orders").select("*").eq("account_id", account_id).order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Supabase load_orders error: {e}")
            return None

    # --- Autotrader Settings & Logs ---

    def load_autotrader(self) -> Optional[Dict[str, Any]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("pulse91_autotrader").select("*").eq("id", 1).limit(1).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                return {
                    "is_active": bool(row["is_active"]),
                    "max_capital_per_trade": float(row["max_capital_per_trade"]),
                    "max_open_positions": int(row["max_open_positions"]),
                    "managed_positions": row.get("managed_positions") or []
                }
        except Exception as e:
            logger.warning(f"Supabase load_autotrader error: {e}")
        return None

    def save_autotrader(self, data: Dict[str, Any]) -> bool:
        if not self.is_active:
            return False
        try:
            payload = {
                "id": 1,
                "is_active": bool(data.get("is_active", False)),
                "max_capital_per_trade": float(data.get("max_capital_per_trade", 3000.0)),
                "max_open_positions": int(data.get("max_open_positions", 3)),
                "managed_positions": data.get("managed_positions", []),
                "updated_at": datetime.now().isoformat()
            }
            self.client.table("pulse91_autotrader").upsert(payload, on_conflict="id").execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase save_autotrader error: {e}")
            return False

    def add_execution_log(self, log: Dict[str, Any]) -> bool:
        if not self.is_active:
            return False
        try:
            payload = {
                "log_id": log.get("id") or log.get("log_id") or f"LOG_{int(datetime.now().timestamp())}",
                "symbol": log.get("symbol", ""),
                "action": log.get("action", ""),
                "reason": log.get("reason", ""),
                "details": log.get("details", {})
            }
            self.client.table("pulse91_execution_logs").insert(payload).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase add_execution_log error: {e}")
            return False

    def load_execution_logs(self, limit: int = 25) -> Optional[List[Dict[str, Any]]]:
        if not self.is_active:
            return None
        try:
            res = self.client.table("pulse91_execution_logs").select("*").order("created_at", desc=True).limit(limit).execute()
            return res.data or []
        except Exception as e:
            logger.warning(f"Supabase load_execution_logs error: {e}")
            return None

    # --- Key-Value Settings (WhatsApp, layout) ---

    def get_setting(self, key: str, default: Any = None) -> Any:
        if not self.is_active:
            return default
        try:
            res = self.client.table("pulse91_settings").select("value").eq("key", key).limit(1).execute()
            if res.data and len(res.data) > 0:
                return res.data[0].get("value")
        except Exception as e:
            logger.warning(f"Supabase get_setting error: {e}")
        return default

    def set_setting(self, key: str, value: Any) -> bool:
        if not self.is_active:
            return False
        try:
            payload = {
                "key": key,
                "value": value,
                "updated_at": datetime.now().isoformat()
            }
            self.client.table("pulse91_settings").upsert(payload, on_conflict="key").execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase set_setting error: {e}")
            return False

# Global Singleton Instance
supabase_service = SupabaseService()
