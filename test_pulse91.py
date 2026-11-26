"""
pulse91/test_pulse91.py
End-to-End Automated Verification Test Suite for Pulse91
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from pulse91.core.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "ONLINE"
    print("✓ /health passed:", data["service"], "Nifty:", data["nifty_50"])

def test_available_indices():
    res = client.get("/api/v1/scan/indices")
    assert res.status_code == 200
    indices = res.json()["indices"]
    assert len(indices) >= 8
    print(f"✓ /api/v1/scan/indices passed: {len(indices)} indices available")

def test_on_demand_index_scan():
    res = client.get("/api/v1/scan/index?index_key=NIFTY_IT")
    assert res.status_code == 200
    data = res.json()
    assert data["index_key"] == "NIFTY_IT"
    assert len(data["rankings"]) > 0
    top = data["rankings"][0]
    print(f"✓ /api/v1/scan/index (Nifty IT) passed: Top stock {top['symbol']} (Score: {top['confluence_score']})")

def test_monday_top15_scan():
    res = client.get("/api/v1/scan/monday-top15")
    assert res.status_code == 200
    data = res.json()
    assert len(data["picks"]) == 15, f"Expected 15 picks, got {len(data['picks'])}"
    top = data["picks"][0]
    assert "confluence_score" in top
    assert "verdict" in top
    assert "horizon_name" in top
    print(f"✓ /api/v1/scan/monday-top15 passed: Top 15 generated. Rank #1: {top['symbol']} ({top['confluence_score']}/100, {top['verdict']})")

def test_single_stock_deep_dive():
    res = client.get("/api/v1/scan/stock/HAL")
    assert res.status_code == 200
    stock = res.json()["data"]
    pillars = stock["pillars"]
    assert "pillar_1_market_regime" in pillars
    assert "pillar_2_sector_momentum" in pillars
    assert "pillar_3_technical_structure" in pillars
    assert "pillar_4_institutional_footprint" in pillars
    assert "pillar_5_fundamental_health" in pillars
    print(f"✓ /api/v1/scan/stock/HAL passed: 5-Pillar Score = {stock['confluence_score']}/100, Horizon = {stock['horizon_name']}")

def test_demat_portfolio():
    res = client.get("/api/v1/demat/overview")
    assert res.status_code == 200
    portfolio = res.json()["portfolio"]
    assert portfolio["mode"] in ["SANDBOX", "LIVE_DEMAT"]
    assert portfolio["available_cash"] >= 0
    assert isinstance(portfolio["holdings"], list)
    print(f"✓ /api/v1/demat/overview passed: Net Worth ₹{portfolio['account_net_worth']:,.2f}, Available Cash ₹{portfolio['available_cash']:,.2f}")

def test_order_execution_and_exit():
    # Switch to Sandbox for order tests to have guaranteed available balance
    client.post("/api/v1/demat/mode", json={"mode": "SANDBOX", "broker": "Pulse91 Sandbox", "account_id": "PULSE91-TEST"})

    # 1. Place a test buy order
    buy_payload = {
        "symbol": "BEL",
        "quantity": 10,
        "side": "BUY",
        "product": "CNC",
        "price": 295.0,
        "sl_price": 285.0,
        "target_price": 315.0
    }
    buy_res = client.post("/api/v1/trade/order", json=buy_payload)
    assert buy_res.status_code == 200
    print(f"✓ /api/v1/trade/order passed: Placed buy order for BEL (Qty: 10)")

    # 2. Place an intraday MIS order (calibrated to ₹10k sandbox capital)
    mis_payload = {
        "symbol": "TATASTEEL",
        "quantity": 10,
        "side": "BUY",
        "product": "MIS",
        "price": 148.5,
        "sl_price": 145.0,
        "target_price": 155.0
    }
    mis_res = client.post("/api/v1/trade/order", json=mis_payload)
    assert mis_res.status_code == 200
    print(f"✓ /api/v1/trade/order (MIS Intraday) passed: Placed MIS order for TATASTEEL")

    # 3. Square off MIS position
    exit_res = client.post("/api/v1/trade/exit", json={"symbol": "TATASTEEL"})
    assert exit_res.status_code == 200
    print(f"✓ /api/v1/trade/exit passed: Squared off TATASTEEL position")

def test_whatsapp_alert_format_and_dispatch():
    # 1. Format text
    res = client.post("/api/v1/alerts/whatsapp/format?symbol=HAL")
    assert res.status_code == 200
    msg = res.json()["formatted_message"]
    assert "PULSE91 DALAL STREET ALERT" in msg
    assert "HAL" in msg
    assert "5-PILLAR CONFLUENCE PROOFS" in msg
    print("✓ /api/v1/alerts/whatsapp/format passed: Clean professional alert generated")

    # 2. Send alert
    send_res = client.post("/api/v1/alerts/whatsapp/send", json={"symbol": "HAL", "phone_number": "+919876543210"})
    assert send_res.status_code == 200
    assert send_res.json()["success"] is True
    print("✓ /api/v1/alerts/whatsapp/send passed: WhatsApp alert dispatched")

if __name__ == "__main__":
    print("\n--- RUNNING PULSE91 VERIFICATION SUITE ---")
    test_health()
    test_available_indices()
    test_on_demand_index_scan()
    test_monday_top15_scan()
    test_single_stock_deep_dive()
    test_demat_portfolio()
    test_order_execution_and_exit()
    test_whatsapp_alert_format_and_dispatch()
    print("\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY! ZERO ERRORS.\n")
