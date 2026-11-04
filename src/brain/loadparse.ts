import { findPlace, stateCode } from './geo'
import { miles } from './score'
import type { Equipment, Opportunity, Place } from './types'

// Turns pasted text (a broker's load-list email, rows copied from a load board,
// a text message) into structured load cards. Call loadGeo() before parsing.

const ST = 'A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[ADEINOST]|N[CDEHJMVY]|O[HKR]|PA|RI|S[CD]|T[NX]|UT|V[AT]|W[AIVY]'
const PLACE_RE = new RegExp(`([A-Za-z][A-Za-z.'-]*(?:\\s+[A-Za-z][A-Za-z.'-]*){0,4}),?\\s+(${ST})\\b(?:\\s+\\d{5})?`, 'g')
const NOISE = new Set(['pu', 'pickup', 'pick', 'up', 'del', 'deliver', 'delivery', 'drop', 'from', 'to', 'origin', 'dest', 'destination', 'load', 'lane', 'shipper', 'consignee', 'and', 'in', 'at', 'out', 'of', 'ship', 'date', 'pkup', 'dlv'])

interface Hit { place: Place; index: number; end: number }

// Put a hard stop after every state code so "Ashland VA to Norfolk VA" can't read as one long city name.
const SEP_RE = new RegExp(`\\b(${ST})\\b`, 'g')
export const fence = (t: string) => t.replace(SEP_RE, '$1 ¦')

function placesIn(line: string): Hit[] {
  const hits: Hit[] = []
  for (const m of fence(line).matchAll(PLACE_RE)) {
    const words = m[1].split(/\s+/)
    // Try the longest run of trailing words that is a real city ("New Canton", "Port St. Lucie").
    for (let n = Math.min(words.length, 4); n >= 1; n--) {
      const cand = words.slice(-n)
      if (NOISE.has(cand[0].toLowerCase())) continue
      const p = findPlace(cand.join(' '), m[2])
      if (p) { hits.push({ place: p, index: (m.index ?? 0) + m[0].indexOf(cand[0]), end: (m.index ?? 0) + m[0].length }); break }
    }
  }
  return hits
}

const num = (s: string) => Number(s.replace(/,/g, ''))

function equipmentOf(t: string): { eq: Equipment; len?: number } {
  const len = t.match(/\b(16|20|22|24|26|28|48|53)\s*(?:'|’|ft\b|foot\b|feet\b)/i)
  const L = len ? Number(len[1]) : undefined
  if (/power\s*only|\bPO\b/i.test(t)) return { eq: 'powerOnly', len: L }
  if (/hot\s*shot|\bHS\b/i.test(t)) return { eq: 'hotshot', len: L }
  if (/box\s*truck|straight|\bSB\b|\bbox\b/i.test(t) || (L && L <= 26)) return { eq: L && L <= 16 ? 'box16' : 'box26', len: L }
  if (/cargo\s*van|sprinter/i.test(t)) return { eq: 'cargoVan', len: L }
  if (/reefer|refriger|\bR\b|\bRV\b|\bR-V\b/i.test(t)) return { eq: 'reefer', len: L }
  if (/flat\s*bed|step\s*deck|\bF\b|\bFD\b|\bSD\b|conestoga/i.test(t)) return { eq: 'flatbed', len: L }
  if (/\bvan\b|\bV\b|dry\s*van/i.test(t)) return { eq: 'van53', len: L }
  return { eq: 'any', len: L }
}

function dateOf(t: string): string | undefined {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (/\btoday\b/i.test(t)) return iso(now)
  if (/\btomorrow\b/i.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 1); return iso(d) }
  const m = t.match(/\b(1[0-2]|0?[1-9])[/-](3[01]|[12]\d|0?[1-9])(?:[/-](\d{2,4}))?\b/)
  const mon = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/i)
  let mm: number | null = null, dd: number | null = null, yy: number | null = null
  if (m) { mm = Number(m[1]); dd = Number(m[2]); yy = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : null }
  else if (mon) { mm = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(mon[1].slice(0, 3).toLowerCase()) + 1; dd = Number(mon[2]) }
  if (!mm || !dd) return undefined
  let y = yy ?? now.getFullYear()
  // A date more than ~2 months in the past without a year means next year (e.g., pasting "1/4" in December).
  if (!yy && new Date(y, mm - 1, dd).getTime() < now.getTime() - 60 * 86400000) y += 1
  return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
}

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) }

export interface ParseOptions { source: string; sourceUrl?: string; defaultOrigin?: Place; brokerName?: string }

/** Split text into load-sized chunks: one per line that names a lane, or blank-line blocks. */
function chunks(text: string, defaultOrigin?: Place): string[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const laneLines = lines.filter(l => placesIn(l).length >= (defaultOrigin ? 1 : 2))
  if (laneLines.length >= 2) return laneLines
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  return blocks.length ? blocks : [text]
}

export function parseLoads(text: string, opt: ParseOptions): Opportunity[] { return parseReport(text, opt).loads }

