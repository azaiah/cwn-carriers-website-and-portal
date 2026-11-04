import { useState } from 'react'
import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, Plus, Trash2, XCircle } from 'lucide-react'
import { usePortal } from '../store'
import { PageHead, Panel, daysUntil, shortDate } from '../../components/ui'
import type { Comp } from '../data'

const ICON = { ok: <CheckCircle2 className="text-signal-green" size={20} />, soon: <AlertTriangle className="text-signal-amber" size={20} />, action: <CircleDashed className="text-signal-amber" size={20} />, missing: <XCircle className="text-crimson-400" size={20} /> }
const LINKS: Record<string, string> = {
  k3: 'https://www.fmcsa.dot.gov/registration/updating-your-registration', k4: 'https://plan.ucr.gov/', k5: 'https://sam.gov/content/entity-registration',
  k6: 'https://eva.virginia.gov/', k7: 'https://www.sbsd.virginia.gov/certification-division/',
}

export default function Compliance() {
  const { compliance, setCompliance } = usePortal()
  const set = (id: string, status: Comp['status']) => setCompliance(compliance.map(c => c.id === id ? { ...c, status } : c))
  const patch = (id: string, p: Partial<Comp>) => setCompliance(compliance.map(c => c.id === id ? { ...c, ...p } : c))
  const [adding, setAdding] = useState(false)
  const [nu, setNu] = useState({ item: '', detail: '', due: '' })
  const ok = compliance.filter(c => c.status === 'ok').length
  return (
    <>
      <PageHead eyebrow="Compliance vault" title="Authority, insurance & registrations" sub="Everything a broker, shipper or contracting officer will ask for, with renewal dates tracked so nothing lapses. Click any date or note to change it."
        right={<button onClick={() => setAdding(true)} className="btn btn-red btn-sm"><Plus size={14} /> Add item</button>} />
      {adding && <div className="plate p-4 mb-4 grid sm:grid-cols-[1.2fr_1.5fr_170px_auto] gap-2 items-end">
        <label><span className="label">Item</span><input className="input h-10" value={nu.item} onChange={e => setNu({ ...nu, item: e.target.value })} placeholder="Driver B medical card" /></label>
        <label><span className="label">Detail</span><input className="input h-10" value={nu.detail} onChange={e => setNu({ ...nu, detail: e.target.value })} placeholder="National Registry examiner, 2-year card" /></label>
        <label><span className="label">Due / expires</span><input type="date" className="input h-10" value={nu.due} onChange={e => setNu({ ...nu, due: e.target.value })} /></label>
        <div className="flex gap-2"><button disabled={!nu.item.trim()} onClick={() => { setCompliance([...compliance, { id: crypto.randomUUID(), item: nu.item.trim(), detail: nu.detail.trim(), due: nu.due || undefined, status: 'ok' }]); setNu({ item: '', detail: '', due: '' }); setAdding(false) }} className="btn btn-red btn-sm disabled:opacity-40">Add</button><button onClick={() => setAdding(false)} className="btn btn-ghost btn-sm">Cancel</button></div>
      </div>}
      <div className="plate p-5 mb-4 flex items-center gap-5">
        <div className="font-display font-extrabold text-[48px] leading-none">{ok}<span className="text-graphite-400 text-[26px]">/{compliance.length}</span></div>
        <div className="flex-1"><div className="h-2 bg-onyx-600"><div className="h-full bg-signal-green" style={{ width: (compliance.length ? ok / compliance.length * 100 : 0) + '%' }} /></div><p className="text-[13.5px] text-graphite-300 mt-2">Items in good standing. Federal and state bids need SAM.gov and eVA before CWN can submit.</p></div>
      </div>
      <Panel pad={false}>
        <ul className="divide-y divide-white/[.05]">
          {compliance.map(c => {
            const d = daysUntil(c.due)
            return (
              <li key={c.id} className="grid sm:grid-cols-[28px_1fr_auto] gap-3 sm:gap-4 px-4 py-4 items-start">
                {ICON[c.status]}
                <div>
                  <div className="font-semibold text-[15px]">{c.item}</div>
                  <input className="w-full bg-transparent text-[13.5px] text-graphite-300 border-b border-transparent hover:border-white/15 focus:border-crimson outline-none" value={c.detail} onChange={e => patch(c.id, { detail: e.target.value })} placeholder="Add a note" />
                  <div className={`text-[12px] font-mono mt-1 flex items-center gap-2 ${d !== null && d < 60 ? 'text-signal-amber' : 'text-graphite-400'}`}>
                    <span>Due</span><input type="date" className="bg-transparent border-b border-white/10 focus:border-crimson outline-none [color-scheme:dark]" value={c.due?.slice(0, 10) ?? ''} onChange={e => patch(c.id, { due: e.target.value || undefined })} />
                    {c.due && <span>{shortDate(c.due)} {d !== null && `· ${d} days`}</span>}
                  </div>
                  {LINKS[c.id] && <a href={LINKS[c.id]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-crimson-400 hover:underline mt-1">Open portal <ExternalLink size={11} /></a>}
                </div>
                <div className="flex items-center gap-1">
                  <select value={c.status} onChange={e => set(c.id, e.target.value as Comp['status'])} className="input h-9 text-[13px] w-36">
                    <option value="ok">Good standing</option><option value="soon">Renew soon</option><option value="action">Action needed</option><option value="missing">Missing</option>
                  </select>
                  <button onClick={() => setCompliance(compliance.filter(x => x.id !== c.id))} className="p-2 text-graphite-400 hover:text-crimson-400" title="Remove item"><Trash2 size={14} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}
