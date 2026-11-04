import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase, type Role } from '../lib/supabase'
import { DEFAULT_BRAIN } from '../brain/cwn'
import { SEED } from '../brain/seed'
import { scoreOpp } from '../brain/score'
import type { Brain, Opportunity, OppStatus, Scored } from '../brain/types'
import type { HaulRecord } from '../brain/rate'
import { loadGeo } from '../brain/geo'
import { parseLoads } from '../brain/loadparse'
import { ACTIVITY, COMPLIANCE, CUSTOMERS, DRIVERS, LOADS, type Activity, type Comp, type Customer, type Driver, type Load, type LoadStatus, type Outreach } from './data'

const KEY = 'cwn-portal-v1'

interface State {
  brain: Brain; opps: Opportunity[]; loads: Load[]; drivers: Driver[]; customers: Customer[]
  compliance: Comp[]; outreach: Outreach[]; activity: Activity[]; user: string | null; lastSweep: string
  inboxSeen: string[]; lastInbox: string | null
}
const fresh = (): State => ({
  brain: DEFAULT_BRAIN, opps: SEED, loads: LOADS, drivers: DRIVERS, customers: CUSTOMERS,
  compliance: COMPLIANCE, outreach: [], activity: ACTIVITY, user: null, lastSweep: new Date(Date.now() - 3600_000 * 2).toISOString(),
  inboxSeen: [], lastInbox: null,
})

// What a brand-new live company starts with: real company facts and real
// prospects, no demo loads, customers, drivers or invoices.
const cleanLive = (user: string): State => ({
  ...fresh(), opps: SEED.filter(o => !o.sample), loads: [], drivers: [], customers: [], outreach: [],
  compliance: COMPLIANCE.map(c => ({ ...c })), user, lastSweep: new Date().toISOString(),
  activity: [{ id: crypto.randomUUID(), at: new Date().toISOString(), who: 'System', text: 'Portal is live. Everything you enter now saves to your account.', kind: 'sys' }],
})

export const SLICES = ['brain', 'opps', 'loads', 'drivers', 'customers', 'compliance', 'outreach', 'activity', 'meta'] as const
type Slice = typeof SLICES[number]
const pick = (st: State, k: Slice): unknown => k === 'meta' ? { lastSweep: st.lastSweep, inboxSeen: st.inboxSeen, lastInbox: st.lastInbox } : st[k]
const apply = (st: State, k: Slice, data: unknown): State => k === 'meta' ? { ...st, ...(data as Partial<State>) } : { ...st, [k]: data }

export interface LiveSession {
  companyId: string; companyName: string; userId: string; name: string
  role: Role; email: string; title: string | null; pages: string[] | null
  /** Every company this login can open (DataIsData admins see all of them). */
  companies: { id: string; name: string }[]
  switchCompany: (id: string) => void
  signOut: () => void
}
export type SaveState = 'loading' | 'saved' | 'saving' | 'error'

function load(): State {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...fresh(), ...JSON.parse(raw) } } catch { /* storage unavailable */ }
  return fresh()
}

export type ScoredOpp = Opportunity & { s: Scored }

interface Ctx extends State {
  mode: 'demo' | 'live'
  live: LiveSession | null
  saveState: SaveState
  uploadDoc: (file: Blob, name: string) => Promise<string | null>
  scored: ScoredOpp[]
  history: HaulRecord[]
  bookLoad: (o: Opportunity, p: { rate: number; truck?: string; driver?: string }) => string
  checkInbox: () => Promise<{ messages: number; loads: number; error?: string }>
  setBrain: (b: Brain) => void
  setOppStatus: (id: string, s: OppStatus) => void
  addOpps: (o: Opportunity[]) => void
  moveLoad: (id: string, s: LoadStatus) => void
  upsertLoad: (l: Load) => void
  setDrivers: (d: Driver[]) => void
  setCustomers: (c: Customer[]) => void
  addOutreach: (o: Outreach) => void
  updateOutreach: (id: string, patch: Partial<Outreach>) => void
  log: (text: string, kind?: Activity['kind'], who?: string) => void
  setUser: (u: string | null) => void
  setCompliance: (c: Comp[]) => void
  runSweep: () => Promise<number>
  reset: () => void
}

