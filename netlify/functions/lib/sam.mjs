// Shared SAM.gov sweep logic. Used by the scheduled Netlify function and by
// `npm run sweep` locally. Requires a free SAM.gov public API key (SAM_API_KEY).
// Docs: https://open.gsa.gov/api/get-opportunities-public-api/

export const NAICS = ['484110', '484122', '484220', '492110', '492210', '484210']
export const STATES = ['VA', 'NC', 'MD', 'DC']

// Coarse centroids so the Company Brain can score distance
const STATE_CENTER = {
  VA: { lat: 37.54, lng: -77.43 }, NC: { lat: 35.78, lng: -78.64 }, MD: { lat: 39.0, lng: -76.7 }, DC: { lat: 38.9, lng: -77.04 },
}

const fmt = d => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`

export async function sweepSam(apiKey, { days = 14 } = {}) {
  if (!apiKey) throw new Error('SAM_API_KEY is not set')
  const to = new Date(), from = new Date(Date.now() - days * 86400000)
  const out = new Map()
  for (const ncode of NAICS) {
    for (const state of STATES) {
      const url = new URL('https://api.sam.gov/opportunities/v2/search')
      url.search = new URLSearchParams({
        api_key: apiKey, postedFrom: fmt(from), postedTo: fmt(to), ncode, state, limit: '100', ptype: 'o,k,r,p',
      }).toString()
      const r = await fetch(url)
      if (!r.ok) continue
      const j = await r.json()
      for (const o of j.opportunitiesData ?? []) {
        if (out.has(o.noticeId)) continue
        const pop = o.placeOfPerformance ?? {}
        const st = pop.state?.code ?? state
        const c = STATE_CENTER[st] ?? STATE_CENTER.VA
        const text = `${o.title} ${o.description ?? ''}`.toLowerCase()
        out.set(o.noticeId, {
          id: `SAM-${o.noticeId}`,
          kind: 'bid',
          sample: false,
          status: 'new',
          title: o.title,
          org: [o.fullParentPathName?.split('.').pop(), o.officeAddress?.city].filter(Boolean).join(' · ') || 'Federal agency',
          source: 'SAM.gov',
          sourceUrl: o.uiLink,
          origin: { city: pop.city?.name ?? '', state: st, lat: c.lat, lng: c.lng },
          equipment: /53|tractor|trailer/.test(text) ? 'tractor53' : /refrigerat|reefer|frozen/.test(text) ? 'reefer' : /van|courier/.test(text) ? 'cargoVan' : 'box26',
          needsCDL: /\bcdl\b|commercial driver/.test(text),
          hazmat: /hazmat|hazardous/.test(text),
          naics: o.naicsCode,
          setAside: o.typeOfSetAsideDescription ? [o.typeOfSetAsideDescription] : undefined,
          estValue: Number(o.award?.amount) || 100000,
          valueBasis: 'annual',
          recurrence: 'contract',
          postedDate: o.postedDate,
          dueDate: o.responseDeadLine?.slice(0, 10),
          contact: o.pointOfContact?.[0]?.email,
          summary: `${o.type} · NAICS ${o.naicsCode} · ${o.solicitationNumber ?? ''}`.trim(),
          tags: ['Federal', 'Live'],
        })
      }
    }
  }
  return [...out.values()]
}
