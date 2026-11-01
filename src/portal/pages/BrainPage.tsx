import { useMemo, useState } from 'react'
import { BadgeCheck, Brain as BrainIcon, CircleHelp, RotateCcw } from 'lucide-react'
import { usePortal } from '../store'
import { DEFAULT_BRAIN } from '../../brain/cwn'
import { brainCompleteness, scoreOpp } from '../../brain/score'
import type { Brain } from '../../brain/types'
import { PageHead, Panel, ScoreRing, Toggle, Verdict, usd } from '../../components/ui'

const STATES = ['VA', 'NC', 'MD', 'DC', 'DE', 'PA', 'WV', 'SC', 'NJ', 'GA', 'TN']
const CERTS = ['SWaM', 'DBE', 'MBE', 'Small Business', 'VOSB', 'SDVOSB', '8(a)', 'HUBZone', 'WOSB']
const NEVER = ['Hazmat', 'Livestock', 'Household moves', 'Cold chain', 'Oversize']

export default function BrainPage() {
  const { brain, setBrain, opps, scored, log } = usePortal()
  const [b, setB] = useState<Brain>(brain)
  const dirty = JSON.stringify(b) !== JSON.stringify(brain)
  const comp = brainCompleteness(b)
  const preview = useMemo(() => opps.map(o => ({ o, now: scoreOpp(o, b), was: scored.find(x => x.id === o.id)?.s })).sort((a, z) => z.now.score - a.now.score), [opps, b, scored])
  const up = (fn: (x: Brain) => void) => setB(prev => { const n = structuredClone(prev); fn(n); return n })
  const toggleIn = (arr: string[], v: string) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  return (
    <>
      <PageHead eyebrow="Company Brain" title="What the Brain knows about CWN"
        sub="Every bid and lead is scored against these facts and rules. Change anything and watch the rankings move on the right before you save."
        right={<div className="flex gap-2">
          <button onClick={() => setB(DEFAULT_BRAIN)} className="btn btn-ghost btn-sm"><RotateCcw size={14} /> Defaults</button>
          <button disabled={!dirty} onClick={() => { setBrain(b); log('Company Brain updated, all opportunities re-scored', 'brain', 'Company Brain') }} className="btn btn-red disabled:opacity-40">Save & re-score</button>
        </div>} />

      <div className="grid xl:grid-cols-[1.25fr_1fr] gap-4">
        <div className="space-y-4">
          <Panel title={<span className="flex items-center gap-2"><BadgeCheck size={16} className="text-signal-green" /> Verified facts (FMCSA)</span>}>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              {[['Legal name', b.company.legalName], ['Owner / officer', b.company.owner], ['USDOT · MC', `${b.company.usdot} · ${b.company.mc}`], ['Authority', b.company.operation], ['Authority served', b.company.authorityServed], ['Auto liability', `${usd(b.insurance.autoLiability)} · ${b.insurance.insurer}`], ['Cargo class', b.company.cargo.join(', ')], ['MCS-150 filed', b.company.mcs150], ['Phone', `${b.company.phone} · cell ${b.company.cell}`], ['Email', b.company.email]].map(([k, v]) => (
                <div key={k}><dt className="label">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </Panel>

          <Panel title="Equipment & drivers">
            <div className="grid gap-2">
              {b.fleet.map((t, i) => (
                <div key={t.id} className="grid grid-cols-[70px_1fr_auto] sm:grid-cols-[70px_1fr_150px_130px] gap-3 items-center bg-onyx-750 px-3 py-2.5">
                  <span className="font-display font-extrabold text-[20px]">#{t.unit}</span>
                  <span className="text-[14px]">{t.label}</span>
                  <select className="input h-9 text-[13px] hidden sm:block" value={t.liftgate === null ? 'unknown' : t.liftgate ? 'yes' : 'no'} onChange={e => up(x => { x.fleet[i].liftgate = e.target.value === 'unknown' ? null : e.target.value === 'yes' })}>
                    <option value="unknown">Liftgate: unknown</option><option value="yes">Liftgate: yes</option><option value="no">Liftgate: no</option>
                  </select>
                  <select className="input h-9 text-[13px]" value={t.status} onChange={e => up(x => { x.fleet[i].status = e.target.value as never })}><option value="active">Active</option><option value="shop">In shop</option><option value="planned">Planned</option></select>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">
              <label><span className="label">Drivers</span><input type="number" className="input" value={b.drivers.total} onChange={e => up(x => { x.drivers.total = +e.target.value })} /></label>
              <label><span className="label">CDL holders</span><input type="number" className="input" value={b.drivers.cdl} onChange={e => up(x => { x.drivers.cdl = +e.target.value })} /></label>
              <label><span className="label">Cargo insurance ($)</span><input type="number" className="input" placeholder="unknown" value={b.insurance.cargo ?? ''} onChange={e => up(x => { x.insurance.cargo = e.target.value ? +e.target.value : null })} /></label>
            </div>
          </Panel>

          <Panel title="Registrations & certifications">
            <div className="grid sm:grid-cols-3 gap-x-6">
              <Toggle label="SAM.gov active" on={!!b.registrations.sam} onChange={v => up(x => { x.registrations.sam = v })} />
              <Toggle label="eVA registered" on={!!b.registrations.eva} onChange={v => up(x => { x.registrations.eva = v })} />
              <Toggle label="USPS Logistics Gateway" on={!!b.registrations.usps} onChange={v => up(x => { x.registrations.usps = v })} />
            </div>
            <div className="label mt-4">Certifications held</div>
            <div className="flex flex-wrap gap-2">{CERTS.map(c => <button key={c} onClick={() => up(x => { x.registrations.certifications = toggleIn(x.registrations.certifications, c) })} className={`chip h-8 px-3 ring-1 ${b.registrations.certifications.includes(c) ? 'bg-crimson text-white ring-crimson' : 'bg-transparent text-graphite-200 ring-white/15'}`}>{c}</button>)}</div>
          </Panel>

          <Panel title="Service area & freight rules">
            <label className="block"><span className="label">Core radius from Chesterfield: <b className="text-ivory">{b.service.radiusMiles} mi</b></span><input type="range" min={50} max={600} step={10} value={b.service.radiusMiles} onChange={e => up(x => { x.service.radiusMiles = +e.target.value })} className="w-full accent-crimson" /></label>
            <div className="label mt-4">Preferred delivery states</div>
            <div className="flex flex-wrap gap-2">{STATES.map(s => <button key={s} onClick={() => up(x => { x.service.preferredStates = toggleIn(x.service.preferredStates, s) })} className={`chip h-8 px-3 ring-1 ${b.service.preferredStates.includes(s) ? 'bg-ivory text-onyx ring-ivory' : 'text-graphite-300 ring-white/15'}`}>{s}</button>)}</div>
            <div className="label mt-4">Never haul</div>
            <div className="flex flex-wrap gap-2">{NEVER.map(s => <button key={s} onClick={() => up(x => { x.service.neverHaul = toggleIn(x.service.neverHaul, s) })} className={`chip h-8 px-3 ring-1 ${b.service.neverHaul.includes(s) ? 'bg-crimson/20 text-crimson-400 ring-crimson/50' : 'text-graphite-300 ring-white/15'}`}>{s}</button>)}</div>
          </Panel>

          <Panel title="Money rules" right={<span className="text-[11px] font-mono uppercase tracking-[.14em] text-signal-amber">Assumed until Lawrence confirms</span>}>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {([['rateFloorPerMile', 'Rate floor ($/mi)', 1.5, 5, .05], ['costPerMile', 'Cost per mile ($)', 1, 3.5, .05], ['minPerLoad', 'Minimum per load ($)', 150, 900, 25], ['weeklyTargetPerTruck', 'Weekly target per truck ($)', 2000, 9000, 250]] as const).map(([k, l, mn, mx, st]) => (
                <label key={k} className="block"><span className="label flex justify-between">{l}<b className="text-ivory">{k.includes('PerMile') || k === 'costPerMile' ? '$' + b.money[k].toFixed(2) : usd(b.money[k])}</b></span><input type="range" min={mn} max={mx} step={st} value={b.money[k]} onChange={e => up(x => { x.money[k] = +e.target.value })} className="w-full accent-crimson" /></label>
              ))}
            </div>
          </Panel>

          <Panel title="Goals & scoring weights">
            <div className="grid sm:grid-cols-2 gap-x-6">
              <Toggle label="Go after government contracts" on={b.goals.govContracts} onChange={v => up(x => { x.goals.govContracts = v })} />
              <Toggle label="Prioritize dedicated / recurring routes" on={b.goals.dedicatedRoutes} onChange={v => up(x => { x.goals.dedicatedRoutes = v })} />
              <Toggle label="Planning truck #3" on={b.goals.thirdTruck} onChange={v => up(x => { x.goals.thirdTruck = v })} />
              <Toggle label="Interested in broker authority" on={b.goals.brokerAuthority} onChange={v => up(x => { x.goals.brokerAuthority = v })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-5">
              {(Object.keys(b.weights) as (keyof Brain['weights'])[]).map(k => (
                <label key={k} className="block"><span className="label flex justify-between capitalize">{k}<b className="text-ivory">{b.weights[k]}</b></span><input type="range" min={0} max={50} value={b.weights[k]} onChange={e => up(x => { x.weights[k] = +e.target.value })} className="w-full accent-crimson" /></label>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20 self-start">
          <Panel title={<span className="flex items-center gap-2"><BrainIcon size={16} className="text-crimson-400" /> Knowledge</span>}>
            <div className="flex items-center gap-4">
              <ScoreRing score={comp} v={comp >= 75 ? 'Go' : 'Maybe'} size={78} />
              <p className="text-[13.5px] text-graphite-300">Check off each fact once Lawrence answers it in the intake. Fill in the matching setting on the left.</p>
            </div>
            <ul className="mt-4 space-y-1">
              {DEFAULT_BRAIN.unknowns.map(u => {
                const open = b.unknowns.includes(u)
                return (
                  <li key={u}><button onClick={() => up(x => { x.unknowns = toggleIn(x.unknowns, u) })} className="flex items-center gap-2.5 w-full text-left py-1.5 text-[13.5px]">
                    {open ? <CircleHelp size={16} className="text-signal-amber shrink-0" /> : <BadgeCheck size={16} className="text-signal-green shrink-0" />}
                    <span className={open ? '' : 'line-through text-graphite-400'}>{u}</span>
                  </button></li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Live re-score preview" pad={false}>
            <div className="divide-y divide-white/[.05] max-h-[520px] overflow-y-auto">
              {preview.map(({ o, now, was }) => {
                const delta = was ? now.score - was.score : 0
                return (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-display font-extrabold text-[20px] w-9 text-right">{now.score}</span>
                    <span className={`font-mono text-[11px] w-9 ${delta > 0 ? 'text-signal-green' : delta < 0 ? 'text-crimson-400' : 'text-graphite-500 opacity-0'}`}>{delta > 0 ? '+' : ''}{delta || '0'}</span>
                    <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold truncate">{o.title}</div><div className="text-[12px] text-graphite-400 truncate">{o.org}</div></div>
                    <Verdict v={now.verdict} />
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
