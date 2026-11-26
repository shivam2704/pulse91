"""
pulse91/backend/engines/angel_adapter.py
Official Angel One SmartAPI Adapter
Uses the official smartapi-python SDK (v1.5.5) + pyotp
Documentation: https://smartapi.angelone.in/docs
"""

import logging
from typing import Dict, Any, List, Optional
import pyotp

logger = logging.getLogger("angel_adapter")

class AngelAdapter:
    def __init__(
        self,
        api_key: Optional[str] = None,
        client_code: Optional[str] = None,
        pin: Optional[str] = None,
        totp_secret: Optional[str] = None
    ):
        self.api_key = api_key
        self.client_code = client_code
        self.pin = pin
        self.totp_secret = totp_secret
        self.client = None
        self.auth_token = None
        self.refresh_token = None
        self.feed_token = None

    def get_client(self):
        if not self.api_key or not self.client_code or not self.pin:
            raise ValueError("Angel One API Key, Client Code, and PIN are required.")
        
        try:
            from SmartApi import SmartConnect
            self.client = SmartConnect(api_key=self.api_key)
            
            # Generate 6-digit TOTP
            if self.totp_secret:
                cleaned_totp = self.totp_secret.replace(" ", "").strip()
                if len(cleaned_totp) == 6 and cleaned_totp.isdigit():
                    otp = cleaned_totp
                else:
                    otp = pyotp.TOTP(cleaned_totp).now()
            else:
                raise ValueError("TOTP Secret or current 6-digit TOTP is required for Angel One login.")

            data = self.client.generateSession(self.client_code, self.pin, otp)
            if data and data.get("status"):
                self.auth_token = data.get("data", {}).get("jwtToken")
                self.feed_token = data.get("data", {}).get("feedToken")
                return self.client
            else:
                msg = data.get("message", "SmartAPI session generation failed.") if data else "No response"
                raise ConnectionError(f"Angel One Login Failed: {msg}")
        except Exception as e:
            logger.error(f"Failed to authenticate Angel One SmartAPI: {e}")
            raise

    def get_holdings(self) -> List[Dict[str, Any]]:
        client = self.get_client()
        try:
            res = client.holding()
            if isinstance(res, dict) and res.get("status"):
                data = res.get("data", [])
                formatted = []
                for h in data:
                    qty = int(h.get("totalqty", h.get("quantity", 0)))
                    avg_p = float(h.get("averageprice", h.get("avgPrice", 0.0)))
                    ltp = float(h.get("ltp", 0.0))
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
                        "product": h.get("producttype", "CNC"),
                        "date_bought": "2026-11-01"
                    })
                return formatted
            return []
        except Exception as e:
            logger.error(f"Angel One get_holdings error: {e}")
            raise

    def get_funds(self) -> Dict[str, Any]:
        client = self.get_client()
        try:
            res = client.rmsLimit()
            if isinstance(res, dict) and res.get("status"):
                data = res.get("data", {})
                avail = float(data.get("net", data.get("availablecash", 0.0)))
                return {"available_cash": avail}
            return {"available_cash": 0.0}
        except Exception as e:
            logger.error(f"Angel One get_funds error: {e}")
            return {"available_cash": 0.0}

angel_adapter = AngelAdapter()
