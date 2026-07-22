"""
Central configuration for the fraud detection pipeline.

Every path here is resolved relative to the backend package root, so the
app runs the same whether it's launched from the repo root, a Docker
container, or Render's build environment.
"""

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

DATA_PATH = os.path.join(DATA_DIR, "transactions.csv")

# Model artifacts
ISOLATION_MODEL_PATH = os.path.join(MODELS_DIR, "isolation_forest.pkl")
CLASSIFIER_MODEL_PATH = os.path.join(MODELS_DIR, "fraud_classifier.pkl")
NUMERIC_IMPUTER_PATH = os.path.join(MODELS_DIR, "numeric_imputer.pkl")
NUMERIC_SCALER_PATH = os.path.join(MODELS_DIR, "numeric_scaler.pkl")
FEATURE_ORDER_PATH = os.path.join(MODELS_DIR, "feature_order.json")
ACCOUNT_PROFILES_PATH = os.path.join(MODELS_DIR, "account_profiles.pkl")
GLOBAL_PROFILE_PATH = os.path.join(MODELS_DIR, "global_profile.pkl")
LEADERBOARD_PATH = os.path.join(MODELS_DIR, "leaderboard.json")
THRESHOLD_PATH = os.path.join(MODELS_DIR, "threshold.json")
PR_CURVE_PATH = os.path.join(MODELS_DIR, "pr_curve.json")

# Outputs used by the dashboard
METRICS_PATH = os.path.join(OUTPUTS_DIR, "metrics.json")
FLAGGED_TRANSACTIONS_PATH = os.path.join(OUTPUTS_DIR, "flagged_transactions.csv")
AUGMENTED_DATASET_PATH = os.path.join(OUTPUTS_DIR, "augmented_dataset.csv")
FEATURE_IMPORTANCE_PATH = os.path.join(OUTPUTS_DIR, "feature_importance.json")
LIVE_STREAM_PATH = os.path.join(OUTPUTS_DIR, "live_stream.jsonl")

# Categorical columns encoded with a LabelEncoder, one .pkl each
CATEGORICAL_COLS = [
    "TransactionType",
    "Location",
    "DeviceID",
    "IP Address",
    "MerchantID",
    "Channel",
    "CustomerOccupation",
]


def encoder_path(col: str) -> str:
    return os.path.join(MODELS_DIR, f"{col}_encoder.pkl")


NUMERIC_COLS = [
    "TransactionAmount",
    "CustomerAge",
    "TransactionDuration",
    "AccountBalance",
]

ID_COLS = ["TransactionID", "AccountID"]
DATE_COLS = ["TransactionDate", "PreviousTransactionDate"]

RANDOM_STATE = 42
CONTAMINATION = 0.05  # expected proportion of anomalous transactions
TEST_SIZE = 0.2
KFOLD_SPLITS = 5
