import { useEffect, useState } from 'react'

const BANDS = [
  { key: 'low', label: 'Low', color: '#2DD4BF', from: 0, to: 0.25 },
  { key: 'medium', label: 'Medium', color: '#F5A623', from: 0.25, to: 0.5 },
  { key: 'high', label: 'High', color: '#F59E0B', from: 0.5, to: 0.75 },
  { key: 'critical', label: 'Critical', color: '#EF4444', from: 0.75, to: 1 },
]

/**
 * Semi-circular risk gauge.
 *
 * Pass `score` (0-100, an already-blended business risk score — see
 * utils/risk.js) for the normal in-use state. The idle placeholder state
 * (no transaction scored yet) passes neither prop and just renders the
 * empty gauge.
 */
export default function RiskGauge({ score = null, size = 260 }) {
  const [displayed, setDisplayed] = useState(0)

  const target = score === null ? null : score / 100

  useEffect(() => {
    if (target === null) return
    let frame
    const start = displayed
    const duration = 700
    const t0 = performance.now()
    const step = (t) => {
      const progress = Math.min((t - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(start + (target - start) * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score])

  const value = target === null ? 0 : displayed
  const angle = -90 + value * 180
  const activeColor = BANDS.find((b) => value >= b.from && value <= b.to)?.color || '#2DD4BF'

  const cx = size / 2
  const cy = size / 2 + 6
  const r = size / 2 - 24

  const polarToCartesian = (angleDeg, radius) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const arcPath = (fromDeg, toDeg, radius) => {
    const start = polarToCartesian(fromDeg, radius)
    const end = polarToCartesian(toDeg, radius)
    const largeArc = toDeg - fromDeg <= 180 ? 0 : 1
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`
  }

  const needleEnd = polarToCartesian(angle, r - 14)

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={size} height={size / 2 + 40} viewBox={`0 0 ${size} ${size / 2 + 40}`}>
        {BANDS.map((band) => (
          <path
            key={band.key}
            d={arcPath(-90 + band.from * 180, -90 + band.to * 180, r)}
            stroke={band.color}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
            opacity={target === null ? 0.25 : value >= band.from && value <= band.to ? 1 : 0.28}
            style={{ transition: 'opacity 0.4s ease' }}
          />
        ))}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={target === null ? '#3C4863' : activeColor}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.4s ease' }}
        />
        <circle cx={cx} cy={cy} r={7} fill={target === null ? '#3C4863' : activeColor} />
        <circle cx={cx} cy={cy} r={11} fill="none" stroke={target === null ? '#3C4863' : activeColor} strokeWidth={1.5} opacity={0.5} />
      </svg>

      <div className="-mt-2 text-center">
        <div
          className="font-mono text-4xl font-semibold tracking-tight"
          style={{ color: target === null ? '#8B95AB' : activeColor }}
        >
          {target === null ? '—' : `${Math.round(value * 100)} / 100`}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400 font-mono">
          {target === null ? 'awaiting transaction' : 'overall risk score'}
        </div>
      </div>
    </div>
  )
}
