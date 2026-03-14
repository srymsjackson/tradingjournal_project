import { useEffect, useMemo, useRef, useState } from 'react'
import TradeEntryPanel from '../components/TradeEntryPanel'
import DashboardPanel from '../components/DashboardPanel'
import TradeHistoryTable from '../components/TradeHistoryTable'
import { useJournalPersistence } from '../hooks/useJournalPersistence'
import { SAMPLE_TRADES } from '../data/sampleTrades'
import { SETUP_PLAYBOOK } from '../data/setupPlaybook'
import type { TimeFilterPreset, Trade, TradeFormData } from '../types'
import {
  buildSeedTradesFromSample,
  buildTradeFromForm,
  createFormFromTrade,
  filterTrades,
  getChartData,
  getStats,
  initialForm,
  loadSetups,
  loadSymbols,
  loadTrades,
  normalizeSetups,
  normalizeSymbols,
} from '../utils/tradeUtils'
import { validateTradeForm } from '../utils/tradeValidation'
import { parseNormalizedTradeCsvFile } from '../utils/parseNormalizedTradeCsv'

type AppSection = 'dashboard' | 'log-trade' | 'trade-history'
type DashboardTool = 'playbook' | 'settings' | null

type JournalWorkspaceProps = {
  initialSection?: AppSection
  initialTool?: DashboardTool
  showStandaloneHeader?: boolean
}

const NAV_ITEMS: Array<{ id: AppSection; label: string; description: string }> = [
  { id: 'dashboard', label: 'Performance', description: 'Review your edge quickly' },
  { id: 'log-trade', label: 'Log Trade', description: 'Capture execution fast' },
  { id: 'trade-history', label: 'Trade History', description: 'Inspect and edit journal' },
]

const ACCENT_COLOR_STORAGE_KEY = 'ur-journ-accent-color'
const DEFAULT_ACCENT_COLOR = '#22ab6f'

const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

