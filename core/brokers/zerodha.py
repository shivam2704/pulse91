"""
pulse91/backend/engines/zerodha_adapter.py
Official Zerodha Kite Connect v3 Adapter
Uses the official kiteconnect Python SDK (v5.2.2)
Documentation: https://kite.trade/docs/connect/v3
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("zerodha_adapter")

class ZerodhaAdapter:
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None, access_token: Optional[str] = None):
        self.api_key = api_key
        self.api_secret = api_secret
        self.access_token = access_token
        self.client = None

    def get_client(self):
        if not self.api_key:
            raise ValueError("Zerodha Kite API Key is required.")
        
        try:
            from kiteconnect import KiteConnect
            self.client = KiteConnect(api_key=self.api_key)
            if self.access_token:
                self.client.set_access_token(self.access_token)
            return self.client
        except Exception as e:
            logger.error(f"Failed to initialize KiteConnect client: {e}")
            raise

    def generate_session(self, request_token: str) -> str:
        """Exchanges Kite morning request_token for full-day access_token."""
        client = self.get_client()
        if not self.api_secret:
            raise ValueError("Kite API Secret is required to generate session from request_token.")
        
        session_data = client.generate_session(request_token, api_secret=self.api_secret)
        self.access_token = session_data.get("access_token")
        client.set_access_token(self.access_token)
        return self.access_token

    def get_holdings(self) -> List[Dict[str, Any]]:
        client = self.get_client()
        try:
            holdings = client.holdings()
            formatted = []
            for h in holdings:
                qty = int(h.get("quantity", 0)) + int(h.get("t1_quantity", 0))
                avg_p = float(h.get("average_price", 0.0))
                ltp = float(h.get("last_price", 0.0))
                invested = round(qty * avg_p, 2)
                cur_val = round(qty * ltp, 2)
                pnl = round(cur_val - invested, 2)
                pnl_pct = round((pnl / invested * 100) if invested > 0 else 0.0, 2)
                
                formatted.append({
                    "symbol": h.get("tradingsymbol", "STOCK"),
                    "company_name": h.get("tradingsymbol", "STOCK"),
                    "quantity": qty,
                    "avg_buy_price": avg_p,
                    "ltp": ltp,
                    "invested_value": invested,
                    "current_value": cur_val,
                    "unrealized_pnl": pnl,
                    "pnl_pct": pnl_pct,
                    "product": h.get("product", "CNC"),
                    "date_bought": "2026-11-01"
                })
            return formatted
        except Exception as e:
            logger.error(f"Zerodha get_holdings error: {e}")
            raise

    def get_funds(self) -> Dict[str, Any]:
        client = self.get_client()
        try:
            margins = client.margins(segment="equity")
            avail = float(margins.get("available", {}).get("cash", 0.0))
            return {"available_cash": avail}
        except Exception as e:
            logger.error(f"Zerodha get_funds error: {e}")
            return {"available_cash": 0.0}

zerodha_adapter = ZerodhaAdapter()
