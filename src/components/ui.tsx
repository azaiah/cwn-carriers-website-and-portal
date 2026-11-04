import { Handshake, Landmark, Target, Truck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'

export const usd = (n: number, d = 0) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
export const shortDate = (s?: string) => s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'
export const timeOf = (s: string) => new Date(s).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
export const daysUntil = (s?: string) => s ? Math.ceil((new Date(s).getTime() - Date.now()) / 86400000) : null
export const ago = (s: string) => {
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000)
  if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.round(m / 60); if (h < 24) return `${h}h ago`; return `${Math.round(h / 24)}d ago`
}

/** One label everywhere for what kind of opportunity something is. */
export const KIND_META = {
  load: { label: 'Load', plural: 'Loads', icon: Truck, cls: 'bg-signal-blue/15 text-signal-blue ring-signal-blue/40', hint: 'A freight load to haul now (broker, marketplace or shipper)' },
  lead: { label: 'Lead', plural: 'Leads', icon: Target, cls: 'bg-signal-green/15 text-signal-green ring-signal-green/40', hint: 'A company that could become a regular customer' },
  bid: { label: 'Bid', plural: 'Bids', icon: Landmark, cls: 'bg-signal-amber/15 text-signal-amber ring-signal-amber/40', hint: 'A government or company contract you submit a bid for' },
  partner: { label: 'Partner', plural: 'Partners', icon: Handshake, cls: 'bg-white/10 text-ivory ring-white/25', hint: 'A program or company that sends you work (Amazon Relay, CEVA, couriers)' },
} as const
export type KindKey = keyof typeof KIND_META

export function KindBadge({ kind, size = 'sm' }: { kind: KindKey; size?: 'sm' | 'md' }) {
  const m = KIND_META[kind]
  return <span title={m.hint} className={`chip ring-1 ${m.cls} ${size === 'md' ? 'h-7 px-2.5 text-[12px]' : ''}`}><m.icon size={size === 'md' ? 13 : 11} />{m.label}</span>
}

export function Verdict({ v, score }: { v: 'Go' | 'Maybe' | 'Pass'; score?: number }) {
  const map = { Go: 'bg-signal-green/15 text-signal-green ring-signal-green/40', Maybe: 'bg-signal-amber/15 text-signal-amber ring-signal-amber/40', Pass: 'bg-white/5 text-graphite-300 ring-white/15' }
  return <span className={`chip ring-1 ${map[v]}`}>{v}{score !== undefined && <b className="font-bold">{score}</b>}</span>
}

export function ScoreRing({ score, size = 52, v }: { score: number; size?: number; v: 'Go' | 'Maybe' | 'Pass' }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r
  const col = v === 'Go' ? '#2FB36E' : v === 'Maybe' ? '#E3A72F' : '#6E737B'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#2E333A" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth="4" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display font-extrabold text-[17px]">{score}</span>
    </div>
  )
}

export function PageHead({ eyebrow, title, sub, right }: { eyebrow: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <div className="eyebrow mb-1.5">{eyebrow}</div>
        <h1 className="h-display text-[34px] md:text-[40px]">{title}</h1>
        {sub && <p className="text-graphite-300 mt-1 max-w-2xl">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Stat({ label, value, hint, accent, icon }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean; icon?: ReactNode }) {
  return (
    <div className={`plate tex-grain p-4 relative overflow-hidden ${accent ? 'ring-1 ring-crimson/50' : ''}`}>
      {accent && <div className="absolute -right-6 -top-10 w-24 h-28 bg-crimson/20 rotate-[24deg]" />}
      <div className="flex items-center justify-between text-graphite-300">
        <span className="font-mono text-[10.5px] uppercase tracking-[.18em]">{label}</span>{icon}
      </div>
      <div className="font-display font-extrabold text-[34px] leading-none mt-2.5">{value}</div>
      {hint && <div className="text-[13px] text-graphite-300 mt-1.5">{hint}</div>}
    </div>
  )
}

export function Panel({ title, right, children, className = '', pad = true }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`plate ${className}`}>
      {title && <header className="flex items-center justify-between gap-3 px-4 h-12 border-b border-white/[.06]">
        <h3 className="font-display font-bold uppercase tracking-[.06em] text-[15px]">{title}</h3>{right}
      </header>}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

export function Drawer({ open, onClose, children, title, wide }: { open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && <>
        <motion.div className="fixed inset-0 bg-black/60 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.aside className={`fixed right-0 top-0 bottom-0 z-50 w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} bg-onyx-850 border-l border-white/10 overflow-y-auto`}
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 bg-onyx-850/95 backdrop-blur border-b border-white/10">
            <div className="font-display font-bold uppercase tracking-wider text-[15px] truncate">{title}</div>
            <button onClick={onClose} className="p-2 hover:bg-white/10" aria-label="Close"><X size={18} /></button>
          </div>
          <div className="p-5">{children}</div>
        </motion.aside>
      </>}
    </AnimatePresence>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-graphite-300 py-10 text-sm">{children}</div>
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center justify-between w-full gap-3 py-2 text-left">
      <span className="text-[14px]">{label}</span>
      <span className={`w-10 h-[22px] rounded-full relative transition ${on ? 'bg-crimson' : 'bg-onyx-600'}`}><span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[21px]' : 'left-[3px]'}`} /></span>
    </button>
  )
}
