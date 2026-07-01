import type { CityId, Place } from '../data/types'
import { PLACES, CITIES } from '../data/mock'
import type { AiItineraryStep, AiReply, PetContext } from './ai'

type CityKeyword = { id: CityId; keywords: string[] }

const CITY_KEYWORDS: CityKeyword[] = [
  { id: 'shanghai', keywords: ['上海', '沪', '魔都', 'shanghai'] },
  { id: 'beijing', keywords: ['北京', '京城', 'bj', 'beijing'] },
  { id: 'guangzhou', keywords: ['广州', '羊城', 'gz', 'guangzhou'] },
  { id: 'chengdu', keywords: ['成都', '蓉城', 'cd', 'chengdu'] },
]

const NAME_TO_ID: Record<string, CityId> = {
  苏州: 'shanghai',
  '杭州': 'shanghai',
  '南京': 'shanghai',
  '宁波': 'shanghai',
  '重庆': 'chengdu',
  '西安': 'beijing',
  '深圳': 'guangzhou',
  '佛山': 'guangzhou',
}

export function detectCity(
  text: string,
  fallback: CityId = 'shanghai',
): CityId {
  const lower = text.toLowerCase()
  for (const k of CITY_KEYWORDS) {
    if (k.keywords.some((kw) => lower.includes(kw.toLowerCase()))) return k.id
  }
  for (const [name, id] of Object.entries(NAME_TO_ID)) {
    if (text.includes(name)) return id
  }
  return fallback
}

export function detectDays(text: string, fallback = 1): number {
  const m = text.match(/(\d+)\s*天/)
  if (m) {
    const n = Number(m[1])
    if (n >= 1 && n <= 5) return n
  }
  if (/两天|2\s*天/.test(text)) return 2
  return fallback
}

export function detectFocus(text: string): {
  park: boolean
  food: boolean
  hotel: boolean
  walk: boolean
} {
  const t = text
  return {
    park: /公园|景点|乐园|自然|草坪|踏青/.test(t),
    food: /餐厅|吃饭|吃|火锅|茶餐厅|咖啡|cafe/.test(t),
    hotel: /酒店|住|住宿|酒店/.test(t),
    walk: /遛|散步|附近|一天/.test(t),
  }
}

function pickByCategory(places: Place[], cats: Array<Place['category']>): Place[] {
  const seen = new Set<string>()
  const out: Place[] = []
  for (const cat of cats) {
    for (const p of places) {
      if (p.category === cat && !seen.has(p.id)) {
        out.push(p)
        seen.add(p.id)
        break
      }
    }
  }
  return out
}

function briefOf(p: Place): string {
  const r = p.rule
  const sizeMap: Record<string, string> = {
    any: '全尺寸',
    small: '仅限小型',
    medium: '中小型',
    large: '大型',
  }
  const size = sizeMap[r.sizeLimit] ?? '全尺寸'
  const indoor = r.allowIndoor ? '室内可进' : '仅限室外'
  return `${size} · ${indoor}${r.fee > 0 ? ` · 服务费${r.fee}` : ''}`
}

function makeItineraryForDay(
  dayIdx: number,
  dayPlaces: Place[],
): AiItineraryStep[] {
  const out: AiItineraryStep[] = []
  const cats = [
    'park',
    'pet_park',
    'restaurant',
    'cafe',
    'mall',
    'scenic_spot',
  ] as const
  const picked = pickByCategory(dayPlaces, cats as unknown as Array<Place['category']>)

  const startHour = 8 + dayIdx * 24
  const slots = [
    { time: `${String(startHour).padStart(2, '0')}:00`, label: '上午遛宠', idx: 1 },
    { time: `${String(startHour + 2).padStart(2, '0')}:30`, label: '特色景点', idx: 0 },
    { time: `${String(startHour + 5).padStart(2, '0')}:00`, label: '午餐', idx: 2 },
    { time: `${String(startHour + 7).padStart(2, '0')}:30`, label: '宠物公园', idx: 1 },
    { time: `${String(startHour + 11).padStart(2, '0')}:00`, label: '晚餐', idx: 3 },
  ]

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const p = picked[i % Math.max(1, picked.length)]
    if (!p) continue
    out.push({
      time: slot.time,
      placeId: p.id,
      label: slot.label,
      ruleBrief: briefOf(p),
      action: i === slots.length - 1 ? (p.rule.allowIndoor ? '室内用餐' : '户外用餐') : '打车前往',
    })
  }
  return out
}

