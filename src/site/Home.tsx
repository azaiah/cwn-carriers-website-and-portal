import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Boxes, Clock3, FileCheck2, Gauge, Landmark, PackageCheck, Phone, Route, ShieldCheck, Truck, UserRound, Zap } from 'lucide-react'
import { LanesMap } from '../components/LanesMap'
import { PLACES as P } from '../brain/cwn'
import { SITE } from './config'

const fade = { initial: { y: 24 }, whileInView: { y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: .6, ease: [.2, .7, .2, 1] } }

export const SERVICES = [
  { icon: Boxes, title: 'LTL & partials', body: '1 to 12 pallets without paying for a full trailer. Palletized, crated or boxed freight moved direct, with no terminal hops.', tag: 'Most requested' },
  { icon: PackageCheck, title: 'Final mile & liftgate', body: 'Store, jobsite, office and residential drop-offs where a 53-footer can\'t fit. Inside delivery available.', tag: 'Box-truck advantage' },
  { icon: Zap, title: 'Expedited & hot loads', body: 'Line-down parts and missed shipments, picked up the same day and driven straight through.', tag: 'Same day' },
  { icon: Route, title: 'Dedicated routes', body: 'A truck and driver on your schedule, every week. Predictable pricing, a driver who knows your dock.', tag: 'Recurring' },
  { icon: Landmark, title: 'Government & institutional', body: 'Agency, school, hospital and county moves with clean paperwork and current insurance on file.', tag: 'Public sector' },
]

const LANES = [P.raleigh, P.dc, P.norfolk, P.charlotte, P.baltimore, P.charlottesville, P.greensboro]

