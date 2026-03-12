import type { TradeFormData } from '../types'

export type TradeFormValidationResult =
  | {
      isValid: true
      normalized: {
        symbol: string
        setup: string
        session: string
        marketCondition: string
      }
    }
  | {
      isValid: false
      error: string
    }

export const validateTradeForm = (form: TradeFormData): TradeFormValidationResult => {
  const symbol = form.symbol.trim().toUpperCase()
  const setup = form.setup.trim()
  const session = form.session.trim()
  const marketCondition = form.marketCondition.trim()

  if (!form.date || !symbol || !setup || !session || !marketCondition || form.entry <= 0 || form.exit <= 0 || form.shares <= 0) {
    return {
      isValid: false,
      error: 'Fill required fields: date, symbol, setup, prices, and share size.',
    }
  }

  if (form.durationMin < 0 || form.durationSec < 0 || form.durationSec > 59) {
    return {
      isValid: false,
      error: 'Duration seconds must be between 0 and 59.',
    }
  }

  if (form.confidence < 1 || form.confidence > 5) {
    return {
      isValid: false,
      error: 'Confidence must be between 1 and 5.',
    }
  }

  return {
    isValid: true,
    normalized: {
      symbol,
      setup,
      session,
      marketCondition,
    },
  }
}