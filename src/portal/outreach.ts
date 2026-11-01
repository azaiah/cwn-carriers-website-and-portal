import type { Brain } from '../brain/types'
import type { ScoredOpp } from './store'

/** Template drafts (used when the AI function isn't configured). Facts only, no invented claims. */
export function draftOutreach(o: ScoredOpp, b: Brain): { subject: string; body: string; channel: 'Email' | 'Call' } {
  const c = b.company
  const sig = `${c.owner}\nOwner, ${c.dba}\n${c.phone} · ${c.email}\nUSDOT ${c.usdot} · MC ${c.mc}`
  if (o.kind === 'bid') {
    return {
      channel: 'Email',
      subject: `Question on: ${o.title}`,
      body: `Hello,\n\nI'm ${c.owner}, owner of ${c.legalName}, a Chesterfield, VA box-truck carrier with active interstate authority (USDOT ${c.usdot}, MC ${c.mc}) and $${(b.insurance.autoLiability / 1e6).toFixed(0)}M auto liability coverage.\n\nWe're reviewing "${o.title}" and plan to respond. Two quick questions:\n1. Is there an incumbent, and can you share the current award amount or volume?\n2. Will you accept a small business with box-truck (non-CDL) equipment for this scope?\n\nThank you. I look forward to the response.\n\n${sig}`,
    }
  }
  if (o.kind === 'partner') {
    return {
      channel: 'Email',
      subject: `Box-truck capacity in Richmond: ${c.dba}`,
      body: `Hi,\n\nI run ${c.dba} out of Chesterfield, VA: ${b.fleet.filter(t => t.status === 'active').length} box trucks, ${b.drivers.total} drivers, active authority (MC ${c.mc}) and $1M liability, with a clean safety record.\n\nWe're looking to add steady work and saw ${o.org}. We'd like to get set up. What do you need from us to start? We can send a COI and W-9 today.\n\n${sig}`,
    }
  }
  const city = o.origin.city
  return {
    channel: 'Email',
    subject: `Local box-truck carrier for ${o.org.split(':')[0].split('(')[0].trim()}`,
    body: `Hi,\n\nI'm ${c.owner} with ${c.dba}, a local carrier based in Chesterfield, about ${o.s.distance} miles from your ${city} operation.\n\nWe run LTL, final-mile and expedited box-truck freight (${b.service.modes.slice(0, 3).join(', ').toLowerCase()}) across Virginia and the Mid-Atlantic. For a site like yours, that usually means faster pickups for partial loads, liftgate deliveries, and same-day runs when something can't wait.\n\nWould you be open to a 10-minute call this week to see if we can take a lane or two off your plate? Happy to start with a single test load.\n\n${sig}`,
  }
}

export async function aiDraft(o: ScoredOpp, b: Brain): Promise<string | null> {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: 'Write a short first-touch outreach email (subject line, then body under 140 words) from Lawrence to this opportunity. Use only facts given.', context: { opportunity: o, company: b.company, fleet: b.fleet, insurance: b.insurance, service: b.service } }),
    })
    if (!r.ok) return null
    const j = await r.json()
    return j.text || null
  } catch { return null }
}
