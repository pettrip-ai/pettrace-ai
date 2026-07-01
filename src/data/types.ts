export type CityId = 'shanghai' | 'beijing' | 'guangzhou' | 'chengdu'

export type PlaceCategory =
  | 'restaurant'
  | 'hotel'
  | 'park'
  | 'mall'
  | 'cafe'
  | 'pet_park'
  | 'scenic_spot'

export interface CityMeta {
  id: CityId
  name: string
  center: [number, number]
  zoom: number
}

export interface PetFriendlyRule {
  sizeLimit: 'small' | 'medium' | 'large' | 'any'
  allowIndoor: boolean
  leashRequired: boolean
  fee: number
  hasOutdoorSeat: boolean
  notes: string
}

export interface Place {
  id: string
  name: string
  city: CityId
  category: PlaceCategory
  address: string
  lat: number
  lng: number
  rule: PetFriendlyRule
  description?: string
  verifierCount: number
  lastVerifiedAt: string
  consistencyScore: number
  tags?: string[]
  rating?: number
  phone?: string
  website?: string
  photos?: string[]
}

export type PetSize = 'small' | 'medium' | 'large'
export type PetTraits = string

export type PetKind = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'other'

export interface Pet {
  id: string
  name: string
  kind: PetKind
  breed?: string
  size?: PetSize
  traits?: string[]
  birthday?: string
  weightKg?: number
  notes?: string
  ageMonths?: number
  avatar?: string
  createdAt: string
  updatedAt: string
}

export type FeedType = '打卡' | '游记' | '避雷' | '经验分享'

export interface FeedItem {
  id: string
  placeId: string
  type: FeedType
  text: string
  whenISO: string
  byUser: string
  likes: number
  likedByMe?: boolean
  placeName?: string
  image?: string
}

export interface Review {
  id: string
  placeId: string
  petId?: string
  rating: number
  title?: string
  body?: string
  photos?: string[]
  createdAt: string
  verifier: boolean
  helpfulCount?: number
}

export interface CareRecord {
  id: string
  petId: string
  type: 'vaccine' | 'checkup' | 'groom' | 'medication' | 'other'
  date: string
  summary: string
  notes?: string
  veterinarian?: string
  attachments?: string[]
}

export type CareTaskType =
  | 'vaccine_combined'
  | 'rabies'
  | 'deworm_internal'
  | 'deworm_external'
  | 'bath'
  | 'checkup'
  | 'neuter'

export interface CareTask {
  id: string
  petId: string
  type: CareTaskType
  lastDoneISO: string
  intervalDays: number
  notes?: string
}

export interface ItineraryStep {
  id: string
  placeId: string
  arriveAt?: string
  departAt?: string
  note?: string
}

export interface Itinerary {
  id: string
  title: string
  city: CityId
  dateRange?: string
  steps: ItineraryStep[]
  createdAt: string
  updatedAt: string
}
