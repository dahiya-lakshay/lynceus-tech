import StatCard from './StatCard.jsx'

/**
 * Three of these six cards are real, computed from the trained model's own
 * held-out evaluation (precision, recall, false-positive rate — straight
 * from the confusion matrix in stats.metrics.holdout). The other three
 * (transactions today, fraud prevented, average latency) aren't tracked by
 * this system — there's no request logging or per-day aggregation wired up
 * — so they're clearly tagged "demo" rather than presented as real
 * telemetry that doesn't exist.
 */
export default function EnterpriseKPIs({ stats }) {
  if (!stats) return null

  const { holdout } = stats.metrics
  const [[tn, fp]] = holdout.confusion_matrix
  const falsePositiveRate = fp / (fp + tn)

  const estimatedFlagged = Math.round(stats.metrics.dataset_size * stats.metrics.fraud_rate)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Transactions Today" value="8,412" sublabel="illustrative volume" accent="slate" demo />
      <StatCard
        label="Anomalies Flagged"
        value={estimatedFlagged.toLocaleString()}
        sublabel="training set, all-time"
        accent="amber"
      />
      <StatCard label="Avg. Latency" value="118 ms" sublabel="per prediction" accent="slate" demo />
      <StatCard
        label="False Positive Rate"
        value={`${(falsePositiveRate * 100).toFixed(2)}%`}
        sublabel="held-out test split"
        accent="teal"
      />
      <StatCard
        label="Precision"
        value={holdout.precision.toFixed(3)}
        sublabel="held-out test split"
        accent="amber"
      />
      <StatCard
        label="Recall"
        value={holdout.recall.toFixed(3)}
        sublabel="held-out test split"
        accent="teal"
      />
    </div>
  )
}
