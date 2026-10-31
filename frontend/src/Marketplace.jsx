import { useEffect, useState, useCallback } from 'react'
import {
  ShoppingCart, Package, Users, TrendingUp, Plus, X, CheckCircle,
  AlertCircle, Loader2, Search, Filter, MapPin, Clock, Star,
  ArrowRight, Zap, RefreshCw, ChevronDown, Leaf, Tag, ShoppingBag,
  BarChart3, Link2, Truck, Boxes, Sparkles
} from 'lucide-react'

const API = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

const fmt = (v, d = 1) => Number(v || 0).toLocaleString('en-PK', { maximumFractionDigits: d })
const fmtPKR = (v) => `PKR ${fmt(v, 0)}`

const CATEGORY_COLORS = {
  Vegetables: { bg: 'rgba(0,232,122,0.1)', border: 'rgba(0,232,122,0.25)', text: '#00e87a', dot: '#00e87a' },
  Fruits: { bg: 'rgba(255,180,50,0.1)', border: 'rgba(255,180,50,0.25)', text: '#ffb432', dot: '#ffb432' },
  'Leafy greens': { bg: 'rgba(0,255,210,0.1)', border: 'rgba(0,255,210,0.25)', text: '#00ffd2', dot: '#00ffd2' },
  Grains: { bg: 'rgba(200,150,80,0.1)', border: 'rgba(200,150,80,0.25)', text: '#c89650', dot: '#c89650' },
}

const PRODUCE_EMOJI = {
  tomatoes: '🍅', spinach: '🥬', mango: '🥭', potatoes: '🥔',
  onions: '🧅', carrots: '🥕', cucumber: '🥒', bananas: '🍌',
  peppers: '🌶️', herbs: '🌿', rice: '🌾', oranges: '🍊',
}

function getEmoji(image) {
  return PRODUCE_EMOJI[image?.toLowerCase()] || '🥬'
}

function freshnessBadge(days) {
  if (days <= 2) return { label: 'Ultra Fresh', color: '#00e87a', bg: 'rgba(0,232,122,0.12)' }
  if (days <= 5) return { label: 'Very Fresh', color: '#00ffd2', bg: 'rgba(0,255,210,0.1)' }
  if (days <= 14) return { label: 'Fresh', color: '#ffb432', bg: 'rgba(255,180,50,0.1)' }
  return { label: 'Long Shelf', color: '#a0d4b5', bg: 'rgba(160,212,181,0.1)' }
}

/* ─────────────── TOAST ─────────────── */
function Toast({ toasts, remove }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} className="mp-toast" style={{ borderColor: t.type === 'error' ? '#ff4d6d' : '#00e87a' }}>
          <span>{t.type === 'error' ? <AlertCircle size={15} color="#ff4d6d" /> : <CheckCircle size={15} color="#00e87a" />}</span>
          <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8f7a', padding: 0 }}><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

