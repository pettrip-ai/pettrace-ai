import { useMemo, useRef, useState, forwardRef, useEffect } from 'react'
import { Send, Plus, Route, Bookmark, Footprints, Clock, Calendar, Dog as DogIcon, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { mockAiEngine, detectCity } from '../../lib/mockAiEngine'
import { sendAiTurn, AiFetchError, type AiReply } from '../../lib/ai'
import { CITIES, PLACES } from '../../data/mock'
import type { CityId } from '../../data/types'
import { useToast } from '../../components/ui/toast-context'
import {
  petToContext,
  chatToHistory,
  placesListFor,
  placeNameOf,
} from './constants'
import { useAutoGrow, useScrollToBottom, useTypewriter } from './hooks'

interface RenderMessage {
  role: 'user' | 'assistant'
  content: string
  structured?: AiReply
  key: string
}

const QUICK_SUGGESTIONS = [
  { icon: Footprints, label: '步行路线' },
  { icon: Clock, label: '预计用时' },
  { icon: DogIcon, label: '附近宠物店' },
  { icon: Calendar, label: '周末行程' },
]

function findPlaceById(city: CityId, placeId?: string) {
  if (!placeId) return undefined
  const cityPlace = PLACES[city]?.find((place) => place.id === placeId)
  if (cityPlace) return cityPlace
  return (Object.keys(PLACES) as CityId[])
    .flatMap((key) => PLACES[key])
    .find((place) => place.id === placeId)
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5" style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
      <div
        className="inline-flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--pettrace-coral-100), var(--pettrace-coral-200))',
          boxShadow: '0 2px 8px rgba(247,107,122,0.12)',
        }}
      >
        <DogIcon size={17} style={{ color: 'var(--primary)' }} />
      </div>
      <div
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '18px 18px 18px 4px',
          padding: '14px 18px',
          border: '0.5px solid rgba(255,255,255,0.6)',
          boxShadow: '0 2px 8px rgba(84,49,31,0.04)',
          display: 'flex', alignItems: 'center', gap: 6, height: 36,
        }}
      >
        <span className="typing-dot" />
        <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
        <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

