def test_demat_portfolio(client):
    res = client.get("/api/v1/demat/overview")
    assert res.status_code == 200
    portfolio = res.json()["portfolio"]
    assert portfolio["mode"] in ["SANDBOX", "LIVE_DEMAT"]
    assert portfolio["available_cash"] >= 0
    assert isinstance(portfolio["holdings"], list)

def test_order_execution_and_exit(client):
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

    # 3. Square off MIS position
    exit_res = client.post("/api/v1/trade/exit", json={"symbol": "TATASTEEL"})
    assert exit_res.status_code == 200

def test_whatsapp_alert_format_and_dispatch(client):
    res = client.post("/api/v1/alerts/whatsapp/format?symbol=HAL")
    assert res.status_code == 200
    msg = res.json()["formatted_message"]
    assert "PULSE91 DALAL STREET ALERT" in msg
    assert "HAL" in msg

    send_res = client.post("/api/v1/alerts/whatsapp/send", json={"symbol": "HAL", "phone_number": "+919876543210"})
    assert send_res.status_code == 200
    assert send_res.json()["success"] is True
