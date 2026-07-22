import RiskGauge from './RiskGauge.jsx'

export default function Hero({ totalTransactions, fraudRate }) {
  return (
    <section className="relative overflow-hidden bg-grid-fade">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ledger-600 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
            named for the argonaut who saw through walls and earth
          </div>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl">
            Lynceus sees what{' '}
            <span className="text-signal-amber">others miss.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
            An event-driven fraud engine: a per-account feature store, a model leaderboard picked by
            cross-validation, a deterministic rules engine, and SHAP explanations on every verdict —
            scored the same way whether it arrives over Kafka or a single API call.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#live-check"
              className="rounded-md bg-signal-amber px-5 py-3 font-mono text-sm font-medium text-ledger-950 shadow-glow transition hover:brightness-110"
            >
              Run a Live Check
            </a>
            <a
              href="#live-feed"
              className="rounded-md border border-ledger-600 px-5 py-3 font-mono text-sm font-medium text-slate-200 transition hover:border-ledger-500"
            >
              Watch the Live Feed
            </a>
          </div>

          <div className="mt-12 flex gap-10 border-t border-ledger-700 pt-6">
            <div>
              <div className="font-mono text-2xl font-semibold text-slate-50">
                {totalTransactions ? totalTransactions.toLocaleString() : '—'}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                transactions scored
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-semibold text-signal-amber">
                {fraudRate !== undefined ? `${(fraudRate * 100).toFixed(1)}%` : '—'}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                flagged as anomalous
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="rounded-2xl border border-ledger-600 bg-ledger-800/60 p-10 shadow-2xl">
            <RiskGauge score={null} />
            <p className="mt-4 max-w-[220px] text-center font-mono text-[11px] leading-relaxed text-slate-400">
              this gauge comes alive the moment you check a transaction below
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
