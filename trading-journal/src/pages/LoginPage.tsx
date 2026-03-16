import { Link, useNavigate } from 'react-router-dom'
import BackgroundScene from '../components/BackgroundScene'
import { useState } from 'react'

type LoginPageProps = {
  onLogin: (email: string, password: string) => Promise<void>
}

function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    setIsSubmitting(true)

    try {
      await onLogin(email, password)
      navigate('/app/dashboard', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log in.'
      setAuthError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="public-shell">
      <BackgroundScene />
      <section className="public-card auth-card">
        <h1>Log In</h1>
        <p>Placeholder authentication screen for routing flow.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {authError && <p className="form-error">{authError}</p>}
          <label>
            Email
            <input type="email" placeholder="trader@desk.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit" className="btn primary" disabled={isSubmitting}>
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
