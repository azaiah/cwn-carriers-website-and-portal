import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { companyPeople, supabase, type Role } from '../lib/supabase'
import { usePortal } from './store'
import { pagesFor } from './perms'

/** A person on the team (live: a real login; demo: the sample team). */
export interface Member { id: string; name: string; email: string; role: Role; title: string | null; pages: string[] | null }

export interface Msg {
  id: string; from_user: string; from_name: string | null; to_user: string | null; body: string
  is_task: boolean; done: boolean; done_by: string | null; assignee: string | null; assignee_name: string | null
  due: string | null; pinned: boolean; created_at: string
}
export type SendOpts = { to?: string | null; task?: boolean; assignee?: Member | null; due?: string | null }

interface Ctx {
  people: Member[]
  me: Member
  /** Who the screen is showing right now: me, or the person picked in "View as". */
  viewing: Member
  viewAs: Member | null
  setViewAs: (m: Member | null) => void
  canViewAs: boolean
  pages: string[]
  messages: Msg[]
  send: (body: string, o?: SendOpts) => Promise<string | null>
  update: (id: string, patch: Partial<Msg>) => void
  remove: (id: string) => void
  markRead: (thread: string) => void
  unread: Record<string, number>
  totalUnread: number
  openTasks: Msg[]
  refreshPeople: () => Promise<void>
  /** Change someone's title, role or pages. Returns an error message or null. */
  patchPerson: (id: string, patch: Partial<Pick<Member, 'title' | 'role' | 'pages'>>) => Promise<string | null>
}

const C = createContext<Ctx | null>(null)

const DEMO_PEOPLE: Member[] = [
  { id: 'Lawrence', name: 'Lawrence', email: 'lsamuel@cwn-carriers.com', role: 'owner', title: 'Owner', pages: null },
  { id: 'Tequila', name: 'Tequila Samuel', email: 'tsamuel@luxehomeesthetics.com', role: 'admin', title: 'COO', pages: null },
  { id: 'Dispatch', name: 'Dispatch', email: 'dispatch@cwn-carriers.com', role: 'dispatcher', title: 'Dispatcher', pages: null },
  { id: 'Driver A', name: 'Driver A', email: 'driver@cwn-carriers.com', role: 'driver', title: 'Driver', pages: null },
]
const hrs = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
const demoMsg = (p: Partial<Msg> & Pick<Msg, 'id' | 'from_user' | 'body'>): Msg => ({
  from_name: p.from_user, to_user: null, is_task: false, done: false, done_by: null, assignee: null, assignee_name: null, due: null, pinned: false, created_at: hrs(1), ...p,
})
const DEMO_MSGS: Msg[] = [
  demoMsg({ id: 'd1', from_user: 'Lawrence', body: 'Welcome to the team board. Post updates here so everybody sees them. Use a task when something needs doing.', pinned: true, created_at: hrs(30) }),
  demoMsg({ id: 'd2', from_user: 'Tequila', from_name: 'Tequila Samuel', body: 'Renew the cargo insurance certificate before the 15th', is_task: true, assignee: 'Lawrence', assignee_name: 'Lawrence', due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), created_at: hrs(6) }),
  demoMsg({ id: 'd3', from_user: 'Dispatch', body: 'Truck 2 back from Norfolk. Ready for tomorrow.', created_at: hrs(2) }),
  demoMsg({ id: 'd4', from_user: 'Driver A', to_user: 'Lawrence', body: 'Dock at the Ashland pickup opens at 7, not 6. I will be there at 7.', created_at: hrs(1) }),
]
const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : d } catch { return d } }
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export function threadOf(m: Msg, me: string) { return m.to_user === null ? 'board' : m.from_user === me ? m.to_user : m.from_user }

