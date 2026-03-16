import { useMemo, useState } from 'react'
import type { TimeFilterPreset, Trade, TradeStats } from '../types'
import type { EquityCurvePoint } from '../utils/equityCurve'
import { formatDate, formatMoney } from '../utils/tradeUtils'
import EquityCurveChart from './EquityCurveChart'

type DashboardPanelProps = {
  stats: TradeStats
  equityCurveData: EquityCurvePoint[]
  accentColor: string
  timeFilterPreset: TimeFilterPreset
  customDateStart: string
  customDateEnd: string
  onTimeFilterPreset: (value: TimeFilterPreset) => void
  onCustomDateStart: (value: string) => void
  onCustomDateEnd: (value: string) => void
  onClearFilters: () => void
  onExportJson: () => void
  onLogTrade: () => void
  recentTrades: Trade[]
}

function DashboardPanel({
  stats,
  equityCurveData,
  accentColor,
  timeFilterPreset,
  customDateStart,
  customDateEnd,
  onTimeFilterPreset,
  onCustomDateStart,
  onCustomDateEnd,
  onClearFilters,
  onExportJson,
  onLogTrade,
  recentTrades,
}: DashboardPanelProps) {
  const [showInsights, setShowInsights] = useState(false)

  const timeOptions: Array<{ label: string; value: TimeFilterPreset }> = [
    { label: 'Today', value: 'TODAY' },
    { label: 'Week', value: 'THIS_WEEK' },
    { label: 'Month', value: 'THIS_MONTH' },
    { label: 'All', value: 'ALL_TIME' },
    { label: 'Custom', value: 'CUSTOM' },
  ]

  const tradesForTable = recentTrades.slice(0, 8)
  const avgTrade = stats.totalTrades > 0 ? stats.netPnl / stats.totalTrades : 0

  const insightSnapshot = useMemo(() => {
    if (recentTrades.length === 0) return null

    const sessions = recentTrades.reduce<Record<string, { wins: number; trades: number }>>((acc, trade) => {
      const key = trade.session?.trim() || 'Unassigned'
      if (!acc[key]) acc[key] = { wins: 0, trades: 0 }
      acc[key].trades += 1
      if (trade.netPnl > 0) acc[key].wins += 1
      return acc
    }, {})

    const setups = recentTrades.reduce<Record<string, { wins: number; trades: number }>>((acc, trade) => {
      const key = trade.setup?.trim() || 'Unspecified'
      if (!acc[key]) acc[key] = { wins: 0, trades: 0 }
      acc[key].trades += 1
      if (trade.netPnl > 0) acc[key].wins += 1
      return acc
    }, {})

    const rankedSessions = Object.entries(sessions)
      .map(([name, value]) => ({
        name,
        trades: value.trades,
        winRate: value.trades > 0 ? (value.wins / value.trades) * 100 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.trades - a.trades)

    const rankedSetups = Object.entries(setups)
      .map(([name, value]) => ({
        name,
        trades: value.trades,
        winRate: value.trades > 0 ? (value.wins / value.trades) * 100 : 0,
      }))
      .sort((a, b) => a.winRate - b.winRate || b.trades - a.trades)

    return {
      bestSession: rankedSessions[0] ?? null,
      worstSetup: rankedSetups[0] ?? null,
    }
  }, [recentTrades])

  return (
    <section className="dashboard-panel trader-dashboard minimalist-dashboard">
      <div className="dashboard-topbar">
        <div>
          <h2>Dashboard</h2>
          <p className="dashboard-subtitle">Trader-focused performance and behavior review.</p>
        </div>
        <div className="dashboard-topbar-controls">
          <div className="time-filter-chips">
            {timeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`time-chip ${timeFilterPreset === option.value ? 'active' : ''}`}
                onClick={() => onTimeFilterPreset(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {timeFilterPreset === 'CUSTOM' && (
            <div className="custom-range-row">
              <label>
                From
                <input type="date" value={customDateStart} onChange={(e) => onCustomDateStart(e.target.value)} />
              </label>
              <label>
                To
                <input type="date" value={customDateEnd} onChange={(e) => onCustomDateEnd(e.target.value)} />
              </label>
            </div>
          )}
          <div className="dashboard-topbar-actions">
            <button type="button" className="btn ghost" onClick={onClearFilters}>
              Reset
            </button>
            <button type="button" className="btn ghost" onClick={onExportJson}>
              Export
            </button>
            <button type="button" className="btn primary" onClick={onLogTrade}>
              Log Trade
            </button>
          </div>
        </div>
      </div>

      <div className="primary-metrics-grid">
        <article className="primary-metric-card">
          <p className="metric-label">Net P&L</p>
          <h3 className={`metric-value ${stats.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>{formatMoney(stats.netPnl)}</h3>
        </article>
        <article className="primary-metric-card">
          <p className="metric-label">Win Rate</p>
          <h3 className="metric-value">{stats.winRate.toFixed(1)}%</h3>
        </article>
        <article className="primary-metric-card">
          <p className="metric-label">Profit Factor</p>
          <h3 className="metric-value">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'Infinity'}</h3>
        </article>
        <article className="primary-metric-card">
          <p className="metric-label">Avg. Trade</p>
          <h3 className={`metric-value ${avgTrade >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>{formatMoney(avgTrade)}</h3>
        </article>
        <article className="primary-metric-card">
          <p className="metric-label">Total Trades</p>
          <h3 className="metric-value">{stats.totalTrades}</h3>
        </article>
      </div>

      <div className="dashboard-main-grid">
        <section className="minimal-section large-chart-card">
          <div className="chart-insights-row">
            <h4>Equity Curve</h4>
            <button type="button" className={`mini-insights-btn ${showInsights ? 'active' : ''}`} onClick={() => setShowInsights((prev) => !prev)}>
              current insights
            </button>
          </div>
          <EquityCurveChart data={equityCurveData} accentColor={accentColor} />

          <div className="trade-extremes-row">
            <article className="trade-extreme-card">
              <small>Best Win</small>
              <strong className="pnl-positive">{stats.bestTrade > 0 ? formatMoney(stats.bestTrade) : '--'}</strong>
            </article>
            <article className="trade-extreme-card">
              <small>Worst Loss</small>
              <strong className="pnl-negative">{stats.worstTrade < 0 ? formatMoney(stats.worstTrade) : '--'}</strong>
            </article>
          </div>

          {showInsights && insightSnapshot && (
            <section className="current-insights-panel" aria-live="polite">
              <article>
                <small>You perform best during</small>
                <h5>{insightSnapshot.bestSession?.name ?? '--'}</h5>
                <p>Win rate: {(insightSnapshot.bestSession?.winRate ?? 0).toFixed(0)}%</p>
              </article>
              <article>
                <small>Worst setup</small>
                <h5>{insightSnapshot.worstSetup?.name ?? '--'}</h5>
                <p>Win rate: {(insightSnapshot.worstSetup?.winRate ?? 0).toFixed(0)}%</p>
              </article>
            </section>
          )}
        </section>
      </div>

      <section className="minimal-section recent-trades-card">
        <h4>Recent Trades</h4>
        {tradesForTable.length > 0 ? (
          <div className="table-wrap recent-table-wrap">
            <table className="trade-log-table recent-trades-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Symbol</th>
                  <th>Setup</th>
                  <th>Session</th>
                  <th>P&L</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {tradesForTable.map((trade) => (
                  <tr key={trade.id}>
                    <td>{formatDate(trade.tradeDate)}</td>
                    <td>{trade.symbol}</td>
                    <td>{trade.setup}</td>
                    <td>{trade.session}</td>
                    <td className={trade.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.netPnl)}</td>
                    <td>{trade.confidence}/5</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-copy">No recent trades yet.</p>
        )}
      </section>
    </section>
  )
}

export default DashboardPanel
