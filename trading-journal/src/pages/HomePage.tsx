import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackgroundScene from '../components/BackgroundScene'
import Hero from '../components/Hero'
import '../components/Hero.css'

const WELCOME_TITLE = 'this is ur journ.'
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
      <BackgroundScene />
      <Hero />
      <section className="hj-features public-card" aria-labelledby="features-heading">
        <h2 id="features-heading" className="hj-features-heading">Designed for traders who want clarity and speed</h2>
        <div className="hj-features-grid">
          <article className="hj-feature-card">
            <div className="hj-feature-icon" aria-hidden>⚡</div>
            <div>
              <h3 className="hj-feature-title">Fast trade logging</h3>
              <p className="hj-feature-desc">Record trades in seconds with keyboard-first entry and sensible defaults.</p>
            </div>
          </article>

          <article className="hj-feature-card">
            <div className="hj-feature-icon" aria-hidden>📈</div>
            <div>
              <h3 className="hj-feature-title">Performance analytics</h3>
              <p className="hj-feature-desc">Clear charts and animated summaries help you identify what actually works.</p>
            </div>
          </article>

          <article className="hj-feature-card">
            <div className="hj-feature-icon" aria-hidden>🔒</div>
            <div>
              <h3 className="hj-feature-title">Secure account tracking</h3>
              <p className="hj-feature-desc">Privacy-first account controls with optional cloud sync and export tools.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

export default HomePage
