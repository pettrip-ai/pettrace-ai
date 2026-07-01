import { Trash2 } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import type { CareTask } from '../../../data/types'
import { CARE_META, daysBetween, dateLabel, nextISO, statusChip } from '../constants'

export interface PetCareListProps {
  tasks: CareTask[]
  onUpdateDate: (taskId: string, iso: string) => void
  onRemove: (taskId: string) => void
}

function chipToBadge(s: ReturnType<typeof statusChip>) {
  if (s.text.includes('逾期')) return { color: 'error' as const, text: s.text }
  if (s.text.includes('今天到期') || s.text.includes('即将到期')) return { color: 'honey' as const, text: s.text }
  if (s.text.includes('无需担心')) return { color: 'success' as const, text: s.text }
  return { color: 'gray' as const, text: s.text }
}

export function PetCareList({ tasks, onUpdateDate, onRemove }: PetCareListProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted">
        还没有护理日程，点右上角"添加"记录第一次就好。
      </div>
    )
  }

  return (
    <div className="mt-3 divide-y divide-rule/50">
      {tasks.map((t) => {
        const s = statusChip(t)
        const next = nextISO(t)
        const nextDiff = t.intervalDays > 0 ? daysBetween(new Date(), new Date(next)) : null
        const badge = chipToBadge(s)
        return (
          <div key={t.id} className="py-3 flex items-center gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink font-medium truncate">
                {CARE_META[t.type].label}
              </div>
              <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[11px] text-muted">
                <span>上次 <input
                  type="date"
                  value={dateLabel(t.lastDoneISO)}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    const iso = new Date(v + 'T12:00:00').toISOString()
                    onUpdateDate(t.id, iso)
                  }}
                  className="bg-transparent underline hover:text-primary cursor-pointer w-[120px] md:w-auto"
                /></span>
                {t.intervalDays > 0 ? (
                  <span>· 下次 {dateLabel(next)}{nextDiff !== null && (
                    nextDiff < 0
                      ? ` · 逾期 ${-nextDiff} 天`
                      : nextDiff === 0
                        ? ` · 今天`
                        : ` · ${nextDiff} 天后`
                  )}</span>
                ) : (
                  <span>· 未设下次</span>
                )}
              </div>
            </div>
            <Badge color={badge.color}>{badge.text}</Badge>
            <button
              onClick={() => onRemove(t.id)}
              className="p-1.5 rounded-md text-muted hover:text-error hover:bg-error/10 shrink-0"
              aria-label="删除"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
