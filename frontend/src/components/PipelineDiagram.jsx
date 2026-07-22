const STAGES = [
  {
    n: '01',
    title: 'Anomaly Detection',
    model: 'Isolation Forest',
    detail:
      'Every transaction is isolated by random feature splits. Ones that separate from the crowd in very few splits get a low anomaly score — no fraud label needed, because none exists in raw transaction logs.',
    color: 'text-clear-teal',
    border: 'border-clear-teal/30',
  },
  {
    n: '02',
    title: 'Supervised Classification',
    model: 'Random Forest',
    detail:
      'The anomaly score becomes a training signal. A Random Forest learns to generalize it across all transaction features, so a single new transaction can be scored without recomputing the whole population\u2019s anomaly distribution.',
    color: 'text-signal-amber',
    border: 'border-signal-amber/30',
  },
  {
    n: '03',
    title: 'Explanation',
    model: 'SHAP (TreeExplainer)',
    detail:
      'Every prediction ships with the feature contributions that produced it — game-theoretic credit assignment across the Random Forest\u2019s decision trees, ranked by magnitude.',
    color: 'text-slate-50',
    border: 'border-ledger-500',
  },
]

export default function PipelineDiagram() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {STAGES.map((stage, i) => (
        <div key={stage.n} className="relative">
          <div className={`h-full rounded-xl border ${stage.border} bg-ledger-800/40 p-6`}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-slate-500">{stage.n}</span>
              <h4 className="font-display text-base font-semibold text-slate-50">{stage.title}</h4>
            </div>
            <div className={`mt-2 font-mono text-xs font-medium ${stage.color}`}>{stage.model}</div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{stage.detail}</p>
          </div>
          {i < STAGES.length - 1 && (
            <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="#3C4863" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