/* ─────────────── STAT CARD ─────────────── */
function StatCard({ icon: Icon, label, value, sub, color = '#00e87a' }) {
  return (
    <div className="mp-stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#6b8f7a', background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.12)', borderRadius: 6, padding: '2px 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>LIVE</span>
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="mp-stat-value" style={{ color }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5ee', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#6b8f7a', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ─────────────── PRODUCT CARD ─────────────── */
function ProductCard({ product, onOrder }) {
  const [qty, setQty] = useState(1)
  const [buyer, setBuyer] = useState('')
  const [open, setOpen] = useState(false)
  const cat = CATEGORY_COLORS[product.category] || CATEGORY_COLORS.Vegetables
  const fresh = freshnessBadge(product.freshness_days)

  return (
    <article className="mp-product-card" aria-label={product.name}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 48, lineHeight: 1 }}>{getEmoji(product.image)}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="mp-badge" style={{ background: cat.bg, borderColor: cat.border, color: cat.text }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.dot }} />
            {product.category}
          </span>
          <span className="mp-badge" style={{ background: fresh.bg, borderColor: `${fresh.color}30`, color: fresh.color }}>
            <Clock size={10} /> {fresh.label}
          </span>
        </div>
      </div>

      {/* Name & farmer */}
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#e8f5ee', letterSpacing: '-0.02em' }}>{product.name}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b8f7a', marginBottom: 12 }}>
        <MapPin size={11} color="#00e87a" />
        <span>{product.farmer} · {product.location}</span>
      </div>

      {product.description && (
        <p style={{ fontSize: 12, color: '#6b8f7a', lineHeight: 1.6, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description}
        </p>
      )}

      {/* Price row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(0,232,122,0.08)', borderBottom: '1px solid rgba(0,232,122,0.08)', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00e87a', fontFamily: 'Space Grotesk, sans-serif' }}>
            {fmtPKR(product.price)}<span style={{ fontSize: 12, fontWeight: 500, color: '#6b8f7a' }}>/kg</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#6b8f7a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Available</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: product.quantity > 0 ? '#e8f5ee' : '#ff4d6d' }}>
            {fmt(product.quantity)} kg
          </div>
        </div>
      </div>

      {/* Freshness bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b8f7a', marginBottom: 5 }}>
          <span>Shelf life</span>
          <span>{product.freshness_days}d remaining</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${Math.min(100, (product.freshness_days / 30) * 100)}%`,
            background: fresh.color,
            transition: 'width 0.6s ease'
          }} />
        </div>
      </div>

      {/* Order section */}
      {product.quantity > 0 ? (
        !open ? (
          <button className="mp-btn-primary" style={{ width: '100%' }} onClick={() => setOpen(true)} id={`order-btn-${product.id}`}>
            <ShoppingCart size={15} /> Place Order
          </button>
        ) : (
          <div className="mp-order-form">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="number" min={0.1} max={product.quantity} step={0.1} value={qty}
                onChange={e => setQty(Math.min(product.quantity, Math.max(0.1, parseFloat(e.target.value) || 0.1)))}
                className="mp-input" style={{ flex: 1 }} placeholder="Qty (kg)"
                id={`qty-${product.id}`}
              />
              <input
                type="text" value={buyer} onChange={e => setBuyer(e.target.value)}
                className="mp-input" style={{ flex: 2 }} placeholder="Your name / business"
                id={`buyer-${product.id}`}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 12, color: '#a0d4b5' }}>
              <span>Total: <strong style={{ color: '#00e87a' }}>{fmtPKR(qty * product.price)}</strong></span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#6b8f7a', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            </div>
            <button
              className="mp-btn-primary" style={{ width: '100%' }}
              disabled={!buyer.trim() || qty <= 0}
              onClick={() => { onOrder(product.id, qty, buyer.trim()); setOpen(false); setBuyer(''); setQty(1) }}
              id={`confirm-order-${product.id}`}
            >
              <CheckCircle size={15} /> Confirm — {fmtPKR(qty * product.price)}
            </button>
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '10px', fontSize: 12, color: '#ff4d6d', background: 'rgba(255,77,109,0.08)', borderRadius: 10, border: '1px solid rgba(255,77,109,0.2)' }}>
          Out of Stock
        </div>
      )}

      {product.demo && (
        <div style={{ marginTop: 10, fontSize: 10, color: '#6b8f7a', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Demo listing
        </div>
      )}
    </article>
  )
}