export default function Home() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden tex-asphalt">
        <div className="absolute inset-0 tex-lanes opacity-60" />
        <div className="absolute -right-40 top-0 bottom-0 w-[55%] bg-crimson -skew-x-[16deg] origin-top opacity-[.92] hidden lg:block" />
        <div className="absolute right-[38%] top-0 bottom-0 w-3 bg-ivory -skew-x-[16deg] origin-top hidden lg:block" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(193,18,31,.18),transparent_55%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-6 grid lg:grid-cols-[1.08fr_1fr] gap-10 items-center">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5 }} className="inline-flex items-center gap-2.5 bg-white/5 ring-1 ring-white/10 px-3 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-signal-green animate-pulseDot" />
              <span className="font-mono text-[11.5px] uppercase tracking-[.18em] text-graphite-200">Trucks rolling out of Chesterfield, VA</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .05 }} className="h-display text-[54px] sm:text-[76px] lg:text-[92px]">
              Freight moved<br />like our name<br />is on the truck.<br /><span className="text-crimson-400 italic">It is.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }} className="text-[18px] md:text-[19px] text-graphite-200 max-w-xl mt-6 leading-relaxed">
              CWN Carriers runs LTL, final-mile and expedited box-truck freight across Virginia and the Mid-Atlantic. A small fleet, fully insured, and an owner who knows where every load is.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 }} className="flex flex-wrap gap-3 mt-8">
              <Link to="/shippers" className="btn btn-red h-14 px-8 text-[16px]">Get a freight quote <ArrowRight size={18} /></Link>
              <a href={SITE.phoneHref} className="btn btn-ghost h-14 px-7 text-[16px]"><Phone size={17} /> {SITE.phone}</a>
            </motion.div>
          </div>

          {/* dispatch ticket */}
          <motion.div initial={{ opacity: 0, y: 40, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .8, delay: .2 }} className="relative">
            <div className="relative bg-onyx-850/95 ring-1 ring-white/10 shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] tex-grain">
              <div className="flex items-center justify-between px-5 h-12 border-b border-white/10 bg-black/40">
                <span className="font-mono text-[11px] uppercase tracking-[.2em] text-graphite-300">CWN lane network</span>
                <span className="font-mono text-[11px] uppercase tracking-[.2em] text-crimson-400">250 mi core radius</span>
              </div>
              <LanesMap className="w-full h-auto" radius={250} lanes={LANES.map((to, i) => ({ from: P.chesterfield, to, animated: i < 3 }))} pins={LANES.map(p => ({ at: p, label: p.city }))} />
              <div className="grid grid-cols-3 border-t border-white/10 divide-x divide-white/10">
                {[['Authority', 'Interstate'], ['Liability', '$1M'], ['Crashes', '0']].map(([k, v]) => (
                  <div key={k} className="px-4 py-3"><div className="font-mono text-[10px] uppercase tracking-[.2em] text-graphite-400">{k}</div><div className="font-display font-extrabold text-[24px]">{v}</div></div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* full-bleed fleet photo (Kie AI render + real CWN logo) */}
        <motion.div initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: .25, ease: [.2, .8, .2, 1] }} className="relative mt-10 h-[300px] sm:h-[420px] lg:h-[520px] overflow-hidden">
          <img src={`${import.meta.env.BASE_URL}assets/photos/hero-truck.webp`} alt="CWN Carriers box truck on a Virginia interstate at dusk" className="absolute inset-0 w-full h-full object-cover object-[50%_58%]" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-onyx to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-onyx/70 to-transparent" />
          <div className="absolute left-4 md:left-6 bottom-5 flex flex-wrap gap-2">
            <span className="stamp border-white/25 text-ivory bg-black/40 backdrop-blur">CWN fleet · box trucks</span>
            <span className="stamp border-crimson/60 text-ivory bg-crimson/70">Based in Chesterfield, VA</span>
          </div>
        </motion.div>
        <div className="road-line relative" />
      </section>

      {/* ============ CREDENTIAL TICKER ============ */}
      <section className="bg-black border-b border-white/10 overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] py-4" style={{ animationName: 'marquee' }}>
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 items-center gap-10 pr-10 font-display font-bold uppercase tracking-[.14em] text-[18px] text-graphite-200">
              {['USDOT 4444839', 'MC 1750751', '$1M auto liability', 'Interstate authority', 'Zero crashes on record', 'Zero out-of-service orders', 'General freight', 'Chesterfield, Virginia'].map(t => (
                <span key={t} className="flex items-center gap-10">{t}<span className="w-2.5 h-2.5 bg-crimson rotate-45" /></span>
              ))}
            </div>
          ))}
        </div>
        <style>{'@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}'}</style>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="bg-ivory text-onyx relative overflow-hidden">
        <div className="absolute inset-0 opacity-[.5]" style={{ backgroundImage: 'radial-gradient(#0D0E10 0.6px, transparent 0.6px)', backgroundSize: '18px 18px', maskImage: 'linear-gradient(to bottom, black, transparent 70%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <motion.div {...fade} className="grid md:grid-cols-[1fr_1fr] gap-6 items-end mb-12">
            <div>
              <div className="eyebrow !text-crimson mb-3">What we haul</div>
              <h2 className="h-display text-[48px] md:text-[64px]">Built for the freight<br />big carriers <span className="text-crimson italic">fumble.</span></h2>
            </div>
            <p className="text-graphite text-[17px] max-w-md md:justify-self-end">Too big for a courier van, too small for a 53-foot trailer, and too important to sit on a terminal floor. That freight is our lane.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s, i) => (
              <motion.article key={s.title} {...fade} transition={{ ...fade.transition, delay: i * .06 }} className="group card-light relative p-7 overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute right-0 top-0 h-full w-1.5 bg-crimson scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-500" />
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 grid place-items-center bg-onyx text-ivory -skew-x-[10deg]"><s.icon size={26} className="skew-x-[10deg]" /></div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[.18em] text-crimson">{s.tag}</span>
                </div>
                <h3 className="font-display font-extrabold uppercase text-[28px] mt-6">{s.title}</h3>
                <p className="text-graphite mt-2 leading-relaxed">{s.body}</p>
              </motion.article>
            ))}
            <motion.div {...fade} className="relative bg-onyx text-ivory p-7 overflow-hidden flex flex-col justify-between min-h-[250px]">
              <div className="absolute inset-0 tex-tread opacity-80" />
              <div className="absolute -right-10 -bottom-16 w-48 h-48 bg-crimson rotate-[24deg]" />
              <div className="relative"><div className="eyebrow">Not sure what you need?</div><h3 className="h-display text-[34px] mt-3">Tell us the freight.<br />We'll tell you the plan.</h3></div>
              <Link to="/shippers" className="relative btn btn-ivory self-start mt-6">Start a quote <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ WHY CWN ============ */}
      <section className="relative tex-asphalt overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28">
          <motion.div {...fade} className="max-w-3xl">
            <div className="eyebrow mb-3">Why shippers switch to CWN</div>
            <h2 className="h-display text-[46px] md:text-[62px]">Small fleet.<br /><span className="text-crimson-400 italic">Big-carrier</span> standards.</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-px bg-white/10 mt-14">
            {[
              { icon: UserRound, n: '01', t: 'The owner is on your load', b: 'No call center, no ticket number. You talk to the people dispatching and driving your freight.' },
              { icon: Gauge, n: '02', t: 'Box-truck agility', b: 'Fits tight docks, downtown streets, jobsites and residential drops. Faster loading, fewer appointments missed.' },
              { icon: FileCheck2, n: '03', t: 'Paperwork done right', b: 'BOL at pickup, signed POD photo at delivery, and a clean invoice the same day. Your AP team will notice.' },
            ].map((x, i) => (
              <motion.div key={x.n} {...fade} transition={{ ...fade.transition, delay: i * .08 }} className="bg-onyx-850 p-8 md:p-10 relative group">
                <div className="flex items-center justify-between">
                  <x.icon size={30} className="text-crimson-400" />
                  <span className="font-display font-extrabold text-[64px] leading-none text-white/[.06] group-hover:text-crimson/30 transition-colors">{x.n}</span>
                </div>
                <h3 className="font-display font-extrabold uppercase text-[26px] mt-6">{x.t}</h3>
                <p className="text-graphite-300 mt-3 leading-relaxed">{x.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="bg-onyx-850 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-24">
          <motion.div {...fade} className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div><div className="eyebrow mb-3">How it works</div><h2 className="h-display text-[44px] md:text-[56px]">Quote to POD in four moves</h2></div>
            <Link to="/shippers" className="btn btn-red">Request a rate <ArrowRight size={16} /></Link>
          </motion.div>
          <div className="relative grid md:grid-cols-4 gap-6">
            <div className="hidden md:block absolute top-8 left-8 right-8 road-line opacity-50" />
            {[
              { icon: Clock3, t: 'Quote', b: 'Send lane, pallets and dates. A real person comes back with a firm rate.' },
              { icon: Truck, t: 'Book & dispatch', b: 'Truck and driver assigned, pickup window confirmed by text or email.' },
              { icon: Route, t: 'Move', b: 'Status updates at pickup, en route and delivery. Questions get answered fast.' },
              { icon: FileCheck2, t: 'Deliver & invoice', b: 'Signed POD photo and invoice in your inbox the same day.' },
            ].map((s, i) => (
              <motion.div key={s.t} {...fade} transition={{ ...fade.transition, delay: i * .1 }} className="relative">
                <div className="relative w-16 h-16 grid place-items-center bg-crimson text-white -skew-x-[12deg] shadow-glow"><s.icon size={26} className="skew-x-[12deg]" /></div>
                <div className="font-mono text-[11px] tracking-[.2em] text-graphite-400 mt-5">STEP {i + 1}</div>
                <h3 className="font-display font-extrabold uppercase text-[26px] mt-1">{s.t}</h3>
                <p className="text-graphite-300 mt-2 leading-relaxed">{s.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COVERAGE ============ */}
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 grid lg:grid-cols-[1fr_1.15fr] gap-12 items-center">
          <motion.div {...fade}>
            <div className="eyebrow !text-crimson mb-3">Coverage</div>
            <h2 className="h-display text-[46px] md:text-[58px]">Home base on I-95.<br />Lanes up and down the coast.</h2>
            <p className="text-graphite text-[17px] mt-5 max-w-lg">Chesterfield sits between I-95, I-295 and Route 288, so we reach Richmond and the Tri-Cities within the hour and most of the Mid-Atlantic in a day.</p>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {[['Richmond / Tri-Cities', 'Same day, multiple stops'], ['Hampton Roads', '~2 hrs · daily'], ['Northern VA & DC', '~2.5 hrs · daily'], ['Raleigh–Durham', '~2.5 hrs · daily'], ['Charlotte & Triad', 'Next-day or same-day hot'], ['Baltimore & Delaware', 'Next-day']].map(([a, b]) => (
                <div key={a} className="border-l-[3px] border-crimson bg-white px-4 py-3"><div className="font-display font-bold uppercase text-[17px]">{a}</div><div className="text-[13.5px] text-graphite">{b}</div></div>
              ))}
            </div>
          </motion.div>
          <motion.div {...fade} className="bg-white ring-1 ring-ivory-300 p-3 shadow-[0_30px_60px_-30px_rgba(13,14,16,.4)]">
            <LanesMap light className="w-full h-auto" radius={250} lanes={LANES.map(to => ({ from: P.chesterfield, to }))} pins={[...LANES, P.petersburg, P.richmond].map(p => ({ at: p, label: p.city, tone: 'red' as const, size: 4 }))} />
          </motion.div>
        </div>
      </section>

      {/* ============ BROKERS + DRIVERS ============ */}
      <section className="grid md:grid-cols-2">
        <Link to="/brokers" className="group relative tex-asphalt p-10 md:p-16 overflow-hidden min-h-[340px] flex flex-col justify-end">
          <div className="absolute inset-0 tex-tread" />
          <ShieldCheck className="absolute right-10 top-10 text-white/[.06] group-hover:text-crimson/30 transition" size={160} />
          <div className="relative">
            <div className="eyebrow mb-3">Freight brokers</div>
            <h3 className="h-display text-[44px]">Set us up in<br />five minutes.</h3>
            <p className="text-graphite-300 mt-3 max-w-md">Authority, insurance and equipment details in one place. Request our carrier packet and W-9.</p>
            <span className="btn btn-ghost mt-6">Carrier packet <ArrowRight size={16} className="group-hover:translate-x-1 transition" /></span>
          </div>
        </Link>
        <Link to="/drive" className="group relative bg-crimson p-10 md:p-16 overflow-hidden min-h-[340px] flex flex-col justify-end">
          <div className="absolute -right-20 -top-20 w-80 h-80 border-[28px] border-white/10 rotate-12" />
          <Truck className="absolute right-10 top-10 text-white/15" size={160} />
          <div className="relative">
            <div className="font-mono text-[11px] uppercase tracking-[.22em] text-white/80 mb-3">Now growing</div>
            <h3 className="h-display text-[44px]">Drive for CWN.</h3>
            <p className="text-white/85 mt-3 max-w-md">Non-CDL box truck drivers who take pride in the job. Local routes, home most nights, real respect.</p>
            <span className="btn btn-ivory mt-6">Apply now <ArrowRight size={16} className="group-hover:translate-x-1 transition" /></span>
          </div>
        </Link>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 tex-lanes" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
          <h2 className="h-display text-[52px] md:text-[86px]">Got freight<br /><span className="text-crimson-400 italic">this week?</span></h2>
          <p className="text-graphite-300 text-[18px] mt-5 max-w-xl mx-auto">Send the lane and pallet count. We'll come back with a real rate and a real truck.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-9">
            <Link to="/shippers" className="btn btn-red h-14 px-9 text-[16px]">Get a quote <ArrowRight size={18} /></Link>
            <a href={SITE.phoneHref} className="btn btn-ghost h-14 px-8 text-[16px]"><Phone size={17} /> Call dispatch</a>
          </div>
        </div>
      </section>
    </>
  )
}
