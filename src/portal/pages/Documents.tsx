import { useState } from 'react'
import { Printer } from 'lucide-react'
import { usePortal } from '../store'
import { PageHead, shortDate, timeOf, usd } from '../../components/ui'
import { Logo } from '../../components/Logo'

const TYPES = ['Invoice', 'Rate confirmation', 'Bill of lading', 'Capability statement'] as const

export default function Documents() {
  const { loads, brain } = usePortal()
  const [type, setType] = useState<(typeof TYPES)[number]>('Invoice')
  const [loadId, setLoadId] = useState(loads[0]?.id)
  const l = loads.find(x => x.id === loadId) ?? loads[0]
  const c = brain.company

  return (
    <>
      <PageHead eyebrow="Documents" title="Paperwork in one click" sub="Generated from the load record, so the numbers always match. Print or save as PDF." right={import.meta.env.MODE !== 'preview' && <button onClick={() => window.print()} className="btn btn-red no-print"><Printer size={16} /> Print / save PDF</button>} />
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <div className="flex bg-onyx-850 ring-1 ring-white/[.06]">{TYPES.map(t => <button key={t} onClick={() => setType(t)} className={`px-3.5 h-9 text-[13px] font-semibold ${type === t ? 'bg-crimson text-white' : 'text-graphite-200 hover:text-white'}`}>{t}</button>)}</div>
        {type !== 'Capability statement' && <select className="input h-9 w-auto text-[13px]" value={loadId} onChange={e => setLoadId(e.target.value)}>{loads.map(x => <option key={x.id} value={x.id}>{x.ref} · {x.customer}</option>)}</select>}
      </div>

      <div className="bg-white text-onyx max-w-[850px] mx-auto shadow-2xl print:shadow-none">
        <div className="bg-onyx px-10 py-7 flex items-center justify-between">
          <Logo className="h-14 w-auto" />
          <div className="text-right text-ivory"><div className="font-display font-extrabold uppercase text-[26px] tracking-wide">{type}</div>{type !== 'Capability statement' && <div className="font-mono text-[12px] text-graphite-300">{type === 'Invoice' ? 'INV' : type === 'Bill of lading' ? 'BOL' : 'RC'}-{l.ref}</div>}</div>
        </div>
        <div className="h-1.5 bg-crimson" />
        <div className="px-10 py-8 text-[14px]">
          <div className="flex justify-between gap-8 text-[13px] text-graphite">
            <div><b className="text-onyx">{c.legalName}</b><br />{c.address}<br />{c.phone} · {c.email}<br />USDOT {c.usdot} · MC {c.mc}</div>
            {type !== 'Capability statement' && <div className="text-right"><b className="text-onyx">{type === 'Invoice' ? 'Bill to' : 'Customer'}</b><br />{l.customer}<br />Date: {new Date().toLocaleDateString()}<br />{type === 'Invoice' && 'Terms: Net 30'}</div>}
          </div>

          {type === 'Capability statement' ? (
            <div className="mt-8 grid grid-cols-[1.3fr_1fr] gap-10">
              <div>
                <h3 className="font-display font-extrabold uppercase text-[20px] border-b-2 border-crimson pb-1">Core capabilities</h3>
                <ul className="list-disc pl-5 mt-3 space-y-1">{['LTL and partial truckload, 1–12 pallets', 'Final-mile and liftgate delivery', 'Expedited / same-day regional runs', 'Dedicated and scheduled routes', 'Office, furniture and surplus property moves'].map(x => <li key={x}>{x}</li>)}</ul>
                <h3 className="font-display font-extrabold uppercase text-[20px] border-b-2 border-crimson pb-1 mt-7">Differentiators</h3>
                <ul className="list-disc pl-5 mt-3 space-y-1">{['Owner-operated: direct line to decision maker', 'Non-CDL box trucks fit tight docks and urban sites', 'Clean FMCSA record: 0 crashes, 0 out-of-service', 'Same-day POD and invoicing'].map(x => <li key={x}>{x}</li>)}</ul>
              </div>
              <div className="bg-ivory p-5 space-y-3 text-[13px]">
                <h3 className="font-display font-extrabold uppercase text-[18px]">Company data</h3>
                {[['Primary NAICS', '484110 General Freight Trucking, Local'], ['Also', '484122 · 492110 · 484210'], ['UEI / CAGE', brain.registrations.sam ? 'On file' : 'Registration in progress'], ['Insurance', `${usd(brain.insurance.autoLiability)} auto liability`], ['Authority since', 'August 2025'], ['Service area', brain.service.preferredStates.join(', ')], ['Point of contact', `${c.owner}, Owner`]].map(([k, v]) => <div key={k}><div className="font-mono text-[10px] uppercase tracking-[.16em] text-graphite-300">{k}</div><div className="font-semibold">{v}</div></div>)}
              </div>
            </div>
          ) : (
            <>
              <table className="w-full mt-8 text-[13.5px] border-collapse">
                <thead><tr className="bg-onyx text-ivory text-left font-mono text-[10.5px] uppercase tracking-[.14em]"><th className="p-2.5">Pickup</th><th className="p-2.5">Delivery</th><th className="p-2.5">Freight</th><th className="p-2.5 text-right">{type === 'Bill of lading' ? 'Weight' : 'Amount'}</th></tr></thead>
                <tbody><tr className="border-b border-ivory-300 align-top">
                  <td className="p-2.5"><b>{l.origin.city}, {l.origin.state}</b><br />{shortDate(l.pickup)} {timeOf(l.pickup)}</td>
                  <td className="p-2.5"><b>{l.destination.city}, {l.destination.state}</b><br />{shortDate(l.delivery)} {timeOf(l.delivery)}</td>
                  <td className="p-2.5">{l.pallets} pallets · {l.commodity}<br />{l.miles} mi{l.liftgate ? ' · liftgate' : ''}</td>
                  <td className="p-2.5 text-right font-bold">{type === 'Bill of lading' ? `${l.weight.toLocaleString()} lbs` : usd(l.rate, 2)}</td>
                </tr></tbody>
              </table>
              {type !== 'Bill of lading' && <div className="flex justify-end mt-4"><div className="w-64 text-[14px]"><div className="flex justify-between py-1"><span>Linehaul</span><span>{usd(l.rate, 2)}</span></div><div className="flex justify-between py-1"><span>Accessorials</span><span>$0.00</span></div><div className="flex justify-between py-2 border-t-2 border-onyx font-bold text-[18px]"><span>Total</span><span>{usd(l.rate, 2)}</span></div></div></div>}
              <div className="grid grid-cols-2 gap-10 mt-12 text-[12.5px] text-graphite">
                <div><div className="border-b border-onyx h-10" />{type === 'Bill of lading' ? 'Shipper signature / date' : 'Authorized by CWN Carriers'}</div>
                <div><div className="border-b border-onyx h-10" />{type === 'Bill of lading' ? 'Carrier signature / date' : type === 'Invoice' ? 'Remit to: ' + c.legalName : 'Customer acceptance'}</div>
              </div>
              {l.driver && <p className="text-[12px] text-graphite mt-6">Truck {l.truck ?? '—'} · {l.driver}</p>}
            </>
          )}
        </div>
      </div>
    </>
  )
}
