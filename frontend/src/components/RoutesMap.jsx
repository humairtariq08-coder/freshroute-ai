import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import { HUB, fmt } from '../lib/data'

function FitBounds({ points }) {
  const map = useMap()
  const key = points.map((point) => point.join(',')).join('|')
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [38, 38], maxZoom: 9 })
  }, [map, key, points])
  return null
}

export default function RoutesMap({ products, routes, selectedId, onSelect, height = 280 }) {
  const points = products.map((product) => [Number(product.lat), Number(product.lng)])
  const bounds = [...points, [HUB.lat, HUB.lng]]

  return (
    <MapContainer
      center={[25.5, 68.2]}
      zoom={7}
      scrollWheelZoom={false}
      zoomControl={false}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <FitBounds points={bounds} />

      {products.map((product) => {
        const route = routes[product.id]
        if (!route?.geometry?.length) return null
        const selected = selectedId === product.id
        return (
          <Polyline
            key={`route-${product.id}`}
            positions={route.geometry.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: selected ? '#15803d' : '#4a90e2',
              weight: selected ? 5 : 3,
              opacity: selected ? 0.95 : 0.7,
              lineCap: 'round',
            }}
          />
        )
      })}

      {products.map((product) => (
        <CircleMarker
          key={`farm-${product.id}`}
          center={[Number(product.lat), Number(product.lng)]}
          radius={selectedId === product.id ? 9 : 7}
          pathOptions={{
            color: '#0f7a3d',
            fillColor: selectedId === product.id ? '#15803d' : '#6faf72',
            fillOpacity: 0.95,
            weight: 2,
          }}
          eventHandlers={{ click: () => onSelect?.(product.id) }}
        >
          <Popup>
            <strong>{product.name}</strong><br />
            {product.farmer}<br />
            {product.location}<br />
            {fmt(product.quantity)} kg available
          </Popup>
        </CircleMarker>
      ))}

      <CircleMarker
        center={[HUB.lat, HUB.lng]}
        radius={12}
        pathOptions={{ color: '#b91c1c', fillColor: '#ef4444', fillOpacity: 1, weight: 3 }}
      >
        <Popup>
          <strong>{HUB.label}</strong><br />
          Illustrative distribution hub. Not a verified facility.
        </Popup>
      </CircleMarker>
    </MapContainer>
  )
}
