import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Camera, CheckCircle2, LogOut, MapPin, MessageSquare, Navigation, PenLine, Phone } from 'lucide-react'
import { useComms } from '../comms'
import Messages from './Messages'
import { usePortal } from '../store'
import { Logo } from '../../components/Logo'
import { shortDate, timeOf } from '../../components/ui'
import type { Load } from '../data'

/** Mobile driver view: today's loads, BOL photo at pickup, signature POD at delivery. */
export default function DriverApp({ standalone = false, asName, onExit }: { standalone?: boolean; asName?: string; onExit?: () => void }) {
  const { loads, user, upsertLoad, log, setUser, brain, uploadDoc, mode } = usePortal()
  const { totalUnread } = useComms()
  const [chat, setChat] = useState(false)
  const me = asName ?? (standalone ? user ?? 'Driver A' : 'Driver A')
  const mine = loads.filter(l => l.driver === me && ['booked', 'dispatched', 'transit', 'delivered'].includes(l.status)).sort((a, b) => a.pickup.localeCompare(b.pickup))
  const [sig, setSig] = useState<Load | null>(null)

  const phone = (
    <div className="w-full max-w-[400px] mx-auto bg-onyx min-h-[760px] relative overflow-hidden ring-1 ring-white/10 sm:rounded-[36px] sm:border-[10px] sm:border-black">
      <div className="px-5 pt-5 pb-4 bg-onyx-850 border-b border-white/10 flex items-center justify-between">
        <Logo compact className="h-9 w-auto" />
        <div className="text-right"><div className="font-semibold text-[14px]">{me}</div><div className="text-[11px] font-mono text-signal-green">● ON DUTY</div></div>
      </div>
      {chat ? <div className="p-3">
        <button onClick={() => setChat(false)} className="flex items-center gap-2 text-[13px] text-graphite-300 hover:text-white mb-3"><ArrowLeft size={14} /> Back to my loads</button>
        <Messages compact />
      </div> : <div className="p-4 space-y-3">
        <button onClick={() => setChat(true)} className="w-full flex items-center gap-3 p-3 bg-onyx-800 ring-1 ring-white/10 hover:ring-crimson/50 text-left">
          <MessageSquare size={18} className="text-crimson-400" /><span className="flex-1 font-semibold text-[14.5px]">Messages &amp; team board</span>
          {totalUnread > 0 && <span className="chip bg-crimson text-white h-5 px-1.5">{totalUnread}</span>}
        </button>
        <div className="eyebrow">Your loads</div>
        {mine.map(l => (
          <div key={l.id} className="bg-onyx-800 ring-1 ring-white/10 overflow-hidden">
            <div className={`h-1 ${l.status === 'transit' ? 'bg-crimson' : l.status === 'delivered' ? 'bg-signal-green' : 'bg-signal-blue'}`} />
            <div className="p-4">
              <div className="flex justify-between font-mono text-[11px] text-graphite-400"><span>{l.ref}</span><span className="uppercase">{l.status === 'transit' ? 'In transit' : l.status}</span></div>
              <div className="mt-2 space-y-2">
                <div className="flex gap-3"><MapPin size={16} className="text-graphite-300 mt-0.5" /><div><div className="font-display font-bold uppercase text-[18px] leading-none">{l.origin.city}, {l.origin.state}</div><div className="text-[12.5px] text-graphite-300">Pickup {shortDate(l.pickup)} {timeOf(l.pickup)}</div></div></div>
                <div className="flex gap-3"><Navigation size={16} className="text-crimson-400 mt-0.5" /><div><div className="font-display font-bold uppercase text-[18px] leading-none">{l.destination.city}, {l.destination.state}</div><div className="text-[12.5px] text-graphite-300">Deliver by {timeOf(l.delivery)}</div></div></div>
              </div>
              <div className="text-[13px] text-graphite-200 mt-3">{l.pallets} pallets · {l.weight.toLocaleString()} lbs · {l.commodity}{l.liftgate ? ' · LIFTGATE' : ''}</div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a href={`https://maps.google.com/?daddr=${encodeURIComponent(`${l.status === 'transit' ? l.destination.city : l.origin.city}, ${l.origin.state}`)}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost">Navigate</a>
                {(l.status === 'booked' || l.status === 'dispatched') && (
                  <label className="btn btn-sm btn-red cursor-pointer"><Camera size={14} /> BOL &amp; go
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]
                      const path = file && mode === 'live' ? await uploadDoc(file, `${l.ref}-BOL-${file.name}`) : null
                      upsertLoad({ ...l, bol: true, status: 'transit', bolPath: path ?? l.bolPath })
                      log(`${me} picked up ${l.ref}, BOL photo ${path || mode === 'demo' ? 'uploaded' : 'taken (upload failed, retry from Documents)'}`, 'load', me)
                    }} />
                  </label>
                )}
                {l.status === 'transit' && <button onClick={() => setSig(l)} className="btn btn-sm btn-red"><PenLine size={14} /> Deliver</button>}
                {l.status === 'delivered' && <span className="btn btn-sm bg-signal-green/15 text-signal-green pointer-events-none"><CheckCircle2 size={14} /> POD done</span>}
              </div>
            </div>
          </div>
        ))}
        {!mine.length && <p className="text-graphite-300 text-sm text-center py-10">No loads assigned. Enjoy the break.</p>}
        <a href={`tel:${brain.company.phone}`} className="btn btn-ghost w-full mt-2"><Phone size={15} /> Call dispatch</a>
        {standalone && <button onClick={() => onExit ? onExit() : setUser(null)} className="w-full text-[12px] font-mono uppercase tracking-[.14em] text-graphite-400 py-3 flex items-center justify-center gap-2"><LogOut size={12} /> {onExit ? 'Exit driver view' : 'Sign out'}</button>}
      </div>}

      {sig && <Signature onCancel={() => setSig(null)} load={sig} onDone={async (png, receiver) => {
        const path = mode === 'live' && png ? await uploadDoc(png, `${sig.ref}-POD.png`) : null
        upsertLoad({ ...sig, status: 'delivered', pod: true, podName: receiver, podPath: path ?? sig.podPath })
        log(`${me} delivered ${sig.ref} in ${sig.destination.city}, POD signed by ${receiver}`, 'load', me); setSig(null)
      }} />}
    </div>
  )

  if (standalone) return <div className="min-h-screen tex-asphalt py-0 sm:py-8">{phone}</div>
  return (
    <>
      <div className="mb-6"><div className="eyebrow mb-1.5">Driver app</div><h1 className="h-display text-[40px]">What drivers see</h1><p className="text-graphite-300 mt-1 max-w-2xl">Phone-first. Drivers snap the BOL at pickup and collect a signature at delivery. The load moves on the dispatch board automatically. Sign in as a driver to use it full screen.</p></div>
      {phone}
    </>
  )
}

function Signature({ onDone, onCancel, load }: { onDone: (png: Blob | null, receiver: string) => void; onCancel: () => void; load: Load }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [has, setHas] = useState(false)
  const [name, setName] = useState('')
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; ctx.scale(2, 2)
    ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.strokeStyle = '#0D0E10'
    let down = false
    const pos = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const start = (e: PointerEvent) => { down = true; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y) }
    const move = (e: PointerEvent) => { if (!down) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); setHas(true) }
    const end = () => { down = false }
    c.addEventListener('pointerdown', start); c.addEventListener('pointermove', move); window.addEventListener('pointerup', end)
    return () => { c.removeEventListener('pointerdown', start); c.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end) }
  }, [])
  return (
    <div className="absolute inset-0 bg-black/80 flex items-end">
      <div className="w-full bg-ivory text-onyx p-5">
        <div className="font-display font-extrabold uppercase text-[22px]">Proof of delivery</div>
        <div className="text-[13px] text-graphite">{load.ref} · {load.pallets} pallets to {load.destination.city}</div>
        <input className="input-light mt-3" placeholder="Receiver name" value={name} onChange={e => setName(e.target.value)} />
        <canvas ref={ref} className="w-full h-36 bg-white mt-3 ring-1 ring-ivory-300 touch-none" />
        <div className="text-[11px] text-graphite mt-1">Sign above</div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={onCancel} className="btn btn-sm bg-white ring-1 ring-ivory-300">Cancel</button>
          <button disabled={!has || !name} onClick={() => ref.current ? ref.current.toBlob(b => onDone(b, name), 'image/png') : onDone(null, name)} className="btn btn-sm btn-red disabled:opacity-40">Confirm delivery</button>
        </div>
      </div>
    </div>
  )
}
