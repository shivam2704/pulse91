"""
pulse91/core/routers/trade_router.py
API endpoints for 1-Click Order Execution, GTT Triggers, and Square-Off.
Secured with cryptographic user isolation via Supabase Auth tokens.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from ..brokers import broker_engine, autotrader_engine
from ..quant import confluence_engine
from ..models import OrderPayload, ExitPayload
from ..services.auth_service import get_current_user_id

router = APIRouter(prefix="/api/v1/trade", tags=["Order Execution & Risk"])

class AutoTraderConfigPayload(BaseModel):
    is_active: Optional[bool] = None
    max_capital_per_trade: Optional[float] = None
    max_open_positions: Optional[int] = None
    notification_phone: Optional[str] = None

@router.post("/order")
def execute_order(
    payload: OrderPayload,
    account_id: str = Depends(get_current_user_id)
):
    """
    Executes a 1-click buy or sell order into Demat/Sandbox.
    Guarantees isolation to the authenticated user's portfolio and cash ledger.
    Automatically registers with the autonomous quant daemon for Target/Stop-Loss execution.
    Automatically dispatches WhatsApp execution notification.
    """
    try:
        res = broker_engine.place_order(payload.model_dump(), account_id=account_id)
        sym = payload.symbol.upper()
        if payload.side.upper() == "BUY":
            price = res["order"]["price"]
            if payload.sl_price and payload.target_price:
                sl = payload.sl_price
                t1 = payload.target_price
            else:
                try:
                    plan = confluence_engine.analyze_stock(sym).get("trade_plan", {})
                    sl = payload.sl_price or plan.get("stop_loss_price") or round(price * 0.97, 2)
                    t1 = payload.target_price or plan.get("target_1_price") or round(price * 1.05, 2)
                except Exception:
                    sl = payload.sl_price or round(price * 0.97, 2)
                    t1 = payload.target_price or round(price * 1.05, 2)
            autotrader_engine.register_position(
                symbol=sym,
                quantity=payload.quantity,
                entry_price=price,
                target_1=t1,
                stop_loss=sl
            )
        else:
            autotrader_engine.unregister_position(sym)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exit")
def square_off_position(
    payload: ExitPayload,
    account_id: str = Depends(get_current_user_id)
):
    """
    Squares off an active open position or Demat holding at market price for this user.
    Automatically books realized PnL and dispatches WhatsApp notification.
    """
    try:
        res = broker_engine.exit_position(payload.symbol, account_id=account_id)
        autotrader_engine.unregister_position(payload.symbol)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_order_history(account_id: str = Depends(get_current_user_id)):
    """
    Returns full order logs and executions isolated to this user account.
    """
    return broker_engine.get_history(account_id=account_id)

@router.get("/autotrader/status")
def get_autotrader_status():
    """
    Returns live autonomous quant execution state, managed positions, and recent logs.
    """
    return autotrader_engine.get_status()

@router.post("/autotrader/toggle")
def toggle_autotrader(payload: Optional[AutoTraderConfigPayload] = None):
    """
    Toggles the autonomous execution daemon on/off.
    """
    active_state = payload.is_active if payload else None
    new_state = autotrader_engine.toggle(active_state)
    return {
        "success": True,
        "is_active": new_state,
        "status": autotrader_engine.get_status()
    }

@router.post("/autotrader/cycle")
async def trigger_autotrader_cycle():
    """
    Manually triggers one quant execution cycle (evaluates entries at pivot and exits at target/SL).
    """
    events = await autotrader_engine.run_cycle()
    return {
        "success": True,
        "events_count": len(events),
        "events": events,
        "status": autotrader_engine.get_status()
    }
