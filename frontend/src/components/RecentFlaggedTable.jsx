export default function RecentFlaggedTable({ transactions = [] }) {
  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-6">
      <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">Most anomalous in dataset</h4>
      <p className="mb-4 font-mono text-[11px] text-slate-400">
        Lowest Isolation Forest scores from the training set
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-ledger-600 text-left text-slate-500">
              <th className="py-2 pr-4 font-medium">ID</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Location</th>
              <th className="py-2 pr-4 font-medium">Channel</th>
              <th className="py-2 pr-2 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.TransactionID} className="border-b border-ledger-700/60 text-slate-300">
                <td className="py-2 pr-4">{tx.TransactionID}</td>
                <td className="py-2 pr-4 text-signal-amber">${Number(tx.TransactionAmount).toFixed(2)}</td>
                <td className="py-2 pr-4">{tx.TransactionType}</td>
                <td className="py-2 pr-4">{tx.Location}</td>
                <td className="py-2 pr-4">{tx.Channel}</td>
                <td className="py-2 pr-2 text-right">{Number(tx.AnomalyScore).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
