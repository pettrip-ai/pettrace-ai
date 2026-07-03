import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  X, ChevronRight, ChevronLeft, Search, MapPin, SlidersHorizontal,
  Coffee, TreePine, Stethoscope, ShoppingBag, Star, Navigation,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { CAT_GROUPS } from './constants'
import { useMap } from 'react-leaflet'
import { PLACES } from '../../data/mock'
import { enrichPlace, type CategoryFilter, type SizeFilter, type PlaceRich } from './filter'
import type { PlaceCategory } from '../../data/types'

export type { CategoryFilter, SizeFilter }

export type Place = PlaceRich

type CategoryKind = 'coffee' | 'park' | 'vet' | 'shop' | 'other'

function classifyKind(cat: PlaceCategory): CategoryKind {
  if (cat === 'cafe' || cat === 'restaurant') return 'coffee'
  if (cat === 'park' || cat === 'scenic_spot' || cat === 'pet_park') return 'park'
  if (cat === 'hotel') return 'vet'
  if (cat === 'mall') return 'shop'
  return 'other'
}

const CATEGORY_META_MAP: Record<PlaceCategory, { title: string; kind: CategoryKind }> = {
  restaurant: { title: '咖啡', kind: 'coffee' },
  cafe: { title: '咖啡', kind: 'coffee' },
  hotel: { title: '酒店', kind: 'vet' },
  park: { title: '公园', kind: 'park' },
  scenic_spot: { title: '景区', kind: 'park' },
  mall: { title: '商店', kind: 'shop' },
  pet_park: { title: '宠物公园', kind: 'park' },
}

type KindIconProps = { kind: CategoryKind; size?: number }
function KindIcon({ kind, size = 22 }: KindIconProps) {
  switch (kind) {
    case 'coffee': return <Coffee size={size} />
    case 'park': return <TreePine size={size} />
    case 'vet': return <Stethoscope size={size} />
    case 'shop': return <ShoppingBag size={size} />
    default: return <Coffee size={size} />
  }
}

function KindTone({ kind }: { kind: CategoryKind }): {
  iconFg: string
  softBg: string
  accentText: string
  pillActive: string
  pillInactive: string
} {
  switch (kind) {
    case 'coffee':
      return {
        iconFg: 'text-primary',
        softBg: 'bg-coral-50',
        accentText: 'text-primary',
        pillActive: 'bg-primary text-primary-fg shadow-primary-btn border-primary',
        pillInactive: 'bg-surface/70 text-muted border-rule',
      }
    case 'park':
      return {
        iconFg: 'text-accent',
        softBg: 'bg-mint-50',
        accentText: 'text-accent',
        pillActive: 'bg-primary text-primary-fg shadow-primary-btn border-primary',
        pillInactive: 'bg-surface/70 text-muted border-rule',
      }
    case 'vet':
      return {
        iconFg: 'text-primary',
        softBg: 'bg-coral-50',
        accentText: 'text-primary',
        pillActive: 'bg-primary text-primary-fg shadow-primary-btn border-primary',
        pillInactive: 'bg-surface/70 text-muted border-rule',
      }
    case 'shop':
      return {
        iconFg: 'text-warning',
        softBg: 'bg-honey-50',
        accentText: 'text-warning',
        pillActive: 'bg-primary text-primary-fg shadow-primary-btn border-primary',
        pillInactive: 'bg-surface/70 text-muted border-rule',
      }
    default:
      return {
        iconFg: 'text-primary',
        softBg: 'bg-coral-50',
        accentText: 'text-primary',
        pillActive: 'bg-primary text-primary-fg shadow-primary-btn border-primary',
        pillInactive: 'bg-surface/70 text-muted border-rule',
      }
  }
}

export function useMapPlaces(): Place[] {
  const city = useStore((s) => s.city)
  const storePlaces = useStore((s) => s.places)
  const raw = PLACES[city]
  return raw.map((p) => enrichPlace(storePlaces[p.id] ?? p, p.city))
}

