import type { PlaceCategory } from '../../data/types'

export const CATEGORY_META: Record<PlaceCategory, { label: string; bg: string; accent: string }> = {
  restaurant: { label: '餐厅', bg: '#C2703E', accent: '#C2703E' },
  cafe: { label: '咖啡厅', bg: '#C2703E', accent: '#C2703E' },
  hotel: { label: '酒店', bg: '#C2703E', accent: '#C2703E' },
  park: { label: '公园', bg: '#5B8C5A', accent: '#5B8C5A' },
  scenic_spot: { label: '景区', bg: '#5B8C5A', accent: '#5B8C5A' },
  mall: { label: '商场', bg: '#C2703E', accent: '#C2703E' },
  pet_park: { label: '宠物乐园', bg: '#5B8C5A', accent: '#5B8C5A' },
}

export const CAT_GROUPS: { key: PlaceCategory; title: string }[] = [
  { key: 'restaurant', title: '餐厅' },
  { key: 'cafe', title: '咖啡厅' },
  { key: 'hotel', title: '酒店' },
  { key: 'park', title: '公园' },
  { key: 'scenic_spot', title: '景区' },
  { key: 'mall', title: '商场' },
  { key: 'pet_park', title: '宠物乐园' },
]

export const CATEGORY_FROM_EMOJI: Record<PlaceCategory, string> = {
  restaurant: '🍴',
  cafe: '☕',
  hotel: '🏨',
  park: '🌳',
  scenic_spot: '🗻',
  mall: '🛍️',
  pet_park: '🐾',
}

export type { PlaceCategory }

export function sizeLimitLabel(v: string) {
  switch (v) {
    case 'any':
      return '任意体型'
    case 'large':
      return '大型犬'
    case 'medium':
      return '中型犬以内'
    case 'small':
      return '仅小型'
    default:
      return '任意体型'
  }
}

export const OSM_TILE_CANDIDATES: { name: string; url: string; subdomains?: string[]; attribution: string }[] = [
  { name: 'osm-intl', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c'], attribution: '© OpenStreetMap contributors' },
  { name: 'osm-cn', url: 'https://tile-cn.openstreetmap.org/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c'], attribution: '© OpenStreetMap contributors' },
  { name: 'osm-jsd', url: 'https://{s}.osm-tiles.de/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c'], attribution: '© OpenStreetMap contributors' },
  { name: 'osm-ssh', url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors' },
  { name: 'amap-vec', url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', subdomains: ['1', '2', '3', '4'], attribution: '© 高德地图' },
  { name: 'amap-sat', url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}', subdomains: ['1', '2', '3', '4'], attribution: '© 高德地图' },
  { name: 'tianditu', url: 'https://t{s}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'], attribution: '© 天地图' },
]
