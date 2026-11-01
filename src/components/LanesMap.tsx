import { geoMercator } from 'd3-geo'
import { useMemo } from 'react'
import type { Place } from '../brain/types'
import { HOME } from '../brain/cwn'
import { MAP_H, MAP_SCALE, MAP_TRANSLATE, MAP_W, STATES } from './mapdata'

export interface Lane { from: Place; to: Place; tone?: 'red' | 'ivory' | 'dim'; label?: string; animated?: boolean }
export interface Pin { at: Place; label?: string; tone?: 'red' | 'ivory' | 'green' | 'amber' | 'dim'; size?: number }

const proj = geoMercator().scale(MAP_SCALE).translate(MAP_TRANSLATE)
const xy = (p: Place) => proj([p.lng, p.lat]) as [number, number]

const TONE = { red: '#E0303C', ivory: '#F2EFE8', green: '#2FB36E', amber: '#E3A72F', dim: '#6E737B' }

/** Real state geography (us-atlas), projected once at build time. */
export function LanesMap({ lanes = [], pins = [], radius, className = '', light = false, showLabels = true, fit = false }: {
  lanes?: Lane[]; pins?: Pin[]; radius?: number; className?: string; light?: boolean; showLabels?: boolean; fit?: boolean
}) {
  const home = xy(HOME)
  // pixels per mile at home latitude (for radius ring)
  const ppm = useMemo(() => { const a = xy(HOME), b = xy({ ...HOME, lat: HOME.lat + 1 }); return Math.abs(a[1] - b[1]) / 69 }, [])
  const fill = light ? '#E6E1D6' : '#16181C'
  const stroke = light ? '#C4C6CA' : '#2E333A'
  const focus = ['VA', 'NC', 'MD', 'DC', 'DE']
  // fit: zoom the view to the lanes/pins in play (keeps the map's aspect ratio)
  let vb = `0 0 ${MAP_W} ${MAP_H}`
  if (fit) {
    const pts = [home, ...lanes.flatMap(l => [xy(l.from), xy(l.to)]), ...pins.map(p => xy(p.at))]
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
    let x0 = Math.min(...xs) - 90, x1 = Math.max(...xs) + 140, y0 = Math.min(...ys) - 70, y1 = Math.max(...ys) + 70
    let w = Math.max(x1 - x0, 360), h = Math.max(y1 - y0, 360 * MAP_H / MAP_W)
    if (w / h > MAP_W / MAP_H) h = w * MAP_H / MAP_W; else w = h * MAP_W / MAP_H
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    x0 = cx - w / 2; y0 = cy - h / 2
    vb = `${x0} ${y0} ${w} ${h}`
  }
  return (
    <svg viewBox={vb} preserveAspectRatio={fit ? 'xMidYMid slice' : 'xMidYMid meet'} className={className} role="img" aria-label="CWN service area map">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#C1121F" stopOpacity=".35" /><stop offset="1" stopColor="#C1121F" stopOpacity="0" /></radialGradient>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="8" stroke={light ? '#0D0E10' : '#F2EFE8'} strokeOpacity=".05" strokeWidth="2" /></pattern>
      </defs>
      {STATES.map(s => (
        <path key={s.id} d={s.d} fill={focus.includes(s.id) ? fill : 'transparent'} stroke={stroke} strokeWidth={focus.includes(s.id) ? 1.2 : 0.8} strokeOpacity={focus.includes(s.id) ? 1 : 0.5} />
      ))}
      {STATES.filter(s => focus.includes(s.id)).map(s => <path key={'h' + s.id} d={s.d} fill="url(#hatch)" />)}
      {radius && <>
        <circle cx={home[0]} cy={home[1]} r={radius * ppm} fill="url(#glow)" />
        <circle cx={home[0]} cy={home[1]} r={radius * ppm} fill="none" stroke="#C1121F" strokeOpacity=".55" strokeDasharray="6 7" strokeWidth="1.5" />
        <text x={home[0] + radius * ppm * 0.71 + 6} y={home[1] - radius * ppm * 0.71} fill="#E0303C" fontFamily="JetBrains Mono" fontSize="13" letterSpacing="2">{radius} MI</text>
      </>}
      {lanes.map((l, i) => {
        const a = xy(l.from), b = xy(l.to)
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
        const dx = b[0] - a[0], dy = b[1] - a[1]
        const c: [number, number] = [mx - dy * 0.18, my + dx * 0.18]
        const col = TONE[l.tone ?? 'red']
        return (
          <g key={i}>
            <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`} fill="none" stroke={col} strokeOpacity=".22" strokeWidth="7" strokeLinecap="round" />
            <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`} fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeDasharray={l.animated ? '10 10' : undefined} className={l.animated ? 'animate-dash' : ''} />
          </g>
        )
      })}
      {pins.map((p, i) => {
        const [x, y] = xy(p.at); const col = TONE[p.tone ?? 'ivory']; const r = p.size ?? 5
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r + 4} fill={col} fillOpacity=".15" />
            <circle cx={x} cy={y} r={r} fill={col} stroke={light ? '#fff' : '#0D0E10'} strokeWidth="2" />
            {showLabels && p.label && <text x={x + r + 7} y={y + 4} fill={light ? '#22262C' : '#C4C6CA'} fontFamily="Barlow" fontWeight="600" fontSize="15">{p.label}</text>}
          </g>
        )
      })}
      {/* home base */}
      <g>
        <circle cx={home[0]} cy={home[1]} r="15" fill="#C1121F" fillOpacity=".25"><animate attributeName="r" values="10;22;10" dur="2.6s" repeatCount="indefinite" /><animate attributeName="fill-opacity" values=".4;0;.4" dur="2.6s" repeatCount="indefinite" /></circle>
        <rect x={home[0] - 7} y={home[1] - 7} width="14" height="14" transform={`rotate(45 ${home[0]} ${home[1]})`} fill="#C1121F" stroke={light ? '#fff' : '#0D0E10'} strokeWidth="2.5" />
        {showLabels && <text x={home[0] + 14} y={home[1] + 26} fill={light ? '#0D0E10' : '#F2EFE8'} fontFamily="Barlow Condensed" fontWeight="800" fontSize="18" letterSpacing="1.5">CHESTERFIELD HQ</text>}
      </g>
    </svg>
  )
}
