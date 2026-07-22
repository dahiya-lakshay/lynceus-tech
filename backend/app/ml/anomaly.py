"""
Stage 1 of the hybrid pipeline: unsupervised anomaly detection.

The dataset has no ground-truth fraud label, so Isolation Forest is used to
surface statistically unusual transactions. Its output (AnomalyScore,
PotentialFraud) becomes the training signal for the supervised classifier
in stage 2, and AnomalyScore is also fed back in as a feature — the
classifier learns to generalize the anomaly detector's judgment rather than
just memorize it, which is what makes single-transaction scoring at
inference time meaningful.
"""

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest

from app.config import (
    ISOLATION_MODEL_PATH,
    CONTAMINATION,
    RANDOM_STATE,
    FLAGGED_TRANSACTIONS_PATH,
    AUGMENTED_DATASET_PATH,
    ID_COLS,
)

ANOMALY_FEATURE_COLS = [
    "TransactionAmount",
    "CustomerAge",
    "TransactionDuration",
    "AccountBalance",
    "TimeSinceLastTransaction",
    "LoginAttempts",
]


def fit_anomaly_detector(df: pd.DataFrame) -> pd.DataFrame:
    print("[INFO] Fitting Isolation Forest anomaly detector...")

    feature_df = df[[c for c in ANOMALY_FEATURE_COLS if c in df.columns]]

    model = IsolationForest(
        n_estimators=200,
        contamination=CONTAMINATION,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    model.fit(feature_df)
    joblib.dump(model, ISOLATION_MODEL_PATH)

    df = df.copy()
    df["AnomalyScore"] = model.decision_function(feature_df)
    anomaly_flag = model.predict(feature_df)  # -1 anomaly, 1 normal
    df["PotentialFraud"] = (anomaly_flag == -1).astype(int)

    flagged = df[df["PotentialFraud"] == 1]
    flagged.to_csv(FLAGGED_TRANSACTIONS_PATH, index=False)
    df.to_csv(AUGMENTED_DATASET_PATH, index=False)

    print(
        f"[INFO] Isolation Forest flagged {len(flagged)} / {len(df)} transactions "
        f"({len(flagged) / len(df):.1%}) for the classifier to learn from."
    )
    return df


def score_anomaly(df: pd.DataFrame) -> pd.Series:
    """Apply the already-fitted Isolation Forest to new/inference data."""
    model = joblib.load(ISOLATION_MODEL_PATH)
    feature_df = df[[c for c in ANOMALY_FEATURE_COLS if c in df.columns]]
    return pd.Series(model.decision_function(feature_df), index=df.index)
