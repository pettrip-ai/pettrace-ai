import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Sheet } from '../../../components/ui/Sheet'
import type { Pet, CareTask, CareTaskType } from '../../../data/types'
import { CARE_META } from '../constants'

export interface CareAddSheetProps {
  open: boolean
  onClose: () => void
  defaultPetId: string
  pets: Pet[]
  onSave: (t: Omit<CareTask, 'id'>) => void
}

export function CareAddSheet({ open, onClose, defaultPetId, pets, onSave }: CareAddSheetProps) {
  const [petId, setPetId] = useState(defaultPetId)
  const [type, setType] = useState<CareTaskType>('vaccine_combined')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [intervalDays, setIntervalDays] = useState<number>(CARE_META.vaccine_combined.defaultIntervalDays)

  useEffect(() => {
    if (!open) return
    setPetId(defaultPetId)
    setType('vaccine_combined')
    setDate(new Date().toISOString().slice(0, 10))
    setIntervalDays(CARE_META.vaccine_combined.defaultIntervalDays)
  }, [open, defaultPetId])

  useEffect(() => {
    if (!open) return
    setIntervalDays(CARE_META[type].defaultIntervalDays)
  }, [type, open])

  const submit = () => {
    if (!petId || !date) return
    const iso = new Date(date + 'T12:00:00').toISOString()
    onSave({
      petId,
      type,
      lastDoneISO: iso,
      intervalDays: Number.isFinite(intervalDays) ? Math.max(0, Math.floor(intervalDays)) : 0,
    })
    onClose()
  }

  const rows: { label: string; icon?: string; hint?: React.ReactNode }[] = []
  if (pets.length > 1) rows.push({ label: '宠物', hint: (
    <select
      value={petId}
      onChange={(e) => setPetId(e.target.value)}
      className="w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {pets.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )})
  rows.push({ label: '类型', hint: (
    <select
      value={type}
      onChange={(e) => setType(e.target.value as CareTaskType)}
      className="w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {(Object.keys(CARE_META) as CareTaskType[]).map((k) => (
        <option key={k} value={k}>{CARE_META[k].label}</option>
      ))}
    </select>
  )})
  rows.push({ label: '上次日期', hint: (
    <input
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
    />
  )})
  rows.push({ label: '间隔天数', hint: (
    <>
      <input
        type="number"
        min={0}
        value={intervalDays}
        onChange={(e) => setIntervalDays(Number(e.target.value))}
        className="w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <div className="text-[11px] text-muted mt-1">
        建议：联苗 365 天 · 狂犬 1095 天 · 驱虫 90 天 · 洗澡 14 天 · 体检 180 天
      </div>
    </>
  )})

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="新增护理"
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--muted)' }}
          >
            取消
          </button>
          <button
            onClick={submit}
            disabled={!petId || !date}
            className="flex-1 h-11 rounded-full flex items-center justify-center text-sm font-semibold transition"
            style={{
              background: petId && date ? 'var(--primary)' : 'var(--muted)',
              color: 'var(--primary-foreground)',
              boxShadow: petId && date ? 'var(--shadow-2)' : 'none',
              opacity: petId && date ? 1 : 0.5,
              cursor: petId && date ? 'pointer' : 'not-allowed',
            }}
          >
            <Save size={14} style={{ marginRight: 4 }} /> 保存
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-4">
        {rows.map((r, i) => (
          <div key={i}>
            <label className="text-xs text-muted">{r.label}</label>
            <div className="mt-1">{r.hint}</div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
