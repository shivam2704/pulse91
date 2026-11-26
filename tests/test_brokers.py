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

def test_multi_tenant_user_isolation(client):
    from pulse91.core.brokers import broker_engine
    
    # 1. Reset Sandbox for two separate users
    broker_engine.reset_sandbox(10000.0, account_id="USER-ALICE")
    broker_engine.reset_sandbox(10000.0, account_id="USER-BOB")

    # 2. Alice buys BEL
    alice_order = {
        "symbol": "BEL",
        "quantity": 5,
        "side": "BUY",
        "product": "CNC",
        "price": 295.0
    }
    broker_engine.place_order(alice_order, account_id="USER-ALICE")

    # 3. Bob buys TATASTEEL
    bob_order = {
        "symbol": "TATASTEEL",
        "quantity": 10,
        "side": "BUY",
        "product": "CNC",
        "price": 148.5
    }
    broker_engine.place_order(bob_order, account_id="USER-BOB")

    # 4. Verify Alice has BEL, Bob has TATASTEEL, and NO crossover
    alice_port = broker_engine.get_portfolio_overview(account_id="USER-ALICE")
    bob_port = broker_engine.get_portfolio_overview(account_id="USER-BOB")

    alice_symbols = [h["symbol"] for h in alice_port["holdings"]]
    bob_symbols = [h["symbol"] for h in bob_port["holdings"]]

    assert "BEL" in alice_symbols
    assert "TATASTEEL" not in alice_symbols

    assert "TATASTEEL" in bob_symbols
    assert "BEL" not in bob_symbols

    # 5. Verify isolated cash ledgers
    assert alice_port["available_cash"] == 10000.0 - (295.0 * 5)
    assert bob_port["available_cash"] == 10000.0 - (148.5 * 10)

def test_guest_broker_connect_forbidden(client):
    # Guest user attempts to connect live broker -> Must return HTTP 401
    res = client.post("/api/v1/demat/connect", json={"broker": "GROWW", "api_key": "k", "api_secret": "s"}, headers={"X-Guest-ID": "GUEST_TEST_99"})
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]