const C = createContext<Ctx | null>(null)

export function PortalProvider({ children, live = null }: { children: ReactNode; live?: LiveSession | null }) {
  const [st, setSt] = useState<State>(() => live ? cleanLive(live.name) : load())
  const [saveState, setSaveState] = useState<SaveState>(live ? 'loading' : 'saved')
  const saved = useRef<Record<string, string>>({})
  const ready = useRef(!live)

  // ---- demo mode: this browser only ----
  useEffect(() => { if (!live) try { localStorage.setItem(KEY, JSON.stringify(st)) } catch { /* ignore */ } }, [st, live])

  // ---- live mode: load the company's data, then listen for changes from other devices ----
  useEffect(() => {
    if (!live) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('portal_state').select('key, data').eq('company_id', live.companyId)
      if (cancelled) return
      if (error) { setSaveState('error'); return }
      setSt(cur => {
        let next: State = { ...cur, user: live.name }
        for (const row of data ?? []) {
          if (!(SLICES as readonly string[]).includes(row.key)) continue
          next = apply(next, row.key as Slice, row.data)
          saved.current[row.key] = JSON.stringify(row.data)
        }
        return next
      })
      ready.current = true
      setSaveState('saved')
    })()
    const ch = supabase.channel('portal-' + live.companyId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portal_state', filter: `company_id=eq.${live.companyId}` }, payload => {
        const row = payload.new as { key: Slice; data: unknown; updated_by: string | null }
        if (!row?.key || row.updated_by === live.userId) return
        saved.current[row.key] = JSON.stringify(row.data)
        setSt(cur => apply(cur, row.key, row.data))
      })
      .subscribe()
    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [live])

  // ---- live mode: save whichever areas changed, shortly after the last edit ----
  useEffect(() => {
    if (!live || !ready.current) return
    const changed = SLICES.filter(k => JSON.stringify(pick(st, k)) !== saved.current[k])
    if (!changed.length) return
    setSaveState('saving')
    const t = setTimeout(async () => {
      const rows = changed.map(k => ({ company_id: live.companyId, key: k, data: pick(st, k), updated_by: live.userId, updated_at: new Date().toISOString() }))
      const { error } = await supabase.from('portal_state').upsert(rows, { onConflict: 'company_id,key' })
      if (error) { setSaveState('error'); return }
      rows.forEach(r => { saved.current[r.key] = JSON.stringify(r.data) })
      setSaveState('saved')
    }, 700)
    return () => clearTimeout(t)
  }, [st, live])

  const scored = useMemo(
    () => st.opps.map(o => ({ ...o, s: scoreOpp(o, st.brain) })).sort((a, b) => b.s.score - a.s.score),
    [st.opps, st.brain],
  )

  const history = useMemo<HaulRecord[]>(() => st.loads.filter(l => l.status !== 'quoted' && l.miles > 0).map(l => ({ origin: l.origin, destination: l.destination, miles: l.miles, rate: l.rate })), [st.loads])

  const log: Ctx['log'] = (text, kind = 'sys', who) =>
    setSt(s => ({ ...s, activity: [{ id: crypto.randomUUID(), at: new Date().toISOString(), who: who ?? s.user ?? 'System', text, kind }, ...s.activity].slice(0, 80) }))

  const uploadDoc: Ctx['uploadDoc'] = async (file, name) => {
    if (!live) return null
    const path = `${live.companyId}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${name.replace(/[^\w.-]+/g, '_')}`
    const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: false })
    return error ? null : path
  }

  const ctx: Ctx = {
    ...st, scored, log, history, mode: live ? 'live' : 'demo', live, saveState, uploadDoc,
    bookLoad: (o, p) => {
      const ref = 'CWN-' + String(1050 + st.loads.length).padStart(4, '0')
      const pickup = o.pickupDate ? new Date(o.pickupDate + 'T08:00:00').toISOString() : new Date().toISOString()
      const hours = Math.max(2, Math.round((o.miles ?? 100) / 50))
      const load = {
        id: 'bk-' + o.id, ref, customer: o.broker?.name || o.org, origin: o.origin, destination: o.destination ?? o.origin,
        pickup, delivery: new Date(new Date(pickup).getTime() + hours * 3600_000).toISOString(),
        pallets: o.pallets ?? 0, weight: o.weightLbs ?? 0, commodity: o.summary.split(' · ').slice(0, 2).join(' · '),
        rate: p.rate, miles: o.miles ?? 0, truck: p.truck, driver: p.driver, status: 'booked' as LoadStatus,
        liftgate: o.needsLiftgate, notes: `From Load Finder · ${o.source}${o.broker?.mc ? ` · broker MC ${o.broker.mc}` : ''}`,
      }
      setSt(s => ({ ...s, loads: [load, ...s.loads.filter(l => l.id !== load.id)], opps: s.opps.map(x => x.id === o.id ? { ...x, status: 'won' as OppStatus } : x) }))
      log(`Booked ${o.title} at $${p.rate}${p.truck ? ` on truck ${p.truck}` : ''} (${ref})`, 'load')
      return ref
    },
    checkInbox: async () => {
      try {
        const r = await fetch('/api/inbox', { cache: 'no-store' })
        if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return { messages: 0, loads: 0, error: 'Inbox not reachable from this copy of the portal' }
        const j = await r.json() as { items: { id: string; text: string; source?: string; subject?: string; from?: string }[] }
        const fresh = j.items.filter(m => !st.inboxSeen.includes(m.id))
        await loadGeo()
        const found = fresh.flatMap(m => parseLoads(`${m.subject ?? ''}\n${m.text}`, { source: m.source || 'Email', brokerName: m.from?.replace(/<.*>/, '').trim() || undefined }))
        setSt(s => ({ ...s, inboxSeen: [...s.inboxSeen, ...fresh.map(m => m.id)].slice(-1000), lastInbox: new Date().toISOString(),
          opps: [...found.filter(n => !s.opps.some(o => o.id === n.id)), ...s.opps] }))
        if (found.length) log(`Inbox: ${found.length} load${found.length === 1 ? '' : 's'} found in ${fresh.length} message${fresh.length === 1 ? '' : 's'}`, 'brain', 'Load Finder')
        return { messages: fresh.length, loads: found.length }
      } catch { return { messages: 0, loads: 0, error: 'Inbox not reachable from this copy of the portal' } }
    },
    setBrain: b => { setSt(s => ({ ...s, brain: b })) },
    setOppStatus: (id, status) => setSt(s => ({ ...s, opps: s.opps.map(o => o.id === id ? { ...o, status } : o) })),
    addOpps: list => setSt(s => ({ ...s, opps: [...list.filter(n => !s.opps.some(o => o.id === n.id)), ...s.opps] })),
    moveLoad: (id, status) => setSt(s => ({ ...s, loads: s.loads.map(l => l.id === id ? { ...l, status, pod: status === 'delivered' ? true : l.pod } : l) })),
    upsertLoad: l => setSt(s => ({ ...s, loads: s.loads.some(x => x.id === l.id) ? s.loads.map(x => x.id === l.id ? l : x) : [l, ...s.loads] })),
    setDrivers: drivers => setSt(s => ({ ...s, drivers })),
    setCustomers: customers => setSt(s => ({ ...s, customers })),
    addOutreach: o => setSt(s => ({ ...s, outreach: [o, ...s.outreach] })),
    updateOutreach: (id, patch) => setSt(s => ({ ...s, outreach: s.outreach.map(o => o.id === id ? { ...o, ...patch } : o) })),
    setUser: user => { if (live && user === null) { live.signOut(); return } setSt(s => ({ ...s, user })) },
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
    reset: () => { if (live) return; const f = fresh(); setSt({ ...f, user: st.user }) },
  }
  return <C.Provider value={ctx}>{children}</C.Provider>
}

export function usePortal() {
  const c = useContext(C)
  if (!c) throw new Error('usePortal outside provider')
  return c
}
