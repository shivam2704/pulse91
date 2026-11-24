"""
pulse91/backend/routers/scanner_router.py
API endpoints for On-Demand Index Scanning, Monday 8 AM Scan, and Single-Stock Deep Dive
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..engines.index_scanner import index_scanner_engine
from ..engines.confluence_engine import confluence_engine
from ..engines.market_data import market_data_engine

router = APIRouter(prefix="/api/v1/scan", tags=["Scanner & Confluence Analysis"])

@router.get("/indices")
def get_available_indices():
    """Returns list of available Indian stock indices for on-demand scanning."""
    return {
        "success": True,
        "indices": index_scanner_engine.get_available_indices()
    }

@router.get("/index")
def scan_index_on_demand(index_key: str = Query("NIFTY_50", description="Index key, e.g. NIFTY_50, NIFTY_BANK, NIFTY_IT")):
    """
    On-Demand Index Scanner: Scans all constituent stocks in the requested index,
    computes 5-Pillar Confluence Scores, and returns ranked opportunities.
    """
    try:
        data = index_scanner_engine.scan_index(index_key)
        return {"success": True, **data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/monday-top15")
def get_monday_weekly_top15(refresh: bool = False):
    """
    Monday 08:00 AM Master Weekly Scan:
    Returns the Top 15 highest-confluence stock setups for the trading week.
    """
    try:
        data = index_scanner_engine.run_monday_8am_scan(force_refresh=refresh)
        return {"success": True, **data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stock/{symbol}")
def evaluate_single_stock(symbol: str):
    """
    Deep-dive 5-Pillar evaluation on any specific NSE/BSE stock ticker.
    """
    try:
        evaluation = confluence_engine.evaluate_stock(symbol)
        return {"success": True, "data": evaluation}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stock evaluation failed: {str(e)}")

@router.get("/candles/{symbol}")
def get_stock_candles(symbol: str, timeframe: str = "D", count: int = 40):
    """
    Retrieves OHLCV candle data for TradingView candlestick charts.
    """
    try:
        candles = market_data_engine.generate_candles(symbol, timeframe, count)
        return {"success": True, "symbol": symbol.upper(), "candles": candles}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
