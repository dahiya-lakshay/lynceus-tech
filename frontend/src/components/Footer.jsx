export default function Footer() {
  return (
    <footer className="border-t border-ledger-700 bg-ledger-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
          <div className="font-mono text-xs text-slate-300">
            <span className="font-display font-semibold text-slate-50">Lynceus</span>
            <span className="text-slate-500"> &middot; </span>
            Enterprise Fraud Intelligence Platform
            <span className="text-slate-500"> &middot; </span>
            Version 2.0
          </div>
        </div>
        <p className="max-w-md text-xs text-slate-500">
          Fraud labels are derived from unsupervised anomaly detection, not verified ground truth.
          Treat scores as a risk-prioritization signal for analyst review, not an automated final decision.
        </p>
      </div>
    </footer>
  )
}
