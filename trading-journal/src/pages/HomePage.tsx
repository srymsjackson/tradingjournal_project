import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="public-shell">
      <section className="public-card">
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
    </main>
  )
}

export default HomePage
