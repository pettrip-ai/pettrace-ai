import Fuse from 'fuse.js'
import type { Place as PlaceBase, PlaceCategory } from '../../data/types'

export type CategoryFilter = 'all' | PlaceCategory
export type SizeFilter = 'all' | 'large_ok' | 'medium_small'

export interface PlaceRich extends PlaceBase {
  icon?: string
  likes?: number
  size?: SizeFilter
  cityLabel?: string
  friendlyHint?: string
}

function sizeMatches(sizeLimit: PlaceBase['rule']['sizeLimit'], filter: SizeFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'large_ok') return sizeLimit === 'any' || sizeLimit === 'large'
  return sizeLimit === 'any' || sizeLimit === 'medium' || sizeLimit === 'small'
}

export function filterPlaces<P extends PlaceRich>(
  merged: P[],
  catFilter: CategoryFilter,
  sizeFilter: SizeFilter,
  search: string,
): P[] {
  let arr = merged
  if (catFilter !== 'all') {
    if (catFilter === 'restaurant' || catFilter === 'cafe') {
      arr = arr.filter((p) => p.category === 'restaurant' || p.category === 'cafe')
    } else if (catFilter === 'park' || catFilter === 'scenic_spot') {
      arr = arr.filter((p) => p.category === 'park' || p.category === 'scenic_spot')
    } else {
      arr = arr.filter((p) => p.category === catFilter)
    }
  }
  arr = arr.filter((p) => sizeMatches(p.rule.sizeLimit, sizeFilter))
  if (search.trim()) {
    const fuse = new Fuse(arr, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'address', weight: 0.2 },
        { name: 'rule.notes', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    })
    return fuse.search(search.trim()).map((r) => r.item)
  }
  return arr
}

export function enrichPlace(p: PlaceBase, city?: PlaceBase['city']): PlaceRich {
  const icons = ['🏨', '🐾', '🏞️', '🍜', '🌳', '☕', '🛍️', '🌿']
  const icon = icons[Math.abs(hash(p.id)) % icons.length]
  const size: SizeFilter = p.rule.sizeLimit === 'large' || p.rule.sizeLimit === 'any' ? 'large_ok' : 'medium_small'
  return {
    ...p,
    icon,
    likes: Math.max(0, Math.round(p.verifierCount * 0.7 + (p.rating ?? 3) * 8)),
    size,
    cityLabel: city === 'shanghai' ? '上海' : city === 'beijing' ? '北京' : city === 'guangzhou' ? '广州' : '成都',
    friendlyHint:
      p.rule.allowIndoor && p.rule.hasOutdoorSeat ? '可室内 · 有外摆'
      : p.rule.allowIndoor ? '可室内'
      : p.rule.hasOutdoorSeat ? '有外摆'
      : '仅室外',
  }
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}
