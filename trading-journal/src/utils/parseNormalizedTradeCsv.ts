import type { Side, Trade } from '../types'
import { calculatePnL } from '../lib/pnlEngine'

type ParsedCsvResult = {
  trades: Trade[]
  skippedRows: number
}

const CANONICAL_HEADERS = ['trade_date', 'symbol', 'side', 'entry_price', 'exit_price', 'quantity', 'setup', 'session'] as const

const HEADER_ALIASES: Record<(typeof CANONICAL_HEADERS)[number] | 'net_pnl', string[]> = {
  trade_date: ['trade_date', 'date'],
  symbol: ['symbol'],
  side: ['side'],
  entry_price: ['entry_price', 'entry'],
  exit_price: ['exit_price', 'exit'],
  quantity: ['quantity', 'shares'],
  setup: ['setup'],
  session: ['session'],
  net_pnl: ['net_pnl', 'pnl'],
}

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/^\uFEFF/, '')

const parseCsvRows = (csvText: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]

    if (char === '"') {
      const next = csvText[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') i += 1
      row.push(current.trim())
      current = ''
      if (row.some((field) => field.length > 0)) rows.push(row)
      row = []
      continue
    }

    current += char
  }

  row.push(current.trim())
  if (row.some((field) => field.length > 0)) rows.push(row)

  return rows
}

const parseNumber = (value: string) => {
  const cleaned = value.trim().replace(/,/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const parseSide = (value: string): Side | null => {
  const normalized = value.trim().toUpperCase()
  if (normalized === 'LONG' || normalized === 'L' || normalized === 'BUY') return 'LONG'
  if (normalized === 'SHORT' || normalized === 'S' || normalized === 'SELL') return 'SHORT'
  return null
}

const parseDurationSeconds = (value: string) => {
  if (!value.trim()) return 0

  const raw = value.trim().toLowerCase()
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric >= 0) return Math.floor(numeric)

  const mmss = raw.match(/^(\d+):(\d{1,2})$/)
  if (mmss) {
    return Number(mmss[1]) * 60 + Number(mmss[2])
  }

  const minutes = raw.match(/(\d+)\s*min/)
  const seconds = raw.match(/(\d+)\s*sec/)
  if (minutes || seconds) {
    return (minutes ? Number(minutes[1]) : 0) * 60 + (seconds ? Number(seconds[1]) : 0)
  }

  return 0
}

const findHeaderIndex = (headers: string[], canonicalName: keyof typeof HEADER_ALIASES) => {
  const aliases = HEADER_ALIASES[canonicalName]
  for (const alias of aliases) {
    const index = headers.indexOf(alias)
    if (index >= 0) return index
  }
  return -1
}

const hasRequiredHeaders = (headers: string[]) => CANONICAL_HEADERS.every((header) => findHeaderIndex(headers, header) >= 0)

export const parseNormalizedTradeCsvText = (csvText: string): ParsedCsvResult => {
  const rows = parseCsvRows(csvText)
  if (rows.length <= 1) return { trades: [], skippedRows: 0 }

  const headers = rows[0].map(normalizeHeader)
  if (!hasRequiredHeaders(headers)) {
    throw new Error('CSV is missing one or more required columns.')
  }

  const dateIndex = findHeaderIndex(headers, 'trade_date')
  const symbolIndex = findHeaderIndex(headers, 'symbol')
  const sideIndex = findHeaderIndex(headers, 'side')
  const entryIndex = findHeaderIndex(headers, 'entry_price')
  const exitIndex = findHeaderIndex(headers, 'exit_price')
  const quantityIndex = findHeaderIndex(headers, 'quantity')
  const netPnlIndex = findHeaderIndex(headers, 'net_pnl')
  const setupIndex = findHeaderIndex(headers, 'setup')
  const sessionIndex = findHeaderIndex(headers, 'session')
  const brokerIndex = headers.indexOf('broker')
  const durationIndex = headers.indexOf('duration')

  const trades: Trade[] = []
  let skippedRows = 0

  rows.slice(1).forEach((row, index) => {
    const tradeDate = row[dateIndex]?.trim() || ''
    const symbol = row[symbolIndex]?.trim().toUpperCase() || ''
    const side = parseSide(row[sideIndex] || '')
    const entryPrice = parseNumber(row[entryIndex] || '')
    const exitPrice = parseNumber(row[exitIndex] || '')
    const quantity = parseNumber(row[quantityIndex] || '')
    const netPnlRaw = netPnlIndex >= 0 ? parseNumber(row[netPnlIndex] || '') : Number.NaN
    const setup = row[setupIndex]?.trim() || 'imported'
    const session = row[sessionIndex]?.trim() || 'open'
    const broker = brokerIndex >= 0 ? (row[brokerIndex]?.trim().toLowerCase() ?? '') : ''
    const durationSec = durationIndex >= 0 ? parseDurationSeconds(row[durationIndex] || '') : 0

    if (!tradeDate || !symbol || !side || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(quantity) || quantity <= 0) {
      skippedRows += 1
      return
    }

    const resolvedNetPnl = Number.isFinite(netPnlRaw)
      ? netPnlRaw
      : side === 'LONG'
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity

    const costBasis = entryPrice * quantity
    const pnlResult = calculatePnL({
      symbol,
      broker,
      side: side === 'LONG' ? 'long' : 'short',
      entry: entryPrice,
      exit: exitPrice,
      qty: quantity,
      fees: 0,
      realizedPnL: resolvedNetPnl,
    })

    trades.push({
      id: crypto.randomUUID(),
      tradeDate,
      symbol,
      broker,
      side,
      setup,
      session,
      marketCondition: 'imported',
      entryPrice,
      exitPrice,
      quantity,
      fees: 0,
      pnlHigh: resolvedNetPnl,
      pnlLow: resolvedNetPnl,
      durationSec,
      confidence: 3,
      notes: 'imported from normalized csv',
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
      realizedPnl: resolvedNetPnl,
      netPnl: pnlResult.net,
      returnPct: costBasis > 0 ? (pnlResult.net / costBasis) * 100 : 0,
      createdAt: Date.now() + index,
    })
  })

  return { trades, skippedRows }
}

export const parseNormalizedTradeCsvFile = async (file: File): Promise<ParsedCsvResult> => {
  const text = await file.text()
  return parseNormalizedTradeCsvText(text)
}
