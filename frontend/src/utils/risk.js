/**
 * Presentation-layer risk mapping.
 *
 * Nothing here touches the model, the rules engine, or the API — it's a
 * deterministic re-framing of what /api/predict already returns, built for
 * a business audience instead of an ML one. The underlying probability,
 * rule flags, and anomaly score are all computed by the backend exactly as
 * before; this module only decides how to *display* them.
 */

// Friendly labels for the backend's rule codes. Only rules that actually
// fired are ever shown — this just renames them, it doesn't invent any.
const RULE_LABELS = {
  AMOUNT_EXCEEDS_3X_BALANCE: 'Large Transaction Amount',
  EXCESSIVE_LOGIN_ATTEMPTS: 'Elevated Login Attempts',
  ELEVATED_LOGIN_ATTEMPTS: 'Elevated Login Attempts',
  NEW_DEVICE_AND_LOCATION: 'New Device & Location',
  NEW_DEVICE: 'New Device',
  NEW_LOCATION: 'New Location',
  AMOUNT_OUTLIER_FOR_ACCOUNT: 'Unusual Amount for Account',
}

export function friendlyRuleLabel(rule) {
  return RULE_LABELS[rule.rule] || rule.label
}

// Merchant categories treated as elevated-risk verticals for the purposes
// of this dashboard. This is a client-side, presentation-only heuristic —
// the backend rules engine and model are untouched by it — surfaced only
// when the analyst has actually selected one of these categories on the form.
const HIGH_RISK_MERCHANT_CATEGORIES = ['Crypto', 'Gaming']

export function highRiskMerchantFlag(merchantCategory) {
  if (!HIGH_RISK_MERCHANT_CATEGORIES.includes(merchantCategory)) return null
  return {
    rule: 'HIGH_RISK_MERCHANT_CATEGORY',
    label: `High-Risk Merchant (${merchantCategory})`,
    severity: 'medium',
  }
}

/**
 * Overall Risk Score (0-100): a deterministic blend of the model's fraud
 * probability, how many/how severe the triggered rule flags are, and the
 * Isolation Forest anomaly score — not a straight copy of the ML
 * probability. Weights are fixed and documented here so the mapping stays
 * auditable rather than a black box on top of a black box.
 *
 *   60% fraud probability      — the model's own read
 *   25% rule severity          — independent corroborating evidence
 *   15% anomaly signal         — population-level unusualness
 */
export function computeBusinessRiskScore(result, extraFlags = []) {
  if (!result) return 0

  const probabilityComponent = result.fraud_probability

  const allFlags = [...(result.rule_flags || []), ...extraFlags]
  const severityWeight = { high: 0.5, medium: 0.3, low: 0.15 }
  const ruleRaw = allFlags.reduce((sum, f) => sum + (severityWeight[f.severity] || 0), 0)
  const ruleComponent = Math.min(1, ruleRaw)

  // Isolation Forest's decision_function is typically roughly in [-0.2, 0.3];
  // more negative = more anomalous. Normalize to a 0-1 "how anomalous" scale.
  const anomalyComponent = Math.max(0, Math.min(1, (0.15 - result.anomaly_score) / 0.35))

  const blended = 0.6 * probabilityComponent + 0.25 * ruleComponent + 0.15 * anomalyComponent
  return Math.round(Math.max(0, Math.min(1, blended)) * 100)
}

/**
 * Business-friendly decision status. Uses the same risk_band the backend
 * already computes from the model's probability — just relabeled for a
 * non-technical audience, with the actual thresholds unchanged.
 */
export function decisionStatus(result) {
  if (!result) return null
  switch (result.risk_band) {
    case 'critical':
      return { label: 'Blocked', tone: 'red' }
    case 'high':
      return { label: 'Requires Manual Review', tone: 'amber' }
    default:
      return { label: 'Approved', tone: 'teal' }
  }
}
