import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, Brain, HelpCircle, CalendarRange, ClipboardCheck, FileText, Gauge, LogOut, Menu, Radar, RotateCcw, Send, Smartphone, Truck, Users, Wallet, X } from 'lucide-react'
import { Logo } from '../components/Logo'
import { PortalProvider, usePortal } from './store'
import { PLACES } from '../brain/cwn'
import { miles } from '../brain/score'
import type { Opportunity } from '../brain/types'
import Command from './pages/Command'
import Dispatch from './pages/Dispatch'
import Opportunities from './pages/Opportunities'
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
  { to: 'dispatch', label: 'Dispatch', icon: Truck },
  { to: 'opportunities', label: 'Bids & Leads', icon: Radar, badge: true },
  { to: 'brain', label: 'Company Brain', icon: Brain },
  { to: 'outreach', label: 'Outreach', icon: Send },
  { to: 'briefing', label: 'Weekly Briefing', icon: CalendarRange },
  { to: 'fleet', label: 'Fleet & Drivers', icon: Users },
  { to: 'customers', label: 'Customers', icon: BarChart3 },
  { to: 'money', label: 'Money', icon: Wallet },
  { to: 'compliance', label: 'Compliance', icon: ClipboardCheck },
  { to: 'documents', label: 'Documents', icon: FileText },
  { to: 'driver', label: 'Driver app', icon: Smartphone },
]

export default function Portal() {
  return <PortalProvider><Shell /></PortalProvider>
}

function Gate() {
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
          <p className="text-graphite-300 text-sm mt-1">Demo sign-in. Production uses individual logins.</p>
        </div>
        <div className="p-4 grid gap-2">
          {roles.map(x => (
            <button key={x.u} onClick={() => { setUser(x.u); log(`${x.u} signed in`, 'sys', x.u) }} className="group flex items-center gap-4 p-4 text-left bg-white/[.03] hover:bg-crimson/15 ring-1 ring-white/5 hover:ring-crimson/60 transition">
              <div className="w-12 h-12 grid place-items-center bg-onyx-700 group-hover:bg-crimson -skew-x-[10deg] font-display font-extrabold text-[20px] transition"><span className="skew-x-[10deg]">{x.u[0]}</span></div>
              <div className="flex-1"><div className="font-display font-bold uppercase text-[19px] tracking-wide">{x.u} <span className="text-graphite-400 text-[14px]">· {x.r}</span></div><div className="text-[13.5px] text-graphite-300">{x.d}</div></div>
            </button>
          ))}
        </div>
        <div className="px-8 py-4 border-t border-white/10 flex justify-between text-[12px] font-mono uppercase tracking-[.14em] text-graphite-400"><Link to="/" className="hover:text-white">← Website</Link><span>USDOT 4444839</span></div>
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

function Shell() {
  const { user, setUser, scored, reset } = usePortal()
  const [open, setOpen] = useState(false)
  const [armReset, setArmReset] = useState(false)
  const [guideOn, setGuideOn] = useGuide()
  const loc = useLocation()
  useInboundQuotes()
  useEffect(() => setOpen(false), [loc.pathname])
  if (!user) return <Gate />
  if (user.startsWith('Driver')) return <DriverApp standalone />
  const goCount = scored.filter(o => o.s.verdict === 'Go' && o.status === 'new').length

  const side = (
    <div className="flex flex-col h-full">
      <div className="px-5 h-[72px] flex items-center border-b border-white/[.06]"><Link to="/portal"><Logo className="h-10 w-auto" /></Link></div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(n => (
          <NavLink key={n.to} end={n.to === ''} to={`/portal/${n.to}`} className={({ isActive }) => `relative flex items-center gap-3 px-3 h-10 text-[14.5px] font-medium transition ${isActive ? 'bg-crimson/15 text-white' : 'text-graphite-200 hover:bg-white/5 hover:text-white'}`}>
            {({ isActive }) => <>
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-crimson" />}
              <n.icon size={18} className={isActive ? 'text-crimson-400' : 'text-graphite-400'} />
              <span className="flex-1">{n.label}</span>
              {n.badge && goCount > 0 && <span className="chip bg-crimson text-white h-5 px-1.5">{goCount}</span>}
            </>}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-white/[.06] space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 grid place-items-center bg-crimson -skew-x-[10deg] font-display font-extrabold"><span className="skew-x-[10deg]">{user[0]}</span></div>
          <div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{user}</div><div className="text-[12px] text-graphite-400">{user === 'Lawrence' ? 'Owner' : 'Dispatcher'}</div></div>
          <button onClick={() => setUser(null)} className="p-2 hover:bg-white/10 text-graphite-300" title="Sign out"><LogOut size={16} /></button>
        </div>
        <button onClick={() => { if (armReset) { reset(); setArmReset(false) } else { setArmReset(true); setTimeout(() => setArmReset(false), 4000) } }} className={`w-full flex items-center justify-center gap-2 text-[12px] font-mono uppercase tracking-[.14em] py-1 ${armReset ? 'text-crimson-400' : 'text-graphite-400 hover:text-white'}`}><RotateCcw size={12} /> {armReset ? 'Click again to reset' : 'Reset demo'}</button>
        <a href="https://dataisdata.com" target="_blank" rel="noreferrer" className="block text-center text-[11.5px] text-graphite-400 hover:text-white">Powered by <span className="font-semibold text-graphite-200">DataIsData</span></a>
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
            <button onClick={() => setGuideOn(!guideOn)} aria-pressed={guideOn} className={`flex items-center gap-2 h-8 px-3 text-[12px] font-mono uppercase tracking-[.14em] ring-1 transition ${guideOn ? 'bg-crimson/15 ring-crimson/50 text-white' : 'ring-white/15 text-graphite-300 hover:text-white'}`}>
              <HelpCircle size={14} /> Guide {guideOn ? 'on' : 'off'}
            </button>
            <span className="hidden sm:inline-flex chip bg-signal-amber/15 text-signal-amber ring-1 ring-signal-amber/30" title="Operational records (loads, customers, invoices) are demo data. Company facts and prospects are real.">Demo data</span>
            <span className="hidden sm:flex items-center gap-2 text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300"><span className="w-2 h-2 rounded-full bg-signal-green animate-pulseDot" /> Fleet active</span>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 max-w-[1500px]">
          <Routes>
            <Route index element={<Command />} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="brain" element={<BrainPage />} />
            <Route path="outreach" element={<Outreach />} />
            <Route path="briefing" element={<Briefing />} />
            <Route path="fleet" element={<Fleet />} />
            <Route path="customers" element={<Customers />} />
            <Route path="money" element={<Money />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="documents" element={<Documents />} />
            <Route path="driver" element={<DriverApp />} />
            <Route path="*" element={<Navigate to="/portal" replace />} />
          </Routes>
        </main>
        {guideOn && <GuideCard onClose={() => setGuideOn(false)} />}
      </div>
    </div>
  )
}
