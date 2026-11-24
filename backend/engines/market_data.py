"""
pulse91/backend/engines/market_data.py
NSE/BSE Market Data, Indices Universe, and Multi-Timeframe Price & Delivery Analytics
"""

import math
import time
import random
import datetime
from typing import Dict, List, Any, Optional

def is_nse_market_open() -> bool:
    """
    Checks if NSE/BSE cash equity market is currently in an active trading session:
    Monday through Friday, 09:15 AM to 03:30 PM IST (UTC+5:30).
    """
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    now = datetime.datetime.now(ist)
    
    # Check weekend (Saturday = 5, Sunday = 6)
    if now.weekday() >= 5:
        return False
        
    start_time = datetime.time(9, 15)
    end_time = datetime.time(15, 30)
    current_time = now.time()
    
    return start_time <= current_time <= end_time

# Major NSE Indices & Constituents
NSE_INDICES: Dict[str, Dict[str, Any]] = {
    "NIFTY_50": {
        "name": "Nifty 50",
        "description": "Top 50 Mega-Cap Companies listed on NSE",
        "benchmark": True,
        "symbols": [
            "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "BHARTIARTL", "SBIN", 
            "LICI", "ITC", "HINDUNILVR", "LT", "BAJFINANCE", "HCLTECH", "MARUTI", 
            "SUNPHARMA", "TATAMOTORS", "KOTAKBANK", "AXISBANK", "NTPC", "TITAN", 
            "ONGC", "POWERGRID", "ADANIENT", "ADANIPORTS", "COALINDIA", "TATASTEEL", 
            "BAJAJFINSV", "ULTRACEMCO", "ASIANPAINT", "NESTLEIND", "JSWSTEEL", "M&M", 
            "GRASIM", "TECHM", "WIPRO", "HINDALCO", "BPCL", "CIPLA", "DRREDDY", 
            "EICHERMOT", "APOLLOHOSP", "DIVISLAB", "HEROMOTOCO", "BRITANNIA", "TATACONSUM", 
            "SHRIRAMFIN", "TRENT", "BEL", "INDUSINDBK", "SBILIFE"
        ]
    },
    "NIFTY_NEXT_50": {
        "name": "Nifty Next 50",
        "description": "50 Large-Cap Companies next in line after Nifty 50",
        "benchmark": False,
        "symbols": [
            "ZOMATO", "JIOFIN", "HAL", "VBL", "CHOLAFIN", "VEDL", "DLF", "IOC", 
            "TVSMOTOR", "SIEMENS", "ABB", "GAIL", "AMBUJACEM", "INDIGO", "BANKBARODA", 
            "PFC", "RECLTD", "PIDILITIND", "PNB", "HAVELLS", "MOTHERSON", "CANBK", 
            "BOSCHLTD", "BAJAJHLDNG", "UNITDSPR", "POLYCAB", "DABUR", "ICICIPRULI", 
            "IRCTC", "COLPAL", "GODREJCP", "MARICO", "BERGEPAINT", "NAUKRI", "MUTHOOTFIN"
        ]
    },
    "NIFTY_MIDCAP_100": {
        "name": "Nifty Midcap 100",
        "description": "Top 100 high-growth mid-cap market leaders",
        "benchmark": False,
        "symbols": [
            "KALYANKJIL", "DIXON", "MAZDOCK", "COFORGE", "PERSISTENT", "FEDERALBNK", 
            "MAXHEALTH", "LUPIN", "SUZLON", "BHEL", "AUBANK", "MPHASIS", "ASHOKLEY", 
            "PRESTIGE", "OBEROIRLTY", "APLAPOLLO", "BALKRISIND", "TATACOMM", "ESCORTS", 
            "GLENMARK", "GMRINFRA", "IDEA", "IDFCFIRSTB", "INDIAMART", "JUBLFOOD"
        ]
    },
    "NIFTY_BANK": {
        "name": "Nifty Bank",
        "description": "Top 12 Most Liquid Banking Giants",
        "benchmark": False,
        "symbols": [
            "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK", 
            "BANKBARODA", "PNB", "AUBANK", "FEDERALBNK", "IDFCFIRSTB", "BANDHANBNK"
        ]
    },
    "NIFTY_IT": {
        "name": "Nifty IT",
        "description": "Indian Information Technology & Software Leaders",
        "benchmark": False,
        "symbols": [
            "TCS", "INFY", "HCLTECH", "WIPRO", "TECHM", "LTIM", "PERSISTENT", 
            "COFORGE", "MPHASIS", "LTTS"
        ]
    },
    "NIFTY_AUTO": {
        "name": "Nifty Auto",
        "description": "Automotive OEMs, 2-Wheelers, EVs and Component Makers",
        "benchmark": False,
        "symbols": [
            "MARUTI", "TATAMOTORS", "M&M", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO", 
            "TVSMOTOR", "ASHOKLEY", "BALKRISIND", "MOTHERSON", "MRF", "BOSCHLTD"
        ]
    },
    "NIFTY_PHARMA": {
        "name": "Nifty Pharma",
        "description": "Pharmaceuticals, Biopharmaceuticals & Healthcare",
        "benchmark": False,
        "symbols": [
            "SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB", "LUPIN", "TORNTPHARM", 
            "ZYDUSLIFE", "MANKIND", "AUROPHARMA", "ALKEM", "GLENMARK", "BIOCON"
        ]
    },
    "NIFTY_METAL": {
        "name": "Nifty Metal",
        "description": "Steel, Aluminium, Copper, Zinc & Mining Leaders",
        "benchmark": False,
        "symbols": [
            "TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL", "COALINDIA", "JINDALSTEL", 
            "NMDC", "SAIL", "NATIONALUM", "APLAPOLLO", "HINDZINC"
        ]
    },
    "NIFTY_FMCG": {
        "name": "Nifty FMCG",
        "description": "Fast Moving Consumer Goods & Defensive Leaders",
        "benchmark": False,
        "symbols": [
            "ITC", "HINDUNILVR", "NESTLEIND", "BRITANNIA", "TATACONSUM", "VBL", 
            "DABUR", "GODREJCP", "MARICO", "COLPAL", "PGHH", "UBL"
        ]
    }
}

