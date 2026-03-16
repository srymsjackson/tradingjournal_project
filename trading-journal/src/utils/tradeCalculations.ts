import type { ReviewInsights, SampleTradeInput, Side, SymbolStat, Trade, TradeFormData, TradeStats, WeeklyReview } from '../types'
import { calculatePnL, sideToCalculatorSide } from '../lib/pnlEngine'

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

export const buildTradeFromForm = (form: TradeFormData): Trade => {
  const symbol = form.symbol.trim().toUpperCase()
  const broker = form.broker.trim().toLowerCase()
  const setup = form.setup.trim()
  const notes = form.notes.trim()

  const pnlResult = calculatePnL({
    symbol,
    broker,
    side: sideToCalculatorSide(form.side),
    entry: form.entry,
    exit: form.exit,
    qty: form.shares,
    fees: form.fees,
    realizedPnL: form.realizedPnl,
  })

  const pnl = pnlResult.net
  const costBasis = form.entry * form.shares
  const durationTotalSec = form.durationMin * 60 + form.durationSec

  return {
    id: crypto.randomUUID(),
    date: form.date,
    symbol,
    side: form.side,
    broker,
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
    setupWasValid: form.setupWasValid,
    waitedForConfirmation: form.waitedForConfirmation,
    riskWasDefined: form.riskWasDefined,
    followedPlan: form.followedPlan,
    brokeRules: form.brokeRules,
    emotionTags: form.emotionTags,
    mistakeTags: form.mistakeTags,
    attachments: [],
    grossPnl: pnlResult.gross,
    calculationMethod: pnlResult.calculationMethod,
    assetClass: pnlResult.specUsed?.assetClass,
    quantityType: pnlResult.specUsed?.quantityType,
    realizedPnl: form.realizedPnl,
    pnl,
    returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
    createdAt: Date.now(),
  }
}

export const createFormFromTrade = (trade: Trade): TradeFormData => ({
  date: trade.date,
  symbol: trade.symbol,
  side: trade.side,
  setup: trade.setup,
  session: trade.session,
  marketCondition: trade.marketCondition,
  broker: trade.broker || '',
  entry: trade.entry,
  exit: trade.exit,
  shares: trade.shares,
  fees: trade.fees,
  pnlHigh: trade.pnlHigh,
  pnlLow: trade.pnlLow,
  durationMin: Math.floor(trade.durationSec / 60),
  durationSec: trade.durationSec % 60,
  confidence: trade.confidence,
  notes: trade.notes,
  ruleFollowed: trade.ruleFollowed,
  setupWasValid: trade.setupWasValid,
  waitedForConfirmation: trade.waitedForConfirmation,
  riskWasDefined: trade.riskWasDefined,
  followedPlan: trade.followedPlan,
  brokeRules: trade.brokeRules,
  emotionTags: [...trade.emotionTags],
  mistakeTags: [...trade.mistakeTags],
  realizedPnl: trade.realizedPnl ?? null,
})

export const buildSeedTradesFromSample = (sampleTrades: SampleTradeInput[]): Trade[] =>
  sampleTrades.map((item, index) => {
    const side: Side = toSide(item.side)
    const rawPnl = side === 'LONG' ? (item.exit - item.entry) * item.shares : (item.entry - item.exit) * item.shares
    const seedNet = rawPnl - item.fees
    const pnlResult = calculatePnL({
      symbol: item.symbol.trim().toUpperCase(),
      side: sideToCalculatorSide(side),
      entry: item.entry,
      exit: item.exit,
      qty: item.shares,
      fees: item.fees,
      realizedPnL: seedNet,
    })
    const pnl = pnlResult.net
    const costBasis = item.entry * item.shares

    return {
      id: crypto.randomUUID(),
      date: usDateToIso(item.date),
      symbol: item.symbol.trim().toUpperCase(),
      side,
      broker: '',
      setup: item.setup,
      session: 'Open',
      marketCondition: 'Trending',
      entry: item.entry,
      exit: item.exit,
      shares: item.shares,
      fees: item.fees,
      pnlHigh: item.pnlHigh,
      pnlLow: item.pnlLow,
      durationSec: item.durationMin * 60,
      confidence: item.confidence,
      notes: '',
      ruleFollowed: true,
      setupWasValid: true,
      waitedForConfirmation: true,
      riskWasDefined: true,
      followedPlan: true,
      brokeRules: false,
      emotionTags: [],
      mistakeTags: [],
      attachments: [],
      grossPnl: pnlResult.gross,
      calculationMethod: pnlResult.calculationMethod,
      assetClass: pnlResult.specUsed?.assetClass,
      quantityType: pnlResult.specUsed?.quantityType,
      realizedPnl: seedNet,
      pnl,
      returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
      createdAt: Date.now() + index,
    }
  })

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

