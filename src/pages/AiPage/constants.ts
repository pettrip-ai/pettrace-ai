import type { Pet } from '../../data/types'
import type { PetContext } from '../../lib/ai'
import { PLACES } from '../../data/mock'
import type { CityId } from '../../data/types'

export const QUICK_SUGGESTIONS = [
  '下周六带豆豆去杭州玩一天',
  '两天一夜苏州携宠游',
  '帮我规划这周的遛狗路线',
]

export function petToContext(pet: Pet): PetContext {
  const size: PetContext['size'] = (() => {
    if (pet.weightKg === undefined) return 'any'
    if (pet.weightKg <= 6) return 'small'
    if (pet.weightKg <= 15) return 'medium'
    return 'large'
  })()
  const personality = '温和'
  return {
    name: pet.name,
    kind: pet.kind,
    breed: pet.breed,
    size,
    personality,
    weightKg: pet.weightKg,
  }
}

export function weightLabel(weightKg?: number): string {
  if (weightKg === undefined) return ''
  if (weightKg <= 6) return '小型'
  if (weightKg <= 15) return '中型'
  return '大型'
}

export function petLine(pet: Pet): string {
  const size = weightLabel(pet.weightKg) || '中型'
  return `基于你的宠物${pet.name}（${pet.breed ?? pet.kind}·${size}·温和）`
}

export function chatToHistory(chat: { role: 'user' | 'assistant'; content: string }[]) {
  return chat.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

export function placesListFor(city: CityId) {
  return PLACES[city].map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    rule: {
      sizeLimit: p.rule.sizeLimit,
      allowIndoor: p.rule.allowIndoor,
      notes: p.rule.notes,
    },
  }))
}

export function placeNameOf(city: CityId, placeId: string): string {
  const places = PLACES[city]
  const p = places.find((x) => x.id === placeId)
  if (p) return p.name
  for (const c of Object.keys(PLACES) as CityId[]) {
    const pp = PLACES[c].find((x) => x.id === placeId)
    if (pp) return pp.name
  }
  return '地点'
}
