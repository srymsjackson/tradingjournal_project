import { useMemo, useState } from 'react'
import TradeEntryPanel from './components/TradeEntryPanel'
import DashboardPanel from './components/DashboardPanel'
import TradeHistoryTable from './components/TradeHistoryTable'
import { SAMPLE_TRADES } from './data/sampleTrades'
import type { DashboardTab, Side, TimeFilterPreset, Trade, TradeFormData } from './types'
import {
  buildTradeFromForm,
  getChartData,
  getReviewInsights,
  getStats,
  initialForm,
  loadSetups,
  loadSymbols,
  loadTrades,
  normalizeSetups,
  normalizeSymbols,
  SETUPS_KEY,
  STORAGE_KEY,
  SYMBOLS_KEY,
  toSide,
  usDateToIso,
} from './utils/tradeUtils'
import './App.css'

function App() {
  const toDateAtMidnight = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-').map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
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

  const isTradeInRange = (tradeDate: string, preset: TimeFilterPreset, customStart: string, customEnd: string) => {
    if (preset === 'ALL_TIME') return true

    const tradeDay = toDateAtMidnight(tradeDate)
    if (!tradeDay) return false

    const today = startOfDay(new Date())

    if (preset === 'TODAY') {
      return tradeDay.getTime() === today.getTime()
    }

    if (preset === 'THIS_WEEK') {
      return tradeDay >= startOfWeek(today) && tradeDay <= today
    }

    if (preset === 'THIS_MONTH') {
      return tradeDay.getFullYear() === today.getFullYear() && tradeDay.getMonth() === today.getMonth()
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

  const [trades, setTrades] = useState<Trade[]>(() => loadTrades())
  const [savedSymbols, setSavedSymbols] = useState<string[]>(() => loadSymbols())
  const [savedSetups, setSavedSetups] = useState<string[]>(() => loadSetups())
  const [form, setForm] = useState<TradeFormData>(() => initialForm())
  const [formError, setFormError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL')
  const [filterSetup, setFilterSetup] = useState<string>('ALL')
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL')
  const [timeFilterPreset, setTimeFilterPreset] = useState<TimeFilterPreset>('ALL_TIME')
  const [customDateStart, setCustomDateStart] = useState<string>('')
  const [customDateEnd, setCustomDateEnd] = useState<string>('')

  const symbolOptions = useMemo(
    () => normalizeSymbols([...savedSymbols, ...trades.map((trade) => trade.symbol)]),
    [savedSymbols, trades],
  )

  const setupOptions = useMemo(
    () => normalizeSetups([...savedSetups, ...trades.map((trade) => trade.setup.trim())]),
    [savedSetups, trades],
  )

  const filteredTrades = useMemo(() => {
    return trades
      .filter((trade) => isTradeInRange(trade.date, timeFilterPreset, customDateStart, customDateEnd))
      .filter((trade) => (filterSymbol === 'ALL' ? true : trade.symbol === filterSymbol))
      .filter((trade) => (filterSetup === 'ALL' ? true : trade.setup === filterSetup))
      .filter((trade) => {
        if (filterOutcome === 'ALL') return true
        if (filterOutcome === 'WIN') return trade.pnl > 0
        return trade.pnl < 0
      })
  }, [trades, timeFilterPreset, customDateStart, customDateEnd, filterOutcome, filterSetup, filterSymbol])

  const stats = useMemo(() => getStats(filteredTrades), [filteredTrades])
  const chartData = useMemo(() => getChartData(filteredTrades), [filteredTrades])
  const insights = useMemo(() => getReviewInsights(filteredTrades), [filteredTrades])

  const updateForm = <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) => {
    if (formError) setFormError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const persistTrades = (nextTrades: Trade[]) => {
    setTrades(nextTrades)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrades))
  }

  const persistSymbols = (nextSymbols: string[]) => {
    const normalized = normalizeSymbols(nextSymbols)
    setSavedSymbols(normalized)
    localStorage.setItem(SYMBOLS_KEY, JSON.stringify(normalized))
  }

  const persistSetups = (nextSetups: string[]) => {
    const normalized = normalizeSetups(nextSetups)
    setSavedSetups(normalized)
    localStorage.setItem(SETUPS_KEY, JSON.stringify(normalized))
  }

  const resetForm = () => setForm(initialForm())

  const addTrade = (event: React.FormEvent<HTMLFormElement>, addAnother: boolean) => {
    event.preventDefault()

    const symbol = form.symbol.trim().toUpperCase()
    const setup = form.setup.trim()
    const session = form.session.trim()
    const marketCondition = form.marketCondition.trim()

    if (!form.date || !symbol || !setup || !session || !marketCondition || form.entry <= 0 || form.exit <= 0 || form.shares <= 0) {
      setFormError('Fill required fields: date, symbol, setup, prices, and share size.')
      return
    }

    if (form.durationMin < 0 || form.durationSec < 0 || form.durationSec > 59) {
      setFormError('Duration seconds must be between 0 and 59.')
      return
    }

    if (form.confidence < 1 || form.confidence > 5) {
      setFormError('Confidence must be between 1 and 5.')
      return
    }

    const newTrade = buildTradeFromForm(form)
    persistTrades([newTrade, ...trades])
    setFormError('')

    if (!symbolOptions.includes(symbol)) {
      persistSymbols([...symbolOptions, symbol])
    }

    if (!setupOptions.includes(setup)) {
      persistSetups([...setupOptions, setup])
    }

    if (addAnother) {
      setForm((prev) => ({
        ...initialForm(),
        date: prev.date,
        symbol,
        side: prev.side,
        setup,
        session: prev.session,
        marketCondition: prev.marketCondition,
      }))
      return
    }

    resetForm()
  }

  const duplicateLastTrade = () => {
    const lastTrade = trades[0]
    if (!lastTrade) {
      setFormError('No previous trade to duplicate yet.')
      return
    }

    setFormError('')
    setForm({
      date: lastTrade.date,
      symbol: lastTrade.symbol,
      side: lastTrade.side,
      setup: lastTrade.setup,
      session: lastTrade.session,
      marketCondition: lastTrade.marketCondition,
      entry: lastTrade.entry,
      exit: lastTrade.exit,
      shares: lastTrade.shares,
      fees: lastTrade.fees,
      pnlHigh: lastTrade.pnlHigh,
      pnlLow: lastTrade.pnlLow,
      durationMin: Math.floor(lastTrade.durationSec / 60),
      durationSec: lastTrade.durationSec % 60,
      confidence: lastTrade.confidence,
      notes: lastTrade.notes,
      ruleFollowed: lastTrade.ruleFollowed,
      setupWasValid: lastTrade.setupWasValid,
      waitedForConfirmation: lastTrade.waitedForConfirmation,
      riskWasDefined: lastTrade.riskWasDefined,
      followedPlan: lastTrade.followedPlan,
      brokeRules: lastTrade.brokeRules,
      emotionTags: [...lastTrade.emotionTags],
      mistakeTags: [...lastTrade.mistakeTags],
    })
  }

  const removeTrade = (id: string) => {
    persistTrades(trades.filter((trade) => trade.id !== id))
  }

  const updateTrade = (updatedTrade: Trade) => {
    const nextTrades = trades.map((trade) => (trade.id === updatedTrade.id ? updatedTrade : trade))
    persistTrades(nextTrades)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `trades-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadSampleData = () => {
    const shouldReplace = window.confirm('Load sample dataset? This will replace your current trade log.')
    if (!shouldReplace) return

    const seededTrades: Trade[] = SAMPLE_TRADES.map((item, index) => {
      const side: Side = toSide(item.side)
      const rawPnl = side === 'LONG' ? (item.exit - item.entry) * item.shares : (item.entry - item.exit) * item.shares
      const pnl = rawPnl - item.fees
      const costBasis = item.entry * item.shares

      return {
        id: crypto.randomUUID(),
        date: usDateToIso(item.date),
        symbol: item.symbol.trim().toUpperCase(),
        side,
        setup: item.setup,
        session: 'Open',
        marketCondition: 'Trending',
        entry: item.entry,
        exit: item.exit,
        shares: item.shares,
        fees: item.fees,
        pnlHigh: item.pnlHigh,
        pnlLow: item.pnlLow,
        durationSec: item.durationMin * 60,
        confidence: item.confidence,
        notes: '',
        ruleFollowed: true,
        setupWasValid: true,
        waitedForConfirmation: true,
        riskWasDefined: true,
        followedPlan: true,
        brokeRules: false,
        emotionTags: [],
        mistakeTags: [],
        pnl,
        returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
        createdAt: Date.now() + index,
      }
    })

    persistTrades(seededTrades)
    persistSymbols(seededTrades.map((trade) => trade.symbol))
    setFilterOutcome('ALL')
    setFilterSetup('ALL')
    setFilterSymbol('ALL')
    window.alert('Sample dataset imported successfully.')
  }

  const clearFilters = () => {
    setTimeFilterPreset('ALL_TIME')
    setCustomDateStart('')
    setCustomDateEnd('')
    setFilterSymbol('ALL')
    setFilterSetup('ALL')
    setFilterOutcome('ALL')
  }

  return (
    <>
      <div className="bg-layer" />
      <header className="topbar">
        <h1>Pulse Journal</h1>
        <p>Discretionary trader journal for execution, review, and edge refinement.</p>
      </header>

      <main className="layout">
        <TradeEntryPanel
          form={form}
          symbolOptions={symbolOptions}
          setupOptions={setupOptions}
          formError={formError}
          onUpdateForm={updateForm}
          onSubmit={addTrade}
          onReset={resetForm}
          onDuplicateLast={duplicateLastTrade}
          canDuplicate={trades.length > 0}
          onLoadSample={loadSampleData}
        />

        <section className="panel dashboard-shell">
          <DashboardPanel
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={stats}
            chartData={chartData}
            insights={insights}
            timeFilterPreset={timeFilterPreset}
            customDateStart={customDateStart}
            customDateEnd={customDateEnd}
            filterSymbol={filterSymbol}
            filterSetup={filterSetup}
            filterOutcome={filterOutcome}
            symbolOptions={symbolOptions}
            setupOptions={setupOptions}
            onTimeFilterPreset={setTimeFilterPreset}
            onCustomDateStart={setCustomDateStart}
            onCustomDateEnd={setCustomDateEnd}
            onFilterSymbol={setFilterSymbol}
            onFilterSetup={setFilterSetup}
            onFilterOutcome={setFilterOutcome}
            onClearFilters={clearFilters}
            onExportJson={exportJson}
          />

          <TradeHistoryTable trades={filteredTrades} onDeleteTrade={removeTrade} onUpdateTrade={updateTrade} />
        </section>
      </main>
    </>
  )
}

export default App
