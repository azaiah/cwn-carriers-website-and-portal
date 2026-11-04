import { createClient } from '@supabase/supabase-js'

// Public connection details. The publishable key is designed to live in browser
// code: Row Level Security in the database decides what each signed-in user can
// see and change. Never put the secret key in this file or anywhere in src/.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://ztwkdqnkjrutdtddbvgp.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_a-yIIOhlezFTjxeK5B7HBA_3sfnrXot'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'cwn-auth' },
})

export type Role = 'owner' | 'admin' | 'dispatcher' | 'driver' | 'platform'

/** One company this person can open. Platform = DataIsData admin (sees every company). */
export interface Access { company_id: string; company_name: string; role: Role; display_name: string | null; title: string | null; pages: string[] | null }

/** Joins any companies that invited this email, then lists what this person can open. */
export async function myAccess(): Promise<Access[]> {
  await supabase.rpc('claim_invites')
  const { data, error } = await supabase.rpc('my_access')
  if (error) throw error
  return (data ?? []) as Access[]
}

/** Everyone in a company (plus DataIsData admins who have signed up). */
export interface Person { user_id: string; display_name: string; email: string; role: Role; title: string | null; pages: string[] | null }
export async function companyPeople(companyId: string): Promise<Person[]> {
  const { data, error } = await supabase.rpc('company_people', { c: companyId })
  if (error) throw error
  return (data ?? []) as Person[]
}

/** Is Google sign-in switched on in Supabase? (Public settings endpoint.) */
export async function googleEnabled(): Promise<boolean> {
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_KEY } })
    const j = await r.json() as { external?: Record<string, boolean> }
    return !!j.external?.google
  } catch { return false }
}
