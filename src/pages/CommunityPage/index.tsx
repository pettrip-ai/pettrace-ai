import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { CityId } from '../../store/useStore'
import { CITY_TABS, feedCityOf } from './constants'
import { FeedCard } from './components/FeedCard'
import { useToast } from './hooks'
import { PostSheet } from './components/PostSheet'

export default function CommunityPage() {
  const navigate = useNavigate()
  const feedList = useStore((s) => s.feeds)
  const placesRaw = useStore((s) => s.places)
  const likeFeed = useStore((s) => s.likeFeed)
  const unlikeFeed = useStore((s) => s.unlikeFeed)
  const bookmarkFeed = useStore((s) => s.bookmarkFeed)
  const unbookmarkFeed = useStore((s) => s.unbookmarkFeed)
  const verifyPlace = useStore((s) => s.verifyPlace)
  const setCityStore = useStore((s) => s.setCity)

  const [cityTab, setCityTab] = useState<CityId | 'all'>('all')
  const [postOpen, setPostOpen] = useState(false)
  const { show } = useToast()

  const placesById = useMemo(() => {
    const out: Record<string, { id: string; name: string; city: CityId; address?: string }> = {}
    for (const [id, p] of Object.entries(placesRaw)) {
      if (!p) continue
      out[id] = { id: p.id, name: p.name, city: p.city, address: p.address }
    }
    return out
  }, [placesRaw])

  const filtered = useMemo(() => {
    return [...feedList]
      .sort((a, b) => (b.whenISO < a.whenISO ? -1 : 1))
      .filter((f) => {
        if (cityTab === 'all') return true
        return feedCityOf(f.placeId, placesById) === cityTab
      })
  }, [feedList, cityTab, placesById])

  const handleVerify = (_feedId: string, placeId: string, verdict: 'good' | 'bad') => {
    if (verdict === 'good') verifyPlace(placeId, 'good', '我')
    else verifyPlace(placeId, 'bad', '我')
    show(verdict === 'good' ? '已确认真实验证' : '已标记为避雷', { kind: 'ok' })
  }

  const handleNavigateMap = (placeId: string) => {
    const place = placesById[placeId]
    if (place) {
      setCityStore(place.city)
    }
    navigate('/map')
  }

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden">
      <div className="shrink-0 z-10 border-b border-rule/40 bg-surface/78 backdrop-blur-xl sticky top-0">
        <div className="px-4 md:px-6 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[22px] md:text-h2 font-bold leading-tight truncate text-ink">社区</h2>
            <p className="font-body text-caption text-muted-foreground truncate">发现宠物友好地点</p>
          </div>
          <button
            onClick={() => setPostOpen(true)}
            className="shrink-0 inline-flex items-center justify-center px-3.5 h-8 rounded-full bg-primary text-primary-fg font-heading font-semibold text-[13px] shadow-[0_2px_8px_rgba(247,107,122,0.22)] active:scale-[0.97] transition"
          >
            <Plus size={14} className="mr-1" /> 发布验证
          </button>
        </div>

        <div className="px-4 md:px-6 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CITY_TABS.map((t) => {
            const active = cityTab === t.key
            return active ? (
              <button
                key={t.key}
                onClick={() => setCityTab(t.key)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-primary-fg font-heading font-semibold text-[13px] whitespace-nowrap shadow-[0_2px_8px_rgba(247,107,122,0.22)] active:scale-[0.97] transition"
              >
                {t.label}
              </button>
            ) : (
              <button
                key={t.key}
                onClick={() => setCityTab(t.key)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 text-muted-foreground font-body font-medium text-[13px] whitespace-nowrap border border-rule/70 active:scale-[0.97] transition hover:text-ink"
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-3 pb-20 md:pb-6 px-4 md:px-5">
        {filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-coral-50 to-mint-50 flex items-center justify-center mb-3">
              <Sparkles size={28} className="text-coral-400" />
            </div>
            <div className="font-heading font-semibold text-h4 text-ink">这里还没有验证 Feed</div>
            <div className="mt-1 text-sm text-muted-foreground">成为第一条发布者吧！</div>
            <button
              onClick={() => setPostOpen(true)}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-primary text-white text-sm font-heading font-semibold shadow-[0_2px_8px_rgba(247,107,122,0.22)] active:scale-[0.97] transition"
            >
              <Plus size={14} /> 发布第一条验证
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                placesById={placesById}
                onLike={() => likeFeed(feed.id)}
                onUnlike={() => unlikeFeed(feed.id)}
                onBookmark={() => bookmarkFeed(feed.id)}
                onUnbookmark={() => unbookmarkFeed(feed.id)}
                onVerify={(v) => handleVerify(feed.id, feed.placeId, v)}
                onNavigateMap={handleNavigateMap}
              />
            ))}
          </div>
        )}
      </div>

      <PostSheet
        open={postOpen}
        onClose={() => setPostOpen(false)}
        city={useStore((s) => s.city)}
        placesById={placesById}
        onSuccess={() => show('发布成功', { kind: 'ok' })}
      />
    </div>
  )
}
