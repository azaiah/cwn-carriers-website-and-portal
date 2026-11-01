import { useState } from 'react'
import { usePortal } from '../store'
import { loadStats, truckThree } from '../calc'
import { PageHead, Panel, Stat, daysUntil, shortDate, usd } from '../../components/ui'

export default function Money() {
  const { loads, brain, moveLoad, log } = usePortal()
  const st = loadStats(loads, brain)
  const open = loads.filter(l => l.status === 'invoiced' || l.status === 'delivered')
  const [t3, setT3] = useState({ payment: 1650, insurance: 650, driverPayPerMile: 0.6, fuelPerMile: 0.55, maintPerMile: 0.18, ratePerMile: brain.money.rateFloorPerMile, weeklyMiles: 1300 })
  const r = truckThree(t3)

  // lane rollup
  const lanes = Object.values(loads.filter(l => l.status !== 'quoted').reduce<Record<string, { lane: string; n: number; rev: number; mi: number }>>((a, l) => {
    const k = `${l.origin.city} → ${l.destination.city}`; a[k] ??= { lane: k, n: 0, rev: 0, mi: 0 }; a[k].n++; a[k].rev += l.rate; a[k].mi += l.miles; return a
  }, {})).sort((a, b) => b.rev - a.rev)

  return (
    <>
      <PageHead eyebrow="Money" title="Revenue, cash & the truck #3 math" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Stat accent label="Revenue · 30 days" value={usd(st.monthRevenue)} hint={`${st.monthMiles.toLocaleString()} loaded miles`} />
        <Stat label="Est. operating cost" value={usd(st.monthCost)} hint={`at $${brain.money.costPerMile.toFixed(2)}/mi`} />
        <Stat label="Est. margin" value={usd(st.monthMargin)} hint={st.monthRevenue ? `${Math.round(st.monthMargin / st.monthRevenue * 100)}% of revenue` : ''} />
        <Stat label="Avg rate / mile" value={'$' + st.rpm.toFixed(2)} hint={`floor $${brain.money.rateFloorPerMile.toFixed(2)}`} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4 mt-4">
        <Panel title="Receivables" pad={false}>
          <table className="tbl">
            <thead><tr><th>Load</th><th>Customer</th><th>Delivered</th><th>Age</th><th className="text-right">Amount</th><th /></tr></thead>
            <tbody>{open.map(l => {
              const age = -(daysUntil(l.delivery) ?? 0)
              return (
                <tr key={l.id}>
                  <td className="font-mono text-[12.5px]">{l.ref}</td><td>{l.customer}</td><td>{shortDate(l.delivery)}</td>
                  <td><span className={`chip ${age > 30 ? 'bg-crimson/20 text-crimson-400' : age > 15 ? 'bg-signal-amber/15 text-signal-amber' : 'bg-white/5 text-graphite-200'}`}>{age}d</span></td>
                  <td className="text-right font-semibold">{usd(l.rate)}</td>
                  <td className="text-right">{l.status === 'delivered'
                    ? <button onClick={() => { moveLoad(l.id, 'invoiced'); log(`Invoice sent for ${l.ref}`, 'money') }} className="btn btn-sm btn-ivory">Invoice</button>
                    : <button onClick={() => { moveLoad(l.id, 'paid'); log(`Payment received: ${l.ref} ${usd(l.rate)}`, 'money') }} className="btn btn-sm btn-ghost">Mark paid</button>}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </Panel>

        <Panel title="Lanes by revenue" pad={false}>
          <table className="tbl">
            <thead><tr><th>Lane</th><th className="text-right">Loads</th><th className="text-right">Revenue</th><th className="text-right">$/mi</th></tr></thead>
            <tbody>{lanes.map(l => { const rpm = l.rev / l.mi; return (
              <tr key={l.lane}><td className="font-semibold">{l.lane}</td><td className="text-right">{l.n}</td><td className="text-right">{usd(l.rev)}</td><td className={`text-right font-semibold ${rpm < brain.money.rateFloorPerMile ? 'text-signal-amber' : 'text-signal-green'}`}>${rpm.toFixed(2)}</td></tr>
            ) })}</tbody>
          </table>
        </Panel>
      </div>

      <Panel title="Truck #3 calculator" className="mt-4" right={<span className="text-[11px] font-mono uppercase tracking-[.14em] text-graphite-400">Plug in real quotes</span>}>
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {([['payment', 'Truck payment / mo', 0, 4000, 50, '$'], ['insurance', 'Added insurance / mo', 0, 2000, 25, '$'], ['driverPayPerMile', 'Driver pay / mi', 0, 1.2, .01, '$'], ['fuelPerMile', 'Fuel / mi', .2, 1.2, .01, '$'], ['maintPerMile', 'Maintenance / mi', 0, .6, .01, '$'], ['ratePerMile', 'Expected rate / mi', 1.5, 5, .05, '$'], ['weeklyMiles', 'Loaded miles / week', 300, 3000, 50, '']] as const).map(([k, l, mn, mx, s, u]) => (
              <label key={k} className="block"><span className="label flex justify-between">{l}<b className="text-ivory">{u}{k === 'weeklyMiles' || k === 'payment' || k === 'insurance' ? t3[k].toLocaleString() : t3[k].toFixed(2)}</b></span><input type="range" min={mn} max={mx} step={s} value={t3[k]} onChange={e => setT3({ ...t3, [k]: +e.target.value })} className="w-full accent-crimson" /></label>
            ))}
          </div>
          <div className={`p-6 relative overflow-hidden ${r.paybackOk ? 'bg-signal-green/10 ring-1 ring-signal-green/40' : 'bg-crimson/10 ring-1 ring-crimson/40'}`}>
            <div className="label">{r.paybackOk ? 'Truck #3 pays for itself' : 'Not yet profitable'}</div>
            <div className="font-display font-extrabold text-[52px] leading-none mt-1">{usd(r.weeklyProfit)}<span className="text-[18px] text-graphite-300 font-sans font-medium"> /week</span></div>
            <div className="text-graphite-200 mt-1">{usd(r.annualProfit)} a year at {t3.weeklyMiles.toLocaleString()} mi/week</div>
            <dl className="grid grid-cols-2 gap-4 mt-6 text-[14px]">
              <div><dt className="label">Break-even</dt><dd className="font-display font-bold text-[22px]">{isFinite(r.breakEvenMiles) ? Math.ceil(r.breakEvenMiles).toLocaleString() + ' mi/wk' : 'Never'}</dd></div>
              <div><dt className="label">≈ loads / week</dt><dd className="font-display font-bold text-[22px]">{isFinite(r.breakEvenMiles) ? Math.ceil(r.breakEvenMiles / 140) : '—'}</dd></div>
              <div><dt className="label">Fixed cost / week</dt><dd>{usd(r.fixedWeekly)}</dd></div>
              <div><dt className="label">Margin / mile</dt><dd>${r.contribPerMile.toFixed(2)}</dd></div>
            </dl>
            <p className="text-[12.5px] text-graphite-300 mt-5">Assumes ~140 loaded miles per typical CWN load. These are planning estimates, not financial advice. Use real quotes from your lender and insurer.</p>
          </div>
        </div>
      </Panel>
    </>
  )
}
