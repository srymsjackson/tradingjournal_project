import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropAccountInput, PropAccountRecord } from '../domains/accounts/model'
import type { TradeInput, TradeRecord } from '../domains/trades/model'
import { createPropAccount, deletePropAccount, listPropAccounts, updatePropAccount } from '../lib/db/accounts'
import { createTrade, deleteTrade, listTrades, updateTrade } from '../lib/db/trades'
import { DashboardDataContext, type DashboardDataContextValue } from './dashboardDataContextObject'

type DashboardDataProviderProps = {
  userId: string
  children: ReactNode
}

export function DashboardDataProvider({ userId, children }: DashboardDataProviderProps) {
  const [trades, setTrades] = useState<TradeRecord[]>([])
  const [accounts, setAccounts] = useState<PropAccountRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) {
      setTrades([])
      setAccounts([])
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [nextTrades, nextAccounts] = await Promise.all([listTrades(userId), listPropAccounts(userId)])
      setTrades(nextTrades)
      setAccounts(nextAccounts)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setTrades([])
    setAccounts([])
    setError('')
    setLoading(Boolean(userId))
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addTrade = useCallback(async (trade: TradeInput) => {
    const created = await createTrade(userId, trade)
    setTrades((prev) => [created, ...prev])
  }, [userId])

  const editTrade = useCallback(async (tradeId: string, trade: TradeInput) => {
    const updated = await updateTrade(userId, tradeId, trade)
    setTrades((prev) => prev.map((item) => (item.id === tradeId ? updated : item)))
  }, [userId])

  const removeTrade = useCallback(async (tradeId: string) => {
    await deleteTrade(userId, tradeId)
    setTrades((prev) => prev.filter((item) => item.id !== tradeId))
  }, [userId])

  const addAccount = useCallback(async (account: PropAccountInput) => {
    const created = await createPropAccount(userId, account)
    setAccounts((prev) => [created, ...prev])
  }, [userId])

  const editAccount = useCallback(async (accountId: string, account: PropAccountInput) => {
    const updated = await updatePropAccount(userId, accountId, account)
    setAccounts((prev) => prev.map((item) => (item.id === accountId ? updated : item)))
  }, [userId])

  const removeAccount = useCallback(async (accountId: string) => {
    await deletePropAccount(userId, accountId)
    setAccounts((prev) => prev.filter((item) => item.id !== accountId))
  }, [userId])

  const value = useMemo<DashboardDataContextValue>(
    () => ({ userId, trades, accounts, loading, error, refresh, addTrade, editTrade, removeTrade, addAccount, editAccount, removeAccount }),
    [userId, trades, accounts, loading, error, refresh, addTrade, editTrade, removeTrade, addAccount, editAccount, removeAccount],
  )

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>
}
