import { miles } from './score'
import type { Brain, Opportunity, Place } from './types'

/** A past load CWN hauled (from Dispatch), used as private lane history. */
export interface HaulRecord { origin: Place; destination: Place; miles: number; rate: number }

export interface RateAdvice {
  tripMiles: number
  deadhead: number
  cost: number            // fuel, wear, insurance, driver: loaded + empty miles × cost/mi
  floor: number           // never go below
  target: number          // what to aim for
  counter: number         // the number to say back
  posted: number | null
  verdict: 'take' | 'counter' | 'walk' | 'ask'
  basis: string           // where the target came from
  history: number         // how many similar CWN loads informed it
  script: string
  extras: string[]
}

const round5 = (n: number) => Math.round(n / 5) * 5

// Box-truck market bands by length of haul (O Trucking, Sept 2026). Midpoints.
function benchmarkPerMile(m: number) {
  if (m < 100) return 3.5
  if (m <= 400) return 2.45
  return 1.95
}

export function rateCoach(o: Opportunity, b: Brain, history: HaulRecord[] = [], from: Place = b.home): RateAdvice {
  const tripMiles = o.miles ?? (o.destination ? miles(o.origin, o.destination) : 0)
  const deadhead = miles(from, o.origin)
  const cost = (tripMiles + deadhead) * b.money.costPerMile
  const floor = round5(Math.max(b.money.minPerLoad, tripMiles * b.money.rateFloorPerMile, cost * 1.15))

  // Private lane history: CWN loads whose pickup and drop are within 40 miles of this one.
  const similar = o.destination ? history.filter(h =>
    miles(h.origin, o.origin) <= 40 && miles(h.destination, o.destination!) <= 40 && h.miles > 0) : []
  const histRpm = similar.length ? similar.reduce((a, h) => a + h.rate / h.miles, 0) / similar.length : null
  const bench = benchmarkPerMile(tripMiles || 100)
  const rpm = histRpm ? (histRpm * 0.7 + bench * 0.3) : bench
  const shortRun = tripMiles > 0 && tripMiles < 60
  const target = round5(Math.max(floor * 1.1, tripMiles * rpm, shortRun ? b.money.minPerLoad * 1.15 : 0))
  const basis = histRpm
    ? `Your last ${similar.length} similar load${similar.length > 1 ? 's' : ''} paid about $${histRpm.toFixed(2)}/mi, blended with the box-truck market`
    : `Box-truck market for a ${tripMiles < 100 ? 'short local' : tripMiles <= 400 ? 'regional' : 'long'} run, about $${bench.toFixed(2)}/mi`

  const posted = o.rateKnown === false || !o.estValue ? null : o.estValue
  let counter = target
  let verdict: RateAdvice['verdict'] = 'ask'
  if (posted !== null) {
    if (posted >= target) { verdict = 'take'; counter = posted }
    else if (posted >= floor) { verdict = 'counter'; counter = round5(Math.min(target, posted + Math.min(150, Math.max(50, posted * 0.08)))) }
    else { verdict = 'walk'; counter = floor }
  }

  const lane = `${o.origin.city}, ${o.origin.state}${o.destination ? ` to ${o.destination.city}, ${o.destination.state}` : ''}`
  const reason = deadhead > 60 ? `I'm running ${deadhead} miles empty to get to the pickup` : tripMiles < 80 ? 'it\'s a short run with a lot of dock time' : 'it lines up with my truck today'
  const script = verdict === 'take'
    ? `Hi, this is Lawrence with CWN Carriers, MC ${b.company.mc}. I can cover the ${lane} load at $${posted}. Please send the rate confirmation with detention and any lumper terms on it.`
    : verdict === 'walk'
      ? `Hi, this is Lawrence with CWN Carriers, MC ${b.company.mc}, about ${lane}. I can't run it for $${posted}. My bottom line on this one is $${floor}. If that works, I've got a box truck ready.`
      : `Hi, this is Lawrence with CWN Carriers, MC ${b.company.mc}, calling about ${lane}. I've got a 26-foot box truck available. I can do it for $${counter}, since ${reason}. Can you get there?`

  const extras = [
    'Detention: free time and the hourly rate after it, in writing',
    'TONU (truck ordered, not used) amount',
    ...(o.needsLiftgate ? ['Liftgate fee'] : []),
    'Lumper: who pays it, and get it on the rate con',
    'Extra stops, inside delivery or residential: price each one',
  ]
  return { tripMiles, deadhead, cost: Math.round(cost), floor, target, counter, posted, verdict, basis, history: similar.length, script, extras }
}
