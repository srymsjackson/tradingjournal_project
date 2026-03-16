import { describe, expect, it } from 'vitest'
import { calculatePnL, registerInstrumentSpec } from './pnlEngine'

describe('calculatePnL', () => {
  it('calculates MES long winner using futures pointValue', () => {
    const result = calculatePnL({
      symbol: 'MES',
      broker: 'tradovate',
      side: 'long',
      entry: 6650.75,
      exit: 6662.25,
      qty: 4,
      fees: 4,
    })

    expect(result.gross).toBe(230)
    expect(result.net).toBe(226)
    expect(result.calculationMethod).toBe('calculated')
  })

  it('calculates MES short winner', () => {
    const result = calculatePnL({
      symbol: 'MES',
      broker: 'tradovate',
      side: 'short',
      entry: 6662.25,
      exit: 6650.75,
      qty: 2,
      fees: 2,
    })

    expect(result.gross).toBe(115)
    expect(result.net).toBe(113)
  })

  it('calculates XAUUSD with CFD contractSize model', () => {
    const result = calculatePnL({
      symbol: 'XAUUSD',
      broker: 'generic',
      side: 'long',
      entry: 3025.1,
      exit: 3027.6,
      qty: 1,
      fees: 0,
    })

    expect(result.gross).toBeCloseTo(250, 8)
    expect(result.net).toBeCloseTo(250, 8)
  })

  it('calculates AAPL stock long winner', () => {
    const result = calculatePnL({
      symbol: 'AAPL',
      side: 'long',
      entry: 180,
      exit: 182,
      qty: 100,
      fees: 2,
    })

    expect(result.gross).toBe(200)
    expect(result.net).toBe(198)
  })

  it('calculates BTCUSD losing trade', () => {
    const result = calculatePnL({
      symbol: 'BTCUSD',
      side: 'long',
      entry: 70000,
      exit: 69500,
      qty: 0.2,
      fees: 3,
    })

    expect(result.gross).toBe(-100)
    expect(result.net).toBe(-103)
  })

  it('prefers imported realizedPnL when provided', () => {
    const result = calculatePnL({
      symbol: 'UNKNOWN',
      side: 'long',
      entry: 1,
      exit: 2,
      qty: 1,
      fees: 5,
      realizedPnL: 80,
    })

    expect(result.calculationMethod).toBe('imported')
    expect(result.net).toBe(80)
    expect(result.gross).toBe(85)
  })

  it('throws for unknown symbol without imported realizedPnL', () => {
    expect(() =>
      calculatePnL({
        symbol: 'UNKNOWN',
        side: 'long',
        entry: 1,
        exit: 2,
        qty: 1,
      }),
    ).toThrow(/Unknown instrument spec/i)
  })

  it('throws when futures pointValue is missing', () => {
    registerInstrumentSpec({
      symbol: 'FUTNOPV',
      broker: 'generic',
      assetClass: 'futures',
      quantityType: 'contracts',
    })

    expect(() =>
      calculatePnL({
        symbol: 'FUTNOPV',
        side: 'long',
        entry: 100,
        exit: 101,
        qty: 1,
      }),
    ).toThrow(/Missing pointValue/i)
  })

  it('throws when CFD contractSize is missing', () => {
    registerInstrumentSpec({
      symbol: 'CFDNOCS',
      broker: 'generic',
      assetClass: 'cfd',
      quantityType: 'lots',
    })

    expect(() =>
      calculatePnL({
        symbol: 'CFDNOCS',
        side: 'long',
        entry: 10,
        exit: 11,
        qty: 1,
      }),
    ).toThrow(/Missing contractSize/i)
  })
})
