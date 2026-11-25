"""
pulse91/backend/routers/trade_router.py
API endpoints for 1-Click Order Execution, GTT Triggers, and Square-Off
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..engines.broker_engine import broker_engine
from ..engines.autotrader_engine import autotrader_engine

router = APIRouter(prefix="/api/v1/trade", tags=["Order Execution & Risk"])

class OrderPayload(BaseModel):
    symbol: str
    quantity: int
    side: str = "BUY" # "BUY" or "SELL"
    product: str = "CNC" # "CNC" (Delivery) or "MIS" (Intraday)
    order_type: str = "MARKET"
    price: Optional[float] = None
    sl_price: Optional[float] = None
    target_price: Optional[float] = None

class ExitPayload(BaseModel):
    symbol: str

class AutoTraderConfigPayload(BaseModel):
    is_active: Optional[bool] = None
    max_capital_per_trade: Optional[float] = None
    max_open_positions: Optional[int] = None
    notification_phone: Optional[str] = None

@router.post("/order")
def execute_order(payload: OrderPayload):
    """
    Executes a 1-click buy or sell order into Demat/Sandbox.
    Automatically registers with the autonomous quant daemon for Target/Stop-Loss execution.
    Automatically dispatches WhatsApp execution notification.
    """
    try:
        res = broker_engine.place_order(payload.model_dump())
        sym = payload.symbol.upper()
        if payload.side.upper() == "BUY":
            price = res["order"]["price"]
            sl = payload.sl_price or round(price * 0.9722, 2)
            t1 = payload.target_price or round(price * 1.0555, 2)
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
def square_off_position(payload: ExitPayload):
    """
    Squares off an active open position or Demat holding at market price.
    Automatically books realized PnL and dispatches WhatsApp notification.
    """
    try:
        res = broker_engine.exit_position(payload.symbol)
        autotrader_engine.unregister_position(payload.symbol)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history")
def get_order_history():
    """
    Returns full order logs and executions.
    """
    return {
        "orders": broker_engine.orders,
        "gtt_triggers": broker_engine.gtt_triggers
    }

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
