import { useEffect, useRef, useState } from 'react'
import { getNextStreamItem } from '../api/client.js'

const BAND_COLOR = {
  low: '#2DD4BF',
  medium: '#F5A623',
  high: '#F59E0B',
  critical: '#EF4444',
}

export default function LiveFeed() {
  const [items, setItems] = useState([])
  const [playing, setPlaying] = useState(false)
  const [mode, setMode] = useState(null)
  const timerRef = useRef(null)

  const pullOne = async () => {
    try {
      const data = await getNextStreamItem()
      setMode(data.source || 'on_demand')
      setItems((prev) => [data, ...prev].slice(0, 8))
    } catch {
      // Silently skip a beat if the API is briefly unreachable; the next
      // tick will retry rather than surfacing a scary error in a demo feed.
    }
  }

  useEffect(() => {
    if (!playing) {
      clearInterval(timerRef.current)
      return
    }
    pullOne()
    timerRef.current = setInterval(pullOne, 3000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  return (
    <div className="rounded-2xl border border-ledger-600 bg-ledger-800/40 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-50">Live Feed</h3>
          <p className="font-mono text-[11px] text-slate-400">
            {mode === 'kafka'
              ? 'Streaming from the Kafka consumer — genuine event-driven scoring'
              : 'On-demand scoring of live sample transactions (spin up the Kafka profile in docker-compose for the real event stream)'}
          </p>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className={`flex items-center gap-2 rounded-md border px-4 py-2 font-mono text-xs font-medium transition ${
            playing
              ? 'border-alert-red/40 bg-alert-red/10 text-alert-red hover:bg-alert-red/20'
              : 'border-clear-teal/40 bg-clear-teal/10 text-clear-teal hover:bg-clear-teal/20'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${playing ? 'bg-alert-red animate-pulseGlow' : 'bg-clear-teal'}`} />
          {playing ? 'Pause Stream' : 'Start Stream'}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-ledger-600 text-center">
          <p className="font-mono text-xs text-slate-400">
            press start to watch transactions flow through the pipeline in real time
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => {
            const color = BAND_COLOR[item.result.risk_band] || '#2DD4BF'
            return (
              <div
                key={`${item.transaction.TransactionID}-${i}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-ledger-700 bg-ledger-900/60 px-4 py-2.5 font-mono text-xs"
                style={i === 0 ? { animation: 'fadeSlideIn 0.4s ease' } : undefined}
              >
                <div className="flex items-center gap-3 text-slate-300">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-slate-200">{item.transaction.TransactionID}</span>
                  <span className="hidden text-slate-500 sm:inline">{item.transaction.Location}</span>
                  <span className="text-signal-amber">${Number(item.transaction.TransactionAmount).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color }}>{(item.result.fraud_probability * 100).toFixed(1)}%</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    {item.result.risk_band}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
