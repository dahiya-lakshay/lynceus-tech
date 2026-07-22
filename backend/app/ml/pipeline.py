"""
Single-transaction inference pipeline used by the API layer.

Takes a raw transaction and returns:
  - a fraud probability + binary decision (at the F1-optimized threshold
    learned during training, not a hardcoded 0.5)
  - the Isolation Forest anomaly score (an independent signal, not fed into
    the classifier — see classifier.py)
  - a ranked SHAP explanation
  - a tree-vote confidence score, where available
  - any deterministic rule flags triggered alongside the ML decision
"""

import json

import joblib
import pandas as pd

from app.config import CLASSIFIER_MODEL_PATH, FEATURE_ORDER_PATH, THRESHOLD_PATH
from app.ml.preprocessing import transform
from app.ml.anomaly import score_anomaly
from app.ml.classifier import predict_fraud, tree_vote_confidence
from app.ml.explainability import explain_prediction
from app.ml.rules import evaluate_rules

_model_cache = {}


def _get_classifier():
    if "model" not in _model_cache:
        _model_cache["model"] = joblib.load(CLASSIFIER_MODEL_PATH)
    return _model_cache["model"]


def _get_feature_order():
    if "order" not in _model_cache:
        with open(FEATURE_ORDER_PATH) as f:
            _model_cache["order"] = json.load(f)
    return _model_cache["order"]


def _get_threshold_info():
    if "threshold_info" not in _model_cache:
        with open(THRESHOLD_PATH) as f:
            _model_cache["threshold_info"] = json.load(f)
    return _model_cache["threshold_info"]


RISK_BANDS = (
    (0.75, "critical"),
    (0.5, "high"),
    (0.25, "medium"),
    (0.0, "low"),
)


def _risk_band(probability: float) -> str:
    for threshold, label in RISK_BANDS:
        if probability >= threshold:
            return label
    return "low"


def score_transaction(raw_transaction: dict) -> dict:
    df = pd.DataFrame([raw_transaction])

    processed = transform(df)
    processed["AnomalyScore"] = score_anomaly(processed)

    feature_order = _get_feature_order()
    for col in feature_order:
        if col not in processed.columns:
            processed[col] = 0
    X = processed[feature_order]

    model = _get_classifier()
    threshold_info = _get_threshold_info()
    threshold = threshold_info["threshold"]

    probability, prediction = predict_fraud(model, X, threshold=threshold)
    explanation = explain_prediction(model, X)
    confidence = tree_vote_confidence(model, X)

    behavioral = {
        "AccountAmountZScore": float(processed["AccountAmountZScore"].iloc[0]),
        "IsNewDeviceForAccount": bool(processed["IsNewDeviceForAccount"].iloc[0]),
        "IsNewLocationForAccount": bool(processed["IsNewLocationForAccount"].iloc[0]),
        "AccountHistoricalTxnCount": int(
            processed["AccountHistoricalTxnCount"].iloc[0]
        ),
    }
    rule_flags = evaluate_rules(raw_transaction, behavioral)

    return {
        "fraud_probability": round(probability, 4),
        "is_fraud": bool(prediction),
        "risk_band": _risk_band(probability),
        "anomaly_score": round(float(processed["AnomalyScore"].iloc[0]), 4),
        "explanation": explanation,
        "decision_threshold": threshold,
        "model_used": threshold_info["model"],
        "confidence": confidence,
        "rule_flags": rule_flags,
        "behavioral_signals": behavioral,
    }
