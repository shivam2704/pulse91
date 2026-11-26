"""
pulse91/core/models/alerts.py
Pydantic Models for WhatsApp & Webhook Alerts.
"""

from pydantic import BaseModel
from typing import Optional

class WhatsAppSendPayload(BaseModel):
    symbol: str
    phone_number: Optional[str] = None
    webhook_url: Optional[str] = None

class WhatsAppConfigPayload(BaseModel):
    phone_number: Optional[str] = ""
    webhook_url: Optional[str] = None
    alerts_enabled: Optional[bool] = True
