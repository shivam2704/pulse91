"""
pulse91/backend/engines/index_scanner.py
On-Demand Index Constituents Scanner & Monday 08:00 AM Top 15 Master Scanner
"""

import datetime
from typing import Dict, List, Any
from .market_data import market_data_engine, NSE_INDICES
from .confluence_engine import confluence_engine

class IndexScannerEngine:
    def __init__(self):
        self.market_data = market_data_engine
        self.confluence = confluence_engine
        self._cached_monday_picks: Dict[str, Any] = {}

    def scan_index(self, index_key: str) -> Dict[str, Any]:
        """
        On-demand scanner for any selected Indian stock index.
        Runs full 5-Pillar Confluence assessment on each constituent.
        """
        clean_key = index_key.upper().replace(" ", "_")
        if clean_key not in NSE_INDICES:
            clean_key = "NIFTY_50"

        index_info = NSE_INDICES[clean_key]
        symbols = index_info["symbols"]

        results = []
        for sym in symbols:
            eval_res = self.confluence.evaluate_stock(sym)
            results.append(eval_res)

        # Sort descending by Confluence Score
        results.sort(key=lambda x: x["confluence_score"], reverse=True)

        # Compute summary metrics
        strong_buys = [r for r in results if r["verdict"] == "STRONG BUY"]
        momentum_buys = [r for r in results if r["verdict"] == "MOMENTUM BUY"]
        neutral = [r for r in results if "NEUTRAL" in r["verdict"]]
        avoid = [r for r in results if "AVOID" in r["verdict"]]

        avg_score = round(sum(r["confluence_score"] for r in results) / max(1, len(results)), 1)

        return {
            "index_key": clean_key,
            "index_name": index_info["name"],
            "description": index_info["description"],
            "scanned_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "total_constituents": len(symbols),
            "summary": {
                "strong_buy_count": len(strong_buys),
                "momentum_buy_count": len(momentum_buys),
                "neutral_count": len(neutral),
                "avoid_count": len(avoid),
                "average_confluence_score": avg_score
            },
            "rankings": results
        }

    def run_monday_8am_scan(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Executes the Monday 08:00 AM Master Weekly Scan across Nifty 50,
        Nifty Next 50, and Nifty Midcap leaders. Filters for the Top 15
        highest-confluence setups for the trading week.
        """
        now_str = datetime.datetime.now().strftime("%Y-%m-%d")
        if not force_refresh and self._cached_monday_picks.get("scan_date") == now_str:
            return self._cached_monday_picks

        universe_symbols = list(set(
            NSE_INDICES["NIFTY_50"]["symbols"] +
            NSE_INDICES["NIFTY_NEXT_50"]["symbols"][:20] +
            NSE_INDICES["NIFTY_MIDCAP_100"]["symbols"][:15]
        ))

        all_candidates = []
        for sym in universe_symbols:
            eval_res = self.confluence.evaluate_stock(sym)
            # Only consider candidates passing basic quality criteria
            if eval_res["confluence_score"] >= 65.0:
                all_candidates.append(eval_res)

        # Sort descending by Confluence Score
        all_candidates.sort(key=lambda x: x["confluence_score"], reverse=True)

        # Select Top 15
        top_15 = all_candidates[:15]

        # Annotate with weekly rank badges (1 to 15)
        for idx, item in enumerate(top_15):
            item["weekly_rank"] = idx + 1

        sectors_count: Dict[str, int] = {}
        for item in top_15:
            sec = item["sector"]
            sectors_count[sec] = sectors_count.get(sec, 0) + 1

        top_sectors = sorted(sectors_count.items(), key=lambda x: x[1], reverse=True)

        response = {
            "title": "Pulse91 Monday 08:00 AM Master Weekly Watchlist",
            "scan_timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
            "scan_date": now_str,
            "target_trading_week": f"Week of {datetime.datetime.now().strftime('%d %b %Y')}",
            "universe_size": len(universe_symbols),
            "picks_count": len(top_15),
            "top_outperforming_sectors": [f"{s[0]} ({s[1]} picks)" for s in top_sectors[:3]],
            "picks": top_15
        }

        self._cached_monday_picks = response
        return response

    def get_available_indices(self) -> List[Dict[str, Any]]:
        return [
            {"key": k, "name": v["name"], "description": v["description"], "count": len(v["symbols"])}
            for k, v in NSE_INDICES.items()
        ]

# Global singleton
index_scanner_engine = IndexScannerEngine()
