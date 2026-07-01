import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Heart,
  MessageCircle,
  Bookmark,
  Star,
  MapPin,
  CheckCircle,
} from 'lucide-react'
import type { CityId, FeedItem } from '../../../store/useStore'

const CITY_NAMES: Record<CityId, string> = {
  shanghai: '上海',
  beijing: '北京',
  guangzhou: '广州',
  chengdu: '深圳',
}

function formatTime(iso: string) {
  try {
    return formatDistanceToNow(parseISO(iso), { locale: zhCN, addSuffix: true })
  } catch {
    return '不久前'
  }
}

function startsWithDoubaoLike(s: string) {
  const t = (s || '').trim()
  return t.startsWith('豆豆') || t.startsWith('豆')
}

function authorInitial(s: string) {
  const t = (s || '').trim()
  return t ? t[0] : '🐾'
}

function pickAvatarVariant(name: string): 'coral' | 'mint' | 'neutral' {
  const t = name || ''
  if (startsWithDoubaoLike(t)) return 'coral'
  const mintNames = ['奶茶', '奶', '小薄荷', '薄荷', '抹茶', '小草', '小草草', 'Luna', 'luna']
  if (mintNames.some((mn) => t.startsWith(mn))) return 'mint'
  return 'neutral'
}

function Avatar({ name }: { name: string }) {
  const variant = pickAvatarVariant(name)
  const initial = authorInitial(name)
  const base = 'shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-[14px]'
  if (variant === 'coral') {
    return (
      <div className={`${base} bg-gradient-to-br from-coral-100 to-coral-200 text-primary shadow-[0_2px_6px_rgba(247,107,122,0.15)]`}>
        {initial}
      </div>
    )
  }
  if (variant === 'mint') {
    return (
      <div className={`${base} bg-[rgba(32,169,118,0.12)] text-accent`}>
        {initial}
      </div>
    )
  }
  return (
    <div className={`${base} border-[1.5px] border-border text-ink`}>
      {initial}
    </div>
  )
}

export interface FeedCardProps {
  feed: FeedItem
  placesById: Record<string, { id: string; name: string; city: CityId; address?: string } | undefined>
  onLike: () => void
  onUnlike: () => void
  onVerify: (verdict: 'good' | 'bad') => void
  onNavigateMap: (placeId: string) => void
}

export function FeedCard({ feed, placesById, onLike, onUnlike, onNavigateMap }: FeedCardProps) {
  const [overflows, setOverflows] = useState(false)
  const textRef = useRef<HTMLParagraphElement | null>(null)
  const place = placesById[feed.placeId]
  const liked = !!feed.likedByMe

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    setOverflows(el.scrollHeight > el.clientHeight + 2)
  }, [feed.text])

  const city = place ? CITY_NAMES[place.city] : undefined
  const title = place?.name || feed.placeName || feed.placeId

  return (
    <article
      className="border-[0.5px] border-white/60 shadow-[0_1px_3px_rgba(84,49,31,0.06)]"
      style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: 14,
      }}
    >
      <header className="flex items-center gap-3">
        <Avatar name={feed.byUser} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body font-semibold text-[14px] text-ink truncate">{feed.byUser}</span>
            <span className="inline-flex items-center gap-[3px] px-[7px] py-[2px] rounded-full bg-[rgba(16,185,129,0.1)] text-success text-[10px] font-body font-semibold">
              <CheckCircle size={11} /> 已验证
            </span>
          </div>
          <div className="text-caption text-muted-foreground">{formatTime(feed.whenISO)}</div>
        </div>
      </header>

      <div className="mt-[10px]">
        <h4 className="font-heading font-semibold text-[15px] text-ink truncate">{title}</h4>
        <div className="mt-1 flex items-center gap-3 min-w-0">
          <button
            onClick={() => onNavigateMap(feed.placeId)}
            className="min-w-0 inline-flex items-center gap-[3px] text-caption text-muted-foreground truncate hover:text-primary"
          >
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {place?.address || title}
              {city ? ` · ${city}` : ''}
            </span>
          </button>
          <span className="shrink-0 inline-flex items-center gap-[2px] text-caption font-semibold text-honey">
            <Star size={12} className="fill-honey" /> 4.7
          </span>
        </div>
      </div>

      {feed.image ? (
        <div className="mt-[10px] rounded-xl h-[120px] overflow-hidden">
          <img
            src={feed.image}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="mt-[10px] rounded-xl h-[120px] bg-gradient-to-br from-coral-50 to-mint-100" />
      )}

      <p
        ref={textRef}
        className="mt-[10px] font-body text-[14px] leading-[1.6] text-ink whitespace-pre-wrap line-clamp-3"
      >
        {feed.text}
      </p>
      {overflows && (
        <span className="inline-flex items-center gap-0.5 text-[12px] text-muted-foreground mt-1">...</span>
      )}

      <footer className="mt-[10px] pt-[10px] border-t-[0.5px] border-border flex items-center gap-4">
        <button
          onClick={() => (liked ? onUnlike() : onLike())}
          className={clsx(
            'inline-flex items-center gap-[3px] text-[13px] leading-none transition',
            liked ? 'text-primary' : 'text-muted-foreground hover:text-primary',
          )}
          aria-label={liked ? '取消点赞' : '点赞'}
        >
          <Heart size={15} className={clsx(liked ? 'fill-primary' : 'fill-transparent')} />
          <span>{feed.likes}</span>
        </button>
        <span className="inline-flex items-center gap-[3px] text-[13px] text-muted-foreground leading-none">
          <MessageCircle size={15} /> 0
        </span>
        <button
          className="ml-auto text-muted-foreground hover:text-primary"
          aria-label="收藏"
        >
          <Bookmark size={15} />
        </button>
      </footer>
    </article>
  )
}
