import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function FreeReveal() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
        delayChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
    visible: prefersReducedMotion
      ? { opacity: 1 }
      : {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
        },
  }

  const revealVariants = {
    hidden: prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95, y: 20 },
    visible: prefersReducedMotion
      ? { opacity: 1, scale: 1 }
      : {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 },
        },
  }

  return (
    <section className="free-reveal-section">
      <motion.div
        className="free-reveal-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div className="reveal-header" variants={itemVariants}>
          <h2 className="reveal-title">Premium features, zero cost</h2>
          <p className="reveal-subtitle">Trading journals and analytics tools typically run $50-300/month.</p>
        </motion.div>

        <motion.div className="pricing-comparison" variants={containerVariants}>
          <motion.div className="pricing-item" variants={itemVariants}>
            <div className="pricing-label">Journal</div>
            <div className="pricing-cost">$99</div>
          </motion.div>

          <motion.div className="pricing-item" variants={itemVariants}>
            <div className="pricing-label">Analytics</div>
            <div className="pricing-cost">$149</div>
          </motion.div>

          <motion.div className="pricing-item" variants={itemVariants}>
            <div className="pricing-label">Performance Tracking</div>
            <div className="pricing-cost">$79</div>
          </motion.div>
        </motion.div>

        <motion.div className="reveal-divider" variants={itemVariants} />

        <motion.div className="final-reveal" variants={revealVariants}>
          <p className="reveal-label">urjourn</p>
          <div className="reveal-price">
            <span className="free-text">Free</span>
          </div>
          <p className="reveal-footnote">No credit card. No trials. No limits. Forever.</p>
        </motion.div>

        <motion.div className="reveal-cta" variants={itemVariants}>
          <Link className="btn primary reveal-btn-primary" to="/signup">
            Create Your Free Account
          </Link>
          <Link className="btn ghost reveal-btn-ghost" to="/login">
            Already trading
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
