import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_BRAIN } from '../brain/cwn'
import { SEED } from '../brain/seed'
import { scoreOpp } from '../brain/score'
import type { Brain, Opportunity, OppStatus, Scored } from '../brain/types'
import { ACTIVITY, COMPLIANCE, CUSTOMERS, DRIVERS, LOADS, type Activity, type Comp, type Customer, type Driver, type Load, type LoadStatus, type Outreach } from './data'

const KEY = 'cwn-portal-v1'

interface State {
  brain: Brain; opps: Opportunity[]; loads: Load[]; drivers: Driver[]; customers: Customer[]
  compliance: Comp[]; outreach: Outreach[]; activity: Activity[]; user: string | null; lastSweep: string
}
const fresh = (): State => ({
  brain: DEFAULT_BRAIN, opps: SEED, loads: LOADS, drivers: DRIVERS, customers: CUSTOMERS,
  compliance: COMPLIANCE, outreach: [], activity: ACTIVITY, user: null, lastSweep: new Date(Date.now() - 3600_000 * 2).toISOString(),
})

function load(): State {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...fresh(), ...JSON.parse(raw) } } catch { /* storage unavailable */ }
  return fresh()
}

export type ScoredOpp = Opportunity & { s: Scored }

interface Ctx extends State {
  scored: ScoredOpp[]
  setBrain: (b: Brain) => void
  setOppStatus: (id: string, s: OppStatus) => void
  addOpps: (o: Opportunity[]) => void
  moveLoad: (id: string, s: LoadStatus) => void
  upsertLoad: (l: Load) => void
  setDrivers: (d: Driver[]) => void
  addOutreach: (o: Outreach) => void
  updateOutreach: (id: string, patch: Partial<Outreach>) => void
  log: (text: string, kind?: Activity['kind'], who?: string) => void
  setUser: (u: string | null) => void
  setCompliance: (c: Comp[]) => void
  runSweep: () => Promise<number>
  reset: () => void
}

const C = createContext<Ctx | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<State>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* ignore */ } }, [st])

  const scored = useMemo(
    () => st.opps.map(o => ({ ...o, s: scoreOpp(o, st.brain) })).sort((a, b) => b.s.score - a.s.score),
    [st.opps, st.brain],
  )

  const log: Ctx['log'] = (text, kind = 'sys', who) =>
    setSt(s => ({ ...s, activity: [{ id: crypto.randomUUID(), at: new Date().toISOString(), who: who ?? s.user ?? 'System', text, kind }, ...s.activity].slice(0, 80) }))

  const ctx: Ctx = {
    ...st, scored, log,
    setBrain: b => { setSt(s => ({ ...s, brain: b })) },
    setOppStatus: (id, status) => setSt(s => ({ ...s, opps: s.opps.map(o => o.id === id ? { ...o, status } : o) })),
    addOpps: list => setSt(s => ({ ...s, opps: [...list.filter(n => !s.opps.some(o => o.id === n.id)), ...s.opps] })),
    moveLoad: (id, status) => setSt(s => ({ ...s, loads: s.loads.map(l => l.id === id ? { ...l, status, pod: status === 'delivered' ? true : l.pod } : l) })),
    upsertLoad: l => setSt(s => ({ ...s, loads: s.loads.some(x => x.id === l.id) ? s.loads.map(x => x.id === l.id ? l : x) : [l, ...s.loads] })),
    setDrivers: drivers => setSt(s => ({ ...s, drivers })),
    addOutreach: o => setSt(s => ({ ...s, outreach: [o, ...s.outreach] })),
    updateOutreach: (id, patch) => setSt(s => ({ ...s, outreach: s.outreach.map(o => o.id === id ? { ...o, ...patch } : o) })),
    setUser: user => setSt(s => ({ ...s, user })),
    setCompliance: compliance => setSt(s => ({ ...s, compliance })),
    runSweep: async () => {
      // Pulls the latest sweep file produced by scripts/sweep.mjs (SAM.gov API etc.)
      let added = 0
      for (const url of ['/api/opps', `${import.meta.env.BASE_URL}data/sweep.json`]) {
        try {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) continue
          const j = await r.json() as { generated: string | null; items: Opportunity[] }
          setSt(s => {
            const nu = j.items.filter(n => !s.opps.some(o => o.id === n.id))
            added = nu.length
            return { ...s, opps: [...nu, ...s.opps] }
          })
          break
        } catch { /* try next source */ }
      }
      await new Promise(r => setTimeout(r, 1400))
      setSt(s => ({ ...s, lastSweep: new Date().toISOString() }))
      return added
    },
    reset: () => { const f = fresh(); setSt({ ...f, user: st.user }) },
  }
  return <C.Provider value={ctx}>{children}</C.Provider>
}

export function usePortal() {
  const c = useContext(C)
  if (!c) throw new Error('usePortal outside provider')
  return c
}
