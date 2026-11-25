"""
pulse91/backend/engines/groww_adapter.py
Live Groww Trade API Integration using official growwapi SDK
"""

import os
import time
from typing import Dict, List, Any, Optional
from growwapi import GrowwAPI

class GrowwTradeApiAdapter:
    def __init__(self):
        # Read securely from local environment variables only (never hardcoded in source!)
        self.api_key: Optional[str] = os.getenv("GROWW_API_KEY")
        self.secret: Optional[str] = os.getenv("GROWW_API_SECRET")
        self.access_token: Optional[str] = None
        self.token_expiry: float = 0
        self.client: Optional[GrowwAPI] = None
        self.last_known_holdings: List[Dict[str, Any]] = []
        self.last_known_cash: float = 0.0

    def get_client(self) -> GrowwAPI:
        """Initializes or refreshes the live authenticated GrowwAPI client."""
        if not self.api_key or not self.secret:
            raise ValueError("Groww credentials not set. Please configure GROWW_API_KEY and GROWW_API_SECRET in your private .env file.")
        now = time.time()
        if not self.client or not self.access_token or now >= self.token_expiry:
            try:
                token = GrowwAPI.get_access_token(api_key=self.api_key, secret=self.secret)
                self.access_token = token
                self.token_expiry = now + (20 * 3600) # Valid for 20 hours
                self.client = GrowwAPI(token)
            except Exception as e:
                print("Groww token refresh error, trying direct API key:", e)
                self.client = GrowwAPI(self.api_key)
        return self.client

    def fetch_live_holdings(self) -> List[Dict[str, Any]]:
        """Fetches live Demat holdings directly from Groww account."""
        try:
            client = self.get_client()
            res = client.get_holdings_for_user(timeout=5)
            raw_holdings = res.get("holdings", []) if isinstance(res, dict) else []
            
            cleaned = []
            for h in raw_holdings:
                qty = float(h.get("quantity") or 0)
                if qty <= 0:
                    continue
                sym = h.get("trading_symbol", "").upper()
                avg_price = float(h.get("average_price") or 0)
                cleaned.append({
                    "symbol": sym,
                    "company_name": f"{sym} Ltd",
                    "quantity": int(qty) if qty.is_integer() else qty,
                    "avg_buy_price": avg_price,
                    "invested_value": round(avg_price * qty, 2),
                    "product": "CNC",
                    "isin": h.get("isin", ""),
                    "exchanges": h.get("tradable_exchanges", ["NSE"])
                })
            if cleaned:
                self.last_known_holdings = cleaned
                return cleaned
            return self.last_known_holdings
        except Exception as e:
            print("Failed to fetch live Groww holdings, using last known synced snapshot:", e)
            return self.last_known_holdings

    def fetch_live_margins(self) -> Dict[str, Any]:
        """Fetches live available funds & cash balance from Groww account."""
        try:
            client = self.get_client()
            margins = client.get_available_margin_details()
            clear_cash = float(margins.get("clear_cash") or margins.get("equity_margin_details", {}).get("cnc_balance_available") or 0.0)
            self.last_known_cash = clear_cash
            return {
                "available_cash": clear_cash,
                "net_margin_used": float(margins.get("net_margin_used") or 0.0),
                "raw": margins
            }
        except Exception as e:
            return {"available_cash": self.last_known_cash, "net_margin_used": 0.0}

    def fetch_live_positions(self) -> List[Dict[str, Any]]:
        """Fetches open intraday or F&O positions from Groww."""
        try:
            client = self.get_client()
            res = client.get_positions_for_user(timeout=5)
            positions = res.get("positions", []) if isinstance(res, dict) else []
            return positions
        except Exception as e:
            print("Failed to fetch Groww positions:", e)
            return []

    def place_live_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Places a live order via Groww."""
        client = self.get_client()
        sym = order_data["symbol"].upper()
        qty = int(order_data["quantity"])
        side = order_data["side"].upper()
        product = order_data.get("product", "CNC").upper()
        
        # Groww constants
        txn_type = GrowwAPI.TRANSACTION_TYPE_BUY if side == "BUY" else GrowwAPI.TRANSACTION_TYPE_SELL
        prod_type = GrowwAPI.PRODUCT_CNC if product == "CNC" else GrowwAPI.PRODUCT_MIS
        order_type = GrowwAPI.ORDER_TYPE_MARKET if order_data.get("order_type") == "MARKET" else GrowwAPI.ORDER_TYPE_LIMIT

        return client.place_order(
            trading_symbol=sym,
            quantity=qty,
            exchange=GrowwAPI.EXCHANGE_NSE,
            segment=GrowwAPI.SEGMENT_CASH,
            transaction_type=txn_type,
            order_type=order_type,
            product=prod_type,
            price=float(order_data.get("price") or 0.0)
        )

# Global singleton
groww_adapter = GrowwTradeApiAdapter()
