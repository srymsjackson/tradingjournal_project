import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
  const [performanceLens, setPerformanceLens] = useState<'SESSION' | 'DAY' | 'SIDE'>('SESSION')
  const [behaviorLens, setBehaviorLens] = useState<'EMOTION' | 'MISTAKE'>('EMOTION')

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

  const bestSession = chartData.sessionPerformance.slice().sort((a, b) => b.netPnl - a.netPnl)[0]
  const weakestSession = chartData.sessionPerformance.slice().sort((a, b) => a.netPnl - b.netPnl)[0]
  const followedRules = chartData.rulePerformance.find((item) => item.bucket === 'Followed')
  const brokeRules = chartData.rulePerformance.find((item) => item.bucket === 'Broken')

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

      <div className="session-summary-panel">
        <h4>Session Performance Snapshot</h4>
        {chartData.sessionPerformance.length > 0 ? (
          <div className="session-summary-grid">
            <article>
              <p>Best Session</p>
              <h5>{bestSession?.session || 'N/A'}</h5>
              <small className={(bestSession?.netPnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(bestSession?.netPnl || 0)}</small>
            </article>
            <article>
              <p>Weakest Session</p>
              <h5>{weakestSession?.session || 'N/A'}</h5>
              <small className={(weakestSession?.netPnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(weakestSession?.netPnl || 0)}</small>
            </article>
          </div>
        ) : (
          <p className="empty-copy">Log trades across sessions to identify where your edge is strongest.</p>
        )}
      </div>

      <div className="session-summary-panel">
        <h4>Discipline Edge Snapshot</h4>
        {chartData.rulePerformance.length > 0 ? (
          <div className="session-summary-grid">
            <article>
              <p>Rule-Followed Trades</p>
              <h5>{followedRules?.trades || 0} trades</h5>
              <small className={(followedRules?.netPnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(followedRules?.netPnl || 0)}</small>
            </article>
            <article>
              <p>Rule-Broken Trades</p>
              <h5>{brokeRules?.trades || 0} trades</h5>
              <small className={(brokeRules?.netPnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(brokeRules?.netPnl || 0)}</small>
            </article>
          </div>
        ) : (
          <p className="empty-copy">Tag rule behavior in trades to measure discipline edge.</p>
        )}
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
                      <Line type="monotone" dataKey="cumulativePnl" stroke="#0d7a52" strokeWidth={3} dot={false} name="Cumulative P&L" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="empty-copy">Add trades to render chart data.</p>
              )}
            </article>
            <article className="chart-card">
              <h4>P&amp;L by Setup</h4>
              {chartData.setupPnl.length > 0 ? (
                <div className="chart-shell">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.setupPnl}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="setup" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={tooltipMoneyFormatter} />
                      <Legend />
                      <Bar dataKey="netPnl" name="Net P&L">
                        {chartData.setupPnl.map((entry, index) => (
                          <Cell key={entry.setup} fill={entry.netPnl >= 0 ? '#118f5f' : CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
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
        </>
      )}

      {activeTab === 'distribution' && (
        <div className="chart-grid">
          <article className="chart-card">
            <div className="chart-title-row">
              <h4>Performance Context</h4>
              <div className="mini-toggle">
                <button type="button" className={`mini-toggle-btn ${performanceLens === 'SESSION' ? 'active' : ''}`} onClick={() => setPerformanceLens('SESSION')}>
                  Session
                </button>
                <button type="button" className={`mini-toggle-btn ${performanceLens === 'DAY' ? 'active' : ''}`} onClick={() => setPerformanceLens('DAY')}>
                  Day
                </button>
                <button type="button" className={`mini-toggle-btn ${performanceLens === 'SIDE' ? 'active' : ''}`} onClick={() => setPerformanceLens('SIDE')}>
                  Side
                </button>
              </div>
            </div>
            {(performanceLens === 'SESSION' && chartData.sessionPerformance.length > 0) ||
            (performanceLens === 'DAY' && chartData.dayOfWeekPerformance.length > 0) ||
            (performanceLens === 'SIDE' && chartData.sideWinRate.length > 0) ? (
              <div className="chart-shell">
                <ResponsiveContainer width="100%" height="100%">
                  {performanceLens === 'SESSION' ? (
                    <BarChart data={chartData.sessionPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={tooltipMoneyFormatter} />
                      <Legend />
                      <Bar dataKey="netPnl" name="Net P&L">
                        {chartData.sessionPerformance.map((entry, index) => (
                          <Cell key={entry.session} fill={entry.netPnl >= 0 ? '#118f5f' : CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : performanceLens === 'DAY' ? (
                    <BarChart data={chartData.dayOfWeekPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={tooltipMoneyFormatter} />
                      <Legend />
                      <Bar dataKey="netPnl" name="Net P&L">
                        {chartData.dayOfWeekPerformance.map((entry, index) => (
                          <Cell key={entry.day} fill={entry.netPnl >= 0 ? '#118f5f' : CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={chartData.sideWinRate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="side" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                      <Legend />
                      <Bar dataKey="winRate" fill="#0d7a52" name="Win Rate" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-copy">Add trades to render session, day, and side performance views.</p>
            )}
          </article>
          <article className="chart-card">
            <h4>Rule-Followed vs Rule-Broken</h4>
            {chartData.rulePerformance.length > 0 ? (
              <div className="chart-shell">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.rulePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip formatter={tooltipMoneyFormatter} />
                    <Legend />
                    <Bar dataKey="netPnl" name="Net P&L">
                      {chartData.rulePerformance.map((entry) => (
                        <Cell key={entry.bucket} fill={entry.bucket === 'Followed' ? '#118f5f' : '#bc3a2e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-copy">Tag discipline fields to unlock rule-performance analysis.</p>
            )}
          </article>
        </div>
      )}

      {activeTab === 'trend' && (
        <div className="chart-grid single">
          <article className="chart-card">
            <h4>Cumulative Equity Curve (Detailed)</h4>
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
        <div className="chart-grid">
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
            <div className="chart-title-row">
              <h4>Behavior Patterns</h4>
              <div className="mini-toggle">
                <button type="button" className={`mini-toggle-btn ${behaviorLens === 'EMOTION' ? 'active' : ''}`} onClick={() => setBehaviorLens('EMOTION')}>
                  Emotions
                </button>
                <button type="button" className={`mini-toggle-btn ${behaviorLens === 'MISTAKE' ? 'active' : ''}`} onClick={() => setBehaviorLens('MISTAKE')}>
                  Mistakes
                </button>
              </div>
            </div>
            {(behaviorLens === 'EMOTION' && chartData.emotionFrequency.length > 0) || (behaviorLens === 'MISTAKE' && chartData.mistakeFrequency.length > 0) ? (
              <div className="chart-shell large">
                <ResponsiveContainer width="100%" height="100%">
                  {behaviorLens === 'EMOTION' ? (
                    <BarChart data={chartData.emotionFrequency} layout="vertical" margin={{ left: 12, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="tag" width={95} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${Number(value)} trades`} />
                      <Legend />
                      <Bar dataKey="count" fill="#0d7a52" name="Tagged Trades" />
                    </BarChart>
                  ) : (
                    <BarChart data={chartData.mistakeFrequency} layout="vertical" margin={{ left: 12, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="tag" width={95} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${Number(value)} trades`} />
                      <Legend />
                      <Bar dataKey="count" fill="#bc3a2e" name="Tagged Trades" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-copy">Add tags to trades to reveal emotional and mistake patterns.</p>
            )}
          </article>
        </div>
      )}
    </section>
  )
}

export default DashboardPanel
