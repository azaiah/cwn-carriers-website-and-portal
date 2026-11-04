import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Truck } from 'lucide-react'
import { usePortal, type ScoredOpp } from '../store'
import { KIND_META, KindBadge, PageHead, Verdict, shortDate, usd, type KindKey } from '../../components/ui'
import { COLUMN, PIPE, stageWord } from '../stages'
import type { OppStatus } from '../../brain/types'

const KINDS: ('all' | KindKey)[] = ['all', 'load', 'bid', 'lead', 'partner']

export default function Pipeline() {
  const { scored, setOppStatus, log, loads } = usePortal()
  const nav = useNavigate()
  const [kind, setKind] = useState<'all' | KindKey>('all')
  const [hidePass, setHidePass] = useState(true)
  const items = useMemo(() => scored.filter(o => (kind === 'all' || o.kind === kind) && !(hidePass && o.s.verdict === 'Pass' && o.status === 'new')), [scored, kind, hidePass])
  const count = (k: 'all' | KindKey) => scored.filter(o => (k === 'all' || o.kind === k) && o.status !== 'passed').length
  const move = (o: ScoredOpp, dir: 1 | -1) => {
    const i = PIPE.indexOf(o.status as OppStatus)
    const next = PIPE[Math.min(PIPE.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))]
    setOppStatus(o.id, next); log(`${KIND_META[o.kind].label}: ${o.title} → ${stageWord(o.kind, next)}`, o.kind === 'load' ? 'load' : 'bid')
  }
  const open = (o: ScoredOpp) => nav(o.kind === 'load' ? `/portal/loads?id=${o.id}` : `/portal/opportunities?id=${o.id}`)
  const totals = PIPE.map(s => items.filter(o => o.status === s))
  const pipeValue = items.filter(o => ['pursuing', 'submitted'].includes(o.status)).reduce((a, o) => a + o.estValue, 0)

  return (
    <>
      <PageHead eyebrow="Pipeline" title="Everything you're chasing" sub="Loads, bids, leads and partner programs in one board, from found to won. Move a card as it progresses. Booked loads go straight to Dispatch."
        right={<div className="text-right"><div className="label">In play (working + sent)</div><div className="font-display font-extrabold text-[26px]">{usd(pipeValue)}</div></div>} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex bg-onyx-850 ring-1 ring-white/[.06]">
          {KINDS.map(k => <button key={k} onClick={() => setKind(k)} className={`px-3.5 h-9 text-[13px] font-semibold flex items-center gap-1.5 ${kind === k ? 'bg-crimson text-white' : 'text-graphite-200 hover:text-white'}`}>{k === 'all' ? 'All' : KIND_META[k].plural}<span className="opacity-70 font-mono text-[11px]">{count(k)}</span></button>)}
        </div>
        <label className="flex items-center gap-2 text-[13px] text-graphite-300 ml-auto"><input type="checkbox" checked={hidePass} onChange={e => setHidePass(e.target.checked)} className="accent-crimson" /> Hide new items the Brain rated Pass</label>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {PIPE.map((s, ci) => (
          <div key={s} className="w-[280px] shrink-0">
            <div className="flex items-baseline justify-between mb-2 px-1">
              <div><div className="font-display font-bold uppercase text-[16px]">{COLUMN[s].title}</div><div className="text-[11.5px] text-graphite-400">{COLUMN[s].sub}</div></div>
              <span className="font-mono text-[12px] text-graphite-300">{totals[ci].length}</span>
            </div>
            <div className="space-y-2 min-h-[120px] bg-white/[.015] ring-1 ring-white/[.04] p-2">
              {totals[ci].map(o => {
                const booked = o.kind === 'load' && o.status === 'won' ? loads.find(l => l.id === 'bk-' + o.id) : null
                return (
                  <div key={o.id} className="plate p-3">
                    <button onClick={() => open(o)} className="text-left w-full">
                      <div className="flex items-center gap-1.5 mb-1.5"><KindBadge kind={o.kind} /><Verdict v={o.s.verdict} score={o.s.score} /></div>
                      <div className="font-semibold text-[14px] leading-snug">{o.title}</div>
                      <div className="text-[12px] text-graphite-400 mt-0.5 truncate">{o.org}</div>
                      <div className="flex items-center justify-between mt-1.5 text-[12px]">
                        <span className="font-mono text-graphite-300">{o.estValue ? `${usd(o.estValue)}${o.valueBasis === 'annual' ? '/yr' : ''}` : 'No rate yet'}</span>
                        <span className="text-graphite-400">{o.kind === 'load' ? (o.pickupDate ? `PU ${shortDate(o.pickupDate + 'T12:00')}` : '') : o.dueDate ? `Due ${shortDate(o.dueDate)}` : ''}</span>
                      </div>
                      <div className="text-[11.5px] text-signal-blue mt-1">{stageWord(o.kind, o.status)}</div>
                    </button>
                    {booked && <button onClick={() => nav('/portal/dispatch')} className="mt-2 text-[12px] text-signal-green inline-flex items-center gap-1"><Truck size={12} /> {booked.ref} on Dispatch</button>}
                    <div className="flex justify-between mt-2 pt-2 border-t border-white/[.06]">
                      <button disabled={ci === 0} onClick={() => move(o, -1)} className="text-graphite-400 hover:text-white disabled:opacity-20 p-1" aria-label="Move back"><ArrowLeft size={14} /></button>
                      <button disabled={ci === PIPE.length - 1} onClick={() => move(o, 1)} className="text-graphite-400 hover:text-white disabled:opacity-20 p-1 inline-flex items-center gap-1 text-[12px]" aria-label="Move forward">{ci < PIPE.length - 1 ? stageWord(o.kind, PIPE[ci + 1]) : ''} <ArrowRight size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
