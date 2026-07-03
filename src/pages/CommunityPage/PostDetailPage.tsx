import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, Heart, MessageCircle, Bookmark, MapPin, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { useStore } from '../../store/useStore'
import { Button, Avatar, Badge } from '../../components/ui'
import { useToast } from '../../components/ui/toast-context'
import type { FeedItem } from '../../data/types'

export default function PostDetailPage() {
  const navigate = useNavigate()
  const { postId } = useParams()
  const feeds = useStore((s) => s.feeds)
  const placesRaw = useStore((s) => s.places)
  const likeFeed = useStore((s) => s.likeFeed)
  const unlikeFeed = useStore((s) => s.unlikeFeed)
  const bookmarkFeed = useStore((s) => s.bookmarkFeed)
  const unbookmarkFeed = useStore((s) => s.unbookmarkFeed)
  const setCity = useStore((s) => s.setCity)
  const { show } = useToast()

  const post = useMemo<FeedItem | undefined>(
    () => feeds.find((f) => f.id === postId),
    [feeds, postId],
  )

  const place = useMemo(
    () => (post ? placesRaw[post.placeId] : undefined),
    [post, placesRaw],
  )

  const [liked, setLiked] = useState(!!post?.likedByMe)
  const saved = !!post?.bookmarkedByMe

  if (!post) {
    return (
      <div className="relative h-full w-full flex flex-col">
        <Header onBack={() => navigate(-1)} title="帖子详情" />
        <div className="flex-1 flex items-center justify-center text-muted text-sm">未找到该帖子</div>
      </div>
    )
  }

  const toggleLike = () => {
    if (liked) unlikeFeed(post.id)
    else likeFeed(post.id)
    setLiked((v) => !v)
  }

  const toggleSave = () => {
    if (saved) {
      unbookmarkFeed(post.id)
      show('已取消收藏')
    } else {
      bookmarkFeed(post.id)
      show('已收藏', { kind: 'ok' })
    }
  }

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = post.placeName ? `${post.placeName} - PetTrace AI` : 'PetTrace AI 社区帖子'
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: post.text.slice(0, 80), url })
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
        await navigator.clipboard.writeText(url)
        show('链接已复制', { kind: 'ok' })
        return
      }
      show('当前环境暂不支持分享', { kind: 'warn' })
    } catch {
      show('分享已取消', { kind: 'warn' })
    }
  }

  const handleCheckIn = () => {
    if (place) setCity(place.city)
    navigate(`/map?place=${post.placeId}`)
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-bg">
      <Header
        onBack={() => navigate(-1)}
        title="帖子详情"
        right={
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-full bg-outline-variant hover:bg-outline text-muted hover:text-foreground flex items-center justify-center transition"
            title="分享"
            aria-label="分享"
          >
            <Share2 size={16} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <HeroGradient type={post.type} />

        <div className="px-4 md:px-6 -mt-10 relative z-10">
          <div className="rounded-2xl bg-surface border border-rule shadow-2 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <Avatar name={post.byUser} variant="gradient" size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink">{post.byUser}</span>
                  <Badge color="gray">{post.type}</Badge>
                </div>
                <div className="text-[11px] text-muted mt-0.5">{formatTime(post.whenISO)}</div>
              </div>
            </div>

            <div className="mt-4 text-[14px] md:text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
              {post.text}
            </div>

            {post.placeName && (
              <div className="mt-4 rounded-xl bg-outline-variant/50 border border-rule/40 px-3 py-2.5 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{post.placeName}</div>
                  {place && (
                    <div className="text-[11px] text-muted line-clamp-1">
                      {place.address}
                    </div>
                  )}
                </div>
                {place?.rating != null && place.rating > 0 && (
                  <div className="flex items-center gap-0.5 text-[11px] font-medium text-honey">
                    <Star size={11} className="fill-honey" />
                    {place.rating.toFixed(1)}
                  </div>
                )}
              </div>
            )}

            {place && (
              <div className="mt-3 text-[11px] text-muted flex items-center gap-3">
                <span>{place.verifierCount} 位宠物主人验证过</span>
                <span>·</span>
                <span>一致度 {Math.round(place.consistencyScore * 100)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <ActionBar
        liked={liked}
        likes={post.likes + (liked && !post.likedByMe ? 1 : 0)}
        saved={saved}
        onLike={toggleLike}
        onSave={toggleSave}
        onCheckIn={handleCheckIn}
      />
    </div>
  )
}

function Header({
  onBack,
  title,
  right,
}: {
  onBack: () => void
  title: string
  right?: React.ReactNode
}) {
  return (
    <div className="sticky top-0 z-20 bg-surface/85 backdrop-blur-xl border-b border-rule/40 px-3 md:px-4 h-14 flex items-center gap-3">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-outline-variant hover:bg-outline text-muted hover:text-foreground flex items-center justify-center transition"
        aria-label="返回"
      >
        <ArrowLeft size={16} />
      </button>
      <div className="flex-1 text-[15px] font-semibold text-ink truncate">{title}</div>
      {right}
    </div>
  )
}

function HeroGradient({ type }: { type: string }) {
  const m: Record<string, string> = {
    打卡: 'from-coral-100 to-coral-200',
    游记: 'from-coral-50 to-paw-warm/40',
    避雷: 'from-red-50 to-red-100',
    经验分享: 'from-honey-50 to-honey-100',
  }
  const cls = m[type] ?? 'from-coral-100 to-coral-200'
  return <div className={clsx('h-32 md:h-40 w-full bg-gradient-to-b', cls, 'opacity-80')} />
}

function ActionBar({
  liked,
  likes,
  saved,
  onLike,
  onSave,
  onCheckIn,
}: {
  liked: boolean
  likes: number
  saved: boolean
  onLike: () => void
  onSave: () => void
  onCheckIn: () => void
}) {
  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-6 md:right-6 z-[80] bg-surface/80 backdrop-blur-2xl border border-rule/40 rounded-xl shadow-2 flex items-center gap-1 px-1.5 py-1.5">
      <button
        onClick={onLike}
        className={clsx(
          'flex items-center gap-1.5 px-3 h-11 rounded-xl text-[13px] font-medium transition active:scale-[0.97]',
          liked ? 'bg-primary/10 text-primary' : 'bg-outline-variant/70 text-muted hover:text-foreground',
        )}
      >
        <Heart size={16} className={clsx(liked && 'fill-primary')} />
        <span>{likes > 0 ? likes : '喜欢'}</span>
      </button>
      <button className="flex items-center gap-1.5 px-3 h-11 rounded-xl text-[13px] font-medium bg-outline-variant/70 text-muted hover:text-foreground transition active:scale-[0.97]">
        <MessageCircle size={16} />
        <span>评论</span>
      </button>
      <div className="flex-1" />
      <button
        onClick={onSave}
        className={clsx(
          'w-11 h-11 rounded-xl flex items-center justify-center transition active:scale-[0.97]',
          saved ? 'bg-honey-50 text-honey' : 'bg-outline-variant/70 text-muted hover:text-foreground',
        )}
        title="收藏"
        aria-label="收藏"
        aria-pressed={saved}
      >
        <Bookmark size={16} className={clsx(saved && 'fill-honey')} />
      </button>
      <Button variant="primary" size="sm" className="h-11 rounded-xl px-3" onClick={onCheckIn}>
        去打卡
      </Button>
    </div>
  )
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const now = Date.now()
    const diff = (now - d.getTime()) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}
