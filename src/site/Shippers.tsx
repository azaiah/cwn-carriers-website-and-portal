import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle2, Phone } from 'lucide-react'
import { PageHero } from './PageHero'
import { PLACES } from '../brain/cwn'
import { miles } from '../brain/score'
import { SITE } from './config'
import { submitForm } from './forms'

const findPlace = (s: string) => Object.values(PLACES).find(p => `${p.city}, ${p.state}`.toLowerCase() === s.trim().toLowerCase() || p.city.toLowerCase() === s.trim().toLowerCase())
const STEPS = ['Freight', 'Route', 'Contact']
const SERVICE = ['LTL / partial', 'Final mile / liftgate', 'Expedited / same day', 'Dedicated route', 'Not sure']

export default function Shippers() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [f, setF] = useState<Record<string, string>>({ service: 'LTL / partial', pallets: '4', weight: '', commodity: '', liftgate: 'No', origin: '', destination: '', date: '', frequency: 'One time', name: '', company: '', email: '', phone: '', notes: '' })
  const set = (k: string) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }))
  const est = useMemo(() => { const a = findPlace(f.origin), b = findPlace(f.destination); return a && b ? miles(a, b) : null }, [f.origin, f.destination])
  const valid = [f.commodity && f.pallets, f.origin && f.destination, f.name && (f.email || f.phone)][step]

  const submit = async () => { await submitForm('quote', { ...f, estMiles: est ? String(est) : '' }); setDone(true) }

  return (
    <>
      <PageHero photo="truck-warehouse" pos="80% 60%" eyebrow="Ship with CWN" title={<>Get a <span className="text-crimson-400 italic">real</span> rate.</>} sub="Three quick steps. A person on our team reviews every request and comes back with a firm price and an available truck." />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 grid lg:grid-cols-[1.5fr_1fr] gap-8">
          <div className="card-light p-6 md:p-10 relative overflow-hidden">
            {done ? (
              <motion.div initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <CheckCircle2 className="mx-auto text-signal-green" size={64} />
                <h2 className="h-display text-[44px] mt-5">Request received.</h2>
                <p className="text-graphite text-[17px] mt-3 max-w-md mx-auto">Thanks {f.name.split(' ')[0]}. We're checking truck availability for {f.origin} → {f.destination} and will reply with a firm rate shortly.</p>
                <a href={SITE.phoneHref} className="btn btn-dark mt-7"><Phone size={16} /> Need it faster? Call {SITE.phone}</a>
              </motion.div>
            ) : (
              <>
                {/* stepper */}
                <div className="flex items-center gap-2 mb-9">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex-1">
                      <div className={`h-1.5 -skew-x-[20deg] transition-colors ${i <= step ? 'bg-crimson' : 'bg-ivory-300'}`} />
                      <div className={`font-mono text-[11px] uppercase tracking-[.18em] mt-2 ${i === step ? 'text-onyx' : 'text-graphite-300'}`}>{i + 1}. {s}</div>
                    </div>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: .25 }} className="grid gap-5">
                    {step === 0 && <>
                      <div>
                        <span className="label !text-graphite">Service</span>
                        <div className="flex flex-wrap gap-2">{SERVICE.map(s => <button type="button" key={s} onClick={() => setF(x => ({ ...x, service: s }))} className={`btn btn-sm ${f.service === s ? 'btn-red' : 'bg-white text-onyx ring-1 ring-ivory-300 hover:ring-onyx'}`}>{s}</button>)}</div>
                      </div>
                      <label><span className="label !text-graphite">What are we hauling?</span><input className="input-light" value={f.commodity} onChange={set('commodity')} placeholder="e.g. palletized building supplies, store fixtures" /></label>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <label><span className="label !text-graphite">Pallets / pieces</span><input type="number" min={1} className="input-light" value={f.pallets} onChange={set('pallets')} /></label>
                        <label><span className="label !text-graphite">Total weight (lbs)</span><input className="input-light" value={f.weight} onChange={set('weight')} placeholder="approx." /></label>
                        <label><span className="label !text-graphite">Liftgate needed?</span><select className="input-light" value={f.liftgate} onChange={set('liftgate')}><option>No</option><option>At pickup</option><option>At delivery</option><option>Both</option></select></label>
                      </div>
                    </>}
                    {step === 1 && <>
                      <datalist id="places">{Object.values(PLACES).map(p => <option key={p.city} value={`${p.city}, ${p.state}`} />)}</datalist>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label><span className="label !text-graphite">Pickup city</span><input list="places" className="input-light" value={f.origin} onChange={set('origin')} placeholder="Chesterfield, VA" /></label>
                        <label><span className="label !text-graphite">Delivery city</span><input list="places" className="input-light" value={f.destination} onChange={set('destination')} placeholder="Raleigh, NC" /></label>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label><span className="label !text-graphite">Ready date</span><input type="date" className="input-light" value={f.date} onChange={set('date')} /></label>
                        <label><span className="label !text-graphite">How often?</span><select className="input-light" value={f.frequency} onChange={set('frequency')}><option>One time</option><option>Weekly</option><option>Several times a week</option><option>Daily</option></select></label>
                      </div>
                      {est && <div className="flex items-center gap-3 bg-onyx text-ivory px-4 py-3"><span className="font-mono text-[11px] uppercase tracking-[.18em] text-graphite-300">Estimated distance</span><span className="font-display font-extrabold text-[24px]">{est} mi</span><span className="text-graphite-300 text-sm">· about {Math.max(1, Math.round(est / 52))} hr drive</span></div>}
                    </>}
                    {step === 2 && <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <label><span className="label !text-graphite">Your name</span><input className="input-light" value={f.name} onChange={set('name')} /></label>
                        <label><span className="label !text-graphite">Company</span><input className="input-light" value={f.company} onChange={set('company')} /></label>
                        <label><span className="label !text-graphite">Email</span><input type="email" className="input-light" value={f.email} onChange={set('email')} /></label>
                        <label><span className="label !text-graphite">Phone</span><input type="tel" className="input-light" value={f.phone} onChange={set('phone')} /></label>
                      </div>
                      <label><span className="label !text-graphite">Anything else? (dock hours, appointment, inside delivery)</span><textarea rows={3} className="input-light h-auto py-2" value={f.notes} onChange={set('notes')} /></label>
                    </>}
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-between mt-9">
                  <button type="button" onClick={() => setStep(s => s - 1)} className={`btn btn-sm bg-transparent text-onyx ring-1 ring-ivory-300 ${step === 0 ? 'invisible' : ''}`}><ArrowLeft size={15} /> Back</button>
                  {step < 2
                    ? <button type="button" disabled={!valid} onClick={() => setStep(s => s + 1)} className="btn btn-red disabled:opacity-40 disabled:pointer-events-none">Next <ArrowRight size={16} /></button>
                    : <button type="button" disabled={!valid} onClick={submit} className="btn btn-red disabled:opacity-40 disabled:pointer-events-none">Send request <ArrowRight size={16} /></button>}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bg-onyx text-ivory p-7 relative overflow-hidden">
              <div className="absolute -right-8 -top-10 w-28 h-36 bg-crimson rotate-[24deg]" />
              <div className="relative">
                <div className="eyebrow">Prefer to talk?</div>
                <a href={SITE.phoneHref} className="block font-display font-extrabold text-[34px] mt-2 hover:text-crimson-400">{SITE.phone}</a>
                <p className="text-graphite-300 text-sm mt-1">{SITE.hours}</p>
              </div>
            </div>
            <div className="card-light p-7">
              <div className="eyebrow !text-crimson mb-3">What to expect</div>
              <ul className="space-y-3 text-[15.5px]">
                {['A firm rate, not a ballpark that changes later', 'Truck and pickup window confirmed in writing', 'Status updates at pickup and delivery', 'Signed POD and invoice the same day'].map(t => <li key={t} className="flex gap-3"><span className="w-1.5 h-5 bg-crimson -skew-x-[20deg] mt-0.5 shrink-0" />{t}</li>)}
              </ul>
            </div>
            <div className="card-light p-7 grid grid-cols-2 gap-4">
              {[['USDOT', SITE.usdot], ['MC', SITE.mc], ['Liability', '$1M'], ['Since', String(SITE.since)]].map(([k, v]) => <div key={k}><div className="font-mono text-[10.5px] uppercase tracking-[.18em] text-graphite-300">{k}</div><div className="font-display font-extrabold text-[24px]">{v}</div></div>)}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
