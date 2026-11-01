import type { Brain, Opportunity, Place, Reason, Scored } from './types'

export function miles(a: Place, b: Place): number {
  const R = 3958.8, toR = Math.PI / 180
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.18) // ×1.18 road-distance factor
}

const money = (n: number) => '$' + Math.round(n).toLocaleString()
const EQUIP_LABEL: Record<string, string> = {
  box26: '26 ft box truck', box16: '16 ft box truck', cargoVan: 'cargo van', tractor53: "53' tractor-trailer",
  flatbed: 'flatbed', reefer: 'refrigerated unit', any: 'any equipment',
}

/**
 * The Company Brain scorer. Hard stops come first (things CWN legally or
 * physically can't do), then six weighted factors that the owner tunes in
 * the portal. Every point is explained so Lawrence can trust the ranking.
 */
export function scoreOpp(o: Opportunity, b: Brain): Scored {
  const reasons: Reason[] = []
  const stops: string[] = []
  const activeTypes = new Set(b.fleet.filter(t => t.status !== 'shop').map(t => t.type))
  const anyLiftgate = b.fleet.some(t => t.status === 'active' && t.liftgate === true)
  const liftgateUnknown = b.fleet.some(t => t.status === 'active' && t.liftgate === null)

  // ---------- hard stops ----------
  if (o.hazmat && b.service.neverHaul.some(x => /hazmat/i.test(x))) stops.push('Hazmat freight. CWN has no hazmat authority and lists it as never-haul')
  if (o.needsCDL && b.drivers.cdl === 0) stops.push('Requires CDL drivers. CWN currently runs 0 CDL holders')
  if (o.equipment === 'tractor53' && !activeTypes.has('tractor53')) stops.push("Needs a 53' tractor-trailer. Not in the fleet")
  if (o.equipment === 'reefer' && !activeTypes.has('reefer')) stops.push('Needs refrigerated equipment. Not in the fleet')
  if (o.equipment === 'flatbed' && !activeTypes.has('flatbed')) stops.push('Needs a flatbed. Not in the fleet')
  if (o.minAutoLiability && o.minAutoLiability > b.insurance.autoLiability)
    stops.push(`Requires ${money(o.minAutoLiability)} auto liability. CWN carries ${money(b.insurance.autoLiability)}`)
  const blocked = b.service.neverHaul.find(x => o.tags?.some(t => t.toLowerCase() === x.toLowerCase()))
  if (blocked) stops.push(`${blocked} is on the never-haul list`)

  const distance = miles(b.home, o.origin)
  if (distance > b.service.radiusMiles * 1.5) stops.push(`Picks up ${distance} mi from Chesterfield, far outside the ${b.service.radiusMiles} mi service area`)
  const tripMiles = o.miles ?? (o.destination ? miles(o.origin, o.destination) : 0)

  // ---------- factors (0..1) ----------
  // 1. Fit: equipment + services + liftgate + cargo insurance + set-aside
  let fit = 0.55
  if (o.equipment === 'any' || activeTypes.has(o.equipment)) { fit += 0.25; reasons.push({ kind: 'plus', text: `Fits the ${EQUIP_LABEL[o.equipment] ?? o.equipment}` }) }
  if (o.equipment === 'cargoVan') { fit += 0.1; reasons.push({ kind: 'plus', text: 'Van-sized work. A box truck over-covers it' }) }
  if (o.needsLiftgate) {
    if (anyLiftgate) { fit += 0.1; reasons.push({ kind: 'plus', text: 'Liftgate required and available' }) }
    else if (liftgateUnknown) { fit -= 0.1; reasons.push({ kind: 'info', text: 'Needs a liftgate. Confirm trucks 101/102 have one' }) }
    else { fit -= 0.35; reasons.push({ kind: 'minus', text: 'Needs a liftgate and no active truck has one' }) }
  }
  if (o.minCargo) {
    if (b.insurance.cargo === null) { fit -= 0.08; reasons.push({ kind: 'info', text: `Asks for ${money(o.minCargo)} cargo coverage. CWN cargo limit not on file yet` }) }
    else if (b.insurance.cargo < o.minCargo) { fit -= 0.3; reasons.push({ kind: 'minus', text: `Cargo coverage ${money(b.insurance.cargo)} is below the ${money(o.minCargo)} required` }) }
    else { fit += 0.05; reasons.push({ kind: 'plus', text: 'Cargo insurance meets requirement' }) }
  }
  if (o.setAside?.length) {
    const has = o.setAside.some(s => b.registrations.certifications.includes(s) || s === 'Small Business')
    if (has) { fit += 0.08; reasons.push({ kind: 'plus', text: `Set-aside CWN qualifies for: ${o.setAside.join(', ')}` }) }
    else stops.push(`Set aside for ${o.setAside.join(', ')} firms. CWN does not hold that certification`)
  }
  if (o.kind === 'bid' && !b.registrations.sam && /sam|usps/i.test(o.source)) { fit -= 0.1; reasons.push({ kind: 'minus', text: 'Federal bid. SAM.gov registration must be active before CWN can submit' }) }
  if (o.kind === 'bid' && !b.registrations.eva && /eva/i.test(o.source)) { fit -= 0.06; reasons.push({ kind: 'minus', text: 'State/local bid. Needs eVA vendor registration first' }) }
  fit = clamp(fit)

  // 2. Profit: implied rate per mile vs floor
  let profit = 0.55
  if (o.valueBasis === 'per-load' && tripMiles > 0) {
    const rpm = o.estValue / tripMiles
    const ratio = rpm / b.money.rateFloorPerMile
    profit = clamp(0.25 + (ratio - 0.7) * 0.9)
    reasons.push({ kind: rpm >= b.money.rateFloorPerMile ? 'plus' : 'minus', text: `Pays about $${rpm.toFixed(2)}/mi vs your $${b.money.rateFloorPerMile.toFixed(2)} floor` })
    const margin = o.estValue - tripMiles * b.money.costPerMile
    reasons.push({ kind: margin > 0 ? 'info' : 'minus', text: `Estimated margin ${margin >= 0 ? '' : '-'}${money(Math.abs(margin))} after ~$${b.money.costPerMile.toFixed(2)}/mi costs` })
    if (o.estValue < b.money.minPerLoad) { profit -= 0.2; reasons.push({ kind: 'minus', text: `Below your ${money(b.money.minPerLoad)} minimum per load` }) }
  } else if (o.valueBasis === 'annual') {
    const perTruckWeek = o.estValue / 50
    profit = clamp(0.35 + Math.min(perTruckWeek / b.money.weeklyTargetPerTruck, 1.4) * 0.45)
    reasons.push({ kind: 'info', text: `Worth ~${money(o.estValue)}/yr (≈ ${money(perTruckWeek)}/week)` })
  }
  profit = clamp(profit)

  // 3. Distance from home base
  let dist = 1
  if (distance <= 40) { dist = 1; reasons.push({ kind: 'plus', text: `${distance} mi from Chesterfield. Home-daily work` }) }
  else if (distance <= b.service.radiusMiles) { dist = clamp(1 - (distance - 40) / (b.service.radiusMiles * 1.4)); reasons.push({ kind: 'info', text: `${distance} mi deadhead from Chesterfield` }) }
  else { dist = 0.1; reasons.push({ kind: 'minus', text: `${distance} mi away, outside the ${b.service.radiusMiles} mi radius` }) }
  if (o.destination && !b.service.preferredStates.includes(o.destination.state)) { dist -= 0.15; reasons.push({ kind: 'minus', text: `Delivers to ${o.destination.state}, outside preferred states` }) }
  dist = clamp(dist)

  // 4. Recurrence (steady money beats one-offs)
  const rec = { contract: 1, daily: 0.95, weekly: 0.8, 'one-time': 0.35 }[o.recurrence]
  if (o.recurrence !== 'one-time') reasons.push({ kind: 'plus', text: o.recurrence === 'contract' ? 'Multi-month contract. Steady revenue' : `Recurring ${o.recurrence} work` })
  const recurrence = b.goals.dedicatedRoutes ? rec : 0.5 + rec / 2

  // 5. Winnability: small-carrier friendly signals
  let win = 0.55
  if (o.kind === 'partner') win += 0.2
  if (o.kind === 'load') win += 0.25
  if (o.kind === 'bid' && o.estValue > 750000) { win -= 0.25; reasons.push({ kind: 'minus', text: 'Large contract. Expect bigger fleets to compete' }) }
  if (o.kind === 'bid' && o.estValue <= 150000) { win += 0.15; reasons.push({ kind: 'plus', text: 'Contract size a 2–3 truck carrier can win' }) }
  if (o.kind === 'lead' && distance <= 40) win += 0.1
  win = clamp(win)

  // 6. Urgency
  let urgency = 0.5
  if (o.dueDate) {
    const days = Math.ceil((new Date(o.dueDate).getTime() - Date.now()) / 86400000)
    if (days < 0) { urgency = 0; reasons.push({ kind: 'minus', text: 'Deadline has passed' }) }
    else if (days <= 3) { urgency = 1; reasons.push({ kind: 'info', text: `Due in ${days} day${days === 1 ? '' : 's'}. Act now` }) }
    else if (days <= 14) urgency = 0.8
    else urgency = 0.55
  }

  const w = b.weights
  const total = w.fit + w.profit + w.distance + w.recurrence + w.winnability + w.urgency || 1
  let score = (fit * w.fit + profit * w.profit + dist * w.distance + recurrence * w.recurrence + win * w.winnability + urgency * w.urgency) / total * 100
  if (o.kind === 'bid' && b.goals.govContracts) score += 3
  score = Math.round(Math.max(0, Math.min(100, score)))

  if (stops.length) {
    return { score: Math.min(score, 18), grade: 'D', verdict: 'Pass', reasons: [...stops.map(t => ({ kind: 'stop' as const, text: t })), ...reasons], distance }
  }
  const grade = score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D'
  const verdict = score >= 70 ? 'Go' : score >= 52 ? 'Maybe' : 'Pass'
  return { score, grade, verdict, reasons, distance }
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

export function brainCompleteness(b: Brain): number {
  // 14 facts are verified from FMCSA records; each open unknown pulls the meter down
  const verified = 14
  return Math.round((verified / (verified + b.unknowns.length)) * 100)
}
