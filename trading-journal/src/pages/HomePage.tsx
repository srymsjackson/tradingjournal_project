import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="public-shell home-shell">
      <section className="public-card home-hero">
        <h1>ur journ.</h1>
        <p>Simple trade journaling, built for daily use.</p>
        <div className="public-actions">
          <Link className="btn primary" to="/login">
            Log In
          </Link>
          <Link className="btn ghost" to="/signup">
            Sign Up
          </Link>
        </div>
      </section>

      <section className="home-section-grid" aria-label="platform highlights">
        <article className="home-feature-card">
          <h3>log fast</h3>
          <p>Capture entries, exits, setup, and notes in one short flow designed for repetition.</p>
        </article>
        <article className="home-feature-card">
          <h3>see the trend</h3>
          <p>Track your equity progression over time and spot consistency or drawdown phases quickly.</p>
        </article>
        <article className="home-feature-card">
          <h3>review cleanly</h3>
          <p>Use history and filters to focus on setups, sessions, and outcomes without dashboard clutter.</p>
        </article>
      </section>

      <section className="home-band" aria-label="workflow overview">
        <h2>your daily loop</h2>
        <div className="home-loop-grid">
          <article>
            <small>01</small>
            <h4>journal trades</h4>
            <p>Record execution details right after each session.</p>
          </article>
          <article>
            <small>02</small>
            <h4>review metrics</h4>
            <p>Check pnl, win rate, and equity behavior in one place.</p>
          </article>
          <article>
            <small>03</small>
            <h4>refine process</h4>
            <p>Adjust setups and habits based on actual performance data.</p>
          </article>
        </div>
      </section>

      <section className="home-footer-callout" aria-label="start now">
        <h3>ready to start logging?</h3>
        <p>Create an account and keep your trade journal consistent across sessions.</p>
        <div className="public-actions">
          <Link className="btn primary" to="/signup">
            create account
          </Link>
          <Link className="btn ghost" to="/login">
            i already have one
          </Link>
        </div>
      </section>
    </main>
  )
}

export default HomePage
