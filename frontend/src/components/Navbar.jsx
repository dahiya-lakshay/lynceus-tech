function LynceusMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C2 12 6 5 12 5C18 5 22 12 22 12C22 12 18 19 12 19C6 19 2 12 2 12Z"
        stroke="#F5A623"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" fill="#F5A623" />
      <circle cx="12" cy="12" r="5.5" stroke="#F5A623" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  )
}

export default function Navbar() {
  const links = [
    { href: '#live-check', label: 'Live Check' },
    { href: '#live-feed', label: 'Live Feed' },
    { href: '#risk-overview', label: 'Risk Overview' },
    { href: '#transparency', label: 'Transparency' },
    { href: '#architecture', label: 'Architecture' },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-ledger-600 bg-ledger-900/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-signal-amber/10 ring-1 ring-signal-amber/40">
            <LynceusMark />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-slate-50">
            Lynceus
          </span>
        </div>

        <nav className="hidden gap-7 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-[0.15em] text-slate-400 transition hover:text-slate-50"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-ledger-600 px-3 py-1.5 font-mono text-[11px] text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-clear-teal" />
            engine online
          </div>
          <kbd className="hidden rounded-md border border-ledger-600 px-2 py-1 font-mono text-[10px] text-slate-500 md:block">
            ⌘K
          </kbd>
        </div>
      </div>
    </header>
  )
}
