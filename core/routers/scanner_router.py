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

@router.get("/search")
def search_indices_and_stocks(q: str = Query(..., min_length=1, description="Search query for stocks or indices")):
    """
    Intelligent Search endpoint:
    Searches both indices and individual NSE stocks by symbol, name, or sector.
    """
    clean_q = q.strip().upper()
    clean_q_lower = q.strip().lower()

    # 1. Search Indices
    matching_indices = []
    index_aliases = {
        "SMALLCAP": "NIFTY_SMALLCAP_100",
        "SMALL": "NIFTY_SMALLCAP_100",
        "MIDCAP": "NIFTY_MIDCAP_100",
        "MID": "NIFTY_MIDCAP_100",
        "BANK": "NIFTY_BANK",
        "BANKNIFTY": "NIFTY_BANK",
        "AUTO": "NIFTY_AUTO",
        "IT": "NIFTY_IT",
        "TECH": "NIFTY_IT",
        "PHARMA": "NIFTY_PHARMA",
        "HEALTH": "NIFTY_PHARMA",
        "METAL": "NIFTY_METAL",
        "STEEL": "NIFTY_METAL",
        "FMCG": "NIFTY_FMCG",
        "NIFTY50": "NIFTY_50",
        "NEXT50": "NIFTY_NEXT_50",
    }

    alias_target = index_aliases.get(clean_q)

    for k, v in market_data_engine.indices.items():
        is_match = (
            clean_q in k or
            clean_q_lower in v["name"].lower() or
            clean_q_lower in v["description"].lower() or
            k == alias_target
        )
        if is_match:
            matching_indices.append({
                "type": "INDEX",
                "key": k,
                "name": v["name"],
                "description": v["description"],
                "count": len(v["symbols"])
            })

    # 2. Search Stocks
    matching_stocks = []
    seen_syms = set()

    for sym, meta in market_data_engine.stock_meta.items():
        if (
            clean_q in sym or
            clean_q_lower in meta["name"].lower() or
            clean_q_lower in meta["sector"].lower()
        ):
            seen_syms.add(sym)
            matching_stocks.append({
                "type": "STOCK",
                "symbol": sym,
                "name": meta["name"],
                "sector": meta["sector"],
                "ltp": market_data_engine.get_live_price(sym)
            })

    for idx_data in market_data_engine.indices.values():
        for sym in idx_data["symbols"]:
            if sym not in seen_syms and clean_q in sym:
                seen_syms.add(sym)
                matching_stocks.append({
                    "type": "STOCK",
                    "symbol": sym,
                    "name": f"{sym} Ltd",
                    "sector": "Diversified",
                    "ltp": market_data_engine.get_live_price(sym)
                })

    matching_stocks.sort(key=lambda s: (0 if s["symbol"] == clean_q else (1 if s["symbol"].startswith(clean_q) else 2)))

    return {
        "success": True,
        "query": q,
        "indices": matching_indices[:4],
        "stocks": matching_stocks[:8]
    }

@router.get("/index")
def scan_index_on_demand(
    index_key: str = Query("NIFTY_50", description="Index key, e.g. NIFTY_50, NIFTY_BANK, NIFTY_IT"),
    limit: Optional[int] = Query(None, description="Optional limit to return only Top N stocks (e.g. limit=15)")
):
    """
    On-Demand Index Scanner: Scans all constituent stocks in the requested index,
    computes 5-Pillar Confluence Scores, and returns ranked opportunities.
    Pass ?limit=15 to retrieve strictly the Top 15 highest-ranked constituents.
    """
    try:
        data = index_scanner_engine.scan_index(index_key, limit=limit)
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
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stock evaluation failed: {str(e)}")

@router.get("/candles/{symbol}")
def get_stock_candles(symbol: str, timeframe: str = "D", count: Optional[int] = None):
    """
    Retrieves OHLCV candle data for TradingView candlestick charts.
    Default: Daily = 250 bars (1 Year), Weekly = 104 bars (2 Years), Hourly = 120 bars.
    """
    try:
        actual_count = count if count is not None and count > 0 else 0
        candles = market_data_engine.generate_candles(symbol, timeframe, actual_count)
        return {"success": True, "symbol": symbol.upper(), "timeframe": timeframe, "candles": candles}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
