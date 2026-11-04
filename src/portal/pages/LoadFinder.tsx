import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ban, CheckCircle2, ClipboardCopy, ExternalLink, Inbox, Info, MinusCircle, PackageSearch, Plug, PlusCircle, RefreshCw, Send, ShieldCheck, Truck } from 'lucide-react'
import { usePortal, type ScoredOpp } from '../store'
import { Drawer, Empty, KindBadge, PageHead, ScoreRing, Verdict, shortDate, usd } from '../../components/ui'
import { LanesMap } from '../../components/LanesMap'
import { loadGeo } from '../../brain/geo'
import { parseReport } from '../../brain/loadparse'
import { rateCoach, type RateAdvice } from '../../brain/rate'
import type { Opportunity, Place } from '../../brain/types'
import { stageWord } from '../stages'

const EQ: Record<string, string> = { box26: "26' box", box16: "16' box", cargoVan: 'Cargo van', van53: 'Dry van', tractor53: "53' trailer", reefer: 'Reefer', flatbed: 'Flatbed', hotshot: 'Hotshot', powerOnly: 'Power only', any: 'Any truck' }
const SOURCES = ['Broker email', 'Load board (public page)', 'Curri', 'GoShare', 'Amazon Relay', 'TruckSmarter', 'Text message', 'Phone call', 'Other']

const MARKETPLACES = [
  { name: 'Curri carrier portal', url: 'https://carriers.curri.com', how: 'Claim jobs and assign them to your drivers. Copy jobs here to compare them with everything else.' },
  { name: 'Amazon Relay', url: 'https://relay.amazon.com', how: 'Box trucks need a tuck-under liftgate, $100K cargo and $1M/$2M general liability.' },
  { name: 'GoShare', url: 'https://goshare.co', how: 'Local box-truck jobs, accepted in the GoShare app.' },
  { name: 'Frayt', url: 'https://www.frayt.com/drivers', how: 'Box-truck deliveries in 450+ markets.' },
  { name: 'TruckSmarter', url: 'https://www.trucksmarter.com', how: 'Free board that pulls broker loads together. Box truck is a filter.' },
  { name: 'Trucker Tools', url: 'https://www.truckertools.com', how: 'Free. Loads come straight from brokers you request access to.' },
  { name: 'C.H. Robinson', url: 'https://www.chrobinson.com/en-us/carriers/', how: 'Free carrier app, and a free API to send loads into the portal.' },
  { name: 'DAT / Truckstop', url: 'https://www.dat.com/load-boards', how: 'Optional. Connect your own account once the official partner API is approved.' },
]

type Filter = 'fit' | 'maybe' | 'pass' | 'all'
type Sort = 'score' | 'profit' | 'pickup' | 'deadhead'

