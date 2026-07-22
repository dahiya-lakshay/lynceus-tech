import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceDot } from 'recharts'

export default function PrecisionRecallChart({ data = [], selectedThreshold }) {
  const chartData = data.map((d) => ({
    threshold: d.threshold,
    precision: Number(d.precision.toFixed(4)),
    recall: Number(d.recall.toFixed(4)),
  }))

  const closest = chartData.reduce((best, point) => {
    if (!best) return point
    return Math.abs(point.threshold - selectedThreshold) < Math.abs(best.threshold - selectedThreshold)
      ? point
      : best
  }, null)

  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-6">
      <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">
        Precision / recall vs. decision threshold
      </h4>
      <p className="mb-4 font-mono text-[11px] text-slate-400">
        The marked point is the F1-optimized threshold actually used in production
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <XAxis
            dataKey="threshold"
            tick={{ fill: '#8B95AB', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis tick={{ fill: '#8B95AB', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 1]} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #293246', borderRadius: 6, fontSize: 12 }}
            labelFormatter={(v) => `threshold ${Number(v).toFixed(4)}`}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
          <Line type="monotone" dataKey="precision" stroke="#F5A623" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="recall" stroke="#2DD4BF" dot={false} strokeWidth={2} />
          {closest && (
            <ReferenceDot x={closest.threshold} y={closest.precision} r={5} fill="#F4F6FA" stroke="none" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
