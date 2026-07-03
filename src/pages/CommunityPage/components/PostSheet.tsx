import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Coffee, TreePine, ShoppingBag, MessageCircle, CheckCircle } from 'lucide-react'
import { Sheet } from '../../../components/ui/Sheet'
import { useStore } from '../../../store/useStore'
import { CITY_NAMES } from '../constants'
import type { CityId } from '../../../store/useStore'
import type { FeedType } from '../../../data/types'

export interface PostSheetProps {
  open: boolean
  onClose: () => void
  city: CityId
  placesById: Record<string, { id: string; name: string; city: CityId } | undefined>
  onSuccess?: () => void
}

/** Step 1: Type selection rows matching design action-sheet.html */
const TYPE_ROWS: {
  key: FeedType
  icon: React.ReactNode
  label: string
  desc: string
  iconBg: string
  iconColor: string
}[] = [
  {
    key: '打卡',
    icon: <Coffee size={18} />,
    label: '打卡',
    desc: '分享到访体验',
    iconBg: 'var(--pettrace-coral-50, #fff1f2)',
    iconColor: 'var(--primary)',
  },
  {
    key: '游记',
    icon: <TreePine size={18} />,
    label: '游记',
    desc: '记录行程故事',
    iconBg: 'var(--pettrace-mint-50, #eefbf4)',
    iconColor: 'var(--accent)',
  },
  {
    key: '避雷',
    icon: <ShoppingBag size={18} />,
    label: '避雷',
    desc: '提醒其他宠主',
    iconBg: 'var(--pettrace-error-50, #fef2f2)',
    iconColor: 'var(--error)',
  },
  {
    key: '经验分享',
    icon: <MessageCircle size={18} />,
    label: '经验分享',
    desc: '养宠心得技巧',
    iconBg: 'var(--pettrace-honey-50, #fffbeb)',
    iconColor: 'var(--warning)',
  },
]

export function PostSheet({ open, onClose, city, placesById, onSuccess }: PostSheetProps) {
  const addFeed = useStore((s) => s.addFeed)
  const verifyPlace = useStore((s) => s.verifyPlace)

  const currentCityPlaces = useMemo(() => {
    const out: { id: string; name: string; city: CityId }[] = []
    for (const p of Object.values(placesById)) {
      if (p && p.city === city) out.push(p)
    }
    return out
  }, [city, placesById])

  // Step 1: select type, Step 2: write content
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<FeedType>('打卡')
  const [placeId, setPlaceId] = useState<string>('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(1)
    setSelectedType('打卡')
    setPlaceId(currentCityPlaces[0]?.id || '')
    setText('')
  }, [open, currentCityPlaces])

  const handleTypeSelect = (type: FeedType) => {
    setSelectedType(type)
    setStep(2)
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || !placeId) return
    addFeed({
      placeId,
      type: selectedType,
      text: trimmed,
      byUser: '我',
      likes: 0,
      likedByMe: false,
    })
    if (selectedType === '打卡') {
      verifyPlace(placeId, 'good', '我')
    } else if (selectedType === '避雷') {
      verifyPlace(placeId, 'bad', '我')
    }
    onSuccess?.()
    onClose()
  }

  // Step 1: ActionSheet-style type selection
  if (step === 1) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="选择发布类型"
        footer={
          <button
            type="button"
            className="w-full h-11 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{
              color: 'var(--primary)',
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
            }}
            onClick={onClose}
          >
            取消
          </button>
        }
      >
        <div className="px-5 pt-2 pb-4">
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', paddingBottom: 14 }}>
            选择你要验证的地点类型
          </div>

          {/* Action Rows */}
          <div className="overflow-hidden rounded-xl border border-rule/60 bg-surface/70">
            {TYPE_ROWS.map((row, idx) => {
              const isLast = idx === TYPE_ROWS.length - 1
              return (
                <button
                  key={row.key}
                  type="button"
                  className="w-full min-h-[64px] flex items-center text-left active:bg-coral-50/60 transition"
                  style={{
                    gap: 12,
                    padding: '12px 14px',
                    borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
                  }}
                  onClick={() => handleTypeSelect(row.key)}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9999,
                      background: row.iconBg,
                    }}
                  >
                    <span style={{ color: row.iconColor }}>{row.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--foreground)' }}>{row.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1 }}>{row.desc}</div>
                  </div>
                  <CheckCircle size={18} style={{ color: 'var(--accent)', opacity: selectedType === row.key ? 1 : 0 }} />
                </button>
              )
            })}
          </div>
        </div>
      </Sheet>
    )
  }

  // Step 2: Write content form (compact, matching design style)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`发布${selectedType}`}
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(1)}
            className="flex-1 h-11 rounded-full flex items-center justify-center text-sm font-medium"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              color: 'var(--muted)',
            }}
          >
            返回
          </button>
          <button
            onClick={submit}
            disabled={!text.trim() || !placeId}
            className={clsx(
              'flex-1 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition',
              text.trim() && placeId
                ? 'text-white'
                : 'opacity-50 cursor-not-allowed',
            )}
            style={{
              background: text.trim() && placeId ? 'var(--primary)' : 'var(--muted)',
              color: 'var(--primary-foreground)',
              boxShadow: text.trim() && placeId ? 'var(--shadow-2)' : 'none',
            }}
          >
            发布
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-4">
        {/* Place selector */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>地点（{CITY_NAMES[city]}）</label>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-1"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              color: 'var(--foreground)',
              ['--tw-ring-color' as string]: 'var(--primary)',
            }}
          >
            {currentCityPlaces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {currentCityPlaces.length === 0 && <option value="">当前城市暂无可选地点</option>}
          </select>
        </div>

        {/* Textarea */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>验证内容</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="今天我也去了这家，带金毛室内坐不挤..."
            className="mt-1 w-full px-3 py-2 rounded-md text-sm resize-none focus:outline-none focus:ring-1"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              color: 'var(--foreground)',
              ['--tw-ring-color' as string]: 'var(--primary)',
            }}
          />
        </div>
      </div>
    </Sheet>
  )
}
