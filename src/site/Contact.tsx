import { useState } from 'react'
import { CheckCircle2, Clock, Mail, MapPin, Phone, Smartphone } from 'lucide-react'
import { PageHero } from './PageHero'
import { SITE } from './config'
import { submitForm } from './forms'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [f, setF] = useState({ name: '', email: '', phone: '', topic: 'Freight quote', message: '' })
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }))
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Talk to <span className="text-crimson-400 italic">dispatch.</span></>} sub="Call or text for the fastest answer. Email works too." />
      <section className="bg-ivory text-onyx">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 md:py-20 grid lg:grid-cols-[1fr_1.3fr] gap-8">
          <div className="grid gap-3 self-start">
            {[
              { i: Phone, k: 'Office / dispatch', v: SITE.phone, href: SITE.phoneHref },
              { i: Smartphone, k: 'Mobile', v: SITE.cell, href: 'tel:+18046036242' },
              { i: Mail, k: 'Email', v: SITE.email, href: `mailto:${SITE.email}` },
              { i: MapPin, k: 'Home base', v: SITE.address },
              { i: Clock, k: 'Hours', v: SITE.hours },
            ].map(x => (
              <a key={x.k} href={x.href} className="card-light p-5 flex gap-4 items-center hover:ring-1 hover:ring-crimson transition">
                <div className="w-12 h-12 grid place-items-center bg-onyx text-ivory -skew-x-[10deg] shrink-0"><x.i size={20} className="skew-x-[10deg]" /></div>
                <div className="min-w-0"><div className="font-mono text-[10.5px] uppercase tracking-[.18em] text-graphite-300">{x.k}</div><div className="font-display font-bold text-[21px] break-words">{x.v}</div></div>
              </a>
            ))}
          </div>
          <div className="card-light p-7 md:p-10">
            {sent ? <div className="text-center py-12"><CheckCircle2 size={56} className="mx-auto text-signal-green" /><h2 className="h-display text-[40px] mt-4">Message sent.</h2><p className="text-graphite mt-2">We'll get back to you soon.</p></div> : (
              <form className="grid gap-4" onSubmit={async e => { e.preventDefault(); await submitForm('contact', f); setSent(true) }}>
                <h2 className="h-display text-[36px]">Send a message</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label><span className="label !text-graphite">Name</span><input required className="input-light" value={f.name} onChange={set('name')} /></label>
                  <label><span className="label !text-graphite">Topic</span><select className="input-light" value={f.topic} onChange={set('topic')}><option>Freight quote</option><option>Broker setup</option><option>Driving for CWN</option><option>Billing</option><option>Other</option></select></label>
                  <label><span className="label !text-graphite">Email</span><input required type="email" className="input-light" value={f.email} onChange={set('email')} /></label>
                  <label><span className="label !text-graphite">Phone</span><input className="input-light" value={f.phone} onChange={set('phone')} /></label>
                </div>
                <label><span className="label !text-graphite">Message</span><textarea required rows={5} className="input-light h-auto py-2" value={f.message} onChange={set('message')} /></label>
                <button className="btn btn-red justify-self-start">Send message</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