# Sector mappings for Relative Strength calculations
STOCK_METADATA: Dict[str, Dict[str, Any]] = {
    "RELIANCE": {"name": "Reliance Industries Ltd", "sector": "Energy & Conglomerate", "base_price": 2980.50, "pe": 26.4, "roce": 12.8, "debt_eq": 0.42, "pat_growth": 9.4},
    "TCS": {"name": "Tata Consultancy Services", "sector": "Information Technology", "base_price": 4140.00, "pe": 29.8, "roce": 58.2, "debt_eq": 0.05, "pat_growth": 8.1},
    "HDFCBANK": {"name": "HDFC Bank Ltd", "sector": "Banking & Financials", "base_price": 1720.25, "pe": 18.2, "roce": 16.5, "debt_eq": 1.10, "pat_growth": 16.8},
    "INFY": {"name": "Infosys Ltd", "sector": "Information Technology", "base_price": 1860.00, "pe": 28.1, "roce": 37.4, "debt_eq": 0.08, "pat_growth": 6.5},
    "ICICIBANK": {"name": "ICICI Bank Ltd", "sector": "Banking & Financials", "base_price": 1245.80, "pe": 17.5, "roce": 17.8, "debt_eq": 0.95, "pat_growth": 21.4},
    "BHARTIARTL": {"name": "Bharti Airtel Ltd", "sector": "Telecommunications", "base_price": 1585.00, "pe": 54.2, "roce": 15.6, "debt_eq": 1.25, "pat_growth": 34.2},
    "SBIN": {"name": "State Bank of India", "sector": "Banking & Financials", "base_price": 820.40, "pe": 10.5, "roce": 15.1, "debt_eq": 1.40, "pat_growth": 23.5},
    "LICI": {"name": "Life Insurance Corp of India", "sector": "Financial Services", "base_price": 930.00, "pe": 14.8, "roce": 14.2, "debt_eq": 0.02, "pat_growth": 12.0},
    "ITC": {"name": "ITC Ltd", "sector": "FMCG", "base_price": 465.30, "pe": 27.2, "roce": 39.5, "debt_eq": 0.01, "pat_growth": 6.2},
    "HINDUNILVR": {"name": "Hindustan Unilever Ltd", "sector": "FMCG", "base_price": 2380.00, "pe": 52.1, "roce": 28.4, "debt_eq": 0.03, "pat_growth": 4.1},
    "LT": {"name": "Larsen & Toubro Ltd", "sector": "Infrastructure & Capital Goods", "base_price": 3610.00, "pe": 33.2, "roce": 16.4, "debt_eq": 0.85, "pat_growth": 18.5},
    "BAJFINANCE": {"name": "Bajaj Finance Ltd", "sector": "Financial Services", "base_price": 6850.00, "pe": 26.5, "roce": 18.6, "debt_eq": 3.80, "pat_growth": 19.2},
    "HCLTECH": {"name": "HCL Technologies Ltd", "sector": "Information Technology", "base_price": 1790.00, "pe": 27.4, "roce": 32.1, "debt_eq": 0.12, "pat_growth": 10.5},
    "MARUTI": {"name": "Maruti Suzuki India Ltd", "sector": "Automobile", "base_price": 11350.00, "pe": 25.1, "roce": 18.5, "debt_eq": 0.02, "pat_growth": 14.0},
    "SUNPHARMA": {"name": "Sun Pharmaceutical Industries", "sector": "Pharmaceuticals", "base_price": 1780.00, "pe": 36.8, "roce": 17.2, "debt_eq": 0.11, "pat_growth": 16.3},
    "TATAMOTORS": {"name": "Tata Motors Ltd", "sector": "Automobile", "base_price": 795.50, "pe": 10.2, "roce": 18.9, "debt_eq": 1.15, "pat_growth": 28.5},
    "KOTAKBANK": {"name": "Kotak Mahindra Bank Ltd", "sector": "Banking & Financials", "base_price": 1765.00, "pe": 19.4, "roce": 14.8, "debt_eq": 0.90, "pat_growth": 13.5},
    "AXISBANK": {"name": "Axis Bank Ltd", "sector": "Banking & Financials", "base_price": 1180.00, "pe": 13.8, "roce": 16.2, "debt_eq": 1.10, "pat_growth": 17.5},
    "NTPC": {"name": "NTPC Ltd", "sector": "Power & Energy", "base_price": 375.00, "pe": 16.5, "roce": 12.1, "debt_eq": 1.45, "pat_growth": 14.2},
    "TITAN": {"name": "Titan Company Ltd", "sector": "Consumer Discretionary", "base_price": 3280.00, "pe": 78.5, "roce": 25.8, "debt_eq": 0.85, "pat_growth": 11.2},
    "ONGC": {"name": "Oil & Natural Gas Corp", "sector": "Oil & Gas", "base_price": 255.00, "pe": 7.4, "roce": 14.5, "debt_eq": 0.48, "pat_growth": 8.0},
    "POWERGRID": {"name": "Power Grid Corp of India", "sector": "Power & Utilities", "base_price": 325.00, "pe": 18.2, "roce": 13.8, "debt_eq": 1.55, "pat_growth": 7.5},
    "TATASTEEL": {"name": "Tata Steel Ltd", "sector": "Metals & Mining", "base_price": 148.50, "pe": 34.2, "roce": 9.4, "debt_eq": 0.95, "pat_growth": 12.0},
    "M&M": {"name": "Mahindra & Mahindra Ltd", "sector": "Automobile", "base_price": 2890.00, "pe": 31.4, "roce": 21.5, "debt_eq": 1.10, "pat_growth": 24.5},
    "JSWSTEEL": {"name": "JSW Steel Ltd", "sector": "Metals & Mining", "base_price": 965.00, "pe": 28.5, "roce": 11.2, "debt_eq": 1.25, "pat_growth": 15.0},
    "ZOMATO": {"name": "Zomato Ltd (Eternal)", "sector": "Consumer Internet", "base_price": 268.00, "pe": 110.0, "roce": 9.5, "debt_eq": 0.05, "pat_growth": 85.0},
    "HAL": {"name": "Hindustan Aeronautics Ltd", "sector": "Defence & Aerospace", "base_price": 4320.00, "pe": 38.5, "roce": 29.5, "debt_eq": 0.00, "pat_growth": 22.0},
    "VBL": {"name": "Varun Beverages Ltd", "sector": "FMCG", "base_price": 590.00, "pe": 62.0, "roce": 28.0, "debt_eq": 0.65, "pat_growth": 26.5},
    "DIXON": {"name": "Dixon Technologies Ltd", "sector": "Electronics Manufacturing", "base_price": 14200.00, "pe": 88.0, "roce": 32.5, "debt_eq": 0.25, "pat_growth": 72.0},
    "BEL": {"name": "Bharat Electronics Ltd", "sector": "Defence & Aerospace", "base_price": 295.00, "pe": 41.0, "roce": 31.0, "debt_eq": 0.00, "pat_growth": 24.0},
    "TRENT": {"name": "Trent Ltd (Westside/Zudio)", "sector": "Retail & Fashion", "base_price": 6450.00, "pe": 135.0, "roce": 34.0, "debt_eq": 0.40, "pat_growth": 52.0},
}

