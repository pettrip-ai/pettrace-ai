import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, Marker } from 'react-leaflet'
import { Search, SlidersHorizontal, X, MapPin, Star, Coffee, TreePine, ShoppingBag, Stethoscope, Plus, Minus } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/useStore'
import { EmptyState, Button } from '../../components/ui'
import { TileLayerWithFallback } from './tiles'
import { CityFlyer, HighlightFocuser, mapRef } from './hooks'
import { useMapPlaces, ListContent, type CategoryFilter, type SizeFilter, type Place } from './components'
import { filterPlaces } from './filter'
import { getMarkerIcon, getUserLocationMarkerIcon } from './marker'
import { CAT_GROUPS, CATEGORY_META } from './constants'

import 'leaflet/dist/leaflet.css'

function MainEmpty({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-[900] bg-surface/95">
      <EmptyState icon="alert-circle" title="这个城市暂无宠物友好地点" description="试试切换到上海或北京" action={<Button variant="primary" size="md" onClick={onSwitch}>切换城市</Button>} />
    </div>
  )
}

function MapOverlayControls() {
  const zoomIn = () => mapRef.current?.zoomIn()
  const zoomOut = () => mapRef.current?.zoomOut()
  const mapToolHitClass = 'w-11 h-11 p-1 flex items-center justify-center text-foreground transition active:scale-95'
  const mapToolFaceClass = 'w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(255,255,255,0.84)] border border-[rgba(255,255,255,0.72)] shadow-[0_1px_6px_rgba(84,49,31,0.10)] backdrop-blur-[12px]'

  return (
    <div
      data-map-controls
      className="fixed z-[820] flex flex-col items-end gap-1.5 pointer-events-auto"
      style={{ top: 'calc(var(--sat, 0px) + 140px)', right: 'max(16px, var(--sar, 0px))' }}
    >
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={zoomIn}
          className={mapToolHitClass}
          aria-label="放大"
        >
          <span className={mapToolFaceClass}>
            <Plus size={15} strokeWidth={2} />
          </span>
        </button>
        <button
          onClick={zoomOut}
          className={mapToolHitClass}
          aria-label="缩小"
        >
          <span className={mapToolFaceClass}>
            <Minus size={15} strokeWidth={2} />
          </span>
        </button>
      </div>
      <button
        onClick={() => {
          const city = useStore.getState().city
          const center: [number, number] = city === 'beijing' ? [39.9042, 116.4074] : [31.2304, 121.4737]
          const zoom = city === 'beijing' ? 12 : 13
          mapRef.current?.setView(center, zoom, { animate: true })
        }}
        className={mapToolHitClass}
        title="回到当前城市中心"
        aria-label="回到当前城市中心"
      >
        <span className={mapToolFaceClass}>
          <MapPin size={15} strokeWidth={2} />
        </span>
      </button>
    </div>
  )
}

function SearchChip({
  search,
  onSearchChange,
  onOpenFilter,
}: {
  search: string
  onSearchChange: (v: string) => void
  onOpenFilter: () => void
}) {
  return (
    <div data-map-search className="fixed z-[800]" style={{ top: 'calc(var(--sat, 0px) + 12px)', left: 'max(16px, var(--sal, 0px))', right: 'max(16px, var(--sar, 0px))' }}>
      <div className="flex items-center gap-1.5 pl-3 pr-1 h-11 rounded-full bg-[rgba(255,255,255,0.78)] border border-[rgba(255,255,255,0.6)] shadow-2 backdrop-blur-[20px]">
        <Search size={17} className="shrink-0 text-muted" />
        <input
          type="text"
          placeholder="搜索宠物友好地点..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-0 h-full bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="shrink-0 w-11 h-11 p-2 rounded-full text-muted hover:text-foreground flex items-center justify-center"
            aria-label="清除搜索"
          >
            <X size={12} />
          </button>
        )}
        <button
          onClick={onOpenFilter}
          className="w-11 h-11 p-1 rounded-full text-primary-fg flex items-center justify-center active:scale-95 transition shrink-0"
          aria-label="筛选"
        >
          <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_8px_rgba(247,107,122,0.24)]">
            <SlidersHorizontal size={15} />
          </span>
        </button>
      </div>
    </div>
  )
}

