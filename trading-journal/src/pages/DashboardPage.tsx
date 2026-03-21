import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDashboardData } from '../context/useDashboardData'
import { accountSafetySummary, avgR, bestSetup, sumPnl, topMistake, winRate } from '../domains/analytics/metrics'

type DashboardPageProps = {
  userId: string
  userEmail: string
  onSignOut: () => Promise<void>
}

const isWithinLastDays = (isoDate: string, days: number) => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  const value = new Date(`${isoDate}T00:00:00`)
  return value >= start && value <= end
}

function DashboardPage({ userEmail }: DashboardPageProps) {
  const { trades, accounts, loading } = useDashboardData()

  const metrics = useMemo(() => {
    const todayTrades = trades.filter((trade) => isWithinLastDays(trade.tradeDate, 1))
    const weekTrades = trades.filter((trade) => isWithinLastDays(trade.tradeDate, 7))
    const recentTrades = trades.slice(0, 6)
    const mistake = topMistake(trades)
    const setup = bestSetup(trades)
    const safety = accountSafetySummary(accounts)

    return {
      todayPnl: sumPnl(todayTrades),
      weekPnl: sumPnl(weekTrades),
      winRate: winRate(trades),
      avgR: avgR(trades),
      recentTrades,
      mistake,
      setup,
      safety,
    }
  }, [trades, accounts])

  if (loading) {
    return <main className="dashboard-page"><p className="empty-state">Loading your command center...</p></main>
  }

  return (
    <main className="dashboard-page">
      <section className="panel-shell">
        <h2>Personal Trading Command Center</h2>
        <p className="panel-subtitle">Signed in as {userEmail || 'trader'}.</p>
      </section>

      <section className="stats-grid three">
        <article className="metric-card">
          <p>Today's P&L</p>
          <h3 className={metrics.todayPnl >= 0 ? 'positive' : 'negative'}>${metrics.todayPnl.toFixed(2)}</h3>
        </article>
        <article className="metric-card">
          <p>This Week's P&L</p>
          <h3 className={metrics.weekPnl >= 0 ? 'positive' : 'negative'}>${metrics.weekPnl.toFixed(2)}</h3>
        </article>
        <article className="metric-card">
          <p>Win Rate / Avg R</p>
          <h3>{metrics.winRate.toFixed(1)}% / {metrics.avgR.toFixed(2)}R</h3>
        </article>
      </section>

      <section className="stats-grid two">
        <article className="panel-shell compact-panel">
          <h3>Execution Signals</h3>
          <ul className="list-grid">
            <li>
              <span>Top Mistake Category</span>
              <strong>{metrics.mistake?.tag ?? 'None logged'}</strong>
            </li>
            <li>
              <span>Best Setup</span>
              <strong>{metrics.setup?.setup ?? 'Need more samples'}</strong>
            </li>
            <li>
              <span>Setup Expectancy</span>
              <strong>{metrics.setup ? `$${metrics.setup.expectancy.toFixed(2)}` : '--'}</strong>
            </li>
          </ul>
        </article>
        <article className="panel-shell compact-panel">
          <h3>Account Safety</h3>
          {metrics.safety ? (
            <ul className="list-grid">
              <li>
                <span>Active Account</span>
                <strong>{metrics.safety.accountName}</strong>
              </li>
              <li>
                <span>Distance to Drawdown</span>
                <strong>${metrics.safety.distanceToDrawdown.toFixed(2)}</strong>
              </li>
              <li>
                <span>Payout Progress</span>
                <strong>{metrics.safety.payoutEligibilityProgress.toFixed(1)}%</strong>
              </li>
              <li>
                <span>Mode</span>
                <strong className={metrics.safety.mode === 'DEFENSIVE' ? 'negative' : 'positive'}>{metrics.safety.mode}</strong>
              </li>
            </ul>
          ) : (
            <p className="empty-state">No prop account tracked yet.</p>
          )}
        </article>
      </section>

      <section className="panel-shell">
        <div className="panel-row">
          <h3>Recent Trades</h3>
          <Link className="btn primary" to="/app/journal">Log New Trade</Link>
        </div>
        {metrics.recentTrades.length === 0 ? (
          <p className="empty-state">No trades saved yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Market</th>
                  <th>Account</th>
                  <th>Setup</th>
                  <th>P&L</th>
                  <th>R</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.tradeDate}</td>
                    <td>{trade.market}</td>
                    <td>{trade.account}</td>
                    <td>{trade.setupType}</td>
                    <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>${trade.pnl.toFixed(2)}</td>
                    <td>{trade.rMultiple.toFixed(2)}R</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
