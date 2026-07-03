import { create } from 'zustand'
import type { Pet, Place, CityId, FeedItem, CareTask } from '../data/types'
import type { AiReply } from '../lib/ai'
import { CITIES, PLACES } from '../data/mock'
import { getJSON, setJSON, clearAll as clearStorageAll } from '../lib/storage'

export type { CityId, FeedItem, CareTask }
export type AiProvider = 'openai' | 'deepseek' | 'moonshot' | 'dashscope' | 'custom'

export const AI_PROVIDER_DEFAULTS: Record<Exclude<AiProvider, 'custom'>, { baseUrl: string; model: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  moonshot: { baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  dashscope: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
}

export interface SettingsState {
  aiProvider: AiProvider
  apiKey: string
  baseUrl: string
  model: string
  enableMockAi: boolean
  mockCity: CityId
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  structured?: AiReply
}

interface Verification {
  placeId: string
  whenISO: string
  verdict: 'good' | 'expired'
  byUser: string
}

const SLICE_KEYS = {
  meta: 'meta',
  settings: 'settings',
  pets: 'pets',
  places: 'places',
  feeds: 'feeds',
  care: 'care',
  verifications: 'verifications',
  chat: 'chat',
} as const

const nowISO = () => new Date().toISOString()
const uid = () => Math.random().toString(36).slice(2, 10)

const DEFAULT_PETS: Pet[] = [
  {
    id: 'pet-default',
    name: '豆豆',
    kind: 'dog',
    breed: '金毛',
    size: 'large',
    traits: ['温和', '亲人'],
    birthday: '2022-06-01',
    weightKg: 28,
    notes: '喜欢玩水，怕雷声',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

const PLACE_MAP: Record<string, Place> = {}
for (const city of Object.keys(PLACES) as CityId[]) {
  for (const p of PLACES[city]) PLACE_MAP[p.id] = p
}

const CITY_NAME: Record<CityId, string> = {
  shanghai: '上海',
  beijing: '北京',
  guangzhou: '广州',
  chengdu: '成都',
}

const DEFAULT_SETTINGS: SettingsState = {
  aiProvider: 'openai',
  apiKey: '',
  baseUrl: AI_PROVIDER_DEFAULTS.openai.baseUrl,
  model: AI_PROVIDER_DEFAULTS.openai.model,
  enableMockAi: true,
  mockCity: 'shanghai',
}

function seedFeeds(): FeedItem[] {
  const feeds: FeedItem[] = []
  const push = (f: Omit<FeedItem, 'id'>) => feeds.push({ ...f, id: 'f-' + uid() })

  // Vite asset imports
  const parkImg = new URL('../assets/community-park.jpg', import.meta.url).href
  const cafeImg = new URL('../assets/community-cafe.jpg', import.meta.url).href
  const hotelImg = new URL('../assets/community-hotel.jpg', import.meta.url).href
  const socialImg = new URL('../assets/community-social.jpg', import.meta.url).href

  push({ placeId: 'shanghai-1', type: '打卡', text: '今天带豆豆去静安公园宠物友好区，牵绳奔跑超开心！草地上有分区，小狗大狗都能玩。', whenISO: new Date(Date.now() - 2 * 3600_000).toISOString(), byUser: '豆豆妈妈', likes: 14, image: parkImg })
  push({ placeId: 'shanghai-3', type: '游记', text: 'Manner Coffee 愚园路店户外露台可以带猫，记得用胸背带，店员很友善，不给进室内但户外挺舒服。', whenISO: new Date(Date.now() - 26 * 3600_000).toISOString(), byUser: '橘座', likes: 8, image: cafeImg })
  push({ placeId: 'beijing-7', type: '避雷', text: '三里屯太古里室内不让进，只有户外广场可以带。带着大金毛别尝试进商场，会被拦。', whenISO: new Date(Date.now() - 3 * 86400_000).toISOString(), byUser: '朝阳区的柯基', likes: 22, image: socialImg })
  push({ placeId: 'beijing-1', type: '经验分享', text: '朝阳公园遛狗：早 7-9 可以在南部草坪自由奔跑，其它时段需要全程牵绳。建议工作日去！', whenISO: new Date(Date.now() - 5 * 86400_000).toISOString(), byUser: '哈士奇的爹', likes: 47, image: parkImg })
  push({ placeId: 'guangzhou-3', type: '打卡', text: '海珠湿地公园宠物区真不错，要带足够的水和狗粮，沙地区域记得事后洗爪子。', whenISO: new Date(Date.now() - 1 * 86400_000).toISOString(), byUser: '广州金毛姐', likes: 19, image: socialImg })
  push({ placeId: 'guangzhou-7', type: '避雷', text: '白云山缆车内部禁止宠物，只能走外围山麓步道，路挺长的，要备好牵引和水。', whenISO: new Date(Date.now() - 7 * 86400_000).toISOString(), byUser: '腊肠狗阿肥', likes: 5, image: parkImg })
  push({ placeId: 'chengdu-2', type: '游记', text: '浣花溪公园 3 月海棠季超美，沿着草堂路外侧草坪可以遛狗，牵绳就行，成都真的友好。', whenISO: new Date(Date.now() - 4 * 86400_000).toISOString(), byUser: '成都法斗', likes: 31, image: cafeImg })
  push({ placeId: 'chengdu-3', type: '经验分享', text: '温江泰迪熊宠物公园周末人特别多，推荐周四下午去，大型犬区有专人看，比较省心。', whenISO: new Date(Date.now() - 10 * 86400_000).toISOString(), byUser: '柯基天天', likes: 12, image: socialImg })
  push({ placeId: 'shanghai-4', type: '打卡', text: '和平饭店花园露台，提前 3 周约了宠物套房，自带金毛窝、狗砂，酒店会帮你清洁。', whenISO: new Date(Date.now() - 14 * 86400_000).toISOString(), byUser: '豆豆妈妈', likes: 5, image: hotelImg })
  push({ placeId: 'beijing-3', type: '避雷', text: 'Coffee% 景山前街店只能带小型犬，柯基可以，阿拉斯加被拒了。', whenISO: new Date(Date.now() - 20 * 86400_000).toISOString(), byUser: '朝阳区阿拉', likes: 9, image: cafeImg })
  return feeds
}

function defaultCareTasksFor(petId: string): CareTask[] {
  return [
    { id: uid(), petId, type: 'vaccine_combined', lastDoneISO: new Date(Date.now() - 30 * 86400_000).toISOString(), intervalDays: 365 },
    { id: uid(), petId, type: 'rabies', lastDoneISO: new Date(Date.now() - 15 * 86400_000).toISOString(), intervalDays: 3 * 365 },
    { id: uid(), petId, type: 'deworm_internal', lastDoneISO: new Date(Date.now() - 60 * 86400_000).toISOString(), intervalDays: 90 },
    { id: uid(), petId, type: 'deworm_external', lastDoneISO: new Date(Date.now() - 45 * 86400_000).toISOString(), intervalDays: 90 },
    { id: uid(), petId, type: 'bath', lastDoneISO: new Date(Date.now() - 14 * 86400_000).toISOString(), intervalDays: 14 },
    { id: uid(), petId, type: 'checkup', lastDoneISO: new Date(Date.now() - 90 * 86400_000).toISOString(), intervalDays: 180 },
  ]
}

interface StoreState {
  city: CityId
  setCity: (city: CityId) => void

  highlightPlaceId: string | null
  setHighlightPlaceId: (id: string | null) => void

  settings: SettingsState
  updateSettings: (patch: Partial<SettingsState>) => void
  applyProviderDefaults: (provider: AiProvider, currentBaseUrl: string) => void

  pets: Pet[]
  addPet: (p: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => void
  updatePet: (id: string, patch: Partial<Pet>) => void
  removePet: (id: string) => void

  places: Record<string, Place>
  updatePlace: (id: string, patch: Partial<Place>) => void

  recentVerifications: Verification[]
  addVerification: (v: Verification) => void

  feeds: FeedItem[]
  addFeed: (f: {
    placeId: string
    type: FeedItem['type']
    text: string
    whenISO?: string
    byUser?: string
    likes?: number
    likedByMe?: boolean
    bookmarkedByMe?: boolean
    placeName?: string
    id?: string
  }) => void
  likeFeed: (id: string) => void
  unlikeFeed: (id: string) => void
  bookmarkFeed: (id: string) => void
  unbookmarkFeed: (id: string) => void
  verifyPlace: (placeId: string, verdict: 'good' | 'bad' | 'expired', byUser?: string) => void

  careTasks: CareTask[]
  addCareTask: (t: Omit<CareTask, 'id'>) => void
  updateCareTask: (id: string, patch: Partial<CareTask>) => void
  removeCareTask: (id: string) => void

  chat: ChatMessage[]
  addMessage: (m: ChatMessage) => void
  clearChat: () => void

  showPetInChat: boolean
  setShowPetInChat: (v: boolean) => void

  hydrateFromStorage: () => void
  persistNow: () => void
  clearAll: () => void
}

interface MetaSlice {
  city: CityId
  highlightPlaceId: string | null
  showPetInChat: boolean
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
const debouncedPersist = (fn: () => void) => {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    fn()
  }, 150)
}

export const useStore = create<StoreState>((set, get) => ({
  city: 'shanghai',
  setCity: (city) => {
    set({ city })
    debouncedPersist(() => get().persistNow())
  },

  highlightPlaceId: null,
  setHighlightPlaceId: (id) => {
    set({ highlightPlaceId: id })
  },

  settings: DEFAULT_SETTINGS,
  updateSettings: (patch) => {
    const cur = get().settings
    set({ settings: { ...cur, ...patch } })
    debouncedPersist(() => get().persistNow())
  },
  applyProviderDefaults: (provider, currentBaseUrl) => {
    const cur = get().settings
    if (provider === 'custom') {
      set({ settings: { ...cur, aiProvider: 'custom' } })
      debouncedPersist(() => get().persistNow())
      return
    }
    const def = AI_PROVIDER_DEFAULTS[provider]
    const oldDef = cur.aiProvider !== 'custom' ? AI_PROVIDER_DEFAULTS[cur.aiProvider] : null
    const shouldReplaceBaseUrl = oldDef ? currentBaseUrl === oldDef.baseUrl : true
    set({
      settings: {
        ...cur,
        aiProvider: provider,
        baseUrl: shouldReplaceBaseUrl ? def.baseUrl : cur.baseUrl,
        model: def.model,
      },
    })
    debouncedPersist(() => get().persistNow())
  },

  pets: DEFAULT_PETS,
  addPet: (p) => {
    const now = nowISO()
    const newPet: Pet = {
      ...p,
      id: 'pet-' + uid(),
      createdAt: now,
      updatedAt: now,
    }
    const careTasks = [...get().careTasks, ...defaultCareTasksFor(newPet.id)]
    set({ pets: [...get().pets, newPet], careTasks })
    debouncedPersist(() => get().persistNow())
  },
  updatePet: (id, patch) => {
    const now = nowISO()
    set({
      pets: get().pets.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p)),
    })
    debouncedPersist(() => get().persistNow())
  },
  removePet: (id) => {
    set({
      pets: get().pets.filter((p) => p.id !== id),
      careTasks: get().careTasks.filter((t) => t.petId !== id),
    })
    debouncedPersist(() => get().persistNow())
  },

  places: PLACE_MAP,
  updatePlace: (id, patch) => {
    const cur = get().places
    const existing = cur[id]
    if (!existing) return
    set({ places: { ...cur, [id]: { ...existing, ...patch } } })
    debouncedPersist(() => get().persistNow())
  },

  recentVerifications: [],
  addVerification: (v) => {
    const list = [v, ...get().recentVerifications].slice(0, 20)
    set({ recentVerifications: list })
    debouncedPersist(() => get().persistNow())
  },

  feeds: seedFeeds(),
  addFeed: (f) => {
    const id = f.id || 'f-' + uid()
    const place = PLACE_MAP[f.placeId]
    const feed: FeedItem = {
      id,
      placeId: f.placeId,
      type: f.type,
      text: f.text,
      whenISO: f.whenISO || nowISO(),
      byUser: f.byUser || '我',
      likes: f.likes ?? 0,
      likedByMe: f.likedByMe ?? false,
      bookmarkedByMe: f.bookmarkedByMe ?? false,
      placeName: f.placeName || place?.name,
    }
    set({ feeds: [feed, ...get().feeds].slice(0, 100) })
    debouncedPersist(() => get().persistNow())
  },
  likeFeed: (id) => {
    set({
      feeds: get().feeds.map((x) =>
        x.id === id
          ? { ...x, likes: x.likes + 1, likedByMe: true }
          : x,
      ),
    })
    debouncedPersist(() => get().persistNow())
  },
  unlikeFeed: (id) => {
    set({
      feeds: get().feeds.map((x) =>
        x.id === id && x.likedByMe
          ? { ...x, likes: Math.max(0, x.likes - 1), likedByMe: false }
          : x,
      ),
    })
    debouncedPersist(() => get().persistNow())
  },
  bookmarkFeed: (id) => {
    set({
      feeds: get().feeds.map((x) =>
        x.id === id ? { ...x, bookmarkedByMe: true } : x,
      ),
    })
    debouncedPersist(() => get().persistNow())
  },
  unbookmarkFeed: (id) => {
    set({
      feeds: get().feeds.map((x) =>
        x.id === id ? { ...x, bookmarkedByMe: false } : x,
      ),
    })
    debouncedPersist(() => get().persistNow())
  },
  verifyPlace: (placeId, verdict, byUser) => {
    const place = PLACE_MAP[placeId]
    if (place) {
      get().updatePlace(placeId, {
        verifierCount: (place.verifierCount || 0) + 1,
        lastVerifiedAt: nowISO(),
      })
    }
    const user = byUser || '我'
    get().addVerification({
      placeId,
      whenISO: nowISO(),
      verdict: verdict === 'good' ? 'good' : 'expired',
      byUser: user,
    })
    const type = verdict === 'good' ? '打卡' : '避雷'
    const placeName = place?.name || ''
    const cityStr = place ? CITY_NAME[place.city] : ''
    const text =
      verdict === 'good'
        ? `【${cityStr}】我刚刚也去了「${placeName}」，现场规则一致，真实验证！`
        : `【${cityStr}】「${placeName}」现场规则跟记录不符，已标记为避雷。`
    get().addFeed({
      placeId,
      type,
      text,
      byUser: user,
    })
  },

  careTasks: defaultCareTasksFor('pet-default'),
  addCareTask: (t) => {
    set({ careTasks: [...get().careTasks, { ...t, id: uid() }] })
    debouncedPersist(() => get().persistNow())
  },
  updateCareTask: (id, patch) => {
    set({
      careTasks: get().careTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })
    debouncedPersist(() => get().persistNow())
  },
  removeCareTask: (id) => {
    set({ careTasks: get().careTasks.filter((t) => t.id !== id) })
    debouncedPersist(() => get().persistNow())
  },

  chat: [],
  addMessage: (m) => {
    set({ chat: [...get().chat, m] })
    debouncedPersist(() => get().persistNow())
  },
  clearChat: () => {
    set({ chat: [] })
    debouncedPersist(() => get().persistNow())
  },

  showPetInChat: false,
  setShowPetInChat: (v) => {
    set({ showPetInChat: v })
    debouncedPersist(() => get().persistNow())
  },

  hydrateFromStorage: () => {
    const meta = getJSON<MetaSlice | null>(SLICE_KEYS.meta, null)
    const settingsSlice = getJSON<SettingsState | null>(SLICE_KEYS.settings, null)
    const pets = getJSON<Pet[] | null>(SLICE_KEYS.pets, null)
    const places = getJSON<Record<string, Place> | null>(SLICE_KEYS.places, null)
    const feeds = getJSON<FeedItem[] | null>(SLICE_KEYS.feeds, null)
    const careTasks = getJSON<CareTask[] | null>(SLICE_KEYS.care, null)
    const recentVerifications = getJSON<Verification[] | null>(SLICE_KEYS.verifications, null)
    const chat = getJSON<ChatMessage[] | null>(SLICE_KEYS.chat, null)

    const mergedPlaces = { ...PLACE_MAP, ...(places || {}) }
    const existingPetIds = new Set((pets || []).map((p) => p.id))
    const missingPets = DEFAULT_PETS.filter((p) => !existingPetIds.has(p.id))
    const allPets = [...(pets || []), ...missingPets]

    set({
      city: meta?.city || 'shanghai',
      highlightPlaceId: null,
      settings: { ...DEFAULT_SETTINGS, ...(settingsSlice || {}) },
      pets: allPets,
      places: mergedPlaces,
      recentVerifications: recentVerifications || [],
      feeds: feeds || seedFeeds(),
      careTasks: careTasks || defaultCareTasksFor(allPets[0]?.id || 'pet-default'),
      chat: chat || [],
      showPetInChat: !!meta?.showPetInChat,
    })
  },

  persistNow: () => {
    const s = get()
    setJSON(SLICE_KEYS.meta, {
      city: s.city,
      highlightPlaceId: s.highlightPlaceId,
      showPetInChat: s.showPetInChat,
    } satisfies MetaSlice)
    setJSON(SLICE_KEYS.settings, s.settings satisfies SettingsState)
    setJSON(SLICE_KEYS.pets, s.pets)
    setJSON(SLICE_KEYS.places, s.places)
    setJSON(SLICE_KEYS.feeds, s.feeds)
    setJSON(SLICE_KEYS.care, s.careTasks)
    setJSON(SLICE_KEYS.verifications, s.recentVerifications)
    setJSON(SLICE_KEYS.chat, s.chat)
  },

  clearAll: () => {
    clearStorageAll()
    if (persistTimer) clearTimeout(persistTimer)
    set({
      city: 'shanghai',
      highlightPlaceId: null,
      settings: DEFAULT_SETTINGS,
      pets: DEFAULT_PETS,
      places: PLACE_MAP,
      recentVerifications: [],
      feeds: seedFeeds(),
      careTasks: defaultCareTasksFor('pet-default'),
      chat: [],
      showPetInChat: false,
    })
  },
}))

export const CITIES_META = CITIES
export { PLACE_MAP, CITY_NAME }
