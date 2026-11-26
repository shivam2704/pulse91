"""
pulse91/core/models/orders.py
Pydantic Request & Response Models for Order Execution & Risk Management.
"""

from pydantic import BaseModel, Field
from typing import Optional

class OrderPayload(BaseModel):
    symbol: str
    quantity: int = Field(gt=0, description="Number of shares to execute")
    side: str = Field(default="BUY", pattern="^(BUY|SELL)$")
    product: str = Field(default="CNC", pattern="^(CNC|MIS)$") # CNC: Delivery, MIS: Intraday
    order_type: str = Field(default="MARKET", pattern="^(MARKET|LIMIT)$")
    price: Optional[float] = None
    sl_price: Optional[float] = None
    target_price: Optional[float] = None

class ExitPayload(BaseModel):
    symbol: str
