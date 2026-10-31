import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet'
import { ArrowUpRight, Boxes, Route, Sparkles, Link2, TrendingUp, MapPin } from 'lucide-react'

const api = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const green = '#225e43'
const card = { background: '#fff', border: '1px solid #e6e9e1', borderRadius: 20, padding: 24, minWidth: 0 }
const muted = { color: '#778278', fontSize: 13, lineHeight: 1.7 }
const button = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 18px', border: 0, borderRadius: 10, background: green, color: 'white', cursor: 'pointer', fontWeight: 600 }
const number = value => Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: 1 })
const normalize = value => String(value || '').trim().toLowerCase()
const isMatch = (product, requirement) => {
  const name = normalize(product.name)
  const produce = normalize(requirement.produce)
  return produce && (name.includes(produce) || produce.includes(name)) && Number(product.price) <= Number(requirement.max_price) && Number(product.quantity) > 0 && Number(requirement.quantity) > 0
}

function Stat({ title, value, icon: Icon, caption }) {
  return <div style={card}><div style={{ display: 'flex', justifyContent: 'space-between', color: '#7b877d', fontSize: 13 }}>{title}<Icon size={19} color={green} /></div><div style={{ fontSize: 30, letterSpacing: '-1px', fontWeight: 700, marginTop: 14, color: '#203c2d' }}>{value}</div><div style={{ ...muted, marginTop: 5 }}>{caption}</div></div>
}

function FocusRoute({ selected }) {
  const map = useMap()
  useEffect(() => {
    if (selected) map.fitBounds([[Number(selected.lat), Number(selected.lng)], [24.8607, 67.0011]], { padding: [45, 45], maxZoom: 11 })
  }, [map, selected?.id, selected?.lat, selected?.lng])
  return null
}

