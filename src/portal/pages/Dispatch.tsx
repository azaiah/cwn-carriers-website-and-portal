import { useState } from 'react'
import { ChevronRight, FileCheck2, FileText, Plus, Truck } from 'lucide-react'
import { usePortal } from '../store'
import { LOAD_STAGES, type Load, type LoadStatus } from '../data'
import { Drawer, PageHead, shortDate, timeOf, usd } from '../../components/ui'
import { PLACES } from '../../brain/cwn'
import { miles } from '../../brain/score'
import { LanesMap } from '../../components/LanesMap'

const COL: Record<LoadStatus, string> = { quoted: 'bg-graphite-400', booked: 'bg-ivory-300', dispatched: 'bg-signal-blue', transit: 'bg-crimson', delivered: 'bg-signal-green', invoiced: 'bg-signal-amber', paid: 'bg-signal-green' }

export default function Dispatch() {
  const { loads, moveLoad, upsertLoad, brain, drivers, log } = usePortal()
  const [sel, setSel] = useState<Load | null>(null)
  const [drag, setDrag] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const move = (l: Load, s: LoadStatus) => { moveLoad(l.id, s); log(`${l.ref} moved to ${s}`, 'load'); if (sel?.id === l.id) setSel({ ...l, status: s }) }

  return (
    <>
      <PageHead eyebrow="Dispatch" title="Load board" sub="Drag a load to the next stage, or open it to assign a truck and driver." right={<button onClick={() => setCreating(true)} className="btn btn-red"><Plus size={16} /> New load</button>} />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
        {LOAD_STAGES.map(stage => {
          const items = loads.filter(l => l.status === stage.key)
          const total = items.reduce((a, l) => a + l.rate, 0)
          return (
            <div key={stage.key} className="snap-start w-[262px] shrink-0 bg-onyx-850 border border-white/[.06] flex flex-col max-h-[calc(100vh-220px)]"
              onDragOver={e => e.preventDefault()} onDrop={() => { const l = loads.find(x => x.id === drag); if (l && l.status !== stage.key) move(l, stage.key) }}>
              <div className="px-3 h-11 flex items-center gap-2 border-b border-white/[.06]">
                <span className={`w-2 h-2 ${COL[stage.key]}`} />
                <span className="font-display font-bold uppercase tracking-wider text-[14px]">{stage.label}</span>
                <span className="ml-auto font-mono text-[11px] text-graphite-400">{items.length} · {usd(total)}</span>
              </div>
              <div className="p-2 space-y-2 overflow-y-auto">
                {items.map(l => (
                  <button key={l.id} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)} onClick={() => setSel(l)}
                    className={`w-full text-left bg-onyx-750 hover:bg-onyx-700 ring-1 ring-white/[.05] hover:ring-crimson/50 p-3 transition cursor-grab active:cursor-grabbing ${drag === l.id ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between font-mono text-[11px] text-graphite-400"><span>{l.ref}</span><span className="text-ivory font-bold">{usd(l.rate)}</span></div>
                    <div className="font-display font-bold uppercase text-[16px] mt-1 leading-tight">{l.origin.city} <ChevronRight size={13} className="inline -mt-0.5 text-crimson-400" /> {l.destination.city}</div>
                    <div className="text-[12.5px] text-graphite-300 mt-1">{l.customer}</div>
                    <div className="flex items-center justify-between mt-2 text-[11.5px] text-graphite-400">
                      <span>{shortDate(l.pickup)} · {l.pallets} plt · {l.miles} mi</span>
                      {l.truck ? <span className="flex items-center gap-1 text-graphite-200"><Truck size={12} />{l.truck}</span> : ['booked', 'quoted'].includes(l.status) && <span className="text-signal-amber">No truck</span>}
                    </div>
                  </button>
                ))}
                {!items.length && <div className="text-center text-[12px] text-graphite-400 py-6 border border-dashed border-white/10">Drop here</div>}
              </div>
            </div>
          )
        })}
      </div>

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.ref} · ${sel.customer}` : ''}>
        {sel && (() => {
          const cost = sel.miles * brain.money.costPerMile
          const rpm = sel.rate / Math.max(sel.miles, 1)
          const idx = LOAD_STAGES.findIndex(s => s.key === sel.status)
          return (
            <div className="space-y-5">
              <div className="bg-onyx-800 ring-1 ring-white/[.06]"><LanesMap fit className="w-full h-auto" showLabels lanes={[{ from: sel.origin, to: sel.destination, animated: true }]} pins={[{ at: sel.origin, label: sel.origin.city, tone: 'ivory' }, { at: sel.destination, label: sel.destination.city, tone: 'red' }]} /></div>
              <div className="grid grid-cols-3 gap-px bg-white/10">
                {[['Rate', usd(sel.rate)], ['Per mile', '$' + rpm.toFixed(2)], ['Est. margin', usd(sel.rate - cost)]].map(([k, v]) => <div key={k} className="bg-onyx-850 p-3"><div className="label">{k}</div><div className={`font-display font-extrabold text-[24px] ${k === 'Per mile' && rpm < brain.money.rateFloorPerMile ? 'text-signal-amber' : ''}`}>{v}</div></div>)}
              </div>
              <dl className="grid grid-cols-2 gap-4 text-[14px]">
                {[['Pickup', `${shortDate(sel.pickup)} ${timeOf(sel.pickup)} · ${sel.origin.city}, ${sel.origin.state}`], ['Delivery', `${shortDate(sel.delivery)} ${timeOf(sel.delivery)} · ${sel.destination.city}, ${sel.destination.state}`], ['Freight', `${sel.pallets} pallets · ${sel.weight.toLocaleString()} lbs`], ['Commodity', sel.commodity], ['Miles', `${sel.miles}`], ['Liftgate', sel.liftgate ? 'Yes' : 'No']].map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>)}
              </dl>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">Truck</span>
                  <select className="input" value={sel.truck ?? ''} onChange={e => { const n = { ...sel, truck: e.target.value || undefined }; upsertLoad(n); setSel(n) }}>
                    <option value="">Unassigned</option>{brain.fleet.filter(t => t.status === 'active').map(t => <option key={t.id} value={t.unit}>Unit {t.unit} · {t.label}</option>)}
                  </select></label>
                <label><span className="label">Driver</span>
                  <select className="input" value={sel.driver ?? ''} onChange={e => { const n = { ...sel, driver: e.target.value || undefined }; upsertLoad(n); setSel(n); if (e.target.value) log(`${sel.ref} assigned to ${e.target.value}`, 'load') }}>
                    <option value="">Unassigned</option>{drivers.map(d => <option key={d.id}>{d.name}</option>)}
                  </select></label>
              </div>
              <div className="flex gap-2">
                <span className={`chip ${sel.bol ? 'bg-signal-green/15 text-signal-green' : 'bg-white/5 text-graphite-300'}`}><FileText size={12} /> BOL {sel.bol ? 'on file' : 'pending'}</span>
                <span className={`chip ${sel.pod ? 'bg-signal-green/15 text-signal-green' : 'bg-white/5 text-graphite-300'}`}><FileCheck2 size={12} /> POD {sel.pod ? 'signed' : 'pending'}</span>
              </div>
              <div>
                <div className="label">Move to stage</div>
                <div className="flex flex-wrap gap-2">
                  {LOAD_STAGES.map((s, i) => <button key={s.key} onClick={() => move(sel, s.key)} className={`btn btn-sm ${s.key === sel.status ? 'btn-red' : i === idx + 1 ? 'btn-ivory' : 'btn-ghost'}`}>{s.label}</button>)}
                </div>
              </div>
            </div>
          )
        })()}
      </Drawer>

      <NewLoad open={creating} onClose={() => setCreating(false)} onSave={l => { upsertLoad(l); log(`New load ${l.ref} quoted for ${l.customer}`, 'load'); setCreating(false) }} next={loads.length + 1045} />
    </>
  )
}

function NewLoad({ open, onClose, onSave, next }: { open: boolean; onClose: () => void; onSave: (l: Load) => void; next: number }) {
  const keys = Object.keys(PLACES)
  const { brain } = usePortal()
  const [f, setF] = useState({ customer: '', o: 'chesterfield', d: 'raleigh', pallets: 6, weight: 6000, commodity: 'General freight', rate: 600, date: new Date().toISOString().slice(0, 10) })
  const m = miles(PLACES[f.o], PLACES[f.d])
  return (
    <Drawer open={open} onClose={onClose} title="New load / quote">
      <form className="grid gap-4" onSubmit={e => { e.preventDefault(); onSave({ id: crypto.randomUUID(), ref: `Q-${next}`, customer: f.customer || 'New customer', origin: PLACES[f.o], destination: PLACES[f.d], pickup: new Date(f.date + 'T08:00').toISOString(), delivery: new Date(f.date + 'T15:00').toISOString(), pallets: +f.pallets, weight: +f.weight, commodity: f.commodity, rate: +f.rate, miles: m, status: 'quoted' }) }}>
        <label><span className="label">Customer</span><input className="input" value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} placeholder="Shipper or broker" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="label">Origin</span><select className="input" value={f.o} onChange={e => setF({ ...f, o: e.target.value })}>{keys.map(k => <option key={k} value={k}>{PLACES[k].city}, {PLACES[k].state}</option>)}</select></label>
          <label><span className="label">Destination</span><select className="input" value={f.d} onChange={e => setF({ ...f, d: e.target.value })}>{keys.map(k => <option key={k} value={k}>{PLACES[k].city}, {PLACES[k].state}</option>)}</select></label>
          <label><span className="label">Pallets</span><input type="number" className="input" value={f.pallets} onChange={e => setF({ ...f, pallets: +e.target.value })} /></label>
          <label><span className="label">Weight (lbs)</span><input type="number" className="input" value={f.weight} onChange={e => setF({ ...f, weight: +e.target.value })} /></label>
          <label><span className="label">Rate ($)</span><input type="number" className="input" value={f.rate} onChange={e => setF({ ...f, rate: +e.target.value })} /></label>
          <label><span className="label">Pickup date</span><input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
        </div>
        <label><span className="label">Commodity</span><input className="input" value={f.commodity} onChange={e => setF({ ...f, commodity: e.target.value })} /></label>
        <div className="bg-onyx-800 p-3 text-sm text-graphite-200">{m} mi · <b className="text-ivory">${(f.rate / Math.max(m, 1)).toFixed(2)}/mi</b> · suggested at your floor: {usd(Math.max(brain.money.minPerLoad, m * brain.money.rateFloorPerMile))}</div>
        <button className="btn btn-red">Create quote</button>
      </form>
    </Drawer>
  )
}
