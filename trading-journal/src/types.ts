export type Side = 'LONG' | 'SHORT'
export type AssetClass = 'futures' | 'forex' | 'cfd' | 'stock' | 'crypto' | 'option'
export type QuantityType = 'contracts' | 'lots' | 'shares' | 'coins' | 'units'

export type InstrumentSpec = {
  symbol: string
  assetClass: AssetClass
  broker?: string
  tickSize?: number
  tickValue?: number
  pointValue?: number
  contractSize?: number
  quantityType?: QuantityType
  quoteCurrency?: string
}

export type DashboardTab = 'overview' | 'distribution' | 'trend' | 'symbols'

export type TimeFilterPreset = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'

export type SetupPlaybookEntry = {
  id: string
  name: string
  description: string
  entryCriteria: string
  invalidationCriteria: string
  notes: string
}

export type TradeAttachment = {
  id: string
  kind: 'screenshot' | 'chart'
  name: string
  status: 'placeholder' | 'uploaded'
  url: string | null
  createdAt: number
}

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
  setupWasValid: boolean
  waitedForConfirmation: boolean
  riskWasDefined: boolean
  followedPlan: boolean
  brokeRules: boolean
  emotionTags: string[]
  mistakeTags: string[]
  attachments: TradeAttachment[]
  broker?: string
  assetClass?: AssetClass
  quantityType?: QuantityType
  grossPnl?: number
  calculationMethod?: 'imported' | 'calculated'
  realizedPnl?: number | null
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
  setupWasValid: boolean
  waitedForConfirmation: boolean
  riskWasDefined: boolean
  followedPlan: boolean
  brokeRules: boolean
  emotionTags: string[]
  mistakeTags: string[]
  broker: string
  realizedPnl: number | null
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

export type WeeklyReview = {
  tradeCount: number
  bestSetup: { name: string; netPnl: number } | null
  worstSetup: { name: string; netPnl: number } | null
  avgWinner: number
  avgLoser: number
  mostCommonMistake: { tag: string; count: number } | null
  strongestSession: { name: string; netPnl: number } | null
  weakestSession: { name: string; netPnl: number } | null
  ruleFollowed: { trades: number; netPnl: number; winRate: number }
  ruleBroken: { trades: number; netPnl: number; winRate: number }
  insightBlocks: string[]
}

export type ChartDataSet = {
  pnlTrend: Array<{ date: string; netPnl: number; tradeCount: number; cumulativePnl: number; label: string }>
  setupPnl: Array<{ setup: string; netPnl: number; trades: number; winRate: number }>
  symbolPnl: Array<{ symbol: string; netPnl: number; trades: number }>
  sideWinRate: Array<{ side: 'LONG' | 'SHORT'; winRate: number; trades: number; netPnl: number }>
  sessionPerformance: Array<{ session: string; netPnl: number; trades: number; winRate: number }>
  dayOfWeekPerformance: Array<{ day: string; netPnl: number; trades: number; winRate: number }>
  emotionFrequency: Array<{ tag: string; count: number; winRate: number; netPnl: number }>
  mistakeFrequency: Array<{ tag: string; count: number; winRate: number; netPnl: number }>
  rulePerformance: Array<{ bucket: 'Followed' | 'Broken'; trades: number; netPnl: number; winRate: number }>
}