export default function LoadFinder() {
  const { scored, brain, loads, history, addOpps, setOppStatus, bookLoad, checkInbox, runSweep, addOutreach, log, drivers, lastInbox } = usePortal()
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [geoReady, setGeoReady] = useState(false)
  const [filter, setFilter] = useState<Filter>('fit')
  const [sort, setSort] = useState<Sort>('score')
  const [maxDh, setMaxDh] = useState(150)
  const [from, setFrom] = useState('hq')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { loadGeo().then(() => setGeoReady(true)) }, [])

  // Where the truck starts from: HQ, or where an active load drops.
  const starts = useMemo(() => {
    const list: { id: string; label: string; place: Place }[] = [{ id: 'hq', label: `HQ · ${brain.home.city}, ${brain.home.state}`, place: brain.home }]
    loads.filter(l => ['booked', 'dispatched', 'transit'].includes(l.status) && l.truck).forEach(l =>
      list.push({ id: l.id, label: `Truck ${l.truck} empty in ${l.destination.city}, ${l.destination.state} after ${l.ref}`, place: l.destination }))
    return list
  }, [loads, brain.home])
  const start = starts.find(s => s.id === from) ?? starts[0]

  const all = useMemo(() => scored.filter(o => o.kind === 'load').map(o => ({ o, r: rateCoach(o, brain, history, start.place) })), [scored, brain, history, start])
  const open = all.filter(x => x.o.status !== 'passed' && x.o.status !== 'won')
  const counts = { fit: open.filter(x => x.o.s.verdict === 'Go').length, maybe: open.filter(x => x.o.s.verdict === 'Maybe').length, pass: open.filter(x => x.o.s.verdict === 'Pass').length }
  const list = useMemo(() => {
    const base = open.filter(x => (filter === 'all' || (filter === 'fit' ? x.o.s.verdict === 'Go' : filter === 'maybe' ? x.o.s.verdict === 'Maybe' : x.o.s.verdict === 'Pass')) && (filter === 'pass' || x.r.deadhead <= maxDh))
    const profit = (x: typeof base[number]) => (x.r.posted ?? x.r.target) - x.r.cost
    return [...base].sort((a, b) => sort === 'score' ? b.o.s.score - a.o.s.score : sort === 'profit' ? profit(b) - profit(a) : sort === 'deadhead' ? a.r.deadhead - b.r.deadhead : (a.o.pickupDate ?? '9').localeCompare(b.o.pickupDate ?? '9'))
  }, [open, filter, sort, maxDh])

  const selId = params.get('id')
  const sel = all.find(x => x.o.id === selId) ?? null

  // ---- add loads from pasted text ----
  const [text, setText] = useState('')
  const [src, setSrc] = useState(SOURCES[0])
  const [srcUrl, setSrcUrl] = useState('')
  const preview = useMemo(() => {
    if (!geoReady || !text.trim()) return null
    return parseReport(text, { source: src, sourceUrl: srcUrl || undefined })
  }, [text, src, srcUrl, geoReady])
  const addPreview = () => {
    if (!preview?.loads.length) return
    addOpps(preview.loads)
    log(`Load Finder: added ${preview.loads.length} load${preview.loads.length === 1 ? '' : 's'} from ${src}`, 'brain', 'Load Finder')
    setNote(`${preview.loads.length} load${preview.loads.length === 1 ? '' : 's'} added and scored.`)
    setText(''); setFilter('all')
  }

  const doInbox = async () => {
    setBusy('inbox'); const r = await checkInbox(); setBusy('')
    setNote(r.error ? r.error : r.messages ? `${r.messages} new message${r.messages === 1 ? '' : 's'}, ${r.loads} load${r.loads === 1 ? '' : 's'} found.` : 'No new messages in the inbox.')
  }
  const doSweep = async () => { setBusy('sweep'); const n = await runSweep(); setBusy(''); setNote(n ? `${n} new item${n === 1 ? '' : 's'} from the sweep.` : 'Sweep is up to date.') }

  return (
    <>
      <PageHead eyebrow="Load Finder" title="Find loads" sub="Every load from your inbox, marketplaces, the weekly sweep and anything you paste, in one list. The Company Brain checks each one against your trucks, and the Rate Coach tells you what to ask."
        right={<div className="flex flex-wrap gap-2">
          <button onClick={doInbox} disabled={!!busy} className="btn btn-ghost btn-sm"><Inbox size={14} /> {busy === 'inbox' ? 'Checking…' : 'Check inbox'}</button>
          <button onClick={doSweep} disabled={!!busy} className="btn btn-red btn-sm"><RefreshCw size={14} className={busy === 'sweep' ? 'animate-spin' : ''} /> {busy === 'sweep' ? 'Sweeping…' : 'Run sweep'}</button>
        </div>} />
      {note && <div className="mb-4 flex items-center gap-2 text-[14px] bg-signal-green/10 ring-1 ring-signal-green/30 text-signal-green px-3 py-2"><CheckCircle2 size={15} /> {note}<button onClick={() => setNote('')} className="ml-auto text-graphite-300 hover:text-white">✕</button></div>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        {([['fit', 'Go', 'Fits your trucks'], ['maybe', 'Maybe', 'Check one thing first'], ['pass', 'Pass', 'Wrong truck, too heavy or too far']] as const).map(([k, v, d]) => (
          <button key={k} onClick={() => setFilter(filter === k ? 'all' : k)} className={`plate p-4 text-left transition ${filter === k ? 'ring-1 ring-crimson' : ''}`}>
            <div className="flex items-center justify-between"><Verdict v={v} /><span className="font-display font-extrabold text-[30px] leading-none">{counts[k]}</span></div>
            <div className="text-[12.5px] text-graphite-300 mt-2">{d}</div>
          </button>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div>
          <div className="plate p-3 mb-3 grid sm:grid-cols-[1.4fr_1fr_1fr] gap-3 items-end">
            <label><span className="label">Truck starts from</span><select className="input h-9 text-[14px]" value={start.id} onChange={e => setFrom(e.target.value)}>{starts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <label><span className="label">Max empty miles to pickup: {maxDh}</span><input type="range" min={10} max={300} step={10} value={maxDh} onChange={e => setMaxDh(Number(e.target.value))} className="w-full accent-crimson" /></label>
            <label><span className="label">Sort by</span><select className="input h-9 text-[14px]" value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="score">Best fit</option><option value="profit">Most profit</option><option value="pickup">Pickup date</option><option value="deadhead">Closest pickup</option></select></label>
          </div>

          <div className="grid gap-2.5">
            {list.map(({ o, r }) => <LoadCard key={o.id} o={o} r={r} onOpen={() => setParams({ id: o.id })} onPass={() => { setOppStatus(o.id, 'passed'); log(`Passed on ${o.title}`, 'load') }} />)}
            {!list.length && <Empty>{filter === 'fit' ? 'No loads that fit right now. Paste a broker email or load list on the right, check the inbox, or run the sweep.' : 'Nothing here.'}</Empty>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="plate p-4">
            <div className="flex items-center gap-2 mb-1"><PackageSearch size={16} className="text-crimson-400" /><div className="font-display font-bold uppercase text-[17px]">Add loads</div></div>
            <p className="text-[13px] text-graphite-300 mb-3">Paste a broker's load list, rows from a load board, or a text. The Load Finder reads the lanes, dates, weight, pallets, truck type and rate.</p>
            <textarea rows={7} className="input h-auto py-2 text-[13px] font-mono" placeholder={'PU: Richmond, VA 11/05  DEL: Raleigh, NC\n26\' box · 8 pallets 7,200 lbs · $650\nBroker MC# 123456 (757) 555-0164'} value={text} onChange={e => setText(e.target.value)} />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select className="input h-9 text-[13px]" value={src} onChange={e => setSrc(e.target.value)}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
              <input className="input h-9 text-[13px]" placeholder="Link (optional)" value={srcUrl} onChange={e => setSrcUrl(e.target.value)} />
            </div>
            {preview && <div className="mt-2 text-[13px]">
              {preview.loads.length ? <div className="text-signal-green">Found {preview.loads.length} load{preview.loads.length === 1 ? '' : 's'}: {preview.loads.slice(0, 3).map(l => l.title.replace(/, [A-Z]{2}/g, '')).join(' · ')}{preview.loads.length > 3 ? ' …' : ''}</div> : <div className="text-signal-amber">No lanes found yet. Each load needs a pickup and drop like "Richmond, VA to Raleigh, NC".</div>}
              {preview.skipped.length > 0 && <div className="text-graphite-400 mt-1">Couldn't place {preview.skipped.length} line{preview.skipped.length === 1 ? '' : 's'} (city not recognized).</div>}
            </div>}
            <button disabled={!preview?.loads.length} onClick={addPreview} className="btn btn-red btn-sm w-full mt-3 disabled:opacity-40">Add {preview?.loads.length || ''} load{preview?.loads.length === 1 ? '' : 's'} and score</button>
          </div>

          <div className="plate p-4">
            <div className="flex items-center gap-2 mb-2"><Plug size={16} className="text-crimson-400" /><div className="font-display font-bold uppercase text-[17px]">Where loads come from</div></div>
            <ul className="space-y-2.5">
              <li className="text-[13px]"><div className="font-semibold flex items-center gap-1.5"><Inbox size={13} /> Broker emails</div><div className="text-graphite-300">Forward load-list emails to the portal inbox and press Check inbox.{lastInbox && <> Last checked {shortDate(lastInbox)}.</>}</div></li>
              <li className="text-[13px]"><div className="font-semibold flex items-center gap-1.5"><RefreshCw size={13} /> Weekly sweep</div><div className="text-graphite-300">Government bids, direct shippers and posted loads, added every week.</div></li>
              {MARKETPLACES.map(m => <li key={m.name} className="text-[13px]"><a href={m.url} target="_blank" rel="noreferrer" className="font-semibold inline-flex items-center gap-1 hover:text-crimson-400">{m.name} <ExternalLink size={11} /></a><div className="text-graphite-300">{m.how}</div></li>)}
            </ul>
          </div>
        </div>
      </div>

      <Drawer open={!!sel} onClose={() => setParams({})} wide title={sel ? `LOAD · ${sel.o.source}` : ''}>
        {sel && <LoadDetail o={sel.o} r={sel.r} drivers={drivers.map(d => d.name)} trucks={brain.fleet.filter(t => t.status === 'active').map(t => t.unit)} startLabel={start.label}
          onBook={(rate, truck, driver) => { const ref = bookLoad(sel.o, { rate, truck, driver }); setParams({}); setNote(`Booked as ${ref}. It's on the Dispatch board.`); nav('/portal/dispatch') }}
          onStatus={s => { setOppStatus(sel.o.id, s); log(`${sel.o.title}: ${stageWord('load', s)}`, 'load') }}
          onEmail={() => {
            addOutreach({ id: crypto.randomUUID(), oppId: sel.o.id, to: sel.o.broker?.email || sel.o.broker?.name || sel.o.org, channel: 'Email', subject: `CWN Carriers: ${sel.o.title}${sel.o.pickupDate ? ` (${shortDate(sel.o.pickupDate)})` : ''}`, body: sel.r.script + `\n\nCWN Carriers · USDOT ${brain.company.usdot} · MC ${brain.company.mc}\n${brain.company.phone}`, status: 'draft', created: new Date().toISOString() })
            setOppStatus(sel.o.id, 'pursuing'); log(`Rate email drafted for ${sel.o.title}`, 'brain', 'Rate Coach'); nav('/portal/outreach')
          }} />}
      </Drawer>
    </>
  )
}

function LoadCard({ o, r, onOpen, onPass }: { o: ScoredOpp; r: RateAdvice; onOpen: () => void; onPass: () => void }) {
  const lead = o.s.reasons.find(x => x.kind === 'stop') ?? o.s.reasons.find(x => x.kind === 'minus') ?? o.s.reasons.find(x => x.kind === 'plus')
  const profit = (r.posted ?? r.target) - r.cost
  return (
    <div className="plate p-4 grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center hover:ring-1 hover:ring-crimson/40 transition">
      <button onClick={onOpen}><ScoreRing score={o.s.score} v={o.s.verdict} /></button>
      <button onClick={onOpen} className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <KindBadge kind="load" />
          <span className="chip bg-white/5 text-graphite-200">{EQ[o.equipment]}</span>
          {o.pickupDate && <span className="chip bg-white/5 text-graphite-200">Pickup {shortDate(o.pickupDate + 'T12:00')}</span>}
          <span className="font-mono text-[11px] text-graphite-400">{o.source}</span>
          {o.sample && <span className="chip bg-white/5 text-graphite-400 ring-1 ring-white/10" title="Example of the format. Real loads replace these.">Sample</span>}
          {o.status !== 'new' && <span className="chip bg-signal-blue/15 text-signal-blue">{stageWord('load', o.status)}</span>}
        </div>
        <div className="font-display font-bold uppercase text-[19px] leading-tight">{o.title}</div>
        <div className="text-[13px] text-graphite-300 mt-0.5">{[o.weightLbs ? `${o.weightLbs.toLocaleString()} lbs` : null, o.pallets ? `${o.pallets} pallets` : null, `${r.tripMiles} mi loaded`, `${r.deadhead} mi empty to pickup`, o.broker?.name ?? (o.org !== o.source ? o.org : null)].filter(Boolean).join(' · ')}</div>
        {lead && <div className={`text-[13px] mt-1.5 flex items-center gap-1.5 ${lead.kind === 'stop' ? 'text-crimson-400' : lead.kind === 'minus' ? 'text-signal-amber' : 'text-signal-green'}`}>{lead.kind === 'stop' ? <Ban size={13} /> : lead.kind === 'minus' ? <MinusCircle size={13} /> : <PlusCircle size={13} />}{lead.text}</div>}
      </button>
      <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
        <Verdict v={o.s.verdict} />
        <div className="font-display font-extrabold text-[20px]">{r.posted !== null ? usd(r.posted) : <span className="text-graphite-300 text-[15px]">No rate posted</span>}</div>
        {o.s.verdict !== 'Pass' && <div className="text-[12px] font-mono text-graphite-300">Ask {usd(r.counter)} · floor {usd(r.floor)}</div>}
        {o.s.verdict !== 'Pass' && <div className={`text-[12px] font-mono ${profit > 0 ? 'text-signal-green' : 'text-crimson-400'}`}>≈ {usd(profit)} after costs</div>}
        {o.s.verdict === 'Pass' && <button onClick={onPass} className="text-[12px] text-graphite-400 hover:text-white underline">Hide</button>}
      </div>
    </div>
  )
}

function LoadDetail({ o, r, trucks, drivers, startLabel, onBook, onStatus, onEmail }: {
  o: ScoredOpp; r: RateAdvice; trucks: string[]; drivers: string[]; startLabel: string
  onBook: (rate: number, truck?: string, driver?: string) => void; onStatus: (s: Opportunity['status']) => void; onEmail: () => void
}) {
  const [rate, setRate] = useState(String(r.posted ?? r.counter))
  const [truck, setTruck] = useState(trucks[0] ?? '')
  const [driver, setDriver] = useState(drivers[0] ?? '')
  const [copied, setCopied] = useState(false)
  const verdictText = { take: 'Posted rate is at or above your target. Take it, and get the extras in writing.', counter: 'Posted rate is under your target. Counter with the number below.', walk: 'Posted rate is under your floor. Counter once at your floor, then walk.', ask: 'No rate posted. Call and ask, then open at the counter below.' }[r.verdict]
  const safer = o.broker?.mc ? `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${o.broker.mc}` : null
  return (
    <div className="space-y-6">
      <div className="flex gap-5 items-start">
        <ScoreRing score={o.s.score} v={o.s.verdict} size={84} />
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2"><KindBadge kind="load" size="md" /><Verdict v={o.s.verdict} /><span className="chip bg-white/5 text-graphite-200">{EQ[o.equipment]}</span><span className="chip bg-white/5 text-graphite-200">{stageWord('load', o.status)}</span></div>
          <h2 className="font-display font-extrabold uppercase text-[28px] leading-tight">{o.title}</h2>
          <p className="text-graphite-300 text-[14px] mt-1">{o.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10">
        {[['Pickup', o.pickupDate ? shortDate(o.pickupDate + 'T12:00') : '—'], ['Loaded miles', `${r.tripMiles}`], ['Empty to pickup', `${r.deadhead} mi`], ['Your cost', usd(r.cost)]].map(([k, v]) => <div key={k} className="bg-onyx-850 p-3"><div className="label">{k}</div><div className="font-display font-bold text-[20px]">{v}</div></div>)}
      </div>
      <div className="text-[12px] text-graphite-400 -mt-4">Empty miles counted from: {startLabel}</div>

      {o.s.verdict !== 'Pass' && <div className="ring-1 ring-crimson/40 bg-crimson/[.06] p-4">
        <div className="eyebrow mb-2">Rate Coach</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Floor', r.floor, 'Never go below'], ['Target', r.target, 'What it should pay'], ['Say back', r.counter, 'Your counter'], ['Posted', r.posted, 'What they offered']].map(([k, v, h]) => <div key={k as string}><div className="label">{k}</div><div className={`font-display font-extrabold text-[24px] ${k === 'Say back' ? 'text-crimson-400' : ''}`}>{v === null ? '—' : usd(v as number)}</div><div className="text-[11.5px] text-graphite-400">{h}</div></div>)}
        </div>
        <p className="text-[14px] mt-3"><b>{verdictText}</b></p>
        <p className="text-[12.5px] text-graphite-300 mt-1">{r.basis}. Floor covers about ${(r.cost / Math.max(1, r.tripMiles + r.deadhead)).toFixed(2)}/mi in costs for {r.tripMiles + r.deadhead} total miles plus a margin.</p>
        <div className="mt-3 bg-onyx-850 ring-1 ring-white/10 p-3 text-[14px] leading-relaxed">{r.script}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => { navigator.clipboard?.writeText(r.script); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="btn btn-ghost btn-sm"><ClipboardCopy size={14} /> {copied ? 'Copied' : 'Copy script'}</button>
          <button onClick={onEmail} className="btn btn-ghost btn-sm"><Send size={14} /> Draft email (approve before sending)</button>
        </div>
        <div className="label mt-4 mb-1">Get these on the rate confirmation</div>
        <ul className="text-[13.5px] space-y-1">{r.extras.map(x => <li key={x} className="flex gap-2"><CheckCircle2 size={14} className="text-graphite-400 mt-0.5 shrink-0" />{x}</li>)}</ul>
      </div>}

      <div>
        <div className="label mb-2">How the Brain scored it</div>
        <ul className="space-y-2">
          {o.s.reasons.map((x, i) => (
            <li key={i} className="flex gap-2.5 text-[14px]">
              {x.kind === 'stop' ? <Ban size={16} className="text-crimson-400 mt-0.5 shrink-0" /> : x.kind === 'plus' ? <PlusCircle size={16} className="text-signal-green mt-0.5 shrink-0" /> : x.kind === 'minus' ? <MinusCircle size={16} className="text-signal-amber mt-0.5 shrink-0" /> : <Info size={16} className="text-graphite-300 mt-0.5 shrink-0" />}
              <span className={x.kind === 'stop' ? 'text-crimson-400 font-semibold' : ''}>{x.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-onyx-800 ring-1 ring-white/[.06]"><LanesMap fit className="w-full h-auto" lanes={o.destination ? [{ from: o.origin, to: o.destination, animated: true }] : []} pins={[{ at: o.origin, label: o.origin.city, tone: 'red' }, ...(o.destination ? [{ at: o.destination, label: o.destination.city }] : [])]} /></div>

      <div>
        <div className="label mb-2 flex items-center gap-1.5"><ShieldCheck size={13} /> Broker check before you book</div>
        <div className="text-[14px] space-y-1">
          {o.broker?.name && <div>{o.broker.name}</div>}
          {(o.broker?.phone || o.broker?.email) && <div className="text-graphite-300">{[o.broker?.phone, o.broker?.email].filter(Boolean).join(' · ')}</div>}
          <div className="flex flex-wrap gap-3 mt-1">
            {safer ? <a href={safer} target="_blank" rel="noreferrer" className="text-crimson-400 hover:underline inline-flex items-center gap-1">FMCSA record for MC {o.broker?.mc} <ExternalLink size={12} /></a> : <span className="text-signal-amber">No MC number on this load. Ask for it and check it before booking.</span>}
            <a href="https://highway.com/carriers" target="_blank" rel="noreferrer" className="text-crimson-400 hover:underline inline-flex items-center gap-1">Highway broker check (free) <ExternalLink size={12} /></a>
          </div>
        </div>
      </div>

      {o.sourceUrl && <a href={o.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[14px] text-crimson-400 hover:underline">Source: {o.source} <ExternalLink size={13} /></a>}
      {o.raw && <details className="text-[12.5px]"><summary className="cursor-pointer text-graphite-300">Original text</summary><pre className="whitespace-pre-wrap font-mono bg-onyx-850 p-3 mt-2 text-graphite-200">{o.raw}</pre></details>}

      {o.s.verdict !== 'Pass' && o.status !== 'won' && <div className="pt-3 border-t border-white/10">
        <div className="label mb-2 flex items-center gap-1.5"><Truck size={13} /> Book it</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <label><span className="label">Agreed rate</span><input className="input h-10" inputMode="numeric" value={rate} onChange={e => setRate(e.target.value.replace(/[^\d]/g, ''))} /></label>
          <label><span className="label">Truck</span><select className="input h-10" value={truck} onChange={e => setTruck(e.target.value)}>{trucks.map(t => <option key={t}>{t}</option>)}</select></label>
          <label><span className="label">Driver</span><select className="input h-10" value={driver} onChange={e => setDriver(e.target.value)}>{drivers.map(d => <option key={d}>{d}</option>)}</select></label>
        </div>
        {Number(rate) < r.floor && <div className="text-[13px] text-crimson-400 mt-2">That's under your floor of {usd(r.floor)}.</div>}
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => onBook(Number(rate) || r.counter, truck, driver)} className="btn btn-red"><CheckCircle2 size={15} /> Book and send to Dispatch</button>
          <button onClick={() => onStatus('pursuing')} className="btn btn-ghost btn-sm">Negotiating</button>
          <button onClick={() => onStatus('submitted')} className="btn btn-ghost btn-sm">Offer sent</button>
          <button onClick={() => onStatus('lost')} className="btn btn-ghost btn-sm">Missed it</button>
          <button onClick={() => onStatus('passed')} className="btn btn-ghost btn-sm">Pass</button>
        </div>
      </div>}
      {o.status === 'won' && <div className="text-signal-green flex items-center gap-2"><CheckCircle2 size={16} /> Booked. It's on the Dispatch board.</div>}
    </div>
  )
}

