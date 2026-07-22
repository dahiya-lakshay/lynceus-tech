"""
Stage 2 of the hybrid pipeline: a supervised classifier trained on the
Isolation Forest's pseudo-labels (PotentialFraud), using the engineered
transaction + behavioral features as inputs (AnomalyScore itself is
deliberately excluded — see the comment on NON_FEATURE_COLS below).

Two upgrades over a single fixed model:

1. A small model leaderboard: Random Forest vs Histogram Gradient Boosting,
   compared via 5-fold stratified cross-validated ROC-AUC. The winner is
   refit on the full dataset and shipped as the production model. Both
   entries are saved so the dashboard can show the comparison, not just
   the winner.
2. Decision threshold optimization: instead of the default 0.5 cutoff, the
   threshold that maximizes F1 on the held-out precision-recall curve is
   computed and persisted, so the classifier's binary decision reflects an
   actual optimization rather than an arbitrary constant.
"""
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    precision_recall_curve,
)

from app.config import (
    CLASSIFIER_MODEL_PATH,
    TEST_SIZE,
    RANDOM_STATE,
    KFOLD_SPLITS,
    METRICS_PATH,
    FEATURE_IMPORTANCE_PATH,
    FEATURE_ORDER_PATH,
    LEADERBOARD_PATH,
    THRESHOLD_PATH,
    PR_CURVE_PATH,
    ID_COLS,
    DATE_COLS,
)

# AnomalyScore is deliberately excluded from the classifier's inputs. It is
# the value PotentialFraud was thresholded from, so including it lets the
# model trivially memorize the label instead of learning the underlying
# transaction pattern (a classic leakage bug — and the reason a hybrid
# anomaly+classifier pipeline can otherwise look like it scores a suspicious
# 1.00 on every metric). The anomaly score is still computed and shown to
# the user alongside the classifier's own probability; the two are meant to
# be read as independent, corroborating signals, not one feeding the other.
NON_FEATURE_COLS = ID_COLS + DATE_COLS + ["PotentialFraud", "AnomalyScore"]

CANDIDATE_MODELS = {
    "random_forest": lambda: RandomForestClassifier(
        n_estimators=300, class_weight="balanced", random_state=RANDOM_STATE
    ),
    "hist_gradient_boosting": lambda: HistGradientBoostingClassifier(
        max_iter=300, random_state=RANDOM_STATE
    ),
}


def _feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    cols = [c for c in df.columns if c not in NON_FEATURE_COLS]
    return df[cols].select_dtypes(include=["float64", "int64"])


def _cross_validate(model_fn, X, y):
    kfold = StratifiedKFold(n_splits=KFOLD_SPLITS, shuffle=True, random_state=RANDOM_STATE)
    fold_metrics = []
    for fold, (train_idx, test_idx) in enumerate(kfold.split(X, y), start=1):
        X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
        y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]

        clf = model_fn()
        clf.fit(X_tr, y_tr)
        pred = clf.predict(X_te)
        proba = clf.predict_proba(X_te)[:, 1]

        fold_metrics.append({
            "fold": fold,
            "precision": precision_score(y_te, pred, zero_division=0),
            "recall": recall_score(y_te, pred, zero_division=0),
            "f1": f1_score(y_te, pred, zero_division=0),
            "roc_auc": roc_auc_score(y_te, proba),
        })

    avg = {k: sum(m[k] for m in fold_metrics) / len(fold_metrics)
           for k in ("precision", "recall", "f1", "roc_auc")}
    return fold_metrics, avg