export function MapLoading() {
  const map = useMap()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let to: ReturnType<typeof setTimeout> | undefined
    const hide = () => setReady(true)
    try { map.on('load', hide) } catch {}
    let loaded = false
    try { loaded = (map as any).loaded?.() ?? false } catch {}
    if (loaded) {
      hide()
    } else {
      to = setTimeout(hide, 3000)
    }
    return () => {
      try { map.off('load', hide) } catch {}
      if (to) clearTimeout(to)
    }
  }, [map])

  if (ready) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg z-[900] pointer-events-none">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl">🗺️</div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">加载地图中...</span>
      </div>
    </div>
  )
}

type FilterProps = {
  catFilter: CategoryFilter
  setCatFilter: (v: CategoryFilter) => void
  sizeFilter: SizeFilter
  setSizeFilter: (v: SizeFilter) => void
  search: string
  setSearch: (v: string) => void
}

const SEARCH_PILL_STYLE = 'flex items-center gap-2 px-3 h-11 rounded-full bg-[rgba(255,255,255,0.78)] glass-soft border border-[rgba(255,255,255,0.6)] shadow-2'
const CORAL_BTN = 'w-9 h-9 rounded-full bg-primary text-primary-fg flex items-center justify-center shadow-primary-btn active:scale-95 transition'

