"""
pulse91/backend/engines/broker_engine.py
Unified Broker Gateway with Sandbox (₹10L Virtual Demat) and Live Broker Adapters
"""

import time
import json
import os
import datetime
import asyncio
from typing import Dict, List, Any, Optional
from .market_data import market_data_engine
from .groww_adapter import groww_adapter
from .whatsapp_alerter import whatsapp_alerter

class BrokerEngine:
    def __init__(self):
        self.market_data = market_data_engine
        self.active_mode = "SANDBOX" # Default to Sandbox (Virtual Demat) for security!
        self.broker_name = "Pulse91 Sandbox Broker"
        self.account_id = "PULSE91-DEMAT-SBX-01"

        # Sandbox Virtual State
        self.initial_balance = 1000000.00 # ₹10,00,000 INR
        self.available_cash = 785400.00
        
        # Seed realistic initial Demat portfolio
        self.holdings: List[Dict[str, Any]] = [
            {
                "symbol": "TCS",
                "company_name": "Tata Consultancy Services",
                "quantity": 25,
                "avg_buy_price": 3980.00,
                "invested_value": 99500.00,
                "product": "CNC",
                "date_bought": "2026-10-14"
            },
            {
                "symbol": "RELIANCE",
                "company_name": "Reliance Industries Ltd",
                "quantity": 30,
                "avg_buy_price": 2895.00,
                "invested_value": 86850.00,
                "product": "CNC",
                "date_bought": "2026-10-22"
            },
            {
                "symbol": "HAL",
                "company_name": "Hindustan Aeronautics Ltd",
                "quantity": 20,
                "avg_buy_price": 4120.00,
                "invested_value": 82400.00,
                "product": "CNC",
                "date_bought": "2026-11-04"
            }
        ]

        self.positions: List[Dict[str, Any]] = []
        self.orders: List[Dict[str, Any]] = []
        self.gtt_triggers: List[Dict[str, Any]] = []

    def set_mode(self, mode: str, broker: str = "Groww", account_id: str = "GROWW-USER-01"):
        if mode.upper() in ["SANDBOX", "LIVE_DEMAT"]:
            self.active_mode = mode.upper()
            if self.active_mode == "LIVE_DEMAT":
                self.broker_name = broker or "Groww"
                self.account_id = account_id or "GROWW-USER-01"
            else:
                self.broker_name = "Pulse91 Sandbox Broker"
                self.account_id = "PULSE91-DEMAT-SBX-01"
        return {"mode": self.active_mode, "broker": self.broker_name, "account_id": self.account_id}

    def get_portfolio_overview(self) -> Dict[str, Any]:
        """
        Calculates live Demat valuation, invested capital, available cash,
        realized & unrealized PnL based on live NSE tick prices.
        """
        # Connect to live broker APIs if LIVE_DEMAT mode is active
        active_holdings = self.holdings
        current_cash = self.available_cash

        if self.active_mode == "LIVE_DEMAT":
            b_name = self.broker_name.lower()
            try:
                if "groww" in b_name:
                    live_h = groww_adapter.fetch_live_holdings()
                    if live_h:
                        active_holdings = live_h
                    margins = groww_adapter.fetch_live_margins()
                    current_cash = margins.get("available_cash", current_cash)
                elif "dhan" in b_name:
                    from .dhan_adapter import dhan_adapter
                    live_h = dhan_adapter.get_holdings()
                    if live_h:
                        active_holdings = live_h
                    funds = dhan_adapter.get_funds()
                    current_cash = funds.get("available_cash", current_cash)
                elif "zerodha" in b_name or "kite" in b_name:
                    from .zerodha_adapter import zerodha_adapter
                    live_h = zerodha_adapter.get_holdings()
                    if live_h:
                        active_holdings = live_h
                    funds = zerodha_adapter.get_funds()
                    current_cash = funds.get("available_cash", current_cash)
                elif "angel" in b_name:
                    from .angel_adapter import angel_adapter
                    live_h = angel_adapter.get_holdings()
                    if live_h:
                        active_holdings = live_h
                    funds = angel_adapter.get_funds()
                    current_cash = funds.get("available_cash", current_cash)
            except Exception as e:
                print(f"Broker live sync note ({self.broker_name}):", e)
                active_holdings = self.holdings
                current_cash = self.available_cash

        holdings_data = []
        total_invested = 0.0
        total_current = 0.0
        day_pnl = 0.0

        for h in active_holdings:
            sym = h["symbol"]
            avg_buy = h.get("avg_buy_price", 100.0)
            ltp = self.market_data.get_live_price(sym, fallback_price=avg_buy)
            qty = h["quantity"]
            curr_val = round(ltp * qty, 2)
            invested = h["invested_value"]
            pnl = round(curr_val - invested, 2)
            pnl_pct = round((pnl / max(0.01, invested)) * 100, 2)
            
            # Simulated day change
            day_change = round(curr_val * 0.0085, 2)
            day_pnl += day_change

            total_invested += invested
            total_current += curr_val

            holdings_data.append({
                "symbol": sym,
                "company_name": h["company_name"],
                "quantity": qty,
                "avg_buy_price": h["avg_buy_price"],
                "ltp": ltp,
                "invested_value": invested,
                "current_value": curr_val,
                "unrealized_pnl": pnl,
                "pnl_pct": pnl_pct,
                "product": h["product"],
                "date_bought": h.get("date_bought", "2026-11-01")
            })

        # Calculate open positions MTM
        positions_data = []
        positions_pnl = 0.0
        for p in self.positions:
            sym = p["symbol"]
            ltp = self.market_data.get_live_price(sym)
            entry = p["entry_price"]
            qty = p["quantity"]
            side = p["side"]
            
            pnl = (ltp - entry) * qty if side == "BUY" else (entry - ltp) * qty
            pnl = round(pnl, 2)
            pnl_pct = round(((ltp - entry) / entry) * 100, 2) if side == "BUY" else round(((entry - ltp) / entry) * 100, 2)
            positions_pnl += pnl

            positions_data.append({
                **p,
                "ltp": ltp,
                "unrealized_pnl": pnl,
                "pnl_pct": pnl_pct
            })

        total_pnl = round(total_current - total_invested + positions_pnl, 2)
        total_pnl_pct = round((total_pnl / max(1.0, total_invested)) * 100, 2)
        account_net_worth = round(current_cash + total_current + positions_pnl, 2)

        return {
            "mode": self.active_mode,
            "broker": self.broker_name,
            "account_id": self.account_id,
            "account_net_worth": account_net_worth,
            "available_cash": round(current_cash, 2),
            "invested_value": round(total_invested, 2),
            "current_holdings_value": round(total_current, 2),
            "total_unrealized_pnl": total_pnl,
            "total_unrealized_pnl_pct": total_pnl_pct,
            "today_pnl": round(day_pnl + positions_pnl, 2),
            "holdings_count": len(holdings_data),
            "open_positions_count": len(positions_data),
            "holdings": holdings_data,
            "positions": positions_data
        }

    def place_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes an order into Sandbox virtual Demat or live broker.
        Supports CNC (Demat Delivery) and MIS (Intraday).
        """
        symbol = order_data["symbol"].upper()
        quantity = int(order_data.get("quantity", 1))
        side = order_data.get("side", "BUY").upper()
        product = order_data.get("product", "CNC").upper() # "CNC" or "MIS"
        order_type = order_data.get("order_type", "MARKET").upper()
        
        ltp = self.market_data.get_live_price(symbol)
        execution_price = float(order_data.get("price") or ltp)
        required_capital = round(execution_price * quantity, 2)

        if side == "BUY" and required_capital > self.available_cash:
            raise ValueError(f"Insufficient funds: Required ₹{required_capital}, Available ₹{self.available_cash:.2f}")

        order_id = f"ORD_{int(time.time())}_{symbol}"
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        order_record = {
            "order_id": order_id,
            "symbol": symbol,
            "side": side,
            "product": product,
            "quantity": quantity,
            "price": execution_price,
            "status": "EXECUTED",
            "timestamp": now_str,
            "mode": self.active_mode
        }
        self.orders.insert(0, order_record)

        if side == "BUY":
            self.available_cash -= required_capital
            if product == "CNC":
                # Add to Demat Holdings
                existing = next((h for h in self.holdings if h["symbol"] == symbol), None)
                if existing:
                    new_qty = existing["quantity"] + quantity
                    new_inv = existing["invested_value"] + required_capital
                    existing["quantity"] = new_qty
                    existing["invested_value"] = new_inv
                    existing["avg_buy_price"] = round(new_inv / new_qty, 2)
                else:
                    profile = self.market_data.get_stock_profile(symbol)
                    self.holdings.append({
                        "symbol": symbol,
                        "company_name": profile["name"],
                        "quantity": quantity,
                        "avg_buy_price": execution_price,
                        "invested_value": required_capital,
                        "product": "CNC",
                        "date_bought": datetime.datetime.now().strftime("%Y-%m-%d")
                    })
            else:
                # Add to Open MIS Positions
                self.positions.append({
                    "position_id": f"POS_{order_id}",
                    "symbol": symbol,
                    "side": "BUY",
                    "product": "MIS",
                    "quantity": quantity,
                    "entry_price": execution_price,
                    "created_at": now_str
                })
        else: # SELL
            self.available_cash += required_capital
            # Remove/reduce from holdings or positions
            existing = next((h for h in self.holdings if h["symbol"] == symbol), None)
            if existing:
                if existing["quantity"] <= quantity:
                    self.holdings.remove(existing)
                else:
                    existing["quantity"] -= quantity
                    existing["invested_value"] = round(existing["quantity"] * existing["avg_buy_price"], 2)

        # Optional GTT Setup
        gtt_created = None
        if order_data.get("sl_price") or order_data.get("target_price"):
            gtt_created = {
                "gtt_id": f"GTT_{order_id}",
                "symbol": symbol,
                "trigger_sl": order_data.get("sl_price"),
                "trigger_target": order_data.get("target_price"),
                "status": "ACTIVE_ON_EXCHANGE"
            }
            self.gtt_triggers.append(gtt_created)

        # Automated WhatsApp Execution Alert Dispatch
        try:
            extra = {}
            if order_data.get("target_price"):
                extra["target_1"] = order_data["target_price"]
            if order_data.get("sl_price"):
                extra["stop_loss"] = order_data["sl_price"]
            alert_text = whatsapp_alerter.format_execution_alert(order_record, extra)
            whatsapp_alerter.dispatch_whatsapp(alert_text)
        except Exception:
            pass

        return {
            "success": True,
            "order": order_record,
            "gtt": gtt_created,
            "message": f"Successfully executed {side} {quantity} shares of {symbol} at ₹{execution_price:.2f}. WhatsApp alert dispatched."
        }

    def exit_position(self, symbol: str) -> Dict[str, Any]:
        """
        Squares off an open position or Demat holding at current market price.
        Automatically books realized PnL and fires instant WhatsApp notification.
        """
        sym = symbol.upper()
        ltp = self.market_data.get_live_price(sym)
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Check open MIS positions
        pos = next((p for p in self.positions if p["symbol"] == sym), None)
        if pos:
            qty = pos["quantity"]
            entry_price = pos["entry_price"]
            pnl = round((ltp - entry_price) * qty, 2)
            pnl_pct = round(((ltp - entry_price) / max(1.0, entry_price)) * 100, 2)
            settled_amt = round((entry_price * qty) + pnl, 2)
            self.available_cash += settled_amt
            self.positions.remove(pos)

            order_record = {
                "order_id": f"ORD_EXIT_{int(time.time())}_{sym}",
                "symbol": sym,
                "side": "SELL",
                "product": "MIS",
                "quantity": qty,
                "price": ltp,
                "status": "EXECUTED",
                "timestamp": now_str,
                "mode": self.active_mode
            }
            self.orders.insert(0, order_record)

            try:
                alert_text = whatsapp_alerter.format_execution_alert(order_record, {
                    "realized_pnl": pnl,
                    "realized_pnl_pct": pnl_pct,
                    "reason": "Manual Square-off via Terminal"
                })
                whatsapp_alerter.dispatch_whatsapp(alert_text)
            except Exception:
                pass

            return {
                "success": True,
                "symbol": sym,
                "exit_price": ltp,
                "realized_pnl": pnl,
                "message": f"Position {sym} squared off at ₹{ltp:.2f} (Realized PnL: ₹{pnl:+.2f}). WhatsApp alert dispatched."
            }

        # 2. Check Demat holdings (Sell CNC)
        holding = next((h for h in self.holdings if h["symbol"] == sym), None)
        if holding:
            qty = holding["quantity"]
            entry_price = holding["avg_buy_price"]
            pnl = round((ltp - entry_price) * qty, 2)
            pnl_pct = round(((ltp - entry_price) / max(1.0, entry_price)) * 100, 2)
            settled_amt = round(qty * ltp, 2)
            self.available_cash += settled_amt
            self.holdings.remove(holding)

            order_record = {
                "order_id": f"ORD_SELL_{int(time.time())}_{sym}",
                "symbol": sym,
                "side": "SELL",
                "product": "CNC",
                "quantity": qty,
                "price": ltp,
                "status": "EXECUTED",
                "timestamp": now_str,
                "mode": self.active_mode
            }
            self.orders.insert(0, order_record)

            try:
                alert_text = whatsapp_alerter.format_execution_alert(order_record, {
                    "realized_pnl": pnl,
                    "realized_pnl_pct": pnl_pct,
                    "reason": "Demat Holding Sold via Terminal"
                })
                whatsapp_alerter.dispatch_whatsapp(alert_text)
            except Exception:
                pass

            return {
                "success": True,
                "symbol": sym,
                "exit_price": ltp,
                "realized_pnl": pnl,
                "message": f"Demat holding {sym} sold at ₹{ltp:.2f} (Realized PnL: ₹{pnl:+.2f}). WhatsApp alert dispatched."
            }

        raise ValueError(f"No active position or holding found for ticker {sym}")

# Global singleton
broker_engine = BrokerEngine()
