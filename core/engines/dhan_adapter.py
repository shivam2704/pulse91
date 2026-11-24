"""
pulse91/backend/engines/dhan_adapter.py
Official DhanHQ API v2 Client Adapter
Uses the official dhanhq Python SDK (v2.3.0)
Documentation: https://dhanhq.co/docs/v2
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("dhan_adapter")

class DhanAdapter:
    def __init__(self, client_id: Optional[str] = None, access_token: Optional[str] = None):
        self.client_id = client_id
        self.access_token = access_token
        self.client = None

    def get_client(self):
        if not self.client_id or not self.access_token:
            raise ValueError("Dhan Client ID and Access Token are required.")
        
        try:
            from dhanhq import DhanContext, dhanhq
            context = DhanContext(self.client_id, self.access_token)
            self.client = dhanhq(context)
            return self.client
        except Exception as e:
            logger.error(f"Failed to initialize DhanHQ client: {e}")
            raise

    def get_holdings(self) -> List[Dict[str, Any]]:
        client = self.get_client()
        try:
            res = client.get_holdings()
            if isinstance(res, dict) and res.get("status") == "success":
                data = res.get("data", [])
                formatted = []
                for item in data:
                    formatted.append({
                        "symbol": item.get("tradingSymbol", "STOCK"),
                        "company_name": item.get("tradingSymbol", "STOCK"),
                        "quantity": int(item.get("totalQty", 0)),
                        "avg_buy_price": float(item.get("avgCostPrice", 0.0)),
                        "ltp": float(item.get("lastTradedPrice", 0.0)),
                        "invested_value": round(float(item.get("avgCostPrice", 0.0)) * int(item.get("totalQty", 0)), 2),
                        "current_value": round(float(item.get("lastTradedPrice", 0.0)) * int(item.get("totalQty", 0)), 2),
                        "unrealized_pnl": round(float(item.get("unrealizedProfitLoss", 0.0)), 2),
                        "pnl_pct": round(float(item.get("pnlPercentage", 0.0)), 2),
                        "product": "CNC",
                        "date_bought": "2026-11-01"
                    })
                return formatted
            elif isinstance(res, list):
                return res
            return []
        except Exception as e:
            logger.error(f"Dhan get_holdings error: {e}")
            raise

    def get_funds(self) -> Dict[str, Any]:
        client = self.get_client()
        try:
            res = client.get_fund_limits()
            if isinstance(res, dict) and res.get("status") == "success":
                data = res.get("data", {})
                avail = float(data.get("availabelBalance", data.get("availableCash", 0.0)))
                return {"available_cash": avail, "collateral": float(data.get("collateralAmount", 0.0))}
            return {"available_cash": 0.0}
        except Exception as e:
            logger.error(f"Dhan get_funds error: {e}")
            return {"available_cash": 0.0}

dhan_adapter = DhanAdapter()