/* ─────────────── ADD PRODUCT MODAL ─────────────── */
function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '', category: 'Vegetables', farmer: '', location: 'Karachi',
    price: '', quantity: '', freshness_days: 3, description: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const field = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    className: 'mp-input',
    style: { width: '100%' }
  })

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), quantity: parseFloat(form.quantity), freshness_days: parseInt(form.freshness_days) })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Failed to add product')
      onAdded(json)
      onClose()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="add-product-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 id="add-product-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e8f5ee', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={20} color="#00e87a" /> List New Produce
          </h2>
          <button onClick={onClose} className="mp-icon-btn" aria-label="Close"><X size={18} /></button>
        </div>
        {error && <div className="mp-alert-error" role="alert">{error}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mp-label">Produce name <input {...field('name')} required minLength={2} maxLength={80} placeholder="e.g. Vine tomatoes" id="prod-name" /></label>
            <label className="mp-label">Category
              <select {...field('category')} className="mp-input" style={{ width: '100%' }} id="prod-cat">
                {['Vegetables', 'Fruits', 'Leafy greens', 'Grains'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mp-label">Farmer / Grower <input {...field('farmer')} required minLength={2} maxLength={80} placeholder="Farm or grower name" id="prod-farmer" /></label>
            <label className="mp-label">Location <input {...field('location')} required minLength={2} maxLength={80} placeholder="City / District" id="prod-location" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="mp-label">Price (PKR/kg) <input {...field('price')} type="number" min={1} step={0.01} required placeholder="e.g. 140" id="prod-price" /></label>
            <label className="mp-label">Quantity (kg) <input {...field('quantity')} type="number" min={0.1} step={0.1} required placeholder="e.g. 500" id="prod-qty" /></label>
            <label className="mp-label">Shelf life (days) <input {...field('freshness_days')} type="number" min={1} max={365} required id="prod-days" /></label>
          </div>
          <label className="mp-label">Description (optional)
            <textarea {...field('description')} rows={3} maxLength={2000} placeholder="Brief description of the produce…" style={{ ...field('description').style, resize: 'vertical', fontFamily: 'inherit' }} id="prod-desc" />
          </label>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="mp-btn-ghost">Cancel</button>
            <button type="submit" className="mp-btn-primary" disabled={busy} id="submit-product">
              {busy ? <><Loader2 size={15} className="spin" /> Adding…</> : <><Plus size={15} /> List Produce</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────── ADD REQUIREMENT MODAL ─────────────── */
function AddRequirementModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ buyer: '', produce: '', quantity: '', max_price: '', location: 'Karachi' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const field = (key) => ({
    value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
    className: 'mp-input', style: { width: '100%' }
  })

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const res = await fetch(`${API}/api/requirements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity), max_price: parseFloat(form.max_price) })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Failed to post requirement')
      onAdded(json); onClose()
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="mp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="add-req-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 id="add-req-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e8f5ee', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingBag size={20} color="#ffb432" /> Post Buying Requirement
          </h2>
          <button onClick={onClose} className="mp-icon-btn" aria-label="Close"><X size={18} /></button>
        </div>
        {error && <div className="mp-alert-error" role="alert">{error}</div>}
        <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mp-label">Buyer / Business name <input {...field('buyer')} required minLength={2} maxLength={80} placeholder="Your business name" id="req-buyer" /></label>
            <label className="mp-label">Produce needed <input {...field('produce')} required minLength={2} maxLength={80} placeholder="e.g. tomatoes, spinach" id="req-produce" /></label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="mp-label">Quantity (kg) <input {...field('quantity')} type="number" min={0.1} step={0.1} required placeholder="e.g. 200" id="req-qty" /></label>
            <label className="mp-label">Max price (PKR/kg) <input {...field('max_price')} type="number" min={1} step={0.01} required placeholder="e.g. 160" id="req-maxprice" /></label>
            <label className="mp-label">Location <input {...field('location')} required minLength={2} maxLength={80} placeholder="City" id="req-location" /></label>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="mp-btn-ghost">Cancel</button>
            <button type="submit" className="mp-btn-primary" disabled={busy} style={{ background: 'linear-gradient(135deg,#ffb432,#ff8c42)', boxShadow: '0 0 20px rgba(255,180,50,0.35)' }} id="submit-req">
              {busy ? <><Loader2 size={15} className="spin" /> Posting…</> : <><Plus size={15} /> Post Requirement</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─────────────── MATCHES TAB ─────────────── */
function MatchesTab({ matches, loading }) {
  if (loading) return <div className="mp-loading-state"><Loader2 size={28} className="spin" color="#00e87a" /><span>Finding smart matches…</span></div>
  if (!matches.length) return (
    <div className="mp-empty-state">
      <Link2 size={40} color="#00e87a" opacity={0.4} />
      <h3>No compatible pairs yet</h3>
      <p>Add buyer requirements matching an available produce name and price. Matches appear automatically.</p>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
      {matches.map((m, i) => {
        const savings = m.savings || 0
        const score = m.score || 0
        return (
          <article key={i} className="mp-match-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="mp-badge" style={{ background: 'rgba(0,232,122,0.1)', borderColor: 'rgba(0,232,122,0.25)', color: '#00e87a' }}>
                <Zap size={11} /> Smart Match
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 12, color: '#6b8f7a' }}>Score</div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: score >= 80 ? '#00e87a' : score >= 50 ? '#ffb432' : '#ff8c42',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>{score}%</div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, width: `${score}%`,
                background: score >= 80 ? 'linear-gradient(90deg,#00e87a,#00ffd2)' : score >= 50 ? 'linear-gradient(90deg,#ffb432,#ff8c42)' : 'linear-gradient(90deg,#ff8c42,#ff4d6d)',
                transition: 'width 0.6s ease'
              }} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#e8f5ee' }}>{m.product?.name}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, margin: '16px 0', padding: '16px', background: 'rgba(0,232,122,0.04)', borderRadius: 12, border: '1px solid rgba(0,232,122,0.08)' }}>
              <div>
                <div style={{ fontSize: 10, color: '#6b8f7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Seller</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5ee' }}>{m.product?.farmer}</div>
                <div style={{ fontSize: 11, color: '#6b8f7a', marginTop: 2 }}>{m.product?.location}</div>
              </div>
              <ArrowRight size={18} color="#00e87a" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#6b8f7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Buyer</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5ee' }}>{m.requirement?.buyer}</div>
                <div style={{ fontSize: 11, color: '#6b8f7a', marginTop: 2 }}>{m.requirement?.location}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: '#6b8f7a', marginBottom: 3 }}>Quantity</div>
                <div style={{ fontWeight: 700, color: '#e8f5ee' }}>{fmt(m.quantity)} kg</div>
              </div>
              <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ color: '#6b8f7a', marginBottom: 3 }}>Price</div>
                <div style={{ fontWeight: 700, color: '#00e87a' }}>{fmtPKR(m.product?.price)}/kg</div>
              </div>
              {savings > 0 && (
                <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,232,122,0.06)', borderRadius: 10, border: '1px solid rgba(0,232,122,0.15)' }}>
                  <div style={{ color: '#6b8f7a', marginBottom: 3 }}>Savings</div>
                  <div style={{ fontWeight: 700, color: '#00e87a' }}>{fmtPKR(savings)}</div>
                </div>
              )}
            </div>
            {m.demo && <div style={{ marginTop: 10, fontSize: 10, color: '#6b8f7a', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Demo data</div>}
          </article>
        )
      })}
    </div>
  )
}

/* ─────────────── ORDERS TAB ─────────────── */
function OrdersTab({ orders, loading }) {
  if (loading) return <div className="mp-loading-state"><Loader2 size={28} className="spin" color="#00e87a" /><span>Loading orders…</span></div>
  if (!orders.length) return (
    <div className="mp-empty-state">
      <ShoppingCart size={40} color="#00e87a" opacity={0.4} />
      <h3>No orders yet</h3>
      <p>Place your first order from the Products tab above.</p>
    </div>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#e8f5ee' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,232,122,0.1)' }}>
            {['#', 'Product', 'Farmer', 'Buyer', 'Qty', 'Price/kg', 'Total', 'Status', 'Date'].map((h, i) => (
              <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b8f7a', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="mp-order-row">
              <td style={{ padding: '14px', color: '#6b8f7a', fontFamily: 'monospace' }}>#{o.id}</td>
              <td style={{ padding: '14px', fontWeight: 600 }}>{o.product_name}</td>
              <td style={{ padding: '14px', color: '#a0d4b5' }}>{o.farmer}</td>
              <td style={{ padding: '14px' }}>{o.buyer}</td>
              <td style={{ padding: '14px' }}>{fmt(o.quantity)} kg</td>
              <td style={{ padding: '14px', color: '#00e87a' }}>{fmtPKR(o.price)}</td>
              <td style={{ padding: '14px', fontWeight: 700, color: '#00e87a' }}>{fmtPKR(o.total)}</td>
              <td style={{ padding: '14px' }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(0,232,122,0.12)', color: '#00e87a', border: '1px solid rgba(0,232,122,0.25)' }}>
                  {o.status}
                </span>
              </td>
              <td style={{ padding: '14px', color: '#6b8f7a', fontSize: 11, whiteSpace: 'nowrap' }}>{o.created_at?.split('T')[0] || o.created_at || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─────────────── REQUIREMENTS TAB ─────────────── */
function RequirementsTab({ requirements, loading, onAddReq }) {
  if (loading) return <div className="mp-loading-state"><Loader2 size={28} className="spin" color="#ffb432" /><span>Loading requirements…</span></div>
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="mp-btn-primary" onClick={onAddReq} style={{ background: 'linear-gradient(135deg,#ffb432,#ff8c42)', boxShadow: '0 0 20px rgba(255,180,50,0.3)' }} id="post-requirement-btn">
          <Plus size={15} /> Post Requirement
        </button>
      </div>
      {!requirements.length ? (
        <div className="mp-empty-state">
          <Users size={40} color="#ffb432" opacity={0.4} />
          <h3>No buying requirements yet</h3>
          <p>Post what you need and get matched with local farmers automatically.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {requirements.map(r => (
            <div key={r.id} className="mp-req-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,180,50,0.12)', border: '1px solid rgba(255,180,50,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={16} color="#ffb432" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e8f5ee' }}>{r.buyer}</div>
                    <div style={{ fontSize: 11, color: '#6b8f7a' }}>Buyer</div>
                  </div>
                </div>
                {r.demo && <span style={{ fontSize: 10, color: '#6b8f7a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 6px' }}>DEMO</span>}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#ffb432', textTransform: 'capitalize', marginBottom: 10 }}>{r.produce}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Need', value: `${fmt(r.quantity)} kg` },
                  { label: 'Max Price', value: fmtPKR(r.max_price) + '/kg' },
                  { label: 'Location', value: r.location },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '8px 10px', background: 'rgba(255,180,50,0.05)', borderRadius: 8, border: '1px solid rgba(255,180,50,0.1)', gridColumn: i === 2 ? 'span 2' : 'span 1' }}>
                    <div style={{ fontSize: 10, color: '#6b8f7a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5ee' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────── MAIN MARKETPLACE ─────────────── */
export default function Marketplace() {
  const [data, setData] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('products')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddReq, setShowAddReq] = useState(false)
  const [toasts, setToasts] = useState([])
  const [sortBy, setSortBy] = useState('newest')

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const loadData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/marketplace`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError('Could not reach the backend. Make sure the FastAPI server is running on port 8000.')
    } finally { setLoading(false) }
  }, [])

  const loadMatches = useCallback(async () => {
    setMatchLoading(true)
    try {
      const res = await fetch(`${API}/api/matches`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMatches(await res.json())
    } catch { setMatches([]) }
    finally { setMatchLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { if (tab === 'matches') loadMatches() }, [tab, loadMatches])

  async function placeOrder(productId, quantity, buyer) {
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity, buyer })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.detail || 'Order failed')
      addToast(`✅ Order placed! ${fmt(quantity)} kg — ${fmtPKR(json.total)}`)
      loadData()
    } catch (err) { addToast(err.message, 'error') }
  }

  const products = data?.products || []
  const requirements = data?.requirements || []
  const orders = data?.orders || []
  const summary = data?.summary || {}

  const cats = ['All', ...new Set(products.map(p => p.category))]

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase()
      return (!q || p.name.toLowerCase().includes(q) || p.farmer.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)) &&
        (catFilter === 'All' || p.category === catFilter)
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'freshness') return a.freshness_days - b.freshness_days
      if (sortBy === 'quantity') return b.quantity - a.quantity
      return b.id - a.id
    })

  const TABS = [
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'requirements', label: 'Requirements', icon: Users, count: requirements.length },
    { id: 'matches', label: 'Smart Matches', icon: Zap, count: matches.length },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length },
  ]

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Toast toasts={toasts} remove={removeToast} />

      {showAddProduct && (
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onAdded={p => { addToast(`${p.name} listed!`); loadData() }}
        />
      )}
      {showAddReq && (
        <AddRequirementModal
          onClose={() => setShowAddReq(false)}
          onAdded={r => { addToast(`Requirement for "${r.produce}" posted!`); loadData() }}
        />
      )}

      {/* ── Page header ── */}
      <div style={{ padding: '100px 24px 0', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 50, background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)', marginBottom: 14, fontSize: 12, fontWeight: 700, color: '#00e87a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Leaf size={12} /> FreshRoute Marketplace
            </div>
            <h1 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#e8f5ee' }}>
              Farm-Fresh <span className="gradient-text">Produce</span>
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 16, color: '#6b8f7a', maxWidth: 460, lineHeight: 1.7 }}>
              Connect directly with local farmers. Browse live listings, post buying requirements, and discover smart supply-demand matches.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            <button className="mp-btn-ghost" onClick={loadData} id="refresh-marketplace" title="Refresh data">
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <button className="mp-btn-primary" onClick={() => setShowAddProduct(true)} id="list-produce-btn">
              <Plus size={15} /> List Produce
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        {loading ? (
          <div className="mp-loading-state" style={{ height: 120 }}><Loader2 size={24} className="spin" color="#00e87a" /><span>Loading marketplace…</span></div>
        ) : error ? (
          <div className="mp-alert-error" role="alert" style={{ marginBottom: 28 }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard icon={Package} label="Active Listings" value={summary.active_listings ?? 0} sub="Products with stock" color="#00e87a" />
            <StatCard icon={Boxes} label="Total Supply" value={`${fmt(summary.available_kg)} kg`} sub="All listed quantities" color="#00ffd2" />
            <StatCard icon={Users} label="Local Farmers" value={summary.farmers ?? 0} sub="Registered growers" color="#ffb432" />
            <StatCard icon={TrendingUp} label="Open Demand" value={`${fmt(summary.open_demand_kg)} kg`} sub="Buyer requirements" color="#ff8c42" />
            <StatCard icon={ShoppingCart} label="Order Value" value={fmtPKR(summary.order_value)} sub="Total recorded orders" color="#a78bfa" />
            <StatCard icon={BarChart3} label="Demand Forecast" value={summary.forecast_kg ? `${fmt(summary.forecast_kg)} kg` : 'N/A'} sub="7-day average baseline" color="#00d4ff" />
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: 16, border: '1px solid rgba(0,232,122,0.08)', width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              id={`tab-${t.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.25s ease',
                background: tab === t.id ? 'rgba(0,232,122,0.12)' : 'transparent',
                color: tab === t.id ? '#00e87a' : '#6b8f7a',
                boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(0,232,122,0.3)' : 'none',
              }}
            >
              <t.icon size={15} />
              {t.label}
              {t.count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: tab === t.id ? 'rgba(0,232,122,0.2)' : 'rgba(255,255,255,0.06)', color: tab === t.id ? '#00e87a' : '#6b8f7a' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                <Search size={15} color="#6b8f7a" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="search" placeholder="Search produce, farmer, location…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="mp-input" style={{ width: '100%', paddingLeft: 38 }}
                  id="marketplace-search"
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button
                    key={c} onClick={() => setCatFilter(c)}
                    className="mp-filter-chip"
                    style={{ background: catFilter === c ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.04)', color: catFilter === c ? '#00e87a' : '#6b8f7a', borderColor: catFilter === c ? 'rgba(0,232,122,0.35)' : 'rgba(255,255,255,0.08)' }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mp-input" style={{ paddingRight: 32, appearance: 'none', cursor: 'pointer' }} id="sort-products">
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low → high</option>
                  <option value="price-desc">Price: high → low</option>
                  <option value="freshness">Freshest first</option>
                  <option value="quantity">Most stock</option>
                </select>
                <ChevronDown size={13} color="#6b8f7a" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {loading ? (
              <div className="mp-loading-state"><Loader2 size={28} className="spin" color="#00e87a" /><span>Loading products…</span></div>
            ) : !filtered.length ? (
              <div className="mp-empty-state">
                <Search size={40} color="#00e87a" opacity={0.4} />
                <h3>{search || catFilter !== 'All' ? 'No matching products' : 'No products yet'}</h3>
                <p>{search || catFilter !== 'All' ? 'Try adjusting your filters.' : 'Be the first to list fresh produce on the marketplace.'}</p>
                {(!search && catFilter === 'All') && (
                  <button className="mp-btn-primary" onClick={() => setShowAddProduct(true)}>
                    <Plus size={15} /> List Produce
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: '#6b8f7a', marginBottom: 16 }}>
                  Showing <strong style={{ color: '#a0d4b5' }}>{filtered.length}</strong> {filtered.length === 1 ? 'listing' : 'listings'}
                  {search && <> matching <em>"{search}"</em></>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {filtered.map(p => (
                    <ProductCard key={p.id} product={p} onOrder={placeOrder} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'requirements' && (
          <RequirementsTab requirements={requirements} loading={loading} onAddReq={() => setShowAddReq(true)} />
        )}

        {tab === 'matches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e8f5ee' }}>Smart Supply-Demand Matches</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b8f7a' }}>Produce names, price budgets and available quantities are matched automatically.</p>
              </div>
              <button className="mp-btn-ghost" onClick={loadMatches} id="refresh-matches">
                <RefreshCw size={14} className={matchLoading ? 'spin' : ''} /> Refresh
              </button>
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,232,122,0.04)', border: '1px solid rgba(0,232,122,0.1)', fontSize: 12, color: '#6b8f7a', marginBottom: 20 }}>
              <Sparkles size={12} style={{ display: 'inline', marginRight: 6 }} color="#00e87a" />
              Deterministic name + price matching. Not AI — but powered by real listings and buyer requirements.
            </div>
            <MatchesTab matches={matches} loading={matchLoading} />
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e8f5ee' }}>Order History</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b8f7a' }}>All reservations placed through this marketplace. No payments are processed.</p>
              </div>
            </div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <OrdersTab orders={orders} loading={loading} />
            </div>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </div>
  )
}