function risksOf(places: Place[]): string[] {
  const risks: string[] = []
  const hasIndoorDeny = places.some((p) => !p.rule.allowIndoor)
  if (hasIndoorDeny) risks.push('部分地点仅限室外，雨天请准备室内备用方案')
  const outdoor = places.some((p) => p.rule.hasOutdoorSeat || p.category === 'park' || p.category === 'pet_park')
  if (outdoor) risks.push('夏季中午注意宠物中暑，建议户外活动避开 11:00-15:00')
  const fee = places.find((p) => p.rule.fee > 0)
  if (fee) risks.push(`部分酒店/餐厅收取宠物服务费，如 ${fee.name} 服务费 ${fee.rule.fee} 元`)
  const leashNeeded = places.every((p) => p.rule.leashRequired)
  if (leashNeeded) risks.push('几乎所有地点都要求牵绳，请务必携带 1.5m 以内的胸背式牵引')
  risks.push('周末热门景点人流大，建议 09:00 前抵达')
  return risks
}

const BASE_CHECKLIST = [
  '疫苗本 / 宠物证件',
  '胸背式牵引绳 + 备用牵引',
  '宠物尿垫 / 拾便袋',
  '外出饮水壶 + 折叠食盆',
  '宠物湿巾 / 消毒喷雾',
  '航空/车载安全笼（远途或网约车）',
  '宠物零食 / 应急粮',
  '宠物急救包（碘伏、止血粉、绷带）',
]

function proseFor(
  city: CityId,
  days: number,
  petContext?: PetContext,
  cityName = '',
): string {
  const cityLabel = cityName || CITIES[city]?.name || city
  const petIntro = petContext
    ? `结合${petContext.name}（${petContext.breed ?? petContext.kind} · ${petContext.size ?? '中型'} · ${petContext.personality ?? '温和'}）的性格，`
    : ''
  return `${petIntro}下面是为你量身定制的${cityLabel}${days === 1 ? '一日' : `${days}天`}携宠行程。整体以「宠物可进优先、人流高峰错峰」为原则，上午安排公园/景点释放活力，午餐选择户外友好餐厅，下午去宠物公园自由奔跑，傍晚以能进室内的餐厅收尾。

行程中每一步都标注了对应地点的宠物友好规则（尺寸限制 / 是否允许室内 / 服务费），点击下方卡片可以直接跳到地图查看真实位置。周末出行建议比平时提前半小时出门，以免热门点位限流。`
}

function lastItinerary(_history: Array<{ role: string; content: string }>): AiItineraryStep[] | null {
  return null
}
void lastItinerary

export interface MockAiOptions {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  petContext?: PetContext
  city?: CityId
  seed?: number
}

export function mockAiEngine(opts: MockAiOptions): AiReply {
  const fallbackCity: CityId = opts.city ?? 'shanghai'
  const city = detectCity(opts.message, fallbackCity)
  const days = detectDays(opts.message, 1)
  const places = PLACES[city]
  const focus = detectFocus(opts.message)

  let itinerary: AiItineraryStep[] = []
  for (let d = 0; d < days; d++) {
    itinerary.push(...makeItineraryForDay(d, places))
  }

  if (focus.food) {
    const restaurant = places.find((p) => p.category === 'restaurant')
    if (restaurant) {
      itinerary = itinerary.map((step) =>
        step.label === '午餐' || step.label === '晚餐'
          ? { ...step, placeId: restaurant.id, ruleBrief: briefOf(restaurant), action: '户外用餐' }
          : step,
      )
    }
  }

  if (/晚餐|晚饭|室内/.test(opts.message)) {
    const indoorRestaurant = places.find(
      (p) => p.category === 'restaurant' && p.rule.allowIndoor,
    )
    if (indoorRestaurant) {
      itinerary = itinerary.map((step) =>
        step.label === '晚餐'
          ? { ...step, placeId: indoorRestaurant.id, ruleBrief: briefOf(indoorRestaurant), action: '室内用餐' }
          : step,
      )
    }
  }

  if (opts.history && opts.history.length > 1 && /改一下|换|调整/.test(opts.message)) {
    const indoorRestaurant = places.find(
      (p) => p.category === 'restaurant' && p.rule.allowIndoor,
    )
    const petPark = places.find((p) => p.category === 'pet_park')
    if (indoorRestaurant) {
      itinerary = itinerary.map((step) =>
        step.label === '晚餐'
          ? { ...step, placeId: indoorRestaurant.id, ruleBrief: briefOf(indoorRestaurant), action: '室内用餐' }
          : step,
      )
    }
    if (petPark && itinerary.length < 6) {
      itinerary = [
        ...itinerary.slice(0, 3),
        { time: '16:30', placeId: petPark.id, label: '补充撒欢', ruleBrief: briefOf(petPark), action: '牵绳进出' },
        ...itinerary.slice(3),
      ]
    }
  }

  if (itinerary.length === 0) {
    itinerary = makeItineraryForDay(0, places)
  }

  const risks = risksOf(places)
  const checklist = BASE_CHECKLIST.slice(0, 6 + (days > 1 ? 2 : 0))
  const cityName = CITIES[city]?.name ?? city
  const prose = proseFor(city, days, opts.petContext, cityName)

  return { prose, itinerary, risks, checklist }
}
