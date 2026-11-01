// GET /api/opps → latest sweep results for the portal
import { getStore } from '@netlify/blobs'

export default async () => {
  const data = await getStore('cwn').get('sweep', { type: 'json' })
  return Response.json(data ?? { generated: null, items: [] }, { headers: { 'cache-control': 'no-store' } })
}
