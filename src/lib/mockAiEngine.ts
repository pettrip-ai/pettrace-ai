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

interface TripIntent {
  days: number
  wantsIndoor: boolean
  wantsHotel: boolean
  rainy: boolean
  weekend: boolean
  largeDog: boolean
  avoidHeat: boolean
}

function detectIntent(text: string, petContext?: PetContext): TripIntent {
  const days = detectDays(text, 1)
  const largeDog = /大型犬|金毛|拉布拉多|阿拉斯加|哈士奇/.test(text) || petContext?.size === 'large'
  return {
    days,
    wantsIndoor: /室内|进店|可进|雨天|下雨/.test(text),
    wantsHotel: /酒店|住宿|住|两天|2\s*天|过夜/.test(text),
    rainy: /雨|下雨|雨天/.test(text),
    weekend: /周末|周六|周日|星期六|星期日/.test(text),
    largeDog,
    avoidHeat: /避暑|高温|太热|中暑|下午/.test(text),
  }
}

function canFitLargeDog(p: Place) {
  return p.rule.sizeLimit === 'any' || p.rule.sizeLimit === 'large'
}

function placeReason(p: Place, label: string, intent: TripIntent) {
  if (label.includes('午餐') || label.includes('晚餐')) {
    if (p.rule.allowIndoor) return '用餐时段优先选择室内可进，减少排队和天气影响'
    if (p.rule.hasOutdoorSeat) return '该地点有户外座位，适合作为宠物友好用餐点'
  }
  if (p.category === 'pet_park') return '宠物公园能释放精力，适合作为中段活动'
  if (p.category === 'park') return intent.avoidHeat ? '安排在上午活动，避开下午高温' : '开放空间更适合牵引散步'
  if (p.category === 'hotel') return '住宿点支持宠物入住，适合多日行程'
  return '地点规则清晰，社区验证信号较完整'
}

function verifyHintOf(p: Place) {
  if (p.rule.allowIndoor) return '到店后确认宠物是否仍可进入室内区域'
  if (p.rule.hasOutdoorSeat) return '到店后确认户外座位是否开放且是否需要预约'
  return '到达后确认牵引要求、体型限制和现场告示'
}

