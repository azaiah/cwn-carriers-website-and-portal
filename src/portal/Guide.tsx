import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react'

/** One card per portal page. Order = the walkthrough order. */
export const GUIDE: { path: string; title: string; what: string; try: string[] }[] = [
  {
    path: '', title: 'Command center',
    what: 'Your morning view: money in the last 7 days against your weekly target, trucks on the road, and the best real leads the Company Brain found for CWN.',
    try: ['Look at "Top real prospects". These are real Richmond-area companies, scored for CWN', 'Click "Run sweep now" to pull the newest bids and leads', 'Click any prospect to see why it scored the way it did'],
  },
  {
    path: 'messages', title: 'Messages',
    what: 'One place to talk to the team. The team board is for updates and tasks everyone should see. Private messages are only between two people. A red number means something new.',
    try: ['Post an update on the team board', 'Click Task, pick a person and a due date, and post it. It shows up on their Command page', 'Click a name on the left to message them privately'],
  },
  {
    path: 'loads', title: 'Load Finder',
    what: 'Loads from your inbox, marketplaces, the weekly sweep and anything you paste, in one list. The Brain checks each one against your box trucks, and the Rate Coach gives you a floor, a target and the number to say back.',
    try: ['Paste a broker load list into "Add loads" and watch it get scored', 'Change "Truck starts from" to see loads near where a truck will be empty', 'Open a load to see the Rate Coach script, then book it straight to Dispatch'],
  },
  {
    path: 'pipeline', title: 'Pipeline',
    what: 'Every load, bid, lead and partner program you are working, from found to won. Each card is labeled so you always know what it is.',
    try: ['Filter to just Loads or just Bids with the tabs', 'Move a card forward with the arrow as it progresses', 'Booked loads show a link to their Dispatch card'],
  },
  {
    path: 'dispatch', title: 'Dispatch board',
    what: 'Every load from quote to paid, in columns. Move a card to the next column as the load moves.',
    try: ['Drag a load from Booked to Dispatched', 'Click a load to assign a truck and driver and see its rate per mile', 'Click "New load" to quote a run and see the suggested price'],
  },
  {
    path: 'opportunities', title: 'Bids & leads',
    what: 'Government bids, companies to pitch and partner programs, each labeled and scored 0–100. Green means go after it, amber means maybe, grey means the Brain passed and tells you why.',
    try: ['Open a green "Go" lead and read "Why it fits CWN"', 'Open a grey "Pass" to see what blocked it (hazmat, CDL, reefer…)', 'Hit "Draft outreach" to have a first email written for you'],
  },
  {
    path: 'brain', title: 'Company Brain',
    what: 'Everything the system knows about CWN: trucks, drivers, insurance, lanes, rates and goals. Every score in the portal comes from these settings.',
    try: ['Flip "SAM.gov active" on and watch federal bids move up on the right', 'Set a liftgate on truck 101 and watch liftgate jobs improve', 'The checklist on the right is what we still need from you'],
  },
  {
    path: 'outreach', title: 'Outreach',
    what: 'Emails the Brain drafted for leads you chose. Nothing is ever sent without you. You edit, approve, then send from your own inbox.',
    try: ['Go to Bids & Leads, open a lead, hit "Draft outreach", then come back here', 'Edit the wording, then click Approve', '"Open in email & send" opens your own email app'],
  },
  {
    path: 'briefing', title: 'Weekly briefing',
    what: 'A one-page Monday summary: your moves for the week, bid deadlines, the best new leads, and what the Brain skipped and why.',
    try: ['Read "Your moves this week". That’s the to-do list', 'Check the deadlines column before anything closes'],
  },
  {
    path: 'fleet', title: 'Fleet & drivers',
    what: 'Each truck’s loads, miles and revenue for the week, plus who is driving and who is off.',
    try: ['Click a driver’s name to rename them. It updates everywhere', 'Truck #103 is the planned third truck'],
  },
  {
    path: 'customers', title: 'Customers',
    what: 'Who pays the bills, how often they ship, and how much of your revenue depends on any one customer.',
    try: ['Click a customer to see their loads and contact info', 'The colored bar shows if one customer is too big a share of revenue'],
  },
  {
    path: 'money', title: 'Money',
    what: 'Revenue, costs, margin and unpaid invoices, plus a calculator for whether truck #3 will pay for itself.',
    try: ['Click "Invoice" or "Mark paid" on an open load', 'Slide the truck #3 numbers to match a real truck quote and see the weekly profit'],
  },
  {
    path: 'compliance', title: 'Compliance',
    what: 'Authority, insurance and registrations, with due dates so nothing lapses. Red and amber items need action.',
    try: ['"Open portal" links go straight to the right government site', 'Change an item’s status once it’s handled'],
  },
  {
    path: 'documents', title: 'Documents',
    what: 'Invoices, rate confirmations, bills of lading and a capability statement, filled in from your load records so the numbers always match.',
    try: ['Switch between document types at the top', 'Pick a different load to fill the document'],
  },
  {
    path: 'team', title: 'Team & access',
    what: 'Who can sign in and what each person can open. Use View as to see the portal exactly the way someone else sees it.',
    try: ['Click View as next to a person, then Exit in the yellow bar to come back', 'Click Edit to change someone\'s title or the pages they can open', 'Invite a new driver with the same name as on the Fleet list'],
  },
  {
    path: 'driver', title: 'Driver app',
    what: 'What your drivers see on their phones: today’s loads, a photo of the BOL at pickup, and a signature at delivery.',
    try: ['Tap "Deliver" on the in-transit load and sign with your finger or mouse', 'Go back to Dispatch and see that load moved to Delivered'],
  },
]

