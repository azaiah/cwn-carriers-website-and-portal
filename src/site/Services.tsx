import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { PageHero } from './PageHero'
import { SERVICES } from './Home'

const DETAIL: Record<string, string[]> = {
  'LTL & partials': ['1–12 pallets, up to ~10,000 lbs per truck', 'Direct, point-to-point, so your freight is not cross-docked', 'Shared-truck pricing on regular lanes', 'Shrink-wrapped and strapped on every load'],
  'Final mile & liftgate': ['Liftgate and pallet-jack deliveries', 'Jobsites, retail back doors, offices, residences', 'Inside delivery and room-of-choice on request', 'Appointment windows honored'],
  'Expedited & hot loads': ['Same-day pickup within the Richmond metro', 'Straight-through runs to DC, Raleigh, Hampton Roads', 'Status texts at pickup, mid-route and delivery', 'After-hours dispatch for emergencies'],
  'Dedicated routes': ['Your truck, your driver, your schedule', 'Daily, weekly or multi-stop milk runs', 'Fixed monthly or per-run pricing', 'A driver who knows your dock and your people'],
  'Government & institutional': ['Federal, state, county, school and hospital work', 'Clean paperwork: COI, W-9 and authority on request', 'Furniture, records, equipment and surplus moves', 'Subcontract partner for prime contractors'],
}

export default function Services() {
  return (
    <>
      <PageHero photo="liftgate" pos="70% 50%" eyebrow="Services" title={<>Five ways we <span className="text-crimson-400 italic">move it.</span></>} sub="Every service runs on the same promise: a truck that shows up, a driver who cares, and paperwork that's done right." />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 space-y-5">
          {SERVICES.map((s, i) => (
            <article key={s.title} className="card-light grid md:grid-cols-[90px_1fr_1.1fr] gap-6 md:gap-10 p-7 md:p-10 relative overflow-hidden">
              <div className="font-display font-extrabold text-[72px] leading-none text-crimson/90">0{i + 1}</div>
              <div>
                <div className="flex items-center gap-3"><div className="w-11 h-11 grid place-items-center bg-onyx text-ivory -skew-x-[10deg]"><s.icon size={21} className="skew-x-[10deg]" /></div><span className="font-mono text-[11px] uppercase tracking-[.18em] text-crimson">{s.tag}</span></div>
                <h2 className="h-display text-[38px] md:text-[44px] mt-4">{s.title}</h2>
                <p className="text-graphite text-[17px] mt-3 leading-relaxed">{s.body}</p>
              </div>
              <ul className="grid gap-3 self-center">
                {DETAIL[s.title].map(d => <li key={d} className="flex gap-3 items-start text-[16px]"><span className="mt-0.5 w-6 h-6 grid place-items-center bg-crimson text-white shrink-0 -skew-x-[10deg]"><Check size={14} strokeWidth={3} /></span>{d}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="tex-asphalt">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="eyebrow mb-2">What we don't haul</div>
            <h2 className="h-display text-[38px]">Straight answers save everybody time.</h2>
            <p className="text-graphite-300 mt-3 max-w-xl">We don't move hazmat, livestock or household moves, and we don't run 53-foot trailers yet. If it's not a fit, we'll say so up front and point you to someone who can help.</p>
          </div>
          <Link to="/shippers" className="btn btn-red h-14 md:justify-self-end">Quote a load <ArrowRight size={17} /></Link>
        </div>
      </section>
    </>
  )
}
