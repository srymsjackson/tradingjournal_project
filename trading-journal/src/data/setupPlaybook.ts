import type { SetupPlaybookEntry } from '../types'

export const SETUP_PLAYBOOK: SetupPlaybookEntry[] = [
  {
    id: 'breakout',
    name: 'Breakout',
    description: 'Continuation entry after price breaks key structure with momentum and volume.',
    entryCriteria: 'Break and close above/below key level, then hold on retest.',
    invalidationCriteria: 'Failed retest back into prior range or immediate rejection.',
    notes: 'Best in trending conditions with clean higher-timeframe structure.',
  },
  {
    id: 'vwap-reclaim',
    name: 'VWAP Reclaim',
    description: 'Re-entry with trend when price reclaims VWAP and accepts above it.',
    entryCriteria: 'Reclaim VWAP with confirmation candle and volume support.',
    invalidationCriteria: 'Loss of VWAP acceptance within 1-2 candles.',
    notes: 'Often strongest during Open and New York AM.',
  },
  {
    id: 'orb',
    name: 'ORB',
    description: 'Opening Range Break entry when price resolves cleanly outside initial range.',
    entryCriteria: 'Break of opening range high/low with follow-through candle.',
    invalidationCriteria: 'Re-entry into opening range after breakout trigger.',
    notes: 'Avoid low volume fake-outs in choppy opens.',
  },
  {
    id: 'trend-continuation',
    name: 'Trend continuation',
    description: 'Pullback continuation entry aligned with prevailing intraday trend.',
    entryCriteria: 'Pullback into support/resistance then continuation trigger in trend direction.',
    invalidationCriteria: 'Structure break against trend before continuation trigger.',
    notes: 'Scale confidence with trend strength and session volatility.',
  },
  {
    id: 'liquidity-sweep',
    name: 'Liquidity sweep',
    description: 'Reversal or continuation after a stop-run through obvious highs/lows.',
    entryCriteria: 'Sweep of liquidity level followed by reclaim/rejection confirmation.',
    invalidationCriteria: 'Price continues through sweep level without reclaim/rejection.',
    notes: 'Pair with higher-timeframe context to avoid random spikes.',
  },
]
