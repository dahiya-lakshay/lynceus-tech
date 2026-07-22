from typing import List, Optional

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    AccountID: Optional[str] = Field(None, example="AC00455")
    TransactionAmount: float = Field(..., example=182.50)
    TransactionDate: str = Field(..., example="21-07-2026 14:32")
    TransactionType: str = Field(..., example="Debit")
    Location: str = Field(..., example="Houston")
    DeviceID: str = Field(..., example="D000051")
    IP_Address: str = Field(..., alias="IP Address", example="13.149.61.4")
    MerchantID: str = Field(..., example="M052")
    Channel: str = Field(..., example="Online")
    CustomerAge: int = Field(..., example=34)
    CustomerOccupation: str = Field(..., example="Engineer")
    TransactionDuration: int = Field(..., example=95)
    LoginAttempts: int = Field(..., example=1)
    AccountBalance: float = Field(..., example=8213.55)
    PreviousTransactionDate: str = Field(..., example="18-07-2026 09:10")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "AccountID": "AC00455",
                "TransactionAmount": 182.50,
                "TransactionDate": "21-07-2026 14:32",
                "TransactionType": "Debit",
                "Location": "Houston",
                "DeviceID": "D000051",
                "IP Address": "13.149.61.4",
                "MerchantID": "M052",
                "Channel": "Online",
                "CustomerAge": 34,
                "CustomerOccupation": "Engineer",
                "TransactionDuration": 95,
                "LoginAttempts": 1,
                "AccountBalance": 8213.55,
                "PreviousTransactionDate": "18-07-2026 09:10",
            }
        }


class ExplanationItem(BaseModel):
    feature: str
    shap_value: float
    direction: str
    magnitude: float


class RuleFlag(BaseModel):
    rule: str
    label: str
    severity: str


class PredictionResponse(BaseModel):
    fraud_probability: float
    is_fraud: bool
    risk_band: str
    anomaly_score: float
    explanation: List[ExplanationItem]
    decision_threshold: float
    model_used: str
    confidence: Optional[float] = None
    rule_flags: List[RuleFlag] = []
    behavioral_signals: dict = {}


class HoldoutMetrics(BaseModel):
    precision: float
    recall: float
    f1: float
    roc_auc: float
    confusion_matrix: List[List[int]]
    test_size: int
    fraud_rate_in_test: float
    decision_threshold: float


class MetricsResponse(BaseModel):
    holdout: HoldoutMetrics
    cross_validation: dict
    dataset_size: int
    fraud_rate: float
    winning_model: str


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class LeaderboardEntry(BaseModel):
    average: dict
    folds: List[dict]


class PRCurvePoint(BaseModel):
    threshold: float
    precision: float
    recall: float


class DashboardStatsResponse(BaseModel):
    metrics: MetricsResponse
    feature_importance: List[FeatureImportanceItem]
    recent_flagged: List[dict]
    total_transactions: int
    leaderboard: dict
    pr_curve: List[PRCurvePoint]


class StreamTransaction(BaseModel):
    transaction: dict
    result: PredictionResponse
    scored_at: str
