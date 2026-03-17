import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import './HomePage.css'

const CHART_WIDTH = 1440
const CHART_HEIGHT = 900

const HERO_CANDLES = [
  { x: 55, wickTop: 650, wickBottom: 790, bodyY: 690, bodyHeight: 58, color: '#16c60c' },
  { x: 95, wickTop: 560, wickBottom: 700, bodyY: 610, bodyHeight: 64, color: '#ff2b2b' },
  { x: 135, wickTop: 520, wickBottom: 680, bodyY: 560, bodyHeight: 76, color: '#16c60c' },
  { x: 175, wickTop: 610, wickBottom: 760, bodyY: 655, bodyHeight: 56, color: '#ff2b2b' },
  { x: 215, wickTop: 520, wickBottom: 650, bodyY: 550, bodyHeight: 64, color: '#16c60c' },
  { x: 255, wickTop: 480, wickBottom: 640, bodyY: 520, bodyHeight: 78, color: '#16c60c' },
  { x: 295, wickTop: 540, wickBottom: 700, bodyY: 590, bodyHeight: 66, color: '#ff2b2b' },
  { x: 335, wickTop: 590, wickBottom: 760, bodyY: 635, bodyHeight: 70, color: '#ff2b2b' },
  { x: 375, wickTop: 430, wickBottom: 610, bodyY: 485, bodyHeight: 82, color: '#16c60c' },
  { x: 415, wickTop: 520, wickBottom: 690, bodyY: 570, bodyHeight: 74, color: '#ff2b2b' },
  { x: 455, wickTop: 470, wickBottom: 620, bodyY: 510, bodyHeight: 68, color: '#16c60c' },
  { x: 495, wickTop: 620, wickBottom: 860, bodyY: 680, bodyHeight: 96, color: '#ff2b2b' },
  { x: 535, wickTop: 710, wickBottom: 885, bodyY: 760, bodyHeight: 76, color: '#16c60c' },
  { x: 575, wickTop: 590, wickBottom: 770, bodyY: 640, bodyHeight: 78, color: '#16c60c' },
  { x: 615, wickTop: 520, wickBottom: 690, bodyY: 575, bodyHeight: 72, color: '#ff2b2b' },
  { x: 655, wickTop: 460, wickBottom: 620, bodyY: 510, bodyHeight: 68, color: '#16c60c' },
  { x: 695, wickTop: 540, wickBottom: 700, bodyY: 590, bodyHeight: 72, color: '#ff2b2b' },
  { x: 735, wickTop: 640, wickBottom: 810, bodyY: 685, bodyHeight: 74, color: '#ff2b2b' },
  { x: 775, wickTop: 600, wickBottom: 760, bodyY: 640, bodyHeight: 72, color: '#16c60c' },
  { x: 815, wickTop: 510, wickBottom: 680, bodyY: 560, bodyHeight: 76, color: '#16c60c' },
  { x: 855, wickTop: 470, wickBottom: 620, bodyY: 510, bodyHeight: 68, color: '#16c60c' },
  { x: 895, wickTop: 550, wickBottom: 720, bodyY: 605, bodyHeight: 72, color: '#ff2b2b' },
  { x: 935, wickTop: 590, wickBottom: 760, bodyY: 640, bodyHeight: 72, color: '#ff2b2b' },
  { x: 975, wickTop: 520, wickBottom: 690, bodyY: 565, bodyHeight: 76, color: '#16c60c' },
  { x: 1015, wickTop: 450, wickBottom: 610, bodyY: 500, bodyHeight: 68, color: '#16c60c' },
  { x: 1055, wickTop: 420, wickBottom: 590, bodyY: 470, bodyHeight: 76, color: '#ff2b2b' },
  { x: 1095, wickTop: 510, wickBottom: 700, bodyY: 560, bodyHeight: 82, color: '#16c60c' },
  { x: 1135, wickTop: 470, wickBottom: 650, bodyY: 520, bodyHeight: 80, color: '#16c60c' },
  { x: 1175, wickTop: 380, wickBottom: 560, bodyY: 430, bodyHeight: 82, color: '#16c60c' },
  { x: 1215, wickTop: 300, wickBottom: 500, bodyY: 360, bodyHeight: 92, color: '#16c60c' },
  { x: 1255, wickTop: 240, wickBottom: 450, bodyY: 300, bodyHeight: 96, color: '#16c60c' },
  { x: 1295, wickTop: 180, wickBottom: 400, bodyY: 245, bodyHeight: 102, color: '#16c60c' },
  { x: 1335, wickTop: 220, wickBottom: 470, bodyY: 280, bodyHeight: 108, color: '#ff2b2b' },
  { x: 1375, wickTop: 300, wickBottom: 520, bodyY: 360, bodyHeight: 92, color: '#ff2b2b' },
  { x: 1415, wickTop: 330, wickBottom: 500, bodyY: 380, bodyHeight: 74, color: '#16c60c' },
] as const

const MOCK_BARS = ['38%', '62%', '28%', '55%', '74%', '31%', '88%'] as const

function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null)
  const chartMaskRef = useRef<SVGRectElement | null>(null)
  const clipPathId = useId().replace(/:/g, '')

  useEffect(() => {
    const hero = heroRef.current
    const chartMask = chartMaskRef.current

    if (!hero || !chartMask) return

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const updateChartReveal = () => {
      if (reduceMotionQuery.matches) {
        chartMask.setAttribute('width', String(CHART_WIDTH))
        return
      }

      const rect = hero.getBoundingClientRect()
      const totalScrollable = hero.offsetHeight - window.innerHeight
      const scrolled = Math.min(Math.max(-rect.top, 0), totalScrollable)
      const progress = totalScrollable > 0 ? scrolled / totalScrollable : 1
      const revealProgress = Math.min(progress * 1.6, 1)
      const eased = 1 - (1 - revealProgress) ** 1.8

      chartMask.setAttribute('width', String(CHART_WIDTH * eased))
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

            <div className="landing-chart-stage" aria-hidden="true">
              <svg className="landing-chart-svg" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="xMidYMid slice">
                <defs>
                  <clipPath id={clipPathId}>
                    <rect ref={chartMaskRef} x="0" y="0" width="0" height={String(CHART_HEIGHT)}></rect>
                  </clipPath>
                </defs>

                <g clipPath={`url(#${clipPathId})`}>
                  <g strokeWidth="2">
                    {HERO_CANDLES.map((candle) => (
                      <g key={candle.x}>
                        <line x1={candle.x} y1={candle.wickTop} x2={candle.x} y2={candle.wickBottom} stroke={candle.color}></line>
                        <rect x={candle.x - 8} y={candle.bodyY} width="16" height={candle.bodyHeight} fill={candle.color}></rect>
                      </g>
                    ))}
                  </g>
                </g>
              </svg>
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
