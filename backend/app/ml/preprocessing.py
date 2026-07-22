"""
Preprocessing for the fraud detection pipeline.

Two entry points:
  fit_transform(df)  - used only during training. Fits imputers, scalers and
                        label encoders on the full training data and persists
                        them to disk so inference uses the exact same
                        transformation.
  transform(df)       - used at inference time (API request or batch scoring).
                        Loads the fitted artifacts and applies them; never
                        re-fits anything, so a single transaction is scored
                        against the same distribution the model was trained on.

Both paths share `_engineer_features`, so training and inference can never
silently drift apart.
"""

import joblib
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from app.config import (
    DATA_PATH,
    NUMERIC_COLS,
    DATE_COLS,
    CATEGORICAL_COLS,
    NUMERIC_IMPUTER_PATH,
    NUMERIC_SCALER_PATH,
    encoder_path,
)
from app.ml import account_profile


def load_data() -> pd.DataFrame:
    return pd.read_csv(DATA_PATH)


def _add_contextual_features(df: pd.DataFrame) -> pd.DataFrame:
    """Point-in-time features computable from a single transaction alone —
    no history lookup required."""
    df["HourOfDay"] = df["TransactionDate"].dt.hour.fillna(12).astype(int)
    df["IsNight"] = df["HourOfDay"].apply(lambda h: 1 if (h >= 22 or h <= 5) else 0)
    df["IsWeekend"] = (
        df["TransactionDate"].dt.dayofweek.fillna(0).apply(lambda d: 1 if d >= 5 else 0)
    )
    df["AmountToBalanceRatio"] = df["TransactionAmount"] / (
        df["AccountBalance"].fillna(0) + 1.0
    )
    df["HighLoginAttempts"] = (df["LoginAttempts"] >= 3).astype(int)
    return df


def _add_behavioral_features(df: pd.DataFrame) -> pd.DataFrame:
    """History-dependent features looked up from the account feature store.
    Must run before categorical encoding, since it needs raw DeviceID/Location
    strings and raw (unscaled) TransactionAmount to compare against profiles."""
    records = df.apply(
        lambda row: account_profile.behavioral_features(
            row["AccountID"],
            row["TransactionAmount"],
            str(row["DeviceID"]),
            str(row["Location"]),
        ),
        axis=1,
        result_type="expand",
    )
    return pd.concat([df, records], axis=1)


def _engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Feature engineering shared by training and inference."""
    df = df.copy()

    for col in DATE_COLS:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce", dayfirst=True)

    if "TransactionDate" in df.columns and "PreviousTransactionDate" in df.columns:
        df["TimeSinceLastTransaction"] = (
            df["TransactionDate"] - df["PreviousTransactionDate"]
        ).dt.total_seconds()
    else:
        df["TimeSinceLastTransaction"] = 0.0

    df = _add_contextual_features(df)
    df = _add_behavioral_features(df)

    df = df.drop(columns=[c for c in DATE_COLS if c in df.columns], errors="ignore")
    return df


ENGINEERED_NUMERIC_COLS = [
    "TimeSinceLastTransaction",
    "HourOfDay",
    "IsNight",
    "IsWeekend",
    "AmountToBalanceRatio",
    "HighLoginAttempts",
    "AccountAmountZScore",
    "AccountHistoricalTxnCount",
    "IsNewDeviceForAccount",
    "IsNewLocationForAccount",
]


def fit_transform(df: pd.DataFrame) -> pd.DataFrame:
    print("[INFO] Fitting preprocessing artifacts on training data...")
    df = _engineer_features(df)

    numeric_cols = NUMERIC_COLS + ["TimeSinceLastTransaction"]

    imputer = SimpleImputer(strategy="mean")
    df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
    joblib.dump(imputer, NUMERIC_IMPUTER_PATH)

    scaler = StandardScaler()
    df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
    joblib.dump(scaler, NUMERIC_SCALER_PATH)

    for col in CATEGORICAL_COLS:
        encoder = LabelEncoder()
        df[col] = encoder.fit_transform(df[col].astype(str))
        joblib.dump(encoder, encoder_path(col))

    print("[INFO] Preprocessing fit complete.")
    return df


def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Apply already-fitted preprocessing artifacts. Used for scoring."""
    df = _engineer_features(df)

    numeric_cols = NUMERIC_COLS + ["TimeSinceLastTransaction"]

    imputer = joblib.load(NUMERIC_IMPUTER_PATH)
    scaler = joblib.load(NUMERIC_SCALER_PATH)
    df[numeric_cols] = imputer.transform(df[numeric_cols])
    df[numeric_cols] = scaler.transform(df[numeric_cols])

    for col in CATEGORICAL_COLS:
        if col not in df.columns:
            continue
        encoder = joblib.load(encoder_path(col))
        # Unseen categories at inference time fall back to the encoder's
        # first known class rather than crashing the request.
        known = set(encoder.classes_)
        df[col] = (
            df[col]
            .astype(str)
            .apply(lambda v: v if v in known else encoder.classes_[0])
        )
        df[col] = encoder.transform(df[col])

    return df
