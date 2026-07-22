from fastapi import APIRouter, HTTPException

from app.schemas import TransactionInput, PredictionResponse
from app.ml.pipeline import score_transaction

router = APIRouter(prefix="/api", tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(transaction: TransactionInput):
    try:
        raw = transaction.model_dump(by_alias=True)
        result = score_transaction(raw)
        return result
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model artifacts not found. Run the training pipeline first (python -m app.ml.train).",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not score transaction: {exc}")
