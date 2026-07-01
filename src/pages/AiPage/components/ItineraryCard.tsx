import { MapPin, Star, Route, Bookmark } from 'lucide-react'
import type { AiReply } from '../../../lib/ai'
import type { CityId } from '../../../data/types'
import { placeNameOf } from '../constants'

interface Props {
  data: AiReply
  city: CityId
  onCardClick: (placeId: string) => void
}

export function ItineraryCard({ data, city, onCardClick }: Props) {
  const { itinerary, risks, checklist } = data
  if (!itinerary || itinerary.length === 0) return null

  return (
    <div className="space-y-2">
      {itinerary.map((step, sIdx) => (
        <button
          key={sIdx}
          onClick={() => onCardClick(step.placeId ?? '')}
          className="pet-card w-full text-left cursor-pointer group active:scale-[0.98] transition overflow-hidden p-0 rounded-xl"
        >
          <div className="flex">
            <div className="w-1.5 shrink-0 bg-gradient-to-b from-primary to-coral-300" />
            <div className="flex-1 min-w-0 p-3 md:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="inline-flex items-center justify-center w-10 h-6 rounded-full bg-coral-100 text-primary text-[11px] font-heading font-semibold shrink-0">
                    {step.time ?? '出发'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-heading font-semibold text-[14px] md:text-[15px] text-ink truncate">
                      {step.label} · {placeNameOf(city, step.placeId ?? '')}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-body">
                      {step.action}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-honey-soft text-warning font-heading font-semibold">
                  <Star size={10} />
                  {step.ruleBrief}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                  <MapPin size={11} className="text-primary" />
                  查看路线
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                  <Route size={11} />
                  {step.placeId}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                  <Bookmark size={11} />
                  收藏
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}

      {risks && risks.length > 0 && (
        <details className="pet-card text-[12px] text-muted-foreground font-body">
          <summary className="cursor-pointer font-heading font-semibold text-ink text-[13px]">⚠️ 风险提示</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      )}

      {checklist && checklist.length > 0 && (
        <details className="pet-card text-[12px] text-muted-foreground font-body">
          <summary className="cursor-pointer font-heading font-semibold text-ink text-[13px]">✓ 行前清单</summary>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {checklist.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