export default function Insights({ view, data }) {
  const [answer, setAnswer] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const products = data?.products || []
  const requirements = data?.requirements || []
  const orders = data?.orders || []
  const history = data?.history || []
  const [selectedId, setSelectedId] = useState(null)
  const located = products.filter(product => Number.isFinite(Number(product.lat)) && Number.isFinite(Number(product.lng)) && product.lat != null && product.lng != null)
  const selected = located.find(product => product.id === selectedId) || located[0]
  const hub = [24.8607, 67.0011]
  const matches = useMemo(() => requirements.flatMap(requirement => products.filter(product => isMatch(product, requirement)).map(product => ({ product, requirement, quantity: Math.min(Number(product.quantity), Number(requirement.quantity)) }))).sort((a, b) => b.quantity - a.quantity), [products, requirements])
  const stock = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
  const demand = requirements.reduce((sum, requirement) => sum + Number(requirement.quantity || 0), 0)
  const chart = products.reduce((rows, product) => {
    const name = product.category || 'Other'
    const row = rows.find(item => item.category === name)
    if (row) row.supply += Number(product.quantity || 0)
    else rows.push({ category: name, supply: Number(product.quantity || 0) })
    return rows
  }, [])
  const demandChart = requirements.map(requirement => ({ produce: requirement.produce, demand: Number(requirement.quantity || 0) }))
  const daily = history.filter(item => Number.isFinite(Number(item.demand))).map(item => ({ ...item, demand: Number(item.demand), supply: Number(item.supply || 0) }))
  const recent = daily.slice(-7)
  const forecast = recent.length ? recent.reduce((sum, item) => sum + item.demand, 0) / recent.length : null
  function distance(product) {
    const rad = angle => angle * Math.PI / 180
    const a = Math.sin(rad(hub[0] - product.lat) / 2) ** 2 + Math.cos(rad(product.lat)) * Math.cos(rad(hub[0])) * Math.sin(rad(hub[1] - product.lng) / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  async function explain() {
    setBusy(true); setError(''); setAnswer(null)
    let task = 'forecast'
    let input = { forecast: { method: 'Mean of up to last seven recorded daily demand values; not machine learning', daily_history: recent, next_day_demand_kg: forecast, current_supply_kg: stock, current_requirements_kg: demand, demo: true } }
    if (view === 'logistics') {
      task = 'logistics'
      input = { routes: located.map(product => ({ listing_id: product.id, origin: [product.lat, product.lng], destination: hub, destination_label: 'Illustrative Karachi hub', straight_line_km: Number(distance(product).toFixed(1)), road_route_verified: false })), demand: requirements }
    } else if (view === 'matches') {
      task = 'matching'; input = { listings: products, requirements }
    }
    try {
      const response = await fetch(`${api}/api/ai/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, data: input }), signal: AbortSignal.timeout(45000) })
      const result = await response.json()
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'AI request failed. Check the backend configuration.')
      if (!result.text) throw new Error('The hosted model returned no explanation.')
      setAnswer({ ...result, view })
    } catch (err) { setError(err.name === 'TimeoutError' ? 'The hosted model timed out. Please retry.' : err.message) }
    finally { setBusy(false) }
  }
  const intro = { analytics: ['A clearer picture of demand.', 'Explore available produce and buyer requirements, with a transparent demand baseline.'], logistics: ['From farm to your city.', 'Plan pickup locations and compare indicative distances to the Karachi distribution hub.'], matches: ['Good produce. The right buyer.', 'Find compatible listings using produce names, budget, and available quantities.'] }[view] || ['', '']
  return <div style={{ display: 'grid', gap: 24, color: '#203c2d' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0, fontSize: 27, fontWeight: 650, letterSpacing: '-.7px' }}>{intro[0]}</h2><p style={muted}>{intro[1]}</p></div><button onClick={explain} disabled={busy || !products.length} style={{ ...button, opacity: busy ? .6 : 1 }}><Sparkles size={16} />{busy ? 'Asking Gemma…' : 'Explain with Gemma'}</button></div>
    <div style={{ padding: '11px 16px', borderRadius: 10, background: '#f0f3e8', color: '#68754e', fontSize: 12 }}>Demo catalog included · Calculations use stored records · AI explanations require a live hosted response</div>
    {error && <div role="alert" style={{ ...card, borderColor: '#e7a79c', color: '#a64636' }}>{error}</div>}
    {answer?.view === view && <div style={{ ...card, background: '#f3f8f2' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 12 }}><Sparkles size={18} />Gemma explanation</div><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>{answer.text}</div><p style={muted}>{answer.model} · Review recommendations before acting.</p></div>}
    {view === 'analytics' && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18 }}><Stat title="Available supply" value={`${number(stock)} kg`} icon={Boxes} caption="Current listing quantities" /><Stat title="Requested by buyers" value={`${number(demand)} kg`} icon={TrendingUp} caption={`${requirements.length} stored requirements`} /><Stat title="Next-day demand baseline" value={forecast == null ? 'No history' : `${number(forecast)} kg`} icon={ArrowUpRight} caption={forecast == null ? 'Historical data is required' : `Mean of ${recent.length} recorded days`} /><Stat title="Orders recorded" value={number(orders.length)} icon={Link2} caption="Local orders; no payment processed" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))', gap: 22 }}><div style={card}><h3 style={{ marginTop: 0 }}>Supply by category</h3><p style={muted}>Available quantity in kilograms</p><div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eee6" /><XAxis dataKey="category" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="supply" name="Supply (kg)" fill={green} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div style={card}><h3 style={{ marginTop: 0 }}>What buyers need</h3><p style={muted}>Open requirements in kilograms</p>{demandChart.length ? <div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={demandChart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eee6" /><XAxis dataKey="produce" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="demand" name="Demand (kg)" fill="#adbf78" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p style={muted}>Add a buyer requirement to see demand here.</p>}</div></div>
      <div style={card}><h3 style={{ marginTop: 0 }}>Recorded demand trend</h3><p style={muted}>Seeded history is demonstration data. The baseline is an arithmetic mean, not an AI prediction or a validated forecasting model.</p>{daily.length ? <div style={{ height: 280 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke="#e9eee6" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="demand" name="Demand (kg)" stroke={green} strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div> : <p style={muted}>No historical demand records are available yet.</p>}</div>
    </>}
    {view === 'logistics' && <>
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}><MapContainer center={[25.0, 67.2]} zoom={8} style={{ height: 430, width: '100%', zIndex: 0 }} scrollWheelZoom={false}><FocusRoute selected={selected} /><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><CircleMarker center={hub} radius={12} pathOptions={{ color: '#d38c39', fillColor: '#efbf65', fillOpacity: 1 }}><Popup>Illustrative Karachi distribution hub. Not a verified facility.</Popup></CircleMarker>{located.map(product => <CircleMarker key={product.id} center={[Number(product.lat), Number(product.lng)]} radius={selected?.id === product.id ? 10 : 7} pathOptions={{ color: green, fillColor: '#72a878', fillOpacity: .85 }} eventHandlers={{ click: () => setSelectedId(product.id) }}><Popup><strong>{product.name}</strong><br />{product.farmer}<br />{product.location}<br />{number(product.quantity)} kg available</Popup></CircleMarker>)}{selected && <Polyline positions={[[Number(selected.lat), Number(selected.lng)], hub]} pathOptions={{ color: green, weight: 3, dashArray: '8 9' }} />}</MapContainer><div style={{ padding: '15px 22px', ...muted }}>Dashed line shows a straight-line connection, not a drivable route. Map tiles require internet. No live traffic, vehicle tracking, or travel-time prediction.</div></div>
      <div style={card}><h3 style={{ marginTop: 0 }}>Pickup planning</h3><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}><thead><tr style={{ color: '#7d877c' }}>{['Farm / produce', 'Origin', 'Available', 'Straight-line to hub', ''].map((label, index) => <th key={index} style={{ padding: '12px 10px', fontWeight: 500 }}>{label}</th>)}</tr></thead><tbody>{located.map(product => <tr key={product.id} style={{ borderTop: '1px solid #eef0e9', background: product.id === selected?.id ? '#f5f8ee' : 'transparent' }}><td style={{ padding: '16px 10px' }}><strong>{product.name}</strong><div style={muted}>{product.farmer}</div></td><td style={{ padding: 10 }}>{product.location}</td><td style={{ padding: 10 }}>{number(product.quantity)} kg</td><td style={{ padding: 10 }}>{number(distance(product))} km</td><td><button onClick={() => setSelectedId(product.id)} style={{ ...button, padding: '8px 12px', fontSize: 12 }}><MapPin size={13} />Show</button></td></tr>)}</tbody></table></div>{!located.length && <p style={muted}>No listing coordinates are available.</p>}</div>
    </>}
    {view === 'matches' && <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18 }}><Stat title="Compatible pairs" value={number(matches.length)} icon={Link2} caption="Name and budget compatible" /><Stat title="Buyer requirements" value={number(requirements.length)} icon={Boxes} caption="Stored purchasing requirements" /><Stat title="Available listings" value={number(products.filter(product => product.quantity > 0).length)} icon={Route} caption="Listings with remaining stock" /></div><p style={muted}>These are independent candidate pairs, not reserved allocations. A listing can appear more than once; placing an order rechecks stock.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 18 }}>{matches.map(({ product, requirement, quantity }, index) => <article style={card} key={`${product.id}-${requirement.id || index}`}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><span style={{ background: '#edf4e7', color: green, borderRadius: 20, padding: '6px 11px', fontSize: 11, fontWeight: 700 }}>Compatible match</span><Link2 size={18} color={green} /></div><h3 style={{ margin: '18px 0 8px' }}>{product.name}</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, margin: '22px 0' }}><div><div style={{ ...muted, fontSize: 11 }}>FARMER</div><strong style={{ fontSize: 14 }}>{product.farmer}</strong></div><ArrowUpRight size={20} color="#99ad84" /><div><div style={{ ...muted, fontSize: 11 }}>BUYER</div><strong style={{ fontSize: 14 }}>{requirement.buyer}</strong></div></div><div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid #edf0e8', fontSize: 13 }}><span>Up to <strong>{number(quantity)} kg</strong></span><strong>PKR {number(product.price)}/kg</strong></div><p style={{ ...muted, marginBottom: 0 }}>Within buyer budget of PKR {number(requirement.max_price)}/kg. Fulfillment and transport require confirmation.</p></article>)}</div>{!matches.length && <div style={card}><h3>No compatible pairs yet</h3><p style={muted}>Add buyer requirements matching an available produce name and price. Matches appear automatically.</p></div>}</>}
  </div>
}
