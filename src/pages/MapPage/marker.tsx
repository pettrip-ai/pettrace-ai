import L from 'leaflet'
import type { PlaceCategory } from '../../data/types'

const SVG_PATHS: Record<string, string> = {
  coffee: "<path d=\"M17 8h1a4 4 0 1 0 0-8h-1\"/><path d=\"M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z\"/><line x1=\"6\" y1=\"2\" x2=\"6\" y2=\"4\"/><line x1=\"10\" y1=\"2\" x2=\"10\" y2=\"4\"/><line x1=\"14\" y1=\"2\" x2=\"14\" y2=\"4\"/>",
  treepine: "<path d=\"M7 22v-4\"/><path d=\"M7 18c-4 3-8 2-8-4 0-5 4-8 12-8s12 3 12 8c0 6-4 7-8 4\"/><path d=\"M5 10c0-3 3-5 8-5s8 2 8 5\"/><path d=\"M10 5c0-3 2-5 5-5s5 2 5 5\"/>",
  bag: "<path d=\"M5 7h14l-1 13H6L5 7z\"/><path d=\"M9 7V5a4 4 0 0 1 8 0v2\"/><path d=\"M9 12h8\"/>",
  hotel: "<path d=\"M3 22V8l9-6 9 6v14\"/><path d=\"M3 22h18\"/><path d=\"M9 22v-6h6v6\"/><path d=\"M9 12h6\"/>",
  paw: "<path d=\"M12 18c-2 0-3-2-3-4 0-2 1-4 3-4s3 2 3 4c0 2-1 4-3 4\"/><path d=\"M7 10c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2\"/><path d=\"M17 10c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2\"/>",
  stethoscope: "<path d=\"M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-1a1 1 0 0 0-1-1H.8\"/><circle cx=\"18\" cy=\"16\" r=\"2\"/><circle cx=\"12\" cy=\"16\" r=\"2\"/><path d=\"M16 8v8\"/><path d=\"M12 8v8\"/><path d=\"M15 4h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1\"/>",
}

function pickIconSvg(category: PlaceCategory): string {
  switch (category) {
    case 'cafe':
    case 'restaurant':
      return SVG_PATHS.coffee
    case 'hotel':
      return SVG_PATHS.stethoscope
    case 'park':
    case 'scenic_spot':
    case 'pet_park':
      return SVG_PATHS.treepine
    case 'mall':
      return SVG_PATHS.bag
    default:
      return SVG_PATHS.coffee
  }
}

function accentColorFor(category: PlaceCategory): string {
  switch (category) {
    case 'cafe':
    case 'restaurant':
      return '#f76b7a'
    case 'hotel':
      return '#f76b7a'
    case 'park':
    case 'scenic_spot':
    case 'pet_park':
      return '#20a976'
    case 'mall':
      return '#f59e0b'
    default:
      return '#f76b7a'
  }
}

function buildPlaceIconHtml(category: PlaceCategory, isHighlight: boolean): string {
  const color = accentColorFor(category)
  const r = isHighlight ? 17 : 15
  const scale = isHighlight ? 1.08 : 1
  const stroke = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transform:scale(${scale});">${pickIconSvg(category)}</svg>`
  return `
    <div style="position:relative;width:40px;height:44px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="44" viewBox="0 0 40 44">
        <defs>
          <filter id="sh_${category}_${isHighlight ? 'h' : 'n'}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.2" flood-color="${color}40"/>
          </filter>
        </defs>
        <circle cx="20" cy="18" r="${r}" fill="${color}" filter="url(#sh_${category}_${isHighlight ? 'h' : 'n'})" />
        <circle cx="20" cy="18" r="${r}" fill="none" stroke="white" stroke-width="2" opacity="0.9" />
        <path d="M20 ${isHighlight ? 34 : 33} Q20 ${isHighlight ? 41 : 40} 17 ${isHighlight ? 41 : 40} L20 ${isHighlight ? 34 : 33} L23 ${isHighlight ? 41 : 40} Z" fill="${color}" opacity="0.85" />
      </svg>
      <div style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:5px;pointer-events:none;">${stroke}</div>
    </div>
  `
}

function buildUserLocationHtml(): string {
  return `
    <div style="position:relative;width:48px;height:48px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(247,107,122,0.18);animation:marker-pulse 2s ease-out infinite;transform-origin:center;"></div>
      <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(247,107,122,0.10);animation:marker-pulse 2s ease-out infinite 0.5s;transform-origin:center;"></div>
      <div style="position:absolute;top:10px;left:10px;width:28px;height:28px;border-radius:9999px;background:rgba(247,107,122,0.22);animation:marker-pulse 2s ease-out infinite;transform-origin:center;"></div>
      <div style="position:absolute;top:12px;left:12px;width:24px;height:24px;border-radius:9999px;background:var(--primary,#f76b7a);border:3px solid #ffffff;box-shadow:0 1px 4px rgba(247,107,122,0.45);"></div>
    </div>
  `
}

const iconCache = new Map<string, L.DivIcon>()

export function getMarkerIcon(category: PlaceCategory, highlight: boolean): L.DivIcon {
  const key = `${category}-${highlight ? '1' : '0'}`
  const cached = iconCache.get(key)
  if (cached) return cached
  const html = buildPlaceIconHtml(category, highlight)
  const icon = L.divIcon({
    html,
    className: 'paw-marker',
    iconSize: [40, 44],
    iconAnchor: [20, 42],
    popupAnchor: [0, -36],
  })
  iconCache.set(key, icon)
  return icon
}

export function getUserLocationMarkerIcon(): L.DivIcon {
  const key = '__user_location'
  const cached = iconCache.get(key)
  if (cached) return cached
  const html = buildUserLocationHtml()
  const icon = L.divIcon({
    html,
    className: 'user-loc-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  })
  iconCache.set(key, icon)
  return icon
}
