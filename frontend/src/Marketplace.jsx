import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, CheckCircle2, ChevronDown, MapPin, Package, Plus, RefreshCw,
  Search, ShoppingBag, ShoppingCart, Users,
} from 'lucide-react'
import { RequirementFormModal } from './components/forms.jsx'
import { Badge, Card, EmptyState, PageHeader, Spinner } from './components/ui.jsx'
import { API, fmt, fmtPKR, produceEmoji, produceImage } from './lib/data.js'

const CATEGORY_TONES = { Vegetables: 'green', Fruits: 'orange', 'Leafy greens': 'teal', Grains: 'sand' }

function ProductCard({ product, onOrder }) {
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(1)
  const [buyer, setBuyer] = useState('')
  const [busy, setBusy] = useState(false)
  const image = produceImage(product)

  async function confirm() {
    if (busy) return
    setBusy(true)
    try {
      if (await onOrder(product.id, qty, buyer.trim())) {
        setOpen(false)
        setBuyer('')
        setQty(1)
      }
    } finally { setBusy(false) }
  }

  return (
    <article className="market-card">
      <div className="market-thumb">
        {image ? <img src={image} alt={product.name} loading="lazy" /> : <span className="emoji">{produceEmoji(product)}</span>}
        <div className="market-thumb-badges">
          <Badge tone={CATEGORY_TONES[product.category] || 'green'}>{product.category}</Badge>
          <Badge tone={product.quantity > 0 ? 'teal' : 'red'}>{product.quantity > 0 ? `${fmt(product.quantity)} kg` : 'Sold out'}</Badge>
        </div>
      </div>
      <div className="market-body">
        <h3>{product.name}</h3>
        <div className="market-loc"><MapPin size={11} />{product.farmer} · {product.location}</div>
        {product.description ? <p className="market-desc">{product.description}</p> : null}
        <div className="market-price-row">
          <div><strong>{fmtPKR(product.price)}</strong><span>/ kg</span></div>
          <div className="market-fresh">{product.freshness_days >= 14 ? 'Long shelf' : `${product.freshness_days} days shelf`}</div>
        </div>

        {product.quantity > 0 ? (
          open ? (
            <div className="order-form">
              <div className="form-row two">
                <input className="input" type="number" min={0.1} max={product.quantity} step={0.1} value={qty} onChange={(event) => setQty(Math.min(product.quantity, Math.max(0.1, parseFloat(event.target.value) || 0.1)))} aria-label="Quantity in kilograms" />
                <input className="input" value={buyer} onChange={(event) => setBuyer(event.target.value)} placeholder="Your name / business" aria-label="Buyer name" />
              </div>
              <div className="order-total">
                <span>Total <strong>{fmtPKR(qty * product.price)}</strong></span>
                <button type="button" className="link-btn" onClick={() => setOpen(false)}>Cancel</button>
              </div>
              <button type="button" className="btn btn-primary btn-block" disabled={busy || buyer.trim().length < 2 || qty <= 0} onClick={confirm}>
                <CheckCircle2 size={14} /> {busy ? 'Reserving…' : 'Confirm reservation'}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(true)}>
              <ShoppingCart size={14} /> Place Order
            </button>
          )
        ) : <div className="sold-out">No stock remaining</div>}
        {product.demo ? <div className="demo-tag">Demo listing</div> : null}
      </div>
    </article>
  )
}

