"""
API-level smoke tests using FastAPI's TestClient. Requires model artifacts
to exist (run `python -m app.ml.train` first — CI does this automatically).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_lists_endpoints():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "/api/predict" in body["endpoints"]


def test_stats_endpoint_returns_expected_shape():
    response = client.get("/api/stats")
    assert response.status_code == 200
    body = response.json()
    assert "metrics" in body
    assert "leaderboard" in body
    assert "pr_curve" in body
    assert body["total_transactions"] > 0


def test_predict_endpoint_scores_a_transaction():
    payload = {
        "AccountID": "AC00455",
        "TransactionAmount": 68.40,
        "TransactionDate": "21-07-2026 09:15",
        "TransactionType": "Debit",
        "Location": "Houston",
        "DeviceID": "D000051",
        "IP Address": "13.149.61.4",
        "MerchantID": "M052",
        "Channel": "ATM",
        "CustomerAge": 42,
        "CustomerOccupation": "Engineer",
        "TransactionDuration": 90,
        "LoginAttempts": 1,
        "AccountBalance": 9820.10,
        "PreviousTransactionDate": "18-07-2026 08:40",
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert 0.0 <= body["fraud_probability"] <= 1.0
    assert body["risk_band"] in ("low", "medium", "high", "critical")
    assert "explanation" in body


def test_predict_endpoint_rejects_malformed_payload():
    response = client.post("/api/predict", json={"TransactionAmount": "not-a-number"})
    assert response.status_code == 422


def test_stream_next_returns_a_scored_transaction():
    response = client.get("/api/stream/next")
    assert response.status_code == 200
    body = response.json()
    assert "transaction" in body
    assert "result" in body
