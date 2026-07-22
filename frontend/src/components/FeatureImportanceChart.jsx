import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function FeatureImportanceChart({ data = [] }) {
  const chartData = [...data].slice(0, 10).reverse().map((d) => ({
    feature: d.feature,
    importance: Number(d.importance.toFixed(4)),
  }))

  return (
    <div className="rounded-xl border border-ledger-600 bg-ledger-800/40 p-6">
      <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">
        What the classifier weighs most
      </h4>
      <p className="mb-4 font-mono text-[11px] text-slate-400">
        Random Forest global feature importance, top 10
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" tick={{ fill: '#8B95AB', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            dataKey="feature"
            type="category"
            width={150}
            tick={{ fill: '#8B95AB', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #293246', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#F4F6FA' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="importance" fill="#F5A623" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
