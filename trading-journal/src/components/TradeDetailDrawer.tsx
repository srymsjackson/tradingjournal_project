import { useEffect, useMemo, useState } from 'react'
import type { Trade } from '../types'
import { EMOTION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, SESSION_OPTIONS, formatDuration, formatMoney } from '../utils/tradeUtils'

type TradeDetailDrawerProps = {
  isOpen: boolean
  trade: Trade | null
  onClose: () => void
  onSave: (trade: Trade) => void
}

function TradeDetailDrawer({ isOpen, trade, onClose, onSave }: TradeDetailDrawerProps) {
  const [draft, setDraft] = useState<Trade | null>(trade)

  useEffect(() => {
    setDraft(trade)
  }, [trade])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const updateDraft = <K extends keyof Trade>(key: K, value: Trade[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const toggleTag = (field: 'emotionTags' | 'mistakeTags', tag: string) => {
    if (!draft) return
    const current = draft[field]
    const next = current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    updateDraft(field, next)
  }

  const normalizedTrade = useMemo(() => {
    if (!draft) return null

    const entry = Math.max(0, Number(draft.entry) || 0)
    const exit = Math.max(0, Number(draft.exit) || 0)
    const shares = Math.max(0, Number(draft.shares) || 0)
    const fees = Math.max(0, Number(draft.fees) || 0)
    const rawPnl = draft.side === 'LONG' ? (exit - entry) * shares : (entry - exit) * shares
    const pnl = rawPnl - fees
    const costBasis = entry * shares

    return {
      ...draft,
      symbol: draft.symbol.trim().toUpperCase(),
      setup: draft.setup.trim(),
      session: draft.session.trim() || 'Open',
      marketCondition: draft.marketCondition.trim() || 'Trending',
      notes: draft.notes.trim(),
      entry,
      exit,
      shares,
      fees,
      durationSec: Math.max(0, Math.floor(Number(draft.durationSec) || 0)),
      pnlHigh: Number(draft.pnlHigh) || pnl,
      pnlLow: Number(draft.pnlLow) || pnl,
      pnl,
      returnPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
    }
  }, [draft])

  if (!isOpen || !draft || !normalizedTrade) return null

  return (
    <div className="review-drawer-backdrop" onClick={onClose}>
      <aside className="review-drawer" role="dialog" aria-modal="true" aria-label="Trade review panel" onClick={(e) => e.stopPropagation()}>
        <header className="review-drawer-head">
          <div>
            <h3>Trade Review</h3>
            <p>{normalizedTrade.symbol} · {normalizedTrade.side} · {normalizedTrade.date}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close trade review">
            Close
          </button>
        </header>

        <div className="review-drawer-body">
          <section className="review-block">
            <h4>Trade Info</h4>
            <div className="grid two-col compact-grid">
              <label>
                Date
                <input type="date" value={draft.date} onChange={(e) => updateDraft('date', e.target.value)} />
              </label>
              <label>
                Symbol
                <input type="text" value={draft.symbol} maxLength={10} onChange={(e) => updateDraft('symbol', e.target.value)} />
              </label>
              <label>
                Side
                <select value={draft.side} onChange={(e) => updateDraft('side', e.target.value as Trade['side'])}>
                  <option value="LONG">Long</option>
                  <option value="SHORT">Short</option>
                </select>
              </label>
              <label>
                Setup
                <input type="text" value={draft.setup} onChange={(e) => updateDraft('setup', e.target.value)} />
              </label>
              <label>
                Session
                <input type="text" list="drawer-session-options" value={draft.session} onChange={(e) => updateDraft('session', e.target.value)} />
              </label>
              <label>
                Market Condition
                <select value={draft.marketCondition} onChange={(e) => updateDraft('marketCondition', e.target.value)}>
                  {MARKET_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <datalist id="drawer-session-options">
              {SESSION_OPTIONS.map((session) => (
                <option key={session} value={session} />
              ))}
            </datalist>
          </section>

          <section className="review-block">
            <h4>P&amp;L Details</h4>
            <div className="grid three-col compact-grid">
              <label>
                Entry
                <input type="number" min="0" step="0.01" value={draft.entry || ''} onChange={(e) => updateDraft('entry', Number(e.target.value))} />
              </label>
              <label>
                Exit
                <input type="number" min="0" step="0.01" value={draft.exit || ''} onChange={(e) => updateDraft('exit', Number(e.target.value))} />
              </label>
              <label>
                Shares
                <input type="number" min="0" step="1" value={draft.shares || ''} onChange={(e) => updateDraft('shares', Number(e.target.value))} />
              </label>
              <label>
                Fees
                <input type="number" min="0" step="0.01" value={draft.fees || ''} onChange={(e) => updateDraft('fees', Number(e.target.value))} />
              </label>
              <label>
                P&amp;L High
                <input type="number" step="0.01" value={draft.pnlHigh || ''} onChange={(e) => updateDraft('pnlHigh', Number(e.target.value))} />
              </label>
              <label>
                P&amp;L Low
                <input type="number" step="0.01" value={draft.pnlLow || ''} onChange={(e) => updateDraft('pnlLow', Number(e.target.value))} />
              </label>
            </div>

            <div className="review-metrics-row">
              <article>
                <small>Net P&amp;L</small>
                <p className={normalizedTrade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(normalizedTrade.pnl)}</p>
              </article>
              <article>
                <small>Return %</small>
                <p>{normalizedTrade.returnPct.toFixed(2)}%</p>
              </article>
              <article>
                <small>Duration</small>
                <p>{formatDuration(normalizedTrade.durationSec)}</p>
              </article>
            </div>
          </section>

          <section className="review-block">
            <h4>Behavior Review</h4>
            <div className="discipline-grid">
              <button type="button" className={`discipline-chip ${draft.setupWasValid ? 'active' : ''}`} onClick={() => updateDraft('setupWasValid', !draft.setupWasValid)}>
                Setup was valid
              </button>
              <button
                type="button"
                className={`discipline-chip ${draft.waitedForConfirmation ? 'active' : ''}`}
                onClick={() => updateDraft('waitedForConfirmation', !draft.waitedForConfirmation)}
              >
                Waited for confirmation
              </button>
              <button type="button" className={`discipline-chip ${draft.riskWasDefined ? 'active' : ''}`} onClick={() => updateDraft('riskWasDefined', !draft.riskWasDefined)}>
                Risk was defined
              </button>
              <button type="button" className={`discipline-chip ${draft.followedPlan ? 'active' : ''}`} onClick={() => updateDraft('followedPlan', !draft.followedPlan)}>
                Followed plan
              </button>
            </div>

            <label>
              Confidence ({draft.confidence}/5)
              <input type="range" min="1" max="5" step="1" value={draft.confidence} onChange={(e) => updateDraft('confidence', Number(e.target.value))} />
            </label>

            <div className="toggle-row" role="group" aria-label="Rule followed status">
              <span>Rule Followed</span>
              <div className="toggle-group">
                <button type="button" className={`toggle-chip ${draft.ruleFollowed ? 'active' : ''}`} onClick={() => updateDraft('ruleFollowed', true)}>
                  Yes
                </button>
                <button type="button" className={`toggle-chip ${!draft.ruleFollowed ? 'active' : ''}`} onClick={() => updateDraft('ruleFollowed', false)}>
                  No
                </button>
              </div>
            </div>

            <div className="toggle-row" role="group" aria-label="Broke rules status">
              <span>Broke Rules</span>
              <div className="toggle-group">
                <button type="button" className={`toggle-chip ${!draft.brokeRules ? 'active' : ''}`} onClick={() => updateDraft('brokeRules', false)}>
                  No
                </button>
                <button type="button" className={`toggle-chip ${draft.brokeRules ? 'active' : ''}`} onClick={() => updateDraft('brokeRules', true)}>
                  Yes
                </button>
              </div>
            </div>

            <div className="quick-row">
              <p className="quick-label">Emotion Tags</p>
              <div className="quick-chips">
                {EMOTION_TAGS.map((tag) => (
                  <button key={tag} type="button" className={`chip-btn chip-select ${draft.emotionTags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleTag('emotionTags', tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-row">
              <p className="quick-label">Mistake Tags</p>
              <div className="quick-chips">
                {MISTAKE_TAGS.map((tag) => (
                  <button key={tag} type="button" className={`chip-btn chip-select ${draft.mistakeTags.includes(tag) ? 'selected' : ''}`} onClick={() => toggleTag('mistakeTags', tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <label>
              Notes
              <textarea rows={4} value={draft.notes} onChange={(e) => updateDraft('notes', e.target.value)} placeholder="Execution notes, context, and behavior review..." />
            </label>
          </section>

          <section className="review-block coming-soon-block">
            <h4>Attachments</h4>
            <p>Screenshot and chart uploads are coming soon. This panel is ready for future review media integration.</p>
          </section>
        </div>

        <footer className="review-drawer-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              onSave(normalizedTrade)
              onClose()
            }}
          >
            Save Changes
          </button>
        </footer>
      </aside>
    </div>
  )
}

export default TradeDetailDrawer
