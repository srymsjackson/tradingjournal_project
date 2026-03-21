import { useMemo, useState } from 'react'
import { useDashboardData } from '../context/useDashboardData'
import { normalizeMistakeTags, type TradeRecord } from '../domains/trades/model'

function ReviewPage() {
  const { trades, editTrade, removeTrade, loading } = useDashboardData()
  const [dateFilter, setDateFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [marketFilter, setMarketFilter] = useState('ALL')
  const [setupFilter, setSetupFilter] = useState('ALL')
  const [sessionFilter, setSessionFilter] = useState('ALL')
  const [sideFilter, setSideFilter] = useState('ALL')
  const [ruleFilter, setRuleFilter] = useState('ALL')
  const [mistakeFilter, setMistakeFilter] = useState('ALL')
  const [selectedTrade, setSelectedTrade] = useState<TradeRecord | null>(null)
  const [detailStatus, setDetailStatus] = useState('')

  const options = useMemo(() => {
    const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean))).sort()
    return {
      account: unique(trades.map((trade) => trade.account)),
      market: unique(trades.map((trade) => trade.market)),
      setup: unique(trades.map((trade) => trade.setupType)),
      session: unique(trades.map((trade) => trade.session)),
      mistake: unique(trades.flatMap((trade) => trade.mistakeTags)),
    }
  }, [trades])

  const visible = useMemo(
    () =>
      trades.filter((trade) => {
        if (dateFilter && trade.tradeDate !== dateFilter) return false
        if (accountFilter !== 'ALL' && trade.account !== accountFilter) return false
        if (marketFilter !== 'ALL' && trade.market !== marketFilter) return false
        if (setupFilter !== 'ALL' && trade.setupType !== setupFilter) return false
        if (sessionFilter !== 'ALL' && trade.session !== sessionFilter) return false
        if (sideFilter !== 'ALL' && trade.side !== sideFilter) return false
        if (ruleFilter !== 'ALL') {
          const wanted = ruleFilter === 'YES'
          if (trade.followedPlan !== wanted) return false
        }
        if (mistakeFilter !== 'ALL' && !trade.mistakeTags.includes(mistakeFilter)) return false
        return true
      }),
    [trades, dateFilter, accountFilter, marketFilter, setupFilter, sessionFilter, sideFilter, ruleFilter, mistakeFilter],
  )

  const updateSelected = <K extends keyof TradeRecord>(key: K, value: TradeRecord[K]) => {
    if (!selectedTrade) return
    setSelectedTrade({ ...selectedTrade, [key]: value })
  }

  const saveSelected = async () => {
    if (!selectedTrade) return
    setDetailStatus('Saving trade...')
    try {
      await editTrade(selectedTrade.id, {
        tradeDate: selectedTrade.tradeDate,
        market: selectedTrade.market,
        account: selectedTrade.account,
        side: selectedTrade.side,
        setupType: selectedTrade.setupType,
        session: selectedTrade.session,
        entryPrice: selectedTrade.entryPrice,
        exitPrice: selectedTrade.exitPrice,
        stopLoss: selectedTrade.stopLoss,
        takeProfit: selectedTrade.takeProfit,
        quantity: selectedTrade.quantity,
        riskAmount: selectedTrade.riskAmount,
        pnl: selectedTrade.pnl,
        rMultiple: selectedTrade.rMultiple,
        screenshotBefore: selectedTrade.screenshotBefore,
        screenshotAfter: selectedTrade.screenshotAfter,
        notes: selectedTrade.notes,
        liquiditySweepPresent: selectedTrade.liquiditySweepPresent,
        displacementPresent: selectedTrade.displacementPresent,
        mssPresent: selectedTrade.mssPresent,
        fvgPresent: selectedTrade.fvgPresent,
        htfBiasAligned: selectedTrade.htfBiasAligned,
        newsRiskChecked: selectedTrade.newsRiskChecked,
        aPlusSetup: selectedTrade.aPlusSetup,
        plannedBeforeEntry: selectedTrade.plannedBeforeEntry,
        followedPlan: selectedTrade.followedPlan,
        executionRating: selectedTrade.executionRating,
        emotionalState: selectedTrade.emotionalState,
        mistakeTags: selectedTrade.mistakeTags,
        reasonForExit: selectedTrade.reasonForExit,
        wouldTakeAgain: selectedTrade.wouldTakeAgain,
      })
      setDetailStatus('Trade updated.')
    } catch (error) {
      setDetailStatus(error instanceof Error ? error.message : 'Unable to update trade.')
    }
  }

  return (
    <main className="dashboard-page">
      <section className="panel-shell">
        <h2>Trade History</h2>
        <p className="panel-subtitle">Filter and review execution with full persistence.</p>
      </section>

      <section className="panel-shell">
        <div className="form-cols four">
          <label>Date<input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} /></label>
          <label>Account<select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}><option value="ALL">All</option>{options.account.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Market<select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}><option value="ALL">All</option>{options.market.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Setup<select value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}><option value="ALL">All</option>{options.setup.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        <div className="form-cols four">
          <label>Session<select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}><option value="ALL">All</option>{options.session.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Side<select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)}><option value="ALL">All</option><option value="LONG">Long</option><option value="SHORT">Short</option></select></label>
          <label>Rule Followed<select value={ruleFilter} onChange={(e) => setRuleFilter(e.target.value)}><option value="ALL">All</option><option value="YES">Yes</option><option value="NO">No</option></select></label>
          <label>Mistake Tag<select value={mistakeFilter} onChange={(e) => setMistakeFilter(e.target.value)}><option value="ALL">All</option>{options.mistake.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </section>

      <section className="panel-shell">
        {loading ? (
          <p className="empty-state">Loading trades...</p>
        ) : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Market</th>
                  <th>Account</th>
                  <th>Side</th>
                  <th>Setup</th>
                  <th>P&L</th>
                  <th>Rule</th>
                  <th>Mistakes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.tradeDate}</td>
                    <td>{trade.market}</td>
                    <td>{trade.account}</td>
                    <td>{trade.side}</td>
                    <td>{trade.setupType}</td>
                    <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>${trade.pnl.toFixed(2)}</td>
                    <td>{trade.followedPlan ? 'Yes' : 'No'}</td>
                    <td>{trade.mistakeTags.join(', ') || '-'}</td>
                    <td>
                      <div className="inline-actions">
                        <button className="btn ghost" type="button" onClick={() => setSelectedTrade(trade)}>Review</button>
                        <button className="btn danger" type="button" onClick={() => void removeTrade(trade.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTrade && (
        <section className="panel-shell">
          <div className="panel-row">
            <h3>Trade Detail Review</h3>
            <button className="btn ghost" type="button" onClick={() => setSelectedTrade(null)}>Close</button>
          </div>
          <div className="form-cols four">
            <label>Followed Plan<input type="checkbox" checked={selectedTrade.followedPlan} onChange={(e) => updateSelected('followedPlan', e.target.checked)} /></label>
            <label>Execution Rating<input type="number" min={1} max={10} value={selectedTrade.executionRating} onChange={(e) => updateSelected('executionRating', Number(e.target.value))} /></label>
            <label>Emotional State<input value={selectedTrade.emotionalState} onChange={(e) => updateSelected('emotionalState', e.target.value)} /></label>
            <label>Would Take Again<input type="checkbox" checked={selectedTrade.wouldTakeAgain} onChange={(e) => updateSelected('wouldTakeAgain', e.target.checked)} /></label>
          </div>
          <div className="form-cols two">
            <label>Mistake Tags<input value={selectedTrade.mistakeTags.join(', ')} onChange={(e) => updateSelected('mistakeTags', normalizeMistakeTags(e.target.value))} /></label>
            <label>Reason for Exit<input value={selectedTrade.reasonForExit} onChange={(e) => updateSelected('reasonForExit', e.target.value)} /></label>
          </div>
          <label>Notes<textarea rows={3} value={selectedTrade.notes} onChange={(e) => updateSelected('notes', e.target.value)} /></label>
          <div className="button-row">
            <button className="btn primary" type="button" onClick={() => void saveSelected()}>Save Review Changes</button>
          </div>
          {detailStatus && <p className="inline-status">{detailStatus}</p>}
        </section>
      )}
    </main>
  )
}

export default ReviewPage
