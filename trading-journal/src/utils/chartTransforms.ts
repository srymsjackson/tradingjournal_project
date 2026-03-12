import type { ChartDataSet, Side, Trade } from '../types'
import { formatDate, formatMoney } from './tradeCalculations'

export const CHART_COLORS = ['#2f8f68', '#4b78b8', '#b87a42', '#8d5fb6', '#ba6158', '#4f9a9a']

export const tooltipMoneyFormatter = (value: number | string | ReadonlyArray<number | string> | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  return formatMoney(Number(raw ?? 0))
}

export const getChartData = (trades: Trade[]): ChartDataSet => {
  const sortedByDateAsc = trades
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt)

  let runningPnl = 0
  const groupedByDay = sortedByDateAsc.reduce<Record<string, { date: string; netPnl: number; tradeCount: number; cumulativePnl: number }>>(
    (acc, trade) => {
      if (!acc[trade.date]) {
        acc[trade.date] = { date: trade.date, netPnl: 0, tradeCount: 0, cumulativePnl: 0 }
      }
      acc[trade.date].netPnl += trade.pnl
      acc[trade.date].tradeCount += 1
      return acc
    },
    {},
  )

  const pnlTrend = Object.values(groupedByDay)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((day) => {
      runningPnl += day.netPnl
      return {
        ...day,
        label: formatDate(day.date),
        cumulativePnl: runningPnl,
      }
    })

  const groupedSetups = trades.reduce<Record<string, { setup: string; netPnl: number; trades: number; wins: number }>>((acc, trade) => {
    const setup = trade.setup.trim() || 'Unspecified'
    if (!acc[setup]) {
      acc[setup] = { setup, netPnl: 0, trades: 0, wins: 0 }
    }
    acc[setup].netPnl += trade.pnl
    acc[setup].trades += 1
    acc[setup].wins += trade.pnl > 0 ? 1 : 0
    return acc
  }, {})

  const setupPnl = Object.values(groupedSetups)
    .map((item) => ({
      setup: item.setup,
      netPnl: item.netPnl,
      trades: item.trades,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }))
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, 8)

  const groupedSymbols = trades.reduce<Record<string, { symbol: string; netPnl: number; trades: number }>>(
    (acc, trade) => {
      const symbol = trade.symbol.trim().toUpperCase()
      if (!acc[symbol]) {
        acc[symbol] = { symbol, netPnl: 0, trades: 0 }
      }
      acc[symbol].netPnl += trade.pnl
      acc[symbol].trades += 1
      return acc
    },
    {},
  )

  const symbolPnl = Object.values(groupedSymbols)
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, 10)

  const groupedSide = trades.reduce<Record<Side, { side: Side; trades: number; wins: number; netPnl: number }>>(
    (acc, trade) => {
      const key = trade.side
      if (!acc[key]) {
        acc[key] = { side: key, trades: 0, wins: 0, netPnl: 0 }
      }
      acc[key].trades += 1
      acc[key].wins += trade.pnl > 0 ? 1 : 0
      acc[key].netPnl += trade.pnl
      return acc
    },
    { LONG: { side: 'LONG', trades: 0, wins: 0, netPnl: 0 }, SHORT: { side: 'SHORT', trades: 0, wins: 0, netPnl: 0 } },
  )

  const sideWinRate = (['LONG', 'SHORT'] as Side[])
    .map((side) => {
      const group = groupedSide[side]
      return {
        side,
        winRate: group.trades > 0 ? (group.wins / group.trades) * 100 : 0,
        trades: group.trades,
        netPnl: group.netPnl,
      }
    })
    .filter((item) => item.trades > 0)

  const groupedSession = trades.reduce<Record<string, { session: string; trades: number; wins: number; netPnl: number }>>((acc, trade) => {
    const session = trade.session.trim() || 'Unspecified'
    if (!acc[session]) {
      acc[session] = { session, trades: 0, wins: 0, netPnl: 0 }
    }
    acc[session].trades += 1
    acc[session].wins += trade.pnl > 0 ? 1 : 0
    acc[session].netPnl += trade.pnl
    return acc
  }, {})

  const sessionPerformance = Object.values(groupedSession)
    .map((item) => ({
      session: item.session,
      trades: item.trades,
      netPnl: item.netPnl,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }))
    .sort((a, b) => b.netPnl - a.netPnl)

  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayLookup = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const parseTradeDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, Math.max(0, (month || 1) - 1), day || 1)
  }

  const groupedDay = trades.reduce<Record<string, { day: string; trades: number; wins: number; netPnl: number }>>((acc, trade) => {
    const date = parseTradeDate(trade.date)
    const day = dayLookup[date.getDay()] || 'Mon'
    if (!acc[day]) {
      acc[day] = { day, trades: 0, wins: 0, netPnl: 0 }
    }
    acc[day].trades += 1
    acc[day].wins += trade.pnl > 0 ? 1 : 0
    acc[day].netPnl += trade.pnl
    return acc
  }, {})

  const dayOfWeekPerformance = dayOrder
    .map((day) => {
      const item = groupedDay[day]
      if (!item) {
        return { day, trades: 0, winRate: 0, netPnl: 0 }
      }
      return {
        day: item.day,
        trades: item.trades,
        winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
        netPnl: item.netPnl,
      }
    })
    .filter((item) => item.trades > 0)

  const emotionBuckets = trades.reduce<Record<string, { tag: string; count: number; wins: number; netPnl: number }>>((acc, trade) => {
    for (const rawTag of trade.emotionTags) {
      const tag = rawTag.trim()
      if (!tag) continue
      if (!acc[tag]) {
        acc[tag] = { tag, count: 0, wins: 0, netPnl: 0 }
      }
      acc[tag].count += 1
      acc[tag].wins += trade.pnl > 0 ? 1 : 0
      acc[tag].netPnl += trade.pnl
    }
    return acc
  }, {})

  const mistakeBuckets = trades.reduce<Record<string, { tag: string; count: number; wins: number; netPnl: number }>>((acc, trade) => {
    for (const rawTag of trade.mistakeTags) {
      const tag = rawTag.trim()
      if (!tag || tag === 'None') continue
      if (!acc[tag]) {
        acc[tag] = { tag, count: 0, wins: 0, netPnl: 0 }
      }
      acc[tag].count += 1
      acc[tag].wins += trade.pnl > 0 ? 1 : 0
      acc[tag].netPnl += trade.pnl
    }
    return acc
  }, {})

  const emotionFrequency = Object.values(emotionBuckets)
    .map((item) => ({
      tag: item.tag,
      count: item.count,
      winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
      netPnl: item.netPnl,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const mistakeFrequency = Object.values(mistakeBuckets)
    .map((item) => ({
      tag: item.tag,
      count: item.count,
      winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
      netPnl: item.netPnl,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const ruleBuckets = trades.reduce<Record<'Followed' | 'Broken', { trades: number; wins: number; netPnl: number }>>(
    (acc, trade) => {
      const bucket: 'Followed' | 'Broken' = trade.brokeRules || !trade.ruleFollowed ? 'Broken' : 'Followed'
      acc[bucket].trades += 1
      acc[bucket].wins += trade.pnl > 0 ? 1 : 0
      acc[bucket].netPnl += trade.pnl
      return acc
    },
    {
      Followed: { trades: 0, wins: 0, netPnl: 0 },
      Broken: { trades: 0, wins: 0, netPnl: 0 },
    },
  )

  const rulePerformance = (Object.keys(ruleBuckets) as Array<'Followed' | 'Broken'>)
    .map((bucket) => ({
      bucket,
      trades: ruleBuckets[bucket].trades,
      netPnl: ruleBuckets[bucket].netPnl,
      winRate: ruleBuckets[bucket].trades > 0 ? (ruleBuckets[bucket].wins / ruleBuckets[bucket].trades) * 100 : 0,
    }))
    .filter((item) => item.trades > 0)

  return { pnlTrend, setupPnl, symbolPnl, sideWinRate, sessionPerformance, dayOfWeekPerformance, emotionFrequency, mistakeFrequency, rulePerformance }
}