export default function Marketplace({ data, loading, reload, notify, initialQuery = '' }) {
  const [tab, setTab] = useState('products')
  const [search, setSearch] = useState(initialQuery)
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('newest')
  const [showRequirement, setShowRequirement] = useState(false)
  const products = data?.products || []
  const requirements = data?.requirements || []
  const orders = data?.orders || []

  useEffect(() => {
    if (initialQuery) {
      setSearch(initialQuery)
      setTab('products')
    }
  }, [initialQuery])

  const categories = useMemo(() => ['All', ...new Set(products.map((product) => product.category))], [products])

  const filtered = useMemo(() => products
    .filter((product) => {
      const query = search.trim().toLowerCase()
      const matchesQuery = !query
        || product.name.toLowerCase().includes(query)
        || product.farmer.toLowerCase().includes(query)
        || product.location.toLowerCase().includes(query)
      return matchesQuery && (category === 'All' || product.category === category)
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'freshness') return a.freshness_days - b.freshness_days
      if (sort === 'quantity') return b.quantity - a.quantity
      return b.id - a.id
    }), [products, search, category, sort])

  async function placeOrder(productId, quantity, buyer) {
    try {
      const response = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity, buyer }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Order failed.')
      notify(`Order reserved: ${fmt(quantity)} kg — ${fmtPKR(payload.total)}`)
      reload()
      return true
    } catch (caught) {
      notify(caught.message, 'error')
      return false
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Buyer workspace"
        title="Buyer Marketplace"
        subtitle="Browse live listings, reserve stock and post what your business needs."
        actions={(
          <>
            <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowRequirement(true)}>
              <Plus size={14} /> Post Requirement
            </button>
          </>
        )}
      />

      <div className="tab-row">
        <button type="button" className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}><Package size={14} />Products <span>{products.length}</span></button>
        <button type="button" className={`tab ${tab === 'requirements' ? 'active' : ''}`} onClick={() => setTab('requirements')}><Users size={14} />Requirements <span>{requirements.length}</span></button>
        <button type="button" className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><ShoppingCart size={14} />Orders <span>{orders.length}</span></button>
      </div>

      {tab === 'products' ? (
        <>
          <div className="list-toolbar">
            <div className="search compact">
              <Search size={14} className="search-icon" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search produce, farmer, location…" aria-label="Search products" />
            </div>
            <div className="chip-row">
              {categories.map((item) => (
                <button key={item} type="button" className={`chip ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
            <div className="select-wrap">
              <select className="select" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low → high</option>
                <option value="price-desc">Price: high → low</option>
                <option value="freshness">Freshest first</option>
                <option value="quantity">Most stock</option>
              </select>
              <ChevronDown size={12} className="select-caret" />
            </div>
          </div>

          {loading && !products.length ? <Spinner label="Loading listings…" /> : null}
          {!loading && !filtered.length ? (
            <Card><EmptyState icon={Search} title="No matching products">Try a different search or category.</EmptyState></Card>
          ) : (
            <div className="market-grid">
              {filtered.map((product) => <ProductCard key={product.id} product={product} onOrder={placeOrder} />)}
            </div>
          )}
          <p className="inline-note"><AlertCircle size={13} /> Orders only reserve stock locally. No payment is processed and suppliers are not contacted.</p>
        </>
      ) : null}

      {tab === 'requirements' ? (
        requirements.length ? (
          <div className="requirement-grid">
            {requirements.map((requirement) => (
              <Card className="requirement-card" key={requirement.id}>
                <div className="requirement-head">
                  <span className="requirement-icon"><ShoppingBag size={17} /></span>
                  <div>
                    <strong>{requirement.produce}</strong>
                    <div className="cell-sub">{requirement.buyer} · {requirement.location}</div>
                  </div>
                  {requirement.demo ? <Badge tone="gray">Demo</Badge> : null}
                </div>
                <div className="requirement-stats">
                  <div><span>Quantity</span><strong>{fmt(requirement.quantity)} kg</strong></div>
                  <div><span>Max price</span><strong>{fmtPKR(requirement.max_price)}/kg</strong></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card><EmptyState icon={Users} title="No buying requirements yet" action={<button type="button" className="btn btn-primary" onClick={() => setShowRequirement(true)}><Plus size={14} /> Post requirement</button>}>Post what you need and it becomes available to matching.</EmptyState></Card>
        )
      ) : null}

      {tab === 'orders' ? (
        <Card>
          {!orders.length ? (
            <EmptyState icon={ShoppingCart} title="No orders yet">Reserve stock from a product card to create a local order record.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr>{['#', 'Product', 'Farmer', 'Buyer', 'Qty', 'Total', 'Status', 'Created'].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="cell-sub">#{order.id}</td>
                      <td><strong>{order.product_name}</strong></td>
                      <td>{order.farmer}</td>
                      <td>{order.buyer}</td>
                      <td>{fmt(order.quantity)} kg</td>
                      <td><strong className="price-text">{fmtPKR(order.total)}</strong></td>
                      <td><Badge tone="green">{order.status}</Badge></td>
                      <td className="cell-sub">{order.created_at || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {showRequirement ? (
        <RequirementFormModal
          onClose={() => setShowRequirement(false)}
          onSaved={(requirement) => {
            notify(`Requirement for ${requirement.produce} posted.`)
            reload()
          }}
        />
      ) : null}
    </div>
  )
}