function CategoryChips({
  catFilter, setCatFilter,
}: { catFilter: CategoryFilter; setCatFilter: (v: CategoryFilter) => void }) {
  return (
    <div
      data-map-categories
      className="fixed z-[800] flex gap-2 overflow-x-auto no-scrollbar"
      style={{ top: 'calc(var(--sat, 0px) + 70px)', left: 'max(16px, var(--sal, 0px))', right: 'max(16px, var(--sar, 0px))' }}
    >
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
  )
}

function CategoryPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  const mapCategoryChipClass = 'shrink-0 h-9 px-4 rounded-full text-[13px] leading-none transition active:scale-95'

  return (
    <button
      onClick={onClick}
      className={clsx(
        mapCategoryChipClass,
        active
          ? 'bg-primary text-primary-fg font-semibold shadow-primary-btn border border-primary'
          : 'bg-[rgba(255,255,255,0.7)] text-muted font-medium border-[0.5px] border-rule',
      )}
    >
      {label}
    </button>
  )
}

function FilterBottomSheet({
  open, onClose,
  catFilter, setCatFilter,
  sizeFilter, setSizeFilter,
  setSearch,
}: {
  open: boolean; onClose: () => void;
  catFilter: CategoryFilter; setCatFilter: (v: CategoryFilter) => void;
  sizeFilter: SizeFilter; setSizeFilter: (v: SizeFilter) => void;
  setSearch: (v: string) => void;
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" />
      <div
        className="relative bg-surface rounded-t-2xl border-t border-rule max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-rule shrink-0">
          <span className="text-[15px] font-semibold text-ink">筛选地点</span>
          <button onClick={onClose} className="w-11 h-11 rounded-md text-muted hover:text-foreground hover:bg-outline-variant flex items-center justify-center" aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">分类</div>
            <div className="flex flex-wrap gap-2">
              <CategoryPill label="全部" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
              {CAT_GROUPS.map((c) => (
                <CategoryPill key={c.key} label={c.title} active={catFilter === c.key} onClick={() => setCatFilter(c.key as CategoryFilter)} />
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
            className="flex-1 h-11 rounded-xl border border-rule text-foreground text-sm active:scale-[0.97] transition bg-surface/70 hover:bg-surface"
          >重置</button>
          <button
            onClick={onClose}
            className="flex-[2] h-11 rounded-xl bg-primary text-primary-fg text-sm font-medium active:scale-[0.97] transition"
          >完成</button>
        </div>
      </div>
    </div>
  )
}

function PlaceCardBottom({
  p, onPick, highlightId,
}: { p: Place; onPick: (id: string) => void; highlightId?: string | null }) {
  const accentFor = (() => {
    switch (p.category) {
      case 'cafe':
      case 'restaurant':
      case 'hotel':
        return { bg: 'var(--surface-container-low)', icon: 'var(--primary)' }
      case 'park':
      case 'scenic_spot':
      case 'pet_park':
        return { bg: 'var(--pettrace-mint-50)', icon: 'var(--accent)' }
      case 'mall':
        return { bg: 'var(--pettrace-honey-50)', icon: 'var(--warning)' }
      default:
        return { bg: 'var(--surface-container-low)', icon: 'var(--primary)' }
    }
  })()
  const iconFor = (() => {
    switch (p.category) {
      case 'cafe':
      case 'restaurant':
        return 'coffee'
      case 'park':
      case 'scenic_spot':
      case 'pet_park':
        return 'tree-pine'
      case 'mall':
        return 'shopping-bag'
      case 'hotel':
        return 'stethoscope'
      default:
        return 'map-pin'
    }
  })()
  const Icon = (() => {
    if (iconFor === 'coffee') return Coffee
    if (iconFor === 'tree-pine') return TreePine
    if (iconFor === 'shopping-bag') return ShoppingBag
    if (iconFor === 'stethoscope') return Stethoscope
    return MapPin
  })()
  return (
    <li className="shrink-0 w-[260px]">
      <button
        onClick={() => onPick(p.id)}
        data-place-card-active={highlightId === p.id ? 'true' : 'false'}
        className={clsx(
          'w-full text-left rounded-[16px] p-3 bg-[rgba(255,255,255,0.8)] backdrop-blur-[12px] border transition active:scale-[0.99] outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_rgba(247,107,122,0.22)]',
          highlightId === p.id
            ? 'border-primary shadow-[0_10px_24px_rgba(84,49,31,0.08),inset_0_0_0_1px_rgba(247,107,122,0.45)]'
            : 'border-[rgba(255,255,255,0.6)] shadow-card',
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: accentFor.bg }}
          >
            <Icon size={22} style={{ color: accentFor.icon }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] leading-[1.4] text-ink line-clamp-1">{p.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{CATEGORY_META[p.category]?.label ?? p.category}</p>
          </div>
          <div className="flex flex-col items-end shrink-0 gap-1">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
              {useMemo(() => {
                const city = useStore.getState().city
                const center = city === 'beijing' ? [39.9042, 116.4074] : [31.2304, 121.4737]
                const R = 6371000
                const toRad = (v: number) => v * Math.PI / 180
                const dLat = toRad(p.lat - center[0])
                const dLng = toRad(p.lng - center[1])
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(center[0])) * Math.sin(dLng / 2) ** 2
                const meters = Math.round(2 * R * Math.asin(Math.sqrt(a)))
                return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`
              }, [p])}
            </span>
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-warning fill-warning" />
              <span className="text-[11px] text-muted-foreground">{p.rating ?? 4.5}</span>
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}

function NearbyBottomSheet({
  places, onPick, onOpenList,
}: { places: Place[]; onPick: (id: string) => void; onOpenList: () => void }) {
  const highlightId = useStore((s) => s.highlightPlaceId)
  return (
    <div
      data-map-nearby
      className="fixed left-0 right-0 z-[800]"
      style={{
        bottom: 'calc(84px + var(--sab, 0px))',
        paddingLeft: 'max(0px, var(--sal, 0px))',
        paddingRight: 'max(0px, var(--sar, 0px))',
      }}
    >
      <div className="flex justify-center pt-2 pb-1 bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] rounded-t-xl">
        <div className="w-9 h-1 bg-rule rounded-full" />
      </div>
      <div className="flex items-center justify-between px-4 pt-1 pb-2 bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px]">
        <h3 className="font-semibold text-[16px] text-foreground truncate">附近宠物友好地点</h3>
        <button
          onClick={onOpenList}
          className="h-11 px-3 rounded-full text-xs text-muted whitespace-nowrap hover:bg-surface/70 active:scale-[0.97] transition"
        >
          {places.length}个结果
        </button>
      </div>
      <ul className="px-4 pb-3 bg-[rgba(255,255,255,0.72)] backdrop-blur-[20px] flex gap-3 overflow-x-auto no-scrollbar overscroll-x-contain">
        {places.map((p) => (
          <PlaceCardBottom key={p.id} p={p} onPick={onPick} highlightId={highlightId} />
        ))}
      </ul>
    </div>
  )
}

export default function MapPage() {
  const { setHighlightPlaceId, highlightPlaceId } = useStore()
  const [searchParams] = useSearchParams()

  const merged = useMapPlaces()

  const [catFilter, setCatFilter] = useState<CategoryFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>('all')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)

  // Read ?place= from URL (e.g. from AI chat "查看路线" button)
  useEffect(() => {
    const placeFromUrl = searchParams.get('place')
    if (placeFromUrl) {
      setHighlightPlaceId(placeFromUrl)
      setListOpen(true)
    }
  }, [searchParams, setHighlightPlaceId])

  const displayPlaces = filterPlaces(merged, catFilter, sizeFilter, search)

  const pickPlace = (id: string) => {
    setHighlightPlaceId(id)
    setListOpen(false)
  }

  const switchRandomCity = () => {
    const list: Array<'beijing' | 'shanghai'> = ['beijing', 'shanghai']
    useStore.getState().setCity(list[Math.floor(Math.random() * list.length)])
  }

  const showError = displayPlaces.length === 0 && merged.length === 0

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="relative h-full w-full">
        <MapContainer
          center={[31.23, 121.47]}
          zoom={13}
          style={{ position: 'absolute', inset: 0 }}
          attributionControl={false}
          zoomControl={false}
        >
          <TileLayerWithFallback />
          <CityFlyer />
          <HighlightFocuser placeId={highlightPlaceId} />
          <UserLocationMarker />
          {displayPlaces.map((p) => (
            <PlacePopup key={p.id} place={p} highlight={p.id === highlightPlaceId} />
          ))}
        </MapContainer>

        <MapOverlayControls />

        {showError && (
          <div className="absolute inset-0 flex items-center justify-center z-[900] bg-surface/95">
            <EmptyState icon="alert-circle" title="地图加载失败" description="请检查网络或稍后重试" />
          </div>
        )}

        {displayPlaces.length === 0 && merged.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[790]" style={{ background: 'rgba(255,247,240,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
            <EmptyState icon="search-x" title="没有匹配的地点" description="试试调整筛选条件" />
          </div>
        )}

        {merged.length === 0 && <MainEmpty onSwitch={switchRandomCity} />}
      </div>

      <SearchChip
        search={search}
        onSearchChange={setSearch}
        onOpenFilter={() => setFilterOpen(true)}
      />

      <CategoryChips catFilter={catFilter} setCatFilter={setCatFilter} />

      <FilterBottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        catFilter={catFilter} setCatFilter={setCatFilter}
        sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
        setSearch={setSearch}
      />

      <NearbyBottomSheet places={displayPlaces} onPick={pickPlace} onOpenList={() => setListOpen(true)} />

      {listOpen && (
        <div className="fixed inset-0 z-[1100] flex flex-col justify-end" onClick={() => setListOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="附近地点列表"
            className="relative bg-surface rounded-t-2xl border-t border-rule max-h-[72vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-rule shrink-0">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span className="text-[16px] font-semibold text-ink">附近地点</span>
                <span className="text-xs text-muted">{displayPlaces.length} 个结果</span>
              </div>
              <button onClick={() => setListOpen(false)} className="w-11 h-11 rounded-md text-muted hover:text-foreground hover:bg-outline flex items-center justify-center" aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ListContent places={displayPlaces} onPick={(id) => { pickPlace(id); setListOpen(false) }} highlightId={highlightPlaceId} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlacePopup({ place, highlight }: { place: Place; highlight: boolean }) {
  return (
    <Marker
      position={[place.lat, place.lng]}
      icon={getMarkerIcon(place.category, highlight)}
      eventHandlers={{
        click: () => {
          const { setHighlightPlaceId } = useStore.getState()
          setHighlightPlaceId(place.id)
          const m = mapRef.current as any
          if (m) {
            try { m.setView([place.lat, place.lng], m.getZoom(), { animate: true }) } catch {}
          }
        },
      }}
      title={place.name}
    />
  )
}

function UserLocationMarker() {
  const city = useStore((s) => s.city)
  const center: [number, number] = city === 'beijing' ? [39.9042, 116.4074] : [31.2304, 121.4737]
  return (
    <Marker
      position={center}
      icon={getUserLocationMarkerIcon()}
      interactive={false}
      keyboard={false}
      zIndexOffset={1000}
    />
  )
}
