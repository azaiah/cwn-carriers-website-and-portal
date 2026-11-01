// POST /api/ingest   (header: x-ingest-key: <INGEST_KEY>)
// Body: { items: Opportunity[] }  →  merged into the sweep feed the portal reads from /api/opps.
// This is how the weekly research sweep (a scheduled Claude task, same as the CSL and Gundy
// builds) delivers new bids and leads. No SAM.gov API key needed.
import { getStore } from '@netlify/blobs'

export default async req => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })
  if (!process.env.INGEST_KEY || req.headers.get('x-ingest-key') !== process.env.INGEST_KEY) return new Response('Unauthorized', { status: 401 })
  let body
  try { body = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }
  const incoming = Array.isArray(body?.items) ? body.items : []
  const valid = incoming.filter(o => o && o.id && o.title && o.kind && o.origin && typeof o.origin.lat === 'number')
  const store = getStore('cwn')
  const cur = (await store.get('sweep', { type: 'json' })) ?? { items: [] }
  const byId = new Map(cur.items.map(o => [o.id, o]))
  for (const o of valid) byId.set(o.id, { status: 'new', sample: false, ...o })
  const items = [...byId.values()].slice(-500)
  await store.setJSON('sweep', { generated: new Date().toISOString(), items })
  return Response.json({ ok: true, added: valid.length, rejected: incoming.length - valid.length, total: items.length })
}
