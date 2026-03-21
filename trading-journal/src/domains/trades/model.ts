export type TradeSide = 'LONG' | 'SHORT'

export type ChecklistBoolean = 'YES' | 'NO'

export type TradeRecord = {
  id: string
  userId: string
  tradeDate: string
  market: string
  account: string
  side: TradeSide
  setupType: string
  session: string
  entryPrice: number
  exitPrice: number
  stopLoss: number
  takeProfit: number
  quantity: number
  riskAmount: number
  pnl: number
  rMultiple: number
  screenshotBefore: string
  screenshotAfter: string
  notes: string
  liquiditySweepPresent: boolean
  displacementPresent: boolean
  mssPresent: boolean
  fvgPresent: boolean
  htfBiasAligned: boolean
  newsRiskChecked: boolean
  aPlusSetup: boolean
  plannedBeforeEntry: boolean
  followedPlan: boolean
  executionRating: number
  emotionalState: string
  mistakeTags: string[]
  reasonForExit: string
  wouldTakeAgain: boolean
  createdAt: string
  updatedAt: string
}

export type TradeInput = Omit<TradeRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export const emptyTradeInput = (): TradeInput => ({
  tradeDate: new Date().toISOString().slice(0, 10),
  market: '',
  account: '',
  side: 'LONG',
  setupType: '',
  session: 'New York AM',
  entryPrice: 0,
  exitPrice: 0,
  stopLoss: 0,
  takeProfit: 0,
  quantity: 1,
  riskAmount: 0,
  pnl: 0,
  rMultiple: 0,
  screenshotBefore: '',
  screenshotAfter: '',
  notes: '',
  liquiditySweepPresent: false,
  displacementPresent: false,
  mssPresent: false,
  fvgPresent: false,
  htfBiasAligned: false,
  newsRiskChecked: false,
  aPlusSetup: false,
  plannedBeforeEntry: false,
  followedPlan: false,
  executionRating: 5,
  emotionalState: '',
  mistakeTags: [],
  reasonForExit: '',
  wouldTakeAgain: true,
})

export const normalizeMistakeTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )

export const formatMistakeTags = (tags: string[]): string => tags.join(', ')

export const computePnl = (side: TradeSide, entry: number, exit: number, quantity: number): number => {
  const move = side === 'LONG' ? exit - entry : entry - exit
  return move * quantity
}

export const computeRMultiple = (pnl: number, riskAmount: number): number => {
  if (!Number.isFinite(riskAmount) || riskAmount <= 0) return 0
  return pnl / riskAmount
}
