from pathlib import Path
from app.ml.train import main as train_main

REQUIRED_MODELS = [
    "fraud_classifier.pkl",
    "isolation_forest.pkl",
    "numeric_imputer.pkl",
    "numeric_scaler.pkl",
    "account_profiles.pkl",
    "global_profile.pkl",
    "feature_order.json",
    "leaderboard.json",
    "pr_curve.json",
    "threshold.json",
]

REQUIRED_OUTPUTS = [
    "metrics.json",
    "feature_importance.json",
    "flagged_transactions.csv",
    "augmented_dataset.csv",
]


def artifacts_exist() -> bool:
    models_dir = Path("/app/models")
    outputs_dir = Path("/app/outputs")

    for file in REQUIRED_MODELS:
        if not (models_dir / file).exists():
            print(f"[BOOTSTRAP] Missing model: {file}")
            return False

    for file in REQUIRED_OUTPUTS:
        if not (outputs_dir / file).exists():
            print(f"[BOOTSTRAP] Missing output: {file}")
            return False

    return True


def bootstrap():
    print("[BOOTSTRAP] Checking artifacts...")

    if artifacts_exist():
        print("[BOOTSTRAP] All artifacts found.")
        return

    print("[BOOTSTRAP] Running training pipeline...")
    train_main()
    print("[BOOTSTRAP] Training complete.")