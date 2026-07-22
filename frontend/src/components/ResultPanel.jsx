import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts'
import RiskGauge from './RiskGauge.jsx'
import RuleFlags from './RuleFlags.jsx'
import { computeBusinessRiskScore, decisionStatus, highRiskMerchantFlag } from '../utils/risk.js'

const TONE_COLOR = {
  teal: '#2DD4BF',
  amber: '#F5A623',
  red: '#EF4444',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-md border border-ledger-600 bg-ledger-900 px-3 py-2 font-mono text-xs shadow-xl">
      <div className="text-slate-200">{item.feature}</div>
      <div className={item.shap_value > 0 ? 'text-signal-amber' : 'text-clear-teal'}>
        {item.shap_value > 0 ? 'pushed risk up' : 'pushed risk down'} &middot; {item.magnitude.toFixed(3)}
      </div>
    </div>
  )
}

export default function ResultPanel({ result, submittedTransaction, error, loading }) {
  const [flash, setFlash] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!result) return
    setFlash(true)
    setShowDetails(false)
    const t = setTimeout(() => setFlash(false), 900)
    return () => clearTimeout(t)
  }, [result])

  if (loading) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-ledger-600 bg-ledger-800/40 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ledger-600 border-t-signal-amber" />
        <p className="mt-4 font-mono text-xs text-slate-400">running inference pipeline…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-alert-red/40 bg-alert-red/5 p-6 text-center">
        <p className="font-mono text-sm text-alert-red">Could not score this transaction</p>
        <p className="mt-2 max-w-xs text-xs text-slate-400">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-ledger-600 bg-ledger-800/20 p-6 text-center">
        <h3 className="mb-6 font-display text-lg font-semibold text-slate-50">Fraud Assessment</h3>
        <RiskGauge score={null} />
        <p className="mt-4 max-w-xs font-mono text-xs text-slate-400">
          fill in the form and score a transaction to see the assessment here
        </p>
      </div>
    )
  }

  const extraFlags = []
  const merchantFlag = highRiskMerchantFlag(submittedTransaction?.MerchantCategory)
  if (merchantFlag) extraFlags.push(merchantFlag)

  const riskScore = computeBusinessRiskScore(result, extraFlags)
  const status = decisionStatus(result)
  const color = TONE_COLOR[status.tone]
  const allFlags = [...result.rule_flags, ...extraFlags]

  const chartData = [...result.explanation].reverse()

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-ledger-600 bg-ledger-800/40 p-6 transition-shadow duration-700"
      style={{
        boxShadow: flash ? `0 0 0 1px ${color}55, 0 0 60px -5px ${color}66` : 'none',
      }}
    >
      <h3 className="mb-5 font-display text-lg font-semibold text-slate-50">Fraud Assessment</h3>

      <div className="flex flex-col items-center border-b border-ledger-700 pb-6">
        <RiskGauge score={riskScore} />
        <div
          className="mt-4 rounded-full px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${color}1A`, color }}
        >
          {status.label}
        </div>
      </div>

      <div className="border-b border-ledger-700 py-6">
        <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">Risk Factors</h4>
        <p className="mb-3 font-mono text-[11px] text-slate-400">
          Deterministic checks that run independently of the risk score above
        </p>
        <RuleFlags flags={allFlags} />
      </div>

      <div className="border-b border-ledger-700 py-6">
        <h4 className="mb-1 font-display text-sm font-semibold text-slate-50">Key Decision Drivers</h4>
        <p className="mb-4 font-mono text-[11px] text-slate-400">
          Top features influencing this assessment
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              dataKey="feature"
              type="category"
              width={150}
              tick={{ fill: '#8B95AB', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine x={0} stroke="#293246" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="shap_value" radius={[3, 3, 3, 3]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.shap_value > 0 ? '#F5A623' : '#2DD4BF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-4">
        <button
          onClick={() => setShowDetails((s) => !s)}
          className="flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-wide text-slate-500 transition hover:text-slate-300"
        >
          <span>Technical details</span>
          <span>{showDetails ? '−' : '+'}</span>
        </button>
        {showDetails && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-md border border-ledger-700 bg-ledger-900/50 p-4 font-mono text-[11px] text-slate-400 sm:grid-cols-4">
            <div>
              <div className="text-slate-500">Model probability</div>
              <div className="mt-0.5 text-slate-200">{(result.fraud_probability * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-slate-500">Anomaly score</div>
              <div className="mt-0.5 text-slate-200">{result.anomaly_score}</div>
            </div>
            <div>
              <div className="text-slate-500">Decision threshold</div>
              <div className="mt-0.5 text-slate-200">{result.decision_threshold.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-slate-500">Winning model</div>
              <div className="mt-0.5 text-slate-200">{result.model_used.replace(/_/g, ' ')}</div>
            </div>
            {result.confidence !== null && result.confidence !== undefined && (
              <div>
                <div className="text-slate-500">Tree agreement</div>
                <div className="mt-0.5 text-slate-200">{(result.confidence * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