const darkenHex = (hex: string, percent: number) => {
  const cleanHex = hex.replace('#', '')
  const factor = Math.max(0, Math.min(1, 1 - percent / 100))
  const r = Math.round(parseInt(cleanHex.slice(0, 2), 16) * factor)
  const g = Math.round(parseInt(cleanHex.slice(2, 4), 16) * factor)
  const b = Math.round(parseInt(cleanHex.slice(4, 6), 16) * factor)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function JournalWorkspace({ initialSection = 'dashboard', initialTool = null, showStandaloneHeader = true }: JournalWorkspaceProps) {
  const [trades, setTrades] = useState<Trade[]>(() => loadTrades())
  const [savedSymbols, setSavedSymbols] = useState<string[]>(() => loadSymbols())
  const [savedSetups, setSavedSetups] = useState<string[]>(() => loadSetups())
  const [form, setForm] = useState<TradeFormData>(() => initialForm())
  const [formError, setFormError] = useState<string>('')
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL')
  const [filterSetup, setFilterSetup] = useState<string>('ALL')
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL')
  const [timeFilterPreset, setTimeFilterPreset] = useState<TimeFilterPreset>('ALL_TIME')
  const [customDateStart, setCustomDateStart] = useState<string>('')
  const [customDateEnd, setCustomDateEnd] = useState<string>('')
  const [activeSection, setActiveSection] = useState<AppSection>(initialSection)
  const [activeTool, setActiveTool] = useState<DashboardTool>(initialTool)
  const [importStatus, setImportStatus] = useState<string>('')
  const [importStatusTone, setImportStatusTone] = useState<'success' | 'error'>('success')
  const csvInputRef = useRef<HTMLInputElement | null>(null)
  const [accentColor, setAccentColor] = useState<string>(() => {
    const stored = localStorage.getItem(ACCENT_COLOR_STORAGE_KEY)
    return stored && isHexColor(stored) ? stored : DEFAULT_ACCENT_COLOR
  })

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', accentColor)
    root.style.setProperty('--positive', accentColor)
    root.style.setProperty('--accent-strong', darkenHex(accentColor, 10))
    localStorage.setItem(ACCENT_COLOR_STORAGE_KEY, accentColor)
  }, [accentColor])

  const { persistTrades, persistSymbols, persistSetups, clearPersistedData } = useJournalPersistence({
    setTrades,
    setSavedSymbols,
    setSavedSetups,
  })

  const symbolOptions = useMemo(
    () => normalizeSymbols([...savedSymbols, ...trades.map((trade) => trade.symbol)]),
    [savedSymbols, trades],
  )

  const setupOptions = useMemo(
    () => normalizeSetups([...savedSetups, ...trades.map((trade) => trade.setup.trim())]),
    [savedSetups, trades],
  )

  const filteredTrades = useMemo(
    () =>
      filterTrades(trades, {
        timeFilterPreset,
        customDateStart,
        customDateEnd,
        filterSymbol,
        filterSetup,
        filterOutcome,
      }),
    [trades, timeFilterPreset, customDateStart, customDateEnd, filterOutcome, filterSetup, filterSymbol],
  )

  const stats = useMemo(() => getStats(filteredTrades), [filteredTrades])
  const chartData = useMemo(() => getChartData(filteredTrades), [filteredTrades])

  const updateForm = <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) => {
    if (formError) setFormError('')
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => setForm(initialForm())

  const addTrade = (event: React.FormEvent<HTMLFormElement>, addAnother: boolean) => {
    event.preventDefault()

    const validation = validateTradeForm(form)
    if (!validation.isValid) {
      setFormError(validation.error)
      return
    }

    const { symbol, setup } = validation.normalized

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
    setForm(createFormFromTrade(lastTrade))
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

    const seededTrades = buildSeedTradesFromSample(SAMPLE_TRADES)

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

  const clearAllData = () => {
    const shouldClear = window.confirm('Clear all journal data? This will remove saved trades and saved quick options.')
    if (!shouldClear) return

    clearPersistedData()
    setTrades([])
    setSavedSymbols([])
    setSavedSetups([])
    setForm(initialForm())
    clearFilters()
  }

  const closeToolModal = () => setActiveTool(null)

  const handleOpenCsvPicker = () => {
    setImportStatus('')
    setImportStatusTone('success')
    csvInputRef.current?.click()
  }

  const handleImportNormalizedCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { trades: importedTrades, skippedRows } = await parseNormalizedTradeCsvFile(file)

      if (importedTrades.length === 0) {
        setImportStatusTone('error')
        setImportStatus('no valid rows imported. check required columns and values.')
        event.target.value = ''
        return
      }

      persistTrades([...importedTrades, ...trades])
      persistSymbols([...savedSymbols, ...importedTrades.map((trade) => trade.symbol)])
      persistSetups([...savedSetups, ...importedTrades.map((trade) => trade.setup)])

      setImportStatus(
        skippedRows > 0
          ? `${importedTrades.length} trades imported. ${skippedRows} rows skipped.`
          : `${importedTrades.length} trades imported successfully.`,
      )
      setImportStatusTone('success')
    } catch {
      setImportStatusTone('error')
      setImportStatus('import failed. csv must include: date,symbol,side,entry,exit,shares,pnl,setup,session')
    }

    event.target.value = ''
  }

  return (
    <>
      {showStandaloneHeader && <div className="bg-layer" />}
      {showStandaloneHeader && (
        <header className="topbar">
          <h1>ur journ.</h1>
          <p>Discretionary trader journal for execution, review, and edge refinement.</p>
        </header>
      )}

      <main className="app-shell">
        <aside className="panel nav-shell">
          <h2>Workflow</h2>
          <nav className="nav-list" aria-label="ur journ. sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            ))}
          </nav>
          <div className="secondary-nav-block">
            <p>Workspace tools</p>
            <div className="secondary-nav-buttons">
              <button
                type="button"
                className={`secondary-nav-btn ${activeTool === 'playbook' ? 'active' : ''}`}
                onClick={() => setActiveTool((prev) => (prev === 'playbook' ? null : 'playbook'))}
              >
                Playbook
              </button>
              <button
                type="button"
                className={`secondary-nav-btn ${activeTool === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTool((prev) => (prev === 'settings' ? null : 'settings'))}
              >
                Settings
              </button>
            </div>
          </div>
        </aside>

        <section className="content-shell">
          {activeSection === 'dashboard' && (
            <>
              <section className="dashboard-shell">
                <DashboardPanel
                  stats={stats}
                  chartData={chartData}
                  accentColor={accentColor}
                  timeFilterPreset={timeFilterPreset}
                  customDateStart={customDateStart}
                  customDateEnd={customDateEnd}
                  onTimeFilterPreset={setTimeFilterPreset}
                  onCustomDateStart={setCustomDateStart}
                  onCustomDateEnd={setCustomDateEnd}
                  onClearFilters={clearFilters}
                  onLogTrade={() => setActiveSection('log-trade')}
                  recentTrades={filteredTrades}
                />
              </section>
            </>
          )}

          {activeSection === 'log-trade' && (
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
          )}

          {activeSection === 'trade-history' && (
            <section className="panel dashboard-shell">
              <TradeHistoryTable trades={trades} onDeleteTrade={removeTrade} onUpdateTrade={updateTrade} />
            </section>
          )}
        </section>
      </main>

      {activeTool && (
        <div className="tool-modal-backdrop" onClick={closeToolModal}>
          <section className="tool-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header className="tool-modal-head">
              <div>
                <h2>{activeTool === 'playbook' ? 'Playbook' : 'Settings'}</h2>
                <p>{activeTool === 'playbook' ? 'Reference your repeatable setup framework.' : 'Workspace controls and data management.'}</p>
              </div>
              <button type="button" className="tool-modal-close" onClick={closeToolModal} aria-label="Close modal">
                x
              </button>
            </header>

            {activeTool === 'playbook' && (
              <div className="weekly-review-grid">
                {SETUP_PLAYBOOK.map((setup) => (
                  <article key={setup.id} className="weekly-review-card">
                    <small>{setup.name}</small>
                    <h5>{setup.description}</h5>
                    <p>Entry: {setup.entryCriteria}</p>
                    <p>Invalidation: {setup.invalidationCriteria}</p>
                  </article>
                ))}
              </div>
            )}

            {activeTool === 'settings' && (
              <>
                <div className="settings-grid">
                  <article className="weekly-review-card">
                    <small>Trade Data</small>
                    <h5>{trades.length} stored trades</h5>
                    <p>Export, reset, and manage your local journal data.</p>
                  </article>
                  <article className="weekly-review-card">
                    <small>Theme Accent</small>
                    <h5>Accent Color</h5>
                    <p>Updates all green-highlighted UI elements.</p>
                    <div className="accent-picker-row">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(event) => setAccentColor(event.target.value)}
                        aria-label="Accent color picker"
                      />
                      <span>{accentColor}</span>
                      <button type="button" className="btn ghost" onClick={() => setAccentColor(DEFAULT_ACCENT_COLOR)}>
                        reset
                      </button>
                    </div>
                  </article>
                </div>
                <div className="actions">
                  <button type="button" className="btn ghost" onClick={exportJson}>
                    Export JSON
                  </button>
                  <button type="button" className="btn ghost" onClick={handleOpenCsvPicker}>
                    import csv
                  </button>
                  <button type="button" className="btn ghost" onClick={clearAllData}>
                    Clear All Data
                  </button>
                </div>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden-file-input" onChange={handleImportNormalizedCsv} />
                {importStatus && <p className={`import-feedback ${importStatusTone}`}>{importStatus}</p>}
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default JournalWorkspace
