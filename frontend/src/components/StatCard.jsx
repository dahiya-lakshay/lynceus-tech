export default function StatCard({ label, value, sublabel, accent = 'amber', demo = false }) {
  const accentColor = {
    amber: 'text-signal-amber',
    teal: 'text-clear-teal',
    slate: 'text-slate-50',
    red: 'text-alert-red',
  }[accent]

  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        {demo && (
          <span className="rounded-full border border-ledger-600 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-slate-500">
            demo
          </span>
        )}
      </div>
      <div className={`mt-2 font-mono text-3xl font-semibold ${accentColor}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-slate-400">{sublabel}</div>}
    </div>
  )
}
