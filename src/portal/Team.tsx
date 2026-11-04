import { useEffect, useState } from 'react'
import { Eye, MailPlus, Pencil, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { supabase, type Role } from '../lib/supabase'
import { usePortal } from './store'
import { useComms, type Member } from './comms'
import { PAGES, ROLE_DEFAULT, ROLE_LABEL, canManageTeam, pagesFor } from './perms'
import { PageHead, Panel } from '../components/ui'

interface Invite { email: string; role: string; display_name: string | null; title: string | null }

export default function TeamPage() {
  return (
    <>
      <PageHead eyebrow="Team & access" title="Who sees what" sub="Invite people, give them a title, and choose which pages they can open. Use View as to see the portal exactly the way they do." />
      <TeamPanel />
    </>
  )
}

/** Team list, invites, page permissions and "View as". */
export function TeamPanel() {
  const { live, log } = usePortal()
  const { people, me, canViewAs, setViewAs, refreshPeople, patchPerson } = useComms()
  const [invites, setInvites] = useState<Invite[]>([])
  const [f, setF] = useState({ email: '', name: '', title: '', role: 'driver' })
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState<Member | null>(null)
  const manage = canManageTeam(me.role)

  const refreshInvites = async () => {
    if (!live || !manage) return
    const { data } = await supabase.from('invites').select('email, role, display_name, title').eq('company_id', live.companyId)
    const joined = new Set(people.map(p => p.email.toLowerCase()))
    setInvites(((data ?? []) as Invite[]).filter(x => !joined.has(x.email.toLowerCase())))
  }
  useEffect(() => { refreshInvites() }, [live?.companyId, people.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const invite = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('')
    const email = f.email.trim().toLowerCase()
    if (!live) { setMsg('In the live portal this sends the invite. Demo only.'); return }
    const { error } = await supabase.from('invites').insert({ email, company_id: live.companyId, role: f.role, display_name: f.name.trim() || null, title: f.title.trim() || null })
    if (error) { setMsg(error.message.includes('duplicate') ? 'That email is already invited.' : error.message); return }
    log(`Invited ${f.name || email} as ${f.title || f.role}`, 'sys')
    setMsg(`Invited. Tell ${f.name || email} to open the portal and sign in with Google or "Create your account" using ${email}.`)
    setF({ email: '', name: '', title: '', role: 'driver' }); refreshInvites()
  }
  const removeInvite = async (email: string) => { if (!live) return; await supabase.from('invites').delete().eq('company_id', live.companyId).eq('email', email); refreshInvites() }
  const removeMember = async (m: Member) => {
    if (!live || !window.confirm(`Remove ${m.name}'s access to the portal?`)) return
    await supabase.from('members').delete().eq('company_id', live.companyId).eq('user_id', m.id)
    await supabase.from('invites').delete().eq('company_id', live.companyId).eq('email', m.email)
    log(`Removed ${m.name} from the portal`, 'sys'); refreshPeople()
  }

  const canEdit = (p: Member) => manage && p.role !== 'platform' && p.id !== me.id && (p.role !== 'owner' || me.role === 'owner' || me.role === 'platform')
  const canView = (p: Member) => canViewAs && p.id !== me.id && (p.role !== 'platform' || me.role === 'platform')
  const order: Role[] = ['owner', 'admin', 'dispatcher', 'driver', 'platform']
  const sorted = [...people].sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.name.localeCompare(b.name))

  return (
    <>
      <Panel title={<span className="flex items-center gap-2"><Users size={16} className="text-crimson-400" /> Team</span>} className="mt-4" pad={false}>
        <ul className="divide-y divide-white/[.05]">
          {sorted.map(p => {
            const pages = pagesFor(p.role, p.pages)
            return (
              <li key={p.id} className="p-3 sm:px-4 flex flex-wrap items-center gap-3">
                <span className="w-10 h-10 grid place-items-center bg-onyx-700 font-display font-extrabold text-[16px] shrink-0">{p.name[0]}</span>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-[15px]">{p.name}{p.id === me.id && <span className="text-graphite-400 font-normal"> (you)</span>}</div>
                  <div className="text-[12.5px] text-graphite-400">{p.title || ROLE_LABEL[p.role]} · {p.email}</div>
                </div>
                <span className={`chip ${p.role === 'platform' ? 'bg-signal-blue/15 text-signal-blue' : 'bg-white/5 text-graphite-200'}`}>{p.role === 'platform' && <ShieldCheck size={12} />}{ROLE_LABEL[p.role]}</span>
                <span className="chip bg-white/5 text-graphite-300" title={pages.map(k => PAGES.find(x => x.key === k)?.label).join(', ')}>{pages.length === PAGES.length ? 'All pages' : `${pages.length} pages`}</span>
                <div className="flex gap-1">
                  {canView(p) && <button onClick={() => setViewAs(p)} className="btn btn-ghost btn-sm"><Eye size={14} /> View as</button>}
                  {canEdit(p) && <button onClick={() => setEditing(p)} className="btn btn-ghost btn-sm"><Pencil size={14} /> Edit</button>}
                  {canEdit(p) && live && <button onClick={() => removeMember(p)} className="p-2 text-graphite-400 hover:text-crimson-400" title="Remove access"><Trash2 size={14} /></button>}
                </div>
              </li>
            )
          })}
          {invites.map(i => (
            <li key={i.email} className="p-3 sm:px-4 flex flex-wrap items-center gap-3 text-graphite-300">
              <span className="w-10 h-10 grid place-items-center bg-onyx-800 ring-1 ring-dashed ring-white/15 shrink-0">?</span>
              <div className="flex-1 min-w-[180px]"><div className="font-semibold text-[15px]">{i.display_name ?? i.email}</div><div className="text-[12.5px] text-graphite-400">{i.title || i.role} · {i.email}</div></div>
              <span className="chip bg-signal-amber/15 text-signal-amber">Invited, hasn't signed in</span>
              <button onClick={() => removeInvite(i.email)} className="p-2 text-graphite-400 hover:text-crimson-400" title="Cancel invite"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </Panel>

      {manage && <Panel title={<span className="flex items-center gap-2"><MailPlus size={16} className="text-crimson-400" /> Invite someone</span>} className="mt-4">
        <form onSubmit={invite} className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1fr_150px_auto] gap-2 items-end">
          <label><span className="label">Name</span><input className="input h-10" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Marcus Lee" /></label>
          <label><span className="label">Email</span><input required type="email" className="input h-10" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@email.com" /></label>
          <label><span className="label">Title</span><input className="input h-10" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Driver, Dispatcher, COO…" /></label>
          <label><span className="label">Access</span><select className="input h-10" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="driver">Driver</option><option value="dispatcher">Dispatcher</option><option value="admin">Admin (everything)</option></select></label>
          <button className="btn btn-red btn-sm h-10"><MailPlus size={14} /> Invite</button>
        </form>
        <p className="text-[12.5px] text-graphite-400 mt-2">Drivers see their loads and messages. Dispatchers see everything except Money, Company Brain, the briefing and team settings. Admins see everything. You can fine-tune each person after they sign in.</p>
        {msg && <p className="text-[13.5px] text-signal-green mt-2">{msg}</p>}
      </Panel>}

      {editing && <EditPerson person={editing} onClose={() => setEditing(null)} save={async patch => {
        const err = await patchPerson(editing.id, patch)
        if (!err) { log(`Updated ${editing.name}'s access`, 'sys'); setEditing(null) }
        return err
      }} />}
    </>
  )
}

function EditPerson({ person, onClose, save }: { person: Member; onClose: () => void; save: (p: Partial<Pick<Member, 'title' | 'role' | 'pages'>>) => Promise<string | null> }) {
  const [title, setTitle] = useState(person.title ?? '')
  const [role, setRole] = useState<Role>(person.role)
  const [pages, setPages] = useState<string[]>(pagesFor(person.role, person.pages))
  const [err, setErr] = useState('')
  const locked = role === 'owner'
  const groups = Array.from(new Set(PAGES.map(p => p.group)))
  const toggle = (k: string) => setPages(ps => ps.includes(k) ? ps.filter(x => x !== k) : [...ps, k])
  const pickRole = (r: Role) => { setRole(r); setPages(ROLE_DEFAULT[r]) }
  const same = (a: string[], b: string[]) => a.length === b.length && a.every(x => b.includes(x))

  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-onyx-850 ring-1 ring-white/10 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between px-5 h-14 border-b border-white/10"><span className="font-display font-bold uppercase tracking-wider">{person.name}</span><button onClick={onClose} className="p-2 hover:bg-white/10" aria-label="Close"><X size={18} /></button></header>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label><span className="label">Title</span><input className="input h-10" value={title} onChange={e => setTitle(e.target.value)} placeholder="COO, Lead driver…" /></label>
            <label><span className="label">Access level</span>
              <select className="input h-10" value={role} disabled={locked} onChange={e => pickRole(e.target.value as Role)}>
                {locked && <option value="owner">Owner</option>}
                <option value="admin">Admin (everything)</option><option value="dispatcher">Dispatcher</option><option value="driver">Driver</option>
              </select></label>
          </div>
          <div>
            <div className="label">Pages {person.name.split(' ')[0]} can open</div>
            {locked ? <p className="text-[13.5px] text-graphite-300">The owner always sees every page.</p> : <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-1">
              {groups.map(g => <div key={g}>
                <div className="eyebrow mb-1">{g}</div>
                {PAGES.filter(p => p.group === g).map(p => <label key={p.key} className="flex items-center gap-2 py-1 text-[14px] cursor-pointer">
                  <input type="checkbox" checked={pages.includes(p.key)} disabled={p.key === 'messages'} onChange={() => toggle(p.key)} className="accent-crimson w-4 h-4" />{p.label}
                </label>)}
              </div>)}
            </div>}
          </div>
          {err && <p className="text-[13.5px] text-crimson-400">{err}</p>}
          <div className="flex justify-between gap-2">
            {!locked && <button onClick={() => setPages(ROLE_DEFAULT[role])} className="btn btn-ghost btn-sm">Reset to {ROLE_LABEL[role]} default</button>}
            <button onClick={async () => setErr(await save({ title: title.trim() || null, role, pages: locked || same(pages, ROLE_DEFAULT[role]) ? null : pages }) ?? '')} className="btn btn-red btn-sm ml-auto">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
