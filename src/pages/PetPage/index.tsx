import { useMemo, useState } from 'react'
import {
  PlusCircle, ChevronRight, CalendarDays, AlertCircle, Clock, Plus,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { Avatar } from '../../components/ui/Avatar'
import type { Pet } from '../../data/types'
import { KIND_LABEL, SIZE_LABEL, CARE_META, nextISO, daysBetween, dateLabel, statusChip } from './constants'
import { PetSheet } from './components/PetSheet'
import { CareAddSheet } from './components/CareAddSheet'
import { useToast } from './hooks'
import type { PetSaveInput } from './constants'

function calcAge(birthday?: string) {
  if (!birthday) return null
  const b = new Date(birthday)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - b.getFullYear()
  let months = now.getMonth() - b.getMonth()
  if (now.getDate() < b.getDate()) months -= 1
  if (months < 0) { years -= 1; months += 12 }
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁`
}

function upcomingCare(petId: string, careTasks: ReturnType<typeof useStore.getState>['careTasks']) {
  const tasks = careTasks.filter((t) => t.petId === petId && t.intervalDays > 0)
  if (tasks.length === 0) return null
  const list = tasks
    .map((t) => ({ t, next: nextISO(t), diff: daysBetween(new Date(), new Date(nextISO(t))) }))
    .sort((a, b) => a.diff - b.diff)
  const first = list[0]
  if (!first) return null
  return { ...first, s: statusChip(first.t) }
}

function PetListItem({
  pet,
  onClick,
  care,
}: {
  pet: Pet
  onClick: () => void
  care: ReturnType<typeof upcomingCare>
}) {
  const ageText = calcAge(pet.birthday)
  const breedText = pet.breed
    ? (pet.kind === 'dog' || pet.kind === 'cat') ? pet.breed : `${KIND_LABEL[pet.kind]} ${pet.breed}`
    : KIND_LABEL[pet.kind]
  const sizeLabel = pet.size ? SIZE_LABEL[pet.size] : undefined

  const renderReminder = () => {
    if (!care) return null
    if (care.diff < 0 || care.diff <= 14) {
      return (
        <>
          <AlertCircle size={14} className="text-honey shrink-0" />
          <span className="text-[12px] text-honey truncate">
            {CARE_META[care.t.type].label}
            {care.diff < 0 ? ` · 逾期${-care.diff}天` : care.diff === 0 ? ' · 今天到期' : ` · 还剩${care.diff}天`}
          </span>
        </>
      )
    }
    return (
      <>
        <Clock size={14} className="text-accent shrink-0" />
        <span className="text-[12px] text-accent truncate">下次 {dateLabel(care.next)}</span>
      </>
    )
  }

  return (
    <button onClick={onClick} className="group card w-full text-left flex items-center gap-3 p-3.5 active:scale-[0.995]">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--pettrace-coral-100)] to-[var(--pettrace-coral-200)] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(247,107,122,0.15)] font-bold text-[18px] text-[var(--primary)]">
        <Avatar size="sm" name={pet.name} variant="gradient" className="!w-full !h-full text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display font-bold text-[16px] leading-[1.4] text-ink truncate">{pet.name}</h4>
          <ChevronRight size={18} className="text-muted shrink-0 group-hover:text-ink" />
        </div>
        <div className="flex items-center gap-2 mt-1 text-[13px] text-muted flex-wrap">
          <span className="truncate">{breedText}</span>
          {sizeLabel && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-secondary/70 text-secondary-foreground text-[11px] px-2 py-0.5 font-medium">{sizeLabel}</span>
          )}
          <span className="shrink-0 h-1 w-1 rounded-full bg-muted/60" />
          <span className="truncate">{ageText ?? '未填生日'}</span>
        </div>
        {care && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-rule/50">
            {renderReminder()}
          </div>
        )}
      </div>
    </button>
  )
}

export default function PetPage() {
  const pets = useStore((s) => s.pets)
  const careTasks = useStore((s) => s.careTasks)

  const [editOpen, setEditOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const { show } = useToast()

  const addPet = useStore((s) => s.addPet)
  const updatePet = useStore((s) => s.updatePet)

  const handleOpenAdd = () => { setEditingPet(null); setEditOpen(true) }
  const handleOpenEdit = (p: Pet) => { setEditingPet(p); setEditOpen(true) }

  const handleSavePet = (p: PetSaveInput) => {
    if (p.id) {
      updatePet(p.id, { name: p.name, kind: p.kind, breed: p.breed, size: p.size, traits: p.traits, birthday: p.birthday, weightKg: p.weightKg, notes: p.notes })
    } else {
      addPet({ name: p.name, kind: p.kind, breed: p.breed, size: p.size, traits: p.traits, birthday: p.birthday, weightKg: p.weightKg, notes: p.notes })
    }
    setEditOpen(false)
    show('已保存', { kind: 'ok' })
  }

  const sorted = useMemo(() => {
    const mainId = pets[0]?.id
    return [...pets].sort((a, b) => {
      if (a.id === mainId) return -1
      if (b.id === mainId) return 1
      return 0
    })
  }, [pets])

  const petListWithCare = useMemo(() => {
    return sorted.map((p) => ({ pet: p, care: upcomingCare(p.id, careTasks) }))
  }, [sorted, careTasks])

  const reminders = useMemo(() => {
    if (!pets[0]) return []
    const mainId = pets[0].id
    return careTasks
      .filter((t) => t.petId === mainId && t.intervalDays > 0)
      .map((t) => ({ t, next: nextISO(t) }))
      .map((x) => ({ ...x, diff: daysBetween(new Date(), new Date(x.next)), s: statusChip(x.t) }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 4)
  }, [careTasks, pets])

  return (
    <div className="pet-bg min-h-full h-full w-full overflow-y-auto px-4 md:px-5 py-4 md:py-5 pb-28">
      <div>
        <h2 className="font-display font-extrabold text-2xl md:text-[22px] tracking-tight text-ink">宠物档案</h2>
        <p className="text-xs md:text-[13px] text-muted mt-1">管理你的毛孩子</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {petListWithCare.map(({ pet, care }) => (
          <PetListItem key={pet.id} pet={pet} care={care} onClick={() => handleOpenEdit(pet)} />
        ))}

        <button
          onClick={handleOpenAdd}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted py-4 text-sm font-medium active:scale-[0.98]"
        >
          <PlusCircle size={22} />
          添加新宠物
        </button>
      </div>

      {pets[0] && reminders.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={13} className="text-primary" />
            <span className="text-[11px] text-muted uppercase tracking-wider font-semibold">护理提醒 · {pets[0].name}</span>
          </div>
          <div className="card p-0 overflow-hidden">
            {reminders.map(({ t, next, s }) => {
              const dateStr = dateLabel(next)
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-rule/50 last:border-b-0">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-coral-50 flex items-center justify-center text-primary">
                    <CalendarDays size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-ink font-medium truncate">{dateStr}</div>
                    <div className="text-[12px] text-muted truncate">{CARE_META[t.type].label}</div>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono rounded-full px-2 py-0.5 bg-outline-variant text-ink">{s.text}</span>
                </div>
              )
            })}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] text-muted active:scale-[0.98] hover:bg-surface"
          >
            <Plus size={14} /> 添加护理事项
          </button>
        </div>
      )}

      <PetSheet open={editOpen} onClose={() => setEditOpen(false)} initial={editingPet} onSave={handleSavePet} />
      <CareAddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        defaultPetId={pets[0]?.id || 'pet-default'}
        pets={pets}
        onSave={() => { show('已添加', { kind: 'ok' }) }}
      />
    </div>
  )
}
