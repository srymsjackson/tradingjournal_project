import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { EquityCurvePoint } from '../utils/equityCurve'
import { formatMoney } from '../utils/tradeUtils'

type EquityCurveChartProps = {
  data: EquityCurvePoint[]
  accentColor: string
}

type GraphMode = 'equity' | 'daily' | 'drawdown'

type EquityTooltipProps = {
  active?: boolean
  payload?: Array<{ value?: number; payload?: EquityCurvePoint }>
}

const DRAWDOWN_RED = '#db7d70'

const EquityTooltip = ({ active, payload }: EquityTooltipProps) => {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) return null

  const point = payload[0].payload

  return (
    <div className="equity-tooltip">
      <p className="equity-tooltip-date">{point.date}</p>
      <p className="equity-tooltip-value">equity: {formatMoney(point.cumulativePnl)}</p>
      {point.drawdown < 0 && <p className="equity-tooltip-drawdown">drawdown: {formatMoney(point.drawdown)}</p>}
    </div>
  )
}

function EquityCurveChart({ data, accentColor }: EquityCurveChartProps) {
  const [graphMode, setGraphMode] = useState<GraphMode>('equity')

  const graphOptions: Array<{ id: GraphMode; label: string }> = [
    { id: 'equity', label: 'equity' },
    { id: 'daily', label: 'daily p&l' },
    { id: 'drawdown', label: 'drawdown' },
  ]

  const drawdownRanges = useMemo(() => {
    const ranges: Array<{ x1: string; x2: string }> = []
    let start: string | null = null

    for (let i = 0; i < data.length; i += 1) {
      const point = data[i]
      const inDrawdown = point.drawdown < 0

      if (inDrawdown && start === null) {
        start = point.label
      }

      const isLast = i === data.length - 1
      if ((!inDrawdown || isLast) && start !== null) {
        const endLabel = inDrawdown && isLast ? point.label : data[Math.max(i - 1, 0)].label
        ranges.push({ x1: start, x2: endLabel })
        start = null
      }
    }

    return ranges
  }, [data])

  if (data.length === 0) {
    return (
      <div className="equity-empty-state" role="status" aria-live="polite">
        <h5>No trades yet</h5>
        <p>Log your first trades to see cumulative performance over time.</p>
      </div>
    )
  }

  return (
    <div className="equity-chart-layout">
      <div className="chart-shell large">
        <ResponsiveContainer width="100%" height="100%">
          {graphMode === 'equity' ? (
            <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
              {drawdownRanges.map((range, index) => (
                <ReferenceArea key={`${range.x1}-${range.x2}-${index}`} x1={range.x1} x2={range.x2} fill="rgba(212, 107, 95, 0.08)" />
              ))}
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 123, 134, 0.24)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} tickFormatter={(value) => formatMoney(Number(value))} width={84} />
              <Tooltip cursor={{ stroke: 'rgba(120, 123, 134, 0.38)', strokeDasharray: '3 3' }} content={<EquityTooltip />} />
              <Line type="monotone" dataKey="cumulativePnl" stroke={accentColor} strokeWidth={2.2} dot={false} activeDot={{ r: 3 }} name="Cumulative P&L" />
            </LineChart>
          ) : graphMode === 'daily' ? (
            <BarChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 123, 134, 0.24)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} tickFormatter={(value) => formatMoney(Number(value))} width={84} />
              <Tooltip cursor={{ fill: 'rgba(120, 123, 134, 0.08)' }} content={<EquityTooltip />} />
              <Bar dataKey="netPnl" radius={[4, 4, 0, 0]} name="Daily P&L">
                {data.map((entry) => (
                  <Cell key={entry.label} fill={entry.netPnl < 0 ? DRAWDOWN_RED : accentColor} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 123, 134, 0.24)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: '#8d93a1' }} tickLine={false} axisLine={false} tickFormatter={(value) => formatMoney(Number(value))} width={84} />
              <Tooltip cursor={{ stroke: 'rgba(120, 123, 134, 0.38)', strokeDasharray: '3 3' }} content={<EquityTooltip />} />
              <Area type="monotone" dataKey="drawdown" stroke={DRAWDOWN_RED} fill="rgba(219, 125, 112, 0.2)" strokeWidth={2} name="Drawdown" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <aside className="equity-chart-options" role="tablist" aria-label="dashboard graph modes">
        <p>graph type</p>
        <div className="equity-chart-modes">
          {graphOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`equity-mode-btn ${graphMode === option.id ? 'active' : ''}`}
              onClick={() => setGraphMode(option.id)}
              role="tab"
              aria-selected={graphMode === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default EquityCurveChart
