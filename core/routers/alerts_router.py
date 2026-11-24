"""
pulse91/backend/routers/alerts_router.py
API endpoints for WhatsApp and Webhook Trade Alerts
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..engines.whatsapp_alerter import whatsapp_alerter
from ..engines.confluence_engine import confluence_engine

router = APIRouter(prefix="/api/v1/alerts", tags=["WhatsApp & Webhook Alerts"])

class WhatsAppSendPayload(BaseModel):
    symbol: str
    phone_number: Optional[str] = "+919876543210"
    webhook_url: Optional[str] = None

@router.post("/whatsapp/format")
def format_whatsapp_alert(symbol: str):
    """
    Generates cleanly formatted WhatsApp alert text for a given stock.
    """
    try:
        evaluation = confluence_engine.evaluate_stock(symbol)
        text = whatsapp_alerter.format_trade_alert(evaluation)
        return {
            "success": True,
            "symbol": symbol.upper(),
            "formatted_message": text
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/whatsapp/send")
def send_whatsapp_alert(payload: WhatsAppSendPayload):
    """
    Dispatches a live WhatsApp trade alert for a given stock.
    """
    try:
        evaluation = confluence_engine.evaluate_stock(payload.symbol)
        text = whatsapp_alerter.format_trade_alert(evaluation)
        res = whatsapp_alerter.dispatch_whatsapp(text, payload.phone_number, payload.webhook_url)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
