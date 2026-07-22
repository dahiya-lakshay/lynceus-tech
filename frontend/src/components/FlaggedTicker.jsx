export default function FlaggedTicker({ transactions = [] }) {
  if (!transactions.length) return null

  const items = [...transactions, ...transactions] // duplicate for seamless loop

  return (
    <div className="relative border-y border-ledger-600 bg-ledger-950/80 overflow-hidden py-2.5">
      <div className="flex w-max animate-ticker gap-10 font-mono text-xs">
        {items.map((tx, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-amber shadow-glow" />
            <span className="text-slate-200">{tx.TransactionID}</span>
            <span>·</span>
            <span>{tx.Location}</span>
            <span>·</span>
            <span className="text-signal-amber">${Number(tx.TransactionAmount).toFixed(2)}</span>
            <span>·</span>
            <span>{tx.Channel}</span>
            <span className="text-ledger-500">flagged</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-ledger-900 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-ledger-900 to-transparent" />
    </div>
  )
}
