const LABELS = {
  random_forest: 'Random Forest',
  hist_gradient_boosting: 'Hist Gradient Boosting',
}

export default function ModelLeaderboard({ leaderboard }) {
  if (!leaderboard?.models) return null

  const entries = Object.entries(leaderboard.models).sort(
    (a, b) => b[1].average.roc_auc - a[1].average.roc_auc
  )

  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-6">
      <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">Model leaderboard</h4>
      <p className="mb-4 font-mono text-[11px] text-slate-400">
        Ranked by 5-fold cross-validated ROC-AUC &middot; winner ships to production automatically
      </p>
      <div className="flex flex-col gap-3">
        {entries.map(([name, data], i) => {
          const isWinner = name === leaderboard.winner
          return (
            <div
              key={name}
              className={`rounded-lg border p-4 ${
                isWinner ? 'border-signal-amber/40 bg-signal-amber/5' : 'border-ledger-600 bg-ledger-900/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                  <span className="font-display text-sm font-medium text-slate-50">
                    {LABELS[name] || name}
                  </span>
                  {isWinner && (
                    <span className="rounded-full bg-signal-amber/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-signal-amber">
                      production
                    </span>
                  )}
                </div>
                <span className="font-mono text-lg font-semibold text-slate-50">
                  {data.average.roc_auc.toFixed(4)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-[11px] text-slate-400">
                <div>precision <span className="text-slate-200">{data.average.precision.toFixed(3)}</span></div>
                <div>recall <span className="text-slate-200">{data.average.recall.toFixed(3)}</span></div>
                <div>f1 <span className="text-slate-200">{data.average.f1.toFixed(3)}</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
