import { useEffect, useMemo, useState } from 'react'
import type { Trade } from '../types'
import { EMOTION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, SESSION_OPTIONS, formatDuration, formatMoney } from '../utils/tradeUtils'
import { calculatePnL, getQuantityLabel, resolveInstrumentSpec, sideToCalculatorSide } from '../lib/pnlEngine'

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

    const entryPrice = Math.max(0, Number(draft.entryPrice) || 0)
    const exitPrice = Math.max(0, Number(draft.exitPrice) || 0)
    const quantity = Math.max(0, Number(draft.quantity) || 0)
    const fees = Math.max(0, Number(draft.fees) || 0)
    const costBasis = entryPrice * quantity

    let pnlResult
    try {
      pnlResult = calculatePnL({
        symbol: draft.symbol,
        broker: draft.broker,
        side: sideToCalculatorSide(draft.side),
        entry: entryPrice,
        exit: exitPrice,
        qty: quantity,
        fees,
        realizedPnL: draft.realizedPnl ?? null,
      })
    } catch {
      const fallbackNet = Number.isFinite(Number(draft.netPnl)) ? Number(draft.netPnl) : 0
      pnlResult = {
        gross: fallbackNet + fees,
        net: fallbackNet,
        calculationMethod: 'imported' as const,
      }
    }

    const netPnl = pnlResult.net

    return {
      ...draft,
      symbol: draft.symbol.trim().toUpperCase(),
      setup: draft.setup.trim(),
      session: draft.session.trim() || 'Open',
      marketCondition: draft.marketCondition.trim() || 'Trending',
      broker: (draft.broker || '').trim().toLowerCase(),
      notes: draft.notes.trim(),
      entryPrice,
      exitPrice,
      quantity,
      fees,
      durationSec: Math.max(0, Math.floor(Number(draft.durationSec) || 0)),
      pnlHigh: Number(draft.pnlHigh) || netPnl,
      pnlLow: Number(draft.pnlLow) || netPnl,
      grossPnl: pnlResult.gross,
      calculationMethod: pnlResult.calculationMethod,
      assetClass: pnlResult.specUsed?.assetClass,
      quantityType: pnlResult.specUsed?.quantityType,
      netPnl,
      returnPct: costBasis > 0 ? (netPnl / costBasis) * 100 : 0,
    }
  }, [draft])

  const calculationError = useMemo(() => {
    if (!draft) return ''

    try {
      calculatePnL({
        symbol: draft.symbol,
        broker: draft.broker,
        side: sideToCalculatorSide(draft.side),
        entry: Number(draft.entryPrice) || 0,
        exit: Number(draft.exitPrice) || 0,
        qty: Number(draft.quantity) || 0,
        fees: Number(draft.fees) || 0,
        realizedPnL: draft.realizedPnl ?? null,
      })
      return ''
    } catch (error) {
      return error instanceof Error ? error.message : 'Unable to calculate P&L for this trade.'
    }
  }, [draft])

  const resolvedSpec = useMemo(() => (draft ? resolveInstrumentSpec(draft.symbol, draft.broker) : null), [draft])
  const quantityLabel = getQuantityLabel(resolvedSpec?.assetClass, resolvedSpec?.quantityType)

  if (!isOpen || !draft || !normalizedTrade) return null

  return (
    <div className="review-drawer-backdrop" onClick={onClose}>
      <aside className="review-drawer" role="dialog" aria-modal="true" aria-label="Trade review panel" onClick={(e) => e.stopPropagation()}>
        <header className="review-drawer-head">
          <div>
            <h3>Trade Review</h3>
            <p>{normalizedTrade.symbol} · {normalizedTrade.side} · {normalizedTrade.tradeDate}</p>
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
                <input type="date" value={draft.tradeDate} onChange={(e) => updateDraft('tradeDate', e.target.value)} />
              </label>
              <label>
                Symbol
                <input type="text" value={draft.symbol} maxLength={10} onChange={(e) => updateDraft('symbol', e.target.value.toUpperCase())} />
              </label>
              <label>
                Broker (optional)
                <input type="text" value={draft.broker || ''} maxLength={32} onChange={(e) => updateDraft('broker', e.target.value.toLowerCase())} />
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
                <input type="number" min="0" step="0.01" value={draft.entryPrice || ''} onChange={(e) => updateDraft('entryPrice', Number(e.target.value))} />
              </label>
              <label>
                Exit
                <input type="number" min="0" step="0.01" value={draft.exitPrice || ''} onChange={(e) => updateDraft('exitPrice', Number(e.target.value))} />
              </label>
              <label>
                {quantityLabel.charAt(0).toUpperCase() + quantityLabel.slice(1)}
                <input type="number" min="0" step="1" value={draft.quantity || ''} onChange={(e) => updateDraft('quantity', Number(e.target.value))} />
              </label>
              <label>
                Fees
                <input type="number" min="0" step="0.01" value={draft.fees || ''} onChange={(e) => updateDraft('fees', Number(e.target.value))} />
              </label>
              <label>
                Realized P&amp;L Override
                <input
                  type="number"
                  step="0.01"
                  value={draft.realizedPnl ?? ''}
                  onChange={(e) => updateDraft('realizedPnl', e.target.value === '' ? null : Number(e.target.value))}
                />
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
                <small>Gross P&amp;L</small>
                <p className={(normalizedTrade.grossPnl ?? 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(normalizedTrade.grossPnl ?? normalizedTrade.netPnl)}</p>
              </article>
              <article>
                <small>Net P&amp;L</small>
                <p className={normalizedTrade.netPnl >= 0 ? 'pnl-positive' : 'pnl-negative'}>{formatMoney(normalizedTrade.netPnl)}</p>
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
            {calculationError && <p className="form-error">{calculationError}</p>}
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
            <div className="attachment-head">
              <h4>Chart Screenshots</h4>
              <button type="button" className="btn ghost" disabled>
                Upload Screenshot (Soon)
              </button>
            </div>
            {normalizedTrade.attachments.length > 0 ? (
              <div className="attachment-grid">
                {normalizedTrade.attachments.map((attachment) => (
                  <article key={attachment.id} className="attachment-card">
                    <div className="attachment-thumb" />
                    <p>{attachment.name}</p>
                    <small>{attachment.kind} · {attachment.status}</small>
                  </article>
                ))}
              </div>
            ) : (
              <div className="attachment-empty">
                <p>No screenshots attached yet.</p>
                <small>Future-ready area for chart screenshots, annotations, and before/after trade context.</small>
              </div>
            )}
          </section>
        </div>

        <footer className="review-drawer-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={Boolean(calculationError)}
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
