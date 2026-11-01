import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, Mail, Send, Sparkles } from 'lucide-react'
import { usePortal } from '../store'
import { aiDraft } from '../outreach'
import { Empty, PageHead, ago } from '../../components/ui'

export default function Outreach() {
  const { outreach, updateOutreach, scored, brain, log } = usePortal()
  const [active, setActive] = useState<string | null>(outreach[0]?.id ?? null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const cur = outreach.find(o => o.id === active) ?? outreach[0]
  const opp = cur ? scored.find(s => s.id === cur.oppId) : undefined

  const rewrite = async () => {
    if (!cur || !opp) return
    setBusy(true); setNote('')
    const t = await aiDraft(opp, brain)
    if (t) {
      const [first, ...rest] = t.split('\n')
      updateOutreach(cur.id, { subject: first.replace(/^subject:\s*/i, ''), body: rest.join('\n').trim() })
    } else setNote('AI writer not connected yet (set ANTHROPIC_API_KEY on Netlify). The template draft is ready to edit.')
    setBusy(false)
  }

  return (
    <>
      <PageHead eyebrow="Outreach" title="Approve before anything goes out" sub="The Brain drafts first-touch emails from what it knows. Nothing is sent until you approve it and hit send." />
      {!outreach.length ? (
        <div className="plate p-10"><Empty>No drafts yet. Open an opportunity in <Link className="text-crimson-400 underline" to="/portal/opportunities">Bids &amp; Leads</Link> and hit <b>Draft outreach</b>.</Empty></div>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="plate divide-y divide-white/[.05] self-start">
            {outreach.map(o => (
              <button key={o.id} onClick={() => setActive(o.id)} className={`w-full text-left px-4 py-3 ${cur?.id === o.id ? 'bg-crimson/10' : 'hover:bg-white/[.03]'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-[14px] font-semibold truncate">{o.to}</span>
                  <span className={`chip ${o.status === 'sent' ? 'bg-signal-green/15 text-signal-green' : o.status === 'approved' ? 'bg-signal-blue/15 text-signal-blue' : 'bg-signal-amber/15 text-signal-amber'}`}>{o.status}</span></div>
                <div className="text-[12.5px] text-graphite-300 truncate mt-0.5">{o.subject}</div>
                <div className="text-[11px] text-graphite-400 font-mono mt-1">{ago(o.created)}</div>
              </button>
            ))}
          </div>
          {cur && (
            <div className="plate p-5 md:p-6 space-y-4">
              {opp && <div className="text-[13px] text-graphite-300">For: <Link to={`/portal/opportunities?id=${opp.id}`} className="text-ivory hover:text-crimson-400">{opp.title}</Link> · score {opp.s.score}</div>}
              <label className="block"><span className="label">To</span><input className="input" value={cur.to} onChange={e => updateOutreach(cur.id, { to: e.target.value })} /></label>
              <label className="block"><span className="label">Subject</span><input className="input" value={cur.subject} onChange={e => updateOutreach(cur.id, { subject: e.target.value })} /></label>
              <label className="block"><span className="label">Message</span><textarea rows={16} className="input h-auto py-3 leading-relaxed font-sans" value={cur.body} onChange={e => updateOutreach(cur.id, { body: e.target.value, status: 'draft' })} /></label>
              {note && <p className="text-[13px] text-signal-amber">{note}</p>}
              <div className="flex flex-wrap gap-2">
                <button onClick={rewrite} disabled={busy} className="btn btn-ghost btn-sm">{busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Rewrite with AI</button>
                {cur.status === 'draft' && <button onClick={() => { updateOutreach(cur.id, { status: 'approved' }); log(`Outreach approved: ${cur.to}`, 'brain') }} className="btn btn-ivory btn-sm"><CheckCircle2 size={14} /> Approve</button>}
                {cur.status !== 'draft' && (
                  <a href={`mailto:${/@/.test(cur.to) ? cur.to.split(' · ').find(x => x.includes('@')) : ''}?subject=${encodeURIComponent(cur.subject)}&body=${encodeURIComponent(cur.body)}`}
                    onClick={() => { updateOutreach(cur.id, { status: 'sent' }); log(`Outreach sent to ${cur.to}`, 'brain') }} className="btn btn-red btn-sm"><Mail size={14} /> Open in email & send</a>
                )}
                <span className="ml-auto text-[12px] text-graphite-400 flex items-center gap-1.5"><Send size={12} /> Sends from your own inbox</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
