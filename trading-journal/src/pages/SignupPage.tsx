import { Link, useNavigate } from 'react-router-dom'

type SignupPageProps = {
  onSignup: () => void
}

function SignupPage({ onSignup }: SignupPageProps) {
  const navigate = useNavigate()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSignup()
    navigate('/app/dashboard', { replace: true })
  }

  return (
    <main className="public-shell">
      <section className="public-card auth-card">
        <h1>Sign Up</h1>
        <p>Placeholder registration screen for routing flow.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input type="text" placeholder="Trader" required />
          </label>
          <label>
            Email
            <input type="email" placeholder="trader@desk.com" required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create password" required />
          </label>
          <button type="submit" className="btn primary">
            Create Account
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  )
}

export default SignupPage
