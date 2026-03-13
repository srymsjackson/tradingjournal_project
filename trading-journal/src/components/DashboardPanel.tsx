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
  const timeOptions: Array<{ label: string; value: TimeFilterPreset }> = [
    { label: 'Today', value: 'TODAY' },
    { label: 'Week', value: 'THIS_WEEK' },
    { label: 'Month', value: 'THIS_MONTH' },
    { label: 'All', value: 'ALL_TIME' },
    { label: 'Custom', value: 'CUSTOM' },
  ]

  const tradesForTable = recentTrades.slice(0, 8)

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
          <p className="metric-label">Total Trades</p>
          <h3 className="metric-value">{stats.totalTrades}</h3>
        </article>
      </div>

      <div className="dashboard-main-grid">
        <section className="minimal-section large-chart-card">
          <h4>Equity Curve</h4>
          <EquityCurveChart data={equityCurveData} accentColor={accentColor} />
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
                    <td>{formatDate(trade.date)}</td>
                    <td>{trade.symbol}</td>
                    <td>{trade.setup}</td>
                    <td>{trade.session}</td>
                    <td className={trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(trade.pnl)}</td>
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
