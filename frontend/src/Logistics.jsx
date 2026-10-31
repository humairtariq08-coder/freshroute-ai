import { useState } from 'react'
import { Clock, Map, MapPin, RefreshCw, Route, Sparkles, Truck } from 'lucide-react'
import RoutesMap from './components/RoutesMap.jsx'
import {
  Alert, Badge, Card, CardHead, Disclaimer, EmptyState, PageHeader, Spinner, StatCard,
} from './components/ui.jsx'
import { HUB, askGemma, assistantPayload, fmt, locatedProducts } from './lib/data.js'
import { useRoadRoutes } from './lib/routes.js'

export default function Logistics({ data }) {
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState('')
  const products = data?.products || []
  const requirements = data?.requirements || []
  const located = locatedProducts(products)
  const { routes, loading, targets } = useRoadRoutes(products, 8)
  const selected = targets.find((product) => product.id === selectedId) || targets[0]
  const routeList = targets.map((product) => ({ product, route: routes[product.id] }))
  const totalKm = routeList.reduce((sum, item) => sum + Number(item.route?.distance_km || 0), 0)
  const totalMinutes = routeList.reduce((sum, item) => sum + Number(item.route?.duration_min || 0), 0)
  const roadCount = routeList.filter((item) => item.route?.source === 'osrm').length

  async function explain() {
    setBusy(true)
    setError('')
    setAnswer(null)
    try {
      const payload = assistantPayload('logistics', data)
      payload.routes = targets.map((product) => ({
        listing_id: product.id,
        produce: product.name,
        origin: [product.lat, product.lng],
        destination: [HUB.lat, HUB.lng],
        destination_label: `${HUB.label} (illustrative hub)`,
        road_km: routes[product.id]?.distance_km ?? null,
        duration_min: routes[product.id]?.duration_min ?? null,
        route_source: routes[product.id]?.source ?? 'unavailable',
      }))
      setAnswer(await askGemma('logistics', payload))
    } catch (caught) {
      setError(caught.name === 'TimeoutError' ? 'The hosted model timed out. Retry shortly.' : caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Route planning"
        title="Logistics Planner"
        subtitle="Road routes from farm listings to an illustrative city market hub."
        actions={(
          <button type="button" className="btn btn-primary" onClick={explain} disabled={busy || !targets.length}>
            <Sparkles size={14} />{busy ? 'Asking Gemma…' : 'Explain with Gemma'}
          </button>
        )}
      />

      <div className="stats-grid">
        <StatCard icon={MapPin} tone="green" label="Located Listings" value={located.length} sub={`${products.length} total listings`} />
        <StatCard icon={Route} tone="blue" label="Road Routes" value={`${roadCount}/${targets.length}`} sub={loading ? 'Calculating…' : 'OSRM road geometry'} />
        <StatCard icon={Truck} tone="orange" label="Displayed Distance" value={`${fmt(totalKm)} km`} sub="May include straight-line fallback" />
        <StatCard icon={Clock} tone="purple" label="Estimated Drive Time" value={totalMinutes ? `${Math.round(totalMinutes)} min` : '—'} sub="OSRM estimate; not a delivery promise" />
      </div>

      {error ? <Alert>{error}</Alert> : null}
      {answer ? (
        <Card className="answer-card">
          <div className="answer-head"><Sparkles size={16} className="icon-green" />Gemma logistics review <Badge tone="gray">{answer.model}</Badge></div>
          <div className="answer-text">{answer.text}</div>
        </Card>
      ) : null}

      <Card>
        <CardHead
          icon={Map}
          title="Delivery routes"
          subtitle={`${HUB.label} · illustrative hub, not a verified facility`}
          actions={loading ? <span className="muted-small"><RefreshCw size={12} className="spinner" /> routing…</span> : <Badge tone="green">{routeList.length} routes</Badge>}
        />
        <div className="logistics-map">
          {targets.length ? (
            <RoutesMap
              products={targets}
              routes={routes}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              height={430}
            />
          ) : <EmptyState icon={Map} title="No coordinates available">Listings need latitude and longitude before routes can be drawn.</EmptyState>}
        </div>
        <div className="route-summary logistics-summary">
          <span className="route-truck"><Truck size={16} /></span>
          <div>
            <strong>{loading ? 'Calculating road routes…' : `${routeList.length} stops · ${fmt(totalKm)} km (est.)`}</strong>
            <div className="route-sub">Green line = selected farm. Blue lines = other displayed farms. Red marker = city hub.</div>
          </div>
        </div>
      </Card>

      {loading && !routeList.length ? <Spinner label="Requesting road routes…" /> : null}

      <Card>
        <CardHead icon={Route} title="Pickup planning" subtitle="Road distance is supplied by OSRM; fallback rows use straight-line distance" />
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr>{['Farm / produce', 'Origin', 'Available', 'Road distance', 'Drive time', 'Source', ''].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
            <tbody>
              {routeList.map(({ product, route }) => (
                <tr key={product.id} className={product.id === selected?.id ? 'row-selected' : ''}>
                  <td><strong>{product.name}</strong><div className="cell-sub">{product.farmer}</div></td>
                  <td>{product.location}</td>
                  <td>{fmt(product.quantity)} kg</td>
                  <td>{route ? `${fmt(route.distance_km)} km` : '—'}</td>
                  <td>{route?.duration_min ? `${route.duration_min} min` : '—'}</td>
                  <td>{route ? <Badge tone={route.source === 'osrm' ? 'green' : 'orange'}>{route.source === 'osrm' ? 'Road route' : 'Fallback'}</Badge> : <Badge tone="gray">Pending</Badge>}</td>
                  <td><button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedId(product.id)}><MapPin size={12} /> Show</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!routeList.length ? <div className="chart-empty">No listing coordinates are available.</div> : null}
        </div>
      </Card>

      <Disclaimer>Road geometry comes from the public OSRM demo server. The hub is illustrative, no delivery is dispatched, and no live traffic or vehicle tracking is included. Fallback rows show straight-line distance when routing is unavailable.</Disclaimer>
    </div>
  )
}
