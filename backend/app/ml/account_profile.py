"""
A tiny feature store: per-account behavioral baselines computed once at
training time from historical data, then looked up at inference time.

This is the same online/offline split every real fraud system has to solve:
a single incoming transaction has no history of its own to compute a
"deviation from this account's normal behavior" feature — that history has
to already be sitting somewhere, precomputed. Here it's a joblib-pickled
dict keyed by AccountID; in production this would typically be a low-latency
key-value store (Redis, DynamoDB) updated by a streaming job, but the
contract is identical: write once from batch history, read once per request.

Cold start (an AccountID never seen during training) falls back to global
population statistics rather than failing the request.
"""
import joblib
import pandas as pd

from app.config import ACCOUNT_PROFILES_PATH, GLOBAL_PROFILE_PATH


def build_profiles(raw_df: pd.DataFrame) -> None:
    print("[INFO] Building per-account behavioral profiles (feature store)...")

    grouped = raw_df.groupby("AccountID")
    profiles = {}
    for account_id, group in grouped:
        profiles[account_id] = {
            "mean_amount": float(group["TransactionAmount"].mean()),
            "std_amount": float(group["TransactionAmount"].std(ddof=0)) or 0.0,
            "txn_count": int(len(group)),
            "known_devices": set(group["DeviceID"].astype(str)),
            "known_locations": set(group["Location"].astype(str)),
        }

    global_profile = {
        "mean_amount": float(raw_df["TransactionAmount"].mean()),
        "std_amount": float(raw_df["TransactionAmount"].std(ddof=0)) or 1.0,
        "txn_count": 0,
        "known_devices": set(),
        "known_locations": set(),
    }

    joblib.dump(profiles, ACCOUNT_PROFILES_PATH)
    joblib.dump(global_profile, GLOBAL_PROFILE_PATH)
    print(f"[INFO] Feature store built for {len(profiles)} accounts.")


_cache = {}


def _load():
    if "profiles" not in _cache:
        _cache["profiles"] = joblib.load(ACCOUNT_PROFILES_PATH)
        _cache["global"] = joblib.load(GLOBAL_PROFILE_PATH)
    return _cache["profiles"], _cache["global"]


def get_profile(account_id: str) -> dict:
    """Look up an account's behavioral baseline. Falls back to global stats
    for accounts never seen during training (cold start)."""
    profiles, global_profile = _load()
    return profiles.get(account_id, global_profile)


def behavioral_features(account_id: str, amount: float, device_id: str, location: str) -> dict:
    profile = get_profile(account_id)
    std = profile["std_amount"] if profile["std_amount"] > 0 else 1.0

    return {
        "AccountAmountZScore": (amount - profile["mean_amount"]) / std,
        "AccountHistoricalTxnCount": profile["txn_count"],
        "IsNewDeviceForAccount": int(device_id not in profile["known_devices"]),
        "IsNewLocationForAccount": int(location not in profile["known_locations"]),
    }
