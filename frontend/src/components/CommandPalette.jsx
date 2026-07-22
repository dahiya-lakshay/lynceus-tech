import { useEffect, useState } from 'react'

const COMMANDS = [
  { id: 'live-check', label: 'Go to Live Check', hint: 'score a transaction' },
  { id: 'live-feed', label: 'Go to Live Feed', hint: 'watch the stream' },
  { id: 'risk-overview', label: 'Go to Risk Overview', hint: 'model metrics' },
  { id: 'transparency', label: 'Go to Model Transparency', hint: 'how it works' },
  { id: 'architecture', label: 'Go to System Architecture', hint: 'Kafka + services' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = COMMANDS.filter((c) =>
    (c.label + c.hint).toLowerCase().includes(query.toLowerCase())
  )

  const go = (id) => {
    setOpen(false)
    setQuery('')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-ledger-600 bg-ledger-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to a section…"
          className="w-full border-b border-ledger-600 bg-transparent px-4 py-3.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500"
        />
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-center font-mono text-xs text-slate-500">no matches</div>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => go(c.id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition hover:bg-ledger-700"
            >
              <span className="font-mono text-sm text-slate-100">{c.label}</span>
              <span className="font-mono text-[11px] text-slate-500">{c.hint}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-ledger-700 px-4 py-2 font-mono text-[10px] text-slate-500">
          <span>↵ to jump</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  )
}
