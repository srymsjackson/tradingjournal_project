import { assertSupabaseConfigured, isSupabaseConfigured } from './supabase'

export type ThemeMode = 'dark' | 'light' | 'auto'

export type TradingPreferences = {
  accountSize: string
  riskPerTradePct: string
  defaultRr: string
  currency: 'USD' | 'EUR' | 'GBP'
  favoriteSymbols: string[]
}

export type SessionTracking = {
  asia: boolean
  london: boolean
  newYork: boolean
}

export type UserPreferences = {
  tradingPreferences: TradingPreferences
  themeMode: ThemeMode
  accentColor: string
  sessionTracking: SessionTracking
}

const TABLE = 'user_preferences'
const LOCAL_KEY = 'urjourn-user-preferences'

export const defaultUserPreferences: UserPreferences = {
  tradingPreferences: {
    accountSize: '25000',
    riskPerTradePct: '1',
    defaultRr: '2',
    currency: 'USD',
    favoriteSymbols: ['MCG1!', 'MCL1!', '6E1!'],
  },
  themeMode: 'dark',
  accentColor: '#3a86a8',
  sessionTracking: {
    asia: true,
    london: true,
    newYork: true,
  },
}

const scopedKey = (userId?: string) => (userId ? `${LOCAL_KEY}_${userId}` : LOCAL_KEY)

export const clearUserPreferencesCache = (userId?: string) => {
  localStorage.removeItem(scopedKey(userId))
}

const normalizeSymbols = (symbols: string[]) =>
  Array.from(
    new Set(
      symbols
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean),
    ),
  )

const normalizeThemeMode = (value: unknown): ThemeMode => {
  const mode = String(value || '').toLowerCase()
  if (mode === 'light') return 'light'
  if (mode === 'auto') return 'auto'
  return 'dark'
}

const normalizeCurrency = (value: unknown): TradingPreferences['currency'] => {
  const currency = String(value || '').toUpperCase()
  if (currency === 'EUR') return 'EUR'
  if (currency === 'GBP') return 'GBP'
  return 'USD'
}

const sanitize = (raw: Partial<UserPreferences> | null | undefined): UserPreferences => ({
  tradingPreferences: {
    accountSize: String(raw?.tradingPreferences?.accountSize ?? defaultUserPreferences.tradingPreferences.accountSize),
    riskPerTradePct: String(raw?.tradingPreferences?.riskPerTradePct ?? defaultUserPreferences.tradingPreferences.riskPerTradePct),
    defaultRr: String(raw?.tradingPreferences?.defaultRr ?? defaultUserPreferences.tradingPreferences.defaultRr),
    currency: normalizeCurrency(raw?.tradingPreferences?.currency),
    favoriteSymbols: normalizeSymbols(raw?.tradingPreferences?.favoriteSymbols ?? defaultUserPreferences.tradingPreferences.favoriteSymbols),
  },
  themeMode: normalizeThemeMode(raw?.themeMode),
  accentColor: String(raw?.accentColor || defaultUserPreferences.accentColor),
  sessionTracking: {
    asia: raw?.sessionTracking?.asia !== false,
    london: raw?.sessionTracking?.london !== false,
    newYork: raw?.sessionTracking?.newYork !== false,
  },
})

export const loadUserPreferences = async (userId?: string): Promise<UserPreferences> => {
  const localRaw = localStorage.getItem(scopedKey(userId))
  const localPrefs = localRaw ? sanitize(JSON.parse(localRaw) as Partial<UserPreferences>) : defaultUserPreferences

  if (!userId || !isSupabaseConfigured) {
    return localPrefs
  }

  try {
    const client = assertSupabaseConfigured()
    const { data, error } = await client.from(TABLE).select('*').eq('user_id', userId).maybeSingle()
    if (error || !data) {
      return localPrefs
    }

    const cloudPrefs = sanitize({
      tradingPreferences: data.trading_preferences,
      themeMode: data.theme_mode,
      accentColor: data.accent_color,
      sessionTracking: data.session_tracking,
    })

    localStorage.setItem(scopedKey(userId), JSON.stringify(cloudPrefs))
    return cloudPrefs
  } catch {
    return localPrefs
  }
}

export const saveUserPreferences = async (userId: string | undefined, prefs: UserPreferences): Promise<void> => {
  const safePrefs = sanitize(prefs)
  localStorage.setItem(scopedKey(userId), JSON.stringify(safePrefs))

  if (!userId || !isSupabaseConfigured) {
    return
  }

  try {
    const client = assertSupabaseConfigured()
    const payload = {
      user_id: userId,
      trading_preferences: safePrefs.tradingPreferences,
      favorite_symbols: safePrefs.tradingPreferences.favoriteSymbols,
      theme_mode: safePrefs.themeMode,
      accent_color: safePrefs.accentColor,
      session_tracking: safePrefs.sessionTracking,
      updated_at: new Date().toISOString(),
    }

    await client.from(TABLE).upsert(payload, { onConflict: 'user_id' })
  } catch {
    // Best effort cloud sync with local fallback.
  }
}
