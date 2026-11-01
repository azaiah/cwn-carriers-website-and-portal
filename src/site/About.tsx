import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHero } from './PageHero'
import { SITE } from './config'

// TODO(Lawrence): replace the story paragraphs with his own words from the intake interview.
export default function About() {
  return (
    <>
      <PageHero photo="route-night" pos="60% 50%" eyebrow="About CWN" title={<>Commonwealth-built.<br /><span className="text-crimson-400 italic">Nationwide-minded.</span></>} />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div className="space-y-5 text-[18px] leading-relaxed text-graphite">
            <div className="eyebrow !text-crimson">Our story</div>
            <h2 className="h-display text-[44px] text-onyx">Started in Chesterfield, with one promise.</h2>
            <p>Commonwealth Nationwide Carriers was founded by <b className="text-onyx">{SITE.owner}</b> and earned its federal operating authority in {SITE.since}. The idea was simple: shippers deserve a carrier that picks up the phone, shows up when it says it will, and treats every pallet like it matters.</p>
            <p>We started with box trucks on purpose. They fit where trailers can't, load faster, and let us give LTL and final-mile customers the attention a big network never will.</p>
            <p>Today CWN runs {SITE.fleet}, with a clean safety record and a growing list of shippers and brokers who call us first.</p>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 bg-crimson -skew-x-[4deg]" />
            <img src={`${import.meta.env.BASE_URL}assets/photos/truck-warehouse.webp`} alt="CWN Carriers box truck at a warehouse" className="relative w-full h-auto shadow-2xl" />
          </div>
        </div>
      </section>
      <section className="tex-asphalt">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
          {[['2025', 'Interstate authority granted'], ['$1M', 'Auto liability coverage'], ['0', 'Crashes on record'], ['3', 'Drivers on the team']].map(([n, t]) => (
            <div key={t} className="bg-onyx-850 p-8"><div className="font-display font-extrabold text-[64px] leading-none text-crimson-400">{n}</div><div className="font-display uppercase font-semibold tracking-wider text-[17px] mt-3 text-graphite-200">{t}</div></div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20 flex flex-wrap gap-3">
          <Link to="/shippers" className="btn btn-red">Ship with us <ArrowRight size={16} /></Link>
          <Link to="/drive" className="btn btn-ghost">Join the team</Link>
        </div>
      </section>
    </>
  )
}
