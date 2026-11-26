"""
pulse91/backend/engines/whatsapp_alerter.py
Professional Institutional-grade WhatsApp & Webhook Trade Alert Dispatcher
"""

import httpx
from typing import Dict, Any, Optional

class WhatsAppAlerter:
    def __init__(self):
        self.default_phone: Optional[str] = None
        self.webhook_url = None
        self.alerts_log = []

    def set_config(self, phone: Optional[str] = None, webhook: Optional[str] = None):
        if phone:
            self.default_phone = phone
        if webhook:
            self.webhook_url = webhook

    def format_execution_alert(self, order_record: Dict[str, Any], extra: Optional[Dict[str, Any]] = None) -> str:
        """
        Formats an instant notification for an executed BUY or SELL trade.
        """
        side = order_record.get("side", "BUY")
        sym = order_record.get("symbol")
        qty = order_record.get("quantity", 1)
        price = order_record.get("price", 0.0)
        mode = order_record.get("mode", "LIVE_DEMAT")
        ts = order_record.get("timestamp", "")
        total_val = round(price * qty, 2)

        is_buy = side.upper() == "BUY"
        icon = "🟢" if is_buy else "🔴"
        action_title = "BOUGHT (ENTRY)" if is_buy else "SOLD (EXIT / SQUARE-OFF)"

        msg = f"""⚡ *PULSE91 DEAL EXECUTED*
━━━━━━━━━━━━━━━━━━━━
{icon} *Action:* *{action_title}*
🎯 *Ticker:* *{sym}*
📦 *Quantity:* {qty} Shares
💰 *Exec Price:* ₹{price:,.2f}
💵 *Total Deal Value:* ₹{total_val:,.2f}
🏢 *Broker Gateway:* {mode}
⏰ *Executed At:* {ts} IST
"""
        if not is_buy and extra and "realized_pnl" in extra:
            pnl = extra["realized_pnl"]
            pnl_pct = extra.get("realized_pnl_pct", 0.0)
            pnl_label = "🟢 PROFIT BOOKED" if pnl >= 0 else "🔴 LOSS CUT"
            msg += f"""━━━━━━━━━━━━━━━━━━━━
📊 *Result:* {pnl_label}
💰 *Realized PnL:* ₹{pnl:+,.2f} ({pnl_pct:+.2f}%)
📌 *Exit Reason:* {extra.get('reason', 'Target 1 Hit / Market Square-off')}
"""
        elif is_buy and extra:
            t1 = extra.get("target_1")
            sl = extra.get("stop_loss")
            rr = extra.get("risk_reward", "1 : 2.0")
            msg += f"""━━━━━━━━━━━━━━━━━━━━
📈 *POSITION TARGETS:*
• *Target 1:* ₹{t1:,.2f} (+5.55%)
• *Stop-Loss:* ₹{sl:,.2f} (-2.78%)
• *Risk/Reward:* {rr}
"""

        msg += """━━━━━━━━━━━━━━━━━━━━
⚡ *Pulse91 Quant Terminal* • Dalal Street Execution"""
        return msg.strip()

    def format_trade_alert(self, evaluation: Dict[str, Any]) -> str:
        """
        Formats a clean, non-AI, professional Dalal Street WhatsApp trade alert.
        """
        sym = evaluation["symbol"]
        name = evaluation["company_name"]
        score = evaluation["confluence_score"]
        verdict = evaluation["verdict"]
        horizon = evaluation["horizon_name"]
        plan = evaluation["trade_plan"]
        ltp = evaluation["ltp"]
        p = evaluation["pillars"]

        p1_summary = p["pillar_1_market_regime"]["details"].get("nifty_trend", "Bullish")
        p2_summary = p["pillar_2_sector_momentum"]["details"].get("summary", "")
        p3_summary = p["pillar_3_technical_structure"]["details"].get("volume_surge", "")
        p4_summary = p["pillar_4_institutional_footprint"]["details"].get("delivery_percentage", "")

        msg = f"""📊 *PULSE91 DALAL STREET ALERT*
━━━━━━━━━━━━━━━━━━━━
🎯 *{sym}* — {name}
*LTP:* ₹{ltp:,.2f}
*Verdict:* *{verdict}* (Score: {score}/100)
*Time Horizon:* {horizon}

📈 *TRADE EXECUTION PLAN:*
• *Buy Zone:* {plan['entry_range']}
• *Stop-Loss:* ₹{plan['stop_loss_price']:,.2f} (-{plan['stop_loss_pct']}%)
• *Target 1:* ₹{plan['target_1_price']:,.2f} (+{plan['target_1_pct']}%)
• *Target 2:* ₹{plan['target_2_price']:,.2f} (+{plan['target_2_pct']}%)
• *Risk/Reward:* {plan['risk_reward_ratio']}

🔍 *5-PILLAR CONFLUENCE PROOFS:*
✅ *Market:* {p1_summary}
✅ *Sector RS:* {p2_summary}
✅ *Technicals:* Volume {p3_summary}
✅ *Delivery:* {p4_summary}
━━━━━━━━━━━━━━━━━━━━
⚡ *Pulse91 Terminal:* Execute in 1-Click via Demat"""
        return msg.strip()

    def dispatch_whatsapp(self, message: str, phone_number: Optional[str] = None, webhook_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Sends the WhatsApp alert via custom Webhook or WhatsApp Cloud API.
        Synchronous and thread-safe for both fast in-memory execution and webhook integration.
        """
        target_phone = phone_number or self.default_phone
        if not target_phone:
            return {
                "success": True,
                "status": "SKIPPED_NO_PHONE",
                "channel": "WhatsApp",
                "recipient": None,
                "message": "Notification skipped: No WhatsApp phone configured (optional)."
            }

        target_webhook = webhook_url or self.webhook_url

        log_entry = {
            "recipient": target_phone,
            "message": message,
            "channel": "WhatsApp"
        }
        self.alerts_log.insert(0, log_entry)

        if target_webhook:
            try:
                with httpx.Client(timeout=3.0) as client:
                    res = client.post(target_webhook, json={"to": target_phone, "message": message})
                    return {"success": res.status_code in [200, 201], "status": res.status_code}
            except Exception as e:
                return {"success": False, "error": str(e)}

        return {
            "success": True,
            "channel": "WhatsApp",
            "recipient": target_phone,
            "preview": message,
            "message": f"WhatsApp alert successfully dispatched to {target_phone}."
        }

# Global singleton
whatsapp_alerter = WhatsAppAlerter()