export const getWeeklyReview = (trades: Trade[]): WeeklyReview => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  const parseTradeDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, Math.max(0, (month || 1) - 1), day || 1)
  }

  const weeklyTrades = trades.filter((trade) => {
    const date = parseTradeDate(trade.date)
    return date >= weekStart && date <= today
  })

  const emptyResult: WeeklyReview = {
    tradeCount: 0,
    bestSetup: null,
    worstSetup: null,
    avgWinner: 0,
    avgLoser: 0,
    mostCommonMistake: null,
    strongestSession: null,
    weakestSession: null,
    ruleFollowed: { trades: 0, netPnl: 0, winRate: 0 },
    ruleBroken: { trades: 0, netPnl: 0, winRate: 0 },
    insightBlocks: ['Log a few trades this week to unlock your review summary and coaching prompts.'],
  }

  if (weeklyTrades.length === 0) return emptyResult

  const setupBuckets = weeklyTrades.reduce<Record<string, number>>((acc, trade) => {
    const key = trade.setup.trim() || 'Unspecified'
    acc[key] = (acc[key] || 0) + trade.pnl
    return acc
  }, {})

  const setupRanked = Object.entries(setupBuckets)
    .map(([name, netPnl]) => ({ name, netPnl }))
    .sort((a, b) => b.netPnl - a.netPnl)

  const bestSetup = setupRanked[0] ?? null
  const worstSetup = setupRanked[setupRanked.length - 1] ?? null

  const winners = weeklyTrades.filter((trade) => trade.pnl > 0)
  const losers = weeklyTrades.filter((trade) => trade.pnl < 0)
  const avgWinner = winners.length > 0 ? winners.reduce((sum, trade) => sum + trade.pnl, 0) / winners.length : 0
  const avgLoser = losers.length > 0 ? losers.reduce((sum, trade) => sum + trade.pnl, 0) / losers.length : 0

  const mistakeCounts = weeklyTrades.reduce<Record<string, number>>((acc, trade) => {
    for (const tag of trade.mistakeTags) {
      const cleaned = tag.trim()
      if (!cleaned || cleaned === 'None') continue
      acc[cleaned] = (acc[cleaned] || 0) + 1
    }
    return acc
  }, {})

  const mostCommonMistakeEntry = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]
  const mostCommonMistake = mostCommonMistakeEntry ? { tag: mostCommonMistakeEntry[0], count: mostCommonMistakeEntry[1] } : null

  const sessionBuckets = weeklyTrades.reduce<Record<string, number>>((acc, trade) => {
    const key = trade.session.trim() || 'Unspecified'
    acc[key] = (acc[key] || 0) + trade.pnl
    return acc
  }, {})

  const sessionRanked = Object.entries(sessionBuckets)
    .map(([name, netPnl]) => ({ name, netPnl }))
    .sort((a, b) => b.netPnl - a.netPnl)

  const strongestSession = sessionRanked[0] ?? null
  const weakestSession = sessionRanked[sessionRanked.length - 1] ?? null

  const ruleFollowedTrades = weeklyTrades.filter((trade) => trade.ruleFollowed && !trade.brokeRules)
  const ruleBrokenTrades = weeklyTrades.filter((trade) => trade.brokeRules || !trade.ruleFollowed)

  const calcRuleStats = (subset: Trade[]) => {
    const wins = subset.filter((trade) => trade.pnl > 0).length
    return {
      trades: subset.length,
      netPnl: subset.reduce((sum, trade) => sum + trade.pnl, 0),
      winRate: subset.length > 0 ? (wins / subset.length) * 100 : 0,
    }
  }

  const ruleFollowed = calcRuleStats(ruleFollowedTrades)
  const ruleBroken = calcRuleStats(ruleBrokenTrades)

  const insightBlocks: string[] = []
  if (bestSetup && bestSetup.netPnl > 0) insightBlocks.push(`Best edge this week: ${bestSetup.name}. Consider prioritizing this setup when conditions align.`)
  if (worstSetup && worstSetup.netPnl < 0 && worstSetup.name !== bestSetup?.name) insightBlocks.push(`Weakest setup: ${worstSetup.name}. Review entries and confirmation quality before repeating it.`)
  if (mostCommonMistake) insightBlocks.push(`Most repeated mistake: ${mostCommonMistake.tag} (${mostCommonMistake.count}x). Add one checklist step to prevent it.`)
  if (ruleFollowed.trades > 0 || ruleBroken.trades > 0) {
    const delta = ruleFollowed.netPnl - ruleBroken.netPnl
    insightBlocks.push(`Discipline gap: ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} comparing rule-followed vs rule-broken performance.`)
  }
  if (insightBlocks.length === 0) insightBlocks.push('Collect a few more tagged trades to unlock stronger weekly coaching signals.')

  return {
    tradeCount: weeklyTrades.length,
    bestSetup,
    worstSetup,
    avgWinner,
    avgLoser,
    mostCommonMistake,
    strongestSession,
    weakestSession,
    ruleFollowed,
    ruleBroken,
    insightBlocks,
  }
}

export const toSide = (value: string): Side => (value.toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG')