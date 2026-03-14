import { Link, useNavigate } from 'react-router-dom'

type LoginPageProps = {
  onLogin: () => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin()
    navigate('/app/dashboard', { replace: true })
  }

  return (
    <main className="public-shell">
      <section className="public-card auth-card">
        <h1>Log In</h1>
        <p>Pick up where you left off.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" placeholder="trader@desk.com" required />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn primary">
            Continue
          </button>
        </form>
        <p className="auth-footer">
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  )
}

export default LoginPage
