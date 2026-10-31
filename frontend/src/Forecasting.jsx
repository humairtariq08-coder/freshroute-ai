import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { BarChart3, Boxes, Package, RefreshCw, Sparkles, TrendingUp, Users } from 'lucide-react'
import {
  Alert, Badge, Card, CardHead, Disclaimer, PageHeader, StatCard,
} from './components/ui.jsx'
import {
  askGemma, assistantPayload, demandByProduce, fmt, forecastSnapshot, supplyByCategory,
} from './lib/data.js'

export default function Forecasting({ data, loading, reload }) {
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState('')
  const products = data?.products || []
  const requirements = data?.requirements || []
  const summary = data?.summary || {}
  const snapshot = forecastSnapshot(data?.history)
  const supplyRows = useMemo(() => supplyByCategory(products), [products])
  const demandRows = useMemo(() => demandByProduce(requirements), [requirements])
  const trend = snapshot.daily.map((row) => ({
    date: String(row.date).slice(5),
    demand: Math.round(row.demand),
    baseline: snapshot.mean == null ? 0 : Math.round(snapshot.mean),
  }))

  async function explain() {
    setBusy(true)
    setError('')
    setAnswer(null)
    try {
      setAnswer(await askGemma('forecast', assistantPayload('forecast', data)))
    } catch (caught) {
      setError(caught.name === 'TimeoutError' ? 'The hosted model timed out. Retry shortly.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Analytics"
        title="Demand Forecasting"
        subtitle="Understand recorded demand, listed supply and the transparent demo baseline."
        actions={(
          <>
            <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}><RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh</button>
            <button type="button" className="btn btn-primary" onClick={explain} disabled={busy || !products.length}><Sparkles size={14} />{busy ? 'Asking Gemma…' : 'Explain with Gemma'}</button>
          </>
        )}
      />

      <div className="stats-grid">
        <StatCard icon={Package} tone="green" label="Listed Supply" value={`${fmt(summary.available_kg)} kg`} sub="Current listing quantities" />
        <StatCard icon={Users} tone="orange" label="Open Demand" value={`${fmt(summary.open_demand_kg)} kg`} sub={`${requirements.length} buyer requirements`} />
        <StatCard icon={TrendingUp} tone="purple" label="Next-day Baseline" value={snapshot.mean == null ? 'No history' : `${fmt(snapshot.mean)} kg`} sub={snapshot.mean == null ? 'Historical data required' : `Mean of ${snapshot.recent.length} recorded days`} />
        <StatCard icon={BarChart3} tone="blue" label="Recorded Orders" value={(data?.orders || []).length} sub="Local reservations, no payment" />
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {answer ? (
        <Card className="answer-card">
          <div className="answer-head"><Sparkles size={16} className="icon-green" />Gemma explanation <Badge tone="gray">{answer.model}</Badge></div>
          <div className="answer-text">{answer.text}</div>
          <p className="inline-note">Generated explanation only. Review before acting.</p>
        </Card>
      ) : null}

      <Card>
        <CardHead icon={TrendingUp} title="Recorded demand trend" subtitle="Seeded demo history with the arithmetic-mean baseline" />
        <div className="card-body">
          <div className="chart-legend">
            <span><i className="dot green" />Recorded demand</span>
            <span><i className="dot orange" />7-day mean</span>
          </div>
          {trend.length ? (
            <div className="chart-box tall">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ea" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#929f95' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#929f95' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value, name) => [`${fmt(value)} kg`, name === 'demand' ? 'Recorded demand' : '7-day mean']} />
                  <Line type="monotone" dataKey="demand" stroke="#15803d" strokeWidth={2.5} dot={{ r: 3, fill: '#15803d' }} />
                  <Line type="monotone" dataKey="baseline" stroke="#f0a24a" strokeWidth={2} strokeDasharray="6 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="chart-empty">No demand history recorded yet.</div>}
          <p className="chart-note">{snapshot.method}</p>
        </div>
      </Card>

      <div className="charts-row">
        <Card>
          <CardHead icon={Boxes} title="Supply by category" subtitle="Available kilograms" />
          <div className="card-body">
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyRows} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ea" />
                  <XAxis dataKey="category" tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${fmt(value)} kg`, 'Supply']} />
                  <Bar dataKey="supply" fill="#3aa655" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        <Card>
          <CardHead icon={Users} title="Buyer demand" subtitle="Open requirements by produce" />
          <div className="card-body">
            {demandRows.length ? (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandRows} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ea" />
                    <XAxis dataKey="produce" tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`${fmt(value)} kg`, 'Demand']} />
                    <Bar dataKey="demand" fill="#f0a24a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="chart-empty">Add a buyer requirement to see demand.</div>}
          </div>
        </Card>
      </div>

      <Disclaimer>Demand history is seeded demonstration data. The baseline is an arithmetic mean, not a trained forecasting model or a validated business forecast.</Disclaimer>
    </div>
  )
}
