import type { CityId, FeedItem, Pet, Place } from '../../data/types'
import { CITIES, PLACES } from '../../data/mock'
import { weightLabel } from './constants'

export interface PlanningSignal {
  key: 'pet' | 'rules' | 'risk' | 'community'
  label: string
  value: string
  detail: string
  tone: 'coral' | 'mint' | 'honey' | 'info'
}

export interface DemoScenario {
  id: string
  title: string
  prompt: string
  meta: string
  steps: string[]
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'large-dog-day',
    title: '大型犬友好一日游',
    prompt: '周六带豆豆在上海玩一天，午餐要室内可进，下午避开高温',
    meta: '档案 + 室内规则 + 避暑风险',
    steps: ['上午释放精力', '午餐室内可进', '下午低强度', '傍晚验证打卡'],
  },
  {
    id: 'rainy-indoor',
    title: '雨天室内备选',
    prompt: '上海雨天带狗出门，帮我规划室内可进和有遮挡的路线',
    meta: '天气约束 + 室内备选',
    steps: ['规则筛选', '室内优先', '户外备选', '到店确认'],
  },
  {
    id: 'two-day-hotel',
    title: '两天一夜含住宿',
    prompt: '两天一夜带金毛去上海玩，要包含宠物友好酒店和晚餐',
    meta: '住宿 + 服务费 + 行前清单',
    steps: ['酒店确认', '错峰游玩', '晚餐安排', '证件清单'],
  },
]

export function petDisplayName(pet?: Pet): string {
  if (!pet) return '未添加宠物'

  const size =
    weightLabel(pet.weightKg) ||
    (pet.size === 'large' ? '大型' : pet.size === 'small' ? '小型' : '中型')

  return `${pet.name} · ${pet.breed ?? pet.kind} · ${size}`
}

export function buildPlanningSignals(args: {
  city: CityId
  pet?: Pet
  showPetInChat: boolean
  places: Record<string, Place>
  feeds: FeedItem[]
}): PlanningSignal[] {
  const storePlaces = Object.values(args.places).filter((place) => place.city === args.city)
  const places = storePlaces.length > 0 ? storePlaces : PLACES[args.city]
  const placeIds = new Set(places.map((place) => place.id))
  const indoorCount = places.filter((place) => place.rule.allowIndoor).length
  const largeDogCount = places.filter((place) => ['large', 'any'].includes(place.rule.sizeLimit)).length
  const verifiedCount = places.reduce((sum, place) => sum + (place.verifierCount || 0), 0)
  const latestFeed = args.feeds
    .filter((feed) => placeIds.has(feed.placeId))
    .sort((a, b) => new Date(b.whenISO).getTime() - new Date(a.whenISO).getTime())[0]
  const cityName = CITIES[args.city]?.name ?? '当前城市'
  const authorizedPet = args.showPetInChat && args.pet

  return [
    {
      key: 'pet',
      label: '宠物档案',
      value: authorizedPet ? petDisplayName(args.pet) : '未授权',
      detail: authorizedPet ? 'AI 会使用档案做规划' : '默认私密，点击后才进入 AI 上下文',
      tone: 'coral',
    },
    {
      key: 'rules',
      label: '地点规则',
      value: `${places.length} 个候选点`,
      detail: `${indoorCount} 个室内可进，${largeDogCount} 个大型犬友好`,
      tone: 'mint',
    },
    {
      key: 'risk',
      label: '风险约束',
      value: '规则 + 天气 + 人流',
      detail: '优先避开体型限制、午后高温和周末拥挤',
      tone: 'honey',
    },
    {
      key: 'community',
      label: '社区验证',
      value: `${verifiedCount} 次验证`,
      detail: latestFeed ? `最近反馈：${latestFeed.type}` : `${cityName} 暂无本地新反馈`,
      tone: 'info',
    },
  ]
}