export function CommsProvider({ children }: { children: ReactNode }) {
  const { live, user, log } = usePortal()
  const [people, setPeople] = useState<Member[]>(live ? [] : DEMO_PEOPLE)
  const [messages, setMessages] = useState<Msg[]>(() => live ? [] : read('cwn-msgs-v1', DEMO_MSGS))
  const [reads, setReads] = useState<Record<string, string>>({})
  const [viewAs, setViewAs] = useState<Member | null>(null)

  const me: Member = useMemo(() => live
    ? { id: live.userId, name: live.name, email: live.email, role: live.role, title: live.title, pages: live.pages }
    : DEMO_PEOPLE.find(p => p.id === user) ?? { ...DEMO_PEOPLE[0], id: user ?? 'Lawrence', name: user ?? 'Lawrence' }, [live, user])

  const refreshPeople = useCallback(async () => {
    if (!live) return
    try {
      const list = await companyPeople(live.companyId)
      setPeople(list.map(p => ({ id: p.user_id, name: p.display_name, email: p.email, role: p.role, title: p.title, pages: p.pages })))
    } catch { /* keep what we have */ }
  }, [live])

  // ---- load people, messages and read receipts; then listen live ----
  useEffect(() => {
    if (!live) { setReads(read(`cwn-reads-${me.id}`, {})); return }
    refreshPeople()
    let cancelled = false
    ;(async () => {
      const [m, r] = await Promise.all([
        supabase.from('messages').select('*').eq('company_id', live.companyId).order('created_at', { ascending: false }).limit(500),
        supabase.from('message_reads').select('thread, read_at').eq('company_id', live.companyId),
      ])
      if (cancelled) return
      setMessages(((m.data ?? []) as Msg[]).reverse())
      setReads(Object.fromEntries(((r.data ?? []) as { thread: string; read_at: string }[]).map(x => [x.thread, x.read_at])))
    })()
    const ch = supabase.channel('msgs-' + live.companyId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `company_id=eq.${live.companyId}` }, payload => {
        if (payload.eventType === 'DELETE') { const id = (payload.old as { id?: string }).id; setMessages(ms => ms.filter(x => x.id !== id)); return }
        const row = payload.new as Msg
        setMessages(ms => ms.some(x => x.id === row.id) ? ms.map(x => x.id === row.id ? row : x) : [...ms, row])
      })
      .subscribe()
    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [live, me.id, refreshPeople])

  useEffect(() => { if (!live) write('cwn-msgs-v1', messages) }, [messages, live])

  const send: Ctx['send'] = async (body, o = {}) => {
    const text = body.trim()
    if (!text) return null
    const row = {
      from_name: me.name, to_user: o.to ?? null, body: text.slice(0, 4000), is_task: !!o.task,
      assignee: o.task ? o.assignee?.id ?? null : null, assignee_name: o.task ? o.assignee?.name ?? null : null, due: o.task ? o.due || null : null,
    }
    if (!live) {
      setMessages(ms => [...ms, demoMsg({ ...row, id: crypto.randomUUID(), from_user: me.id, created_at: new Date().toISOString() })])
    } else {
      const { data, error } = await supabase.from('messages').insert({ ...row, company_id: live.companyId }).select().single()
      if (error) return 'Couldn\'t send. Check your connection and try again.'
      setMessages(ms => ms.some(x => x.id === (data as Msg).id) ? ms : [...ms, data as Msg])
    }
    if (o.task) log(`New task${row.assignee_name ? ` for ${row.assignee_name}` : ''}: ${text.slice(0, 80)}`, 'sys', me.name)
    return null
  }

  const update: Ctx['update'] = (id, patch) => {
    setMessages(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m))
    if (live) supabase.from('messages').update(patch).eq('id', id).then(() => { /* realtime confirms */ })
  }
  const remove: Ctx['remove'] = id => {
    setMessages(ms => ms.filter(m => m.id !== id))
    if (live) supabase.from('messages').delete().eq('id', id).then(() => { /* realtime confirms */ })
  }
  const markRead: Ctx['markRead'] = thread => {
    const at = new Date().toISOString()
    setReads(r => { const n = { ...r, [thread]: at }; if (!live) write(`cwn-reads-${me.id}`, n); return n })
    if (live) supabase.from('message_reads').upsert({ company_id: live.companyId, thread, read_at: at }, { onConflict: 'user_id,company_id,thread' }).then(() => { /* best effort */ })
  }

  const unread = useMemo(() => {
    const u: Record<string, number> = {}
    for (const m of messages) {
      if (m.from_user === me.id) continue
      if (m.to_user !== null && m.to_user !== me.id) continue
      const t = threadOf(m, me.id)
      if (!reads[t] || m.created_at > reads[t]) u[t] = (u[t] ?? 0) + 1
    }
    return u
  }, [messages, reads, me.id])

  const patchPerson: Ctx['patchPerson'] = async (id, patch) => {
    if (live) {
      const { error, count } = await supabase.from('members').update(patch, { count: 'exact' }).eq('company_id', live.companyId).eq('user_id', id)
      if (error) return error.message
      if (!count) return 'You don\'t have permission to change this person.'
      await refreshPeople()
    } else setPeople(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
    setViewAs(v => v && v.id === id ? { ...v, ...patch } : v)
    return null
  }

  const canViewAs = me.role === 'owner' || me.role === 'admin' || me.role === 'platform'
  const viewing = viewAs ?? me
  const ctx: Ctx = {
    people, me, viewing, viewAs, canViewAs, refreshPeople, patchPerson,
    setViewAs: m => setViewAs(m && m.id !== me.id ? m : null),
    pages: pagesFor(viewing.role, viewing.pages),
    messages, send, update, remove, markRead, unread,
    totalUnread: Object.values(unread).reduce((a, b) => a + b, 0),
    openTasks: messages.filter(m => m.is_task && !m.done),
  }
  return <C.Provider value={ctx}>{children}</C.Provider>
}

export function useComms() {
  const c = useContext(C)
  if (!c) throw new Error('useComms outside provider')
  return c
}
