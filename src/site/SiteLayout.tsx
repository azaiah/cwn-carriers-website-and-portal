import { Link, NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, Phone, X, ShieldCheck, Mail, MapPin } from 'lucide-react'
import { Logo } from '../components/Logo'
import { SITE } from './config'

const NAV = [
  { to: '/services', label: 'Services' },
  { to: '/shippers', label: 'Ship with us' },
  { to: '/brokers', label: 'Brokers' },
  { to: '/drive', label: 'Drive for CWN' },
  { to: '/about', label: 'About' },
]

export default function SiteLayout() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const on = () => {
      setScrolled(window.scrollY > 24)
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? window.scrollY / h : 0)
    }
    on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className="min-h-screen bg-onyx text-ivory">
      {/* credential rail */}
      <div className="hidden md:block bg-black text-graphite-300 text-[12px] font-mono tracking-[.14em] uppercase">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-crimson-400" /> USDOT {SITE.usdot}</span>
            <span>MC {SITE.mc}</span>
            <span className="text-graphite-400">{SITE.insurance}</span>
          </div>
          <a href={SITE.phoneHref} className="flex items-center gap-1.5 hover:text-ivory"><Phone size={13} className="text-crimson-400" /> Dispatch {SITE.phone}</a>
        </div>
      </div>

      <header className={`sticky top-0 z-40 transition-all ${scrolled ? 'bg-onyx/92 backdrop-blur-md border-b border-white/10' : 'bg-onyx'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between">
          <Link to="/" aria-label="CWN Carriers home"><Logo className="h-11 md:h-12 w-auto" /></Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `relative px-3.5 py-2 font-display font-semibold uppercase tracking-[.1em] text-[14px] transition ${isActive ? 'text-white' : 'text-graphite-200 hover:text-white'}`}>
                {({ isActive }) => <>{n.label}{isActive && <span className="absolute left-3.5 right-3.5 -bottom-[3px] h-[3px] bg-crimson -skew-x-[20deg]" />}</>}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/portal" className="text-[13px] font-mono uppercase tracking-[.16em] text-graphite-300 hover:text-white px-2">Portal</Link>
            <Link to="/shippers" className="btn btn-red">Get a quote</Link>
          </div>
          <button className="lg:hidden p-2 -mr-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        </div>
        <div className="absolute left-0 bottom-0 h-[2px] bg-crimson" style={{ width: `${progress * 100}%` }} />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-onyx tex-asphalt lg:hidden flex flex-col">
          <div className="flex items-center justify-between px-4 h-[72px]">
            <Logo className="h-11 w-auto" /><button onClick={() => setOpen(false)} className="p-2 -mr-2" aria-label="Close menu"><X /></button>
          </div>
          <nav className="flex flex-col px-6 pt-6 gap-1">
            {[{ to: '/', label: 'Home' }, ...NAV, { to: '/contact', label: 'Contact' }, { to: '/portal', label: 'Portal login' }].map(n => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="h-display text-[38px] py-1.5 border-b border-white/5">{n.label}</Link>
            ))}
          </nav>
          <div className="mt-auto p-6 grid gap-3">
            <Link to="/shippers" onClick={() => setOpen(false)} className="btn btn-red w-full">Get a quote</Link>
            <a href={SITE.phoneHref} className="btn btn-ghost w-full"><Phone size={16} /> {SITE.phone}</a>
          </div>
        </div>
      )}

      <main><Outlet /></main>

      <footer className="relative bg-black tex-grain overflow-hidden">
        <div className="road-line" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="h-14 w-auto" />
            <p className="text-graphite-300 mt-4 max-w-sm">LTL, final-mile and expedited box-truck freight from Chesterfield, Virginia, run by people who answer the phone.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="stamp border-white/15 text-graphite-200">USDOT {SITE.usdot}</span>
              <span className="stamp border-white/15 text-graphite-200">MC {SITE.mc}</span>
              <span className="stamp border-crimson/50 text-crimson-400">Insured $1M</span>
            </div>
          </div>
          <div>
            <div className="eyebrow mb-3">Company</div>
            <ul className="space-y-2 text-graphite-200">{[...NAV, { to: '/contact', label: 'Contact' }].map(n => <li key={n.to}><Link className="hover:text-white" to={n.to}>{n.label}</Link></li>)}</ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Service area</div>
            <ul className="space-y-2 text-graphite-200"><li>Richmond & Tri-Cities</li><li>Hampton Roads</li><li>Northern VA & DC</li><li>Raleigh–Durham</li><li>Baltimore & Delaware</li></ul>
          </div>
          <div>
            <div className="eyebrow mb-3">Dispatch</div>
            <ul className="space-y-3 text-graphite-200">
              <li className="flex gap-2.5"><Phone size={17} className="text-crimson-400 mt-0.5 shrink-0" /><a href={SITE.phoneHref} className="hover:text-white">{SITE.phone}</a></li>
              <li className="flex gap-2.5"><Mail size={17} className="text-crimson-400 mt-0.5 shrink-0" /><a href={`mailto:${SITE.email}`} className="hover:text-white break-all">{SITE.email}</a></li>
              <li className="flex gap-2.5"><MapPin size={17} className="text-crimson-400 mt-0.5 shrink-0" />{SITE.address}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col md:flex-row gap-2 justify-between text-[12.5px] text-graphite-400">
            <span>© {new Date().getFullYear()} {SITE.legal}. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5">Powered by <a href="https://dataisdata.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold text-graphite-200 underline-offset-4 hover:underline hover:text-white"><img src={`${import.meta.env.BASE_URL}assets/dataisdata-icon.png`} alt="" width={15} height={16} className="h-4 w-auto" />DataIsData</a></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
