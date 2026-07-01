import { Edit, Trash2 } from 'lucide-react'
import { Avatar } from '../../../components/ui/Avatar'
import type { Pet } from '../../../data/types'
import { KIND_LABEL, SIZE_LABEL, rulesForSize } from '../constants'

export function PetCard({
  pet,
  onEdit,
  onRemove,
}: {
  pet: Pet
  onEdit: () => void
  onRemove: () => void
}) {
  const sizeLabel = pet.size ? SIZE_LABEL[pet.size] : undefined
  const rules = rulesForSize(pet.size)

  return (
    <div className="rounded-2xl bg-surface border border-rule p-3 md:p-4">
      <div className="flex items-start gap-3">
        <Avatar size="md" name={pet.name} variant="gradient" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink">{pet.name}</span>
            <span className="text-xs text-muted">· {KIND_LABEL[pet.kind]}{pet.breed ? ` · ${pet.breed}` : ''}</span>
            {sizeLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-rule bg-surface text-[11px] text-ink font-medium">
                {sizeLabel}
              </span>
            )}
            <button
              onClick={onEdit}
              className="ml-auto p-1.5 rounded-md text-muted hover:text-ink hover:bg-outline-variant"
              title="编辑"
              aria-label="编辑"
            >
              <Edit size={14} />
            </button>
          </div>
          {pet.traits && pet.traits.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1 flex-wrap">
              {pet.traits.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-outline-variant text-[11px] text-ink"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
            {pet.birthday ? <span>🎂 {pet.birthday}</span> : null}
            {typeof pet.weightKg === 'number' ? <span>⚖ {pet.weightKg} kg</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-3 md:mt-4 grid md:grid-cols-2 gap-2 md:gap-3">
        <div className="rounded-xl bg-surface-dim border border-rule p-3">
          <div className="text-xs text-muted mb-1.5">✅ 适合进入的场景</div>
          <ul className="space-y-1">
            {rules.good.map((r) => (
              <li key={r} className="text-[12px] md:text-xs text-ink leading-relaxed">· {r}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-surface-dim border border-rule p-3">
          <div className="text-xs text-muted mb-1.5">⚠️ 不适合的场景</div>
          <ul className="space-y-1">
            {rules.bad.map((r) => (
              <li key={r} className="text-[12px] md:text-xs text-ink leading-relaxed">· {r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-2 md:mt-3 flex items-center justify-end">
        <button
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-error"
          title="删除"
        >
          <Trash2 size={12} /> 删除
        </button>
      </div>
    </div>
  )
}