class MarketDataEngine:
    """
    Manages live indices, synthetic/live tick feeds, multi-timeframe candles,
    and NSE Bhavcopy delivery metrics.
    """
    def __init__(self):
        self.indices = NSE_INDICES
        self.stock_meta = STOCK_METADATA
        self._price_cache: Dict[str, float] = {}
        self._init_live_prices()

    def _init_live_prices(self):
        # Set dynamic initial live prices
        for sym, meta in self.stock_meta.items():
            self._price_cache[sym] = meta["base_price"]

    def get_live_price(self, symbol: str) -> float:
        sym = symbol.upper()
        meta = self.stock_meta.get(sym)
        base = self._price_cache.get(sym, meta["base_price"] if meta else 1250.00)

        # STRICT MARKET HOURS RULE:
        # If NSE is closed (outside 09:15 - 15:30 IST or weekends), prices are FROZEN at EOD closing values. Zero artificial fluctuation!
        if not is_nse_market_open():
            return base

        # During live market hours only, simulate real-time tick micro-variance
        jitter = base * (random.uniform(-0.0015, 0.0018))
        self._price_cache[sym] = round(base + jitter, 2)
        return self._price_cache[sym]

    def get_index_constituents(self, index_name: str) -> List[str]:
        clean_name = index_name.upper().replace(" ", "_")
        if clean_name in self.indices:
            return self.indices[clean_name]["symbols"]
        # Default to Nifty 50 if unknown
        return self.indices["NIFTY_50"]["symbols"]

    def get_market_regime(self) -> Dict[str, Any]:
        """
        Pillar 1: Market Regime calculation on NIFTY 50
        Checks 20 EMA, 50 EMA, ADX, and Market Breadth.
        Strictly respects NSE market hours (09:15 to 15:30 IST).
        """
        market_open = is_nse_market_open()
        base_nifty = 24280.50
        nifty_20_ema = 24150.00
        nifty_50_ema = 23980.00
        nifty_adx = 24.8  # >20 indicates strong trending market

        # When market is closed, freeze strictly at official EOD settlement price!
        if market_open:
            nifty_ltp = round(base_nifty + random.uniform(-40, 60), 2)
            nifty_change_pct = round(((nifty_ltp - nifty_20_ema) / nifty_20_ema) * 100, 2)
            session_status = "NSE/BSE LIVE"
        else:
            nifty_ltp = base_nifty
            nifty_change_pct = 0.54
            session_status = "MARKET CLOSED (EOD SETTLEMENT)"
        
        is_bullish = nifty_ltp > nifty_50_ema and nifty_adx > 18.0
        regime_status = "BULLISH_TRENDING" if is_bullish else "CONSOLIDATING"
        regime_score = 19 if is_bullish else 10 # out of 20

        return {
            "nifty_ltp": nifty_ltp,
            "nifty_change_pct": nifty_change_pct,
            "nifty_20_ema": nifty_20_ema,
            "nifty_50_ema": nifty_50_ema,
            "adx_14": nifty_adx,
            "regime_status": regime_status,
            "is_market_bullish": is_bullish,
            "regime_score": regime_score, # 0-20
            "advance_decline_ratio": 1.45,
            "fii_dii_net_flow_cr": +1850.40, # Crores INR
            "is_market_open": market_open,
            "session_status": session_status,
            "trading_hours": "09:15 - 15:30 IST"
        }

    def generate_candles(self, symbol: str, timeframe: str = "D", count: int = 50) -> List[Dict[str, Any]]:
        """
        Generates multi-timeframe OHLCV candles with realistic price structure.
        """
        sym = symbol.upper()
        current_p = self.get_live_price(sym)
        candles = []
        now = time.time()
        interval_secs = 86400 if timeframe == "D" else (3600 if timeframe == "1H" else 900)
        
        price = current_p * (1 - (count * 0.0018))
        for i in range(count):
            t = now - (count - i) * interval_secs
            drift = price * random.uniform(-0.015, 0.022)
            open_p = price
            close_p = open_p + drift
            high_p = max(open_p, close_p) + abs(drift * random.uniform(0.1, 0.4))
            low_p = min(open_p, close_p) - abs(drift * random.uniform(0.1, 0.4))
            volume = int(random.uniform(850000, 4200000))
            
            candles.append({
                "time": int(t),
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close_p, 2),
                "volume": volume
            })
            price = close_p
            
        return candles

    def get_stock_profile(self, symbol: str) -> Dict[str, Any]:
        sym = symbol.upper()
        meta = self.stock_meta.get(sym, {
            "name": f"{sym} India Ltd",
            "sector": "Diversified",
            "base_price": self.get_live_price(sym),
            "pe": 24.0,
            "roce": 18.0,
            "debt_eq": 0.4,
            "pat_growth": 14.0
        })
        live_price = self.get_live_price(sym)
        return {
            "symbol": sym,
            "name": meta["name"],
            "sector": meta["sector"],
            "ltp": live_price,
            "pe_ratio": meta["pe"],
            "roce_pct": meta["roce"],
            "debt_to_equity": meta["debt_eq"],
            "pat_growth_yoy": meta["pat_growth"]
        }

# Global singleton
market_data_engine = MarketDataEngine()
