import { useState } from 'react'
import { useDashboardData } from '../context/useDashboardData'
import { computePnl, computeRMultiple, emptyTradeInput, formatMistakeTags, normalizeMistakeTags, type TradeInput } from '../domains/trades/model'

function JournalPage() {
  const { addTrade } = useDashboardData()
  const [form, setForm] = useState<TradeInput>(emptyTradeInput)
  const [mistakeInput, setMistakeInput] = useState('')
  const [status, setStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const update = <K extends keyof TradeInput>(key: K, value: TradeInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateComputed = (next: TradeInput) => {
    const pnl = computePnl(next.side, next.entryPrice, next.exitPrice, next.quantity)
    const rMultiple = computeRMultiple(next.pnl || pnl, next.riskAmount)
    setForm({
      ...next,
      pnl,
      rMultiple,
    })
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setStatus('Saving trade...')
    try {
      const finalized = {
        ...form,
        mistakeTags: normalizeMistakeTags(mistakeInput),
      }
      await addTrade(finalized)
      setStatus('Trade saved to database.')
      setForm(emptyTradeInput())
      setMistakeInput('')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save trade.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="dashboard-page">
      <section className="panel-shell">
        <h2>Fast Trade Entry</h2>
        <p className="panel-subtitle">Manual logging optimized for your discretionary process.</p>
      </section>

      <section className="panel-shell">
        <form className="form-grid" onSubmit={submit}>
          <div className="form-cols four">
            <label>Trade Date<input type="date" value={form.tradeDate} onChange={(e) => update('tradeDate', e.target.value)} required /></label>
            <label>Market / Symbol<input value={form.market} onChange={(e) => update('market', e.target.value.toUpperCase())} required /></label>
            <label>Account<input value={form.account} onChange={(e) => update('account', e.target.value)} required /></label>
            <label>Side
              <select value={form.side} onChange={(e) => updateComputed({ ...form, side: e.target.value as TradeInput['side'] })}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </select>
            </label>
          </div>

          <div className="form-cols four">
            <label>Setup Type<input value={form.setupType} onChange={(e) => update('setupType', e.target.value)} required /></label>
            <label>Session<input value={form.session} onChange={(e) => update('session', e.target.value)} required /></label>
            <label>Entry Price<input type="number" step="0.01" value={form.entryPrice} onChange={(e) => updateComputed({ ...form, entryPrice: Number(e.target.value) })} required /></label>
            <label>Exit Price<input type="number" step="0.01" value={form.exitPrice} onChange={(e) => updateComputed({ ...form, exitPrice: Number(e.target.value) })} required /></label>
          </div>

          <div className="form-cols four">
            <label>Stop Loss<input type="number" step="0.01" value={form.stopLoss} onChange={(e) => update('stopLoss', Number(e.target.value))} required /></label>
            <label>Take Profit<input type="number" step="0.01" value={form.takeProfit} onChange={(e) => update('takeProfit', Number(e.target.value))} required /></label>
            <label>Quantity<input type="number" step="0.01" value={form.quantity} onChange={(e) => updateComputed({ ...form, quantity: Number(e.target.value) })} required /></label>
            <label>Risk Amount<input type="number" step="0.01" value={form.riskAmount} onChange={(e) => updateComputed({ ...form, riskAmount: Number(e.target.value) })} required /></label>
          </div>

          <div className="form-cols four">
            <label>P&L<input type="number" step="0.01" value={form.pnl} onChange={(e) => updateComputed({ ...form, pnl: Number(e.target.value) })} required /></label>
            <label>R Multiple<input type="number" step="0.01" value={form.rMultiple} onChange={(e) => update('rMultiple', Number(e.target.value))} required /></label>
            <label>Screenshot Before URL<input value={form.screenshotBefore} onChange={(e) => update('screenshotBefore', e.target.value)} /></label>
            <label>Screenshot After URL<input value={form.screenshotAfter} onChange={(e) => update('screenshotAfter', e.target.value)} /></label>
          </div>

          <label>Notes<textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>

          <h3>Pre-Trade Checklist</h3>
          <div className="check-grid">
            <label><input type="checkbox" checked={form.liquiditySweepPresent} onChange={(e) => update('liquiditySweepPresent', e.target.checked)} /> Liquidity sweep present</label>
            <label><input type="checkbox" checked={form.displacementPresent} onChange={(e) => update('displacementPresent', e.target.checked)} /> Displacement present</label>
            <label><input type="checkbox" checked={form.mssPresent} onChange={(e) => update('mssPresent', e.target.checked)} /> MSS present</label>
            <label><input type="checkbox" checked={form.fvgPresent} onChange={(e) => update('fvgPresent', e.target.checked)} /> FVG present</label>
            <label><input type="checkbox" checked={form.htfBiasAligned} onChange={(e) => update('htfBiasAligned', e.target.checked)} /> HTF bias aligned</label>
            <label><input type="checkbox" checked={form.newsRiskChecked} onChange={(e) => update('newsRiskChecked', e.target.checked)} /> News risk checked</label>
            <label><input type="checkbox" checked={form.aPlusSetup} onChange={(e) => update('aPlusSetup', e.target.checked)} /> A+ setup</label>
            <label><input type="checkbox" checked={form.plannedBeforeEntry} onChange={(e) => update('plannedBeforeEntry', e.target.checked)} /> Planned before entry</label>
          </div>

          <h3>Post-Trade Review</h3>
          <div className="form-cols four">
            <label><input type="checkbox" checked={form.followedPlan} onChange={(e) => update('followedPlan', e.target.checked)} /> Followed plan</label>
            <label>Execution Rating (1-10)<input type="number" min={1} max={10} value={form.executionRating} onChange={(e) => update('executionRating', Number(e.target.value))} required /></label>
            <label>Emotional State<input value={form.emotionalState} onChange={(e) => update('emotionalState', e.target.value)} /></label>
            <label>Would Take Again
              <select value={form.wouldTakeAgain ? 'YES' : 'NO'} onChange={(e) => update('wouldTakeAgain', e.target.value === 'YES')}>
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
          </div>

          <div className="form-cols two">
            <label>Mistake Tags (comma-separated)<input value={mistakeInput || formatMistakeTags(form.mistakeTags)} onChange={(e) => setMistakeInput(e.target.value)} /></label>
            <label>Reason for Exit<input value={form.reasonForExit} onChange={(e) => update('reasonForExit', e.target.value)} /></label>
          </div>

          <div className="button-row">
            <button className="btn primary" type="submit" disabled={isSaving}>Save Trade</button>
            <button className="btn ghost" type="button" onClick={() => { setForm(emptyTradeInput()); setMistakeInput('') }}>Reset</button>
          </div>
        </form>
        {status && <p className="inline-status">{status}</p>}
      </section>
    </main>
  )
}

export default JournalPage
