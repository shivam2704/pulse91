"""
Backward-compatibility shim for pulse91.core.engines.zerodha_adapter.
All Zerodha adapter logic is now maintained in pulse91.core.brokers.zerodha.
"""
from ..brokers.zerodha import *
