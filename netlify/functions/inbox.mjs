// Load inbox for the Load Finder.
//
// POST /api/inbox   (header: x-ingest-key: <INGEST_KEY>)
//   Body: JSON { text, source?, subject?, from? }  or plain text.
//   Point a Gmail/Yahoo forwarding rule, Zapier, Make or n8n here so broker
//   load-list emails and Curri/marketplace notices land in the portal. The portal
//   parses each message into load cards and scores them with the Company Brain.
//
// GET /api/inbox → the latest 150 messages (newest first).
import { getStore } from '@netlify/blobs'

const KEY = 'inbox'

export default async req => {
  const store = getStore('cwn')
  if (req.method === 'GET') {
    const cur = (await store.get(KEY, { type: 'json' })) ?? { items: [] }
    return Response.json({ items: cur.items.slice(0, 150) }, { headers: { 'cache-control': 'no-store' } })
  }
  if (req.method !== 'POST') return new Response('GET or POST', { status: 405 })
  if (!process.env.INGEST_KEY || req.headers.get('x-ingest-key') !== process.env.INGEST_KEY) return new Response('Unauthorized', { status: 401 })

  let msg
  const type = req.headers.get('content-type') ?? ''
  try {
    if (type.includes('json')) {
      const b = await req.json()
      msg = { text: String(b.text ?? b.body ?? ''), source: String(b.source ?? 'Email'), subject: b.subject ? String(b.subject) : undefined, from: b.from ? String(b.from) : undefined }
    } else msg = { text: await req.text(), source: 'Email' }
  } catch { return new Response('Bad body', { status: 400 }) }
  if (!msg.text.trim()) return new Response('Empty text', { status: 400 })

  const item = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), ...msg, text: msg.text.slice(0, 20000) }
  const cur = (await store.get(KEY, { type: 'json' })) ?? { items: [] }
  const items = [item, ...cur.items].slice(0, 300)
  await store.setJSON(KEY, { items })
  return Response.json({ ok: true, id: item.id, total: items.length })
}
