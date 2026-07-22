import json

import pandas as pd
from fastapi import APIRouter, HTTPException

from app.config import (
    METRICS_PATH,
    FEATURE_IMPORTANCE_PATH,
    FLAGGED_TRANSACTIONS_PATH,
    AUGMENTED_DATASET_PATH,
    LEADERBOARD_PATH,
    PR_CURVE_PATH,
)
from app.schemas import DashboardStatsResponse

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(recent_limit: int = 12):
    try:
        with open(METRICS_PATH) as f:
            metrics = json.load(f)
        with open(FEATURE_IMPORTANCE_PATH) as f:
            feature_importance = json.load(f)
        with open(LEADERBOARD_PATH) as f:
            leaderboard = json.load(f)
        with open(PR_CURVE_PATH) as f:
            pr_curve = json.load(f)

        flagged = pd.read_csv(FLAGGED_TRANSACTIONS_PATH)
        recent_flagged = (
            flagged[
                [
                    "TransactionID",
                    "AccountID",
                    "TransactionAmount",
                    "TransactionType",
                    "Location",
                    "Channel",
                    "AnomalyScore",
                ]
            ]
            .sort_values("AnomalyScore")
            .head(recent_limit)
            .to_dict(orient="records")
        )

        total_transactions = len(pd.read_csv(AUGMENTED_DATASET_PATH))

        return {
            "metrics": metrics,
            "feature_importance": feature_importance,
            "recent_flagged": recent_flagged,
            "total_transactions": total_transactions,
            "leaderboard": leaderboard,
            "pr_curve": pr_curve,
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Missing required artifact: {e.filename}",
        )


from pathlib import Path

@router.get("/health")
def health_check():
    models_ready = Path("/app/models/fraud_classifier.pkl").exists()

    dashboard_ready = Path("/app/outputs/metrics.json").exists()

    return {
        "status": "healthy" if models_ready and dashboard_ready else "initializing",
        "models_ready": models_ready,
        "dashboard_ready": dashboard_ready,
        "version": "1.0.0",
    }