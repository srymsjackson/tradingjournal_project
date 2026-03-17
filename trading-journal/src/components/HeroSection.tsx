import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const INTRO_LINES = [
  'initializing journ workspace...',
  'loading trade analytics...',
  'connecting performance engine...',
  'ready',
]

export default function HeroSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      setIntroComplete(true)
      return
    }

    // Timeline: each line appears, then intro completes
    // 4 lines × 300ms per line + 400ms final pause = ~1.6s total
    const totalIntroTime = INTRO_LINES.length * 300 + 400
    const timer = window.setTimeout(() => {
      setIntroComplete(true)
    }, totalIntroTime)

    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.12,
        delayChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    visible: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
  }

  return (
    <section className="hero-section">
      {!introComplete && (
        <motion.div
          className="hero-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="terminal-lines">
            {INTRO_LINES.map((line, idx) => (
              <TerminalLine
                key={idx}
                line={line}
                index={idx}
                isLast={idx === INTRO_LINES.length - 1}
                prefersReducedMotion={prefersReducedMotion}
              />
            ))}
          </div>
        </motion.div>
      )}

      {introComplete && (
        <motion.div
          className="hero-inner"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="hero-headline" variants={itemVariants}>
            this is ur journ.
          </motion.h1>

          <motion.p className="hero-subheadline" variants={itemVariants}>
            ur journal, ur trades, ur journey. all in one space.
          </motion.p>

          <motion.div className="hero-cta" variants={itemVariants}>
            <Link className="btn primary hero-btn-primary" to="/signup">
              Start Trading Free
            </Link>
            <span className="cta-or">or</span>
            <Link className="btn ghost hero-btn-ghost" to="/login">
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}

function TerminalLine({
  line,
  index,
  isLast,
  prefersReducedMotion,
}: {
  line: string
  index: number
  isLast: boolean
  prefersReducedMotion: boolean
}) {
  return (
    <motion.div
      className={`terminal-line ${isLast ? 'final' : ''}`}
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: index * 0.3 }
      }
      exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, transition: { duration: 0.3 } }}
    >
      <span className="terminal-prompt">{'>'}</span>
      <span className="terminal-text">{line}</span>
    </motion.div>
  )
}