/** Same as parseLoads, plus the lines it couldn't turn into a lane (so the UI can show them). */
export function parseReport(text: string, opt: ParseOptions): { loads: Opportunity[]; skipped: string[] } {
  const out: Opportunity[] = []
  const skipped: string[] = []
  const globalMc = text.match(/\bMC\s*#?:?\s*(\d{5,8})\b/i)?.[1]
  const globalPhone = text.match(/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/)?.[0]
  const globalEmail = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0]
  for (const c of chunks(text, opt.defaultOrigin)) {
    const flat = fence(c.replace(/\s+/g, ' '))
    const hits = placesIn(c.replace(/\s+/g, ' '))
    let origin: Place | undefined, dest: Place | undefined
    if (hits.length >= 2) {
      // Labeled lines win: "DEL: Raleigh, NC" / "PU: Richmond, VA"
      const lbl = (re: RegExp) => hits.find(h => re.test(flat.slice(Math.max(0, h.index - 14), h.index)))
      origin = (lbl(/(pu|pick|origin|from|shipper)\W*$/i) ?? hits[0]).place
      dest = (lbl(/(del|drop|dest|to|consignee)\W*$/i) ?? hits.find(h => h.place !== origin) ?? hits[1]).place
    } else if (hits.length === 1 && opt.defaultOrigin) { origin = opt.defaultOrigin; dest = hits[0].place }
    else { if (/\b(A[LKZR]|C[AOT]|D[EC]|FL|GA|NC|SC|VA|MD|PA|NY|NJ|OH|TN|WV)\b/.test(c)) skipped.push(c.slice(0, 160)); continue }
    if (!origin || !dest || (origin.city === dest.city && origin.state === dest.state && hits.length < 2)) continue

    const { eq, len } = equipmentOf(flat.replace(PLACE_RE, ' '))
    const rateM = flat.match(/\$\s?([\d,]{2,7}(?:\.\d{1,2})?)(?!\s*\/\s*mi)/) ?? flat.match(/\b(?:rate|pays?|offer)\W{0,3}([\d,]{3,6})\b/i)
    const rate = rateM ? num(rateM[1]) : null
    const wM = flat.match(/\b([\d,]{1,7}(?:\.\d)?)\s*(k)?\s*(?:lbs?|#|pounds)\b/i) ?? flat.match(/\b(\d{1,2}(?:\.\d)?)\s*(k)\b/i) ?? flat.match(/\bweight\W{0,3}([\d,]{3,6})\b/i)
    const weight = wM ? Math.round(num(wM[1]) * (wM[2] ? 1000 : 1)) : undefined
    const pM = flat.match(/\b(\d{1,2})\s*(?:pallets?|plts?|skids?)\b/i)
    const mM = flat.match(/\b(\d{2,4})\s*(?:mi|miles)\b/i)
    const trip = mM ? num(mM[1]) : miles(origin, dest)
    const pickup = dateOf(flat)
    const full = /\b(full|ftl)\b/i.test(flat) || /\bTL\b/.test(flat) ? true : /\b(partial|ltl)\b/i.test(flat) || /\bP\b/.test(flat) ? false : undefined
    const mc = flat.match(/\bMC\s*#?:?\s*(\d{5,8})\b/i)?.[1] ?? globalMc
    const phone = flat.match(/\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/)?.[0] ?? globalPhone
    const email = flat.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] ?? globalEmail
    const commodity = flat.match(/\bcommodity\W{0,3}([A-Za-z][^|;\n$]{2,40})/i)?.[1]?.trim()
    const brokerName = opt.brokerName ?? flat.match(/\b(?:broker|company|posted by)\W{0,3}([A-Z][\w&.' -]{2,40}?)(?=\s*(?:\||;|,|MC|\(|$))/)?.[1]?.trim()
    const eqLabel = { box26: "26' box", box16: "16' box", cargoVan: 'cargo van', van53: 'dry van', tractor53: "53' trailer", reefer: 'reefer', flatbed: 'flatbed', hotshot: 'hotshot', powerOnly: 'power only', any: 'any truck' }[eq]
    const id = 'LF-' + hash(`${origin.city}${origin.state}${dest.city}${dest.state}${pickup}${weight}${rate}${eq}${opt.source}`)
    out.push({
      id, kind: 'load', sample: false, status: 'new',
      title: `${origin.city}, ${origin.state} → ${dest.city}, ${dest.state}`,
      org: brokerName ?? opt.source,
      source: opt.source, sourceUrl: opt.sourceUrl,
      origin, destination: dest, equipment: eq, needsCDL: false, hazmat: /haz/i.test(flat),
      needsLiftgate: /lift\s*gate/i.test(flat) || undefined,
      estValue: rate ?? 0, rateKnown: rate !== null, valueBasis: 'per-load', miles: trip, recurrence: 'one-time',
      postedDate: new Date().toISOString(), dueDate: pickup, pickupDate: pickup,
      weightLbs: weight, pallets: pM ? Number(pM[1]) : undefined, lengthFt: len, fullLoad: full,
      broker: (mc || phone || email || brokerName) ? { name: brokerName, mc, phone, email } : undefined,
      contact: [brokerName, phone, email].filter(Boolean).join(' · ') || undefined,
      summary: [eqLabel, weight ? `${weight.toLocaleString()} lbs` : null, pM ? `${pM[1]} pallets` : null, full === true ? 'full load' : full === false ? 'partial' : null, commodity, `${trip} mi`].filter(Boolean).join(' · '),
      tags: ['Load', opt.source],
      raw: c.slice(0, 600),
    })
  }
  // De-duplicate identical lanes/dates within one paste
  return { loads: [...new Map(out.map(o => [o.id, o])).values()], skipped }
}

export { stateCode }
