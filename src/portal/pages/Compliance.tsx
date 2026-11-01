import { AlertTriangle, CheckCircle2, CircleDashed, ExternalLink, XCircle } from 'lucide-react'
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
  const ok = compliance.filter(c => c.status === 'ok').length
  return (
    <>
      <PageHead eyebrow="Compliance vault" title="Authority, insurance & registrations" sub="Everything a broker, shipper or contracting officer will ask for, with renewal dates tracked so nothing lapses." />
      <div className="plate p-5 mb-4 flex items-center gap-5">
        <div className="font-display font-extrabold text-[48px] leading-none">{ok}<span className="text-graphite-400 text-[26px]">/{compliance.length}</span></div>
        <div className="flex-1"><div className="h-2 bg-onyx-600"><div className="h-full bg-signal-green" style={{ width: ok / compliance.length * 100 + '%' }} /></div><p className="text-[13.5px] text-graphite-300 mt-2">Items in good standing. Federal and state bids need SAM.gov and eVA before CWN can submit.</p></div>
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
                  <div className="text-[13.5px] text-graphite-300">{c.detail}</div>
                  {c.due && <div className={`text-[12px] font-mono mt-1 ${d !== null && d < 60 ? 'text-signal-amber' : 'text-graphite-400'}`}>Due {shortDate(c.due)} {d !== null && `· ${d} days`}</div>}
                  {LINKS[c.id] && <a href={LINKS[c.id]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-crimson-400 hover:underline mt-1">Open portal <ExternalLink size={11} /></a>}
                </div>
                <select value={c.status} onChange={e => set(c.id, e.target.value as Comp['status'])} className="input h-9 text-[13px] w-36">
                  <option value="ok">Good standing</option><option value="soon">Renew soon</option><option value="action">Action needed</option><option value="missing">Missing</option>
                </select>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}
