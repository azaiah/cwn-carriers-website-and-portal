import { Phone, Truck, UserRound } from 'lucide-react'
import { usePortal } from '../store'
import { PageHead, Panel, usd } from '../../components/ui'

export default function Fleet() {
  const { brain, drivers, setDrivers, loads } = usePortal()
  const weekAgo = Date.now() - 7 * 86400000
  const byTruck = (u: string) => loads.filter(l => l.truck === u && new Date(l.pickup).getTime() > weekAgo)
  return (
    <>
      <PageHead eyebrow="Fleet & drivers" title="Equipment and team" sub="Truck utilization over the last 7 days and who's on duty. Rename drivers here and they update everywhere." />
      <div className="grid md:grid-cols-3 gap-4">
        {brain.fleet.map(t => {
          const ls = byTruck(t.unit)
          const rev = ls.reduce((a, l) => a + l.rate, 0)
          const mi = ls.reduce((a, l) => a + l.miles, 0)
          const util = Math.min(100, Math.round(mi / 1500 * 100))
          return (
            <div key={t.id} className={`plate overflow-hidden ${t.status === 'planned' ? 'opacity-80 ring-1 ring-dashed ring-white/15' : ''}`}>
              <div className="relative bg-gradient-to-b from-onyx-700 to-onyx-850 px-6 pt-6 pb-2">
                <span className={`absolute right-4 top-4 chip ${t.status === 'active' ? 'bg-signal-green/15 text-signal-green' : t.status === 'shop' ? 'bg-signal-amber/15 text-signal-amber' : 'bg-white/5 text-graphite-300'}`}>{t.status}</span>
                <div className="font-display font-extrabold text-[44px] leading-none">#{t.unit}</div>
                <img src={`${import.meta.env.BASE_URL}assets/photos/truck-warehouse.webp`} alt="" className={`w-full h-36 object-cover object-[60%_55%] mt-3 ${t.status === 'planned' ? 'grayscale opacity-50' : ''}`} />
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-[14px]"><span className="text-graphite-300">{t.label}</span><span>{t.liftgate === null ? 'Liftgate ?' : t.liftgate ? 'Liftgate' : 'No liftgate'}</span></div>
                {t.status !== 'planned' ? <>
                  <div><div className="flex justify-between text-[12px] font-mono text-graphite-400 mb-1"><span>UTILIZATION · 7D</span><span>{util}%</span></div><div className="h-2 bg-onyx-600"><div className="h-full bg-crimson" style={{ width: util + '%' }} /></div></div>
                  <div className="grid grid-cols-3 gap-2 text-center">{[['Loads', ls.length], ['Miles', mi], ['Revenue', usd(rev)]].map(([k, v]) => <div key={k as string} className="bg-onyx-750 py-2"><div className="font-display font-extrabold text-[20px]">{v}</div><div className="text-[10.5px] font-mono text-graphite-400 uppercase">{k}</div></div>)}</div>
                </> : <p className="text-[13.5px] text-graphite-300">Planned. See <b>Money → Truck #3 calculator</b> for what it needs to earn to pay for itself.</p>}
              </div>
            </div>
          )
        })}
      </div>

      <Panel title="Drivers" className="mt-4" pad={false}>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Truck</th><th>License</th><th>Since</th><th>Loads (30d)</th></tr></thead>
            <tbody>
              {drivers.map((d, i) => (
                <tr key={d.id}>
                  <td><div className="flex items-center gap-2"><UserRound size={15} className="text-graphite-400" /><input className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-crimson outline-none font-semibold w-32" value={d.name} onChange={e => setDrivers(drivers.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></div></td>
                  <td><a href={`tel:${d.phone}`} className="flex items-center gap-1.5 text-graphite-200 hover:text-white"><Phone size={13} />{d.phone}</a></td>
                  <td><select className="bg-transparent text-[13px]" value={d.status} onChange={e => setDrivers(drivers.map((x, j) => j === i ? { ...x, status: e.target.value as never } : x))}><option className="bg-onyx">driving</option><option className="bg-onyx">on duty</option><option className="bg-onyx">off</option></select></td>
                  <td>{d.truck ? <span className="flex items-center gap-1.5"><Truck size={13} /> {d.truck}</span> : '—'}</td>
                  <td>{d.cdl ? 'CDL' : 'Non-CDL'}</td><td>{d.hired}</td>
                  <td>{loads.filter(l => l.driver === d.name).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
