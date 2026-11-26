"""
pulse91/backend/routers/demat_router.py
API endpoints for Live Demat Portfolio, Funds, and Sandbox Mode Switching
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..engines.broker_engine import broker_engine

router = APIRouter(prefix="/api/v1/demat", tags=["Demat & Broker Gateway"])

class SwitchModeRequest(BaseModel):
    mode: str # "SANDBOX" or "LIVE_DEMAT"
    broker: Optional[str] = "Groww"
    account_id: Optional[str] = "PULSE91-CLIENT-01"

class ConnectBrokerRequest(BaseModel):
    broker: str = "Groww"
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    client_id: Optional[str] = None       # Dhan Client ID / Angel Client Code
    access_token: Optional[str] = None    # Dhan / Zerodha Access Token
    pin: Optional[str] = None             # Angel One MPIN
    totp_secret: Optional[str] = None     # Angel One TOTP
    account_id: Optional[str] = None

@router.post("/connect")
def connect_user_broker(payload: ConnectBrokerRequest):
    """
    Connects a user's personal broker credentials (Groww, DhanHQ, Zerodha, AngelOne),
    authenticates with the broker's official API, and synchronizes their Demat portfolio.
    """
    broker_upper = payload.broker.upper()
    try:
        if broker_upper == "GROWW":
            from ..engines.groww_adapter import groww_adapter
            if not payload.api_key or not payload.api_secret:
                raise ValueError("Groww requires API Key and API Secret.")
            groww_adapter.api_key = payload.api_key
            groww_adapter.secret = payload.api_secret
            groww_adapter.access_token = None
            groww_adapter.client = None
            client = groww_adapter.get_client()
            holdings = client.get_holdings_for_user(timeout=5)
            broker_engine.set_mode("LIVE_DEMAT", "Groww", payload.account_id or "GROWW-USER")
            raw_h = holdings.get("holdings", []) if isinstance(holdings, dict) else []
            return {
                "success": True,
                "message": f"Successfully connected to Groww! Found {len(raw_h)} Demat holdings.",
                "broker": "Groww",
                "holdings_count": len(raw_h)
            }

        elif broker_upper in ["DHAN", "DHANHQ"]:
            from ..engines.dhan_adapter import dhan_adapter
            c_id = payload.client_id or payload.api_key
            token = payload.access_token or payload.api_secret
            if not c_id or not token:
                raise ValueError("DhanHQ requires Client ID and Access Token.")
            dhan_adapter.client_id = c_id
            dhan_adapter.access_token = token
            dhan_adapter.client = None
            holdings = dhan_adapter.get_holdings()
            broker_engine.set_mode("LIVE_DEMAT", "DhanHQ", payload.account_id or f"DHAN-{c_id}")
            return {
                "success": True,
                "message": f"Successfully connected to DhanHQ! Found {len(holdings)} Demat holdings.",
                "broker": "DhanHQ",
                "holdings_count": len(holdings)
            }

        elif broker_upper in ["ZERODHA", "KITE"]:
            from ..engines.zerodha_adapter import zerodha_adapter
            key = payload.api_key
            secret = payload.api_secret
            token = payload.access_token
            if not key or not (token or secret):
                raise ValueError("Zerodha requires Kite API Key and Access Token (or API Secret).")
            zerodha_adapter.api_key = key
            zerodha_adapter.api_secret = secret
            zerodha_adapter.access_token = token
            zerodha_adapter.client = None
            holdings = zerodha_adapter.get_holdings()
            broker_engine.set_mode("LIVE_DEMAT", "Zerodha", payload.account_id or f"KITE-{key[:6]}")
            return {
                "success": True,
                "message": f"Successfully connected to Zerodha Kite! Found {len(holdings)} Demat holdings.",
                "broker": "Zerodha",
                "holdings_count": len(holdings)
            }

        elif broker_upper in ["ANGEL", "ANGELONE"]:
            from ..engines.angel_adapter import angel_adapter
            key = payload.api_key
            c_code = payload.client_id or payload.account_id
            pin = payload.pin or payload.api_secret
            totp = payload.totp_secret
            if not key or not c_code or not pin or not totp:
                raise ValueError("Angel One requires API Key, Client Code, PIN, and TOTP.")
            angel_adapter.api_key = key
            angel_adapter.client_code = c_code
            angel_adapter.pin = pin
            angel_adapter.totp_secret = totp
            angel_adapter.client = None
            holdings = angel_adapter.get_holdings()
            broker_engine.set_mode("LIVE_DEMAT", "AngelOne", payload.account_id or f"ANGEL-{c_code}")
            return {
                "success": True,
                "message": f"Successfully connected to Angel One SmartAPI! Found {len(holdings)} Demat holdings.",
                "broker": "AngelOne",
                "holdings_count": len(holdings)
            }
        else:
            raise ValueError(f"Unsupported broker: {payload.broker}. Supported: Groww, DhanHQ, Zerodha, AngelOne")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Broker Authentication Failed: {str(e)}")

@router.post("/disconnect")
def disconnect_user_broker():
    """
    Disconnects the active broker and resets the session to Sandbox mode.
    """
    broker_engine.set_mode("SANDBOX", "Pulse91 Sandbox Broker", "PULSE91-DEMAT-SBX-01")
    return {
        "success": True,
        "message": "Disconnected broker account. Switched to Sandbox mode.",
        "mode": "SANDBOX"
    }

@router.post("/reset")
def reset_sandbox_demat(amount: float = 10000.0):
    """
    Resets the Sandbox Demat to ₹10,000 INR virtual capital.
    """
    overview = broker_engine.reset_sandbox(initial_capital=amount)
    return {
        "success": True,
        "message": f"Sandbox Demat reset to ₹{amount:,.2f} virtual capital.",
        "portfolio": overview
    }

@router.get("/overview")
def get_demat_portfolio():
    """
    Returns live Demat portfolio overview: Total Net Worth, Available Cash,
    Holdings, Open Positions, and Realized/Unrealized PnL.
    """
    return {
        "success": True,
        "portfolio": broker_engine.get_portfolio_overview()
    }

@router.post("/mode")
def switch_demat_mode(payload: SwitchModeRequest):
    """
    Toggles between Sandbox (₹10k Virtual Demat) and Live Demat broker connection.
    """
    try:
        res = broker_engine.set_mode(payload.mode, payload.broker or "DhanHQ", payload.account_id or "CLIENT_01")
        return {"success": True, **res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
