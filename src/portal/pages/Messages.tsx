import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckSquare, Megaphone, Pin, Send, Square, Trash2 } from 'lucide-react'
import { useComms, threadOf, type Member, type Msg } from '../comms'
import { canManageTeam, ROLE_LABEL } from '../perms'
import { PageHead, ago, shortDate } from '../../components/ui'

/** Team board (everyone sees it; posts can be tasks) + private messages between two people. */
export default function Messages({ compact = false }: { compact?: boolean }) {
  const { people, me, unread, viewAs, markRead } = useComms()
  const [thread, setThread] = useState<string | null>(compact ? null : 'board')
  const others = people.filter(p => p.id !== me.id)
  const other = others.find(p => p.id === thread)

  useEffect(() => { if (thread) markRead(thread) }, [thread]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = (
    <div className="space-y-1">
      <ThreadButton active={thread === 'board'} onClick={() => setThread('board')} icon={<Megaphone size={16} />} title="Team board" sub="Everyone sees this" count={unread.board} />
      <div className="eyebrow pt-3 pb-1 px-1">Private messages</div>
      {others.map(p => <ThreadButton key={p.id} active={thread === p.id} onClick={() => setThread(p.id)} icon={<span className="font-display font-extrabold text-[14px]">{p.name[0]}</span>} title={p.name} sub={p.title || ROLE_LABEL[p.role]} count={unread[p.id]} />)}
      {!others.length && <p className="text-[13px] text-graphite-400 px-1">Nobody else has signed in yet. Invite your team from Team &amp; Access.</p>}
    </div>
  )
  const view = thread === 'board' ? <Board compact={compact} /> : other ? <Chat person={other} /> : null

  if (compact) return (
    <div>
      {thread ? <><button onClick={() => setThread(null)} className="flex items-center gap-2 text-[13px] text-graphite-300 hover:text-white mb-3"><ArrowLeft size={14} /> All conversations</button>{view}</> : list}
    </div>
  )
  return (
    <>
      <PageHead eyebrow="Messages" title="Talk to the team" sub="The team board is for updates and tasks everyone should see. Private messages are just between two people." />
      {viewAs && <p className="text-[13px] text-signal-amber mb-3">You're viewing as {viewAs.name}. Messages always show your own conversations, not theirs.</p>}
      <div className="grid md:grid-cols-[270px_1fr] gap-4 items-start">
        <div className="plate p-2">{list}</div>
        <div className="min-w-0">{view}</div>
      </div>
    </>
  )
}

function ThreadButton({ active, onClick, icon, title, sub, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; sub: string; count?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-2.5 text-left transition ${active ? 'bg-crimson/15 ring-1 ring-crimson/40' : 'hover:bg-white/5'}`}>
      <span className="w-9 h-9 shrink-0 grid place-items-center bg-onyx-700 text-crimson-400">{icon}</span>
      <span className="flex-1 min-w-0"><span className="block font-semibold text-[14.5px] truncate">{title}</span><span className="block text-[12px] text-graphite-400 truncate">{sub}</span></span>
      {!!count && <span className="chip bg-crimson text-white h-5 px-1.5">{count}</span>}
    </button>
  )
}

function Board({ compact }: { compact: boolean }) {
  const { messages, people, me, send, update, remove, markRead } = useComms()
  const [body, setBody] = useState('')
  const [task, setTask] = useState(false)
  const [who, setWho] = useState('')
  const [due, setDue] = useState('')
  const [filter, setFilter] = useState<'all' | 'tasks' | 'mine'>('all')
  const [err, setErr] = useState('')
  const manage = canManageTeam(me.role)
  const everyone = [me, ...people.filter(p => p.id !== me.id)]

  const board = messages.filter(m => m.to_user === null)
  useEffect(() => { markRead('board') }, [board.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => {
    const f = board.filter(m => filter === 'all' || (filter === 'tasks' ? m.is_task : m.is_task && m.assignee === me.id))
    const rank = (m: Msg) => m.pinned ? 0 : m.is_task && !m.done ? 1 : 2
    return f.sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 ? (a.due ?? '9').localeCompare(b.due ?? '9') : b.created_at.localeCompare(a.created_at)))
  }, [board, filter, me.id])

  const post = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const res = await send(body, { task, assignee: everyone.find(p => p.id === who) ?? null, due: due || null })
    if (res) { setErr(res); return }
    setBody(''); setTask(false); setWho(''); setDue('')
  }

  return (
    <div className="space-y-3">
      <form onSubmit={post} className="plate p-3">
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={compact ? 2 : 3} placeholder={task ? 'What needs to get done?' : 'Post an update for the whole team…'} className="input w-full resize-y py-2" maxLength={4000} />
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button type="button" onClick={() => setTask(!task)} className={`btn btn-sm ${task ? 'bg-signal-amber/15 text-signal-amber ring-1 ring-signal-amber/40' : 'btn-ghost'}`}>{task ? <CheckSquare size={14} /> : <Square size={14} />} Task</button>
          {task && <>
            <select value={who} onChange={e => setWho(e.target.value)} className="input h-9 w-auto text-[13.5px]"><option value="">Anyone</option>{everyone.map(p => <option key={p.id} value={p.id}>{p.id === me.id ? `Me (${p.name})` : p.name}</option>)}</select>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} className="input h-9 w-auto text-[13.5px]" aria-label="Due date" />
          </>}
          <button disabled={!body.trim()} className="btn btn-red btn-sm ml-auto disabled:opacity-40"><Send size={14} /> {task ? 'Add task' : 'Post'}</button>
        </div>
        {err && <p className="text-[13px] text-crimson-400 mt-2">{err}</p>}
      </form>
      <div className="flex gap-1">
        {(['all', 'tasks', 'mine'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`chip h-7 px-3 ${filter === f ? 'bg-white text-onyx' : 'bg-white/5 text-graphite-300 hover:text-white'}`}>{f === 'all' ? 'Everything' : f === 'tasks' ? 'Tasks' : 'My tasks'}</button>)}
      </div>
      {shown.map(m => {
        const overdue = m.is_task && !m.done && m.due && m.due < new Date().toISOString().slice(0, 10)
        return (
          <article key={m.id} className={`plate p-3 ${m.pinned ? 'ring-1 ring-crimson/40' : ''} ${m.done ? 'opacity-60' : ''}`}>
            <div className="flex gap-3">
              {m.is_task
                ? <button onClick={() => update(m.id, { done: !m.done, done_by: m.done ? null : me.name })} className={`mt-0.5 ${m.done ? 'text-signal-green' : 'text-graphite-300 hover:text-white'}`} title={m.done ? 'Mark not done' : 'Mark done'}>{m.done ? <CheckSquare size={20} /> : <Square size={20} />}</button>
                : <span className="w-8 h-8 shrink-0 grid place-items-center bg-onyx-700 font-display font-extrabold text-[14px]">{(m.from_name ?? '?')[0]}</span>}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-graphite-400">
                  <span className="font-semibold text-graphite-100">{m.from_name ?? 'Someone'}</span><span>{ago(m.created_at)}</span>
                  {m.pinned && <span className="text-crimson-400 flex items-center gap-1"><Pin size={11} /> Pinned</span>}
                </div>
                <p className={`text-[15px] mt-0.5 whitespace-pre-wrap break-words ${m.done ? 'line-through' : ''}`}>{m.body}</p>
                {m.is_task && <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="chip bg-white/5 text-graphite-200">{m.assignee_name ? `For ${m.assignee === me.id ? 'you' : m.assignee_name}` : 'Anyone'}</span>
                  {m.due && <span className={`chip ${overdue ? 'bg-crimson/20 text-crimson-400' : 'bg-white/5 text-graphite-200'}`}>Due {shortDate(m.due + 'T12:00:00')}{overdue ? ' · late' : ''}</span>}
                  {m.done && <span className="chip bg-signal-green/15 text-signal-green">Done{m.done_by ? ` by ${m.done_by}` : ''}</span>}
                </div>}
              </div>
              <div className="flex flex-col gap-1">
                {manage && <button onClick={() => update(m.id, { pinned: !m.pinned })} className={`p-1 ${m.pinned ? 'text-crimson-400' : 'text-graphite-500 hover:text-white'}`} title={m.pinned ? 'Unpin' : 'Pin to top'}><Pin size={14} /></button>}
                {(m.from_user === me.id || manage) && <button onClick={() => remove(m.id)} className="p-1 text-graphite-500 hover:text-crimson-400" title="Delete"><Trash2 size={14} /></button>}
              </div>
            </div>
          </article>
        )
      })}
      {!shown.length && <p className="text-graphite-400 text-[14px] text-center py-8">{filter === 'all' ? 'Nothing posted yet. Say hello to the team.' : 'No tasks here.'}</p>}
    </div>
  )
}

function Chat({ person }: { person: Member }) {
  const { messages, me, send, remove, markRead } = useComms()
  const [body, setBody] = useState('')
  const [err, setErr] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const thread = messages.filter(m => m.to_user !== null && threadOf(m, me.id) === person.id)
  useEffect(() => { markRead(person.id); end.current?.scrollIntoView({ block: 'nearest' }) }, [thread.length, person.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = async () => {
    setErr('')
    const res = await send(body, { to: person.id })
    if (res) setErr(res); else setBody('')
  }
  return (
    <div className="plate flex flex-col">
      <header className="px-4 h-12 flex items-center gap-2 border-b border-white/[.06]"><span className="font-display font-bold uppercase tracking-[.06em] text-[15px]">{person.name}</span><span className="text-[12px] text-graphite-400">· {person.title || ROLE_LABEL[person.role]} · private</span></header>
      <div className="p-4 space-y-2 max-h-[60vh] min-h-[200px] overflow-y-auto">
        {thread.map(m => {
          const mine = m.from_user === me.id
          return (
            <div key={m.id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
              {mine && <button onClick={() => remove(m.id)} className="opacity-0 group-hover:opacity-100 p-1 self-center text-graphite-500 hover:text-crimson-400" title="Delete"><Trash2 size={12} /></button>}
              <div className={`max-w-[80%] px-3 py-2 ${mine ? 'bg-crimson/80 text-white' : 'bg-onyx-700'}`}>
                <p className="text-[14.5px] whitespace-pre-wrap break-words">{m.body}</p>
                <div className={`text-[11px] mt-0.5 ${mine ? 'text-white/70' : 'text-graphite-400'}`}>{ago(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        {!thread.length && <p className="text-graphite-400 text-[14px] text-center py-8">No messages yet. Only you and {person.name} can see this conversation.</p>}
        <div ref={end} />
      </div>
      <form onSubmit={e => { e.preventDefault(); go() }} className="p-3 border-t border-white/[.06] flex gap-2">
        <textarea value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() } }} rows={1} placeholder={`Message ${person.name}…`} className="input flex-1 resize-none py-2" maxLength={4000} />
        <button disabled={!body.trim()} className="btn btn-red btn-sm disabled:opacity-40" aria-label="Send"><Send size={14} /></button>
      </form>
      {err && <p className="text-[13px] text-crimson-400 px-3 pb-3">{err}</p>}
    </div>
  )
}
