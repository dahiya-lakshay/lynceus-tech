import { friendlyRuleLabel } from '../utils/risk.js'

const SEVERITY_DOT = {
  high: 'bg-alert-red',
  medium: 'bg-signal-amber',
  low: 'bg-slate-400',
}

const SEVERITY_BORDER = {
  high: 'border-alert-red/30 bg-alert-red/5',
  medium: 'border-signal-amber/30 bg-signal-amber/5',
  low: 'border-ledger-600 bg-ledger-800/40',
}

export default function RuleFlags({ flags = [] }) {
  if (!flags.length) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-clear-teal/30 bg-clear-teal/5 px-3.5 py-2.5 font-mono text-xs text-clear-teal">
        <span className="h-1.5 w-1.5 rounded-full bg-clear-teal" />
        No elevated risk factors detected
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {flags.map((flag) => (
        <div
          key={flag.rule}
          className={`flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 ${SEVERITY_BORDER[flag.severity] || SEVERITY_BORDER.low}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[flag.severity] || SEVERITY_DOT.low}`} />
          <span className="font-mono text-xs text-slate-200">{friendlyRuleLabel(flag)}</span>
        </div>
      ))}
    </div>
  )
}
