import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import heroChartImage from '../assets/hero-chart-image.svg'
import './HomePage.css'

const CHART_REVEAL_DELAY = 0.58
const CHART_REVEAL_EXPONENT = 4.6
const CHART_REVEAL_SMOOTHING = 0.045
const CHART_SYMBOL = 'NQ'
const CHART_PRICE = '21,842.25'
const CHART_PRICE_LEVELS = ['21,920', '21,880', '21,840', '21,800', '21,760'] as const
const CHART_TIME_LABELS = ['09:30', '10:15', '11:00', '11:45', '12:30'] as const

const MOCK_BARS = ['38%', '62%', '28%', '55%', '74%', '31%', '88%'] as const

function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const chartRevealRef = useRef<HTMLDivElement | null>(null)
  const revealCurrentRef = useRef(0)
  const revealTargetRef = useRef(0)
  const revealRafRef = useRef<number | null>(null)

  useEffect(() => {
    const hero = heroRef.current
    const chartReveal = chartRevealRef.current

    if (!hero || !chartReveal) return

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const applyReveal = (value: number) => {
      chartReveal.style.setProperty('--landing-chart-reveal', `${value.toFixed(3)}%`)
    }

    const animateReveal = () => {
      const current = revealCurrentRef.current
      const target = revealTargetRef.current
      const delta = target - current

      if (Math.abs(delta) < 0.05) {
        revealCurrentRef.current = target
        applyReveal(target)
        revealRafRef.current = null
        return
      }

      revealCurrentRef.current = current + delta * CHART_REVEAL_SMOOTHING
      applyReveal(revealCurrentRef.current)
      revealRafRef.current = window.requestAnimationFrame(animateReveal)
    }

    const ensureRevealAnimation = () => {
      if (revealRafRef.current !== null) return
      revealRafRef.current = window.requestAnimationFrame(animateReveal)
    }

    const updateChartReveal = () => {
      if (reduceMotionQuery.matches) {
        revealTargetRef.current = 100
        revealCurrentRef.current = 100
        applyReveal(100)

        if (revealRafRef.current !== null) {
          window.cancelAnimationFrame(revealRafRef.current)
          revealRafRef.current = null
        }

        return
      }

      const rect = hero.getBoundingClientRect()
      const totalScrollable = hero.offsetHeight - window.innerHeight
      const scrolled = Math.min(Math.max(-rect.top, 0), totalScrollable)
      const progress = totalScrollable > 0 ? scrolled / totalScrollable : 1
      const delayedProgress = Math.max(0, (progress - CHART_REVEAL_DELAY) / (1 - CHART_REVEAL_DELAY))
      const revealProgress = Math.min(delayedProgress, 1)
      const eased = revealProgress ** CHART_REVEAL_EXPONENT
      revealTargetRef.current = eased * 100
      ensureRevealAnimation()
    }

    updateChartReveal()
    window.addEventListener('scroll', updateChartReveal, { passive: true })
    window.addEventListener('resize', updateChartReveal)

    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', updateChartReveal)
    } else {
      reduceMotionQuery.addListener(updateChartReveal)
    }

    return () => {
      window.removeEventListener('scroll', updateChartReveal)
      window.removeEventListener('resize', updateChartReveal)

      if (revealRafRef.current !== null) {
        window.cancelAnimationFrame(revealRafRef.current)
        revealRafRef.current = null
      }

      if (typeof reduceMotionQuery.removeEventListener === 'function') {
        reduceMotionQuery.removeEventListener('change', updateChartReveal)
      } else {
        reduceMotionQuery.removeListener(updateChartReveal)
      }
    }
  }, [])

  return (
    <div className="landing-page">
      <section className="landing-hero" id="hero" ref={heroRef}>
        <div className="landing-hero-sticky">
          <div className="landing-hero-inner">
            <div className="landing-hero-topbar">
              <div>URJOURN.COM</div>
              <div className="landing-hero-tagline">BUILT FOR DISCRETIONARY TRADERS</div>
            </div>

            <div className="landing-headline-wrap">
              <h1 className="landing-headline">THIS IS<br />UR JOURN.</h1>
            </div>

            <div className="landing-chart-ui" aria-hidden="true">
              <div className="landing-chart-grid"></div>

              <div className="landing-chart-header">
                <span className="landing-chart-symbol">{CHART_SYMBOL}</span>
                <span className="landing-chart-price">{CHART_PRICE}</span>
              </div>

              <div className="landing-y-axis">
                {CHART_PRICE_LEVELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="landing-x-axis">
                {CHART_TIME_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>

            <div className="landing-chart-stage" aria-hidden="true">
              <div className="landing-chart-reveal" ref={chartRevealRef}>
                <img className="landing-chart-image" src={heroChartImage} alt="" loading="eager" decoding="async" />
              </div>
            </div>

            <div className="landing-hero-fade"></div>
            <div className="landing-hero-bottom-hint">scroll</div>
          </div>
        </div>
      </section>

      <main className="landing-content">
        <section className="landing-section">
          <div className="landing-story-grid">
            <div>
              <div className="landing-eyebrow">the story</div>
              <h2 className="landing-section-title">hello world!<br />and welcome.</h2>
              <p className="landing-section-copy">
                I built urjourn after wasting countless hours tracking trades in spreadsheets and overpriced tools. Journaling is one
                of the fastest ways to improve as a trader, yet most platforms make it painful or expensive. urjourn fixes that.
              </p>
            </div>

            <div className="landing-visual-card">
              <div className="landing-mock-chart">
                <div className="landing-mock-top">
                  <span>journal snapshot</span>
                  <span>replace visual later</span>
                </div>
                <div className="landing-mock-graph">
                  {MOCK_BARS.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className={`landing-mock-bar ${index === 2 || index === 5 ? 'is-red' : ''}`}
                      style={{ height }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-free-reveal">
            <div className="landing-free-small">the payoff</div>
            <div className="landing-free-lines">
              no subscriptions.<br />
              no locked features.<br />
              no nonsense.
            </div>
            <h2 className="landing-free-main">URJOURN<br />IS FREE.</h2>
          </div>
        </section>

        <section className="landing-section landing-cta-wrap">
          <h2 className="landing-cta-title">start journaling smarter.</h2>
          <p className="landing-cta-sub">
            build discipline, review your trades, and improve your process with a journal that does not hide behind a paywall.
          </p>

          <div className="landing-buttons">
            <Link className="landing-btn landing-btn-primary" to="/signup">
              start trading free
            </Link>
            <Link className="landing-btn landing-btn-secondary" to="/login">
              sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage
