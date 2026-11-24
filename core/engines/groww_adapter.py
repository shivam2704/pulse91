"""
pulse91/backend/engines/groww_adapter.py
Live Groww Trade API Integration using official growwapi SDK
"""

import time
from typing import Dict, List, Any, Optional
from growwapi import GrowwAPI

class GrowwTradeApiAdapter:
    def __init__(self):
        self.api_key = "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1ODM5NDA1NjEsImlhdCI6MTc5NTU0MDU2MSwibmJmIjoxNzk1NTQwNTYxLCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCI3NjEzMTAzOC1hYTJkLTRlZTgtOWQ5OS02NDMwZmJmMzRiNzVcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZDZjMzI4NmEtZDQ5ZS00ZWMyLTkxZTgtMmEwNDU5YWNiMzlhXCIsXCJkZXZpY2VJZFwiOlwiNjUzYjE0NjUtMTI2My01YWRkLWFhOTctNDhlOTIzZTQyZTVhXCIsXCJzZXNzaW9uSWRcIjpcIjhjNThhNzZjLTc2MDEtNDczMy04YWJhLTFiODhlNTdmYjIxOVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkh2ZHR2MnhwQUdVZkl3Y0xDa3F3VzFSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIxNTIuNTguMTA3LjEyMCwxMDQuMjMuMjE2LjI0NiwzNS4yNDEuMjMuMTIzXCIsXCJ0d29GYUV4cGlyeVRzXCI6MjU4Mzk0MDU2MTYyOCxcInZlbmRvck5hbWVcIjpcImdyb3d3QXBpXCJ9IiwiaXNzIjoiYXBleC1hdXRoLXByb2QtYXBwIn0.yPP9SlcULTpoO_XckUNgifzmw-5fg6x4AHbsJnRIlr40wuwdrDzQAAPVXC9WKiWHr8Jjt4JGSyfzuiKK1eh8HQ"
        self.secret = "7t^nZHGBB&6MwdG1FmMXCe$GwPd&1&PB"
        self.access_token: Optional[str] = None
        self.token_expiry: float = 0
        self.client: Optional[GrowwAPI] = None
        self.last_known_holdings: List[Dict[str, Any]] = []
        self.last_known_cash: float = 2745.01

    def get_client(self) -> GrowwAPI:
        """Initializes or refreshes the live authenticated GrowwAPI client."""
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
