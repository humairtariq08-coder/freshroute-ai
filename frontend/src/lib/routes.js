import { useEffect, useMemo, useState } from 'react'
import { API, HUB, haversineKm, locatedProducts } from './data'

export function useRoadRoutes(products, limit = 6) {
  const targets = useMemo(
    () => locatedProducts(products).slice(0, limit),
    [products, limit],
  )
  const key = targets.map((product) => `${product.id}:${product.lat}:${product.lng}`).join('|')
  const [state, setState] = useState({ routes: {}, loading: false })

  useEffect(() => {
    if (!targets.length) {
      setState({ routes: {}, loading: false })
      return undefined
    }
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true }))
    Promise.all(targets.map(async (product) => {
      const origin = { lat: Number(product.lat), lng: Number(product.lng) }
      const params = new URLSearchParams({
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: HUB.lat,
        dest_lng: HUB.lng,
      })
      try {
        const response = await fetch(`${API}/api/route?${params}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return [product.id, await response.json()]
      } catch {
        return [product.id, {
          source: 'fallback',
          distance_km: Number(haversineKm(origin, HUB).toFixed(1)),
          duration_min: null,
          geometry: [origin, { lat: HUB.lat, lng: HUB.lng }],
          note: 'Routing service unreachable; straight-line fallback shown.',
        }]
      }
    })).then((entries) => {
      if (!cancelled) setState({ routes: Object.fromEntries(entries), loading: false })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { ...state, targets }
}
