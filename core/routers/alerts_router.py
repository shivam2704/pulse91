"""
pulse91/backend/routers/alerts_router.py
API endpoints for WhatsApp and Webhook Trade Alerts
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from ..services import whatsapp_alerter
from ..quant import confluence_engine
from ..models import WhatsAppSendPayload, WhatsAppConfigPayload

router = APIRouter(prefix="/api/v1/alerts", tags=["WhatsApp & Webhook Alerts"])

@router.get("/config")
def get_whatsapp_config():
    """
    Returns current active WhatsApp alert configuration.
    """
    return {
        "success": True,
        "phone_number": whatsapp_alerter.default_phone,
        "webhook_url": whatsapp_alerter.webhook_url,
        "is_linked": bool(whatsapp_alerter.default_phone),
        "recent_alerts_count": len(whatsapp_alerter.alerts_log)
    }

@router.post("/config")
def update_whatsapp_config(payload: WhatsAppConfigPayload):
    """
    Updates the linked WhatsApp phone number and alert preferences.
    """
    try:
        clean_phone = payload.phone_number.strip() if payload.phone_number else ""
        if clean_phone:
            if not clean_phone.startswith('+'):
                clean_phone = f"+91{clean_phone}" if len(clean_phone) == 10 else f"+{clean_phone}"
            whatsapp_alerter.set_config(phone=clean_phone, webhook=payload.webhook_url)
            return {
                "success": True,
                "message": f"WhatsApp successfully linked to {clean_phone}",
                "phone_number": clean_phone,
                "is_linked": True
            }
        else:
            whatsapp_alerter.default_phone = None
            return {
                "success": True,
                "message": "WhatsApp notifications disabled (No phone configured)",
                "phone_number": None,
                "is_linked": False
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/test")
def send_test_whatsapp_alert(payload: Optional[WhatsAppConfigPayload] = None):
    """
    Sends a test institutional trade alert receipt to verify WhatsApp connectivity.
    """
    try:
        target_phone = payload.phone_number if payload and payload.phone_number else whatsapp_alerter.default_phone
        test_msg = f"""⚡ *PULSE91 DEMAT GATEWAY • TEST VERIFIED*
━━━━━━━━━━━━━━━━━━━━
🟢 *Status:* *WhatsApp Gateway Linked Successfully*
📱 *Target Phone:* {target_phone}
⏰ *Timestamp:* Live Dalal Street Feed
🛡️ *SEBI Compliance:* Hardware Fault-Safe GTT Active

📈 *AUTOMATED NOTIFICATIONS ENABLED:*
• Instant Deal Fill Receipts (CNC & MIS)
• Dynamic ATR Target 1 Profit Exits
• Volatility Trailing Stop-Loss Protection Triggers
• Monday 09:15 AM Top-15 VCP Momentum Picks
━━━━━━━━━━━━━━━━━━━━
⚡ *Pulse91 Quant Terminal* • Dalal Street Engine"""
        res = whatsapp_alerter.dispatch_whatsapp(test_msg, target_phone, payload.webhook_url if payload else None)
        return {
            "success": True,
            "recipient": target_phone,
            "preview": test_msg,
            "dispatch_result": res
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
