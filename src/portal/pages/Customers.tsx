import { useState } from 'react'
import { Mail, Phone, Plus, Trash2 } from 'lucide-react'
import { usePortal } from '../store'
import { Drawer, Empty, PageHead, Panel, shortDate, usd } from '../../components/ui'
import type { Customer } from '../data'

const BLANK: Customer = { id: '', name: '', type: 'Shipper', contact: '', email: '', phone: '', city: '', terms: 'Net 30', loads: 0, revenue: 0 }

export default function Customers() {
  const { customers, loads, setCustomers, log } = usePortal()
  const [sel, setSel] = useState<Customer | null>(null)
  // Real numbers come from Dispatch; the stored counts are only a fallback for older records.
  const stats = (c: Customer) => {
    const ls = loads.filter(l => l.customer === c.name)
    const rev = ls.reduce((a, l) => a + l.rate, 0)
    const last = ls.map(l => l.pickup).sort().at(-1)
    return { loads: ls.length || c.loads, revenue: rev || c.revenue, last: last ?? c.lastLoad }
  }
  const rows = customers.map(c => ({ c, s: stats(c) }))
  const total = rows.reduce((a, r) => a + r.s.revenue, 0)
  const save = (c: Customer) => {
    if (!c.name.trim()) return
    const isNew = !c.id
    const rec = isNew ? { ...c, id: crypto.randomUUID() } : c
    setCustomers(isNew ? [rec, ...customers] : customers.map(x => x.id === rec.id ? rec : x))
    log(`${isNew ? 'Added' : 'Updated'} customer ${rec.name}`, 'sys')
    setSel(null)
  }
  return (
    <>
      <PageHead eyebrow="Customers" title="Shippers, brokers & partners" sub="Who pays the bills, how often they ship, and how concentrated the revenue is. Load counts and revenue come straight from Dispatch."
        right={<button onClick={() => setSel({ ...BLANK })} className="btn btn-red btn-sm"><Plus size={14} /> Add customer</button>} />
      {total > 0 && <Panel title="Revenue concentration" className="mb-4">
        <div className="flex h-9 overflow-hidden">
          {rows.filter(r => r.s.revenue > 0).map(({ c, s }, i) => <div key={c.id} title={`${c.name}: ${usd(s.revenue)}`} className="h-full flex items-center px-2 text-[11px] font-mono truncate" style={{ width: (s.revenue / total * 100) + '%', background: ['#C1121F', '#F2EFE8', '#33456E', '#6E737B', '#E3A72F'][i % 5], color: i === 1 || i === 4 ? '#0D0E10' : '#fff' }}>{Math.round(s.revenue / total * 100)}%</div>)}
        </div>
        <p className="text-[13px] text-graphite-300 mt-3">{Math.round(Math.max(...rows.map(r => r.s.revenue)) / total * 100) > 30 ? 'One customer is over 30% of revenue. The lead finder is weighted toward new direct shippers to spread the risk.' : 'Revenue is well spread.'}</p>
      </Panel>}
      <Panel pad={false}>
        {customers.length ? <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Type</th><th>City</th><th>Terms</th><th className="text-right">Loads</th><th className="text-right">Revenue</th><th>Last load</th></tr></thead>
            <tbody>{rows.map(({ c, s }) => (
              <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer">
                <td className="font-semibold">{c.name}</td>
                <td><span className={`chip ${c.type === 'Broker' ? 'bg-signal-blue/15 text-signal-blue' : 'bg-white/5 text-graphite-200'}`}>{c.type}</span></td>
                <td className="text-graphite-200">{c.city}</td><td className="text-graphite-200">{c.terms}</td>
                <td className="text-right">{s.loads}</td><td className="text-right font-semibold">{usd(s.revenue)}</td><td className="text-graphite-300">{shortDate(s.last)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div> : <div className="p-4"><Empty>No customers yet. Add the shippers and brokers you haul for.</Empty></div>}
      </Panel>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.id ? sel.name : 'New customer'}>
        {sel && <CustomerForm key={sel.id || 'new'} c={sel} stats={sel.id ? stats(sel) : null} loads={loads.filter(l => l.customer === sel.name)} onSave={save}
          onDelete={sel.id ? () => { setCustomers(customers.filter(x => x.id !== sel.id)); log(`Removed customer ${sel.name}`, 'sys'); setSel(null) } : undefined} />}
      </Drawer>
    </>
  )
}

function CustomerForm({ c, stats, loads, onSave, onDelete }: { c: Customer; stats: { loads: number; revenue: number } | null; loads: { id: string; ref: string; origin: { city: string }; destination: { city: string }; rate: number }[]; onSave: (c: Customer) => void; onDelete?: () => void }) {
  const [f, setF] = useState<Customer>(c)
  const [arm, setArm] = useState(false)
  const set = (k: keyof Customer) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }))
  return (
    <div className="space-y-5">
      {stats && <div className="grid grid-cols-3 gap-px bg-white/10">{[['Loads', stats.loads], ['Revenue', usd(stats.revenue)], ['Avg/load', stats.loads ? usd(stats.revenue / stats.loads) : '—']].map(([k, v]) => <div key={k as string} className="bg-onyx-850 p-3"><div className="label">{k}</div><div className="font-display font-extrabold text-[22px]">{v}</div></div>)}</div>}
      {c.id && <div className="flex flex-wrap gap-2">{c.phone && <a href={`tel:${c.phone}`} className="btn btn-ghost btn-sm"><Phone size={14} />{c.phone}</a>}{c.email && <a href={`mailto:${c.email}`} className="btn btn-ghost btn-sm"><Mail size={14} />{c.email}</a>}</div>}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="sm:col-span-2"><span className="label">Company name</span><input className="input" value={f.name} onChange={set('name')} placeholder="Atlantic Fixture Supply" /></label>
        <label><span className="label">Type</span><select className="input" value={f.type} onChange={set('type')}><option>Shipper</option><option>Broker</option><option>Partner</option><option>Government</option></select></label>
        <label><span className="label">Payment terms</span><input className="input" value={f.terms} onChange={set('terms')} placeholder="Net 30" /></label>
        <label><span className="label">Contact person</span><input className="input" value={f.contact} onChange={set('contact')} /></label>
        <label><span className="label">City</span><input className="input" value={f.city} onChange={set('city')} placeholder="Richmond, VA" /></label>
        <label><span className="label">Phone</span><input className="input" value={f.phone} onChange={set('phone')} /></label>
        <label><span className="label">Email</span><input type="email" className="input" value={f.email} onChange={set('email')} /></label>
        <label className="sm:col-span-2"><span className="label">Notes</span><textarea rows={3} className="input h-auto py-2" value={f.notes ?? ''} onChange={set('notes')} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={!f.name.trim()} onClick={() => onSave(f)} className="btn btn-red disabled:opacity-40">{c.id ? 'Save changes' : 'Add customer'}</button>
        {onDelete && <button onClick={() => arm ? onDelete() : setArm(true)} className={`btn btn-sm ${arm ? 'btn-red' : 'btn-ghost'}`}><Trash2 size={14} /> {arm ? 'Click again to remove' : 'Remove'}</button>}
      </div>
      {c.id && <div><div className="label">Loads</div>
        <ul className="divide-y divide-white/[.05]">{loads.map(l => <li key={l.id} className="py-2 flex justify-between text-[14px]"><span>{l.ref} · {l.origin.city} → {l.destination.city}</span><span className="font-semibold">{usd(l.rate)}</span></li>)}{!loads.length && <li className="py-2 text-[13px] text-graphite-400">No loads yet. Loads booked in Dispatch under this name show up here.</li>}</ul>
      </div>}
    </div>
  )
}
