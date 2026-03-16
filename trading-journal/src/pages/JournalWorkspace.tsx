import { useEffect, useMemo, useRef, useState } from 'react'
import TradeEntryPanel from '../components/TradeEntryPanel'
import DashboardPanel from '../components/DashboardPanel'
import TradeHistoryTable from '../components/TradeHistoryTable'
import { useJournalPersistence } from '../hooks/useJournalPersistence'
import { SAMPLE_TRADES } from '../data/sampleTrades'
import type { TimeFilterPreset, Trade, TradeFormData } from '../types'
import {
  buildSeedTradesFromSample,
  buildTradeFromForm,
  createFormFromTrade,
  buildEquityCurveData,
  filterTrades,
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
import { clearUserTradesFromCloud, loadUserTradesFromCloud, saveUserTradesToCloud } from '../lib/trades'
import { deleteCurrentAccount, updateUserPassword } from '../auth/session'
import { clearUserPreferencesCache, defaultUserPreferences, loadUserPreferences, saveUserPreferences, type UserPreferences } from '../lib/userPreferences'

type AppSection = 'dashboard' | 'log-trade' | 'trade-history'
type DashboardTool = 'account' | 'settings' | null

type JournalWorkspaceProps = {
  userId?: string
  userEmail?: string
  onSignOut?: () => Promise<void>
  initialSection?: AppSection
  initialTool?: DashboardTool
  showStandaloneHeader?: boolean
}

const NAV_ITEMS: Array<{ id: AppSection; label: string; shortLabel: string; description: string }> = [
  { id: 'dashboard', label: 'Performance', shortLabel: 'Perf', description: 'Review your edge quickly' },
  { id: 'log-trade', label: 'Log Trade', shortLabel: 'Log', description: 'Capture execution fast' },
  { id: 'trade-history', label: 'Trade History', shortLabel: 'Hist', description: 'Inspect and edit journal' },
]

const ACCENT_COLOR_STORAGE_KEY = 'ur-journ-accent-color'
const DEFAULT_ACCENT_COLOR = '#3a86a8'
const DELETE_COUNTDOWN_START = 9

const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value)

