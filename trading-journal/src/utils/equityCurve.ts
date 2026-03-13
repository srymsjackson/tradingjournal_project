import type { Trade } from '../types'
import { formatDate } from './tradeCalculations'

export type EquityCurvePoint = {
  date: string
  label: string
  cumulativePnl: number
  tradeCount: number
  peakEquity: number
  drawdown: number
}

const toTime = (rawDate: string) => {
  const value = String(rawDate || '').trim()
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) {
    const year = Number(iso[1])
    const month = Number(iso[2])
    const day = Number(iso[3])
    return new Date(year, month - 1, day).getTime()
  }

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slash) {
    const month = Number(slash[1])
    const day = Number(slash[2])
    const year = Number(slash[3])
    return new Date(year, month - 1, day).getTime()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

const resolvePnl = (trade: Trade) => {
  if (Number.isFinite(trade.pnl)) return trade.pnl
  const direction = trade.side === 'SHORT' ? -1 : 1
  return (trade.exit - trade.entry) * trade.shares * direction - trade.fees
}

export const buildEquityCurveData = (trades: Trade[]): EquityCurvePoint[] => {
  const sorted = trades.slice().sort((a, b) => toTime(a.date) - toTime(b.date) || a.createdAt - b.createdAt)

  const byDate = sorted.reduce<Record<string, { date: string; tradeCount: number; netPnl: number }>>((acc, trade) => {
    const key = trade.date
    const pnl = resolvePnl(trade)
    if (!acc[key]) {
      acc[key] = { date: trade.date, tradeCount: 0, netPnl: 0 }
    }

    acc[key].tradeCount += 1
    acc[key].netPnl += pnl
    return acc
  }, {})

  let running = 0
  let runningPeak = Number.NEGATIVE_INFINITY

  return Object.values(byDate)
    .sort((a, b) => toTime(a.date) - toTime(b.date))
    .map((day) => {
      running += day.netPnl
      runningPeak = Math.max(runningPeak, running)
      return {
        date: day.date,
        label: formatDate(day.date),
        cumulativePnl: running,
        tradeCount: day.tradeCount,
        peakEquity: runningPeak,
        drawdown: running - runningPeak,
      }
    })
}
