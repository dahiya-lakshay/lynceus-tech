"""
A small deterministic rules engine that runs alongside the ML model.

Real fraud systems are almost never ML-only — a compromised card doing
something a human analyst would flag in half a second (a transaction for
more than the account holds, five failed logins, a 3am transfer to a
brand-new device) shouldn't have to wait on a model's opinion. Rules give
you that: fast, auditable, and immune to the model being wrong or stale.

These flags are reported as independent corroborating evidence next to the
ML probability and the anomaly score — deliberately NOT blended into a
single number, so a reviewer can see when the model and the rules agree
(high confidence) versus when they disagree (needs a human look).
"""
from typing import List, Dict


def evaluate_rules(transaction: dict, behavioral: dict) -> List[Dict]:
    flags = []

    amount = float(transaction.get("TransactionAmount", 0))
    balance = float(transaction.get("AccountBalance", 0))
    login_attempts = int(transaction.get("LoginAttempts", 0))

    if balance > 0 and amount > 3 * balance:
        flags.append({
            "rule": "AMOUNT_EXCEEDS_3X_BALANCE",
            "label": "Transaction exceeds 3x account balance",
            "severity": "high",
        })

    if login_attempts >= 4:
        flags.append({
            "rule": "EXCESSIVE_LOGIN_ATTEMPTS",
            "label": f"{login_attempts} login attempts before this transaction",
            "severity": "high",
        })
    elif login_attempts == 3:
        flags.append({
            "rule": "ELEVATED_LOGIN_ATTEMPTS",
            "label": "3 login attempts before this transaction",
            "severity": "medium",
        })

    if behavioral.get("IsNewDeviceForAccount") and behavioral.get("IsNewLocationForAccount"):
        flags.append({
            "rule": "NEW_DEVICE_AND_LOCATION",
            "label": "Unrecognized device and location for this account",
            "severity": "high",
        })
    elif behavioral.get("IsNewDeviceForAccount"):
        flags.append({
            "rule": "NEW_DEVICE",
            "label": "Unrecognized device for this account",
            "severity": "medium",
        })
    elif behavioral.get("IsNewLocationForAccount"):
        flags.append({
            "rule": "NEW_LOCATION",
            "label": "Unrecognized location for this account",
            "severity": "medium",
        })

    z_score = behavioral.get("AccountAmountZScore", 0)
    if abs(z_score) >= 3:
        flags.append({
            "rule": "AMOUNT_OUTLIER_FOR_ACCOUNT",
            "label": f"Amount is {abs(z_score):.1f} standard deviations from this account's norm",
            "severity": "high",
        })

    return flags
