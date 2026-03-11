import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type Side = 'LONG' | 'SHORT'
type DashboardTab = 'overview' | 'distribution' | 'trend' | 'symbols'

type SampleTradeInput = {
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

type Trade = {
  id: string
  date: string
  symbol: string
  side: Side
  setup: string
  entry: number
  exit: number
  shares: number
  fees: number
  pnlHigh: number
  pnlLow: number
  durationSec: number
  confidence: number
  notes: string
  pnl: number
  returnPct: number
  createdAt: number
}

type TradeFormData = {
  date: string
  symbol: string
  side: Side
  setup: string
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
}

const STORAGE_KEY = 'pulse-journal-trades'
const SYMBOLS_KEY = 'pulse-journal-symbols'
const CHART_COLORS = ['#0d7a52', '#d46c2f', '#2f65d4', '#bc3a2e', '#7f4be2', '#1d9ab5']

const SAMPLE_TRADES: SampleTradeInput[] = [
  { date: '03/01/2026', symbol: 'XAUUSD', side: 'Long', entry: 2031.4, exit: 2034.8, shares: 1, fees: 2, pnlHigh: 120, pnlLow: -35, durationMin: 42, confidence: 4, setup: 'Asia Breakout' },
  { date: '03/01/2026', symbol: 'BTCUSD', side: 'Short', entry: 64120, exit: 64280, shares: 1, fees: 3, pnlHigh: 95, pnlLow: -50, durationMin: 35, confidence: 3, setup: 'Liquidity Sweep' },
  { date: '03/02/2026', symbol: 'AAPL', side: 'Long', entry: 182.1, exit: 183.55, shares: 10, fees: 1, pnlHigh: 80, pnlLow: -25, durationMin: 28, confidence: 4, setup: 'VWAP Reclaim' },
  { date: '03/02/2026', symbol: 'TSLA', side: 'Short', entry: 212.4, exit: 214.1, shares: 8, fees: 1, pnlHigh: 15, pnlLow: -60, durationMin: 20, confidence: 2, setup: 'Trend Pullback' },
  { date: '03/03/2026', symbol: 'NVDA', side: 'Long', entry: 903.5, exit: 914.2, shares: 2, fees: 2, pnlHigh: 110, pnlLow: -40, durationMin: 55, confidence: 5, setup: 'Breakout' },
  { date: '03/03/2026', symbol: 'XAUUSD', side: 'Short', entry: 2042.1, exit: 2037.6, shares: 1, fees: 2, pnlHigh: 140, pnlLow: -30, durationMin: 48, confidence: 4, setup: 'Asia Reversal' },
  { date: '03/04/2026', symbol: 'ETHUSD', side: 'Long', entry: 3340, exit: 3328, shares: 1, fees: 2, pnlHigh: 85, pnlLow: -25, durationMin: 30, confidence: 4, setup: 'Range Breakout' },
  { date: '03/04/2026', symbol: 'AMD', side: 'Long', entry: 168.4, exit: 167.6, shares: 12, fees: 1, pnlHigh: 95, pnlLow: -20, durationMin: 25, confidence: 3, setup: 'Opening Range' },
  { date: '03/05/2026', symbol: 'XAUUSD', side: 'Long', entry: 2030.7, exit: 2036.9, shares: 1, fees: 2, pnlHigh: 160, pnlLow: -40, durationMin: 60, confidence: 5, setup: 'iFVG' },
  { date: '03/05/2026', symbol: 'BTCUSD', side: 'Long', entry: 64550, exit: 64420, shares: 1, fees: 3, pnlHigh: 60, pnlLow: -70, durationMin: 22, confidence: 3, setup: 'Breakout' },
  { date: '03/06/2026', symbol: 'AAPL', side: 'Short', entry: 183.4, exit: 181.8, shares: 9, fees: 1, pnlHigh: 105, pnlLow: -20, durationMin: 32, confidence: 4, setup: 'VWAP Reject' },
  { date: '03/06/2026', symbol: 'TSLA', side: 'Long', entry: 210.8, exit: 215.3, shares: 7, fees: 1, pnlHigh: 135, pnlLow: -45, durationMin: 40, confidence: 5, setup: 'Breakout' },
  { date: '03/07/2026', symbol: 'NVDA', side: 'Short', entry: 912, exit: 905, shares: 2, fees: 2, pnlHigh: 90, pnlLow: -50, durationMin: 36, confidence: 3, setup: 'Resistance Fade' },
  { date: '03/07/2026', symbol: 'XAUUSD', side: 'Long', entry: 2038, exit: 2035.4, shares: 1, fees: 2, pnlHigh: 170, pnlLow: -30, durationMin: 50, confidence: 5, setup: 'Asia Breakout' },
  { date: '03/08/2026', symbol: 'ETHUSD', side: 'Short', entry: 3380, exit: 3355, shares: 1, fees: 2, pnlHigh: 70, pnlLow: -35, durationMin: 44, confidence: 3, setup: 'Range Reject' },
  { date: '03/08/2026', symbol: 'AMD', side: 'Short', entry: 170.1, exit: 171.4, shares: 10, fees: 1, pnlHigh: 80, pnlLow: -25, durationMin: 28, confidence: 4, setup: 'VWAP Reject' },
  { date: '03/09/2026', symbol: 'BTCUSD', side: 'Long', entry: 64880, exit: 65210, shares: 1, fees: 3, pnlHigh: 110, pnlLow: -40, durationMin: 39, confidence: 4, setup: 'Liquidity Sweep' },
  { date: '03/09/2026', symbol: 'XAUUSD', side: 'Short', entry: 2048, exit: 2043, shares: 1, fees: 2, pnlHigh: 120, pnlLow: -30, durationMin: 41, confidence: 4, setup: 'Trend Continue' },
  { date: '03/10/2026', symbol: 'AAPL', side: 'Long', entry: 181.9, exit: 180.7, shares: 11, fees: 1, pnlHigh: 115, pnlLow: -35, durationMin: 34, confidence: 4, setup: 'Breakout' },
  { date: '03/10/2026', symbol: 'NVDA', side: 'Long', entry: 906, exit: 918, shares: 2, fees: 2, pnlHigh: 150, pnlLow: -50, durationMin: 52, confidence: 5, setup: 'Trend Pullback' },
  { date: '03/10/2026', symbol: 'XAUUSD', side: 'Long', entry: 2034, exit: 2040, shares: 1, fees: 2, pnlHigh: 165, pnlLow: -30, durationMin: 45, confidence: 5, setup: 'Asia iFVG' },
  { date: '03/11/2026', symbol: 'TSLA', side: 'Short', entry: 216, exit: 217.4, shares: 6, fees: 1, pnlHigh: 120, pnlLow: -20, durationMin: 37, confidence: 4, setup: 'Reversal' },
  { date: '03/11/2026', symbol: 'ETHUSD', side: 'Long', entry: 3375, exit: 3410, shares: 1, fees: 2, pnlHigh: 95, pnlLow: -40, durationMin: 33, confidence: 3, setup: 'Breakout' },
  { date: '03/11/2026', symbol: 'BTCUSD', side: 'Short', entry: 65320, exit: 65440, shares: 1, fees: 3, pnlHigh: 140, pnlLow: -60, durationMin: 48, confidence: 4, setup: 'Resistance Reject' },
  { date: '03/11/2026', symbol: 'XAUUSD', side: 'Long', entry: 2040, exit: 2047, shares: 1, fees: 2, pnlHigh: 175, pnlLow: -35, durationMin: 50, confidence: 5, setup: 'VWAP Reclaim' },
  { date: '03/11/2026', symbol: 'AMD', side: 'Long', entry: 169.5, exit: 168.2, shares: 14, fees: 1, pnlHigh: 90, pnlLow: -20, durationMin: 27, confidence: 3, setup: 'Breakout' },
  { date: '03/11/2026', symbol: 'AAPL', side: 'Short', entry: 184.1, exit: 182.6, shares: 10, fees: 1, pnlHigh: 100, pnlLow: -30, durationMin: 36, confidence: 4, setup: 'VWAP Reject' },
  { date: '03/11/2026', symbol: 'NVDA', side: 'Long', entry: 918, exit: 925, shares: 2, fees: 2, pnlHigh: 140, pnlLow: -40, durationMin: 44, confidence: 5, setup: 'Momentum' },
  { date: '03/11/2026', symbol: 'XAUUSD', side: 'Short', entry: 2049, exit: 2044, shares: 1, fees: 2, pnlHigh: 130, pnlLow: -35, durationMin: 38, confidence: 4, setup: 'Liquidity Sweep' },
  { date: '03/11/2026', symbol: 'BTCUSD', side: 'Long', entry: 65010, exit: 64870, shares: 1, fees: 3, pnlHigh: 150, pnlLow: -55, durationMin: 41, confidence: 4, setup: 'Breakout' },
]

const today = () => new Date().toISOString().slice(0, 10)

const initialForm = (): TradeFormData => ({
  date: today(),
  symbol: '',
  side: 'LONG',
  setup: '',
  entry: 0,
  exit: 0,
  shares: 0,
  fees: 0,
  pnlHigh: 0,
  pnlLow: 0,
  durationMin: 0,
  durationSec: 0,
  confidence: 3,
  notes: '',
})

const loadTrades = (): Trade[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.map((item) => {
      const entry = Number(item.entry) || 0
      const shares = Number(item.shares) || 0
      const pnl = Number(item.pnl) || 0
      const pnlHigh = Number.isFinite(Number(item.pnlHigh)) ? Number(item.pnlHigh) : pnl
      const pnlLow = Number.isFinite(Number(item.pnlLow)) ? Number(item.pnlLow) : pnl
      const durationSec = Number.isFinite(Number(item.durationSec)) && Number(item.durationSec) >= 0 ? Number(item.durationSec) : 0

      return {
        ...item,
        entry,
        exit: Number(item.exit) || 0,
        shares,
        fees: Number(item.fees) || 0,
        pnl,
        pnlHigh,
        pnlLow,
        durationSec,
        returnPct: Number.isFinite(Number(item.returnPct))
          ? Number(item.returnPct)
          : entry * shares > 0
            ? (pnl / (entry * shares)) * 100
            : 0,
        createdAt: Number(item.createdAt) || Date.now(),
      } as Trade
    })
  } catch {
    return []
  }
}

