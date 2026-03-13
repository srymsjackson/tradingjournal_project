import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

type SignupPageProps = {
  onSignup: (email: string, password: string) => Promise<boolean>
}

function SignupPage({ onSignup }: SignupPageProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')

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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="public-shell">
      <section className="public-card auth-card">
        <h1>Sign Up</h1>
        <p>Placeholder registration screen for routing flow.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {authError && <p className="form-error">{authError}</p>}
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
          <button type="submit" className="btn primary" disabled={isSubmitting}>
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
