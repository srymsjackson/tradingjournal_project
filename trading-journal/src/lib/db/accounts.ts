import type { PropAccountInput, PropAccountRecord } from '../../domains/accounts/model'
import { assertSupabaseConfigured } from '../supabase'

type PropAccountRow = {
  id: string
  user_id: string
  account_name: string
  firm: string
  account_size: number
  starting_balance: number
  current_balance: number
  trailing_drawdown_type: string
  max_drawdown: number
  daily_loss_limit: number
  profit_target: number
  min_payout_days: number
  payout_profit_day_threshold: number
  payout_days_completed: number
  status: 'ACTIVE' | 'PAUSED' | 'PASSED' | 'FAILED'
  created_at: string
  updated_at: string
}

const TABLE = 'prop_accounts'
const SELECT_COLUMNS =
  'id,user_id,account_name,firm,account_size,starting_balance,current_balance,trailing_drawdown_type,max_drawdown,daily_loss_limit,profit_target,min_payout_days,payout_profit_day_threshold,payout_days_completed,status,created_at,updated_at'

const toRecord = (row: PropAccountRow): PropAccountRecord => ({
  id: row.id,
  userId: row.user_id,
  accountName: row.account_name,
  firm: row.firm,
  accountSize: Number(row.account_size) || 0,
  startingBalance: Number(row.starting_balance) || 0,
  currentBalance: Number(row.current_balance) || 0,
  trailingDrawdownType: row.trailing_drawdown_type,
  maxDrawdown: Number(row.max_drawdown) || 0,
  dailyLossLimit: Number(row.daily_loss_limit) || 0,
  profitTarget: Number(row.profit_target) || 0,
  minPayoutDays: Number(row.min_payout_days) || 0,
  payoutProfitDayThreshold: Number(row.payout_profit_day_threshold) || 0,
  payoutDaysCompleted: Number(row.payout_days_completed) || 0,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toPayload = (userId: string, account: PropAccountInput) => ({
  user_id: userId,
  account_name: account.accountName,
  firm: account.firm,
  account_size: account.accountSize,
  starting_balance: account.startingBalance,
  current_balance: account.currentBalance,
  trailing_drawdown_type: account.trailingDrawdownType,
  max_drawdown: account.maxDrawdown,
  daily_loss_limit: account.dailyLossLimit,
  profit_target: account.profitTarget,
  min_payout_days: account.minPayoutDays,
  payout_profit_day_threshold: account.payoutProfitDayThreshold,
  payout_days_completed: account.payoutDaysCompleted,
  status: account.status,
  updated_at: new Date().toISOString(),
})

export const listPropAccounts = async (userId: string): Promise<PropAccountRecord[]> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client.from(TABLE).select(SELECT_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => toRecord(row as PropAccountRow))
}

export const createPropAccount = async (userId: string, account: PropAccountInput): Promise<PropAccountRecord> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client.from(TABLE).insert(toPayload(userId, account)).select(SELECT_COLUMNS).single()
  if (error) throw error
  return toRecord(data as PropAccountRow)
}

export const updatePropAccount = async (userId: string, accountId: string, account: PropAccountInput): Promise<PropAccountRecord> => {
  const client = assertSupabaseConfigured()
  const { data, error } = await client
    .from(TABLE)
    .update(toPayload(userId, account))
    .eq('id', accountId)
    .eq('user_id', userId)
    .select(SELECT_COLUMNS)
    .single()

  if (error) throw error
  return toRecord(data as PropAccountRow)
}

export const deletePropAccount = async (userId: string, accountId: string): Promise<void> => {
  const client = assertSupabaseConfigured()
  const { error } = await client.from(TABLE).delete().eq('id', accountId).eq('user_id', userId)
  if (error) throw error
}
