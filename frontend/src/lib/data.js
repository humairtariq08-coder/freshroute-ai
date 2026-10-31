export const API = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '')

export const HUB = { lat: 24.8607, lng: 67.0011, label: 'City Market · Karachi' }

export const PRODUCE_IMAGES = {
  tomatoes: '/images/produce-tomatoes.png',
  potatoes: '/images/produce-potatoes.png',
  onions: '/images/produce-onions.png',
  peppers: '/images/produce-chillies.png',
}

export const PRODUCE_EMOJI = {
  tomatoes: '🍅', spinach: '🥬', mango: '🥭', potatoes: '🥔', onions: '🧅',
  carrots: '🥕', cucumber: '🥒', bananas: '🍌', peppers: '🌶️', herbs: '🌿',
  rice: '🌾', oranges: '🍊',
}

export const CATEGORY_TONES = {
  Vegetables: 'green',
  Fruits: 'orange',
  'Leafy greens': 'teal',
  Grains: 'sand',
}

export function produceImage(product) {
  return PRODUCE_IMAGES[String(product?.image || '').toLowerCase()] || null
}

export function produceEmoji(product) {
  return PRODUCE_EMOJI[String(product?.image || '').toLowerCase()] || '🥬'
}

export const fmt = (value, digits = 1) =>
  Number(value || 0).toLocaleString('en-PK', { maximumFractionDigits: digits })

export const fmtPKR = (value) => `Rs. ${fmt(value, 0)}`

export function haversineKm(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function locatedProducts(products) {
  return (products || []).filter((product) => {
    const lat = Number(product.lat)
    const lng = Number(product.lng)
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  })
}

export function forecastSnapshot(history) {
  const daily = (history || [])
    .filter((row) => Number.isFinite(Number(row.demand)))
    .map((row) => ({ ...row, demand: Number(row.demand), supply: Number(row.supply || 0) }))
  const recent = daily.slice(-7)
  const mean = recent.length
    ? recent.reduce((sum, row) => sum + row.demand, 0) / recent.length
    : null
  return {
    daily,
    recent,
    mean,
    method: 'Arithmetic mean of up to seven recorded demo demand days; not a trained forecast model.',
  }
}

export function supplyByCategory(products) {
  const rows = new Map()
  for (const product of products || []) {
    const key = product.category || 'Other'
    rows.set(key, (rows.get(key) || 0) + Number(product.quantity || 0))
  }
  return [...rows.entries()].map(([category, supply]) => ({ category, supply: Math.round(supply * 10) / 10 }))
}

export function demandByProduce(requirements) {
  return (requirements || []).map((requirement) => ({
    produce: requirement.produce,
    demand: Number(requirement.quantity || 0),
  }))
}

export function featuredProducts(products) {
  const preferred = ['tomatoes', 'potatoes', 'onions', 'peppers']
  const list = [...(products || [])]
  const chosen = []
  for (const slug of preferred) {
    const match = list.find((product) => String(product.image).toLowerCase() === slug)
    if (match) chosen.push(match)
  }
  for (const product of list) {
    if (chosen.length >= 4) break
    if (!chosen.includes(product)) chosen.push(product)
  }
  return chosen.slice(0, 4)
}

export function relativeTime(value) {
  if (!value) return 'Just now'
  const raw = String(value)
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T') + 'Z'
  const then = new Date(normalized)
  if (Number.isNaN(then.getTime())) return 'Recently'
  const minutes = Math.max(0, Math.round((Date.now() - then.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export function activityFeed(data) {
  const orders = (data?.orders || []).slice(0, 3).map((order) => ({
    tone: 'green',
    icon: 'cart',
    title: `Order reserved: ${order.product_name}`,
    meta: `${order.buyer} · ${fmt(order.quantity)} kg · ${fmtPKR(order.total)}`,
    when: relativeTime(order.created_at),
  }))
  const requirements = (data?.requirements || []).slice(0, 2).map((requirement) => ({
    tone: 'orange',
    icon: 'bag',
    title: `Buyer requirement: ${requirement.produce}`,
    meta: `${requirement.buyer} · ${fmt(requirement.quantity)} kg`,
    when: requirement.demo ? 'Demo record' : 'Recently added',
  }))
  const listings = (data?.products || []).slice(0, 3).map((product) => ({
    tone: 'blue',
    icon: 'sprout',
    title: `Listing: ${product.name}`,
    meta: `${product.farmer} · ${product.location}`,
    when: product.demo ? 'Demo catalog' : 'Recently listed',
  }))
  return [...orders, ...requirements, ...listings].slice(0, 6)
}

export async function apiGet(path) {
  const response = await fetch(`${API}${path}`)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload.detail === 'string' ? payload.detail : `Request failed (HTTP ${response.status}).`)
  }
  return payload
}

export async function askGemma(task, data, extra = {}) {
  const response = await fetch(`${API}/api/ai/assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, data, ...extra }),
    signal: AbortSignal.timeout(45000),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof payload.detail === 'string' ? payload.detail : 'The AI request failed. Check the backend configuration.')
  }
  if (!payload.text) throw new Error('The hosted model returned no text.')
  return payload
}

export function aiStatusMeta(status) {
  const value = status?.status || 'NOT_CONFIGURED'
  if (value === 'CONNECTED') return { label: 'Online', tone: 'online' }
  if (value === 'NOT_VERIFIED') return { label: 'Ready', tone: 'ready' }
  if (value === 'UNAVAILABLE') return { label: 'Offline', tone: 'offline' }
  return { label: 'Not configured', tone: 'offline' }
}

export function assistantPayload(task, data) {
  const products = data?.products || []
  const requirements = data?.requirements || []
  const history = data?.history || []
  const snapshot = forecastSnapshot(history)
  const supply = products.reduce((sum, product) => sum + Number(product.quantity || 0), 0)
  const openDemand = requirements.reduce((sum, requirement) => sum + Number(requirement.quantity || 0), 0)
  if (task === 'forecast') {
    return {
      forecast: {
        method: snapshot.method,
        daily_history: snapshot.recent,
        next_day_demand_kg: snapshot.mean == null ? null : Number(snapshot.mean.toFixed(1)),
        current_supply_kg: supply,
        current_requirements_kg: openDemand,
        demo: true,
      },
    }
  }
  if (task === 'matching') return { listings: products, requirements }
  if (task === 'logistics') {
    return {
      routes: locatedProducts(products).map((product) => ({
        listing_id: product.id,
        origin: [product.lat, product.lng],
        destination: [HUB.lat, HUB.lng],
        destination_label: `${HUB.label} (illustrative hub)`,
        straight_line_km: Number(haversineKm(
          { lat: Number(product.lat), lng: Number(product.lng) },
          HUB,
        ).toFixed(1)),
        road_route_verified: false,
      })),
      demand: requirements,
    }
  }
  const produce = products[0]
  return produce ? {
    produce: {
      name: produce.name,
      category: produce.category,
      farmer: produce.farmer,
      location: produce.location,
      price_pkr_per_kg: produce.price,
      available_kg: produce.quantity,
      freshness_days: produce.freshness_days,
      description: produce.description,
    },
  } : {}
}
