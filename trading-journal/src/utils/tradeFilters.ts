import type { SetupPlaybookEntry, TimeFilterPreset, Trade, TradeFormData } from '../types'
import { SETUP_PLAYBOOK } from '../data/setupPlaybook'
import { calculatePnL, sideToCalculatorSide } from '../lib/pnlEngine'

export const STORAGE_KEY = 'pulse-journal-trades'
export const SYMBOLS_KEY = 'pulse-journal-symbols'
export const SETUPS_KEY = 'pulse-journal-setups'

const scopedJournalKey = (baseKey: string, userId?: string) => (userId ? `${baseKey}_${userId}` : baseKey)

export const getJournalStorageKeys = (userId?: string) => ({
  tradesKey: scopedJournalKey(STORAGE_KEY, userId),
  symbolsKey: scopedJournalKey(SYMBOLS_KEY, userId),
  setupsKey: scopedJournalKey(SETUPS_KEY, userId),
})

export const COMMON_SETUPS = Array.from(new Set([...SETUP_PLAYBOOK.map((item) => item.name), 'VWAP Reject', 'Trend Pullback', 'Opening Range', 'Asia Breakout', 'Range Reject']))

const normalizedSetupMap = Object.fromEntries(SETUP_PLAYBOOK.map((item) => [item.name.trim().toLowerCase(), item]))

export const findPlaybookSetup = (setupName: string): SetupPlaybookEntry | null => normalizedSetupMap[setupName.trim().toLowerCase()] ?? null

export const SESSION_OPTIONS = ['Premarket', 'Open', 'Midday', 'Power Hour', 'Asia', 'London', 'New York AM', 'New York PM']

export const MARKET_CONDITIONS = ['Trending', 'Range-bound', 'Choppy', 'High Volatility', 'Low Liquidity']

export const EMOTION_TAGS = ['Confident', 'Hesitant', 'FOMO', 'Frustrated', 'Calm', 'Focused', 'Patient', 'Anxious', 'Revenge']

export const MISTAKE_TAGS = ['Chased entry', 'Moved stop', 'Took profit early', 'No confirmation', 'Overtraded', 'Revenge trade', 'Oversized', 'No Stop']

const pad2 = (value: number) => String(value).padStart(2, '0')

const toLocalIsoDate = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

export const today = () => toLocalIsoDate(new Date())

export const initialForm = (): TradeFormData => ({
  tradeDate: today(),
  symbol: '',
  side: 'LONG',
  setup: '',
  session: 'Open',
  marketCondition: 'Trending',
  entryPrice: 0,
  exitPrice: 0,
  quantity: 0,
  fees: 0,
  pnlHigh: 0,
  pnlLow: 0,
  durationMin: 0,
  durationSec: 0,
  confidence: 3,
  notes: '',
  ruleFollowed: true,
  setupWasValid: true,
  waitedForConfirmation: true,
  riskWasDefined: true,
  followedPlan: true,
  brokeRules: false,
  emotionTags: [],
  mistakeTags: [],
  broker: '',
  realizedPnl: null,
})

export const loadTrades = (userId?: string): Trade[] => {
  try {
    const { tradesKey } = getJournalStorageKeys(userId)
    const raw = localStorage.getItem(tradesKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => {
      const entryPrice = Number(item.entryPrice ?? item.entry) || 0
      const exitPrice = Number(item.exitPrice ?? item.exit) || 0
      const quantity = Number(item.quantity ?? item.shares) || 0
      const fees = Number(item.fees) || 0
      const hasProvidedPnl = Number.isFinite(Number(item.netPnl ?? item.pnl))
      const fallbackPnl =
        String(item.side || '').toUpperCase() === 'SHORT'
          ? (entryPrice - exitPrice) * quantity - fees
          : (exitPrice - entryPrice) * quantity - fees
      const netPnl = hasProvidedPnl ? Number(item.netPnl ?? item.pnl) : fallbackPnl
      const pnlHigh = Number.isFinite(Number(item.pnlHigh)) ? Number(item.pnlHigh) : netPnl
      const pnlLow = Number.isFinite(Number(item.pnlLow)) ? Number(item.pnlLow) : netPnl
      const durationSec = Number.isFinite(Number(item.durationSec)) && Number(item.durationSec) >= 0 ? Number(item.durationSec) : 0
      const broker = String(item.broker || '').trim()

      let resolvedNetPnl = hasProvidedPnl ? Number(item.netPnl ?? item.pnl) : 0
      let grossPnl: number | undefined = Number.isFinite(Number(item.grossPnl)) ? Number(item.grossPnl) : undefined
      let assetClass = typeof item.assetClass === 'string' ? item.assetClass : undefined
      let quantityType = typeof item.quantityType === 'string' ? item.quantityType : undefined
      let calculationMethod: 'imported' | 'calculated' | undefined = item.calculationMethod === 'calculated' ? 'calculated' : item.calculationMethod === 'imported' ? 'imported' : undefined

      try {
        const pnlResult = calculatePnL({
          symbol: String(item.symbol || ''),
          broker,
          side: sideToCalculatorSide(String(item.side || '').toUpperCase() === 'SHORT' ? 'SHORT' : 'LONG'),
          entry: entryPrice,
          exit: exitPrice,
          qty: quantity,
          fees,
          realizedPnL: hasProvidedPnl ? Number(item.netPnl ?? item.pnl) : null,
        })

        resolvedNetPnl = pnlResult.net
        grossPnl = pnlResult.gross
        assetClass = pnlResult.specUsed?.assetClass ?? assetClass
        quantityType = pnlResult.specUsed?.quantityType ?? quantityType
        calculationMethod = pnlResult.calculationMethod
      } catch {
        // Fail-safe fallback for legacy records with missing specs: do not silently fabricate values.
      }

      return {
        ...item,
        tradeDate: String(item.tradeDate || item.date || today()),
        entryPrice,
        broker,
        session: String(item.session || 'Open'),
        marketCondition: String(item.marketCondition || 'Trending'),
        exitPrice,
        quantity,
        fees,
        netPnl: resolvedNetPnl,
        grossPnl,
        calculationMethod,
        assetClass,
        quantityType,
        realizedPnl: hasProvidedPnl ? Number(item.netPnl ?? item.pnl) : null,
        pnlHigh,
        pnlLow,
        durationSec,
        returnPct: Number.isFinite(Number(item.returnPct))
          ? Number(item.returnPct)
          : entryPrice * quantity > 0
            ? (resolvedNetPnl / (entryPrice * quantity)) * 100
            : 0,
        ruleFollowed: item.ruleFollowed !== false,
        setupWasValid: item.setupWasValid !== false,
        waitedForConfirmation: item.waitedForConfirmation !== false,
        riskWasDefined: item.riskWasDefined !== false,
        followedPlan: item.followedPlan !== false,
        brokeRules: item.brokeRules === true,
        emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
        mistakeTags: Array.isArray(item.mistakeTags) ? item.mistakeTags.map((tag: unknown) => String(tag)).filter(Boolean) : [],
        attachments: Array.isArray(item.attachments)
          ? item.attachments
              .map((attachment: unknown) => {
                const rawAttachment = attachment as Record<string, unknown>
                return {
                  id: String(rawAttachment.id || crypto.randomUUID()),
                  kind: rawAttachment.kind === 'chart' ? 'chart' : 'screenshot',
                  name: String(rawAttachment.name || 'Attachment'),
                  status: rawAttachment.status === 'uploaded' ? 'uploaded' : 'placeholder',
                  url: typeof rawAttachment.url === 'string' ? rawAttachment.url : null,
                  createdAt: Number(rawAttachment.createdAt) || Date.now(),
                }
              })
              .filter((attachmentItem: { name: string }) => attachmentItem.name.trim().length > 0)
          : [],
        createdAt: Number(item.createdAt) || Date.now(),
      } as Trade
    })
  } catch {
    return []
  }
}

