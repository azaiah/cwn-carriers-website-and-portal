import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, ExternalLink, Info, MinusCircle, PlusCircle, Search, Send, Sparkles } from 'lucide-react'
import { usePortal, type ScoredOpp } from '../store'
import { Drawer, Empty, PageHead, ScoreRing, Verdict, daysUntil, shortDate, usd } from '../../components/ui'
import { draftOutreach } from '../outreach'
import { LanesMap } from '../../components/LanesMap'
import type { OppStatus } from '../../brain/types'

const KINDS = [['all', 'All'], ['bid', 'Bids'], ['lead', 'Leads'], ['partner', 'Partners'], ['load', 'Loads']] as const
const VERD = ['All', 'Go', 'Maybe', 'Pass'] as const

export default function Opportunities() {
  const { scored, setOppStatus, addOutreach, brain, log } = usePortal()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [kind, setKind] = useState<string>('all')
  const [verd, setVerd] = useState<string>('All')
  const [q, setQ] = useState('')
  const [showPassed, setShowPassed] = useState(false)
  const selId = params.get('id')
  const sel = scored.find(o => o.id === selId) ?? null

  const list = useMemo(() => scored.filter(o =>
    (kind === 'all' || o.kind === kind) && (verd === 'All' || o.s.verdict === verd) && (showPassed || o.status !== 'passed') &&
    (!q || `${o.title} ${o.org} ${o.origin.city} ${o.tags?.join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [scored, kind, verd, q, showPassed])

  const counts = { Go: scored.filter(o => o.s.verdict === 'Go').length, Maybe: scored.filter(o => o.s.verdict === 'Maybe').length, Pass: scored.filter(o => o.s.verdict === 'Pass').length }
  const open = (o: ScoredOpp) => setParams({ id: o.id })
  const close = () => setParams({})
  const status = (o: ScoredOpp, s: OppStatus) => { setOppStatus(o.id, s); log(`${o.title}: marked ${s}`, 'bid') }
  const draft = (o: ScoredOpp) => {
    const d = draftOutreach(o, brain)
    addOutreach({ id: crypto.randomUUID(), oppId: o.id, to: o.contact || o.org, channel: d.channel, subject: d.subject, body: d.body, status: 'draft', created: new Date().toISOString() })
    if (o.status === 'new') setOppStatus(o.id, 'pursuing')
    log(`Outreach drafted for ${o.org}`, 'brain', 'Company Brain')
    nav('/portal/outreach')
  }

  return (
    <>
      <PageHead eyebrow="Bid & lead finder" title="Opportunities" sub="Every bid, prospect, partner program and load, scored by the Company Brain against CWN's trucks, insurance, lanes and money rules." />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {(['Go', 'Maybe', 'Pass'] as const).map(v => (
          <button key={v} onClick={() => setVerd(verd === v ? 'All' : v)} className={`plate p-4 text-left transition ${verd === v ? 'ring-1 ring-crimson' : ''}`}>
            <div className="flex items-center justify-between"><Verdict v={v} /><span className="font-display font-extrabold text-[30px] leading-none">{counts[v]}</span></div>
            <div className="text-[12.5px] text-graphite-300 mt-2">{v === 'Go' ? 'Pursue now' : v === 'Maybe' ? 'Worth a look, with gaps' : 'Blocked or poor fit'}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-onyx-850 ring-1 ring-white/[.06]">
          {KINDS.map(([k, l]) => <button key={k} onClick={() => setKind(k)} className={`px-3.5 h-9 text-[13px] font-semibold ${kind === k ? 'bg-crimson text-white' : 'text-graphite-200 hover:text-white'}`}>{l}</button>)}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" /><input className="input h-9 pl-9 text-[14px]" placeholder="Search org, city, tag…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-[13px] text-graphite-300 ml-auto"><input type="checkbox" checked={showPassed} onChange={e => setShowPassed(e.target.checked)} className="accent-crimson" /> Show passed</label>
        {VERD.includes(verd as never) && verd !== 'All' && <button onClick={() => setVerd('All')} className="chip bg-white/5 text-graphite-200">Verdict: {verd} ✕</button>}
      </div>

      <div className="grid gap-2.5">
        {list.map(o => {
          const due = daysUntil(o.dueDate)
          const lead = o.s.reasons.find(r => r.kind === 'stop') ?? o.s.reasons.find(r => r.kind === 'plus')
          return (
            <button key={o.id} onClick={() => open(o)} className="plate text-left p-4 grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center hover:ring-1 hover:ring-crimson/40 transition">
              <ScoreRing score={o.s.score} v={o.s.verdict} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="chip bg-white/5 text-graphite-200">{o.kind}</span>
                  <span className="font-mono text-[11px] text-graphite-400">{o.source}</span>
                  {o.sample && <span className="chip bg-white/5 text-graphite-400 ring-1 ring-white/10" title="Illustrative format. The live sweep replaces these with real postings.">Sample</span>}
                  {o.tags?.includes('Inbound') && <span className="chip bg-crimson text-white">New inbound</span>}
                  {o.status !== 'new' && <span className="chip bg-signal-blue/15 text-signal-blue">{o.status}</span>}
                </div>
                <div className="font-display font-bold uppercase text-[19px] leading-tight">{o.title}</div>
                <div className="text-[13.5px] text-graphite-300 mt-0.5">{o.org} · {o.origin.city}, {o.origin.state}{o.destination ? ` → ${o.destination.city}, ${o.destination.state}` : ''} · {o.s.distance < 5 ? 'local to HQ' : `${o.s.distance} mi from HQ`}</div>
                {lead && <div className={`text-[13px] mt-1.5 flex items-center gap-1.5 ${lead.kind === 'stop' ? 'text-crimson-400' : 'text-signal-green'}`}>{lead.kind === 'stop' ? <Ban size={13} /> : <PlusCircle size={13} />}{lead.text}</div>}
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                <Verdict v={o.s.verdict} />
                <div className="font-display font-extrabold text-[20px]">{usd(o.estValue)}<span className="text-[12px] text-graphite-400 font-sans font-medium">{o.valueBasis === 'annual' ? '/yr' : '/load'}</span></div>
                {due !== null && <div className={`text-[12px] font-mono ${due <= 3 ? 'text-crimson-400' : 'text-graphite-400'}`}>{due < 0 ? 'Closed' : `Due in ${due}d`}</div>}
              </div>
            </button>
          )
        })}
        {!list.length && <Empty>No opportunities match these filters.</Empty>}
      </div>

      <Drawer open={!!sel} onClose={close} wide title={sel ? `${sel.kind.toUpperCase()} · ${sel.org}` : ''}>
        {sel && (
          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <ScoreRing score={sel.s.score} v={sel.s.verdict} size={84} />
              <div className="flex-1">
                <h2 className="font-display font-extrabold uppercase text-[28px] leading-tight">{sel.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2"><Verdict v={sel.s.verdict} /><span className="chip bg-white/5 text-graphite-200">Grade {sel.s.grade}</span>{sel.sample && <span className="chip bg-white/5 text-graphite-400">Sample format</span>}{sel.naics && <span className="chip bg-white/5 text-graphite-200">NAICS {sel.naics}</span>}</div>
              </div>
            </div>
            <p className="text-graphite-200 leading-relaxed">{sel.summary}</p>
            {sel.why && <div className="border-l-[3px] border-crimson bg-crimson/[.07] p-4"><div className="eyebrow mb-1 flex items-center gap-1.5"><Sparkles size={12} /> Why it fits CWN</div><p className="text-[14.5px] leading-relaxed">{sel.why}</p></div>}

            <div>
              <div className="label mb-2">How the Brain scored it</div>
              <ul className="space-y-2">
                {sel.s.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px]">
                    {r.kind === 'stop' ? <Ban size={16} className="text-crimson-400 mt-0.5 shrink-0" /> : r.kind === 'plus' ? <PlusCircle size={16} className="text-signal-green mt-0.5 shrink-0" /> : r.kind === 'minus' ? <MinusCircle size={16} className="text-signal-amber mt-0.5 shrink-0" /> : <Info size={16} className="text-graphite-300 mt-0.5 shrink-0" />}
                    <span className={r.kind === 'stop' ? 'text-crimson-400 font-semibold' : ''}>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10">
              {[['Value', `${usd(sel.estValue)}${sel.valueBasis === 'annual' ? '/yr' : ''}`], ['Posted', shortDate(sel.postedDate)], ['Due', shortDate(sel.dueDate)], ['Distance', `${sel.s.distance} mi`]].map(([k, v]) => <div key={k} className="bg-onyx-850 p-3"><div className="label">{k}</div><div className="font-display font-bold text-[20px]">{v}</div></div>)}
            </div>

            <div className="bg-onyx-800 ring-1 ring-white/[.06]"><LanesMap fit={!!sel.destination} className="w-full h-auto" radius={sel.destination ? undefined : brain.service.radiusMiles} lanes={sel.destination ? [{ from: sel.origin, to: sel.destination, animated: true }] : []} pins={[{ at: sel.origin, label: sel.origin.city, tone: 'red' }, ...(sel.destination ? [{ at: sel.destination, label: sel.destination.city }] : [])]} /></div>

            {sel.contact && <div className="text-[14px]"><span className="label">Contact</span>{sel.contact}</div>}
            {sel.sourceUrl && <a href={sel.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] text-crimson-400 hover:underline">Source: {sel.source} <ExternalLink size={13} /></a>}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <button onClick={() => draft(sel)} className="btn btn-red"><Send size={15} /> Draft outreach</button>
              <button onClick={() => status(sel, 'pursuing')} className="btn btn-ghost btn-sm">Pursue</button>
              <button onClick={() => status(sel, 'submitted')} className="btn btn-ghost btn-sm">Submitted</button>
              <button onClick={() => status(sel, 'won')} className="btn btn-ghost btn-sm"><CheckCircle2 size={14} /> Won</button>
              <button onClick={() => { status(sel, 'passed'); close() }} className="btn btn-ghost btn-sm">Pass</button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  )
}
