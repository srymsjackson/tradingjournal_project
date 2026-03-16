import type { AssetClass, InstrumentSpec, QuantityType, Side } from '../types'

export type TradeInput = {
  symbol: string
  broker?: string
  side: 'long' | 'short'
  entry: number
  exit: number
  qty: number
  fees?: number
  realizedPnL?: number | null
}

export type PnLResult = {
  gross: number
  net: number
  calculationMethod: 'imported' | 'calculated'
  specUsed?: InstrumentSpec
}

const normalizeSymbol = (value: string) => value.trim().toUpperCase()
const normalizeBroker = (value?: string) => value?.trim().toLowerCase()

const keyFor = (symbol: string, broker = 'generic') => `${normalizeBroker(broker) ?? 'generic'}:${normalizeSymbol(symbol)}`

export const INSTRUMENT_SPECS: Record<string, InstrumentSpec> = {
  'tradovate:MES': {
    symbol: 'MES',
    broker: 'tradovate',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'generic:MES': {
    symbol: 'MES',
    broker: 'generic',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 1.25,
    pointValue: 5,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'tradovate:ES': {
    symbol: 'ES',
    broker: 'tradovate',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 12.5,
    pointValue: 50,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'generic:ES': {
    symbol: 'ES',
    broker: 'generic',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 12.5,
    pointValue: 50,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'tradovate:MNQ': {
    symbol: 'MNQ',
    broker: 'tradovate',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 0.5,
    pointValue: 2,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'generic:MNQ': {
    symbol: 'MNQ',
    broker: 'generic',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 0.5,
    pointValue: 2,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'tradovate:NQ': {
    symbol: 'NQ',
    broker: 'tradovate',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 5,
    pointValue: 20,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'generic:NQ': {
    symbol: 'NQ',
    broker: 'generic',
    assetClass: 'futures',
    tickSize: 0.25,
    tickValue: 5,
    pointValue: 20,
    quantityType: 'contracts',
    quoteCurrency: 'USD',
  },
  'generic:XAUUSD': {
    symbol: 'XAUUSD',
    broker: 'generic',
    assetClass: 'cfd',
    tickSize: 0.01,
    contractSize: 100,
    quantityType: 'lots',
    quoteCurrency: 'USD',
  },
  'generic:AAPL': {
    symbol: 'AAPL',
    broker: 'generic',
    assetClass: 'stock',
    quantityType: 'shares',
    quoteCurrency: 'USD',
  },
  'generic:BTCUSD': {
    symbol: 'BTCUSD',
    broker: 'generic',
    assetClass: 'crypto',
    quantityType: 'coins',
    quoteCurrency: 'USD',
  },
}

export const registerInstrumentSpec = (spec: InstrumentSpec) => {
  const key = keyFor(spec.symbol, spec.broker)
  INSTRUMENT_SPECS[key] = {
    ...spec,
    symbol: normalizeSymbol(spec.symbol),
    broker: normalizeBroker(spec.broker) ?? 'generic',
  }
}

const getSignedDiff = (side: 'long' | 'short', entry: number, exit: number) => (side === 'long' ? exit - entry : entry - exit)

const assertFinitePositive = (value: number, field: string) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be greater than 0.`)
  }
}

const assertFinite = (value: number, field: string) => {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${field}.`)
  }
}

export const resolveInstrumentSpec = (symbol: string, broker?: string): InstrumentSpec | null => {
  const normalizedSymbol = normalizeSymbol(symbol)
  const normalizedBroker = normalizeBroker(broker)

  if (!normalizedSymbol) return null

  if (normalizedBroker) {
    const brokerKey = `${normalizedBroker}:${normalizedSymbol}`
    if (INSTRUMENT_SPECS[brokerKey]) return INSTRUMENT_SPECS[brokerKey]
  }

  const genericKey = `generic:${normalizedSymbol}`
  if (INSTRUMENT_SPECS[genericKey]) return INSTRUMENT_SPECS[genericKey]

  const anyMatch = Object.values(INSTRUMENT_SPECS).find((spec) => normalizeSymbol(spec.symbol) === normalizedSymbol)
  return anyMatch ?? null
}

export const getQuantityLabel = (assetClass?: AssetClass, quantityType?: QuantityType) => {
  if (quantityType) return quantityType
  switch (assetClass) {
    case 'futures':
      return 'contracts'
    case 'forex':
    case 'cfd':
      return 'lots'
    case 'stock':
      return 'shares'
    case 'crypto':
      return 'coins'
    case 'option':
      return 'contracts'
    default:
      return 'quantity'
  }
}

export const sideToCalculatorSide = (side: Side): 'long' | 'short' => (side === 'LONG' ? 'long' : 'short')

export const calculatePnL = (trade: TradeInput): PnLResult => {
  const fees = Number.isFinite(trade.fees) ? Number(trade.fees) : 0

  if (trade.realizedPnL != null && Number.isFinite(trade.realizedPnL)) {
    const importedNet = Number(trade.realizedPnL)
    return {
      gross: importedNet + fees,
      net: importedNet,
      calculationMethod: 'imported',
    }
  }

  assertFinite(trade.entry, 'entry price')
  assertFinite(trade.exit, 'exit price')
  assertFinitePositive(trade.qty, 'quantity')

  const spec = resolveInstrumentSpec(trade.symbol, trade.broker)
  if (!spec) {
    throw new Error(
      `Unknown instrument spec for symbol ${normalizeSymbol(trade.symbol)}. Add a symbol spec (optionally broker-specific) before calculating P&L.`,
    )
  }

  const diff = getSignedDiff(trade.side, trade.entry, trade.exit)
  let gross = 0

  switch (spec.assetClass) {
    case 'stock':
    case 'crypto':
      gross = diff * trade.qty
      break

    case 'futures':
      if (!Number.isFinite(spec.pointValue)) {
        throw new Error(`Missing pointValue for futures symbol ${spec.symbol}.`)
      }
      gross = diff * trade.qty * Number(spec.pointValue)
      break

    case 'forex':
    case 'cfd':
      if (!Number.isFinite(spec.contractSize)) {
        throw new Error(`Missing contractSize for ${spec.assetClass} symbol ${spec.symbol}.`)
      }
      gross = diff * trade.qty * Number(spec.contractSize)
      break

    case 'option':
      gross = diff * trade.qty * Number(spec.contractSize ?? 100)
      break

    default:
      throw new Error(`Unsupported asset class: ${String(spec.assetClass)}`)
  }

  return {
    gross,
    net: gross - fees,
    calculationMethod: 'calculated',
    specUsed: spec,
  }
}