const darkenHex = (hex: string, percent: number) => {
  const cleanHex = hex.replace('#', '')
  const factor = Math.max(0, Math.min(1, 1 - percent / 100))
  const r = Math.round(parseInt(cleanHex.slice(0, 2), 16) * factor)
  const g = Math.round(parseInt(cleanHex.slice(2, 4), 16) * factor)
  const b = Math.round(parseInt(cleanHex.slice(4, 6), 16) * factor)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function JournalWorkspace({ userId, userEmail = '', onSignOut, initialSection = 'dashboard', initialTool = null, showStandaloneHeader = true }: JournalWorkspaceProps) {
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [importStatus, setImportStatus] = useState<string>('')
  const [importStatusTone, setImportStatusTone] = useState<'success' | 'error'>('success')
  const [settingsStatus, setSettingsStatus] = useState<string>('')
  const [settingsStatusTone, setSettingsStatusTone] = useState<'success' | 'error'>('success')
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences)
  const [favoriteSymbolInput, setFavoriteSymbolInput] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'clear-data' | 'delete-account' | null>(null)
  const [deleteCountdown, setDeleteCountdown] = useState(DELETE_COUNTDOWN_START)
  const [deleteSequenceActive, setDeleteSequenceActive] = useState(false)
  const csvInputRef = useRef<HTMLInputElement | null>(null)
  const deleteTimerRef = useRef<number | null>(null)
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

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearInterval(deleteTimerRef.current)
        deleteTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    void loadUserPreferences(userId)
      .then((nextPrefs) => {
        if (isCancelled) return
        setPreferences(nextPrefs)

        if (isHexColor(nextPrefs.accentColor)) {
          setAccentColor(nextPrefs.accentColor)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPreferences(defaultUserPreferences)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [userId])

  useEffect(() => {
    document.documentElement.dataset.themeMode = preferences.themeMode
  }, [preferences.themeMode])

  useEffect(() => {
    const nextPrefs: UserPreferences = {
      ...preferences,
      accentColor,
    }

    void saveUserPreferences(userId, nextPrefs)
  }, [accentColor, preferences, userId])

  const { persistTrades, persistSymbols, persistSetups, clearPersistedData } = useJournalPersistence({
    setTrades,
    setSavedSymbols,
    setSavedSetups,
    userId,
  })

  useEffect(() => {
    if (!userId) return

    let isCancelled = false

    void loadUserTradesFromCloud(userId)
      .then((cloudTrades) => {
        if (isCancelled) return
        if (cloudTrades.length === 0) {
          const localTrades = loadTrades()
          if (localTrades.length > 0) {
            void saveUserTradesToCloud(userId, localTrades).catch((error) => {
              console.warn('failed to seed cloud trades from local cache', error)
            })
          }
          return
        }

        setTrades(cloudTrades)
        setSavedSymbols(normalizeSymbols(cloudTrades.map((trade) => trade.symbol)))
        setSavedSetups(normalizeSetups(cloudTrades.map((trade) => trade.setup)))
      })
      .catch((error) => {
        console.warn('failed to load cloud trades, using local fallback', error)
      })

    return () => {
      isCancelled = true
    }
  }, [userId])

  const symbolOptions = useMemo(
    () => normalizeSymbols([...savedSymbols, ...trades.map((trade) => trade.symbol), ...preferences.tradingPreferences.favoriteSymbols]),
    [savedSymbols, trades, preferences.tradingPreferences.favoriteSymbols],
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
  const equityCurveData = useMemo(() => buildEquityCurveData(filteredTrades), [filteredTrades])

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

    let newTrade
    try {
      newTrade = buildTradeFromForm(form)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to calculate P&L for this trade.')
      return
    }

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
    clearPersistedData()
    persistTrades([])
    setSavedSymbols([])
    setSavedSetups([])
    setForm(initialForm())
    clearFilters()

    if (userId) {
      void clearUserTradesFromCloud(userId).catch((error) => {
        console.warn('failed to clear cloud trades', error)
      })
    }

    setSettingsStatusTone('success')
    setSettingsStatus('all trades were removed from your journal data.')
  }

  const closeToolModal = () => setActiveTool(null)

  const resetDeleteSequence = () => {
    if (deleteTimerRef.current !== null) {
      window.clearInterval(deleteTimerRef.current)
      deleteTimerRef.current = null
    }
    setDeleteSequenceActive(false)
    setDeleteCountdown(DELETE_COUNTDOWN_START)
  }

  const closeConfirmDialog = () => {
    resetDeleteSequence()
    setConfirmAction(null)
  }

  const updateTradingPref = (key: keyof UserPreferences['tradingPreferences'], value: string) => {
    setPreferences((prev) => ({
      ...prev,
      tradingPreferences: {
        ...prev.tradingPreferences,
        [key]: value,
      },
    }))
  }

  const updateThemeMode = (mode: UserPreferences['themeMode']) => {
    setPreferences((prev) => ({
      ...prev,
      themeMode: mode,
    }))
  }

  const updateSessionTracking = (key: keyof UserPreferences['sessionTracking']) => {
    setPreferences((prev) => ({
      ...prev,
      sessionTracking: {
        ...prev.sessionTracking,
        [key]: !prev.sessionTracking[key],
      },
    }))
  }

  const addFavoriteSymbol = () => {
    const next = favoriteSymbolInput.trim().toUpperCase()
    if (!next) return

    setPreferences((prev) => ({
      ...prev,
      tradingPreferences: {
        ...prev.tradingPreferences,
        favoriteSymbols: Array.from(new Set([...prev.tradingPreferences.favoriteSymbols, next])),
      },
    }))
    setFavoriteSymbolInput('')
  }

  const removeFavoriteSymbol = (symbol: string) => {
    setPreferences((prev) => ({
      ...prev,
      tradingPreferences: {
        ...prev.tradingPreferences,
        favoriteSymbols: prev.tradingPreferences.favoriteSymbols.filter((item) => item !== symbol),
      },
    }))
  }

  const handleResetAccent = () => {
    setAccentColor(DEFAULT_ACCENT_COLOR)
  }

  const handleRebuildAnalytics = () => {
    const nextTrades = [...trades].sort((a, b) => b.createdAt - a.createdAt)
    persistTrades(nextTrades)
    setSettingsStatusTone('success')
    setSettingsStatus('analytics were rebuilt from existing trade history.')
  }

  const handleDownloadFullBackup = () => {
    const payload = {
      userId: userId ?? 'local-user',
      exportedAt: new Date().toISOString(),
      trades,
      symbols: savedSymbols,
      setups: savedSetups,
      preferences,
      accentColor,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `urjourn-full-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      setSettingsStatusTone('error')
      setSettingsStatus('password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setSettingsStatusTone('error')
      setSettingsStatus('password confirmation does not match.')
      return
    }

    setIsSavingPassword(true)
    try {
      await updateUserPassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setSettingsStatusTone('success')
      setSettingsStatus('password updated successfully.')
    } catch (error) {
      setSettingsStatusTone('error')
      setSettingsStatus(error instanceof Error ? error.message : 'unable to change password.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    if (!onSignOut) return
    setIsSigningOut(true)
    try {
      await onSignOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      await deleteCurrentAccount()
      clearPersistedData()
      clearUserPreferencesCache(userId)
      localStorage.removeItem(ACCENT_COLOR_STORAGE_KEY)
      setPreferences(defaultUserPreferences)
      setAccentColor(DEFAULT_ACCENT_COLOR)
      setSettingsStatusTone('success')
      setSettingsStatus('account deleted.')
      if (onSignOut) {
        await onSignOut()
      }
    } catch (error) {
      setSettingsStatusTone('error')
      setSettingsStatus(error instanceof Error ? error.message : 'unable to delete account.')
    } finally {
      setIsDeletingAccount(false)
      closeConfirmDialog()
    }
  }

  const startDeleteSequence = () => {
    if (isDeletingAccount || deleteSequenceActive) return

    setDeleteSequenceActive(true)
    setDeleteCountdown(DELETE_COUNTDOWN_START)

    deleteTimerRef.current = window.setInterval(() => {
      setDeleteCountdown((previous) => {
        if (previous <= 1) {
          if (deleteTimerRef.current !== null) {
            window.clearInterval(deleteTimerRef.current)
            deleteTimerRef.current = null
          }
          setDeleteSequenceActive(false)
          void handleDeleteAccount()
          return 0
        }

        return previous - 1
      })
    }, 1000)
  }

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

      <main className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className="panel nav-shell">
          <div className="nav-shell-head">
            <h2>Workflow</h2>
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? '>' : '<'}
            </button>
          </div>
          <nav className="nav-list" aria-label="ur journ. sections">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-item-title">{isSidebarCollapsed ? item.shortLabel : item.label}</span>
                {!isSidebarCollapsed && <small className="nav-item-description">{item.description}</small>}
              </button>
            ))}
          </nav>
          <div className="secondary-nav-block">
            <p>Workspace tools</p>
            <div className="secondary-nav-buttons">
              <button
                type="button"
                className={`secondary-nav-btn ${activeTool === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTool((prev) => (prev === 'account' ? null : 'account'))}
              >
                {isSidebarCollapsed ? 'Acct' : 'Account'}
              </button>
              <button
                type="button"
                className={`secondary-nav-btn ${activeTool === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTool((prev) => (prev === 'settings' ? null : 'settings'))}
              >
                {isSidebarCollapsed ? 'Set' : 'Settings'}
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
                  equityCurveData={equityCurveData}
                  accentColor={accentColor}
                  timeFilterPreset={timeFilterPreset}
                  customDateStart={customDateStart}
                  customDateEnd={customDateEnd}
                  onTimeFilterPreset={setTimeFilterPreset}
                  onCustomDateStart={setCustomDateStart}
                  onCustomDateEnd={setCustomDateEnd}
                  onClearFilters={clearFilters}
                  onExportJson={exportJson}
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
                <h2>{activeTool === 'account' ? 'Account Settings' : 'Settings'}</h2>
                <p>{activeTool === 'account' ? 'Manage your personal account controls and security.' : 'Workspace controls and data management.'}</p>
              </div>
              <button type="button" className="tool-modal-close" onClick={closeToolModal} aria-label="Close modal">
                x
              </button>
            </header>

            {activeTool === 'account' && (
              <>
                <div className="settings-control-center">
                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>ACCOUNT</small>
                      <h5>identity and security</h5>
                      <p>Personal account controls for credentials and session access.</p>
                    </header>

                    <div className="settings-field-stack">
                      <label>
                        Email
                        <input type="text" value={userEmail || 'not signed in'} readOnly />
                      </label>
                    </div>

                    <div className="settings-grid-two">
                      <label>
                        new password
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="minimum 8 characters"
                        />
                      </label>
                      <label>
                        confirm password
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="repeat password"
                        />
                      </label>
                    </div>

                    <div className="settings-action-row">
                      <button type="button" className="btn ghost" disabled={isSavingPassword} onClick={() => void handlePasswordChange()}>
                        {isSavingPassword ? 'changing...' : 'change password'}
                      </button>
                      <button type="button" className="btn ghost" disabled={isSigningOut} onClick={() => void handleSignOut()}>
                        {isSigningOut ? 'signing out...' : 'sign out'}
                      </button>
                    </div>
                  </section>

                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>DANGER ZONE</small>
                      <h5>destructive actions</h5>
                      <p>These actions permanently clear data or remove your account.</p>
                    </header>

                    <div className="danger-zone">
                      <button type="button" className="btn ghost danger-action" onClick={() => setConfirmAction('clear-data')}>
                        clear all data
                      </button>
                      <button type="button" className="btn ghost danger-action" onClick={() => setConfirmAction('delete-account')}>
                        delete account
                      </button>
                    </div>
                  </section>
                </div>
                {settingsStatus && <p className={`import-feedback ${settingsStatusTone}`}>{settingsStatus}</p>}
              </>
            )}

            {activeTool === 'settings' && (
              <>
                <div className="settings-control-center">
                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>TRADING PREFERENCES</small>
                      <h5>save defaults for new trades.</h5>
                      <p>Stored to your user preferences with local fallback.</p>
                    </header>

                    <div className="settings-grid-two">
                      <label>
                        default account size
                        <input
                          type="number"
                          min="0"
                          value={preferences.tradingPreferences.accountSize}
                          onChange={(event) => updateTradingPref('accountSize', event.target.value)}
                        />
                      </label>
                      <label>
                        default risk per trade (%)
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={preferences.tradingPreferences.riskPerTradePct}
                          onChange={(event) => updateTradingPref('riskPerTradePct', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="settings-grid-two">
                      <label>
                        default r:r ratio
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={preferences.tradingPreferences.defaultRr}
                          onChange={(event) => updateTradingPref('defaultRr', event.target.value)}
                        />
                      </label>
                      <label>
                        preferred currency
                        <select
                          value={preferences.tradingPreferences.currency}
                          onChange={(event) => updateTradingPref('currency', event.target.value as UserPreferences['tradingPreferences']['currency'])}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </label>
                    </div>

                    <div className="settings-field-stack">
                      <label>
                        Favorite Symbols
                        <div className="symbol-tag-input-row">
                          <input
                            type="text"
                            value={favoriteSymbolInput}
                            onChange={(event) => setFavoriteSymbolInput(event.target.value.toUpperCase())}
                            placeholder="symbol"
                          />
                          <button type="button" className="btn ghost" onClick={addFavoriteSymbol}>
                            + add symbol
                          </button>
                        </div>
                      </label>
                      <div className="symbol-tag-list">
                        {preferences.tradingPreferences.favoriteSymbols.map((symbol) => (
                          <span key={symbol} className="symbol-tag">
                            {symbol}
                            <button type="button" className="symbol-tag-remove" onClick={() => removeFavoriteSymbol(symbol)} aria-label={`Remove ${symbol}`}>
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>JOURNAL DATA</small>
                      <h5>trade data</h5>
                      <p>{trades.length} stored trades. export, import, or reset your local trading journal data.</p>
                    </header>

                    <div className="settings-action-row">
                      <button type="button" className="btn ghost" onClick={exportJson}>
                        export json
                      </button>
                      <button type="button" className="btn ghost" onClick={handleOpenCsvPicker}>
                        import csv
                      </button>
                    </div>
                  </section>

                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>APPEARANCE</small>
                      <h5>customize the look of your workspace.</h5>
                      <p>Theme mode and accent color controls.</p>
                    </header>

                    <div className="settings-field-stack">
                      <p className="settings-inline-head">Theme Mode</p>
                      <div className="theme-mode-options">
                        <label>
                          <input type="radio" name="theme-mode" checked={preferences.themeMode === 'dark'} onChange={() => updateThemeMode('dark')} />
                          Dark
                        </label>
                        <label>
                          <input type="radio" name="theme-mode" checked={preferences.themeMode === 'light'} onChange={() => updateThemeMode('light')} />
                          Light
                        </label>
                        <label>
                          <input type="radio" name="theme-mode" checked={preferences.themeMode === 'auto'} onChange={() => updateThemeMode('auto')} />
                          Auto
                        </label>
                      </div>
                    </div>

                    <div className="settings-field-stack">
                      <p className="settings-inline-head">Accent Color</p>
                      <div className="accent-picker-row">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(event) => setAccentColor(event.target.value)}
                          aria-label="Accent color picker"
                        />
                        <span>{accentColor}</span>
                        <span className="accent-preview" style={{ backgroundColor: accentColor }} aria-hidden="true" />
                        <button type="button" className="btn ghost" onClick={handleResetAccent}>
                          reset
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="settings-block">
                    <header className="settings-block-head">
                      <small>ADVANCED</small>
                      <h5>power-user tools</h5>
                      <p>Use maintenance actions and enable session tracking dimensions.</p>
                    </header>

                    <div className="settings-action-row">
                      <button type="button" className="btn ghost" onClick={handleRebuildAnalytics}>
                        rebuild analytics
                      </button>
                      <button type="button" className="btn ghost" onClick={handleDownloadFullBackup}>
                        download full backup
                      </button>
                    </div>

                    <div className="settings-field-stack">
                      <p className="settings-inline-head">Session Tracking</p>
                      <label className="session-track-option">
                        <input type="checkbox" checked={preferences.sessionTracking.asia} onChange={() => updateSessionTracking('asia')} />
                        Asia Session
                      </label>
                      <label className="session-track-option">
                        <input type="checkbox" checked={preferences.sessionTracking.london} onChange={() => updateSessionTracking('london')} />
                        London Session
                      </label>
                      <label className="session-track-option">
                        <input type="checkbox" checked={preferences.sessionTracking.newYork} onChange={() => updateSessionTracking('newYork')} />
                        New York Session
                      </label>
                    </div>
                  </section>

                </div>
                <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden-file-input" onChange={handleImportNormalizedCsv} />
                {importStatus && <p className={`import-feedback ${importStatusTone}`}>{importStatus}</p>}
                {settingsStatus && <p className={`import-feedback ${settingsStatusTone}`}>{settingsStatus}</p>}
              </>
            )}
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="confirm-backdrop" onClick={closeConfirmDialog}>
          <section className="confirm-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h4>{confirmAction === 'clear-data' ? 'clear all data' : 'delete account'}</h4>

            {confirmAction === 'clear-data' ? (
              <>
                <p>Are you sure you want to delete all trades?</p>
                <div className="settings-action-row">
                  <button
                    type="button"
                    className="btn ghost danger-action"
                    onClick={() => {
                      clearAllData()
                      closeConfirmDialog()
                    }}
                  >
                    confirm
                  </button>
                  <button type="button" className="btn ghost" onClick={closeConfirmDialog}>
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="self-destruct-panel">
                <p>Press the self-destruct button once to confirm permanent account deletion.</p>

                <div className="self-destruct-base">
                  <button
                    type="button"
                    className={`self-destruct-button ${deleteSequenceActive ? 'pushed' : ''}`}
                    onClick={startDeleteSequence}
                    disabled={isDeletingAccount || deleteSequenceActive}
                  >
                    self-destruct
                  </button>
                </div>

                <div className="self-destruct-panel-status">
                  <span className={`self-destruct-timer ${deleteSequenceActive ? 'active' : ''}`}>
                    {deleteSequenceActive ? `00:0${deleteCountdown}` : 'standby'}
                  </span>
                  <span>{deleteSequenceActive ? 'deletion sequence armed' : 'awaiting manual trigger'}</span>
                </div>

                <div className="settings-action-row">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={resetDeleteSequence}
                    disabled={isDeletingAccount || !deleteSequenceActive}
                  >
                    abort
                  </button>
                  <button type="button" className="btn ghost" onClick={closeConfirmDialog} disabled={isDeletingAccount}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default JournalWorkspace
