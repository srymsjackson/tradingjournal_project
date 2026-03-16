import { Link } from 'react-router-dom'
import './Hero.css'

export default function Hero() {
  return (
    <header className="hj-hero">
      <div className="hj-hero-inner">
        <div className="hj-hero-copy">
          <h1 className="hj-hero-title">A focus-first trading journal for serious traders</h1>
          <p className="hj-hero-lead">
            Capture trades quickly. Learn faster from clean analytics. Keep your edge with calm, deliberate tools built for traders.
          </p>
          <div className="hj-hero-ctas">
            <Link className="btn primary large" to="/signup" aria-label="Create account">
              Create account
            </Link>
          </div>
        </div>

        <aside className="hj-hero-panel" aria-hidden>
          <div className="hj-stats">
            <div className="stat">
              <div className="stat-value">+12.8%</div>
              <div className="stat-label">Monthly edge</div>
            </div>
            <div className="stat">
              <div className="stat-value">324</div>
              <div className="stat-label">Trades logged</div>
            </div>
            <div className="stat">
              <div className="stat-value">0.8</div>
              <div className="stat-label">Avg R</div>
            </div>
          </div>
        </aside>
      </div>
    </header>
  )
}
