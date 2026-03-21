import { useMemo } from 'react'
import { useDashboardData } from '../context/useDashboardData'
import { avgR, pnlByDayOfWeek, pnlByMarket, pnlBySession, ruleComparison, topMistake, winRate } from '../domains/analytics/metrics'

function AnalyticsPage() {
  const { trades, loading } = useDashboardData()

  const data = useMemo(() => {
    const byMarket = pnlByMarket(trades)
    const bySession = pnlBySession(trades)
    const byDay = pnlByDayOfWeek(trades)
    const rules = ruleComparison(trades)
    const mistake = topMistake(trades)

    const setupBuckets = trades.reduce<Record<string, { trades: number; wins: number; pnl: number; rTotal: number }>>((acc, trade) => {
      const key = trade.setupType || 'Unknown'
      if (!acc[key]) acc[key] = { trades: 0, wins: 0, pnl: 0, rTotal: 0 }
      acc[key].trades += 1
      acc[key].wins += trade.pnl > 0 ? 1 : 0
      acc[key].pnl += trade.pnl
      acc[key].rTotal += trade.rMultiple
      return acc
    }, {})

    const setupStats = Object.entries(setupBuckets)
      .map(([setup, value]) => ({
        setup,
        trades: value.trades,
        winRate: value.trades > 0 ? (value.wins / value.trades) * 100 : 0,
        expectancy: value.pnl / Math.max(1, value.trades),
        avgR: value.rTotal / Math.max(1, value.trades),
      }))
      .sort((a, b) => b.expectancy - a.expectancy)

    return { byMarket, bySession, byDay, rules, mistake, setupStats }
  }, [trades])

  if (loading) {
    return <main className="dashboard-page"><p className="empty-state">Loading analytics...</p></main>
  }

  return (
    <main className="dashboard-page analytics-page">
      <section className="panel-shell">
        <h2>Analytics</h2>
        <p className="panel-subtitle">Edge discovery and habit cost from your saved trades.</p>
      </section>

      <section className="stats-grid three">
        <article className="metric-card">
          <p>Overall Win Rate</p>
          <h3>{winRate(trades).toFixed(1)}%</h3>
        </article>
        <article className="metric-card">
          <p>Average R</p>
          <h3>{avgR(trades).toFixed(2)}R</h3>
        </article>
        <article className="metric-card">
          <p>Top Mistake Cost</p>
          <h3>{data.mistake ? `$${data.mistake.cost.toFixed(2)}` : '$0.00'}</h3>
        </article>
      </section>

      <section className="panel-shell">
        <h3>Win Rate and Expectancy by Setup</h3>
        <div className="table-wrap">
          <table className="grid-table">
            <thead>
              <tr>
                <th>Setup</th>
                <th>Trades</th>
                <th>Win Rate</th>
                <th>Expectancy</th>
                <th>Avg R</th>
              </tr>
            </thead>
            <tbody>
              {data.setupStats.map((row) => (
                <tr key={row.setup}>
                  <td>{row.setup}</td>
                  <td>{row.trades}</td>
                  <td>{row.winRate.toFixed(1)}%</td>
                  <td>${row.expectancy.toFixed(2)}</td>
                  <td>{row.avgR.toFixed(2)}R</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stats-grid two">
        <article className="panel-shell compact-panel">
          <h3>P&L by Session</h3>
          <ul className="list-grid">
            {data.bySession.map((row) => (
              <li key={row.session}>
                <span>{row.session}</span>
                <strong className={row.pnl >= 0 ? 'positive' : 'negative'}>${row.pnl.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-shell compact-panel">
          <h3>P&L by Day</h3>
          <ul className="list-grid">
            {data.byDay.map((row) => (
              <li key={row.day}>
                <span>{row.day}</span>
                <strong className={row.pnl >= 0 ? 'positive' : 'negative'}>${row.pnl.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="stats-grid two">
        <article className="panel-shell compact-panel">
          <h3>P&L by Market</h3>
          <ul className="list-grid">
            {data.byMarket.map((row) => (
              <li key={row.market}>
                <span>{row.market}</span>
                <strong className={row.pnl >= 0 ? 'positive' : 'negative'}>${row.pnl.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-shell compact-panel">
          <h3>Rule Followed vs Broken</h3>
          <ul className="list-grid">
            <li>
              <span>Followed</span>
              <strong className={data.rules.followed.pnl >= 0 ? 'positive' : 'negative'}>${data.rules.followed.pnl.toFixed(2)}</strong>
            </li>
            <li>
              <span>Broken</span>
              <strong className={data.rules.broken.pnl >= 0 ? 'positive' : 'negative'}>${data.rules.broken.pnl.toFixed(2)}</strong>
            </li>
            <li>
              <span>Win Rate Gap</span>
              <strong>{(data.rules.followed.winRate - data.rules.broken.winRate).toFixed(1)}%</strong>
            </li>
          </ul>
        </article>
      </section>
    </main>
  )
}

export default AnalyticsPage
