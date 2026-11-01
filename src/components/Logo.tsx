// The real CWN Carriers logo, vectorized from the truck-door decal.
// tone="dark"  → ivory lettering for dark backgrounds
// tone="light" → charcoal lettering for light backgrounds
export function Logo({ tone = 'dark', className = '' }: { tone?: 'dark' | 'light'; className?: string; compact?: boolean }) {
  return <img src={`${import.meta.env.BASE_URL}assets/cwn-logo-${tone}.svg`} alt="CWN Carriers" className={className} draggable={false} />
}
