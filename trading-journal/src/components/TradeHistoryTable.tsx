import { useMemo, useState } from 'react'
import type { Trade } from '../types'
import { formatDate, formatDuration, formatMoney } from '../utils/tradeUtils'
import TradeDetailDrawer from './TradeDetailDrawer'

type TradeHistoryTableProps = {
  trades: Trade[]
  onDeleteTrade: (id: string) => void
  onUpdateTrade: (trade: Trade) => void
}

type SortKey = 'date' | 'symbol' | 'side' | 'setup' | 'shares' | 'pnl' | 'durationSec' | 'confidence'

function TradeHistoryTable({ trades, onDeleteTrade, onUpdateTrade }: TradeHistoryTableProps) {
  const [symbolFilter, setSymbolFilter] = useState<string>('ALL')
  const [setupFilter, setSetupFilter] = useState<string>('ALL')
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL')
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false)

  const symbolOptions = useMemo(
    () => Array.from(new Set(trades.map((trade) => trade.symbol.trim().toUpperCase()).filter(Boolean))).sort(),
    [trades],
  )

  const setupOptions = useMemo(() => Array.from(new Set(trades.map((trade) => trade.setup.trim()).filter(Boolean))).sort(), [trades])

  const visibleTrades = useMemo(() => {
    const filtered = trades
      .filter((trade) => (symbolFilter === 'ALL' ? true : trade.symbol === symbolFilter))
      .filter((trade) => (setupFilter === 'ALL' ? true : trade.setup === setupFilter))
      .filter((trade) => (sideFilter === 'ALL' ? true : trade.side === sideFilter))
      .filter((trade) => {
        if (outcomeFilter === 'ALL') return true
        if (outcomeFilter === 'WIN') return trade.pnl > 0
        return trade.pnl < 0
      })

    const sorted = filtered.slice().sort((a, b) => {
      if (sortKey === 'date') {
        const left = new Date(a.date).getTime() || 0
        const right = new Date(b.date).getTime() || 0
        if (left === right) return a.createdAt - b.createdAt
        return left - right
      }

      if (sortKey === 'symbol' || sortKey === 'side' || sortKey === 'setup') {
        const left = String(a[sortKey])
        const right = String(b[sortKey])
        return left.localeCompare(right)
      }

      const left = Number(a[sortKey] || 0)
      const right = Number(b[sortKey] || 0)
      return left - right
    })

    return sortDirection === 'asc' ? sorted : sorted.reverse()
  }, [trades, symbolFilter, setupFilter, sideFilter, outcomeFilter, sortKey, sortDirection])

  const selectedTrade = useMemo(() => trades.find((trade) => trade.id === selectedTradeId) ?? null, [trades, selectedTradeId])

  const setSorting = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextKey)
    setSortDirection(nextKey === 'date' ? 'desc' : 'asc')
  }

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const notesPreview = (notes: string) => {
    const trimmed = notes.trim()
    if (!trimmed) return 'No notes'
    return trimmed.length > 52 ? `${trimmed.slice(0, 52)}...` : trimmed
  }

  const getTags = (trade: Trade) => {
    const tags = [...trade.emotionTags, ...trade.mistakeTags].filter((tag) => tag && tag !== 'None')
    return tags.slice(0, 4)
  }

  const clearLocalFilters = () => {
    setSymbolFilter('ALL')
    setSetupFilter('ALL')
    setSideFilter('ALL')
    setOutcomeFilter('ALL')
  }

  return (
    <>
      <h3 className="table-title">Trade Log</h3>

      <div className="trade-log-toolbar">
        <label>
          Symbol
          <select value={symbolFilter} onChange={(e) => setSymbolFilter(e.target.value)}>
            <option value="ALL">All Symbols</option>
            {symbolOptions.map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
        </label>
        <label>
          Setup
          <select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
            <option value="ALL">All Setups</option>
            {setupOptions.map((setup) => (
              <option key={setup} value={setup}>
                {setup}
              </option>
            ))}
          </select>
        </label>
        <label>
          Side
          <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value as 'ALL' | 'LONG' | 'SHORT')}>
            <option value="ALL">All Sides</option>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
        </label>
        <label>
          Outcome
          <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value as 'ALL' | 'WIN' | 'LOSS')}>
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Winners</option>
            <option value="LOSS">Losers</option>
          </select>
        </label>
        <button type="button" className="btn ghost" onClick={clearLocalFilters}>
          Reset Trade Log Filters
        </button>
      </div>

      <div className="table-wrap">
        <table className="trade-log-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('date')}>
                  Date <span>{sortIndicator('date')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('symbol')}>
                  Symbol <span>{sortIndicator('symbol')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('side')}>
                  Side <span>{sortIndicator('side')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('setup')}>
                  Setup <span>{sortIndicator('setup')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('shares')}>
                  Qty <span>{sortIndicator('shares')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('pnl')}>
                  Net P&amp;L <span>{sortIndicator('pnl')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('durationSec')}>
                  Duration <span>{sortIndicator('durationSec')}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-btn" onClick={() => setSorting('confidence')}>
                  Confidence <span>{sortIndicator('confidence')}</span>
                </button>
              </th>
              <th>Tags</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrades.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={11}>No trades match current filters.</td>
              </tr>
            ) : (
              visibleTrades.map((trade) => {
                const tags = getTags(trade)
                const confidenceClass = trade.confidence >= 4 ? 'confidence-high' : trade.confidence >= 3 ? 'confidence-mid' : 'confidence-low'

                return (
                  <tr
                    key={trade.id}
                    className={`trade-row ${selectedTradeId === trade.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedTradeId(trade.id)
                      setIsReviewOpen(true)
                    }}
                  >
                    <td>{formatDate(trade.date)}</td>
                    <td>
                      <span className="symbol-pill">{trade.symbol}</span>
                    </td>
                    <td>
                      <span className={`side-pill ${trade.side === 'LONG' ? 'long' : 'short'}`}>{trade.side}</span>
                    </td>
                    <td>
                      <span className="setup-pill">{trade.setup}</span>
                    </td>
                    <td>{trade.shares}</td>
                    <td className={trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.pnl)}</td>
                    <td>{formatDuration(trade.durationSec)}</td>
                    <td>
                      <span className={`confidence-pill ${confidenceClass}`}>{trade.confidence}/5</span>
                    </td>
                    <td>
                      <div className="tag-wrap">
                        {tags.length > 0 ? (
                          tags.map((tag) => (
                            <span key={`${trade.id}-${tag}`} className="tag-pill">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="tag-empty">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="notes-preview">{notesPreview(trade.notes)}</td>
                    <td>
                      <button
                        className="icon-btn"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteTrade(trade.id)
                        }}
                      >
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
      <p className="table-footnote">Click any row to open the trade review drawer.</p>

      <TradeDetailDrawer
        isOpen={isReviewOpen && Boolean(selectedTrade)}
        trade={selectedTrade}
        onClose={() => setIsReviewOpen(false)}
        onSave={onUpdateTrade}
      />
    </>
  )
}

export default TradeHistoryTable
