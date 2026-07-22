"""
End-to-end training pipeline:

    raw transactions.csv
        -> account_profile.build_profiles    (feature store: per-account behavioral baselines)
        -> preprocessing.fit_transform        (contextual + behavioral features, impute, scale, encode)
        -> anomaly.fit_anomaly_detector        (Isolation Forest -> AnomalyScore, PotentialFraud)
        -> classifier.train_classifier         (model leaderboard, threshold optimization, metrics)

Run with:  python -m app.ml.train
"""
import os

from app.config import DATA_DIR, MODELS_DIR, OUTPUTS_DIR
from app.ml.preprocessing import load_data, fit_transform
from app.ml.anomaly import fit_anomaly_detector
from app.ml.classifier import train_classifier
from app.ml import account_profile


def main():
    for d in (DATA_DIR, MODELS_DIR, OUTPUTS_DIR):
        os.makedirs(d, exist_ok=True)

    print("========== Lynceus Training Pipeline ==========")

    df = load_data()
    print(f"[INFO] Loaded {len(df)} transactions.")

    # Feature store must be built before preprocessing, since behavioral
    # features are looked up (not fitted) during feature engineering.
    account_profile.build_profiles(df)

    df = fit_transform(df)
    df = fit_anomaly_detector(df)
    model, X = train_classifier(df)

    print("========== Training Pipeline Complete ==========")
    print(f"[INFO] Artifacts written to {MODELS_DIR}")
    print(f"[INFO] Metrics + flagged transactions written to {OUTPUTS_DIR}")


if __name__ == "__main__":
    main()
