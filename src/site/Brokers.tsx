import { useState } from 'react'
import { CheckCircle2, Copy, Printer, ShieldCheck } from 'lucide-react'
import { PageHero } from './PageHero'
import { SITE } from './config'
import { submitForm } from './forms'

const PROFILE: [string, string][] = [
  ['Legal name', SITE.legal], ['DBA', 'CWN Carriers'], ['USDOT', SITE.usdot], ['MC', SITE.mc],
  ['Authority', 'Common carrier (property), interstate, active'], ['Authority granted', 'August 2025'],
  ['Auto liability', '$1,000,000 BIPD (primary)'], ['Insurer', SITE.insurer],
  ['Cargo', 'General freight'], ['Equipment', '26 ft box trucks (non-CDL)'], ['Safety', 'Not rated · 0 crashes · 0 OOS'],
  ['Home base', SITE.address], ['Dispatch', `${SITE.phone} · ${SITE.email}`], ['Preferred lanes', 'VA ⇄ NC, MD, DC, DE'],
]

export default function Brokers() {
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [f, setF] = useState({ brokerage: '', name: '', email: '', phone: '', mc: '', lanes: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }))
  const copy = async () => { await navigator.clipboard.writeText(PROFILE.map(([k, v]) => `${k}: ${v}`).join('\n')).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800) }
  return (
    <>
      <PageHero photo="dock-night" pos="75% 50%" eyebrow="For freight brokers" title={<>Carrier packet,<br /><span className="text-crimson-400 italic">no chasing.</span></>} sub="Everything your carrier team needs to onboard CWN. Copy it, print it, or request the full packet with COI and W-9." />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 grid lg:grid-cols-[1.4fr_1fr] gap-8">
          <div className="card-light">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-5 border-b border-ivory-200">
              <div className="flex items-center gap-3"><ShieldCheck className="text-crimson" /><h2 className="font-display font-extrabold uppercase text-[24px]">Carrier profile</h2></div>
              <div className="flex gap-2 no-print">
                <button onClick={copy} className="btn btn-sm bg-white ring-1 ring-ivory-300 text-onyx">{copied ? <CheckCircle2 size={15} className="text-signal-green" /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</button>
                {import.meta.env.MODE !== 'preview' && <button onClick={() => window.print()} className="btn btn-sm btn-dark"><Printer size={15} /> Print</button>}
              </div>
            </div>
            <dl className="divide-y divide-ivory-200">
              {PROFILE.map(([k, v]) => (
                <div key={k} className="grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-6 md:px-8 py-3.5">
                  <dt className="font-mono text-[11px] uppercase tracking-[.16em] text-graphite-300 pt-0.5">{k}</dt>
                  <dd className="font-medium text-[16px]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="px-6 md:px-8 py-4 text-[13px] text-graphite border-t border-ivory-200">Verify anytime on FMCSA SAFER using USDOT {SITE.usdot}.</p>
          </div>

          <div className="bg-onyx text-ivory p-7 md:p-9 relative overflow-hidden self-start">
            <div className="absolute inset-0 tex-tread" />
            <div className="relative">
              <div className="eyebrow mb-2">Request full packet</div>
              <h3 className="h-display text-[34px]">COI, W-9 &amp; authority letter</h3>
              {sent ? (
                <div className="mt-6 flex gap-3 items-start"><CheckCircle2 className="text-signal-green shrink-0" /><p>Got it. We'll email the packet to {f.email} and add you to our broker list.</p></div>
              ) : (
                <form className="grid gap-3.5 mt-6" onSubmit={async e => { e.preventDefault(); await submitForm('broker', f); setSent(true) }}>
                  <input required className="input" placeholder="Brokerage name" value={f.brokerage} onChange={set('brokerage')} />
                  <div className="grid grid-cols-2 gap-3"><input required className="input" placeholder="Your name" value={f.name} onChange={set('name')} /><input className="input" placeholder="Broker MC #" value={f.mc} onChange={set('mc')} /></div>
                  <input required type="email" className="input" placeholder="Email for the packet" value={f.email} onChange={set('email')} />
                  <input className="input" placeholder="Phone" value={f.phone} onChange={set('phone')} />
                  <textarea rows={3} className="input h-auto py-2" placeholder="Lanes you need covered (optional)" value={f.lanes} onChange={set('lanes')} />
                  <button className="btn btn-red mt-1">Send me the packet</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
