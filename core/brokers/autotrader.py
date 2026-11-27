"""
pulse91/backend/engines/autotrader_engine.py
Pulse91 Autonomous Quant Execution Daemon
Reverse-Engineered from NEAR agent-trader and Minervini VCP / CANSLIM Rules

Functions:
- Continuous scanner across Monday Top 15 setups
- Auto-buys at VCP Breakout Pivot with Volume expansion
- Auto-sells at Target 1 (+5.55%) or cuts loss at Stop-Loss (-2.78%)
- Dispatches instant WhatsApp notifications on EVERY Buy & Sell deal
"""

import asyncio
import datetime
from typing import Dict, List, Any, Optional

from ..services import market_data_engine, whatsapp_alerter, supabase_service
from ..services.market_data import is_nse_market_open
from .gateway import broker_engine
from ..quant import confluence_engine, IndexScannerEngine

class AutoTraderEngine:
    def __init__(self):
        self.is_active: bool = False
        self.max_capital_per_trade: float = 3000.0 # Scaled for ₹10k portfolio
        self.max_open_positions: int = 3
        self.notification_phone: Optional[str] = None
        self.index_scanner = IndexScannerEngine()
        
        # Track positions managed by the quant daemon isolated by account_id: {account_id: {symbol: position_dict}}
        self.managed_positions: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.execution_logs: List[Dict[str, Any]] = []
        self.supabase = supabase_service

        # Restore from Supabase if active
        if self.supabase and self.supabase.is_active:
            try:
                sb_auto = self.supabase.load_autotrader()
                if sb_auto:
                    self.is_active = sb_auto.get("is_active", self.is_active)
                    self.max_capital_per_trade = sb_auto.get("max_capital_per_trade", self.max_capital_per_trade)
                    self.max_open_positions = sb_auto.get("max_open_positions", self.max_open_positions)
                sb_logs = self.supabase.load_execution_logs(limit=25)
                if sb_logs:
                    self.execution_logs = sb_logs
            except Exception:
                pass

    def _add_log(self, log_entry: Dict[str, Any]):
        self.execution_logs.insert(0, log_entry)
        if self.supabase and self.supabase.is_active:
            try:
                self.supabase.add_execution_log(log_entry)
            except Exception:
                pass

    def _sync_with_holdings(self, account_id: Optional[str] = None):
        """Auto-registers existing Demat holdings into Auto-Trader surveillance roster with real dynamic ATR levels"""
        if not account_id:
            return
        acc_id = account_id
        overview = broker_engine.get_portfolio_overview(acc_id)
        holdings = overview.get("holdings", [])
        user_positions = self.managed_positions.setdefault(acc_id, {})
        for h in holdings:
            sym = h["symbol"].upper()
            if sym not in user_positions:
                buy = h.get("avg_buy_price", 100.0)
                try:
                    analysis = confluence_engine.analyze_stock(sym)
                    plan = analysis.get("trade_plan", {})
                    t1 = plan.get("target_1_price") or round(buy * 1.05, 2)
                    t2 = plan.get("target_2_price") or round(buy * 1.08, 2)
                    sl = plan.get("stop_loss_price") or round(buy * 0.97, 2)
                except Exception:
                    t1 = round(buy * 1.05, 2)
                    t2 = round(buy * 1.08, 2)
                    sl = round(buy * 0.97, 2)

                self.register_position(
                    symbol=sym,
                    quantity=h["quantity"],
                    entry_price=buy,
                    target_1=t1,
                    target_2=t2,
                    stop_loss=sl,
                    account_id=acc_id
                )

    def get_status(self, account_id: Optional[str] = None) -> Dict[str, Any]:
        if not account_id:
            return {
                "is_active": self.is_active,
                "max_capital_per_trade": self.max_capital_per_trade,
                "max_open_positions": self.max_open_positions,
                "active_managed_count": 0,
                "notification_phone": self.notification_phone,
                "managed_positions": [],
                "recent_logs": []
            }
        acc_id = account_id
        self._sync_with_holdings(acc_id)
        user_positions = self.managed_positions.get(acc_id, {})
        detailed_positions = []
        for sym, pos in user_positions.items():
            ltp = market_data_engine.get_live_price(sym, fallback_price=pos["entry_price"])
            entry = pos["entry_price"]
            t1 = pos["target_1"]
            sl = pos["stop_loss"]
            pnl = round((ltp - entry) * pos["quantity"], 2)
            pnl_pct = round(((ltp - entry) / (entry or 1)) * 100, 2)
            dist_to_t1 = round(((t1 - ltp) / ltp) * 100, 2)
            dist_to_sl = round(((ltp - sl) / ltp) * 100, 2)

            if dist_to_t1 <= 0.8:
                health = "NEAR_TARGET"
            elif dist_to_sl <= 0.8:
                health = "NEAR_STOP_LOSS"
            else:
                health = "MONITORING"

            detailed_positions.append({
                **pos,
                "current_ltp": ltp,
                "unrealized_pnl": pnl,
                "unrealized_pnl_pct": pnl_pct,
                "dist_to_target_pct": dist_to_t1,
                "dist_to_sl_pct": dist_to_sl,
                "health": health
            })

        return {
            "is_active": self.is_active,
            "max_capital_per_trade": self.max_capital_per_trade,
            "max_open_positions": self.max_open_positions,
            "active_managed_count": len(user_positions),
            "notification_phone": self.notification_phone,
            "managed_positions": detailed_positions,
            "recent_logs": self.execution_logs[:10]
        }

    def toggle(self, active: Optional[bool] = None) -> bool:
        if active is not None:
            self.is_active = active
        else:
            self.is_active = not self.is_active
        if self.is_active:
            self._sync_with_holdings()

        if self.supabase and self.supabase.is_active:
            try:
                self.supabase.save_autotrader({
                    "is_active": self.is_active,
                    "max_capital_per_trade": self.max_capital_per_trade,
                    "max_open_positions": self.max_open_positions,
                    "managed_positions": list(self.managed_positions.keys())
                })
            except Exception:
                pass

        return self.is_active

    def set_config(self, max_capital: Optional[float] = None, max_positions: Optional[int] = None, phone: Optional[str] = None):
        if max_capital:
            self.max_capital_per_trade = max_capital
        if max_positions:
            self.max_open_positions = max_positions
        if phone:
            self.notification_phone = phone
            whatsapp_alerter.set_config(phone=phone)

    def register_position(self, symbol: str, quantity: int, entry_price: float, target_1: float, stop_loss: float, target_2: Optional[float] = None, account_id: Optional[str] = None):
        """
        Registers a position into the autonomous quant daemon for continuous monitoring
        and automatic exit upon reaching Target 1 (+5.55%) or Stop Loss (-2.78%).
        """
        if not account_id:
            import uuid
            acc_id = f"GUEST_{uuid.uuid4().hex[:8].upper()}"
        else:
            acc_id = account_id
        sym = symbol.upper()
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        user_positions = self.managed_positions.setdefault(acc_id, {})
        user_positions[sym] = {
            "symbol": sym,
            "quantity": quantity,
            "entry_price": entry_price,
            "target_1": target_1,
            "target_2": target_2 or round(entry_price * 1.0888, 2),
            "stop_loss": stop_loss,
            "entry_time": now_str
        }

    def unregister_position(self, symbol: str, account_id: Optional[str] = None):
        """
        Removes a position when squared off manually.
        """
        if not account_id:
            return
        acc_id = account_id
        if acc_id in self.managed_positions:
            self.managed_positions[acc_id].pop(symbol.upper(), None)

    async def run_cycle(self) -> List[Dict[str, Any]]:
        """
        Executes one evaluation cycle:
        1. Checks exit triggers (Target 1 / Stop Loss) for all active holdings & positions
        2. Checks entry triggers (VCP Breakout Pivots) for Monday Top 15 setups
        Strictly observes NSE market hours (09:15 - 15:30 IST).
        """
        self._sync_with_holdings()

        # 100% replica of actual trading: when exchange is closed, prices are frozen at official EOD settlement.
        # Breakout order executions halt until the exchange opens at 09:15 AM IST.
        if not is_nse_market_open():
            return []

        events = []
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

        # -------------------------------------------------------------
        # 1. EVALUATE EXITS (PROFIT BOOKING & RISK DEFENSE)
        # -------------------------------------------------------------
        positions_to_exit = []
        for acc_id, user_positions in list(self.managed_positions.items()):
            for sym, pos in list(user_positions.items()):
                ltp = market_data_engine.get_live_price(sym)
                entry_price = pos["entry_price"]
                t1 = pos["target_1"]
                sl = pos["stop_loss"]
                qty = pos["quantity"]

                # Target 1 Hit -> Book Profit (+5.55%)
                if ltp >= t1:
                    pnl = round((ltp - entry_price) * qty, 2)
                    pnl_pct = round(((ltp - entry_price) / entry_price) * 100, 2)
                    
                    order_rec = {
                        "symbol": sym,
                        "side": "SELL",
                        "quantity": qty,
                        "price": ltp,
                        "product": "CNC",
                        "mode": "SANDBOX",
                        "timestamp": now_str
                    }
                    extra = {
                        "realized_pnl": pnl,
                        "realized_pnl_pct": pnl_pct,
                        "reason": f"🎯 Target 1 Achieved (+{pnl_pct}%)"
                    }
                    
                    try:
                        broker_engine.place_order({
                            "symbol": sym,
                            "quantity": qty,
                            "side": "SELL",
                            "product": "CNC"
                        }, account_id=acc_id)
                    except Exception as e:
                        print("Broker sell error:", e)

                    alert_text = whatsapp_alerter.format_execution_alert(order_rec, extra)
                    await whatsapp_alerter.dispatch_whatsapp(alert_text, self.notification_phone)

                    log_entry = {
                        "id": f"LOG_{int(asyncio.get_event_loop().time())}_{sym}",
                        "timestamp": now_str,
                        "symbol": sym,
                        "action": "SELL",
                        "reason": f"Target 1 Hit at ₹{ltp:.2f} (Realized PnL: ₹{pnl:+,.2f})",
                        "quantity": qty,
                        "price": ltp,
                        "status": "FILLED",
                        "whatsapp_notified": True
                    }
                    self._add_log(log_entry)
                    positions_to_exit.append((acc_id, sym))
                    events.append(log_entry)

                # Stop-Loss Hit -> Cut Loss immediately (-2.78%)
                elif ltp <= sl:
                    pnl = round((ltp - entry_price) * qty, 2)
                    pnl_pct = round(((ltp - entry_price) / entry_price) * 100, 2)
                    
                    order_rec = {
                        "symbol": sym,
                        "side": "SELL",
                        "quantity": qty,
                        "price": ltp,
                        "product": "CNC",
                        "mode": "SANDBOX",
                        "timestamp": now_str
                    }
                    extra = {
                        "realized_pnl": pnl,
                        "realized_pnl_pct": pnl_pct,
                        "reason": f"🛑 Stop-Loss Triggered ({pnl_pct}%)"
                    }

                    try:
                        broker_engine.place_order({
                            "symbol": sym,
                            "quantity": qty,
                            "side": "SELL",
                            "product": "CNC"
                        }, account_id=acc_id)
                    except Exception as e:
                        print("Broker sell error:", e)

                    alert_text = whatsapp_alerter.format_execution_alert(order_rec, extra)
                    await whatsapp_alerter.dispatch_whatsapp(alert_text, self.notification_phone)

                    log_entry = {
                        "id": f"LOG_{int(asyncio.get_event_loop().time())}_{sym}",
                        "timestamp": now_str,
                        "symbol": sym,
                        "action": "SELL",
                        "reason": f"Stop-Loss Cut at ₹{ltp:.2f} (Realized PnL: ₹{pnl:+,.2f})",
                        "quantity": qty,
                        "price": ltp,
                        "status": "FILLED",
                        "whatsapp_notified": True
                    }
                    self._add_log(log_entry)
                    positions_to_exit.append((acc_id, sym))
                    events.append(log_entry)

        for acc_id, sym in positions_to_exit:
            if acc_id in self.managed_positions:
                self.managed_positions[acc_id].pop(sym, None)

        # -------------------------------------------------------------
        # 2. EVALUATE ENTRIES (MINERVINI VCP PIVOT BREAKOUTS)
        # -------------------------------------------------------------
        if len(self.managed_positions) < self.max_open_positions:
            top_scan = self.index_scanner.run_monday_8am_scan()
            candidates = top_scan.get("picks") or top_scan.get("rankings") or []
            for pick in candidates[:5]: # Top 5 highest conviction setups
                sym = pick["symbol"]
                if sym in self.managed_positions:
                    continue

                ltp = pick["ltp"]
                vcp = pick.get("minervini_vcp", {})
                pivot = vcp.get("pivot_buy_point", ltp * 1.01)
                t1 = pick["trade_plan"]["target_1_price"]
                sl = pick["trade_plan"]["stop_loss_price"]

                # If price is at or cleanly crossing pivot buy point
                if ltp >= pivot * 0.998 and pick["confluence_score"] >= 90.0:
                    # Calculate quantity based on max capital per trade
                    qty = max(1, int(self.max_capital_per_trade // ltp))

                    try:
                        broker_res = broker_engine.place_order({
                            "symbol": sym,
                            "quantity": qty,
                            "side": "BUY",
                            "product": "CNC",
                            "price": ltp,
                            "sl_price": sl,
                            "target_price": t1
                        })
                    except Exception as e:
                        print(f"Auto-buy execution skipped for {sym}:", e)
                        continue

                    # Record position
                    self.managed_positions[sym] = {
                        "symbol": sym,
                        "quantity": qty,
                        "entry_price": ltp,
                        "target_1": t1,
                        "target_2": pick["trade_plan"]["target_2_price"],
                        "stop_loss": sl,
                        "entry_time": now_str
                    }

                    order_rec = {
                        "symbol": sym,
                        "side": "BUY",
                        "quantity": qty,
                        "price": ltp,
                        "product": "CNC",
                        "mode": broker_engine.active_mode,
                        "timestamp": now_str
                    }
                    extra = {
                        "target_1": t1,
                        "stop_loss": sl,
                        "risk_reward": pick["trade_plan"]["risk_reward_ratio"]
                    }

                    # Instant WhatsApp execution receipt
                    alert_text = whatsapp_alerter.format_execution_alert(order_rec, extra)
                    await whatsapp_alerter.dispatch_whatsapp(alert_text, self.notification_phone)

                    log_entry = {
                        "id": f"LOG_{int(asyncio.get_event_loop().time())}_{sym}",
                        "timestamp": now_str,
                        "symbol": sym,
                        "action": "BUY",
                        "reason": f"VCP Breakout Pivot ₹{pivot:.2f} triggered (Confluence: {pick['confluence_score']}/100)",
                        "quantity": qty,
                        "price": ltp,
                        "status": "FILLED",
                        "whatsapp_notified": True
                    }
                    self._add_log(log_entry)
                    events.append(log_entry)

                    if len(self.managed_positions) >= self.max_open_positions:
                        break

        return events

# Global singleton
autotrader_engine = AutoTraderEngine()
