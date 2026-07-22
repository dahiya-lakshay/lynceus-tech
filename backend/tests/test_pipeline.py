"""
Unit tests for the ML pipeline. Assumes `python -m app.ml.train` has already
been run so model artifacts exist under backend/models/ — that's true in CI
(see .github/workflows/backend-ci.yml, which trains before testing) and true
in this repo out of the box, since trained artifacts ship with it.
"""
import pandas as pd
import pytest

from app.ml.preprocessing import transform
from app.ml.anomaly import score_anomaly
from app.ml.rules import evaluate_rules
from app.ml import account_profile

SAMPLE_TRANSACTION = {
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


def test_transform_produces_expected_engineered_columns():
    df = pd.DataFrame([SAMPLE_TRANSACTION])
    processed = transform(df)

    for col in ("HourOfDay", "IsNight", "IsWeekend", "AmountToBalanceRatio",
                "AccountAmountZScore", "IsNewDeviceForAccount", "IsNewLocationForAccount"):
        assert col in processed.columns, f"missing engineered feature: {col}"


def test_anomaly_score_is_finite_float():
    df = pd.DataFrame([SAMPLE_TRANSACTION])
    processed = transform(df)
    score = score_anomaly(processed)
    assert len(score) == 1
    assert score.iloc[0] == score.iloc[0]  # not NaN


def test_unknown_account_falls_back_to_global_profile():
    features = account_profile.behavioral_features(
        "ACCOUNT_THAT_DOES_NOT_EXIST", 100.0, "D_UNKNOWN", "Nowhere"
    )
    assert features["AccountHistoricalTxnCount"] == 0
    assert features["IsNewDeviceForAccount"] == 1
    assert features["IsNewLocationForAccount"] == 1


def test_rules_engine_flags_excessive_login_attempts():
    behavioral = {"IsNewDeviceForAccount": False, "IsNewLocationForAccount": False, "AccountAmountZScore": 0}
    txn = {**SAMPLE_TRANSACTION, "LoginAttempts": 6}
    flags = evaluate_rules(txn, behavioral)
    assert any(f["rule"] == "EXCESSIVE_LOGIN_ATTEMPTS" for f in flags)


def test_rules_engine_flags_amount_exceeding_balance():
    behavioral = {"IsNewDeviceForAccount": False, "IsNewLocationForAccount": False, "AccountAmountZScore": 0}
    txn = {**SAMPLE_TRANSACTION, "TransactionAmount": 5000.0, "AccountBalance": 100.0}
    flags = evaluate_rules(txn, behavioral)
    assert any(f["rule"] == "AMOUNT_EXCEEDS_3X_BALANCE" for f in flags)


def test_rules_engine_clean_transaction_has_no_high_severity_flags():
    behavioral = {"IsNewDeviceForAccount": False, "IsNewLocationForAccount": False, "AccountAmountZScore": 0.2}
    flags = evaluate_rules(SAMPLE_TRANSACTION, behavioral)
    assert not any(f["severity"] == "high" for f in flags)
