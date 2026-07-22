const SECTIONS = [
  {
    key: 'ingestion',
    title: 'Ingestion',
    accent: '#2DD4BF',
    steps: ['Transaction Producer', 'Kafka', 'Raw Topic'],
  },
  {
    key: 'processing',
    title: 'Processing',
    accent: '#F5A623',
    steps: ['Validation', 'Feature Engineering', 'Feature Store', 'Hybrid Fraud Engine'],
  },
  {
    key: 'serving',
    title: 'Serving',
    accent: '#F5A623',
    steps: ['FastAPI', 'REST API', 'Streaming', 'Risk API'],
  },
  {
    key: 'observability',
    title: 'Observability',
    accent: '#8B95AB',
    steps: ['MLflow', 'Grafana', 'Prometheus', 'Logs', 'Alerts'],
    parallel: true, // these run alongside every stage rather than in sequence
  },
]

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="my-1 text-ledger-500">
      <path d="M4 2L9 7L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SystemArchitecture() {
  return (
    <div className="rounded-2xl border border-ledger-600 bg-ledger-800/40 p-6 sm:p-8">
      <div className="mb-8">
        <h4 className="font-display text-base font-semibold text-slate-50">
          One scoring pipeline, two entry points
        </h4>
        <p className="mt-1 font-mono text-[11px] text-slate-400">
          The Kafka consumer and the REST API call the identical scoring function — this diagram
          shows the path a transaction takes through the system, end to end.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {SECTIONS.map((section, sectionIndex) => (
          <div
            key={section.key}
            className="flex flex-col rounded-xl border border-ledger-700 bg-ledger-900/40 p-5"
            style={{ animation: `archFadeIn 0.5s ease ${sectionIndex * 0.08}s both` }}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: section.accent }} />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {section.title}
              </span>
            </div>

            <div className="flex flex-1 flex-col items-stretch gap-0">
              {section.steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className="w-full rounded-lg border px-4 py-3 text-center transition hover:brightness-110"
                    style={{
                      borderColor: `${section.accent}40`,
                      backgroundColor: `${section.accent}0D`,
                    }}
                  >
                    <span className="font-display text-sm font-medium text-slate-100">{step}</span>
                  </div>
                  {i < section.steps.length - 1 && (
                    <div className="flex justify-center">
                      <div className="h-4 w-px" style={{ backgroundColor: `${section.accent}30` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {section.parallel && (
              <p className="mt-4 font-mono text-[10px] leading-relaxed text-slate-500">
                Runs continuously alongside every stage to the left, rather than as a sequential
                step of its own.
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 font-mono text-[11px] leading-relaxed text-slate-400">
        Run <code className="text-slate-300">docker compose --profile streaming up</code> to bring
        up Kafka, the producer, and the consumer alongside the API. Without it, Live Check and Live
        Feed still work — the API scores on demand instead of via the topic. The observability
        stack shown reflects the target production setup for this system, not services bundled in
        this repository today.
      </p>

      <style>{`
        @keyframes archFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
