import { useStore } from '../../store/useStore'
import { PLACES } from '../../data/mock'
import { enrichPlace, type PlaceRich } from './filter'

export type Place = PlaceRich

export function useMapPlaces(): Place[] {
  const city = useStore((state) => state.city)
  const storePlaces = useStore((state) => state.places)
  const raw = PLACES[city]
  return raw.map((place) => enrichPlace(storePlaces[place.id] ?? place, place.city))
}
