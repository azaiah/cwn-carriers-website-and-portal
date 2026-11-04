import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, Brain, Eye, HelpCircle, MessageSquare, ShieldCheck, CalendarRange, Kanban, PackageSearch, ClipboardCheck, FileText, Gauge, LogOut, Menu, Radar, RotateCcw, Send, Smartphone, Truck, Users, Wallet, X } from 'lucide-react'
import { Logo } from '../components/Logo'
import { PortalProvider, usePortal, type LiveSession } from './store'
import { Login, NoAccess } from './Login'
import { supabase, myAccess, type Access } from '../lib/supabase'
import { CommsProvider, useComms } from './comms'
import { ROLE_LABEL } from './perms'
import Messages from './pages/Messages'
import TeamPage from './Team'
import { PLACES } from '../brain/cwn'
import { miles } from '../brain/score'
import type { Opportunity } from '../brain/types'
import Command from './pages/Command'
import Dispatch from './pages/Dispatch'
import Opportunities from './pages/Opportunities'
import LoadFinder from './pages/LoadFinder'
import Pipeline from './pages/Pipeline'
import BrainPage from './pages/BrainPage'
import Outreach from './pages/Outreach'
import Fleet from './pages/Fleet'
import Customers from './pages/Customers'
import Money from './pages/Money'
import Compliance from './pages/Compliance'
import Documents from './pages/Documents'
import Briefing from './pages/Briefing'
import DriverApp from './pages/DriverApp'
import { GuideCard, useGuide } from './Guide'

export const NAV = [
  { to: '', label: 'Command', icon: Gauge },
  { to: 'messages', label: 'Messages', icon: MessageSquare, badge: 'msgs' as const },
  { to: 'loads', label: 'Load Finder', icon: PackageSearch, badge: 'load' as const },
  { to: 'opportunities', label: 'Bids & Leads', icon: Radar, badge: 'other' as const },
  { to: 'pipeline', label: 'Pipeline', icon: Kanban },
  { to: 'dispatch', label: 'Dispatch', icon: Truck },
  { to: 'brain', label: 'Company Brain', icon: Brain },
  { to: 'outreach', label: 'Outreach', icon: Send },
  { to: 'briefing', label: 'Weekly Briefing', icon: CalendarRange },
  { to: 'fleet', label: 'Fleet & Drivers', icon: Users },
  { to: 'customers', label: 'Customers', icon: BarChart3 },
  { to: 'money', label: 'Money', icon: Wallet },
  { to: 'compliance', label: 'Compliance', icon: ClipboardCheck },
  { to: 'documents', label: 'Documents', icon: FileText },
  { to: 'driver', label: 'Driver app', icon: Smartphone },
  { to: 'team', label: 'Team & Access', icon: ShieldCheck },
]

type Phase = { k: 'checking' } | { k: 'login'; notice?: string } | { k: 'recovery' } | { k: 'demo' } | { k: 'noaccess'; email: string } | { k: 'live'; s: LiveSession }

