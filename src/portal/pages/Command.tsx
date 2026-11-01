import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AlertTriangle, ArrowRight, Brain, DollarSign, Loader2, Radar, RefreshCw, Truck } from 'lucide-react'
import { usePortal } from '../store'
import { loadStats } from '../calc'
import { LanesMap } from '../../components/LanesMap'
import { PageHead, Panel, ScoreRing, Stat, Verdict, ago, shortDate, timeOf, usd } from '../../components/ui'
import { brainCompleteness } from '../../brain/score'

export default function Command() {
  const { user, loads, scored, brain, compliance, activity, lastSweep, runSweep, log } = usePortal()
  const [sweeping, setSweeping] = useState(false)
  const st = loadStats(loads, brain)
  const top = scored.filter(o => !o.sample && o.status !== 'passed' && o.s.verdict !== 'Pass').slice(0, 5)
  const go = scored.filter(o => o.s.verdict === 'Go').length
  const alerts = compliance.filter(c => c.status !== 'ok')
  const pct = Math.min(100, Math.round((st.weekRevenue / st.weeklyTarget) * 100))
  const comp = brainCompleteness(brain)
  const hour = new Date().getHours()

  const sweep = async () => {
    setSweeping(true)
    const n = await runSweep()
    log(n ? `Sweep pulled ${n} new opportunities` : 'Sweep complete: no new postings since last run', 'brain', 'Company Brain')
    setSweeping(false)
  }

  return (
    <>
      <PageHead eyebrow="Command center" title={`Good ${hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, ${user}`}
        sub={`${st.moving.length} load${st.moving.length === 1 ? '' : 's'} on the road, ${st.booked.length} booked, and the Brain has ${go} opportunities rated Go.`}
        right={<button onClick={sweep} disabled={sweeping} className="btn btn-red">{sweeping ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {sweeping ? 'Sweeping…' : 'Run sweep now'}</button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <Stat accent label="Revenue · 7 days" value={usd(st.weekRevenue)} icon={<DollarSign size={16} />}
          hint={<div><div className="h-1.5 bg-onyx-600 mt-1 overflow-hidden"><div className="h-full bg-crimson" style={{ width: pct + '%' }} /></div><div className="mt-1.5">{pct}% of {usd(st.weeklyTarget)} weekly target</div></div>} />
        <Stat label="Loads in motion" value={st.moving.length} icon={<Truck size={16} />} hint={`${st.booked.length} booked · ${st.quoted.length} quoted (${usd(st.pipelineValue)})`} />
        <Stat label="Brain: Go rated" value={go} icon={<Radar size={16} />} hint={`Last sweep ${ago(lastSweep)}`} />
        <Stat label="Receivables" value={usd(st.receivable)} icon={<DollarSign size={16} />} hint={`${st.receivableCount} invoices open · ${st.rpm ? '$' + st.rpm.toFixed(2) + '/mi avg' : ''}`} />
      </div>

      <div className="grid xl:grid-cols-[1.35fr_1fr] gap-4 mt-4">
        <Panel title="Live board" right={<Link to="/portal/dispatch" className="text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300 hover:text-white flex items-center gap-1">Dispatch <ArrowRight size={13} /></Link>} pad={false}>
          <div className="grid md:grid-cols-[1.1fr_1fr]">
            <div className="bg-onyx-850 border-r border-white/[.06] min-h-[280px] relative">
              <LanesMap fit className="absolute inset-0 w-full h-full" showLabels={false}
                lanes={[...st.moving, ...st.booked].map(l => ({ from: l.origin, to: l.destination, tone: l.status === 'transit' ? 'red' as const : 'ivory' as const, animated: l.status === 'transit' }))}
                pins={[...st.moving, ...st.booked].map(l => ({ at: l.destination, tone: l.status === 'transit' ? 'red' as const : 'ivory' as const, size: 4 }))} />
            </div>
            <div className="divide-y divide-white/[.05]">
              {[...st.moving, ...st.booked].slice(0, 5).map(l => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[12px] text-graphite-300">{l.ref}</span>
                    <span className={`chip ${l.status === 'transit' ? 'bg-crimson/20 text-crimson-400' : l.status === 'dispatched' ? 'bg-signal-blue/15 text-signal-blue' : 'bg-white/5 text-graphite-200'}`}>{l.status === 'transit' ? 'In transit' : l.status}</span>
                  </div>
                  <div className="font-display font-bold text-[18px] uppercase mt-1">{l.origin.city} → {l.destination.city}</div>
                  <div className="text-[13px] text-graphite-300">{l.pallets} plt · {l.customer} · {l.truck ? `Unit ${l.truck} · ${l.driver}` : <span className="text-signal-amber">Needs truck</span>} · {shortDate(l.pickup)} {timeOf(l.pickup)}</div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={<span className="flex items-center gap-2"><Brain size={16} className="text-crimson-400" /> Top real prospects</span>} right={<Link to="/portal/opportunities" className="text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300 hover:text-white flex items-center gap-1">All <ArrowRight size={13} /></Link>} pad={false}>
          <div className="divide-y divide-white/[.05]">
            {top.map(o => (
              <Link to={`/portal/opportunities?id=${o.id}`} key={o.id} className="flex gap-3.5 px-4 py-3 hover:bg-white/[.03]">
                <ScoreRing score={o.s.score} v={o.s.verdict} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-[10.5px] uppercase tracking-[.14em] text-graphite-400">{o.kind}</span><span className="text-[10px] font-mono text-graphite-400">· {o.source}</span></div>
                  <div className="font-semibold text-[14.5px] leading-snug truncate">{o.title}</div>
                  <div className="text-[12.5px] text-graphite-300 truncate">{o.org} · {o.s.distance} mi</div>
                </div>
                <Verdict v={o.s.verdict} />
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Company Brain" right={<Link to="/portal/brain" className="text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300 hover:text-white">Tune</Link>}>
          <div className="flex items-center gap-4">
            <ScoreRing score={comp} v={comp >= 75 ? 'Go' : 'Maybe'} size={72} />
            <div><div className="font-display font-bold uppercase text-[18px]">Knowledge {comp}%</div><p className="text-[13.5px] text-graphite-300">{brain.unknowns.length} facts still needed from Lawrence. Each one sharpens the scoring.</p></div>
          </div>
          <ul className="mt-4 space-y-1.5 text-[13.5px]">{brain.unknowns.slice(0, 4).map(u => <li key={u} className="flex gap-2 text-graphite-200"><span className="w-1.5 h-1.5 bg-signal-amber mt-2 shrink-0" />{u}</li>)}</ul>
        </Panel>
        <Panel title="Needs attention" right={<Link to="/portal/compliance" className="text-[12px] font-mono uppercase tracking-[.14em] text-graphite-300 hover:text-white">Compliance</Link>}>
          <ul className="space-y-3">
            {alerts.slice(0, 5).map(a => (
              <li key={a.id} className="flex gap-3"><AlertTriangle size={16} className={`${a.status === 'missing' ? 'text-crimson-400' : 'text-signal-amber'} mt-0.5 shrink-0`} /><div><div className="text-[14px] font-semibold">{a.item}</div><div className="text-[12.5px] text-graphite-300">{a.detail}</div></div></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Activity">
          <ul className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {activity.slice(0, 10).map(a => (
              <li key={a.id} className="flex gap-3">
                <span className={`w-1 shrink-0 ${a.kind === 'brain' ? 'bg-crimson' : a.kind === 'money' ? 'bg-signal-green' : a.kind === 'bid' ? 'bg-signal-amber' : 'bg-graphite'}`} />
                <div><div className="text-[13.5px] leading-snug">{a.text}</div><div className="text-[11.5px] text-graphite-400 font-mono mt-0.5">{a.who} · {ago(a.at)}</div></div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
