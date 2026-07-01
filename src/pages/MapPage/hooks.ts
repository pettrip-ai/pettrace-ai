import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { useStore } from '../../store/useStore'
import { CITIES } from '../../data/mock'

type LMap = any

export const mapRef: React.MutableRefObject<LMap> = { current: null } as unknown as React.MutableRefObject<LMap>
Object.defineProperty(mapRef, 'current', { value: null, writable: true })

export function CityFlyer() {
  const map = useMap()
  useEffect(() => {
    try {
      (mapRef as any).current = map
    } catch {
    }
  }, [map])
  const city = useStore((s) => s.city)
  const firstRunRef = useRef(true)
  const lastCityRef = useRef(city)
  useEffect(() => {
    if (firstRunRef.current) {
      const meta = CITIES[city]
      try { map.setView(meta.center, meta.zoom) } catch {}
      firstRunRef.current = false
      lastCityRef.current = city
      return
    }
    if (lastCityRef.current !== city) {
      const meta = CITIES[city]
      try { map.flyTo(meta.center, meta.zoom, { duration: 0.5 }) } catch {}
      lastCityRef.current = city
    }
  }, [city, map])
  return null
}

export function HighlightFocuser({ placeId }: { placeId: string | null }) {
  const map = useMap()
  const places = useStore((s) => s.places)
  const lastIdRef = useRef<string | null>(null)
  useEffect(() => {
    try { (mapRef as any).current = map } catch {}
    if (!placeId) return
    const p = places[placeId]
    if (!p) return
    const useFly = lastIdRef.current !== placeId
    lastIdRef.current = placeId
    let zoom = 15
    try { zoom = Math.max(map.getZoom(), 15) } catch {}
    if (useFly) {
      try { map.flyTo([p.lat, p.lng], zoom, { duration: 0.3 }) } catch {}
    } else {
      try { map.setView([p.lat, p.lng], zoom) } catch {}
    }
  }, [placeId, map, places])
  return null
}
