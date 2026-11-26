def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "ONLINE"

def test_available_indices(client):
    res = client.get("/api/v1/scan/indices")
    assert res.status_code == 200
    indices = res.json()["indices"]
    assert len(indices) >= 8
