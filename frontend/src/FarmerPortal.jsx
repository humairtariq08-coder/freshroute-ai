import { useMemo, useState } from 'react'
import {
  Clock, MapPin, Package, Plus, RefreshCw, Search, Sprout, TrendingUp, Users,
} from 'lucide-react'
import { ProductFormModal } from './components/forms.jsx'
import { Badge, Card, EmptyState, PageHeader, StatCard } from './components/ui.jsx'
import { fmt, fmtPKR, produceEmoji, produceImage } from './lib/data.js'

export default function FarmerPortal({ data, loading, reload, notify, navigate }) {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const products = data?.products || []

  const filtered = useMemo(() => products
    .filter((product) => {
      const query = search.trim().toLowerCase()
      return !query
        || product.name.toLowerCase().includes(query)
        || product.farmer.toLowerCase().includes(query)
        || product.location.toLowerCase().includes(query)
    }), [products, search])

  const totalStock = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.price || 0), 0) / products.length
    : 0
  const growers = new Set(products.map((product) => product.farmer)).size

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Grower workspace"
        title="Farmer Portal"
        subtitle="List produce, watch available stock and keep your catalog current."
        actions={(
          <>
            <button type="button" className="btn btn-outline" onClick={reload} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> List Produce
            </button>
          </>
        )}
      />

      <div className="stats-grid">
        <StatCard icon={Package} tone="green" label="Active Listings" value={products.filter((product) => product.quantity > 0).length} sub={`${products.length} total records`} />
        <StatCard icon={Sprout} tone="teal" label="Available Stock" value={`${fmt(totalStock)} kg`} sub="Across all listings" />
        <StatCard icon={TrendingUp} tone="orange" label="Average Price" value={`${fmtPKR(averagePrice)}/kg`} sub="Simple mean of listings" />
        <StatCard icon={Users} tone="purple" label="Growers" value={growers} sub="Distinct farmer names" />
      </div>

      <Card>
        <div className="list-toolbar">
          <div className="search compact">
            <Search size={14} className="search-icon" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter listings…" aria-label="Filter listings" />
          </div>
          <span className="toolbar-count">Showing {filtered.length} of {products.length}</span>
        </div>

        {!products.length && !loading ? (
          <EmptyState icon={Package} title="No produce listings yet" action={<button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> List your first produce</button>}>
            Add a listing to make it visible in the marketplace and matching.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {['Produce', 'Farmer / location', 'Price', 'Available', 'Shelf life', 'Status'].map((heading) => <th key={heading}>{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const image = produceImage(product)
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="cell-produce">
                          {image ? <img src={image} alt="" /> : <span className="cell-emoji">{produceEmoji(product)}</span>}
                          <div>
                            <strong>{product.name}</strong>
                            <div className="cell-sub">{product.category}{product.demo ? ' · demo' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{product.farmer}</div>
                        <div className="cell-sub"><MapPin size={10} />{product.location}</div>
                      </td>
                      <td><strong className="price-text">{fmtPKR(product.price)}</strong><span className="cell-sub"> / kg</span></td>
                      <td>{fmt(product.quantity)} kg</td>
                      <td><span className="cell-sub"><Clock size={10} />{product.freshness_days} days</span></td>
                      <td>
                        {product.quantity > 0
                          ? <Badge tone="green">Available</Badge>
                          : <Badge tone="red">Out of stock</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="page-note">
        <Badge tone="green">Demo catalog</Badge>
        <span>New records persist in SQLite. Listings without payment or supplier verification are planning data only.</span>
        <button type="button" className="link-btn" onClick={() => navigate('marketplace')}>Open buyer marketplace →</button>
      </div>

      {showForm ? (
        <ProductFormModal
          onClose={() => setShowForm(false)}
          onSaved={(product) => {
            notify(`${product.name} listed successfully.`)
            reload()
          }}
        />
      ) : null}
    </div>
  )
}