export const loadSymbols = (userId?: string): string[] => {
  try {
    const { symbolsKey } = getJournalStorageKeys(userId)
    const raw = localStorage.getItem(symbolsKey)
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

export const loadSetups = (userId?: string): string[] => {
  try {
    const { setupsKey } = getJournalStorageKeys(userId)
    const raw = localStorage.getItem(setupsKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return normalizeSetups(parsed.map((item) => String(item)))
  } catch {
    return []
  }
}

const toDateAtMidnight = (rawDate: string) => {
  const value = String(rawDate || '').trim()
  if (!value) return null

  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (year && month && day) return new Date(year, month - 1, day)
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const month = Number(slashMatch[1])
    const day = Number(slashMatch[2])
    const year = Number(slashMatch[3])
    if (year && month && day) return new Date(year, month - 1, day)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const startOfWeek = (date: Date) => {
  const base = startOfDay(date)
  const day = base.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const weekStart = new Date(base)
  weekStart.setDate(base.getDate() + diff)
  return weekStart
}

export const isTradeInRange = (tradeDate: string, preset: TimeFilterPreset, customStart: string, customEnd: string) => {
  if (preset === 'ALL_TIME') return true

  const tradeDay = toDateAtMidnight(tradeDate)
  if (!tradeDay) return false

  const todayDate = startOfDay(new Date())

  if (preset === 'TODAY') {
    return tradeDay.getTime() === todayDate.getTime()
  }

  if (preset === 'THIS_WEEK') {
    return tradeDay >= startOfWeek(todayDate) && tradeDay <= todayDate
  }

  if (preset === 'THIS_MONTH') {
    return tradeDay.getFullYear() === todayDate.getFullYear() && tradeDay.getMonth() === todayDate.getMonth()
  }

  const start = customStart ? toDateAtMidnight(customStart) : null
  const end = customEnd ? toDateAtMidnight(customEnd) : null

  if (!start && !end) return true
  if (start && !end) return tradeDay >= start
  if (!start && end) return tradeDay <= end

  if (!start || !end) return true
  const minBound = start <= end ? start : end
  const maxBound = start <= end ? end : start
  return tradeDay >= minBound && tradeDay <= maxBound
}

export type TradeFilterOptions = {
  timeFilterPreset: TimeFilterPreset
  customDateStart: string
  customDateEnd: string
  filterSymbol: string
  filterSetup: string
  filterOutcome: 'ALL' | 'WIN' | 'LOSS'
}

export const filterTrades = (trades: Trade[], options: TradeFilterOptions) =>
  trades
    .filter((trade) => isTradeInRange(trade.tradeDate, options.timeFilterPreset, options.customDateStart, options.customDateEnd))
    .filter((trade) => (options.filterSymbol === 'ALL' ? true : trade.symbol === options.filterSymbol))
    .filter((trade) => (options.filterSetup === 'ALL' ? true : trade.setup === options.filterSetup))
    .filter((trade) => {
      if (options.filterOutcome === 'ALL') return true
      if (options.filterOutcome === 'WIN') return trade.netPnl > 0
      return trade.netPnl < 0
    })