function alternativesFor(places: Place[], current: Place) {
  return places
    .filter((p) => p.id !== current.id && p.category === current.category)
    .slice(0, 2)
    .map((p) => ({ placeId: p.id, reason: p.rule.allowIndoor ? '同类型室内可进备选' : '同类型宠物友好备选' }))
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
  intent: TripIntent,
): AiItineraryStep[] {
  const categories: Array<Place['category']> = intent.wantsHotel && dayIdx > 0
    ? ['hotel', 'park', 'restaurant', 'pet_park', 'cafe']
    : ['park', 'scenic_spot', 'restaurant', 'pet_park', 'cafe']
  const pickedForIntent = pickByCategory(dayPlaces, categories)
  const indoorRestaurant = dayPlaces.find((p) => p.category === 'restaurant' && p.rule.allowIndoor)
  const petPark = dayPlaces.find((p) => p.category === 'pet_park')

  const intentSlots = [
    { time: '09:00', label: dayIdx === 0 ? '上午释放精力' : '第二天轻量散步', index: 0 },
    { time: '11:30', label: '规则确认', index: 1 },
    { time: '12:30', label: '午餐补给', index: 2 },
    { time: '15:30', label: intent.avoidHeat ? '低强度避暑' : '宠物公园', index: 3 },
    { time: '18:00', label: '晚餐与验证', index: 4 },
  ]

  return intentSlots.flatMap((slot) => {
    const preferred = slot.label.includes('午餐') || slot.label.includes('晚餐')
      ? indoorRestaurant ?? pickedForIntent[slot.index % Math.max(1, pickedForIntent.length)]
      : slot.label.includes('宠物公园') || slot.label.includes('避暑')
        ? petPark ?? pickedForIntent[slot.index % Math.max(1, pickedForIntent.length)]
        : pickedForIntent[slot.index % Math.max(1, pickedForIntent.length)]
    if (!preferred) return []
    return [{
      time: slot.time,
      placeId: preferred.id,
      label: slot.label,
      ruleBrief: briefOf(preferred),
      action: slot.label.includes('晚餐') || slot.label.includes('午餐')
        ? (preferred.rule.allowIndoor ? '室内用餐' : '户外用餐')
        : '查看地图后前往',
      reason: placeReason(preferred, slot.label, intent),
      verifyHint: verifyHintOf(preferred),
      alternatives: alternativesFor(dayPlaces, preferred),
    }]
  })
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

function riskSectionsOf(places: Place[], intent: TripIntent, petContext?: PetContext) {
  const ruleItems: string[] = []
  const environmentItems: string[] = []
  const executionItems: string[] = []

  if (intent.largeDog || petContext?.size === 'large') {
    const limited = places.filter((p) => !canFitLargeDog(p)).slice(0, 2)
    if (limited.length) ruleItems.push(`大型犬需避开 ${limited.map((p) => p.name).join('、')} 等体型限制地点`)
  }
  if (places.some((p) => !p.rule.allowIndoor)) ruleItems.push('部分地点仅限室外，需准备室内备选')
  const feePlace = places.find((p) => p.rule.fee > 0)
  if (feePlace) ruleItems.push(`${feePlace.name} 等地点可能收取宠物服务费`)

  if (intent.rainy) environmentItems.push('雨天优先选择室内可进或有遮挡的地点')
  if (intent.avoidHeat) environmentItems.push('户外活动安排在上午，下午减少暴晒和长距离步行')
  if (intent.weekend) environmentItems.push('周末热门地点人流较高，建议提前 30 分钟抵达')
  if (!environmentItems.length) environmentItems.push('夏季中午注意补水，户外活动避开 11:00-15:00')

  executionItems.push('所有公共区域默认牵引，准备 1.5m 内胸背式牵引')
  executionItems.push('到店后先确认现场告示，社区验证可能滞后')
  if (intent.wantsHotel) executionItems.push('住宿类地点需提前确认宠物房和清洁费')

  return [
    { type: 'rule' as const, title: '规则风险', items: ruleItems },
    { type: 'environment' as const, title: '环境风险', items: environmentItems },
    { type: 'execution' as const, title: '执行提醒', items: executionItems },
  ].filter((section) => section.items.length > 0)
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
  const intent = detectIntent(opts.message, opts.petContext)
  const days = intent.days
  const places = PLACES[city]
  const focus = detectFocus(opts.message)

  let itinerary: AiItineraryStep[] = []
  for (let d = 0; d < days; d++) {
    itinerary.push(...makeItineraryForDay(d, places, intent))
  }

  if (focus.food) {
    const restaurant = places.find((p) => p.category === 'restaurant')
    if (restaurant) {
      itinerary = itinerary.map((step) =>
        step.label.includes('午餐') || step.label.includes('晚餐')
          ? {
              ...step,
              placeId: restaurant.id,
              ruleBrief: briefOf(restaurant),
              action: restaurant.rule.allowIndoor ? '室内用餐' : '户外用餐',
              reason: placeReason(restaurant, step.label, intent),
              verifyHint: verifyHintOf(restaurant),
              alternatives: alternativesFor(places, restaurant),
            }
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
        step.label.includes('晚餐')
          ? {
              ...step,
              placeId: indoorRestaurant.id,
              ruleBrief: briefOf(indoorRestaurant),
              action: '室内用餐',
              reason: placeReason(indoorRestaurant, step.label, intent),
              verifyHint: verifyHintOf(indoorRestaurant),
              alternatives: alternativesFor(places, indoorRestaurant),
            }
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
        step.label.includes('晚餐')
          ? {
              ...step,
              placeId: indoorRestaurant.id,
              ruleBrief: briefOf(indoorRestaurant),
              action: '室内用餐',
              reason: placeReason(indoorRestaurant, step.label, intent),
              verifyHint: verifyHintOf(indoorRestaurant),
              alternatives: alternativesFor(places, indoorRestaurant),
            }
          : step,
      )
    }
    if (petPark && itinerary.length < 6) {
      itinerary = [
        ...itinerary.slice(0, 3),
        {
          time: '16:30',
          placeId: petPark.id,
          label: '补充撒欢',
          ruleBrief: briefOf(petPark),
          action: '牵绳进出',
          reason: placeReason(petPark, '补充撒欢', intent),
          verifyHint: verifyHintOf(petPark),
          alternatives: alternativesFor(places, petPark),
        },
        ...itinerary.slice(3),
      ]
    }
  }

  if (itinerary.length === 0) {
    itinerary = makeItineraryForDay(0, places, intent)
  }

  const risks = risksOf(places)
  const checklist = BASE_CHECKLIST.slice(0, 6 + (days > 1 ? 2 : 0))
  const cityName = CITIES[city]?.name ?? city
  const prose = proseFor(city, days, opts.petContext, cityName)
  const riskSections = riskSectionsOf(places, intent, opts.petContext)
  const summary = {
    title: `${cityName}${days === 1 ? '一日' : `${days}天`}携宠任务台计划`,
    city: cityName,
    days,
    confidenceLabel: '基于地点规则与社区验证',
    source: 'mock' as const,
    petProfileUsed: !!opts.petContext,
  }

  return { prose, itinerary, risks, checklist, summary, riskSections }
}
