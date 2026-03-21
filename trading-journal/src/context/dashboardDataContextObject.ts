import { createContext } from 'react'
import type { PropAccountInput, PropAccountRecord } from '../domains/accounts/model'
import type { TradeInput, TradeRecord } from '../domains/trades/model'

export type DashboardDataContextValue = {
  userId: string
  trades: TradeRecord[]
  accounts: PropAccountRecord[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  addTrade: (trade: TradeInput) => Promise<void>
  editTrade: (tradeId: string, trade: TradeInput) => Promise<void>
  removeTrade: (tradeId: string) => Promise<void>
  addAccount: (account: PropAccountInput) => Promise<void>
  editAccount: (accountId: string, account: PropAccountInput) => Promise<void>
  removeAccount: (accountId: string) => Promise<void>
}

export const DashboardDataContext = createContext<DashboardDataContextValue | null>(null)
