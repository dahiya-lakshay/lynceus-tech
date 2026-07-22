export default function ConfusionMatrix({ matrix }) {
  if (!matrix) return null
  const [[tn, fp], [fn, tp]] = matrix

  const cells = [
    { label: 'True Negative', value: tn, sub: 'legit, correctly cleared', tone: 'teal' },
    { label: 'False Positive', value: fp, sub: 'legit, wrongly flagged', tone: 'slate' },
    { label: 'False Negative', value: fn, sub: 'fraud, wrongly cleared', tone: 'red' },
    { label: 'True Positive', value: tp, sub: 'fraud, correctly flagged', tone: 'amber' },
  ]

  const toneClass = {
    teal: 'border-clear-teal/30 bg-clear-teal/5 text-clear-teal',
    amber: 'border-signal-amber/30 bg-signal-amber/5 text-signal-amber',
    red: 'border-alert-red/30 bg-alert-red/5 text-alert-red',
    slate: 'border-ledger-600 bg-ledger-800/40 text-slate-300',
  }

  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-6">
      <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">Held-out confusion matrix</h4>
      <p className="mb-4 font-mono text-[11px] text-slate-400">
        Evaluated on a stratified test split never seen during training
      </p>
      <div className="grid grid-cols-2 gap-3">
        {cells.map((cell) => (
          <div key={cell.label} className={`rounded-lg border p-4 ${toneClass[cell.tone]}`}>
            <div className="font-mono text-2xl font-semibold">{cell.value}</div>
            <div className="mt-1 text-xs font-medium">{cell.label}</div>
            <div className="mt-0.5 text-[11px] opacity-70">{cell.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
