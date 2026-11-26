def test_on_demand_index_scan(client):
    res = client.get("/api/v1/scan/index?index_key=NIFTY_IT")
    assert res.status_code == 200
    data = res.json()
    assert data["index_key"] == "NIFTY_IT"
    assert len(data["rankings"]) > 0

def test_monday_top15_scan(client):
    res = client.get("/api/v1/scan/monday-top15")
    assert res.status_code == 200
    data = res.json()
    assert len(data["picks"]) == 15, f"Expected 15 picks, got {len(data['picks'])}"
    top = data["picks"][0]
    assert "confluence_score" in top
    assert "verdict" in top
    assert "horizon_name" in top

def test_single_stock_deep_dive(client):
    res = client.get("/api/v1/scan/stock/HAL")
    assert res.status_code == 200
    stock = res.json()["data"]
    pillars = stock["pillars"]
    assert "pillar_1_market_regime" in pillars
    assert "pillar_2_sector_momentum" in pillars
    assert "pillar_3_technical_structure" in pillars
    assert "pillar_4_institutional_footprint" in pillars
    assert "pillar_5_fundamental_health" in pillars
