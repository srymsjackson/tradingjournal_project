import type { Trade } from '../types'
import { assertSupabaseConfigured, isSupabaseConfigured } from './supabase'
import { calculatePnL } from './pnlEngine'

type TradeRow = {
  id: string
  user_id: string
  trade_date: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  exit_price: number
  quantity: number
  fees: number
  setup: string
  session: string
  notes: string
  duration_seconds: number
  created_at: string
  updated_at: string
  gross_pnl: number
  net_pnl: number
}

type TradeInsertRow = {
  user_id: string
  trade_date: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entry_price: number
  exit_price: number
  quantity: number
  fees: number
  setup: string
  session: string
  notes: string
  duration_seconds: number
}

const TABLE = 'trades'
const TRADE_SELECT_COLUMNS =
  'id,user_id,trade_date,symbol,side,entry_price,exit_price,quantity,fees,setup,session,notes,duration_seconds,created_at,updated_at,gross_pnl,net_pnl'

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

const toRow = (userId: string, trade: Trade): TradeInsertRow => ({
  user_id: userId,
  trade_date: toDbDate(trade.tradeDate),
  symbol: trade.symbol,
  side: trade.side,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  quantity: trade.quantity,
  fees: Number.isFinite(trade.fees) ? trade.fees : 0,
  setup: trade.setup,
  session: trade.session,
  notes: trade.notes,
  duration_seconds: Number.isFinite(trade.durationSec) ? trade.durationSec : 0,
})

const toTrade = (row: TradeRow): Trade => {
  const entryPrice = Number(row.entry_price) || 0
  const quantity = Number(row.quantity) || 0
  const netPnl = Number.isFinite(Number(row.net_pnl)) ? Number(row.net_pnl) : 0
  const grossPnl = Number.isFinite(Number(row.gross_pnl)) ? Number(row.gross_pnl) : netPnl + (Number(row.fees) || 0)
  const pnlResult = calculatePnL({
    symbol: row.symbol,
    side: row.side === 'SHORT' ? 'short' : 'long',
    entry: entryPrice,
    exit: Number(row.exit_price) || 0,
    qty: quantity,
    fees: Number(row.fees) || 0,
    realizedPnL: netPnl,
  })

  return {
    id: row.id,
    tradeDate: row.trade_date,
    symbol: String(row.symbol || '').toUpperCase(),
    side: row.side === 'SHORT' ? 'SHORT' : 'LONG',
    setup: row.setup || 'imported',
    session: row.session || 'open',
    marketCondition: 'imported',
    broker: '',
    entryPrice,
    exitPrice: Number(row.exit_price) || 0,
    quantity,
    netPnl,
    fees: Number(row.fees) || 0,
    pnlHigh: netPnl,
    pnlLow: netPnl,
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
    grossPnl,
    calculationMethod: pnlResult.calculationMethod,
    assetClass: pnlResult.specUsed?.assetClass,
    quantityType: pnlResult.specUsed?.quantityType,
    realizedPnl: netPnl,
    returnPct: entryPrice * quantity > 0 ? (netPnl / (entryPrice * quantity)) * 100 : 0,
    createdAt: new Date(row.created_at).getTime() || Date.now(),
  }
}

export const loadUserTradesFromCloud = async (userId: string): Promise<Trade[]> => {
  if (!isSupabaseConfigured) return []

  const client = assertSupabaseConfigured()
  const { data, error } = await client
    .from(TABLE)
    .select(TRADE_SELECT_COLUMNS)
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
