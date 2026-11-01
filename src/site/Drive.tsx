import { useState } from 'react'
import { CheckCircle2, Home, ShieldCheck, Wrench, Handshake } from 'lucide-react'
import { PageHero } from './PageHero'
import { submitForm } from './forms'

export default function Drive() {
  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', experience: '1–3 years', license: 'Class C / regular', availability: 'Full time', boxTruck: 'Yes', notes: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }))
  return (
    <>
      <PageHero photo="cab-dawn" pos="70% 50%" eyebrow="Careers" title={<>Drive for <span className="text-crimson-400 italic">CWN.</span></>} sub="We're adding a third truck and looking for drivers who treat freight like it's their own. No CDL required for our box trucks." />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div>
            <h2 className="h-display text-[40px]">What you get</h2>
            <div className="grid gap-3 mt-6">
              {[
                { i: Home, t: 'Home most nights', b: 'Regional runs around Virginia and the Mid-Atlantic. You sleep in your own bed.' },
                { i: Wrench, t: 'Clean, maintained trucks', b: 'Trucks are kept up. If something feels off, we fix it, not argue about it.' },
                { i: Handshake, t: 'Respect & straight talk', b: 'A small company where the owner knows your name and has your back.' },
                { i: ShieldCheck, t: 'Safety first, always', b: 'Zero crashes on our record and we plan to keep it that way. Never pushed to run unsafe.' },
              ].map(x => (
                <div key={x.t} className="card-light p-5 flex gap-4"><div className="w-11 h-11 grid place-items-center bg-crimson text-white -skew-x-[10deg] shrink-0"><x.i size={20} className="skew-x-[10deg]" /></div><div><div className="font-display font-bold uppercase text-[20px]">{x.t}</div><p className="text-graphite text-[15px] mt-0.5">{x.b}</p></div></div>
              ))}
            </div>
            <div className="mt-8 border-l-[3px] border-crimson pl-5">
              <div className="font-display font-bold uppercase text-[18px]">Requirements</div>
              <ul className="text-graphite mt-2 space-y-1 text-[15.5px] list-disc pl-5">
                <li>Valid driver's license and a clean driving record</li><li>21+ (interstate runs)</li><li>DOT medical card, or able to get one</li><li>Able to load/unload with a pallet jack and liftgate</li>
              </ul>
            </div>
          </div>
          <div className="bg-onyx text-ivory p-7 md:p-10 relative overflow-hidden self-start">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-crimson/80 rotate-[24deg]" />
            <div className="relative">
              <div className="eyebrow mb-2">Apply in 2 minutes</div>
              <h3 className="h-display text-[36px]">Driver application</h3>
              {sent ? <div className="mt-6 flex gap-3"><CheckCircle2 className="text-signal-green shrink-0" /><p>Thanks {f.name.split(' ')[0]}! We'll call you within a couple of days.</p></div> : (
                <form className="grid gap-3.5 mt-6" onSubmit={async e => { e.preventDefault(); await submitForm('driver', f); setSent(true) }}>
                  <input required className="input" placeholder="Full name" value={f.name} onChange={set('name')} />
                  <div className="grid sm:grid-cols-2 gap-3"><input required className="input" placeholder="Phone" value={f.phone} onChange={set('phone')} /><input type="email" className="input" placeholder="Email" value={f.email} onChange={set('email')} /></div>
                  <input className="input" placeholder="City you live in" value={f.city} onChange={set('city')} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label><span className="label">Driving experience</span><select className="input" value={f.experience} onChange={set('experience')}><option>Under 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5+ years</option></select></label>
                    <label><span className="label">License</span><select className="input" value={f.license} onChange={set('license')}><option>Class C / regular</option><option>CDL-B</option><option>CDL-A</option></select></label>
                    <label><span className="label">Availability</span><select className="input" value={f.availability} onChange={set('availability')}><option>Full time</option><option>Part time</option><option>Weekends</option></select></label>
                    <label><span className="label">Box truck experience?</span><select className="input" value={f.boxTruck} onChange={set('boxTruck')}><option>Yes</option><option>No</option></select></label>
                  </div>
                  <textarea rows={3} className="input h-auto py-2" placeholder="Tell us about yourself (optional)" value={f.notes} onChange={set('notes')} />
                  <button className="btn btn-red mt-1">Submit application</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