export function FilterBarMobile({
  filterOpen, setFilterOpen,
  catFilter, setCatFilter,
  sizeFilter, setSizeFilter,
  search, setSearch,
}: FilterProps & { filterOpen: boolean; setFilterOpen: (v: boolean) => void }) {
  const activeFilters = [
    catFilter !== 'all' ? { label: '分类', value: catFilter } : null,
    sizeFilter !== 'all' ? { label: '体型', value: sizeFilter } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      <div className="md:hidden absolute top-2 left-2 right-2 z-[800] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(true)}
            className={SEARCH_PILL_STYLE + ' flex-1 min-w-0'}
          >
            <Search size={18} className="shrink-0 text-muted" />
            <span className="text-[15px] text-muted truncate">
              {search || '搜索或筛选'}
            </span>
            {activeFilters.length > 0 && (
              <span className="ml-auto shrink-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">{activeFilters.length}</span>
            )}
          </button>
          <button
            onClick={() => setFilterOpen(true)}
            className={CORAL_BTN}
            aria-label="筛选"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1 pt-1">
          <CategoryPill label="全部" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
          {CAT_GROUPS.map((c) => {
            const active = catFilter === c.key
            const kind = classifyKind(c.key)
            const tone = KindTone({ kind })
            return (
              <button
                key={c.key}
                onClick={() => setCatFilter(c.key as CategoryFilter)}
                className={clsx(
                  'shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition border active:scale-95',
                  active ? tone.pillActive : tone.pillInactive,
                )}
              >
                {c.title}
              </button>
            )
          })}
        </div>
      </div>

      {filterOpen && (
        <div
          className="md:hidden fixed inset-0 z-[1000] flex flex-col justify-end"
          onClick={() => setFilterOpen(false)}
        >
          <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
          <div
            className="relative bg-surface rounded-t-2xl border-t border-rule max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-rule shrink-0">
              <span className="text-[15px] font-semibold text-ink">筛选地点</span>
              <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-outline-variant">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">搜索</div>
                <div className="flex items-center gap-2 h-10 pl-3 pr-2 rounded-lg bg-outline-variant/60 border border-transparent focus-within:border-rule focus-within:bg-surface transition">
                  <Search size={14} className="text-muted shrink-0" />
                  <input
                    placeholder="地点名 / 备注 / 地址"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm placeholder:text-muted"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="shrink-0 w-5 h-5 rounded-full bg-outline hover:bg-rule text-muted hover:text-foreground flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">分类</div>
                <div className="flex flex-wrap gap-2">
                  <CategoryPill label="全部" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
                  {CAT_GROUPS.map((c) => (
                    <CategoryPill
                      key={c.key}
                      label={c.title}
                      active={catFilter === c.key}
                      onClick={() => setCatFilter(c.key as CategoryFilter)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">体型</div>
                <div className="flex flex-wrap gap-2">
                  <CategoryPill label="全部" active={sizeFilter === 'all'} onClick={() => setSizeFilter('all')} />
                  <CategoryPill label="大型犬可入" active={sizeFilter === 'large_ok'} onClick={() => setSizeFilter('large_ok')} />
                  <CategoryPill label="中小型犬" active={sizeFilter === 'medium_small'} onClick={() => setSizeFilter('medium_small')} />
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-rule shrink-0 flex gap-2">
              <button
                onClick={() => {
                  setCatFilter('all')
                  setSizeFilter('all')
                  setSearch('')
                }}
                className="flex-1 h-10 rounded-xl border border-rule text-foreground text-sm active:scale-[0.97] transition bg-surface/70 hover:bg-surface"
              >重置</button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-[2] h-10 rounded-xl bg-primary text-primary-fg text-sm font-medium active:scale-[0.97] transition"
              >完成</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CategoryPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition border active:scale-95',
        active
          ? 'bg-primary text-primary-fg shadow-primary-btn border-primary'
          : 'bg-surface/70 text-muted border-rule',
      )}
    >
      {label}
    </button>
  )
}

function PlaceCard({
  p, onPick, highlightId,
}: { p: Place; onPick: (id: string) => void; highlightId?: string | null }) {
  const kind = classifyKind(p.category)
  const tone = KindTone({ kind })
  const meta = CATEGORY_META_MAP[p.category] ?? { title: p.category, kind }

  const meters = useMemo(() => {
    if ((p as any).distance != null) return Math.round((p as any).distance)
    const city = useStore.getState().city
    const center = city === 'beijing' ? [39.9042, 116.4074] : [31.2304, 121.4737]
    const R = 6371000
    const toRad = (v: number) => v * Math.PI / 180
    const dLat = toRad(p.lat - center[0])
    const dLng = toRad(p.lng - center[1])
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(center[0])) * Math.sin(dLng / 2) ** 2
    return Math.round(2 * R * Math.asin(Math.sqrt(a)))
  }, [p])

  const distLabel = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`

  return (
    <li>
      <button
        onClick={() => onPick(p.id)}
        data-place-list-card-active={highlightId === p.id ? 'true' : 'false'}
        className={clsx(
          'w-full text-left rounded-[16px] p-3 bg-[rgba(255,255,255,0.8)] backdrop-blur-[12px] border transition active:scale-[0.99] outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(247,107,122,0.22)] mb-3',
          highlightId === p.id
            ? 'border-primary shadow-[0_10px_24px_rgba(84,49,31,0.08),inset_0_0_0_1px_rgba(247,107,122,0.45)]'
            : 'border-[rgba(255,255,255,0.6)] shadow-card',
        )}
      >
        <div className="flex items-center gap-3">
          <div className={clsx('w-11 h-11 rounded-md flex items-center justify-center shrink-0', tone.softBg, tone.iconFg)}>
            <KindIcon kind={kind} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] leading-tight text-ink line-clamp-1">{p.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{meta.title}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className={clsx('text-[11px] font-semibold leading-none', tone.accentText)}>{distLabel}</span>
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-warning fill-warning" />
              <span className="text-[11px] text-muted-foreground leading-none">{p.rating ?? 4.5}</span>
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}

export function ListContent({
  places, onPick, highlightId,
}: { places: Place[]; onPick: (id: string) => void; highlightId?: string | null }) {
  return (
    <ul className="px-3 py-3">
      {places.map((p) => (
        <PlaceCard key={p.id} p={p} onPick={onPick} highlightId={highlightId} />
      ))}
    </ul>
  )
}

export function SidebarDrawer({
  catFilter, setCatFilter, sizeFilter, setSizeFilter, search, setSearch,
  places, onPick,
}: FilterProps & { places: Place[]; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(true)

  return (
    <aside
      className={clsx(
        'hidden md:flex shrink-0 h-full relative transition-[width] duration-250 overflow-hidden z-[800]',
        open ? 'w-[340px]' : 'w-[48px]',
      )}
    >
      <div className="h-full w-[48px] shrink-0 bg-surface/95 border-l border-rule flex flex-col items-center py-3 gap-2 shadow-[4px_0_24px_rgba(43,37,34,0.06)]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-9 h-9 rounded-lg bg-outline-variant hover:bg-outline text-muted hover:text-foreground flex items-center justify-center transition active:scale-95"
          title={open ? '收起侧栏' : '展开侧栏'}
        >
          {open ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="w-px h-4 bg-rule" />
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg bg-outline-variant hover:bg-outline text-muted hover:text-foreground flex items-center justify-center transition active:scale-95"
          title="筛选"
        >
          <SlidersHorizontal size={16} />
        </button>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg bg-outline-variant hover:bg-outline text-muted hover:text-foreground flex items-center justify-center transition active:scale-95"
          title="地点列表"
        >
          <MapPin size={16} />
        </button>
      </div>

      {open && (
        <div className="flex-1 min-w-0 h-full bg-surface/95 border-l border-rule flex flex-col">
          <div className="px-4 py-3 border-b border-rule shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">筛选</span>
              {(catFilter !== 'all' || sizeFilter !== 'all' || search) && (
                <button
                  onClick={() => {
                    setCatFilter('all')
                    setSizeFilter('all')
                    setSearch('')
                  }}
                  className="text-xs text-muted hover:text-ink transition"
                >重置</button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  placeholder="搜索宠物友好地点..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 rounded-lg bg-outline-variant/60 border border-transparent focus:border-rule focus:bg-surface text-sm outline-none transition placeholder:text-muted"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-outline hover:bg-rule text-muted hover:text-foreground flex items-center justify-center transition"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-muted mb-1.5">分类</div>
              <div className="flex flex-wrap gap-1.5">
                <CategoryPill label="全部" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
                {CAT_GROUPS.map((c) => (
                  <CategoryPill key={c.key} label={c.title} active={catFilter === c.key} onClick={() => setCatFilter(c.key as CategoryFilter)} />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-muted mb-1.5">体型</div>
              <div className="flex flex-wrap gap-1.5">
                <CategoryPill label="全部" active={sizeFilter === 'all'} onClick={() => setSizeFilter('all')} />
                <CategoryPill label="大型犬可入" active={sizeFilter === 'large_ok'} onClick={() => setSizeFilter('large_ok')} />
                <CategoryPill label="中小型犬" active={sizeFilter === 'medium_small'} onClick={() => setSizeFilter('medium_small')} />
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-rule text-sm font-semibold text-ink flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />附近地点</span>
            <span className="text-xs text-muted font-normal">{places.length} 个</span>
          </div>
          <div className="overflow-y-auto flex-1">
            <ListContent places={places} onPick={onPick} />
          </div>
        </div>
      )}
    </aside>
  )
}

export function PlaceListMobileSheet({
  open, onClose, places, onPick,
}: { open: boolean; onClose: () => void; places: Place[]; onPick: (id: string) => void }) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const highlightId = useStore((s) => s.highlightPlaceId)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="md:hidden fixed inset-0 z-[1100] flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={nodeRef}
        role="dialog"
        aria-modal="true"
        aria-label="附近地点列表"
        className="relative bg-surface rounded-t-2xl border-t border-rule max-h-[72vh] overflow-hidden flex flex-col"
      >
        <div className="flex flex-col gap-1 px-4 pt-2 pb-1.5 shrink-0 bg-[rgba(255,255,255,0.72)] glass-soft">
          <div className="flex items-center justify-center pt-1">
            <div className="w-9 h-1 bg-rule rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-[16px] font-semibold text-ink">附近地点</span>
              <span className="text-xs text-muted">{places.length} 个结果</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-outline" aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ListContent places={places} onPick={(id) => { onPick(id); onClose() }} highlightId={highlightId} />
        </div>
      </div>
    </div>
  )
}

export function MobileListFloat({
  listOpen, setListOpen, count,
}: { listOpen: boolean; setListOpen: (v: boolean) => void; count: number }) {
  if (listOpen) return null
  return (
    <div className="md:hidden absolute bottom-[84px] left-0 right-0 z-[800] flex justify-center">
      <button
        onClick={() => setListOpen(true)}
        className="h-10 px-4 rounded-full bg-[rgba(255,255,255,0.78)] glass-soft border border-[rgba(255,255,255,0.6)] shadow-2 flex items-center gap-2 text-[13px] font-medium text-foreground active:scale-[0.97] transition"
      >
        <Navigation size={14} className="text-primary" />
        <span>附近 {count} 个</span>
      </button>
    </div>
  )
}