def train_classifier(df: pd.DataFrame):
    print("[INFO] Training candidate classifiers (model leaderboard)...")

    X = _feature_frame(df)
    y = df["PotentialFraud"]

    with open(FEATURE_ORDER_PATH, "w") as f:
        json.dump(list(X.columns), f)

    # 1. Held-out split for an honest, single read on generalization.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    # 2. Leaderboard: cross-validate every candidate, rank by mean ROC-AUC.
    leaderboard = {}
    for name, model_fn in CANDIDATE_MODELS.items():
        fold_metrics, avg = _cross_validate(model_fn, X, y)
        leaderboard[name] = {"folds": fold_metrics, "average": avg}
        print(f"[INFO] {name}: CV ROC-AUC = {avg['roc_auc']:.4f}")

    winner_name = max(leaderboard, key=lambda n: leaderboard[n]["average"]["roc_auc"])
    print(f"[INFO] Leaderboard winner: {winner_name}")

    with open(LEADERBOARD_PATH, "w") as f:
        json.dump({"models": leaderboard, "winner": winner_name}, f, indent=2)

    # 3. Held-out evaluation of the winning architecture only.
    holdout_model = CANDIDATE_MODELS[winner_name]()
    holdout_model.fit(X_train, y_train)
    y_proba_holdout = holdout_model.predict_proba(X_test)[:, 1]

    # 4. Threshold optimization: sweep the held-out PR curve for the
    # threshold that maximizes F1, instead of assuming 0.5.
    precisions, recalls, thresholds = precision_recall_curve(y_test, y_proba_holdout)
    f1_scores = np.where(
        (precisions + recalls) > 0,
        2 * precisions * recalls / np.maximum(precisions + recalls, 1e-9),
        0,
    )
    best_idx = int(np.argmax(f1_scores[:-1])) if len(thresholds) else 0
    best_threshold = float(thresholds[best_idx]) if len(thresholds) else 0.5

    pr_curve_points = [
        {"threshold": float(t), "precision": float(p), "recall": float(r)}
        for t, p, r in zip(thresholds, precisions[:-1], recalls[:-1])
    ][::max(1, len(thresholds) // 60)]  # thin to ~60 points for the chart
    with open(PR_CURVE_PATH, "w") as f:
        json.dump(pr_curve_points, f, indent=2)

    y_pred_at_best = (y_proba_holdout >= best_threshold).astype(int)
    holdout_metrics = {
        "precision": precision_score(y_test, y_pred_at_best, zero_division=0),
        "recall": recall_score(y_test, y_pred_at_best, zero_division=0),
        "f1": f1_score(y_test, y_pred_at_best, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_proba_holdout),
        "confusion_matrix": confusion_matrix(y_test, y_pred_at_best).tolist(),
        "test_size": len(y_test),
        "fraud_rate_in_test": float(y_test.mean()),
        "decision_threshold": best_threshold,
    }
    print(f"[INFO] Held-out metrics @ optimized threshold {best_threshold:.3f}: {holdout_metrics}")

    with open(THRESHOLD_PATH, "w") as f:
        json.dump({"threshold": best_threshold, "model": winner_name}, f)

    # 5. Final production model: winning architecture, refit on all data.
    final_model = CANDIDATE_MODELS[winner_name]()
    final_model.fit(X, y)
    joblib.dump(final_model, CLASSIFIER_MODEL_PATH)
    print(f"[INFO] Production classifier ({winner_name}) saved at {CLASSIFIER_MODEL_PATH}")

    if hasattr(final_model, "feature_importances_"):
        importances = sorted(
            zip(X.columns, final_model.feature_importances_.tolist()),
            key=lambda pair: pair[1],
            reverse=True,
        )
    else:
        # HistGradientBoostingClassifier has no feature_importances_; fall back
        # to permutation importance on the held-out split for the dashboard.
        from sklearn.inspection import permutation_importance
        perm = permutation_importance(
            holdout_model, X_test, y_test, n_repeats=5, random_state=RANDOM_STATE, scoring="roc_auc"
        )
        importances = sorted(
            zip(X.columns, perm.importances_mean.tolist()),
            key=lambda pair: pair[1],
            reverse=True,
        )

    with open(FEATURE_IMPORTANCE_PATH, "w") as f:
        json.dump([{"feature": f_, "importance": v} for f_, v in importances], f, indent=2)

    metrics = {
        "holdout": holdout_metrics,
        "cross_validation": leaderboard[winner_name],
        "dataset_size": len(df),
        "fraud_rate": float(y.mean()),
        "winning_model": winner_name,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    return final_model, X


def predict_fraud(model, input_data: pd.DataFrame, threshold: float = 0.5):
    prob = float(model.predict_proba(input_data)[:, 1][0])
    pred = int(prob >= threshold)
    return prob, pred


def tree_vote_confidence(model, input_data: pd.DataFrame):
    """Agreement across individual trees, as a rough confidence signal.
    Only meaningful for bagging ensembles (Random Forest); returns None for
    boosting models, where trees aren't independent votes."""
    if not hasattr(model, "estimators_"):
        return None
    try:
        votes = np.array([tree.predict(input_data)[0] for tree in model.estimators_])
        agreement = float(max((votes == 1).mean(), (votes == 0).mean()))
        return round(agreement, 4)
    except Exception:
        return None
