import type { TradeInput, TradeRecord } from '../../domains/trades/model'
import { assertSupabaseConfigured } from '../supabase'

type TradeRow = {
  id: string
  user_id: string
  trade_date: string
  market: string
  account: string
  side: 'LONG' | 'SHORT'
  setup_type: string
  session: string
  entry_price: number
  exit_price: number
  stop_loss: number
  take_profit: number
  quantity: number
  risk_amount: number
  pnl: number
  r_multiple: number
  screenshot_before: string
  screenshot_after: string
  notes: string
  liquidity_sweep_present: boolean
  displacement_present: boolean
  mss_present: boolean
  fvg_present: boolean
  htf_bias_aligned: boolean
  news_risk_checked: boolean
  a_plus_setup: boolean
  planned_before_entry: boolean
  followed_plan: boolean
  execution_rating: number
  emotional_state: string
  mistake_tags: string[]
  reason_for_exit: string
  would_take_again: boolean
  created_at: string
  updated_at: string
}

const TABLE = 'trades'
const SELECT_COLUMNS =
  'id,user_id,trade_date,market,account,side,setup_type,session,entry_price,exit_price,stop_loss,take_profit,quantity,risk_amount,pnl,r_multiple,screenshot_before,screenshot_after,notes,liquidity_sweep_present,displacement_present,mss_present,fvg_present,htf_bias_aligned,news_risk_checked,a_plus_setup,planned_before_entry,followed_plan,execution_rating,emotional_state,mistake_tags,reason_for_exit,would_take_again,created_at,updated_at'

const toTradeRecord = (row: TradeRow): TradeRecord => ({
  id: row.id,
  userId: row.user_id,
  tradeDate: row.trade_date,
  market: row.market,
  account: row.account,
  side: row.side,
  setupType: row.setup_type,
  session: row.session,
  entryPrice: Number(row.entry_price) || 0,
  exitPrice: Number(row.exit_price) || 0,
  stopLoss: Number(row.stop_loss) || 0,
  takeProfit: Number(row.take_profit) || 0,
  quantity: Number(row.quantity) || 0,
  riskAmount: Number(row.risk_amount) || 0,
  pnl: Number(row.pnl) || 0,
  rMultiple: Number(row.r_multiple) || 0,
  screenshotBefore: row.screenshot_before || '',
  screenshotAfter: row.screenshot_after || '',
  notes: row.notes || '',
  liquiditySweepPresent: Boolean(row.liquidity_sweep_present),
  displacementPresent: Boolean(row.displacement_present),
  mssPresent: Boolean(row.mss_present),
  fvgPresent: Boolean(row.fvg_present),
  htfBiasAligned: Boolean(row.htf_bias_aligned),
  newsRiskChecked: Boolean(row.news_risk_checked),
  aPlusSetup: Boolean(row.a_plus_setup),
  plannedBeforeEntry: Boolean(row.planned_before_entry),
  followedPlan: Boolean(row.followed_plan),
  executionRating: Number(row.execution_rating) || 1,
  emotionalState: row.emotional_state || '',
  mistakeTags: Array.isArray(row.mistake_tags) ? row.mistake_tags : [],
  reasonForExit: row.reason_for_exit || '',
  wouldTakeAgain: Boolean(row.would_take_again),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toPayload = (userId: string, trade: TradeInput) => ({
  user_id: userId,
  trade_date: trade.tradeDate,
  market: trade.market,
  account: trade.account,
  side: trade.side,
  setup_type: trade.setupType,
  session: trade.session,
  entry_price: trade.entryPrice,
  exit_price: trade.exitPrice,
  stop_loss: trade.stopLoss,
  take_profit: trade.takeProfit,
  quantity: trade.quantity,
  risk_amount: trade.riskAmount,
  pnl: trade.pnl,
  r_multiple: trade.rMultiple,
  screenshot_before: trade.screenshotBefore,
  screenshot_after: trade.screenshotAfter,
  notes: trade.notes,
  liquidity_sweep_present: trade.liquiditySweepPresent,
  displacement_present: trade.displacementPresent,
  mss_present: trade.mssPresent,
  fvg_present: trade.fvgPresent,
  htf_bias_aligned: trade.htfBiasAligned,
  news_risk_checked: trade.newsRiskChecked,
  a_plus_setup: trade.aPlusSetup,
  planned_before_entry: trade.plannedBeforeEntry,
  followed_plan: trade.followedPlan,
  execution_rating: trade.executionRating,
  emotional_state: trade.emotionalState,
  mistake_tags: trade.mistakeTags,
  reason_for_exit: trade.reasonForExit,
  would_take_again: trade.wouldTakeAgain,
  updated_at: new Date().toISOString(),
})

export const listTrades = async (userId: string): Promise<TradeRecord[]> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .eq('user_id', userId)
    .order('trade_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => toTradeRecord(row as TradeRow))
}

export const createTrade = async (userId: string, trade: TradeInput): Promise<TradeRecord> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client.from(TABLE).insert(toPayload(userId, trade)).select(SELECT_COLUMNS).single()
  if (error) throw error
  return toTradeRecord(data as TradeRow)
}

export const updateTrade = async (userId: string, tradeId: string, trade: TradeInput): Promise<TradeRecord> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client
    .from(TABLE)
    .update(toPayload(userId, trade))
    .eq('id', tradeId)
    .eq('user_id', userId)
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return toTradeRecord(data as TradeRow)
}

export const deleteTrade = async (userId: string, tradeId: string): Promise<void> => {
  const client = assertSupabaseConfigured()
  const { error } = await client.from(TABLE).delete().eq('id', tradeId).eq('user_id', userId)
  if (error) throw error
}
