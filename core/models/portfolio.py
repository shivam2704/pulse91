"""
pulse91/core/models/portfolio.py
Pydantic Models for Demat Portfolio & Broker Gateway.
"""

from pydantic import BaseModel
from typing import Optional

class ModeSwitchPayload(BaseModel):
    mode: str = "SANDBOX" # SANDBOX or LIVE_DEMAT
    broker: Optional[str] = "Groww"
    account_id: Optional[str] = "GROWW-USER-01"

class BrokerConnectPayload(BaseModel):
    broker: str
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    client_id: Optional[str] = None
    access_token: Optional[str] = None
    pin: Optional[str] = None
    mode: Optional[str] = "LIVE_DEMAT"
