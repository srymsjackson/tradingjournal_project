import type { Trade } from '../types'
import { assertSupabaseConfigured, isSupabaseConfigured } from './supabase'

type TradeRow = {
  id: string
  user_id: string
  date: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entry: number
  exit: number
  shares: number
  pnl: number
  fees: number
  setup: string
  session: string
  notes: string
  duration_seconds: number
  created_at: string
}

const TABLE = 'trades'

const toDbDate = (rawDate: string) => {
  const value = String(rawDate || '').trim()
  const iso = value.match(/^(\d{4}-\d{1,2}-\d{1,2})/)
  if (iso) return iso[1]

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slash) {
    const month = String(Number(slash[1])).padStart(2, '0')
    const day = String(Number(slash[2])).padStart(2, '0')
    return `${slash[3]}-${month}-${day}`
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

const toCreatedIso = (value: number) => {
  const date = new Date(value || Date.now())
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

const toRow = (userId: string, trade: Trade): TradeRow => ({
  id: trade.id,
  user_id: userId,
  date: toDbDate(trade.date),
  symbol: trade.symbol,
  side: trade.side,
  entry: trade.entry,
  exit: trade.exit,
  shares: trade.shares,
  pnl: Number.isFinite(trade.pnl) ? trade.pnl : 0,
  fees: Number.isFinite(trade.fees) ? trade.fees : 0,
  setup: trade.setup,
  session: trade.session,
  notes: trade.notes,
  duration_seconds: Number.isFinite(trade.durationSec) ? trade.durationSec : 0,
  created_at: toCreatedIso(trade.createdAt),
})

const toTrade = (row: TradeRow): Trade => {
  const entry = Number(row.entry) || 0
  const shares = Number(row.shares) || 0
  const pnl = Number.isFinite(Number(row.pnl)) ? Number(row.pnl) : 0

  return {
    id: row.id,
    date: row.date,
    symbol: String(row.symbol || '').toUpperCase(),
    side: row.side === 'SHORT' ? 'SHORT' : 'LONG',
    setup: row.setup || 'imported',
    session: row.session || 'open',
    marketCondition: 'imported',
    entry,
    exit: Number(row.exit) || 0,
    shares,
    pnl,
    fees: Number(row.fees) || 0,
    pnlHigh: pnl,
    pnlLow: pnl,
    durationSec: Number(row.duration_seconds) || 0,
    confidence: 3,
    notes: row.notes || '',
    ruleFollowed: true,
    setupWasValid: true,
    waitedForConfirmation: true,
    riskWasDefined: true,
    followedPlan: true,
    brokeRules: false,
    emotionTags: [],
    mistakeTags: [],
    attachments: [],
    returnPct: entry * shares > 0 ? (pnl / (entry * shares)) * 100 : 0,
    createdAt: new Date(row.created_at).getTime() || Date.now(),
  }
}

export const loadUserTradesFromCloud = async (userId: string): Promise<Trade[]> => {
  if (!isSupabaseConfigured) return []

  const client = assertSupabaseConfigured()
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toTrade(row as TradeRow))
}

export const saveUserTradesToCloud = async (userId: string, trades: Trade[]): Promise<void> => {
  if (!isSupabaseConfigured) return

  const client = assertSupabaseConfigured()

  const { error: deleteError } = await client.from(TABLE).delete().eq('user_id', userId)
  if (deleteError) throw deleteError

  if (trades.length === 0) return

  const rows = trades.map((trade) => toRow(userId, trade))
  const { error: insertError } = await client.from(TABLE).insert(rows)
  if (insertError) throw insertError
}

export const clearUserTradesFromCloud = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured) return

  const client = assertSupabaseConfigured()
  const { error } = await client.from(TABLE).delete().eq('user_id', userId)
  if (error) throw error
}
