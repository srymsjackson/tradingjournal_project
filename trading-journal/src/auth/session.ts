import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase'

const normalizeAuthError = (error: unknown, fallbackMessage: string): Error => {
  if (error instanceof Error) {
    const message = error.message || ''

    if (/failed to fetch/i.test(message) || /networkerror/i.test(message)) {
      return new Error('Unable to reach authentication service. Check your network and Supabase URL/key configuration.')
    }

    return error
  }

  return new Error(fallbackMessage)
}

export const getCurrentSession = async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) return null
  const client = assertSupabaseConfigured()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export const onAuthStateChange = (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
  if (!isSupabaseConfigured) {
    return () => {
      // No-op unsubscribe when auth is not configured.
    }
  }

  const client = assertSupabaseConfigured()
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(callback)

  return () => {
    subscription.unsubscribe()
  }
}

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const client = assertSupabaseConfigured()
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  } catch (error) {
    throw normalizeAuthError(error, 'Unable to sign in.')
  }
}

export const signUpWithEmailPassword = async (email: string, password: string) => {
  try {
    const client = assertSupabaseConfigured()
    const { data, error } = await client.auth.signUp({ email, password })
    if (error) throw error
    return data
  } catch (error) {
    throw normalizeAuthError(error, 'Unable to sign up.')
  }
}

export const signOutUser = async () => {
  if (!isSupabaseConfigured) return
  const client = assertSupabaseConfigured()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