const loadSymbols = (): string[] => {
  try {
    const raw = localStorage.getItem(SYMBOLS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return Array.from(new Set(parsed.map((item) => String(item).trim().toUpperCase()).filter(Boolean))).sort()
  } catch {
    return []
  }
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

const formatDuration = (durationSec: number) => {
  const safeSeconds = Math.max(0, Math.floor(durationSec || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes} min ${seconds} sec`
}

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

const usDateToIso = (value: string) => {
  const [month, day, year] = value.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const tooltipMoneyFormatter = (value: number | string | ReadonlyArray<number | string> | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value
  return formatMoney(Number(raw ?? 0))
}

function App() {
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades())
  const [savedSymbols, setSavedSymbols] = useState<string[]>(() => loadSymbols())
  const [form, setForm] = useState<TradeFormData>(() => initialForm())
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  const symbolOptions = useMemo(
    () =>
      Array.from(new Set([...savedSymbols, ...trades.map((trade) => trade.symbol.trim().toUpperCase()).filter(Boolean)])).sort(),
    [savedSymbols, trades],
  )

  const sortedTrades = useMemo(
    () =>
      trades
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt),
    [trades],
  )

  const stats = useMemo(() => {
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
  }, [trades])

  const chartData = useMemo(() => {
    const sortedByDateAsc = trades
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.createdAt - b.createdAt)

    const outcomes = {
      win: trades.filter((trade) => trade.pnl > 0).length,
      loss: trades.filter((trade) => trade.pnl < 0).length,
      flat: trades.filter((trade) => trade.pnl === 0).length,
    }

    const outcomePie = [
      { name: 'Wins', value: outcomes.win },
      { name: 'Losses', value: outcomes.loss },
      { name: 'Breakeven', value: outcomes.flat },
    ].filter((item) => item.value > 0)

    let runningPnl = 0
    const groupedByDay = sortedByDateAsc.reduce<Record<string, { date: string; netPnl: number; tradeCount: number; cumulativePnl: number }>>(
      (acc, trade) => {
        if (!acc[trade.date]) {
          acc[trade.date] = { date: trade.date, netPnl: 0, tradeCount: 0, cumulativePnl: 0 }
        }

        acc[trade.date].netPnl += trade.pnl
        acc[trade.date].tradeCount += 1
        return acc
      },
      {},
    )

    const pnlTrend = Object.values(groupedByDay)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((day) => {
        runningPnl += day.netPnl
        return {
          ...day,
          label: formatDate(day.date),
          cumulativePnl: runningPnl,
        }
      })

    const groupedSymbols = trades.reduce<Record<string, { symbol: string; netPnl: number; trades: number; avgPnlHigh: number; avgPnlLow: number }>>(
      (acc, trade) => {
        const symbol = trade.symbol.trim().toUpperCase()
        if (!acc[symbol]) {
          acc[symbol] = { symbol, netPnl: 0, trades: 0, avgPnlHigh: 0, avgPnlLow: 0 }
        }

        acc[symbol].netPnl += trade.pnl
        acc[symbol].trades += 1
        acc[symbol].avgPnlHigh += trade.pnlHigh
        acc[symbol].avgPnlLow += trade.pnlLow
        return acc
      },
      {},
    )

    const symbolPnl = Object.values(groupedSymbols)
      .map((item) => ({
        ...item,
        avgPnlHigh: item.trades > 0 ? item.avgPnlHigh / item.trades : 0,
        avgPnlLow: item.trades > 0 ? item.avgPnlLow / item.trades : 0,
      }))
      .sort((a, b) => b.netPnl - a.netPnl)

    return {
      outcomePie,
      pnlTrend,
      symbolPnl,
    }
  }, [trades])

  const symbolStats = useMemo(() => {
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
  }, [trades])

  const updateForm = <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const persistTrades = (nextTrades: Trade[]) => {
    setTrades(nextTrades)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrades))
  }

  const persistSymbols = (nextSymbols: string[]) => {
    const normalized = Array.from(new Set(nextSymbols.map((item) => item.trim().toUpperCase()).filter(Boolean))).sort()
    setSavedSymbols(normalized)
    localStorage.setItem(SYMBOLS_KEY, JSON.stringify(normalized))
  }

  const resetForm = () => setForm(initialForm())

  const addTrade = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const symbol = form.symbol.trim().toUpperCase()
    const setup = form.setup.trim()
    const notes = form.notes.trim()

    if (!form.date || !symbol || !setup || form.entry <= 0 || form.exit <= 0 || form.shares <= 0) {
      window.alert('Please fill all required fields with valid values.')
      return
    }

    if (form.durationMin < 0 || form.durationSec < 0 || form.durationSec > 59) {
      window.alert('Duration seconds must be between 0 and 59.')
      return
    }

    const rawPnl = form.side === 'LONG' ? (form.exit - form.entry) * form.shares : (form.entry - form.exit) * form.shares
    const pnl = rawPnl - form.fees
    const costBasis = form.entry * form.shares
    const durationTotalSec = form.durationMin * 60 + form.durationSec

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      date: form.date,
      symbol,
      side: form.side,
      setup,
      entry: form.entry,
      exit: form.exit,
      shares: form.shares,
      fees: form.fees,
      pnlHigh: form.pnlHigh || pnl,
      pnlLow: form.pnlLow || pnl,
      durationSec: durationTotalSec,
      confidence: form.confidence,
      notes,
      pnl,
      returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
      createdAt: Date.now(),
    }

    persistTrades([newTrade, ...trades])
    if (!symbolOptions.includes(symbol)) {
      persistSymbols([...symbolOptions, symbol])
    }
    resetForm()
  }

  const removeTrade = (id: string) => {
    persistTrades(trades.filter((trade) => trade.id !== id))
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trades-${today()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadSampleData = () => {
    const shouldReplace = window.confirm('Load the provided 30-trade sample dataset? This will replace your current trade log.')
    if (!shouldReplace) {
      return
    }

    const seededTrades: Trade[] = SAMPLE_TRADES.map((item, index) => {
      const side: Side = item.side.toUpperCase() as Side
      const rawPnl = side === 'LONG' ? (item.exit - item.entry) * item.shares : (item.entry - item.exit) * item.shares
      const pnl = rawPnl - item.fees
      const costBasis = item.entry * item.shares

      return {
        id: crypto.randomUUID(),
        date: usDateToIso(item.date),
        symbol: item.symbol.trim().toUpperCase(),
        side,
        setup: item.setup,
        entry: item.entry,
        exit: item.exit,
        shares: item.shares,
        fees: item.fees,
        pnlHigh: item.pnlHigh,
        pnlLow: item.pnlLow,
        durationSec: item.durationMin * 60,
        confidence: item.confidence,
        notes: '',
        pnl,
        returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
        createdAt: Date.now() + index,
      }
    })

    persistTrades(seededTrades)
    persistSymbols(Array.from(new Set(seededTrades.map((trade) => trade.symbol))).sort())
    window.alert('Sample dataset imported successfully.')
  }

  return (
    <>
      <div className="bg-layer" />
      <header className="topbar">
        <h1>Pulse Journal</h1>
        <p>Track every trade. Improve every session.</p>
      </header>

      <main className="layout">
        <section className="panel form-panel">
          <h2>Log Trade</h2>
          <form onSubmit={addTrade}>
            <div className="grid two-col">
              <label>
                Date
                <input type="date" value={form.date} onChange={(e) => updateForm('date', e.target.value)} required />
              </label>
              <label>
                Symbol
                <input
                  type="text"
                  placeholder="AAPL"
                  value={form.symbol}
                  onChange={(e) => updateForm('symbol', e.target.value)}
                  required
                  maxLength={10}
                  list="symbol-options"
                  autoComplete="off"
                />
                <small className="field-hint">Typed symbols are remembered for quick reuse.</small>
              </label>
            </div>

            <datalist id="symbol-options">
              {symbolOptions.map((symbol) => (
                <option key={symbol} value={symbol} />
              ))}
            </datalist>

            <div className="grid two-col">
              <label>
                Side
                <select value={form.side} onChange={(e) => updateForm('side', e.target.value as Side)} required>
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </label>
              <label>
                Setup
                <input
                  type="text"
                  placeholder="Breakout, VWAP reclaim..."
                  value={form.setup}
                  onChange={(e) => updateForm('setup', e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="grid three-col">
              <label>
                Entry
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.entry || ''}
                  onChange={(e) => updateForm('entry', Number(e.target.value))}
                  required
                />
              </label>
              <label>
                Exit
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.exit || ''}
                  onChange={(e) => updateForm('exit', Number(e.target.value))}
                  required
                />
              </label>
              <label>
                Shares
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.shares || ''}
                  onChange={(e) => updateForm('shares', Number(e.target.value))}
                  required
                />
              </label>
            </div>

            <div className="grid two-col">
              <label>
                Fees ($)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fees}
                  onChange={(e) => updateForm('fees', Number(e.target.value))}
                />
              </label>
              <label>
                P&amp;L High ($)
                <input
                  type="number"
                  step="0.01"
                  value={form.pnlHigh || ''}
                  onChange={(e) => updateForm('pnlHigh', Number(e.target.value))}
                  placeholder="Optional"
                />
              </label>
            </div>

            <div className="grid two-col">
              <label>
                P&amp;L Low ($)
                <input
                  type="number"
                  step="0.01"
                  value={form.pnlLow || ''}
                  onChange={(e) => updateForm('pnlLow', Number(e.target.value))}
                  placeholder="Optional"
                />
              </label>
              <label>
                Duration Minutes
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.durationMin || ''}
                  onChange={(e) => updateForm('durationMin', Number(e.target.value))}
                />
              </label>
            </div>

            <div className="grid two-col">
              <label>
                Duration Seconds
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={form.durationSec || ''}
                  onChange={(e) => updateForm('durationSec', Number(e.target.value))}
                />
              </label>
              <label>
                Confidence (1-5)
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  value={form.confidence}
                  onChange={(e) => updateForm('confidence', Number(e.target.value))}
                />
              </label>
            </div>

            <label>
              Notes
              <textarea
                rows={3}
                placeholder="Execution notes, emotions, mistakes..."
                value={form.notes}
                onChange={(e) => updateForm('notes', e.target.value)}
              />
            </label>

            <div className="actions">
              <button type="submit" className="trade-save-button">
                <span className="trade-save-button__icon-wrapper">
                  <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="trade-save-button__icon-svg" width="10" aria-hidden="true">
                    <path
                      d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                      fill="currentColor"
                    />
                  </svg>

                  <svg
                    viewBox="0 0 14 15"
                    fill="none"
                    width="10"
                    xmlns="http://www.w3.org/2000/svg"
                    className="trade-save-button__icon-svg trade-save-button__icon-svg--copy"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                Save Trade
              </button>
              <button type="button" className="btn ghost" onClick={resetForm}>
                Clear Form
              </button>
              <button type="button" className="btn ghost" onClick={loadSampleData}>
                Load Sample Data
              </button>
            </div>
          </form>
        </section>

        <section className="panel dashboard-panel">
          <div className="dashboard-head">
            <h2>Dashboard</h2>
            <button className="export-download-btn" onClick={exportJson} aria-label="Export trades as JSON">
              <svg className="export-svg-icon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
              </svg>
              <span className="export-icon-rail" />
              <span className="export-tooltip">Download JSON</span>
            </button>
          </div>

          <div className="tabs" role="tablist" aria-label="Dashboard views">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'distribution' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'distribution'}
              onClick={() => setActiveTab('distribution')}
            >
              Distribution
            </button>
            <button
              className={`tab-btn ${activeTab === 'trend' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'trend'}
              onClick={() => setActiveTab('trend')}
            >
              Trend
            </button>
            <button
              className={`tab-btn ${activeTab === 'symbols' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'symbols'}
              onClick={() => setActiveTab('symbols')}
            >
              Symbols
            </button>
          </div>

          {activeTab === 'overview' && (
            <>
              <div className="stat-grid">
                <article className="stat-card">
                  <p>Total Trades</p>
                  <h3>{stats.totalTrades}</h3>
                </article>
                <article className="stat-card">
                  <p>Net P&amp;L</p>
                  <h3 className={stats.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(stats.netPnl)}</h3>
                </article>
                <article className="stat-card">
                  <p>Win Rate</p>
                  <h3>{stats.winRate.toFixed(1)}%</h3>
                </article>
                <article className="stat-card">
                  <p>Avg Winner</p>
                  <h3>{formatMoney(stats.avgWinner)}</h3>
                </article>
                <article className="stat-card">
                  <p>Avg Loser</p>
                  <h3>{formatMoney(stats.avgLoser)}</h3>
                </article>
                <article className="stat-card">
                  <p>Profit Factor</p>
                  <h3>{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'Infinity'}</h3>
                </article>
                <article className="stat-card">
                  <p>Best Trade</p>
                  <h3>{formatMoney(stats.bestTrade)}</h3>
                </article>
                <article className="stat-card">
                  <p>Worst Trade</p>
                  <h3>{formatMoney(stats.worstTrade)}</h3>
                </article>
              </div>
              <div className="chart-grid">
                <article className="chart-card">
                  <h4>Outcome Split</h4>
                  {chartData.outcomePie.length > 0 ? (
                    <div className="chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData.outcomePie} dataKey="value" nameKey="name" outerRadius={80} label>
                            {chartData.outcomePie.map((entry, index) => (
                              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="empty-copy">Add trades to render chart data.</p>
                  )}
                </article>
                <article className="chart-card">
                  <h4>Cumulative Equity Curve</h4>
                  {chartData.pnlTrend.length > 0 ? (
                    <div className="chart-shell">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.pnlTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip formatter={tooltipMoneyFormatter} />
                          <Legend />
                          <Line type="monotone" dataKey="cumulativePnl" stroke="#0d7a52" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="empty-copy">Add trades to render chart data.</p>
                  )}
                </article>
              </div>
            </>
          )}

          {activeTab === 'distribution' && (
            <div className="chart-grid">
              <article className="chart-card">
                <h4>Win / Loss Distribution</h4>
                {chartData.outcomePie.length > 0 ? (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData.outcomePie} dataKey="value" nameKey="name" outerRadius={88} label>
                          {chartData.outcomePie.map((entry, index) => (
                            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="empty-copy">Add trades to render chart data.</p>
                )}
              </article>
              <article className="chart-card">
                <h4>Average P&amp;L High vs Low by Symbol</h4>
                {chartData.symbolPnl.length > 0 ? (
                  <div className="chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.symbolPnl}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="symbol" />
                        <YAxis />
                        <Tooltip formatter={tooltipMoneyFormatter} />
                        <Legend />
                        <Bar dataKey="avgPnlHigh" fill="#118f5f" name="Avg P&L High" />
                        <Bar dataKey="avgPnlLow" fill="#bc3a2e" name="Avg P&L Low" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="empty-copy">Add trades to render chart data.</p>
                )}
              </article>
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="chart-grid single">
              <article className="chart-card">
                <h4>Daily Net P&amp;L and Cumulative P&amp;L</h4>
                {chartData.pnlTrend.length > 0 ? (
                  <div className="chart-shell large">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.pnlTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip formatter={tooltipMoneyFormatter} />
                        <Legend />
                        <Line type="monotone" dataKey="netPnl" name="Daily Net P&L" stroke="#d46c2f" strokeWidth={2} />
                        <Line type="monotone" dataKey="cumulativePnl" name="Cumulative P&L" stroke="#0d7a52" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="empty-copy">Add trades to render chart data.</p>
                )}
              </article>
            </div>
          )}

          {activeTab === 'symbols' && (
            <div className="chart-grid single">
              <article className="chart-card">
                <h4>Net P&amp;L by Symbol</h4>
                {chartData.symbolPnl.length > 0 ? (
                  <div className="chart-shell large">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.symbolPnl}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="symbol" />
                        <YAxis />
                        <Tooltip formatter={tooltipMoneyFormatter} />
                        <Legend />
                        <Bar dataKey="netPnl" name="Net P&L">
                          {chartData.symbolPnl.map((entry, index) => (
                            <Cell key={entry.symbol} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="empty-copy">Add trades to render chart data.</p>
                )}
              </article>
            </div>
          )}

          <h3 className="table-title">Trade Log</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Net P&amp;L</th>
                  <th>P&amp;L High</th>
                  <th>P&amp;L Low</th>
                  <th>Qty</th>
                  <th>Commission</th>
                  <th>Avg Win</th>
                  <th>Avg Loss</th>
                  <th>Win Duration</th>
                  <th>Loss Duration</th>
                  <th>Win %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={13}>No trades logged yet.</td>
                  </tr>
                ) : (
                  sortedTrades.map((trade) => {
                    const rowStats = symbolStats[trade.symbol] ?? {
                      avgWin: 0,
                      avgLoss: 0,
                      winDurationSec: 0,
                      lossDurationSec: 0,
                      winRate: 0,
                    }

                    return (
                      <tr key={trade.id}>
                        <td>{formatDate(trade.date)}</td>
                        <td>
                          <span className="symbol-pill">{trade.symbol}</span>
                        </td>
                        <td className={trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.pnl)}</td>
                        <td className={trade.pnlHigh >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.pnlHigh)}</td>
                        <td className={trade.pnlLow >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.pnlLow)}</td>
                        <td>{trade.shares}</td>
                        <td>{formatMoney(trade.fees)}</td>
                        <td>{formatMoney(rowStats.avgWin)}</td>
                        <td>{formatMoney(rowStats.avgLoss)}</td>
                        <td>{formatDuration(rowStats.winDurationSec)}</td>
                        <td>{formatDuration(rowStats.lossDurationSec)}</td>
                        <td>{rowStats.winRate.toFixed(1)}%</td>
                        <td>
                          <button className="icon-btn" onClick={() => removeTrade(trade.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
