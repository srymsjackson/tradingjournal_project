import { motion } from 'framer-motion'

export default function ProductShowcase() {
  const showcaseItems = [
    {
      title: 'Trade Tracking',
      description: 'Log every entry, exit, and outcome in seconds. Capture setup, session, fees, and duration.',
      metrics: ['1,247 Trades', '52 Setups', '89% Win Rate'],
      className: 'showcase-trade-tracking',
    },
    {
      title: 'Performance Curve',
      description: 'Visualize your cumulative P&L over time. Watch patterns emerge, spot drawdowns, celebrate gains.',
      metrics: ['+$12,450', '6.2% Monthly', '3.1 Sharpe Ratio'],
      className: 'showcase-performance',
    },
    {
      title: 'Pattern Review',
      description: 'Filter trades by setup, session, or symbol. Identify your strongest edges and biggest leaks.',
      metrics: ['ES Range', 'London Session', 'Breakout Plays'],
      className: 'showcase-patterns',
    },
    {
      title: 'Discipline Meter',
      description: 'Track risk management, trade duration, setup adherence. Measure consistency across sessions.',
      metrics: ['Risk/Reward', 'Trade Duration', 'Setup Accuracy'],
      className: 'showcase-discipline',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <section className="showcase-section">
      <motion.div
        className="showcase-container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div className="showcase-header" variants={itemVariants}>
          <h2 className="showcase-title">Built for serious traders</h2>
          <p className="showcase-subtitle">Everything you need to evolve from emotional trading to systematic mastery.</p>
        </motion.div>

        <motion.div className="showcase-grid" variants={containerVariants}>
          {showcaseItems.map((item, idx) => (
            <motion.div key={idx} className={`showcase-card ${item.className}`} variants={itemVariants}>
              <div className="card-header">
                <h3 className="card-title">{item.title}</h3>
              </div>

              <p className="card-description">{item.description}</p>

              <div className="card-metrics">
                {item.metrics.map((metric, midx) => (
                  <div key={midx} className="metric-block">
                    <span className="metric-label">{metric}</span>
                  </div>
                ))}
              </div>

              <div className={`card-visual ${item.className}-visual`} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
