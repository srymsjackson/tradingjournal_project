import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartDataSet, ReviewInsights, TimeFilterPreset, Trade, TradeStats, WeeklyReview } from '../types'
import { CHART_COLORS, formatDate, formatMoney, tooltipMoneyFormatter } from '../utils/tradeUtils'

type DashboardPanelProps = {
  stats: TradeStats
  chartData: ChartDataSet
  insights: ReviewInsights
  weeklyReview: WeeklyReview
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
  chartData,
  insights,
  weeklyReview,
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

  const bestSetup = weeklyReview.bestSetup?.name || chartData.setupPnl[0]?.setup || 'N/A'
  const strongestSession = weeklyReview.strongestSession?.name || chartData.sessionPerformance[0]?.session || 'N/A'
  const biggestMistake = weeklyReview.mostCommonMistake?.tag || chartData.mistakeFrequency[0]?.tag || 'No repeated mistake'
  const coachingNotes = [...insights.coachingNotes, ...weeklyReview.insightBlocks].filter(Boolean).slice(0, 5)
  const tradesForTable = recentTrades.slice(0, 8)

  return (
    <section className="panel dashboard-panel trader-dashboard">
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
        <article className="chart-card large-chart-card">
          <h4>Equity Curve</h4>
          {chartData.pnlTrend.length > 0 ? (
            <div className="chart-shell large">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.pnlTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Line type="monotone" dataKey="cumulativePnl" stroke="#2f8f68" strokeWidth={3} dot={false} name="Cumulative P&L" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-copy">Log trades to render the equity curve.</p>
          )}
        </article>

        <div className="insight-card-grid">
          <article className="insight-card">
            <p className="metric-label">Best Setup</p>
            <h4>{bestSetup}</h4>
            <small>{weeklyReview.bestSetup ? formatMoney(weeklyReview.bestSetup.netPnl) : 'No setup data yet'}</small>
          </article>
          <article className="insight-card">
            <p className="metric-label">Strongest Session</p>
            <h4>{strongestSession}</h4>
            <small>{weeklyReview.strongestSession ? formatMoney(weeklyReview.strongestSession.netPnl) : 'No session data yet'}</small>
          </article>
          <article className="insight-card">
            <p className="metric-label">Biggest Mistake</p>
            <h4>{biggestMistake}</h4>
            <small>{weeklyReview.mostCommonMistake ? `${weeklyReview.mostCommonMistake.count} tagged trades` : 'No recurring mistake yet'}</small>
          </article>
          <article className="insight-card">
            <p className="metric-label">Discipline Score</p>
            <h4>{insights.disciplineScore.toFixed(1)}%</h4>
            <small>{insights.currentStreak.count} {insights.currentStreak.direction} streak</small>
          </article>
        </div>
      </div>

      <div className="dashboard-row-grid">
        <article className="chart-card">
          <h4>Performance by Setup</h4>
          {chartData.setupPnl.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.setupPnl}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="setup" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Bar dataKey="netPnl" name="Net P&L">
                    {chartData.setupPnl.map((entry, index) => (
                      <Cell key={entry.setup} fill={entry.netPnl >= 0 ? '#2f8f68' : CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-copy">No setup performance data available.</p>
          )}
        </article>

        <article className="chart-card">
          <h4>Performance by Session</h4>
          {chartData.sessionPerformance.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.sessionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Bar dataKey="netPnl" name="Net P&L">
                    {chartData.sessionPerformance.map((entry, index) => (
                      <Cell key={entry.session} fill={entry.netPnl >= 0 ? '#2f8f68' : CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-copy">No session performance data available.</p>
          )}
        </article>
      </div>

      <div className="dashboard-row-grid">
        <article className="chart-card">
          <h4>Mistake Breakdown</h4>
          {chartData.mistakeFrequency.length > 0 ? (
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.mistakeFrequency} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="tag" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${Number(value)} trades`} />
                  <Bar dataKey="count" fill="#ba6158" name="Tagged Trades" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="empty-copy">Tag mistakes in trades to unlock this view.</p>
          )}
        </article>

        <article className="chart-card notes-card">
          <h4>Coaching Notes</h4>
          {coachingNotes.length > 0 ? (
            <ul className="notes-list">
              {coachingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">No coaching notes yet.</p>
          )}
        </article>
      </div>

      <article className="chart-card recent-trades-card">
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
      </article>
    </section>
  )
}

export default DashboardPanel
