import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasValidSupabaseUrl = (() => {
  if (!supabaseUrl) return false

  try {
    const parsed = new URL(supabaseUrl)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
})()

const hasValidAnonKey = Boolean(supabaseAnonKey && !supabaseAnonKey.includes('your-public-anon-key'))

export const isSupabaseConfigured = hasValidSupabaseUrl && hasValidAnonKey

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export const assertSupabaseConfigured = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured correctly. Check VITE_SUPABASE_URL (https://...) and VITE_SUPABASE_ANON_KEY.')
  }

  return supabase
}
