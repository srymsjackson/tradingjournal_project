import type {
  ChartDataSet,
  ReviewInsights,
  Side,
  SymbolStat,
  Trade,
  TradeFormData,
  TradeStats,
} from '../types'

export const STORAGE_KEY = 'pulse-journal-trades'
export const SYMBOLS_KEY = 'pulse-journal-symbols'
export const SETUPS_KEY = 'pulse-journal-setups'
export const CHART_COLORS = ['#0d7a52', '#d46c2f', '#2f65d4', '#bc3a2e', '#7f4be2', '#1d9ab5']

export const COMMON_SETUPS = [
  'Breakout',
  'VWAP Reclaim',
  'VWAP Reject',
  'Liquidity Sweep',
  'Trend Pullback',
  'Opening Range',
  'Asia Breakout',
  'Range Reject',
]

export const SESSION_OPTIONS = ['Pre-Market', 'Open', 'Midday', 'Power Hour', 'After Hours']

export const MARKET_CONDITIONS = ['Trending', 'Range-bound', 'Choppy', 'High Volatility', 'Low Liquidity']

export const EMOTION_TAGS = ['Calm', 'Focused', 'Patient', 'FOMO', 'Hesitant', 'Revenge', 'Confident', 'Tired']

export const MISTAKE_TAGS = ['None', 'Late Entry', 'Early Exit', 'Oversized', 'No Stop', 'Overtrading', 'Chasing', 'Rule Break']

export const today = () => new Date().toISOString().slice(0, 10)

export const initialForm = (): TradeFormData => ({
  date: today(),
  symbol: '',
  side: 'LONG',
  setup: '',
  session: 'Open',
  marketCondition: 'Trending',
  entry: 0,
  exit: 0,
  shares: 0,
  fees: 0,
  pnlHigh: 0,
  pnlLow: 0,
  durationMin: 0,
  durationSec: 0,
  confidence: 3,
  notes: '',
  ruleFollowed: true,
  emotionTags: [],
  mistakeTags: [],
})

export const loadTrades = (): Trade[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => {
      const entry = Number(item.entry) || 0
      const shares = Number(item.shares) || 0
      const pnl = Number(item.pnl) || 0
      const pnlHigh = Number.isFinite(Number(item.pnlHigh)) ? Number(item.pnlHigh) : pnl
      const pnlLow = Number.isFinite(Number(item.pnlLow)) ? Number(item.pnlLow) : pnl
      const durationSec = Number.isFinite(Number(item.durationSec)) && Number(item.durationSec) >= 0 ? Number(item.durationSec) : 0

      return {
        ...item,
        entry,
        session: String(item.session || 'Open'),
        marketCondition: String(item.marketCondition || 'Trending'),
        exit: Number(item.exit) || 0,
        shares,
        fees: Number(item.fees) || 0,
        pnl,
        pnlHigh,
        pnlLow,
        durationSec,
        returnPct: Number.isFinite(Number(item.returnPct))
          ? Number(item.returnPct)
          : entry * shares > 0
            ? (pnl / (entry * shares)) * 100
            : 0,
        ruleFollowed: item.ruleFollowed !== false,
        emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
        mistakeTags: Array.isArray(item.mistakeTags) ? item.mistakeTags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
        createdAt: Number(item.createdAt) || Date.now(),
      } as Trade
    })
  } catch {
    return []
  }
}

