import { useEffect, useState } from 'react'
import { ArrowRight, Link2, Package, RefreshCw, Sparkles, Users, Zap } from 'lucide-react'
import {
  Alert, Badge, Card, Disclaimer, EmptyState, PageHeader, Spinner, StatCard,
} from './components/ui.jsx'
import { API, askGemma, assistantPayload, fmt, fmtPKR } from './lib/data.js'

export default function Matching({ data }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [aiError, setAiError] = useState('')
  const products = data?.products || []
  const requirements = data?.requirements || []

  async function loadMatches() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/matches`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setMatches(await response.json())
    } catch {
      setError('Could not load matches. Confirm the backend is running.')
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMatches() }, [])

  async function explain() {
    setBusy(true)
    setAiError('')
    setAnswer(null)
    try {
      setAnswer(await askGemma('matching', assistantPayload('matching', data)))
    } catch (caught) {
      setAiError(caught.name === 'TimeoutError' ? 'The hosted model timed out. Retry shortly.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Supply-demand matching"
        title="Smart Matching"
        subtitle="Compatible farmer listings and buyer requirements, scored by available quantity."
        actions={(
          <>
            <button type="button" className="btn btn-outline" onClick={loadMatches} disabled={loading}><RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh</button>
            <button type="button" className="btn btn-primary" onClick={explain} disabled={busy || !products.length}><Sparkles size={14} />{busy ? 'Asking Gemma…' : 'Explain with Gemma'}</button>
          </>
        )}
      />

      <div className="stats-grid">
        <StatCard icon={Link2} tone="green" label="Compatible Pairs" value={matches.length} sub="Name + budget compatible" />
        <StatCard icon={Users} tone="orange" label="Buyer Requirements" value={requirements.length} sub="Stored purchasing needs" />
        <StatCard icon={Package} tone="blue" label="Available Listings" value={products.filter((product) => product.quantity > 0).length} sub="Listings with remaining stock" />
        <StatCard icon={Zap} tone="purple" label="Matching Method" value="Rules" sub="Deterministic, not AI" />
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {aiError ? <Alert>{aiError}</Alert> : null}
      {answer ? (
        <Card className="answer-card">
          <div className="answer-head"><Sparkles size={16} className="icon-green" />Gemma explanation <Badge tone="gray">{answer.model}</Badge></div>
          <div className="answer-text">{answer.text}</div>
          <p className="inline-note">AI explanation of stored records. Matches are calculated by the backend, not by the model.</p>
        </Card>
      ) : null}

      {loading ? <Spinner label="Finding compatible pairs…" /> : null}
      {!loading && !matches.length ? (
        <Card>
          <EmptyState icon={Link2} title="No compatible pairs yet">
            Add buyer requirements whose produce name and budget match an available listing. Matches appear automatically.
          </EmptyState>
        </Card>
      ) : (
        <div className="match-grid">
          {matches.map((match, index) => {
            const score = Number(match.score || 0)
            return (
              <Card className="match-card" key={`${match.product?.id}-${match.requirement?.id}-${index}`}>
                <div className="match-head">
                  <Badge tone="green"><Zap size={10} /> Deterministic match</Badge>
                  <div className="score"><span>Score</span><strong>{score}%</strong></div>
                </div>
                <div className="score-bar"><i style={{ width: `${score}%` }} /></div>
                <h3>{match.product?.name}</h3>
                <div className="match-route">
                  <div>
                    <span>Farmer</span>
                    <strong>{match.product?.farmer}</strong>
                    <small>{match.product?.location}</small>
                  </div>
                  <ArrowRight size={17} className="icon-green" />
                  <div className="align-right">
                    <span>Buyer</span>
                    <strong>{match.requirement?.buyer}</strong>
                    <small>{match.requirement?.location}</small>
                  </div>
                </div>
                <div className="match-metrics">
                  <div><span>Fulfillable</span><strong>{fmt(match.quantity)} kg</strong></div>
                  <div><span>Price</span><strong>{fmtPKR(match.product?.price)}/kg</strong></div>
                  <div><span>Savings</span><strong>{fmtPKR(match.savings)}</strong></div>
                </div>
                {match.demo ? <div className="demo-tag">Demo records</div> : null}
              </Card>
            )
          })}
        </div>
      )}

      <Disclaimer>Matches are independent candidate pairs, not reserved allocations. A listing can appear more than once; placing an order rechecks stock atomically. Score = available quantity ÷ requested quantity.</Disclaimer>
    </div>
  )
}
