import type { CityId, FeedItem } from '../../store/useStore'

export type FeedType = FeedItem['type']

export const TYPE_META: Record<FeedType, { label: string; bg: string; border: string; text: string }> = {
  '打卡': { label: '打卡', bg: 'bg-primary/10', border: 'border-primary/25', text: 'text-primary' },
  '游记': { label: '游记', bg: 'bg-accent/10', border: 'border-accent/25', text: 'text-accent' },
  '避雷': { label: '避雷', bg: 'bg-error/10', border: 'border-error/25', text: 'text-error' },
  '经验分享': { label: '经验分享', bg: 'bg-honey/10', border: 'border-honey/25', text: 'text-honey-deep' },
}

export const CITY_TABS: { key: CityId | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'shanghai', label: '上海' },
  { key: 'beijing', label: '北京' },
  { key: 'guangzhou', label: '广州' },
  { key: 'chengdu', label: '深圳' },
]

export const CITY_NAMES: Record<CityId, string> = {
  shanghai: '上海',
  beijing: '北京',
  guangzhou: '广州',
  chengdu: '深圳',
}

export function feedCityOf(
  placeId: string,
  placesById: Record<string, { city: CityId } | undefined>,
): CityId | null {
  const p = placesById[placeId]
  return p ? p.city : null
}

export function initialsOf(s: string) {
  const t = (s || '').trim()
  if (!t) return '我'
  return t[0] || ''
}
