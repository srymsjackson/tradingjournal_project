import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BackgroundScene from '../components/BackgroundScene'

type SignupPageProps = {
  onSignup: (email: string, password: string) => Promise<boolean>
}

function SignupPage({ onSignup }: SignupPageProps) {
  const RATE_LIMIT_COOLDOWN_SECONDS = 60
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = window.setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [cooldownSeconds])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

    if (cooldownSeconds > 0) {
      setAuthError(`Please wait ${cooldownSeconds}s before trying again.`)
      return
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const hasSession = await onSignup(email, password)
      navigate(hasSession ? '/app/dashboard' : '/login', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign up.'
      setAuthError(message)

      if (/rate limit|too many requests|too many auth attempts|over_email_send_rate_limit/i.test(message)) {
        setCooldownSeconds(RATE_LIMIT_COOLDOWN_SECONDS)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="public-shell">
      <BackgroundScene />
      <section className="public-card auth-card">
        <h1>Sign Up</h1>
        <p>Placeholder registration screen for routing flow.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {authError && <p className="form-error">{authError}</p>}
          {cooldownSeconds > 0 && <p className="field-hint">Retry available in {cooldownSeconds}s.</p>}
          <label>
            Email
            <input type="email" placeholder="trader@desk.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn primary" disabled={isSubmitting || cooldownSeconds > 0}>
            {cooldownSeconds > 0 ? `wait ${cooldownSeconds}s` : 'Create Account'}
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
