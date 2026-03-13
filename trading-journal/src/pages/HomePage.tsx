import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const WELCOME_TITLE = 'ur journ.'
const TITLE_TYPED_ONCE_KEY = 'urjourn-home-title-typed'

const getTypeDurationMs = (text: string) => {
  const perChar = 95
  const minDuration = 850
  const maxDuration = 2200
  return Math.min(maxDuration, Math.max(minDuration, text.length * perChar))
}

function HomePage() {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [hideCursorAfterTyping, setHideCursorAfterTyping] = useState(false)

  const typeDurationMs = useMemo(() => getTypeDurationMs(WELCOME_TITLE), [])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const hasPlayed = sessionStorage.getItem(TITLE_TYPED_ONCE_KEY) === '1'

    if (reduceMotion || hasPlayed) {
      setShouldAnimate(false)
      setHideCursorAfterTyping(true)
      return
    }

    setShouldAnimate(true)
    sessionStorage.setItem(TITLE_TYPED_ONCE_KEY, '1')

    const cursorHideTimer = window.setTimeout(() => {
      setHideCursorAfterTyping(true)
    }, typeDurationMs + 900)

    return () => window.clearTimeout(cursorHideTimer)
  }, [typeDurationMs])

  return (
    <main className="public-shell">
      <section className="public-card">
        <h1
          className={`welcome-hero-title ${shouldAnimate ? 'is-typing' : ''} ${hideCursorAfterTyping ? 'cursor-fade' : ''}`}
          style={{
            ['--typewriter-steps' as string]: String(WELCOME_TITLE.length),
            ['--typewriter-duration' as string]: `${typeDurationMs}ms`,
          }}
        >
          <span className="welcome-hero-title-text" aria-label={WELCOME_TITLE}>
            {WELCOME_TITLE}
          </span>
        </h1>
        <p>Focused journaling workspace for discretionary traders.</p>
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
