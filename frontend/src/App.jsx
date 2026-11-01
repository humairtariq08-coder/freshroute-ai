import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import {
  Bell, Blocks, ChevronDown, LayoutDashboard, Leaf, LineChart, Link2, Map,
  MapPin, Menu, Search, ShoppingBag, ShoppingCart, Sparkles, Sprout, Store, X,
} from 'lucide-react'
const Dashboard = lazy(() => import('./Dashboard.jsx'))
const FarmerPortal = lazy(() => import('./FarmerPortal.jsx'))
const Marketplace = lazy(() => import('./Marketplace.jsx'))
const Forecasting = lazy(() => import('./Forecasting.jsx'))
const Matching = lazy(() => import('./Matching.jsx'))
const Logistics = lazy(() => import('./Logistics.jsx'))
const AiAssistant = lazy(() => import('./AiAssistant.jsx'))
const Integrations = lazy(() => import('./Integrations.jsx'))
import { ToastStack } from './components/ui.jsx'
import { API, aiStatusMeta, assistantPayload } from './lib/data.js'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'farmer', label: 'Farmer Portal', icon: Sprout },
  { id: 'marketplace', label: 'Buyer Marketplace', icon: Store },
  { id: 'forecasting', label: 'Demand Forecasting', icon: LineChart },
  { id: 'matching', label: 'Smart Matching', icon: Link2 },
  { id: 'logistics', label: 'Logistics Planner', icon: Map },
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'integrations', label: 'Integrations', icon: Blocks },
]

export default function App() {
  const [view, setView] = useState('overview')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiStatus, setAiStatus] = useState({ status: 'NOT_CONFIGURED' })
  const [mobileNav, setMobileNav] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [marketplaceQuery, setMarketplaceQuery] = useState('')
  const [assistantSeed, setAssistantSeed] = useState(null)
  const [toasts, setToasts] = useState([])

  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API}/api/marketplace`)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setData(payload)
    } catch {
      setError('Could not reach the backend. Start FastAPI on port 8000 and retry.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    fetch(`${API}/api/ai/status`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error()))
      .then((payload) => setAiStatus(payload))
      .catch(() => setAiStatus({ status: 'UNAVAILABLE' }))
  }, [reload])

  const navigate = useCallback((next, options = {}) => {
    setView(next)
    setMobileNav(false)
    setNotificationsOpen(false)
    if (typeof options.query === 'string') setMarketplaceQuery(options.query)
  }, [])

  const openAssistant = useCallback((task, payload) => {
    setAssistantSeed({
      task,
      data: payload ?? assistantPayload(task, data),
      nonce: Date.now(),
    })
    setView('assistant')
    setMobileNav(false)
  }, [data])

  function submitSearch(event) {
    event.preventDefault()
    setMarketplaceQuery(query)
    navigate('marketplace')
  }

  const requirements = data?.requirements || []
  const orders = data?.orders || []
  const aiMeta = aiStatusMeta(aiStatus)
  const notificationItems = [
    ...requirements.slice(0, 3).map((requirement) => ({
      title: `${requirement.buyer} needs ${requirement.produce}`,
      meta: `${Number(requirement.quantity).toLocaleString()} kg · max Rs. ${Number(requirement.max_price).toLocaleString()}/kg`,
      icon: ShoppingBag,
      tone: 'orange',
    })),
    ...orders.slice(0, 2).map((order) => ({
      title: `Order reserved: ${order.product_name}`,
      meta: `${order.buyer} · ${Number(order.quantity).toLocaleString()} kg`,
      icon: ShoppingCart,
      tone: 'green',
    })),
  ]

  const shared = { data, loading, error, reload, notify, navigate, openAssistant, aiStatus }

  return (
    <div className="app-shell">
      {mobileNav ? <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} /> : null}

      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Leaf size={20} strokeWidth={2.4} /></div>
          <div>
            <div className="brand-name">FreshRoute AI</div>
            <div className="brand-tag">Predict Demand. Reduce Waste. Deliver Smarter.</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-art">
          <div className="sidebar-art-card">
            <img src="/images/sidebar-farmland.png" alt="" />
            <div className="sidebar-art-overlay" />
            <div className="sidebar-art-text">
              <strong>Fresh Food</strong>
              <strong>Stronger Communities</strong>
              <strong>Greener Cities</strong>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button type="button" className="icon-btn hamburger" onClick={() => setMobileNav(true)} aria-label="Open navigation">
            <Menu size={18} />
          </button>

          <form className="search" onSubmit={submitSearch} role="search">
            <Search size={15} className="search-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search produce, farmers, or buyers…"
              aria-label="Search the marketplace"
            />
          </form>

          <div className="topbar-actions">
            <div className="location-chip"><MapPin size={13} /> Multan, Pakistan</div>

            <div className="bell-wrap">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setNotificationsOpen((current) => !current)}
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell size={17} />
                {notificationItems.length > 0 ? <span className="notif-dot">{notificationItems.length}</span> : null}
              </button>
              {notificationsOpen ? (
                <>
                  <button type="button" className="popover-scrim" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} />
                  <div className="popover">
                    <div className="popover-head">
                      <strong>Notifications</strong>
                      <button type="button" className="icon-btn" onClick={() => setNotificationsOpen(false)} aria-label="Close"><X size={13} /></button>
                    </div>
                    {notificationItems.length ? notificationItems.map((item, index) => (
                      <div className="popover-item" key={index}>
                        <span className={`activity-icon tone-${item.tone}`}><item.icon size={14} /></span>
                        <div>
                          <div className="activity-title">{item.title}</div>
                          <div className="activity-meta">{item.meta}</div>
                        </div>
                      </div>
                    )) : <p className="popover-empty">No marketplace activity yet.</p>}
                    <button type="button" className="btn btn-soft btn-sm popover-action" onClick={() => navigate('marketplace')}>Open marketplace</button>
                  </div>
                </>
              ) : null}
            </div>

            <div className="profile">
              <div className="avatar">AK</div>
              <div className="profile-text">
                <div className="profile-name">Ahmed Khan</div>
                <div className="profile-role">Farmer</div>
              </div>
              <ChevronDown size={13} className="profile-caret" />
            </div>
          </div>
        </header>

        <main className="page"><Suspense fallback={<div className="page-loading">Loading view…</div>}>
          {view === 'overview' && <Dashboard {...shared} />}
          {view === 'farmer' && <FarmerPortal {...shared} />}
          {view === 'marketplace' && <Marketplace {...shared} initialQuery={marketplaceQuery} />}
          {view === 'forecasting' && <Forecasting {...shared} />}
          {view === 'matching' && <Matching {...shared} />}
          {view === 'logistics' && <Logistics {...shared} />}
          {view === 'assistant' && <AiAssistant {...shared} seed={assistantSeed} />}
          {view === 'integrations' && <Integrations {...shared} aiMeta={aiMeta} />}
        </Suspense></main>
      </div>

      <ToastStack toasts={toasts} dismiss={dismissToast} />
    </div>
  )
}
