import { useMemo, useState } from 'react'
import { useDashboardData } from '../context/useDashboardData'
import { derivePropAccountStats, emptyPropAccountInput, type PropAccountInput, type PropAccountRecord } from '../domains/accounts/model'

function AccountsPage() {
  const { accounts, addAccount, editAccount, removeAccount, loading } = useDashboardData()
  const [form, setForm] = useState<PropAccountInput>(emptyPropAccountInput)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const updateForm = <K extends keyof PropAccountInput>(key: K, value: PropAccountInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const startEdit = (account: PropAccountRecord) => {
    setEditingId(account.id)
    setForm({
      accountName: account.accountName,
      firm: account.firm,
      accountSize: account.accountSize,
      startingBalance: account.startingBalance,
      currentBalance: account.currentBalance,
      trailingDrawdownType: account.trailingDrawdownType,
      maxDrawdown: account.maxDrawdown,
      dailyLossLimit: account.dailyLossLimit,
      profitTarget: account.profitTarget,
      minPayoutDays: account.minPayoutDays,
      payoutProfitDayThreshold: account.payoutProfitDayThreshold,
      payoutDaysCompleted: account.payoutDaysCompleted,
      status: account.status,
    })
  }

  const reset = () => {
    setEditingId(null)
    setForm(emptyPropAccountInput())
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('Saving account...')
    try {
      if (editingId) {
        await editAccount(editingId, form)
        setStatus('Account updated.')
      } else {
        await addAccount(form)
        setStatus('Account created.')
      }
      reset()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save account.')
    }
  }

  const sorted = useMemo(() => accounts.slice().sort((a, b) => a.accountName.localeCompare(b.accountName)), [accounts])

  return (
    <main className="dashboard-page">
      <section className="panel-shell">
        <h2>Prop Account Tracker</h2>
        <p className="panel-subtitle">Track constraints, payout progress, and safety mode for each account.</p>
      </section>

      <section className="panel-shell">
        <h3>{editingId ? 'Edit Account' : 'Add Account'}</h3>
        <form className="form-grid" onSubmit={submit}>
          <div className="form-cols three">
            <label>Account Name<input value={form.accountName} onChange={(e) => updateForm('accountName', e.target.value)} required /></label>
            <label>Firm<input value={form.firm} onChange={(e) => updateForm('firm', e.target.value)} required /></label>
            <label>Status
              <select value={form.status} onChange={(e) => updateForm('status', e.target.value as PropAccountInput['status'])}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </label>
          </div>
          <div className="form-cols four">
            <label>Account Size<input type="number" value={form.accountSize} onChange={(e) => updateForm('accountSize', Number(e.target.value))} required /></label>
            <label>Starting Balance<input type="number" value={form.startingBalance} onChange={(e) => updateForm('startingBalance', Number(e.target.value))} required /></label>
            <label>Current Balance<input type="number" value={form.currentBalance} onChange={(e) => updateForm('currentBalance', Number(e.target.value))} required /></label>
            <label>Trailing Drawdown Type<input value={form.trailingDrawdownType} onChange={(e) => updateForm('trailingDrawdownType', e.target.value)} required /></label>
          </div>
          <div className="form-cols four">
            <label>Max Drawdown<input type="number" value={form.maxDrawdown} onChange={(e) => updateForm('maxDrawdown', Number(e.target.value))} required /></label>
            <label>Daily Loss Limit<input type="number" value={form.dailyLossLimit} onChange={(e) => updateForm('dailyLossLimit', Number(e.target.value))} required /></label>
            <label>Profit Target<input type="number" value={form.profitTarget} onChange={(e) => updateForm('profitTarget', Number(e.target.value))} required /></label>
            <label>Min Payout Days<input type="number" value={form.minPayoutDays} onChange={(e) => updateForm('minPayoutDays', Number(e.target.value))} required /></label>
          </div>
          <div className="form-cols three">
            <label>Profit-Day Threshold<input type="number" value={form.payoutProfitDayThreshold} onChange={(e) => updateForm('payoutProfitDayThreshold', Number(e.target.value))} required /></label>
            <label>Payout Days Completed<input type="number" value={form.payoutDaysCompleted} onChange={(e) => updateForm('payoutDaysCompleted', Number(e.target.value))} required /></label>
            <label>Mode<input value={derivePropAccountStats({ ...form, id: 'draft', userId: 'draft', createdAt: '', updatedAt: '' }).mode} disabled /></label>
          </div>
          <div className="button-row">
            <button className="btn primary" type="submit">{editingId ? 'Update Account' : 'Create Account'}</button>
            {editingId && <button className="btn ghost" type="button" onClick={reset}>Cancel</button>}
          </div>
        </form>
        {status && <p className="inline-status">{status}</p>}
      </section>

      <section className="panel-shell">
        <h3>Tracked Accounts</h3>
        {loading ? (
          <p className="empty-state">Loading accounts...</p>
        ) : sorted.length === 0 ? (
          <p className="empty-state">No accounts saved yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Firm</th>
                  <th>Safety Buffer</th>
                  <th>Distance To DD</th>
                  <th>Target Left</th>
                  <th>Payout Progress</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((account) => {
                  const derived = derivePropAccountStats(account)
                  return (
                    <tr key={account.id}>
                      <td>{account.accountName}</td>
                      <td>{account.firm}</td>
                      <td>${derived.safetyBuffer.toFixed(2)}</td>
                      <td>${derived.distanceToDrawdown.toFixed(2)}</td>
                      <td>${derived.amountToTarget.toFixed(2)}</td>
                      <td>{derived.payoutEligibilityProgress.toFixed(1)}%</td>
                      <td>
                        <span className={`status-tag ${derived.mode === 'DEFENSIVE' ? 'warn' : 'ok'}`}>{account.status} / {derived.mode}</span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          <button className="btn ghost" type="button" onClick={() => startEdit(account)}>Edit</button>
                          <button className="btn danger" type="button" onClick={() => void removeAccount(account.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AccountsPage
