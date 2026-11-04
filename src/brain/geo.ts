import type { Place } from './types'

// City lookup for the Load Finder. The data file is ~300 KB gzipped, so it is
// loaded on demand (only when someone opens the Load Finder or pastes loads).

const STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT',
  vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
}
export const STATE_CODES = new Set(Object.values(STATES))
export const stateCode = (s: string) => {
  const t = s.trim().replace(/\./g, '')
  if (t.length === 2 && STATE_CODES.has(t.toUpperCase())) return t.toUpperCase()
  return STATES[t.toLowerCase()] ?? null
}

type Index = Map<string, Map<string, [number, number]>>
let index: Index | null = null
let loading: Promise<Index> | null = null

const norm = (c: string) => c.toLowerCase().replace(/\./g, '').replace(/\bst\b/g, 'saint').replace(/\bft\b/g, 'fort').replace(/\bmt\b/g, 'mount').replace(/\s+/g, ' ').trim()

export function loadGeo(): Promise<Index> {
  if (index) return Promise.resolve(index)
  if (!loading) loading = import('./places-data').then(({ PLACES_BY_STATE }) => {
    const idx: Index = new Map()
    for (const [st, blob] of Object.entries(PLACES_BY_STATE)) {
      const m = new Map<string, [number, number]>()
      for (const row of blob.split(';')) {
        const [city, la, lo] = row.split(',')
        m.set(norm(city), [Number(la), Number(lo)])
      }
      idx.set(st, m)
    }
    index = idx
    return idx
  })
  return loading
}

// Places without their own ZIP city name (census-designated places around Richmond, etc.)
const ALIASES: Record<string, [number, number]> = {
  'VA|bon air': [37.525, -77.557], 'VA|short pump': [37.650, -77.612], 'VA|tuckahoe': [37.590, -77.556], 'VA|lakeside': [37.608, -77.476],
  'VA|laurel': [37.643, -77.509], 'VA|brandermill': [37.434, -77.646], 'VA|woodlake': [37.420, -77.680], 'VA|meadowbrook': [37.449, -77.474],
  'VA|ettrick': [37.240, -77.428], 'VA|bellwood': [37.420, -77.430], 'VA|innsbrook': [37.660, -77.570], 'VA|east highland park': [37.580, -77.400],
  'VA|north chesterfield': [37.430, -77.540], 'VA|chester': [37.356, -77.441], 'VA|enon': [37.330, -77.322], 'VA|matoaca': [37.230, -77.477],
}

/** Synchronous lookup. Call loadGeo() first. */
export function findPlace(city: string, state: string): Place | null {
  if (!index) return null
  const st = stateCode(state)
  if (!st) return null
  const m = index.get(st)
  if (!m) return null
  const raw = city.trim().replace(/\s+/g, ' ')
  const key = norm(raw)
  const hit = ALIASES[`${st}|${key}`] ?? m.get(key) ?? m.get(key.replace(/ (city|township|twp|county)$/, '')) ?? m.get(key.replace(/^saint /, 'st '))
  if (!hit) return null
  return { city: titleCase(raw), state: st, lat: hit[0], lng: hit[1] }
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase())

/** "Victoria, VA" / "Victoria VA" / "Victoria, Virginia" → Place */
export function parsePlace(text: string): Place | null {
  const t = text.trim().replace(/\s+/g, ' ')
  const m = t.match(/^(.+?)[,\s]+([A-Za-z .]{2,20})$/)
  if (!m) return null
  return findPlace(m[1].replace(/,$/, ''), m[2])
}