export default function Portal() {
  const [phase, setPhase] = useState<Phase>(() => {
    try { if (localStorage.getItem('cwn-mode') === 'demo') return { k: 'demo' } } catch { /* ignore */ }
    return { k: 'checking' }
  })

  useEffect(() => {
    const signOut = async () => { await supabase.auth.signOut(); setPhase({ k: 'login' }) }
    const open = (list: Access[], userId: string, email: string, companyId?: string) => {
      let want = companyId
      try { want = want ?? localStorage.getItem('cwn-company') ?? undefined } catch { /* ignore */ }
      const a = list.find(x => x.company_id === want) ?? list[0]
      try { localStorage.setItem('cwn-company', a.company_id) } catch { /* ignore */ }
      setPhase({ k: 'live', s: {
        companyId: a.company_id, companyName: a.company_name, userId, email, role: a.role, title: a.title, pages: a.pages,
        name: a.display_name || email.split('@')[0], companies: list.map(x => ({ id: x.company_id, name: x.company_name })),
        switchCompany: id => open(list, userId, email, id), signOut,
      } })
    }
    const enter = async (userId: string, email: string) => {
      try {
        const list = await myAccess()
        if (!list.length) { setPhase({ k: 'noaccess', email }); return }
        open(list, userId, email)
      } catch { setPhase({ k: 'login', notice: 'Couldn\'t reach the database. Check your connection and try again.' }) }
    }
    supabase.auth.getSession().then(({ data }) => {
      setPhase(p => {
        if (p.k === 'demo') return p
        if (data.session) { enter(data.session.user.id, data.session.user.email ?? ''); return p }
        return { k: 'login' }
      })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setPhase({ k: 'recovery' }); return }
      if (event === 'SIGNED_IN' && session) setPhase(p => { if (p.k !== 'live' && p.k !== 'demo') enter(session.user.id, session.user.email ?? ''); return p })
      if (event === 'SIGNED_OUT') setPhase(p => p.k === 'demo' ? p : { k: 'login' })
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const toDemo = () => { try { localStorage.setItem('cwn-mode', 'demo') } catch { /* ignore */ } setPhase({ k: 'demo' }) }
  const exitDemo = () => { try { localStorage.removeItem('cwn-mode') } catch { /* ignore */ } setPhase({ k: 'login' }) }

  if (phase.k === 'checking') return <div className="min-h-screen tex-asphalt grid place-items-center text-graphite-300 font-mono text-[12px] uppercase tracking-[.2em]">Loading…</div>
  if (phase.k === 'login') return <Login onDemo={toDemo} notice={phase.notice} />
  if (phase.k === 'recovery') return <Login onDemo={toDemo} recovery />
  if (phase.k === 'noaccess') return <NoAccess email={phase.email} onSignOut={async () => { await supabase.auth.signOut(); setPhase({ k: 'login' }) }} />
  if (phase.k === 'live') return <PortalProvider key={phase.s.userId + phase.s.companyId} live={phase.s}><CommsProvider><Shell /></CommsProvider></PortalProvider>
  return <PortalProvider><CommsProvider><Shell onExitDemo={exitDemo} /></CommsProvider></PortalProvider>
}

function Gate({ onExitDemo }: { onExitDemo?: () => void }) {
  const { setUser, log } = usePortal()
  const roles = [
    { u: 'Lawrence', r: 'Owner', d: 'Everything: dispatch, money, the Company Brain' },
    { u: 'Dispatch', r: 'Dispatcher', d: 'Loads, drivers, bids and outreach' },
    { u: 'Driver A', r: 'Driver', d: 'Today’s loads, BOL and POD capture' },
  ]
  return (
    <div className="min-h-screen tex-asphalt relative overflow-hidden grid place-items-center p-4">
      <img src={`${import.meta.env.BASE_URL}assets/photos/route-night.webp`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-br from-onyx/90 via-onyx/60 to-onyx/30" />
      <div className="relative w-full max-w-lg bg-onyx-850/95 ring-1 ring-white/10 shadow-[0_40px_100px_-30px_#000] tex-grain">
        <div className="p-8 border-b border-white/10">
          <Logo className="h-12 w-auto" />
          <div className="eyebrow mt-7">Operations portal</div>
          <h1 className="h-display text-[40px] mt-1">Who's driving today?</h1>
          <p className="text-graphite-300 text-sm mt-1">Demo with sample data. Nothing here is saved to an account.</p>
        </div>
        <div className="p-4 grid gap-2">
          {roles.map(x => (
            <button key={x.u} onClick={() => { setUser(x.u); log(`${x.u} signed in`, 'sys', x.u) }} className="group flex items-center gap-4 p-4 text-left bg-white/[.03] hover:bg-crimson/15 ring-1 ring-white/5 hover:ring-crimson/60 transition">
              <div className="w-12 h-12 grid place-items-center bg-onyx-700 group-hover:bg-crimson -skew-x-[10deg] font-display font-extrabold text-[20px] transition"><span className="skew-x-[10deg]">{x.u[0]}</span></div>
              <div className="flex-1"><div className="font-display font-bold uppercase text-[19px] tracking-wide">{x.u} <span className="text-graphite-400 text-[14px]">· {x.r}</span></div><div className="text-[13.5px] text-graphite-300">{x.d}</div></div>
            </button>
          ))}
        </div>
        <div className="px-8 py-4 border-t border-white/10 flex justify-between text-[12px] font-mono uppercase tracking-[.14em] text-graphite-400"><Link to="/" className="hover:text-white">← Website</Link>{onExitDemo ? <button onClick={onExitDemo} className="hover:text-white">Real sign-in →</button> : <span>USDOT 4444839</span>}</div>
      </div>
    </div>
  )
}

function useInboundQuotes() {
  const { addOpps, log } = usePortal()
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('cwn-inbound') ?? '[]') as Record<string, string>[]
      const seen = new Set(JSON.parse(localStorage.getItem('cwn-inbound-seen') ?? '[]'))
      const find = (s: string) => Object.values(PLACES).find(p => `${p.city}, ${p.state}`.toLowerCase() === (s ?? '').trim().toLowerCase() || p.city.toLowerCase() === (s ?? '').trim().toLowerCase())
      const list: Opportunity[] = raw.filter(q => q.form === 'quote' && !seen.has(q.at)).map(q => {
        const o = find(q.origin) ?? PLACES.chesterfield, dst = find(q.destination)
        const m = dst ? miles(o, dst) : 120
        return {
          id: 'W-' + q.at, kind: 'load', sample: false, status: 'new', title: `${q.pallets} pallets ${q.commodity}`.trim(), org: q.company || q.name,
          source: 'Website quote form', origin: o, destination: dst, equipment: 'box26', needsCDL: false, hazmat: false,
          needsLiftgate: q.liftgate !== 'No', estValue: Math.round(Math.max(350, m * 2.9)), valueBasis: 'per-load', miles: m,
          recurrence: q.frequency === 'One time' ? 'one-time' : q.frequency === 'Weekly' ? 'weekly' : 'daily',
          postedDate: q.at, dueDate: q.date || undefined, contact: [q.name, q.email, q.phone].filter(Boolean).join(' · '),
          summary: `${q.service} · ${q.origin} → ${q.destination} · ${q.weight || '?'} lbs · ${q.notes || 'no notes'}`, tags: ['Inbound', 'Website'],
        }
      })
      if (list.length) {
        addOpps(list)
        list.forEach(l => log(`New website quote request: ${l.title} from ${l.org}`, 'load', 'Website'))
        localStorage.setItem('cwn-inbound-seen', JSON.stringify([...seen, ...raw.map(r => r.at)]))
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function Shell({ onExitDemo }: { onExitDemo?: () => void }) {
  const { user, setUser, scored, reset, mode, live, saveState } = usePortal()
  const { me, viewing, viewAs, setViewAs, canViewAs, people, pages, totalUnread } = useComms()
  const [open, setOpen] = useState(false)
  const [armReset, setArmReset] = useState(false)
  const [guideOn, setGuideOn] = useGuide()
  const loc = useLocation()
  useInboundQuotes()
  useEffect(() => setOpen(false), [loc.pathname])
  if (!user) return <Gate onExitDemo={onExitDemo} />
  if (viewing.role === 'driver') return <>
    {viewAs && <ViewBanner top name={viewAs.name} role={viewAs.title || ROLE_LABEL[viewAs.role]} onExit={() => setViewAs(null)} />}
    <DriverApp standalone asName={viewing.name} onExit={viewAs ? () => setViewAs(null) : undefined} />
  </>
  const nav = NAV.filter(n => pages.includes(n.to))
  const home = nav[0]?.to ?? 'messages'
  const badgeOf = (b?: 'load' | 'other' | 'msgs') => b === 'load' ? goLoads : b === 'other' ? goOther : b === 'msgs' ? totalUnread : 0
  const goLoads = scored.filter(o => o.kind === 'load' && o.s.verdict === 'Go' && o.status === 'new').length
  const goOther = scored.filter(o => o.kind !== 'load' && o.s.verdict === 'Go' && o.status === 'new').length

  const side = (
    <div className="flex flex-col h-full">
      <div className="px-5 h-[72px] flex items-center border-b border-white/[.06]"><Link to="/portal"><Logo className="h-10 w-auto" /></Link></div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map(n => (
          <NavLink key={n.to} end={n.to === ''} to={`/portal/${n.to}`} className={({ isActive }) => `relative flex items-center gap-3 px-3 h-10 text-[14.5px] font-medium transition ${isActive ? 'bg-crimson/15 text-white' : 'text-graphite-200 hover:bg-white/5 hover:text-white'}`}>
            {({ isActive }) => <>
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-crimson" />}
              <n.icon size={18} className={isActive ? 'text-crimson-400' : 'text-graphite-400'} />
              <span className="flex-1">{n.label}</span>
              {badgeOf(n.badge) > 0 && <span className="chip bg-crimson text-white h-5 px-1.5">{badgeOf(n.badge)}</span>}
            </>}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/[.06] space-y-3">
        {live && live.companies.length > 1 && <label className="block"><span className="label">Company</span><select className="input h-9 text-[13.5px]" value={live.companyId} onChange={e => live.switchCompany(e.target.value)}>{live.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 grid place-items-center bg-crimson -skew-x-[10deg] font-display font-extrabold"><span className="skew-x-[10deg]">{user[0]}</span></div>
          <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{user}</div><div className="text-[12px] text-graphite-400 truncate">{me.title || ROLE_LABEL[me.role]}{live ? ` · ${live.companyName}` : ''}</div></div>
          <button onClick={() => setUser(null)} className="p-2 hover:bg-white/10 text-graphite-300" title={live ? 'Sign out' : 'Switch demo user'}><LogOut size={16} /></button>
        </div>
        {mode === 'demo' && <button onClick={() => { if (armReset) { reset(); setArmReset(false) } else { setArmReset(true); setTimeout(() => setArmReset(false), 4000) } }} className={`w-full flex items-center justify-center gap-2 text-[12px] font-mono uppercase tracking-[.14em] py-1 ${armReset ? 'text-crimson-400' : 'text-graphite-400 hover:text-white'}`}><RotateCcw size={12} /> {armReset ? 'Click again to reset' : 'Reset demo'}</button>}
        <a href="https://dataisdata.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-[11.5px] text-graphite-400 hover:text-white">Powered by <img src={`${import.meta.env.BASE_URL}assets/dataisdata-icon.png`} alt="" width={13} height={13} className="h-3.5 w-auto" /><span className="font-semibold text-graphite-200">DataIsData</span></a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-onyx text-ivory flex">
      <aside className="hidden lg:block w-[248px] shrink-0 bg-onyx-850 border-r border-white/[.06] fixed inset-y-0 left-0 z-30">{side}</aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} /><aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-onyx-850">{side}</aside></div>}
      <div className="flex-1 lg:ml-[248px] min-w-0">
        <header className="sticky top-0 z-20 h-14 bg-onyx/90 backdrop-blur border-b border-white/[.06] flex items-center gap-3 px-4 md:px-6">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setOpen(true)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
          <span className="font-mono text-[11px] uppercase tracking-[.18em] text-graphite-400 hidden sm:block">CWN Ops · {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <div className="ml-auto flex items-center gap-3">
            {canViewAs && people.length > 1 && <label className="hidden md:flex items-center gap-2 h-8 px-2 ring-1 ring-white/15 text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300" title="See the portal exactly the way this person sees it">
              <Eye size={14} /> View as
              <select value={viewAs?.id ?? ''} onChange={e => setViewAs(people.find(p => p.id === e.target.value) ?? null)} className="bg-transparent text-white normal-case tracking-normal font-sans text-[13px] outline-none max-w-[150px]">
                <option value="" className="bg-onyx">Me</option>
                {people.filter(p => p.id !== me.id && (p.role !== 'platform' || me.role === 'platform')).map(p => <option key={p.id} value={p.id} className="bg-onyx">{p.name} · {p.title || ROLE_LABEL[p.role]}</option>)}
              </select>
            </label>}
            <button onClick={() => setGuideOn(!guideOn)} aria-pressed={guideOn} className={`flex items-center gap-2 h-8 px-3 text-[12px] font-mono uppercase tracking-[.14em] ring-1 transition ${guideOn ? 'bg-crimson/15 ring-crimson/50 text-white' : 'ring-white/15 text-graphite-300 hover:text-white'}`}>
              <HelpCircle size={14} /> Guide {guideOn ? 'on' : 'off'}
            </button>
            {mode === 'demo'
              ? <span className="hidden sm:inline-flex chip bg-signal-amber/15 text-signal-amber ring-1 ring-signal-amber/30" title="Operational records (loads, customers, invoices) are demo data. Company facts and prospects are real.">Demo data</span>
              : <span className={`inline-flex chip ring-1 ${saveState === 'error' ? 'bg-crimson/15 text-crimson-400 ring-crimson/40' : saveState === 'saving' || saveState === 'loading' ? 'bg-signal-amber/15 text-signal-amber ring-signal-amber/30' : 'bg-signal-green/15 text-signal-green ring-signal-green/30'}`} title="Everything you enter saves to your company account and shows up on every device">{saveState === 'error' ? 'Not saved: check connection' : saveState === 'saving' ? 'Saving…' : saveState === 'loading' ? 'Loading…' : 'Live · Saved'}</span>}
            <span className="hidden sm:flex items-center gap-2 text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300"><span className="w-2 h-2 rounded-full bg-signal-green animate-pulseDot" /> Fleet active</span>
          </div>
        </header>
        {viewAs && <ViewBanner name={viewAs.name} role={viewAs.title || ROLE_LABEL[viewAs.role]} onExit={() => setViewAs(null)} />}
        <main className="p-4 md:p-6 lg:p-8 max-w-[1500px]">
          <Routes>
            {pages.includes('') ? <Route index element={<Command />} /> : <Route index element={<Navigate to={`/portal/${home}`} replace />} />}
            <Route path="messages" element={<Messages />} />
            <Route path="team" element={pages.includes('team') ? <TeamPage /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="dispatch" element={pages.includes('dispatch') ? <Dispatch /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="opportunities" element={pages.includes('opportunities') ? <Opportunities /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="loads" element={pages.includes('loads') ? <LoadFinder /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="pipeline" element={pages.includes('pipeline') ? <Pipeline /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="brain" element={pages.includes('brain') ? <BrainPage /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="outreach" element={pages.includes('outreach') ? <Outreach /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="briefing" element={pages.includes('briefing') ? <Briefing /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="fleet" element={pages.includes('fleet') ? <Fleet /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="customers" element={pages.includes('customers') ? <Customers /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="money" element={pages.includes('money') ? <Money /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="compliance" element={pages.includes('compliance') ? <Compliance /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="documents" element={pages.includes('documents') ? <Documents /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="driver" element={pages.includes('driver') ? <DriverApp /> : <Navigate to={`/portal/${home}`} replace />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
        {guideOn && <GuideCard onClose={() => setGuideOn(false)} />}
      </div>
    </div>
  )
}

function ViewBanner({ name, role, onExit, top = false }: { name: string; role: string; onExit: () => void; top?: boolean }) {
  return (
    <div className={`sticky ${top ? 'top-0' : 'top-14'} z-30 bg-signal-amber text-onyx px-4 py-2 flex items-center gap-3 text-[14px] font-semibold`}>
      <Eye size={16} /><span className="flex-1">Viewing as {name} · {role}. This is exactly what they see. Anything you change still saves as you.</span>
      <button onClick={onExit} className="px-3 h-8 bg-onyx text-white text-[12px] font-mono uppercase tracking-[.14em]">Exit</button>
    </div>
  )
}
