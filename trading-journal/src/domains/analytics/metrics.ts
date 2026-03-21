import type { PropAccountRecord } from '../accounts/model'
import { derivePropAccountStats } from '../accounts/model'
import type { TradeRecord } from '../trades/model'

const toDayKey = (dateIso: string) => new Date(`${dateIso}T00:00:00`)

export const sumPnl = (trades: TradeRecord[]) => trades.reduce((sum, trade) => sum + trade.pnl, 0)

export const winRate = (trades: TradeRecord[]) => {
  if (trades.length === 0) return 0
  const wins = trades.filter((trade) => trade.pnl > 0).length
  return (wins / trades.length) * 100
}

export const avgR = (trades: TradeRecord[]) => {
  if (trades.length === 0) return 0
  return trades.reduce((sum, trade) => sum + trade.rMultiple, 0) / trades.length
}

export const bestSetup = (trades: TradeRecord[]) => {
  const buckets = trades.reduce<Record<string, { pnl: number; trades: number }>>((acc, trade) => {
    const key = trade.setupType || 'Unknown'
    if (!acc[key]) acc[key] = { pnl: 0, trades: 0 }
    acc[key].pnl += trade.pnl
    acc[key].trades += 1
    return acc
  }, {})

  return Object.entries(buckets)
    .map(([setup, stats]) => ({ setup, expectancy: stats.pnl / Math.max(1, stats.trades), trades: stats.trades, pnl: stats.pnl }))
    .sort((a, b) => b.expectancy - a.expectancy)[0] ?? null
}

export const topMistake = (trades: TradeRecord[]) => {
  const counts = trades.reduce<Record<string, { count: number; cost: number }>>((acc, trade) => {
    for (const tag of trade.mistakeTags) {
      if (!acc[tag]) acc[tag] = { count: 0, cost: 0 }
      acc[tag].count += 1
      if (trade.pnl < 0) acc[tag].cost += Math.abs(trade.pnl)
    }
    return acc
  }, {})

  return Object.entries(counts)
    .map(([tag, value]) => ({ tag, count: value.count, cost: value.cost }))
    .sort((a, b) => b.count - a.count || b.cost - a.cost)[0] ?? null
}

export const pnlByDayOfWeek = (trades: TradeRecord[]) => {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totals = Array.from({ length: 7 }, (_, index) => ({ day: labels[index], pnl: 0, trades: 0 }))

  for (const trade of trades) {
    const day = toDayKey(trade.tradeDate).getDay()
    totals[day].pnl += trade.pnl
    totals[day].trades += 1
  }

  return totals
}

export const pnlBySession = (trades: TradeRecord[]) => {
  const map = trades.reduce<Record<string, { session: string; pnl: number; trades: number }>>((acc, trade) => {
    const key = trade.session || 'Unknown'
    if (!acc[key]) acc[key] = { session: key, pnl: 0, trades: 0 }
    acc[key].pnl += trade.pnl
    acc[key].trades += 1
    return acc
  }, {})

  return Object.values(map).sort((a, b) => b.pnl - a.pnl)
}

export const pnlByMarket = (trades: TradeRecord[]) => {
  const map = trades.reduce<Record<string, { market: string; pnl: number; trades: number }>>((acc, trade) => {
    const key = trade.market || 'Unknown'
    if (!acc[key]) acc[key] = { market: key, pnl: 0, trades: 0 }
    acc[key].pnl += trade.pnl
    acc[key].trades += 1
    return acc
  }, {})
  return Object.values(map).sort((a, b) => b.pnl - a.pnl)
}

export const ruleComparison = (trades: TradeRecord[]) => {
  const followed = trades.filter((trade) => trade.followedPlan)
  const broken = trades.filter((trade) => !trade.followedPlan)
  return {
    followed: { trades: followed.length, pnl: sumPnl(followed), winRate: winRate(followed), avgR: avgR(followed) },
    broken: { trades: broken.length, pnl: sumPnl(broken), winRate: winRate(broken), avgR: avgR(broken) },
  }
}

export const accountSafetySummary = (accounts: PropAccountRecord[]) => {
  if (accounts.length === 0) return null
  const active = accounts.find((account) => account.status === 'ACTIVE') ?? accounts[0]
  const derived = derivePropAccountStats(active)
  return {
    accountName: active.accountName,
    status: active.status,
    currentBalance: active.currentBalance,
    ...derived,
  }
}
