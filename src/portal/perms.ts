import type { Role } from '../lib/supabase'

/** Every page in the portal, by key. The key is the URL path under /portal ('' = Command). */
export const PAGES: { key: string; label: string; group: 'Find work' | 'Run the day' | 'Back office' | 'Team' }[] = [
  { key: '', label: 'Command', group: 'Run the day' },
  { key: 'messages', label: 'Messages', group: 'Team' },
  { key: 'loads', label: 'Load Finder', group: 'Find work' },
  { key: 'opportunities', label: 'Bids & Leads', group: 'Find work' },
  { key: 'pipeline', label: 'Pipeline', group: 'Find work' },
  { key: 'outreach', label: 'Outreach', group: 'Find work' },
  { key: 'dispatch', label: 'Dispatch', group: 'Run the day' },
  { key: 'fleet', label: 'Fleet & Drivers', group: 'Run the day' },
  { key: 'driver', label: 'Driver app', group: 'Run the day' },
  { key: 'customers', label: 'Customers', group: 'Back office' },
  { key: 'money', label: 'Money', group: 'Back office' },
  { key: 'compliance', label: 'Compliance', group: 'Back office' },
  { key: 'documents', label: 'Documents', group: 'Back office' },
  { key: 'brain', label: 'Company Brain', group: 'Back office' },
  { key: 'briefing', label: 'Weekly Briefing', group: 'Back office' },
  { key: 'team', label: 'Team & Access', group: 'Team' },
]
const ALL = PAGES.map(p => p.key)

/** What each role sees when nobody has customised that person's pages. */
export const ROLE_DEFAULT: Record<Role, string[]> = {
  platform: ALL,
  owner: ALL,
  admin: ALL,
  dispatcher: ALL.filter(k => !['money', 'brain', 'briefing', 'team'].includes(k)),
  driver: ['driver', 'messages'],
}

export const ROLE_LABEL: Record<Role, string> = { platform: 'DataIsData admin', owner: 'Owner', admin: 'Admin', dispatcher: 'Dispatcher', driver: 'Driver' }

/** Owners and DataIsData admins always see everything; everyone else gets their custom list or their role's default. */
export function pagesFor(role: Role, custom: string[] | null | undefined): string[] {
  if (role === 'owner' || role === 'platform') return ALL
  const list = custom?.length ? custom : ROLE_DEFAULT[role]
  return role === 'driver' ? list : Array.from(new Set([...list, 'messages']))
}

export const canManageTeam = (role: Role) => role === 'owner' || role === 'admin' || role === 'platform'
