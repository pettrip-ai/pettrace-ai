import { AlertTriangle, CheckCircle2, ClipboardList, MapPin, RefreshCw, ShieldCheck } from 'lucide-react'
import type { AiReply, AiRiskSection } from '../../../lib/ai'
import type { CityId, Place } from '../../../data/types'
import { placeNameOf } from '../constants'

interface PlanWorkspaceProps {
  reply: AiReply
  city: CityId
  findPlace: (placeId?: string) => Place | undefined
  onOpenMap: (placeId?: string) => void
  onVerifyPlace: (placeId?: string) => void
  onRefine: (text: string) => void
}

function stringListOf(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function stringValue(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

function riskTypeOf(raw: unknown): AiRiskSection['type'] {
  return raw === 'rule' || raw === 'environment' || raw === 'execution' ? raw : 'execution'
}

function safeRiskSections(raw: unknown): AiRiskSection[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((section): AiRiskSection[] => {
    if (!section || typeof section !== 'object') return []
    const obj = section as Record<string, unknown>
    const items = stringListOf(obj.items)
    if (!items.length) return []
    return [{
      type: riskTypeOf(obj.type),
      title: stringValue(obj.title) || '风险提示',
      items,
    }]
  })
}

function riskFallback(risks: unknown): AiRiskSection[] {
  const items = stringListOf(risks)
  if (!items.length) return []
  return [{ type: 'execution', title: '风险提示', items }]
}

function sourceLabel(source?: unknown) {
  if (source === 'fallback') return 'Mock fallback'
  if (source === 'api') return '真实 AI'
  return 'Mock AI'
}

function riskTone(type: AiRiskSection['type']) {
  if (type === 'rule') return '规则'
  if (type === 'environment') return '环境'
  return '执行'
}

function stepPlaceName(city: CityId, step: AiReply['itinerary'][number], place?: Place) {
  if (step.name) return step.name
  if (step.place) return step.place
  if (place?.name) return place.name
  if (step.placeId) return placeNameOf(city, step.placeId)
  return '推荐地点'
}

function refineText(placeName: string) {
  return `请替换 ${placeName}，给我一个更稳妥的宠物友好备选方案`
}

export function PlanWorkspace({ reply, city, findPlace, onOpenMap, onVerifyPlace, onRefine }: PlanWorkspaceProps) {
  const riskSections = safeRiskSections(reply.riskSections)
  const risks = riskSections.length ? riskSections : riskFallback(reply.risks)

  return (
    <section className="space-y-2.5" aria-label="AI 生成计划工作台">
      <PlanSummaryCard reply={reply} />
      <ItineraryTimeline
        reply={reply}
        city={city}
        findPlace={findPlace}
        onOpenMap={onOpenMap}
        onVerifyPlace={onVerifyPlace}
        onRefine={onRefine}
      />
      <RiskPanel sections={risks} />
      <ChecklistPanel items={stringListOf(reply.checklist)} />
    </section>
  )
}

export function PlanSummaryCard({ reply }: { reply: AiReply }) {
  const title = stringValue(reply.summary?.title) || `为你规划了 ${reply.itinerary.length} 步行程`
  const confidence = stringValue(reply.summary?.confidenceLabel) || '规则已标注'
  const petProfileText = reply.summary?.petProfileUsed === true ? '已使用宠物档案' : '未使用宠物档案'

  return (
    <div className="card rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-2 py-0.5 text-[11px] font-heading font-semibold text-primary">
              <ShieldCheck size={11} />
              {sourceLabel(reply.summary?.source)}
            </span>
            <span className="rounded-full bg-honey-soft px-2 py-0.5 text-[11px] font-heading font-semibold text-warning">
              {confidence}
            </span>
          </div>
          <h2 className="pettrace-h4 m-0 text-[15px] leading-snug text-ink">{title}</h2>
          <p className="pettrace-caption mt-1 text-muted-foreground">{petProfileText}，行程建议仅作出发前核验参考</p>
        </div>
        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary-container)] text-primary">
          <ClipboardList size={18} />
        </div>
      </div>
    </div>
  )
}

export function ItineraryTimeline({
  reply,
  city,
  findPlace,
  onOpenMap,
  onVerifyPlace,
  onRefine,
}: PlanWorkspaceProps) {
  if (!reply.itinerary.length) return null

  return (
    <div className="space-y-2" aria-label="行程时间线">
      {reply.itinerary.map((step, index) => {
        const place = findPlace(step.placeId)
        const placeName = stepPlaceName(city, step, place)
        const reason = step.reason || step.action || '按宠物友好规则安排此站'
        const action = step.action || step.label || '到店前再次确认接待规则'

        return (
          <article key={`${step.placeId ?? 'step'}-${index}`} className="card rounded-xl p-3.5">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-heading font-semibold text-primary-foreground">
                  {step.time ?? `第 ${index + 1} 站`}
                </div>
                <div className="mt-2 h-full min-h-10 w-px bg-border" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="m-0 truncate font-heading text-[14px] font-semibold text-ink">{placeName}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{reason}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[11px] font-heading font-semibold text-accent">
                    <CheckCircle2 size={11} />
                    {step.ruleBrief || place?.rule.notes || '规则待核验'}
                  </span>
                </div>

                <p className="mt-2 text-[12px] leading-relaxed text-ink">{action}</p>

                {step.verifyHint && (
                  <p className="mt-2 rounded-lg bg-[color:var(--pettrace-neutral-50)] px-2.5 py-2 text-[12px] leading-relaxed text-muted-foreground">
                    {step.verifyHint}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenMap(step.placeId)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-[12px] font-heading font-semibold text-primary-foreground"
                  >
                    <MapPin size={13} />
                    查看地图
                  </button>
                  <button
                    type="button"
                    onClick={() => onVerifyPlace(step.placeId)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 text-[12px] font-heading font-semibold text-ink"
                  >
                    <ShieldCheck size={13} />
                    标记已验证
                  </button>
                  <button
                    type="button"
                    onClick={() => onRefine(refineText(placeName))}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white/80 px-3 text-[12px] font-heading font-semibold text-ink"
                  >
                    <RefreshCw size={13} />
                    替换
                  </button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function RiskPanel({ sections }: { sections: AiRiskSection[] }) {
  const safeSections = safeRiskSections(sections)
  if (!safeSections.length) return null

  return (
    <section className="card rounded-xl p-3.5" aria-label="风险提示">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning" />
        <h2 className="m-0 font-heading text-[14px] font-semibold text-ink">风险提示</h2>
      </div>
      <div className="space-y-2">
        {safeSections.map((section, index) => (
          <div key={`${section.type}-${index}`} className="border-t border-[color:var(--border)] pt-2 first:border-t-0 first:pt-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-honey-soft px-2 py-0.5 text-[11px] font-heading font-semibold text-warning">
                {riskTone(section.type)}
              </span>
              <h3 className="m-0 text-[13px] font-heading font-semibold text-ink">{section.title}</h3>
            </div>
            <ul className="m-0 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-muted-foreground">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ChecklistPanel({ items }: { items: string[] }) {
  if (!items.length) return null

  return (
    <section className="card rounded-xl p-3.5" aria-label="行前清单">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardList size={16} className="text-primary" />
        <h2 className="m-0 font-heading text-[14px] font-semibold text-ink">行前清单</h2>
      </div>
      <ul className="m-0 space-y-2 p-0">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
