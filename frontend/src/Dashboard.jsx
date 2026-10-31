import { useMemo, useState } from 'react'
import {
  ArrowRight, BarChart3, Boxes, FileText, Hexagon, Leaf, Link2, Map, MapPin,
  Package, Recycle, ShoppingBag, ShoppingCart, Snowflake, Sparkles, Sprout,
  Store, TrendingUp, Truck, Users,
} from 'lucide-react'
import {
  CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import RoutesMap from './components/RoutesMap.jsx'
import { Alert, Badge, Card, CardHead, StatCard } from './components/ui.jsx'
import {
  activityFeed, aiStatusMeta, featuredProducts, fmt, fmtPKR, forecastSnapshot,
  locatedProducts, produceEmoji, produceImage,
} from './lib/data.js'
import { useRoadRoutes } from './lib/routes.js'

const AI_ACTIONS = [
  { task: 'description', label: 'Generate produce descriptions', icon: FileText },
  { task: 'forecast', label: 'Explain demand forecasts', icon: BarChart3 },
  { task: 'matching', label: 'Find best buyer matches', icon: Link2 },
  { task: 'logistics', label: 'Recommend delivery routes', icon: Truck },
]

const ACTIVITY_ICONS = { cart: ShoppingCart, bag: ShoppingBag, sprout: Sprout }

const HERO_BENEFITS = [
  { icon: Leaf, label: 'Fresh Produce' },
  { icon: TrendingUp, label: 'Better Prices' },
  { icon: Recycle, label: 'Less Food Waste' },
  { icon: Truck, label: 'Smarter Deliveries' },
]

function Donut({ supply, demand, coverage }) {
  const data = [
    { name: 'Available supply', value: Math.max(supply, 0) },
    { name: 'Open demand', value: Math.max(demand, 0) },
  ]
  if (supply + demand <= 0) {
    return <div className="donut-empty">No supply or demand recorded yet.</div>
  }
  return (
    <div className="donut-box">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={56} outerRadius={78} startAngle={90} endAngle={-270} stroke="none">
            <Cell fill="#3aa655" />
            <Cell fill="#f0a24a" />
          </Pie>
          <Tooltip formatter={(value, name) => [`${fmt(value)} kg`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center">
        <strong>{coverage}%</strong>
        <span>share of total volume</span>
      </div>
    </div>
  )
}

export default function Dashboard({ data, loading, error, aiStatus, reload, navigate, openAssistant }) {
  const [range, setRange] = useState('7')
  const [chat, setChat] = useState('')
  const products = data?.products || []
  const requirements = data?.requirements || []
  const orders = data?.orders || []
  const summary = data?.summary || {}
  const snapshot = forecastSnapshot(data?.history)
  const supply = Number(summary.available_kg || 0)
  const openDemand = Number(summary.open_demand_kg || 0)
  const coverage = supply + openDemand > 0 ? Math.round((supply / (supply + openDemand)) * 100) : 0
  const shortage = Math.max(0, openDemand - supply)
  const featured = featuredProducts(products)
  const activity = activityFeed(data)
  const aiMeta = aiStatusMeta(aiStatus)

  const { routes, loading: routeLoading, targets: routeTargets } = useRoadRoutes(products, 3)
  const routeKm = Object.values(routes).reduce((sum, route) => sum + Number(route.distance_km || 0), 0)

  const chartRows = useMemo(() => {
    const rows = range === '7' ? snapshot.recent : snapshot.daily
    return rows.map((row) => ({
      date: String(row.date).slice(5),
      actual: Math.round(row.demand),
      baseline: snapshot.mean == null ? 0 : Math.round(snapshot.mean),
    }))
  }, [range, snapshot])

  function submitChat(event) {
    event.preventDefault()
    if (!chat.trim()) {
      openAssistant('description')
      return
    }
    openAssistant('description', {
      produce: products[0] ? {
        name: products[0].name,
        category: products[0].category,
        farmer: products[0].farmer,
        location: products[0].location,
        price_pkr_per_kg: products[0].price,
        available_kg: products[0].quantity,
        freshness_days: products[0].freshness_days,
      } : {},
      buyer_question: chat.trim(),
    })
    setChat('')
  }

  return (
    <div className="overview-layout">
      <div className="main-col">
        {loading && !data ? <div className="data-strip">Loading live marketplace data…</div> : null}
        {error ? (
          <Alert>
            {error}
            <button type="button" className="btn btn-outline btn-sm alert-action" onClick={reload}>Retry</button>
          </Alert>
        ) : null}

        <section className="hero">
          <img src="/images/hero-farm.png" alt="Farm fields at sunrise with a refrigerated delivery truck" />
          <div className="hero-content">
            <h1>Connecting Farmers to Cities<br />with AI-Powered Logistics</h1>
            <p>Predict demand, match supply, and deliver fresh produce to reduce food waste and build stronger communities.</p>
            <button type="button" className="hero-cta" onClick={() => navigate('farmer')}>
              List Your Produce <ArrowRight size={15} />
            </button>
          </div>
          <div className="hero-benefits">
            {HERO_BENEFITS.map((benefit) => (
              <div className="benefit" key={benefit.label}>
                <benefit.icon size={14} />
                {benefit.label}
              </div>
            ))}
          </div>
        </section>

        <div className="stats-grid">
          <StatCard icon={Leaf} tone="green" label="Available Produce" value={`${fmt(supply)} kg`} sub={`${summary.active_listings || 0} active listings`} />
          <StatCard icon={Users} tone="orange" label="Active Farmers" value={summary.farmers || 0} sub="Registered growers" />
          <StatCard icon={ShoppingCart} tone="purple" label="Buyer Requirements" value={requirements.length} sub={`${fmt(openDemand)} kg open demand`} />
          <StatCard icon={Truck} tone="blue" label="Order Reservations" value={orders.length} sub={`${fmtPKR(summary.order_value || 0)} reserved value`} />
        </div>

        <div className="charts-row">
          <Card>
            <CardHead
              icon={TrendingUp}
              title="Demand Forecast"
              subtitle="Aggregate demo demand history"
              actions={(
                <select className="select" value={range} onChange={(event) => setRange(event.target.value)} aria-label="Forecast range">
                  <option value="7">Last 7 days</option>
                  <option value="all">All recorded</option>
                </select>
              )}
            />
            <div className="card-body">
              <div className="chart-legend">
                <span><i className="dot green" />Actual demand</span>
                <span><i className="dot orange" />7-day baseline</span>
              </div>
              {chartRows.length ? (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartRows} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ea" />
                      <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10.5, fill: '#929f95' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value, name) => [`${fmt(value)} kg`, name === 'actual' ? 'Actual demand' : '7-day baseline']} />
                      <Line type="monotone" dataKey="actual" stroke="#15803d" strokeWidth={2.5} dot={{ r: 3, fill: '#15803d' }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="baseline" stroke="#f0a24a" strokeWidth={2} strokeDasharray="6 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="chart-empty">No demand history recorded yet.</div>}
              <p className="chart-note">Baseline is the arithmetic mean of the recorded days — a transparent demo number, not a trained prediction.</p>
            </div>
          </Card>

          <Card>
            <CardHead icon={Boxes} title="Supply vs Demand" subtitle="Stored listings vs open requirements" />
            <div className="card-body supply-body">
              <Donut supply={supply} demand={openDemand} coverage={coverage} />
              <div className="supply-legend">
                <div><i className="dot green" />Available supply <strong>{fmt(supply)} kg</strong></div>
                <div><i className="dot orange" />Open demand <strong>{fmt(openDemand)} kg</strong></div>
              </div>
              {shortage > 0 ? (
                <div className="shortage"><BarChart3 size={14} />{fmt(shortage)} kg shortfall — open demand exceeds listed stock.</div>
              ) : (
                <div className="surplus"><Leaf size={14} />Listed stock currently covers open buyer demand.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="bottom-row">
          <Card>
            <CardHead
              icon={Sprout}
              title="Featured Produce"
              subtitle="Nearest demo listings"
              actions={<button type="button" className="link-btn" onClick={() => navigate('marketplace')}>View All</button>}
            />
            <div className="produce-grid">
              {featured.map((product) => (
                <article className="produce-card" key={product.id}>
                  <div className="produce-thumb">
                    {produceImage(product)
                      ? <img src={produceImage(product)} alt={product.name} loading="lazy" />
                      : <span className="emoji">{produceEmoji(product)}</span>}
                  </div>
                  <div className="produce-info">
                    <div className="produce-name">{product.name}</div>
                    <div className="produce-qty">{fmt(product.quantity)} kg available</div>
                    <div className="produce-price">{fmtPKR(product.price)} / kg</div>
                    <div className="produce-loc"><MapPin size={10} />{product.location}</div>
                    <button type="button" className="btn btn-outline btn-sm produce-btn" onClick={() => navigate('marketplace', { query: product.name })}>View Details</button>
                  </div>
                </article>
              ))}
              {!featured.length && <div className="chart-empty">No produce listings yet.</div>}
            </div>
          </Card>

          <Card>
            <CardHead icon={Map} title="Delivery Routes" subtitle="Road routes to the demo city hub" />
            <div className="route-map">
              {routeTargets.length ? (
                <RoutesMap products={routeTargets} routes={routes} height={252} />
              ) : <div className="chart-empty">No listing coordinates available.</div>}
            </div>
            <div className="route-summary">
              <span className="route-truck"><Truck size={15} /></span>
              <div>
                <strong>{routeLoading ? 'Calculating road routes…' : `${routeTargets.length} farm routes · ${fmt(routeKm)} km`}</strong>
                <div className="route-sub">{Object.values(routes).some(route => route.source !== 'osrm') ? 'Includes straight-line fallback' : 'OSRM road distance'} · illustrative hub</div>
              </div>
              <button type="button" className="btn btn-primary btn-sm route-btn" onClick={() => navigate('logistics')}>View Route</button>
            </div>
          </Card>
        </div>

        <div className="integrations-strip">
          <div className="integration-item">
            <span className="integration-icon tone-blue"><Snowflake size={18} /></span>
            <div><div className="integration-name">Snowflake CoCo</div><div className="integration-sub">Supply-demand analytics · not integrated</div></div>
          </div>
          <div className="integration-item">
            <span className="integration-icon tone-purple"><Hexagon size={18} /></span>
            <div><div className="integration-name">Solana Agent Registry</div><div className="integration-sub">Agent identity · not integrated</div></div>
          </div>
          <div className="integration-item">
            <span className="integration-icon tone-teal"><Sparkles size={18} /></span>
            <div><div className="integration-name">Gemma 4</div><div className="integration-sub">AI insights · {aiMeta.label.toLowerCase()}</div></div>
          </div>
          <div className="integration-item">
            <span className="integration-icon tone-green"><Leaf size={18} /></span>
            <div><div className="integration-name">Building a Sustainable</div><div className="integration-sub">Food Future Together</div></div>
          </div>
        </div>
      </div>

      <aside className="rail">
        <section className="ai-panel">
          <div className="ai-head">
            <div className="ai-title"><Sparkles size={17} className="icon-green" />AI Assistant</div>
            <span className={`status-pill ${aiMeta.tone}`}>{aiMeta.tone !== 'offline' ? <i className="live-dot" /> : null}{aiMeta.label}</span>
          </div>
          <div className="ai-bubble">
            <span className="wave">👋</span> How can I help you today?
          </div>
          <div className="ai-prompt-label">I can help you with:</div>
          <div className="ai-actions">
            {AI_ACTIONS.map((action) => (
              <button key={action.task} type="button" className="ai-action" onClick={() => openAssistant(action.task)}>
                <action.icon size={15} className="icon-green" />
                {action.label}
              </button>
            ))}
          </div>
          <form className="ai-input" onSubmit={submitChat}>
            <input
              value={chat}
              onChange={(event) => setChat(event.target.value)}
              placeholder="Ask about produce, demand or logistics…"
              aria-label="Ask the AI assistant"
            />
            <button type="submit" className="ai-send" aria-label="Open assistant"><ArrowRight size={15} /></button>
          </form>
          <p className="ai-footnote">Responses require a configured hosted Gemma key. No sample answers are shown.</p>
        </section>

        <Card className="activity-card">
          <CardHead
            icon={Store}
            title="Recent Activity"
            actions={<button type="button" className="link-btn" onClick={() => navigate('marketplace')}>View All</button>}
          />
          <div className="activity-list">
            {activity.map((item, index) => {
              const Icon = ACTIVITY_ICONS[item.icon] || Package
              return (
                <div className="activity-item" key={index}>
                  <span className={`activity-icon tone-${item.tone}`}><Icon size={15} /></span>
                  <div>
                    <div className="activity-title">{item.title}</div>
                    <div className="activity-meta">{item.meta}</div>
                    <div className="activity-when">{item.when}</div>
                  </div>
                </div>
              )
            })}
            {!activity.length && <div className="chart-empty">No activity recorded yet.</div>}
          </div>
        </Card>

        <div className="rail-note">
          <Badge tone="green">Demo data</Badge>
          <p>Listings, prices and demand history are sample records. Matching is deterministic; the forecast is an arithmetic mean.</p>
        </div>
      </aside>
    </div>
  )
}
