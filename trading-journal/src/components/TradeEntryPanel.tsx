import type { TradeFormData } from '../types'
import { COMMON_SETUPS, EMOTION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, SESSION_OPTIONS, findPlaybookSetup } from '../utils/tradeUtils'
import { SETUP_PLAYBOOK } from '../data/setupPlaybook'
import { calculatePnL, getQuantityLabel, resolveInstrumentSpec, sideToCalculatorSide } from '../lib/pnlEngine'

type TradeEntryPanelProps = {
  form: TradeFormData
  symbolOptions: string[]
  setupOptions: string[]
  formError: string
  onUpdateForm: <K extends keyof TradeFormData>(key: K, value: TradeFormData[K]) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>, addAnother: boolean) => void
  onReset: () => void
  onDuplicateLast: () => void
  canDuplicate: boolean
  onLoadSample: () => void
}

function TradeEntryPanel({
  form,
  symbolOptions,
  setupOptions,
  formError,
  onUpdateForm,
  onSubmit,
  onReset,
  onDuplicateLast,
  canDuplicate,
  onLoadSample,
}: TradeEntryPanelProps) {
  const selectedPlaybook = findPlaybookSetup(form.setup)
  const resolvedSpec = resolveInstrumentSpec(form.symbol, form.broker)
  const quantityLabel = getQuantityLabel(resolvedSpec?.assetClass, resolvedSpec?.quantityType)

  const toggleTag = (field: 'emotionTags' | 'mistakeTags', tag: string) => {
    const currentTags = form[field]
    const nextTags = currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag]
    onUpdateForm(field, nextTags)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const addAnother = submitter?.dataset.submitMode === 'add-another'
    onSubmit(event, Boolean(addAnother))
  }

  let netPnlPreview = 0
  let netPnlPreviewError = ''

  try {
    netPnlPreview = calculatePnL({
      symbol: form.symbol,
      broker: form.broker,
      side: sideToCalculatorSide(form.side),
      entry: form.entryPrice,
      exit: form.exitPrice,
      qty: form.quantity,
      fees: form.fees,
      realizedPnL: form.realizedPnl,
    }).net
  } catch (error) {
    netPnlPreviewError = error instanceof Error ? error.message : 'Unable to calculate P&L for this symbol yet.'
  }

  return (
    <section className="panel form-panel">
      <div className="panel-head">
        <h2>Log Trade</h2>
        <p>Fast, structured entry for repeated daily journaling.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {formError && <p className="form-error" role="alert">{formError}</p>}

        <div className="form-section">
          <div className="section-head">
            <h3>Trade Basics</h3>
          </div>
          <div className="grid two-col compact-grid">
            <label>
              Date
              <input type="date" value={form.tradeDate} onChange={(e) => onUpdateForm('tradeDate', e.target.value)} required />
            </label>
            <label>
              Broker (optional)
              <input
                type="text"
                placeholder="tradovate"
                value={form.broker}
                onChange={(e) => onUpdateForm('broker', e.target.value.toLowerCase())}
                maxLength={32}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="grid two-col compact-grid">
            <label>
              Symbol
              <input
                type="text"
                placeholder="AAPL"
                value={form.symbol}
                onChange={(e) => onUpdateForm('symbol', e.target.value.toUpperCase())}
                required
                maxLength={10}
                list="symbol-options"
                autoComplete="off"
              />
              <small className="field-hint">Typed symbols are remembered for quick reuse.</small>
            </label>
            <label>
              Realized P&amp;L Override (optional)
              <input
                type="number"
                step="0.01"
                value={form.realizedPnl ?? ''}
                onChange={(e) => onUpdateForm('realizedPnl', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="Use broker-reported net P&L"
              />
            </label>
          </div>

          <div className="grid two-col compact-grid">
            <label>
              Side
              <select value={form.side} onChange={(e) => onUpdateForm('side', e.target.value as TradeFormData['side'])} required>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </label>
            <label>
              Setup
              <input
                type="text"
                placeholder="Breakout, VWAP reclaim..."
                value={form.setup}
                onChange={(e) => onUpdateForm('setup', e.target.value)}
                list="setup-options"
                required
              />
            </label>
          </div>

          <div className="grid two-col compact-grid">
            <label>
              Session
              <input
                type="text"
                value={form.session}
                list="session-options"
                placeholder="Open"
                onChange={(e) => onUpdateForm('session', e.target.value)}
                required
              />
            </label>
            <label>
              Market Condition
              <select value={form.marketCondition} onChange={(e) => onUpdateForm('marketCondition', e.target.value)} required>
                {MARKET_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <datalist id="symbol-options">
          {symbolOptions.map((symbol) => (
            <option key={symbol} value={symbol} />
          ))}
        </datalist>

        <datalist id="setup-options">
          {setupOptions.map((setup) => (
            <option key={setup} value={setup} />
          ))}
        </datalist>

        <datalist id="session-options">
          {SESSION_OPTIONS.map((session) => (
            <option key={session} value={session} />
          ))}
        </datalist>

        {symbolOptions.length > 0 && (
          <div className="quick-row">
            <p className="quick-label">Recent symbols</p>
            <div className="quick-chips">
              {symbolOptions.slice(0, 8).map((symbol) => (
                <button key={symbol} type="button" className="chip-btn" onClick={() => onUpdateForm('symbol', symbol)}>
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {symbolOptions.length === 0 && <p className="empty-inline">No recent symbols yet. Save one trade to start building shortcuts.</p>}

        {setupOptions.length > 0 && (
          <div className="quick-row">
            <p className="quick-label">Recent setups</p>
            <div className="quick-chips">
              {setupOptions.slice(0, 8).map((setup) => (
                <button key={setup} type="button" className="chip-btn" onClick={() => onUpdateForm('setup', setup)}>
                  {setup}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="quick-row">
          <p className="quick-label">Playbook setups</p>
          <div className="quick-chips">
            {SETUP_PLAYBOOK.map((setup) => (
              <button key={setup.id} type="button" className="chip-btn" onClick={() => onUpdateForm('setup', setup.name)}>
                {setup.name}
              </button>
            ))}
          </div>
        </div>

        <div className="quick-row">
          <p className="quick-label">Common setups</p>
          <div className="quick-chips">
            {COMMON_SETUPS.map((setup) => (
              <button key={setup} type="button" className="chip-btn" onClick={() => onUpdateForm('setup', setup)}>
                {setup}
              </button>
            ))}
          </div>
        </div>

        {selectedPlaybook && (
          <article className="playbook-context-card">
            <h4>{selectedPlaybook.name} Playbook</h4>
            <p>{selectedPlaybook.description}</p>
            <div className="playbook-context-grid">
              <div>
                <small>Entry Criteria</small>
                <p>{selectedPlaybook.entryCriteria}</p>
              </div>
              <div>
                <small>Invalidation</small>
                <p>{selectedPlaybook.invalidationCriteria}</p>
              </div>
            </div>
            <small className="playbook-note">{selectedPlaybook.notes}</small>
          </article>
        )}

        <div className="form-section">
          <div className="section-head">
            <h3>Execution</h3>
          </div>
          <div className="grid three-col compact-grid">
            <label>
              Entry
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.entryPrice || ''}
                onChange={(e) => onUpdateForm('entryPrice', Number(e.target.value))}
                required
              />
            </label>
            <label>
              Exit
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.exitPrice || ''}
                onChange={(e) => onUpdateForm('exitPrice', Number(e.target.value))}
                required
              />
            </label>
            <label>
              {quantityLabel.charAt(0).toUpperCase() + quantityLabel.slice(1)}
              <input
                type="number"
                min="1"
                step="1"
                value={form.quantity || ''}
                onChange={(e) => onUpdateForm('quantity', Number(e.target.value))}
                required
              />
            </label>
          </div>

          <div className="grid two-col compact-grid">
            <label>
              Fees ($)
              <input type="number" min="0" step="0.01" value={form.fees} onChange={(e) => onUpdateForm('fees', Number(e.target.value))} />
            </label>
            <label>
              Duration Minutes
              <input
                type="number"
                min="0"
                step="1"
                value={form.durationMin || ''}
                onChange={(e) => onUpdateForm('durationMin', Number(e.target.value))}
              />
            </label>
          </div>

          <div className="grid two-col compact-grid">
            <label>
              Duration Seconds
              <input
                type="number"
                min="0"
                max="59"
                step="1"
                value={form.durationSec || ''}
                onChange={(e) => onUpdateForm('durationSec', Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="section-head">
            <h3>Outcome</h3>
          </div>
          <div className="outcome-preview">
            <span>Net P&amp;L</span>
            <strong className={netPnlPreview >= 0 ? 'pnl-positive' : 'pnl-negative'}>{Number.isFinite(netPnlPreview) ? `$${netPnlPreview.toFixed(2)}` : '$0.00'}</strong>
          </div>
          {netPnlPreviewError && <p className="form-error">{netPnlPreviewError}</p>}
          <div className="grid two-col compact-grid">
            <label>
              P&amp;L High ($)
              <input
                type="number"
                step="0.01"
                value={form.pnlHigh || ''}
                onChange={(e) => onUpdateForm('pnlHigh', Number(e.target.value))}
                placeholder="Optional"
              />
            </label>
            <label>
              P&amp;L Low ($)
              <input
                type="number"
                step="0.01"
                value={form.pnlLow || ''}
                onChange={(e) => onUpdateForm('pnlLow', Number(e.target.value))}
                placeholder="Optional"
              />
            </label>
          </div>

          <label>
            Confidence ({form.confidence}/5)
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={form.confidence}
              onChange={(e) => onUpdateForm('confidence', Number(e.target.value))}
            />
          </label>
        </div>

        <div className="form-section">
          <div className="section-head">
            <h3>Reflection</h3>
          </div>

          <div className="discipline-grid">
            <button type="button" className={`discipline-chip ${form.setupWasValid ? 'active' : ''}`} onClick={() => onUpdateForm('setupWasValid', !form.setupWasValid)}>
              Setup was valid
            </button>
            <button
              type="button"
              className={`discipline-chip ${form.waitedForConfirmation ? 'active' : ''}`}
              onClick={() => onUpdateForm('waitedForConfirmation', !form.waitedForConfirmation)}
            >
              Waited for confirmation
            </button>
            <button type="button" className={`discipline-chip ${form.riskWasDefined ? 'active' : ''}`} onClick={() => onUpdateForm('riskWasDefined', !form.riskWasDefined)}>
              Risk was defined
            </button>
            <button type="button" className={`discipline-chip ${form.followedPlan ? 'active' : ''}`} onClick={() => onUpdateForm('followedPlan', !form.followedPlan)}>
              Followed plan
            </button>
          </div>

          <label>
            Notes
            <textarea rows={3} placeholder="Execution notes, emotions, mistakes..." value={form.notes} onChange={(e) => onUpdateForm('notes', e.target.value)} />
          </label>

          <div className="toggle-row" role="group" aria-label="Rule followed">
            <span>Rule Followed</span>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-chip ${form.ruleFollowed ? 'active' : ''}`}
                onClick={() => onUpdateForm('ruleFollowed', true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`toggle-chip ${!form.ruleFollowed ? 'active' : ''}`}
                onClick={() => onUpdateForm('ruleFollowed', false)}
              >
                No
              </button>
            </div>
          </div>

          <div className="toggle-row" role="group" aria-label="Broke rules">
            <span>Broke Rules</span>
            <div className="toggle-group">
              <button type="button" className={`toggle-chip ${!form.brokeRules ? 'active' : ''}`} onClick={() => onUpdateForm('brokeRules', false)}>
                No
              </button>
              <button type="button" className={`toggle-chip ${form.brokeRules ? 'active' : ''}`} onClick={() => onUpdateForm('brokeRules', true)}>
                Yes
              </button>
            </div>
          </div>

          <div className="quick-row">
            <p className="quick-label">Emotion Tags</p>
            <div className="quick-chips">
              {EMOTION_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chip-btn chip-select ${form.emotionTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag('emotionTags', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="quick-row">
            <p className="quick-label">Mistake Tags</p>
            <div className="quick-chips">
              {MISTAKE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chip-btn chip-select ${form.mistakeTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag('mistakeTags', tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="trade-save-button">
            <span className="trade-save-button__icon-wrapper">
              <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="trade-save-button__icon-svg" width="10" aria-hidden="true">
                <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
              </svg>
              <svg
                viewBox="0 0 14 15"
                fill="none"
                width="10"
                xmlns="http://www.w3.org/2000/svg"
                className="trade-save-button__icon-svg trade-save-button__icon-svg--copy"
                aria-hidden="true"
              >
                <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
              </svg>
            </span>
            Save Trade
          </button>
          <button type="submit" className="btn ghost" data-submit-mode="add-another">
            Save and Add Another
          </button>
          <button type="button" className="btn ghost" onClick={onDuplicateLast} disabled={!canDuplicate}>
            Duplicate Last Trade
          </button>
          <button type="button" className="btn ghost" onClick={onReset}>
            Clear Form
          </button>
          <button type="button" className="btn ghost" onClick={onLoadSample}>
            Load Sample Data
          </button>
        </div>
      </form>
    </section>
  )
}

export default TradeEntryPanel
