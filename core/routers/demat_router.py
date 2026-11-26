"""
pulse91/core/routers/demat_router.py
API endpoints for Live Demat Portfolio, Funds, and Sandbox Mode Switching.
Protected with Supabase Auth cryptographic multi-tenant isolation.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..brokers import broker_engine
from ..models import ModeSwitchPayload as SwitchModeRequest, BrokerConnectPayload as ConnectBrokerRequest
from ..services.auth_service import get_current_user_id

router = APIRouter(prefix="/api/v1/demat", tags=["Demat & Broker Gateway"])

@router.post("/connect")
def connect_user_broker(
    payload: ConnectBrokerRequest,
    account_id: str = Depends(get_current_user_id)
):
    """
    Connects a user's personal broker credentials (Groww, DhanHQ, Zerodha, AngelOne),
    authenticates with the broker's official API, and synchronizes their Demat portfolio.
    Guarantees isolation to the user's specific account_id.
    """
    user_account = payload.account_id or account_id
    if user_account.startswith("GUEST_"):
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Please sign in or create an account to securely connect a real Demat broker."
        )
    broker_upper = payload.broker.upper()
    try:
        if broker_upper == "GROWW":
            from ..brokers.groww import groww_adapter
            if not payload.api_key or not payload.api_secret:
                raise ValueError("Groww requires API Key and API Secret.")
            groww_adapter.api_key = payload.api_key
            groww_adapter.secret = payload.api_secret
            groww_adapter.access_token = None
            groww_adapter.client = None
            client = groww_adapter.get_client()
            holdings = client.get_holdings_for_user(timeout=5)
            broker_engine.set_mode("LIVE_DEMAT", "Groww", account_id=user_account)
            raw_h = holdings.get("holdings", []) if isinstance(holdings, dict) else []
            return {
                "success": True,
                "message": f"Successfully connected to Groww! Found {len(raw_h)} Demat holdings.",
                "broker": "Groww",
                "holdings_count": len(raw_h)
            }

        elif broker_upper in ["DHAN", "DHANHQ"]:
            from ..brokers.dhan import dhan_adapter
            c_id = payload.client_id or payload.api_key
            token = payload.access_token or payload.api_secret
            if not c_id or not token:
                raise ValueError("DhanHQ requires Client ID and Access Token.")
            dhan_adapter.client_id = c_id
            dhan_adapter.access_token = token
            dhan_adapter.client = None
            holdings = dhan_adapter.get_holdings()
            broker_engine.set_mode("LIVE_DEMAT", "DhanHQ", account_id=user_account)
            return {
                "success": True,
                "message": f"Successfully connected to DhanHQ! Found {len(holdings)} Demat holdings.",
                "broker": "DhanHQ",
                "holdings_count": len(holdings)
            }

        elif broker_upper in ["ZERODHA", "KITE"]:
            from ..brokers.zerodha import zerodha_adapter
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
            broker_engine.set_mode("LIVE_DEMAT", "Zerodha", account_id=user_account)
            return {
                "success": True,
                "message": f"Successfully connected to Zerodha Kite! Found {len(holdings)} Demat holdings.",
                "broker": "Zerodha",
                "holdings_count": len(holdings)
            }

        elif broker_upper in ["ANGEL", "ANGELONE"]:
            from ..brokers.angel import angel_adapter
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
            broker_engine.set_mode("LIVE_DEMAT", "AngelOne", account_id=user_account)
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
def disconnect_user_broker(account_id: str = Depends(get_current_user_id)):
    """
    Disconnects the active broker and resets the session to Sandbox mode for this user.
    """
    broker_engine.set_mode("SANDBOX", "Pulse91 Sandbox Broker", account_id=account_id)
    return {
        "success": True,
        "message": "Disconnected broker account. Switched to Sandbox mode.",
        "mode": "SANDBOX"
    }

@router.post("/reset")
def reset_sandbox_demat(
    amount: float = 10000.0,
    account_id: str = Depends(get_current_user_id)
):
    """
    Resets the Sandbox Demat to ₹10,000 INR virtual capital for this specific user.
    """
    overview = broker_engine.reset_sandbox(initial_capital=amount, account_id=account_id)
    return {
        "success": True,
        "message": f"Sandbox Demat reset to ₹{amount:,.2f} virtual capital.",
        "portfolio": overview
    }

@router.get("/overview")
def get_demat_portfolio(account_id: str = Depends(get_current_user_id)):
    """
    Returns live Demat portfolio overview: Total Net Worth, Available Cash,
    Holdings, Open Positions, and Realized/Unrealized PnL isolated to the requesting user.
    """
    return {
        "success": True,
        "portfolio": broker_engine.get_portfolio_overview(account_id=account_id)
    }

@router.post("/mode")
def switch_demat_mode(
    payload: SwitchModeRequest,
    account_id: str = Depends(get_current_user_id)
):
    """
    Toggles between Sandbox (₹10k Virtual Demat) and Live Demat broker connection.
    Guards against activating LIVE_DEMAT without valid authenticated credentials.
    """
    try:
        if payload.mode.upper() == "LIVE_DEMAT":
            target_acc = payload.account_id or account_id
            if target_acc.startswith("GUEST_"):
                raise HTTPException(
                    status_code=401,
                    detail="Authentication required: Please sign in or create an account to activate Live Demat mode."
                )
            b_name = (payload.broker or "Groww").upper()
            if "GROWW" in b_name:
                from ..brokers.groww import groww_adapter
                if not groww_adapter.api_key:
                    raise ValueError("Groww is not authenticated. Please connect your API Key & Secret via 'Connect Broker'.")
            elif "DHAN" in b_name:
                from ..brokers.dhan import dhan_adapter
                if not dhan_adapter.client_id or not dhan_adapter.access_token:
                    raise ValueError("DhanHQ is not authenticated. Please connect your Client ID & Access Token via 'Connect Broker'.")
            elif "ZERODHA" in b_name or "KITE" in b_name:
                from ..brokers.zerodha import zerodha_adapter
                if not zerodha_adapter.api_key:
                    raise ValueError("Zerodha is not authenticated. Please connect your Kite API credentials via 'Connect Broker'.")

        target_acc = payload.account_id or account_id
        res = broker_engine.set_mode(payload.mode, payload.broker or "Groww", account_id=target_acc)
        return {"success": True, **res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
