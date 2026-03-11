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
import type { ChartDataSet, DashboardTab, ReviewInsights, TimeFilterPreset, TradeStats } from '../types'
import { CHART_COLORS, formatDuration, formatMoney, tooltipMoneyFormatter } from '../utils/tradeUtils'

type DashboardPanelProps = {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  stats: TradeStats
  chartData: ChartDataSet
  insights: ReviewInsights
  timeFilterPreset: TimeFilterPreset
  customDateStart: string
  customDateEnd: string
  filterSymbol: string
  filterOutcome: 'ALL' | 'WIN' | 'LOSS'
  filterSetup: string
  symbolOptions: string[]
  setupOptions: string[]
  onTimeFilterPreset: (value: TimeFilterPreset) => void
  onCustomDateStart: (value: string) => void
  onCustomDateEnd: (value: string) => void
  onFilterSymbol: (value: string) => void
  onFilterOutcome: (value: 'ALL' | 'WIN' | 'LOSS') => void
  onFilterSetup: (value: string) => void
  onClearFilters: () => void
  onExportJson: () => void
}

function DashboardPanel({
  activeTab,
  onTabChange,
  stats,
  chartData,
  insights,
  timeFilterPreset,
  customDateStart,
  customDateEnd,
  filterSymbol,
  filterOutcome,
  filterSetup,
  symbolOptions,
  setupOptions,
  onTimeFilterPreset,
  onCustomDateStart,
  onCustomDateEnd,
  onFilterSymbol,
  onFilterOutcome,
  onFilterSetup,
  onClearFilters,
  onExportJson,
}: DashboardPanelProps) {
  const timeOptions: Array<{ label: string; value: TimeFilterPreset }> = [
    { label: 'Today', value: 'TODAY' },
    { label: 'This Week', value: 'THIS_WEEK' },
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'All Time', value: 'ALL_TIME' },
    { label: 'Custom Range', value: 'CUSTOM' },
  ]

  const pnlDays = chartData.pnlTrend
  const latestDay = pnlDays[pnlDays.length - 1]
  const previousDay = pnlDays[pnlDays.length - 2]
  const dayOverDayPnl = latestDay && previousDay ? latestDay.netPnl - previousDay.netPnl : null

  const netPnlContext = latestDay
    ? `Latest session ${formatMoney(latestDay.netPnl)}${dayOverDayPnl === null ? '' : ` · ${dayOverDayPnl >= 0 ? '+' : ''}${formatMoney(dayOverDayPnl)} vs prior day`}`
    : 'Add trades to unlock daily trend context.'

  const winRateContext =
    stats.totalTrades > 0
      ? `${stats.winRate >= 50 ? 'Above' : 'Below'} 50% baseline · ${stats.totalTrades} trades logged`
      : 'No closed trades yet.'

  const profitFactorContext =
    stats.totalTrades > 0
      ? Number.isFinite(stats.profitFactor)
        ? `${stats.profitFactor >= 1.5 ? 'Healthy' : 'Needs work'} edge quality`
        : 'No losses yet in current filter'
      : 'Waiting for first sample set.'

  const tradeCountContext =
    latestDay && latestDay.tradeCount > 0
      ? `${latestDay.tradeCount} trade${latestDay.tradeCount === 1 ? '' : 's'} in latest session`
      : 'Track consistency with more sessions.'

  const winnerLoserRatio = stats.avgLoser !== 0 ? Math.abs(stats.avgWinner / stats.avgLoser) : 0
  const avgWinnerContext =
    stats.totalTrades > 0
      ? `${winnerLoserRatio > 0 ? `${winnerLoserRatio.toFixed(2)}R` : '0.00R'} versus average loser`
      : 'Need winners and losers to compare.'

  const avgLoserContext =
    stats.totalTrades > 0
      ? `${Math.abs(stats.avgLoser) <= stats.avgWinner ? 'Risk controlled' : 'Losses outweigh winners'}`
      : 'Risk profile appears here.'

  const bestTradeContext =
    stats.totalTrades > 0 ? `${stats.bestTrade >= 0 ? 'Top upside captured' : 'No positive outlier yet'}` : 'Best day highlight pending.'

  const worstTradeContext =
    stats.totalTrades > 0
      ? `${Math.abs(stats.worstTrade) <= Math.max(stats.bestTrade, 1) ? 'Drawdown contained' : 'Review outlier loss'}`
      : 'Drawdown watch appears here.'

  return (
    <section className="panel dashboard-panel">
      <div className="dashboard-head">
        <div>
          <h2>Performance Dashboard</h2>
          <p className="dashboard-subtitle">Review what is working, then tighten what is leaking.</p>
        </div>
        <button className="export-download-btn" onClick={onExportJson} aria-label="Export trades as JSON">
          <svg className="export-svg-icon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
          </svg>
          <span className="export-icon-rail" />
          <span className="export-tooltip">Download JSON</span>
        </button>
      </div>

      <div className="time-filter-bar" role="group" aria-label="Time range filter">
        <p className="time-filter-label">Time Range</p>
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
      </div>

      <div className="filter-bar">
        <label>
          Symbol
          <select value={filterSymbol} onChange={(e) => onFilterSymbol(e.target.value)}>
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
          <select value={filterSetup} onChange={(e) => onFilterSetup(e.target.value)}>
            <option value="ALL">All Setups</option>
            {setupOptions.map((setup) => (
              <option key={setup} value={setup}>
                {setup}
              </option>
            ))}
          </select>
        </label>
        <label>
          Outcome
          <select value={filterOutcome} onChange={(e) => onFilterOutcome(e.target.value as 'ALL' | 'WIN' | 'LOSS')}>
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Winners</option>
            <option value="LOSS">Losers</option>
          </select>
        </label>
        <button type="button" className="btn ghost" onClick={onClearFilters}>
          Reset Filters
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Dashboard views">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'overview'} onClick={() => onTabChange('overview')}>
          Overview
        </button>
        <button className={`tab-btn ${activeTab === 'distribution' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'distribution'} onClick={() => onTabChange('distribution')}>
          Distribution
        </button>
        <button className={`tab-btn ${activeTab === 'trend' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'trend'} onClick={() => onTabChange('trend')}>
          Trend
        </button>
        <button className={`tab-btn ${activeTab === 'symbols' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'symbols'} onClick={() => onTabChange('symbols')}>
          Symbols
        </button>
      </div>

      <div className="review-strip">
        <article className="review-card">
          <p>Expectancy / Trade</p>
          <h3 className={insights.expectancy >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(insights.expectancy)}</h3>
        </article>
        <article className="review-card">
          <p>Discipline Score</p>
          <h3>{insights.disciplineScore.toFixed(1)}%</h3>
        </article>
        <article className="review-card">
          <p>Current Streak</p>
          <h3>
            {insights.currentStreak.count} {insights.currentStreak.direction}
          </h3>
        </article>
        <article className="review-card">
          <p>Avg Hold Time</p>
          <h3>{formatDuration(insights.avgDurationSec)}</h3>
        </article>
      </div>

      <div className="coach-panel">
        <h4>Coaching Notes</h4>
        <ul>
          {insights.coachingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="stat-grid performance-grid">
            <article className="stat-card stat-card-hero">
              <p className="stat-label">Net P&amp;L</p>
              <h3 className={`stat-value ${stats.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>{formatMoney(stats.netPnl)}</h3>
              <p className="stat-context">{netPnlContext}</p>
            </article>
            <article className="stat-card stat-card-priority">
              <p className="stat-label">Win Rate</p>
              <h3 className="stat-value">{stats.winRate.toFixed(1)}%</h3>
              <p className="stat-context">{winRateContext}</p>
            </article>
            <article className="stat-card stat-card-priority">
              <p className="stat-label">Profit Factor</p>
              <h3 className="stat-value">{Number.isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'Infinity'}</h3>
              <p className="stat-context">{profitFactorContext}</p>
            </article>
            <article className="stat-card stat-card-priority">
              <p className="stat-label">Total Trades</p>
              <h3 className="stat-value">{stats.totalTrades}</h3>
              <p className="stat-context">{tradeCountContext}</p>
            </article>

            <article className="stat-card">
              <p className="stat-label">Avg Winner</p>
              <h3 className="stat-value">{formatMoney(stats.avgWinner)}</h3>
              <p className="stat-context">{avgWinnerContext}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Avg Loser</p>
              <h3 className="stat-value">{formatMoney(stats.avgLoser)}</h3>
              <p className="stat-context">{avgLoserContext}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Best Trade</p>
              <h3 className="stat-value">{formatMoney(stats.bestTrade)}</h3>
              <p className="stat-context">{bestTradeContext}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Worst Trade</p>
              <h3 className="stat-value">{formatMoney(stats.worstTrade)}</h3>
              <p className="stat-context">{worstTradeContext}</p>
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
          <article className="chart-card">
            <h4>Top Setups</h4>
            {insights.setupPerformance.length > 0 ? (
              <div className="setup-list">
                {insights.setupPerformance.map((item) => (
                  <div key={item.setup} className="setup-item">
                    <p>{item.setup}</p>
                    <p className={item.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(item.netPnl)}</p>
                    <small>{item.trades} trades • {item.winRate.toFixed(1)}% win</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-copy">Add trades to render setup performance.</p>
            )}
          </article>
        </div>
      )}
    </section>
  )
}

export default DashboardPanel
