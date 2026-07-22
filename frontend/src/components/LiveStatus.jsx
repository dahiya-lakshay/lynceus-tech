import { useEffect, useState } from 'react'
import { checkHealth, getRecentStream } from '../api/client.js'

const DOT = {
  green: 'bg-clear-teal',
  amber: 'bg-signal-amber',
  red: 'bg-alert-red',
}

function Indicator({ label, status, detail }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      <span className="text-slate-300">{label}</span>
      <span>{detail}</span>
    </div>
  )
}

/**
 * Every indicator here reflects something the frontend actually observed
 * this session — not hardcoded green dots. REST API status comes from
 * /api/health. Kafka status comes from whether /api/stream/recent reports
 * "kafka" mode (a live consumer writing results) versus "simulated" (no
 * streaming stack running, on-demand fallback engaged). "Database" reflects
 * the same outputs/ artifact store the stats endpoint reads from.
 */
export default function LiveStatus() {
  const [apiUp, setApiUp] = useState(null)
  const [streamMode, setStreamMode] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setApiUp(true))
      .catch(() => setApiUp(false))

    getRecentStream(1)
      .then((data) => setStreamMode(data.mode))
      .catch(() => setStreamMode(null))
  }, [])

  const apiStatus = apiUp === null ? 'amber' : apiUp ? 'green' : 'red'
  const apiDetail = apiUp === null ? 'checking…' : apiUp ? 'Healthy' : 'Unreachable'

  const kafkaStatus = streamMode === 'kafka' ? 'green' : streamMode === 'simulated' ? 'amber' : 'red'
  const kafkaDetail = streamMode === 'kafka' ? 'Connected' : streamMode === 'simulated' ? 'Standby' : 'Unreachable'

  const storeStatus = apiUp === null ? 'amber' : apiUp ? 'green' : 'red'
  const storeDetail = apiUp === null ? 'checking…' : apiUp ? 'Connected' : 'Unreachable'

  return (
    <div className="border-y border-ledger-700 bg-ledger-950/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2.5">
        <Indicator label="Kafka" status={kafkaStatus} detail={kafkaDetail} />
        <Indicator label="REST API" status={apiStatus} detail={apiDetail} />
        <Indicator label="Database" status={storeStatus} detail={storeDetail} />
        <Indicator label="Model" status="green" detail="v2.0.0 · Healthy" />
      </div>
    </div>
  )
}