export const loadSymbols = (): string[] => {
  try {
    const raw = localStorage.getItem(SYMBOLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return Array.from(new Set(parsed.map((item) => String(item).trim().toUpperCase()).filter(Boolean))).sort()
  } catch {
    return []
  }
}

export const normalizeSymbols = (symbols: string[]) =>
  Array.from(new Set(symbols.map((item) => item.trim().toUpperCase()).filter(Boolean))).sort()

export const normalizeSetups = (setups: string[]) =>
  Array.from(new Set(setups.map((item) => item.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))

export const loadSetups = (): string[] => {
  try {
    const raw = localStorage.getItem(SETUPS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return normalizeSetups(parsed.map((item) => String(item)))
  } catch {
    return []
  }
}

export const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

export const formatDuration = (durationSec: number) => {
  const safeSeconds = Math.max(0, Math.floor(durationSec || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes} min ${seconds} sec`
}

export const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export const usDateToIso = (value: string) => {
  const [month, day, year] = value.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export const tooltipMoneyFormatter = (value: number | string | ReadonlyArray<number | string> | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  return formatMoney(Number(raw ?? 0))
}

export const buildTradeFromForm = (form: TradeFormData): Trade => {
  const symbol = form.symbol.trim().toUpperCase()
  const setup = form.setup.trim()
  const notes = form.notes.trim()
  const rawPnl = form.side === 'LONG' ? (form.exit - form.entry) * form.shares : (form.entry - form.exit) * form.shares
  const pnl = rawPnl - form.fees
  const costBasis = form.entry * form.shares
  const durationTotalSec = form.durationMin * 60 + form.durationSec

  return {
    id: crypto.randomUUID(),
    date: form.date,
    symbol,
    side: form.side,
    setup,
    session: form.session,
    marketCondition: form.marketCondition,
    entry: form.entry,
    exit: form.exit,
    shares: form.shares,
    fees: form.fees,
    pnlHigh: form.pnlHigh || pnl,
    pnlLow: form.pnlLow || pnl,
    durationSec: durationTotalSec,
    confidence: form.confidence,
    notes,
    ruleFollowed: form.ruleFollowed,
    emotionTags: form.emotionTags,
    mistakeTags: form.mistakeTags,
    pnl,
    returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
    createdAt: Date.now(),
  }
}

export const getStats = (trades: Trade[]): TradeStats => {
  const pnlValues = trades.map((t) => Number(t.pnl) || 0)
  const winners = pnlValues.filter((p) => p > 0)
  const losers = pnlValues.filter((p) => p < 0)
  const grossProfit = winners.reduce((sum, value) => sum + value, 0)
  const grossLossAbs = Math.abs(losers.reduce((sum, value) => sum + value, 0))
  const netPnl = pnlValues.reduce((sum, value) => sum + value, 0)

  return {
    totalTrades: trades.length,
    netPnl,
    winRate: trades.length > 0 ? (winners.length / trades.length) * 100 : 0,
    avgWinner: winners.length > 0 ? grossProfit / winners.length : 0,
    avgLoser: losers.length > 0 ? losers.reduce((sum, v) => sum + v, 0) / losers.length : 0,
    profitFactor: grossLossAbs > 0 ? grossProfit / grossLossAbs : grossProfit > 0 ? Number.POSITIVE_INFINITY : 0,
    bestTrade: pnlValues.length > 0 ? Math.max(...pnlValues) : 0,
    worstTrade: pnlValues.length > 0 ? Math.min(...pnlValues) : 0,
  }
}

export const getSymbolStats = (trades: Trade[]): Record<string, SymbolStat> => {
  const grouped = trades.reduce<Record<string, { total: number; wins: number; winPnl: number[]; lossPnl: number[]; winDurations: number[]; lossDurations: number[] }>>(
    (acc, trade) => {
      const symbol = trade.symbol.trim().toUpperCase()
      if (!acc[symbol]) {
        acc[symbol] = { total: 0, wins: 0, winPnl: [], lossPnl: [], winDurations: [], lossDurations: [] }
      }

      acc[symbol].total += 1
      if (trade.pnl > 0) {
        acc[symbol].wins += 1
        acc[symbol].winPnl.push(trade.pnl)
        acc[symbol].winDurations.push(trade.durationSec)
      } else if (trade.pnl < 0) {
        acc[symbol].lossPnl.push(trade.pnl)
        acc[symbol].lossDurations.push(trade.durationSec)
      }
      return acc
    },
    {},
  )

  return Object.fromEntries(
    Object.entries(grouped).map(([symbol, group]) => {
      const avgWin = group.winPnl.length > 0 ? group.winPnl.reduce((sum, value) => sum + value, 0) / group.winPnl.length : 0
      const avgLoss = group.lossPnl.length > 0 ? group.lossPnl.reduce((sum, value) => sum + value, 0) / group.lossPnl.length : 0
      const winDurationSec =
        group.winDurations.length > 0
          ? Math.round(group.winDurations.reduce((sum, value) => sum + value, 0) / group.winDurations.length)
          : 0
      const lossDurationSec =
        group.lossDurations.length > 0
          ? Math.round(group.lossDurations.reduce((sum, value) => sum + value, 0) / group.lossDurations.length)
          : 0

      return [
        symbol,
        {
          avgWin,
          avgLoss,
          winDurationSec,
          lossDurationSec,
          winRate: group.total > 0 ? (group.wins / group.total) * 100 : 0,
        },
      ]
    }),
  )
}

export const getChartData = (trades: Trade[]): ChartDataSet => {
  const sortedByDateAsc = trades
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt)

  const outcomes = {
    win: trades.filter((trade) => trade.pnl > 0).length,
    loss: trades.filter((trade) => trade.pnl < 0).length,
    flat: trades.filter((trade) => trade.pnl === 0).length,
  }

  const outcomePie = [
    { name: 'Wins', value: outcomes.win },
    { name: 'Losses', value: outcomes.loss },
    { name: 'Breakeven', value: outcomes.flat },
  ].filter((item) => item.value > 0)

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

  const groupedSymbols = trades.reduce<Record<string, { symbol: string; netPnl: number; trades: number; avgPnlHigh: number; avgPnlLow: number }>>(
    (acc, trade) => {
      const symbol = trade.symbol.trim().toUpperCase()
      if (!acc[symbol]) {
        acc[symbol] = { symbol, netPnl: 0, trades: 0, avgPnlHigh: 0, avgPnlLow: 0 }
      }
      acc[symbol].netPnl += trade.pnl
      acc[symbol].trades += 1
      acc[symbol].avgPnlHigh += trade.pnlHigh
      acc[symbol].avgPnlLow += trade.pnlLow
      return acc
    },
    {},
  )

  const symbolPnl = Object.values(groupedSymbols)
    .map((item) => ({
      ...item,
      avgPnlHigh: item.trades > 0 ? item.avgPnlHigh / item.trades : 0,
      avgPnlLow: item.trades > 0 ? item.avgPnlLow / item.trades : 0,
    }))
    .sort((a, b) => b.netPnl - a.netPnl)

  return { outcomePie, pnlTrend, symbolPnl }
}

export const getReviewInsights = (trades: Trade[]): ReviewInsights => {
  const stats = getStats(trades)
  const expectancy = (stats.winRate / 100) * stats.avgWinner + (1 - stats.winRate / 100) * stats.avgLoser
  const avgDurationSec = trades.length > 0 ? Math.round(trades.reduce((sum, trade) => sum + trade.durationSec, 0) / trades.length) : 0

  const qualityTrades = trades.filter((trade) => trade.confidence >= 3 && trade.pnlLow >= -Math.abs(trade.pnlHigh || 1) * 0.9).length
  const disciplineScore = trades.length > 0 ? (qualityTrades / trades.length) * 100 : 0

  const sortedByNewest = trades
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt)

  let streakDirection: 'win' | 'loss' | 'flat' = 'flat'
  let streakCount = 0
  for (const trade of sortedByNewest) {
    const direction: 'win' | 'loss' | 'flat' = trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : 'flat'
    if (streakCount === 0) {
      streakDirection = direction
      streakCount = 1
      continue
    }
    if (direction === streakDirection) {
      streakCount += 1
    } else {
      break
    }
  }

  const setups = trades.reduce<Record<string, { setup: string; trades: number; wins: number; netPnl: number }>>((acc, trade) => {
    const key = trade.setup.trim() || 'Unspecified'
    if (!acc[key]) {
      acc[key] = { setup: key, trades: 0, wins: 0, netPnl: 0 }
    }
    acc[key].trades += 1
    acc[key].wins += trade.pnl > 0 ? 1 : 0
    acc[key].netPnl += trade.pnl
    return acc
  }, {})

  const setupPerformance = Object.values(setups)
    .map((item) => ({
      setup: item.setup,
      trades: item.trades,
      netPnl: item.netPnl,
      winRate: item.trades > 0 ? (item.wins / item.trades) * 100 : 0,
    }))
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, 5)

  const coachingNotes: string[] = []
  if (stats.winRate < 45) coachingNotes.push('Review entry quality. Win rate is below your baseline target.')
  if (stats.avgLoser < -Math.abs(stats.avgWinner)) coachingNotes.push('Average loser is larger than average winner. Tighten risk control.')
  if (disciplineScore < 60) coachingNotes.push('Discipline score is low. Favor A+ setups and avoid forced trades.')
  if (coachingNotes.length === 0) coachingNotes.push('Execution profile looks stable. Keep consistency and size selectively.')

  return {
    expectancy,
    avgDurationSec,
    disciplineScore,
    currentStreak: { direction: streakDirection, count: streakCount },
    setupPerformance,
    coachingNotes,
  }
}

export const toSide = (value: string): Side => (value.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG')
