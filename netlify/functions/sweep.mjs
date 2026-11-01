// OPTIONAL: direct SAM.gov API sweep, Mon/Wed/Fri 6:00 AM ET.
// Only runs if SAM_API_KEY is set. Without it, the weekly research sweep posts
// results through /api/ingest instead (see README → Bid & lead sweeps).
import { getStore } from '@netlify/blobs'
import { sweepSam } from './lib/sam.mjs'

export default async () => {
  if (!process.env.SAM_API_KEY) return Response.json({ skipped: 'SAM_API_KEY not set' })
  const items = await sweepSam(process.env.SAM_API_KEY).catch(e => ({ error: String(e) }))
  if (!Array.isArray(items)) return new Response(JSON.stringify(items), { status: 500 })
  const store = getStore('cwn')
  const cur = (await store.get('sweep', { type: 'json' })) ?? { items: [] }
  const byId = new Map(cur.items.map(o => [o.id, o]))
  for (const o of items) byId.set(o.id, o)
  await store.setJSON('sweep', { generated: new Date().toISOString(), items: [...byId.values()].slice(-500) })
  return Response.json({ ok: true, count: items.length })
}

export const config = { schedule: '0 10 * * 1,3,5' }
