export type Side = 'LONG' | 'SHORT'

export type DashboardTab = 'overview' | 'distribution' | 'trend' | 'symbols'

export type TimeFilterPreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'

export type SampleTradeInput = {
  date: string
  symbol: string
  side: 'Long' | 'Short'
  entry: number
  exit: number
  shares: number
  fees: number
  pnlHigh: number
  pnlLow: number
  durationMin: number
  confidence: number
  setup: string
}

export type Trade = {
  id: string
  date: string
  symbol: string
  side: Side
  setup: string
  session: string
  marketCondition: string
  entry: number
  exit: number
  shares: number
  fees: number
  pnlHigh: number
  pnlLow: number
  durationSec: number
  confidence: number
  notes: string
  ruleFollowed: boolean
  emotionTags: string[]
  mistakeTags: string[]
  pnl: number
  returnPct: number
  createdAt: number
}

export type TradeFormData = {
  date: string
  symbol: string
  side: Side
  setup: string
  session: string
  marketCondition: string
  entry: number
  exit: number
  shares: number
  fees: number
  pnlHigh: number
  pnlLow: number
  durationMin: number
  durationSec: number
  confidence: number
  notes: string
  ruleFollowed: boolean
  emotionTags: string[]
  mistakeTags: string[]
}

export type TradeStats = {
  totalTrades: number
  netPnl: number
  winRate: number
  avgWinner: number
  avgLoser: number
  profitFactor: number
  bestTrade: number
  worstTrade: number
}

export type SymbolStat = {
  avgWin: number
  avgLoss: number
  winDurationSec: number
  lossDurationSec: number
  winRate: number
}

export type ReviewInsights = {
  expectancy: number
  avgDurationSec: number
  disciplineScore: number
  currentStreak: { direction: 'win' | 'loss' | 'flat'; count: number }
  setupPerformance: Array<{ setup: string; trades: number; netPnl: number; winRate: number }>
  coachingNotes: string[]
}

export type ChartDataSet = {
  outcomePie: Array<{ name: string; value: number }>
  pnlTrend: Array<{ date: string; netPnl: number; tradeCount: number; cumulativePnl: number; label: string }>
  symbolPnl: Array<{ symbol: string; netPnl: number; trades: number; avgPnlHigh: number; avgPnlLow: number }>
}
