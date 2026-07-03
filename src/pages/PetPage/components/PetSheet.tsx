import { useEffect, useState } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import { Sheet } from '../../../components/ui/Sheet'
import { Chip } from '../../../components/ui/Chip'
import type { Pet } from '../../../data/types'
import { KIND_OPTIONS, SIZE_OPTIONS, TRAIT_OPTIONS } from '../constants'
import type { Kind, PetSaveInput } from '../constants'

export interface PetSheetProps {
  open: boolean
  onClose: () => void
  initial: Pet | null
  onSave: (p: PetSaveInput) => void
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultPetBirthday(reference = new Date()) {
  const date = new Date(reference)
  date.setFullYear(date.getFullYear() - 3)
  return toDateInputValue(date)
}

function getMaxPetBirthday(reference = new Date()) {
  return toDateInputValue(reference)
}

export function PetSheet({ open, onClose, initial, onSave }: PetSheetProps) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name || '')
  const [kind, setKind] = useState<Kind>(initial?.kind || 'dog')
  const [breed, setBreed] = useState(initial?.breed || '')
  const [size, setSize] = useState<Pet['size']>(initial?.size)
  const [traits, setTraits] = useState<string[]>(initial?.traits || [])
  const [birthday, setBirthday] = useState(() => initial?.birthday || getDefaultPetBirthday())
  const [weight, setWeight] = useState<string>(initial?.weightKg ? String(initial.weightKg) : '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [err, setErr] = useState('')
  const maxBirthday = getMaxPetBirthday()

  useEffect(() => {
    if (!open) return
    setName(initial?.name || '')
    setKind(initial?.kind || 'dog')
    setBreed(initial?.breed || '')
    setSize(initial?.size)
    setTraits(initial?.traits || [])
    setBirthday(initial?.birthday || getDefaultPetBirthday())
    setWeight(initial?.weightKg ? String(initial.weightKg) : '')
    setNotes(initial?.notes || '')
    setErr('')
  }, [open, initial])

  const toggleTrait = (t: string) => {
    setTraits((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setErr('名字必填')
      return
    }
    const weightKg = weight ? Number(weight) : undefined
    if (weight && (Number.isNaN(weightKg as number) || (weightKg as number) <= 0)) {
      setErr('体重请填大于 0 的数字')
      return
    }
    onSave({
      id: initial?.id,
      name: trimmed,
      kind,
      breed: breed.trim() || undefined,
      size,
      traits,
      birthday: birthday || undefined,
      weightKg,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? '编辑宠物' : '新增宠物'}
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
            className="flex-1 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white transition"
            style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-2)' }}
          >
            <Save size={14} style={{ marginRight: 4 }} /> 保存
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-4">
        <div>
          <label className="text-xs text-muted">名字 <span className="text-error">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：豆豆"
            className="mt-1 w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted">品种</label>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder="金毛 / 英短..."
              className="mt-1 w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted">种类</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
              className="mt-1 w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted">体型</label>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {SIZE_OPTIONS.map((s) => {
              const active = size === s.value
              return (
                <Chip
                  key={s.value}
                  active={active}
                  onClick={() => setSize(s.value)}
                >
                  {s.label}
                </Chip>
              )
            })}
            <button
              onClick={() => setSize(undefined)}
              className="px-3 py-1.5 rounded-full border border-rule text-xs text-muted"
            >
              不限
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted">性格标签（可多选）</label>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {TRAIT_OPTIONS.map((t) => {
              const active = traits.includes(t)
              return (
                <Chip
                  key={t}
                  active={active}
                  onClick={() => toggleTrait(t)}
                >
                  {t}
                </Chip>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted">生日</label>
            <input
              type="date"
              value={birthday}
              max={maxBirthday}
              aria-label="宠物生日"
              onChange={(e) => setBirthday(e.target.value)}
              className="mt-1 w-full h-11 px-3 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted">体重 (kg)</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="28"
              className="mt-1 w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted">备注</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="比如：怕雷声、喜欢玩水..."
            className="mt-1 w-full px-3 py-2 bg-bg border border-rule rounded-md text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        {err && (
          <div className="text-xs text-error inline-flex items-center gap-1">
            <AlertTriangle size={12} /> {err}
          </div>
        )}
      </div>
    </Sheet>
  )
}
