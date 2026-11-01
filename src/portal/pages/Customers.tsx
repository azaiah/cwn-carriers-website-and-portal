import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { usePortal } from '../store'
import { Drawer, PageHead, Panel, shortDate, usd } from '../../components/ui'
import type { Customer } from '../data'

export default function Customers() {
  const { customers, loads } = usePortal()
  const [sel, setSel] = useState<Customer | null>(null)
  const total = customers.reduce((a, c) => a + c.revenue, 0)
  return (
    <>
      <PageHead eyebrow="Customers" title="Shippers, brokers & partners" sub="Who pays the bills, how often they ship, and how concentrated the revenue is." />
      <Panel title="Revenue concentration" className="mb-4">
        <div className="flex h-9 overflow-hidden">
          {customers.map((c, i) => <div key={c.id} title={`${c.name}: ${usd(c.revenue)}`} className="h-full flex items-center px-2 text-[11px] font-mono truncate" style={{ width: (c.revenue / total * 100) + '%', background: ['#C1121F', '#F2EFE8', '#33456E', '#6E737B', '#E3A72F'][i % 5], color: i === 1 || i === 4 ? '#0D0E10' : '#fff' }}>{Math.round(c.revenue / total * 100)}%</div>)}
        </div>
        <p className="text-[13px] text-graphite-300 mt-3">{customers[0] && Math.round(Math.max(...customers.map(c => c.revenue)) / total * 100) > 30 ? 'One customer is over 30% of revenue. The lead finder is weighted toward new direct shippers to spread the risk.' : 'Revenue is well spread.'}</p>
      </Panel>
      <Panel pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Type</th><th>City</th><th>Terms</th><th className="text-right">Loads</th><th className="text-right">Revenue</th><th>Last load</th></tr></thead>
            <tbody>{customers.map(c => (
              <tr key={c.id} onClick={() => setSel(c)} className="cursor-pointer">
                <td className="font-semibold">{c.name}</td>
                <td><span className={`chip ${c.type === 'Broker' ? 'bg-signal-blue/15 text-signal-blue' : 'bg-white/5 text-graphite-200'}`}>{c.type}</span></td>
                <td className="text-graphite-200">{c.city}</td><td className="text-graphite-200">{c.terms}</td>
                <td className="text-right">{c.loads}</td><td className="text-right font-semibold">{usd(c.revenue)}</td><td className="text-graphite-300">{shortDate(c.lastLoad)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name}>
        {sel && <div className="space-y-5">
          <div className="grid grid-cols-3 gap-px bg-white/10">{[['Loads', sel.loads], ['Revenue', usd(sel.revenue)], ['Avg/load', usd(sel.revenue / sel.loads)]].map(([k, v]) => <div key={k as string} className="bg-onyx-850 p-3"><div className="label">{k}</div><div className="font-display font-extrabold text-[22px]">{v}</div></div>)}</div>
          <div className="flex flex-wrap gap-2"><a href={`tel:${sel.phone}`} className="btn btn-ghost btn-sm"><Phone size={14} />{sel.phone}</a><a href={`mailto:${sel.email}`} className="btn btn-ghost btn-sm"><Mail size={14} />{sel.email}</a></div>
          <div><div className="label">Recent loads</div>
            <ul className="divide-y divide-white/[.05]">{loads.filter(l => l.customer === sel.name).map(l => <li key={l.id} className="py-2 flex justify-between text-[14px]"><span>{l.ref} · {l.origin.city} → {l.destination.city}</span><span className="font-semibold">{usd(l.rate)}</span></li>)}</ul>
          </div>
        </div>}
      </Drawer>
    </>
  )
}
