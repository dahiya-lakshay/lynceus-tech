"""
Stage 3: explainability via SHAP.

The original project rendered SHAP output as matplotlib PNGs meant for a
human staring at a notebook. This version returns plain JSON — a ranked
list of {feature, shap_value, direction} per prediction — so the React
frontend can render its own chart and the API stays framework-agnostic.
"""

import json

import joblib
import numpy as np
import pandas as pd
import shap

from app.config import CLASSIFIER_MODEL_PATH, FEATURE_IMPORTANCE_PATH

_explainer_cache = {}


def _get_explainer(model):
    key = id(model)
    if key not in _explainer_cache:
        _explainer_cache[key] = shap.TreeExplainer(model)
    return _explainer_cache[key]


def _shap_values_for_fraud_class(explainer, df: pd.DataFrame) -> np.ndarray:
    raw = explainer.shap_values(df)
    if isinstance(raw, list):
        values = raw[1]  # class 1 = fraud
    else:
        values = raw
    if values.ndim == 3:
        values = values[:, :, 1]
    return values


def explain_prediction(model, row_df: pd.DataFrame, top_n: int = 8) -> list[dict]:
    """Return a ranked, human-readable explanation for a single prediction."""
    explainer = _get_explainer(model)
    shap_values = _shap_values_for_fraud_class(explainer, row_df)[0]

    ranked = sorted(
        zip(row_df.columns, shap_values),
        key=lambda pair: abs(pair[1]),
        reverse=True,
    )[:top_n]

    explanations = []
    for feature, value in ranked:
        explanations.append(
            {
                "feature": feature,
                "shap_value": round(float(value), 5),
                "direction": "increased" if value > 0 else "decreased",
                "magnitude": round(float(abs(value)), 5),
            }
        )
    return explanations


def global_feature_importance(top_n: int = 15) -> list[dict]:
    """Read the precomputed training-time feature importances (fast path for the dashboard)."""
    with open(FEATURE_IMPORTANCE_PATH) as f:
        data = json.load(f)
    return data[:top_n]
