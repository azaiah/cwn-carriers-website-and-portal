// POST /api/ai { task, context } → drafts outreach / briefings with Claude.
// Set ANTHROPIC_API_KEY in Netlify env. The portal falls back to built-in
// templates when this function is unavailable.
const SYSTEM = `You write for CWN Carriers (Commonwealth Nationwide Carriers LLC), a small,
insured, FMCSA-authorized box-truck carrier in Chesterfield, Virginia (USDOT 4444839, MC 1750751),
owned by Lawrence Samuel. Voice: direct, friendly, local, confident, never hypey. Short sentences.
Never invent facts, customers, certifications or numbers that are not in the context.`

export default async req => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return Response.json({ error: 'not configured' }, { status: 501 })
  const { task, context } = await req.json()
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 900,
      system: SYSTEM,
      messages: [{ role: 'user', content: `${task}\n\nContext (JSON):\n${JSON.stringify(context).slice(0, 12000)}` }],
    }),
  })
  if (!r.ok) return Response.json({ error: await r.text() }, { status: 502 })
  const j = await r.json()
  return Response.json({ text: j.content?.map(c => c.text).join('') ?? '' })
}