const KEY = 'cwn-guide'

export function useGuide() {
  const [on, setOn] = useState<boolean>(() => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } })
  useEffect(() => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ } }, [on])
  return [on, setOn] as const
}

export function GuideCard({ onClose }: { onClose: () => void }) {
  const loc = useLocation()
  const nav = useNavigate()
  const [min, setMin] = useState(false)
  const seg = loc.pathname.replace(/^\/portal\/?/, '').split('/')[0]
  const i = Math.max(0, GUIDE.findIndex(g => g.path === seg))
  const g = GUIDE[i]
  const go = (n: number) => { setMin(false); nav(`/portal/${GUIDE[n].path}`) }

  return (
    <AnimatePresence mode="wait">
      <motion.aside key={g.path + String(min)} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: .25 }}
        className="fixed z-30 bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] bg-onyx-800 ring-1 ring-white/10 shadow-[0_30px_60px_-20px_#000] no-print">
        <div className="h-1 bg-crimson" />
        <div className="flex items-center gap-2 px-4 h-11 border-b border-white/[.06]">
          <Lightbulb size={15} className="text-signal-amber" />
          <span className="font-mono text-[10.5px] uppercase tracking-[.18em] text-graphite-300">Guide · {i + 1} of {GUIDE.length}</span>
          <div className="ml-auto flex items-center">
            <button onClick={() => setMin(m => !m)} className="p-1.5 text-graphite-300 hover:text-white" aria-label={min ? 'Expand guide' : 'Minimize guide'}>{min ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
            <button onClick={onClose} className="p-1.5 text-graphite-300 hover:text-white" aria-label="Turn guide off"><X size={16} /></button>
          </div>
        </div>
        {!min && (
          <div className="p-4">
            <h3 className="font-display font-extrabold uppercase text-[22px] leading-tight">{g.title}</h3>
            <p className="text-[14px] text-graphite-200 leading-relaxed mt-1.5">{g.what}</p>
            <div className="label mt-4 mb-1.5">Try this</div>
            <ul className="space-y-1.5">
              {g.try.map(t => <li key={t} className="flex gap-2.5 text-[13.5px] leading-snug"><span className="w-1.5 h-1.5 bg-crimson mt-1.5 shrink-0 rotate-45" />{t}</li>)}
            </ul>
            <div className="flex items-center gap-2 mt-5">
              <button disabled={i === 0} onClick={() => go(i - 1)} className="btn btn-sm btn-ghost disabled:opacity-30"><ArrowLeft size={14} /> Back</button>
              {i < GUIDE.length - 1
                ? <button onClick={() => go(i + 1)} className="btn btn-sm btn-red ml-auto">Next: {GUIDE[i + 1].title} <ArrowRight size={14} /></button>
                : <button onClick={onClose} className="btn btn-sm btn-red ml-auto">Done. Explore freely</button>}
            </div>
            <div className="flex gap-1 mt-4">{GUIDE.map((x, k) => <button key={x.path} onClick={() => go(k)} aria-label={x.title} className={`h-1 flex-1 ${k === i ? 'bg-crimson' : k < i ? 'bg-white/30' : 'bg-white/10'}`} />)}</div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  )
}