function PlaceCard({ data, placeId }: {
  data: { name: string; tagline?: string; rating?: number; address?: string; distanceKm?: number }
  placeId?: string
}) {
  const navigate = useNavigate()
  const { show } = useToast()
  const [saved, setSaved] = useState(false)
  const goToMap = () => {
    if (placeId) {
      navigate(`/map?place=${placeId}`)
    }
  }
  function toggleSaved() {
    const next = !saved
    setSaved(next)
    show(next ? '已收藏' : '已取消收藏', { kind: next ? 'ok' : 'info' })
  }
  return (
    <div
      className="card"
      style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0, boxShadow: 'var(--shadow-2)' }}
    >
      <div style={{ flexShrink: 0, height: 6, background: 'linear-gradient(90deg, var(--primary), var(--pettrace-coral-300))' }} />
      <div style={{ padding: '14px 14px 12px' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-container)',
            }}>
              <DogIcon size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div className="min-w-0">
              <p className="truncate" style={{ fontWeight: 600, fontSize: 14, color: 'var(--foreground)', margin: 0, fontFamily: 'var(--font-heading)' }}>{data.name}</p>
              <p className="pettrace-caption truncate" style={{ color: 'var(--muted-foreground)', margin: '2px 0 0' }}>{data.tagline ?? '宠物友好地点'}</p>
            </div>
          </div>
          {data.rating != null && (
            <div
              className="flex items-center gap-1 rounded-full shrink-0"
              style={{ padding: '3px 8px', background: 'var(--pettrace-honey-50)' }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', fontFamily: 'var(--font-heading)' }}>★ {data.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {(data.address || data.distanceKm != null) && (
          <div className="flex items-center gap-1.5 mb-3">
            {data.address && <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{data.address}</span>}
            {data.address && data.distanceKm != null && <span style={{ color: 'var(--border)', margin: '0 2px' }}>·</span>}
            {data.distanceKm != null && <span style={{ fontSize: 13, color: 'var(--accent)' }}>{data.distanceKm}km</span>}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={goToMap}
            style={{
              flex: 1, height: 44, background: 'var(--primary)', color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-heading)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(247,107,122,0.2)', border: 'none', cursor: 'pointer',
            }}
          >
            <Route size={14} />查看路线
          </button>
          <button
            onClick={toggleSaved}
            aria-pressed={saved}
            style={{
              flex: 1, height: 44, background: saved ? 'var(--pettrace-honey-50)' : 'rgba(255,255,255,0.8)', color: saved ? 'var(--warning)' : 'var(--foreground)',
              borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-heading)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: '0.5px solid var(--border)', cursor: 'pointer',
            }}
          >
            <Bookmark size={14} className={saved ? 'fill-honey' : undefined} />{saved ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  pendingText?: string | null
}

export default forwardRef(function AiChatPage({ pendingText }: Props, ref) {
  const navigate = useNavigate()
  const {
    city,
    setCity,
    pets,
    chat,
    addMessage,
    settings,
  } = useStore()

  const pet = pets[0]
  const { show } = useToast()

  const [value, setValue] = useState(pendingText ?? '')
  const [isTyping, setIsTyping] = useState(false)
  const [proseByKey, setProseByKey] = useState<Record<string, string>>({})

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useAutoGrow(textareaRef, 1, 6)
  useScrollToBottom(scrollRef, [chat.length, isTyping])

  const renderedMessages = useMemo<RenderMessage[]>(() => {
    return chat.map((m, idx) => {
      const key = `msg-${idx}-${
        m.structured && typeof m.structured === 'object' && Array.isArray((m.structured as AiReply).itinerary)
          ? (m.structured as AiReply).itinerary.length
          : 'plain'
      }`
      if (m.role === 'assistant' && m.structured && typeof m.structured === 'object') {
        const maybe = m.structured as Partial<AiReply>
        if (Array.isArray(maybe.itinerary)) {
          return { role: 'assistant', content: m.content, structured: maybe as AiReply, key }
        }
      }
      return { role: m.role, content: m.content, key }
    })
  }, [chat])

  async function handleSend(raw?: string) {
    const text = (raw ?? value).trim()
    if (!text || isTyping) return

    addMessage({ role: 'user', content: text })
    setValue('')
    setIsTyping(true)

    const targetCity = detectCity(text, city)
    if (targetCity !== city) setCity(targetCity)
    const petCtx = pet ? petToContext(pet) : undefined
    const history = chatToHistory([...chat, { role: 'user', content: text }])
    const useMock = settings.enableMockAi || !settings.apiKey

    let reply: AiReply
    if (!useMock) {
      try {
        reply = await sendAiTurn(history, {
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          usePetContext: !!petCtx,
          petContext: petCtx,
          city: CITIES[targetCity]?.name ?? targetCity,
          places: placesListFor(targetCity),
          timeoutMs: 20_000,
        })
      } catch (err) {
        const msg = err instanceof AiFetchError ? err.message : '未知错误'
        show(`API 失败(${msg})，已切 Mock 回复`, { kind: 'warn' })
        reply = mockAiEngine({ message: text, history, petContext: petCtx, city: targetCity })
      }
    } else {
      reply = mockAiEngine({ message: text, history, petContext: petCtx, city: targetCity })
    }

    const assistantContent = reply.prose?.trim() ?? `为你规划了 ${reply.itinerary.length} 步行程。`
    addMessage({ role: 'assistant', content: assistantContent, structured: reply })
    setProseByKey((prev) => ({ ...prev, [renderedMessages.length]: assistantContent }))
    setIsTyping(false)
  }

  function onQuickPick(label: string) {
    setValue(`关于"${label}"，帮我想想`)
  }

  function handleAttachmentClick() {
    show('附件功能暂未开放', { kind: 'info' })
  }

  const lastAssistantKey = renderedMessages.map((m) => m.key).at(-1)
  const lastAssistantProse = lastAssistantKey ? proseByKey[lastAssistantKey] ?? '' : ''
  const typewrittenLast = useTypewriter(lastAssistantProse, 12, !!lastAssistantProse && !isTyping)

  useEffect(() => {
    if (pendingText) {
      setValue(pendingText)
      const t = pendingText.trim()
      if (t) {
        const timer = setTimeout(() => handleSend(t), 50)
        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingText])

  return (
    <div ref={ref as any} className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      <header
        data-ai-chat-header
        className="shrink-0 flex items-center gap-3 px-4"
        style={{
          background: 'rgba(255,247,240,0.82)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderBottom: '0.5px solid rgba(84,49,31,0.08)',
          paddingTop: 'calc(var(--sat, 0px) + 10px)',
          paddingBottom: 10,
        }}
      >
        <button
          className="inline-flex items-center justify-center rounded-full shrink-0"
          style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(0,0,0,0.06)' }}
          aria-label="返回"
          onClick={() => navigate('/ai')}
        >
          <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} />
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-center">
          <div
            className="inline-flex items-center justify-center rounded-full shrink-0"
            style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--pettrace-coral-100), var(--pettrace-coral-200))', boxShadow: '0 2px 8px rgba(247,107,122,0.12)' }}
          >
            <DogIcon size={17} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="text-center min-w-0">
            <h1 className="pettrace-h4 truncate" style={{ color: 'var(--foreground)', fontSize: 15, margin: 0 }}>PetTrace AI</h1>
            <p className="pettrace-caption" style={{ color: 'var(--accent)', margin: 0, fontSize: 10 }}>在线</p>
          </div>
        </div>
        <div style={{ width: 34 }} className="shrink-0" />
      </header>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar"
        style={{ padding: '12px 12px 4px', display: 'flex', flexDirection: 'column', gap: 12, overscrollBehavior: 'contain' }}
      >
        <div className="flex items-center gap-3" style={{ padding: '0 16px' }}>
          <div style={{ flex: 1, height: 0.5, background: 'rgba(84,49,31,0.08)' }} />
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>今天 9:38</span>
          <div style={{ flex: 1, height: 0.5, background: 'rgba(84,49,31,0.08)' }} />
        </div>

        {renderedMessages.length === 0 && (
          <div className="flex gap-2.5" style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
            <div
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--pettrace-coral-100), var(--pettrace-coral-200))', boxShadow: '0 2px 8px rgba(247,107,122,0.12)' }}
            >
              <DogIcon size={17} style={{ color: 'var(--primary)' }} />
            </div>
            <div
              style={{
                minWidth: 0,
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '18px 18px 18px 4px', padding: '12px 14px',
                border: '0.5px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 8px rgba(84,49,31,0.04)',
                fontSize: 15, lineHeight: 1.6, color: 'var(--foreground)',
                wordBreak: 'break-word', overflowWrap: 'break-word',
              }}
            >
              你好！我是 PetTrace AI 助手，可以帮你规划带{pet?.name ?? '宠物'}的出行路线。告诉我你想去哪里？
            </div>
          </div>
        )}

        {renderedMessages.map((msg, idx) => {
          const isLastAssistant = msg.role === 'assistant' && idx === renderedMessages.length - 1
          const showTypewriter = isLastAssistant && typewrittenLast
          const bubbleContent = showTypewriter ? typewrittenLast : msg.content

          return (
            <div key={msg.key} className="space-y-2">
              {msg.role === 'user' ? (
                <div
                  style={{
                    alignSelf: 'flex-end', marginLeft: 'auto',
                    background: 'linear-gradient(135deg, var(--primary), var(--pettrace-coral-600))',
                    borderRadius: '18px 18px 4px 18px',
                    padding: '12px 14px',
                    boxShadow: '0 4px 12px rgba(247,107,122,0.18)',
                    fontSize: 15, lineHeight: 1.6, color: 'var(--primary-foreground)',
                    wordBreak: 'break-word', overflowWrap: 'break-word', maxWidth: '78%',
                  }}
                >{bubbleContent}</div>
              ) : (
                <div className="flex gap-2.5" style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
                  <div
                    className="inline-flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--pettrace-coral-100), var(--pettrace-coral-200))', boxShadow: '0 2px 8px rgba(247,107,122,0.12)' }}
                  >
                    <DogIcon size={17} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.75)',
                        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: '18px 18px 18px 4px', padding: '12px 14px',
                        border: '0.5px solid rgba(255,255,255,0.6)',
                        boxShadow: '0 2px 8px rgba(84,49,31,0.04)',
                        fontSize: 15, lineHeight: 1.6, color: 'var(--foreground)',
                        wordBreak: 'break-word', overflowWrap: 'break-word',
                      }}
                    >{bubbleContent}</div>
                    {msg.structured && Array.isArray(msg.structured.itinerary) && msg.structured.itinerary.map((p, pi) => {
                      const place = findPlaceById(city, p.placeId)
                      return (
                        <PlaceCard
                          key={pi}
                          placeId={p.placeId}
                          data={{
                            name: p.name ?? p.place ?? (p.placeId ? placeNameOf(city, p.placeId) : '推荐地点'),
                            tagline: p.tagline ?? p.type ?? p.label ?? place?.category,
                            rating: p.rating ?? place?.rating,
                            address: p.address ?? p.area ?? place?.address,
                            distanceKm: p.distanceKm,
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {isTyping && isLastAssistant && <TypingIndicator />}
            </div>
          )
        })}

        {isTyping && renderedMessages.length === 0 && <TypingIndicator />}
      </div>

      <div
        data-ai-chat-suggestions
        className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-3 py-2"
        style={{ background: 'transparent' }}
      >
        {QUICK_SUGGESTIONS.map((s, i) => {
          const I = s.icon
          return (
            <button
              key={i}
              className="chip inactive"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '8px 14px', fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={() => onQuickPick(s.label)}
            >
              <I size={13} />
              {s.label}
            </button>
          )
        })}
      </div>

      <div
        data-ai-chat-composer
        className="shrink-0 flex flex-col"
        style={{
          background: 'rgba(255,247,240,0.82)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          borderTop: '0.5px solid rgba(84,49,31,0.06)',
          padding: '8px 12px 0',
        }}
      >
        <div className="flex items-center gap-2.5" style={{ paddingBottom: 8 }}>
          <div
            className="flex-1 min-w-0 flex items-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(0,0,0,0.06)', padding: '10px 12px', minHeight: 42, maxHeight: 100 }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              rows={1}
              placeholder="告诉我你的目的地"
              style={{
                flex: 1, minWidth: 0, resize: 'none', outline: 'none',
                fontSize: 15, color: 'var(--foreground)', lineHeight: 1.4, maxHeight: 80,
                fontFamily: 'var(--font-body)', background: 'transparent', border: 'none',
              }}
            />
            <div className="flex items-center gap-1.5 shrink-0 ml-2" style={{ paddingTop: 2 }}>
              <button
                onClick={handleAttachmentClick}
                style={{ width: 44, height: 44, borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                aria-label="添加附件"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!value.trim() || isTyping}
            style={{
              width: 44, height: 44, borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--primary), var(--pettrace-coral-600))',
              color: 'var(--primary-foreground)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(247,107,122,0.3)',
              flexShrink: 0,
            }}
            aria-label="发送"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center" style={{ fontSize: 10, color: 'var(--muted-foreground)', opacity: 0.6, margin: 0, padding: '0 0 calc(var(--sab, 4px) + 4px)', fontFamily: 'var(--font-body)' }}>内容由AI生成，请注意甄别</p>
      </div>
    </div>
  )
})
