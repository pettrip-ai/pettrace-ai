import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Icon } from './Icon'

export interface ActionItem {
  id: string
  label: string
  subtitle?: string
  icon?: string
  /** Controls text color; also affects icon container background & icon color. */
  variant?: 'default' | 'destructive' | 'primary' | 'disabled'
  iconTheme?: 'coral' | 'mint' | 'honey'
  onPress?: () => void
}

export interface ActionSection {
  id?: string
  title?: string
  items: ActionItem[]
}

export interface ActionSheetProps {
  open: boolean
  onClose: () => void
  sections?: ActionSection[]
  title?: string
  description?: string
  cancelLabel?: string
  actionSheetProps?: {
    title?: string
    description?: string
    cancelText?: string
    actions?: {
      label: string
      variant?: 'default' | 'primary' | 'destructive'
      icon?: string
      iconTheme?: 'coral' | 'mint' | 'honey'
      onClick?: () => void
    }[]
  }
}

/* ---------- helpers ---------- */

const iconThemeMap: Record<string, { bg: string; icon: string }> = {
  coral:  { bg: 'var(--pettrace-coral-50)',  icon: 'var(--primary)' },
  mint:   { bg: 'var(--pettrace-mint-50)',   icon: 'var(--accent)' },
  honey:  { bg: 'var(--pettrace-honey-50)',  icon: 'var(--warning)' },
}

const variantStyle = (v: ActionItem['variant']) => {
  switch (v) {
    case 'destructive':
      return 'text-[color:var(--error)]'
    case 'primary':
      return 'text-[color:var(--primary)] font-semibold'
    case 'disabled':
      return 'opacity-40 cursor-not-allowed'
    default:
      return 'text-[color:var(--foreground)]'
  }
}

/* ---------- component ---------- */

export function ActionSheet({
  open,
  onClose,
  sections: propSections,
  title,
  description,
  cancelLabel = '取消',
  actionSheetProps,
}: ActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
    else {
      const t = setTimeout(() => setMounted(false), 260)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  /* Resolve sections from either propSections or actionSheetProps */
  const sections: ActionSection[] = propSections?.length
    ? propSections
    : actionSheetProps?.actions?.length
      ? [{
          title: actionSheetProps.title,
          items: actionSheetProps.actions.map((a, idx) => ({
            id: `a-${idx}`,
            label: a.label,
            icon: a.icon,
            iconTheme: a.iconTheme,
            variant: a.variant,
            onPress: a.onClick,
          })),
        }]
      : []

  /* Title / description — actionSheetProps takes precedence */
  const displayTitle = actionSheetProps?.title ?? title
  const displayDesc  = actionSheetProps?.description ?? description

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end">
      {/* Overlay */}
      <div
        className={clsx(
          'absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-250',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className={clsx(
          'relative mx-3 md:mx-auto md:max-w-[420px] mb-[calc(10px+var(--sab,0px))] rounded-t-2xl overflow-hidden',
          'bg-[rgba(255,255,255,0.85)] backdrop-blur-[20px]',
          'shadow-float transition-[transform,opacity] duration-250 ease-snappy',
          open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        )}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1.5">
          <div className="w-36 h-1 rounded-full bg-black/12" />
        </div>

        {/* Optional title */}
        {displayTitle && (
          <div className="px-5 pt-2 pb-1 text-center">
            <p className="text-[15px] font-semibold leading-5 text-[color:var(--foreground)]">
              {displayTitle}
            </p>
          </div>
        )}

        {/* Optional description */}
        {displayDesc && (
          <div className="px-5 pb-3 text-center">
            <p className="text-[13px] leading-5 text-[color:var(--muted)]">
              {displayDesc}
            </p>
          </div>
        )}

        {/* Action rows — all inside one panel, separated by hairline borders */}
        {sections.map((sec, si) => (
          <div key={sec.id ?? si}>
            {sec.title && (
              <div className="px-4 pt-3 pb-1.5">
                <p className="text-[12px] leading-4 text-[color:var(--muted-foreground)] font-medium uppercase tracking-wide">
                  {sec.title}
                </p>
              </div>
            )}
            {sec.items.map((it, idx) => {
              const isLast = idx === sec.items.length - 1
              const theme = it.iconTheme ?? 'coral'
              const colors = iconThemeMap[theme] ?? iconThemeMap.coral

              return (
                <button
                  key={it.id}
                  type="button"
                  disabled={it.variant === 'disabled'}
                  onClick={() => {
                    if (it.variant === 'disabled') return
                    it.onPress?.()
                    onClose()
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-[14px] text-left transition-colors',
                    'active:bg-[color:var(--pettrace-coral-50)]',
                    isLast ? '' : 'border-b-[0.5px] border-solid border-[color:var(--border)]',
                    variantStyle(it.variant),
                  )}
                >
                  {it.icon && (
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: it.variant === 'destructive'
                          ? 'var(--pettrace-coral-50)'
                          : colors.bg,
                        color: it.variant === 'destructive'
                          ? 'var(--error)'
                          : colors.icon,
                      }}
                    >
                      <Icon name={it.icon} size={18} />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium leading-5 truncate">
                      {it.label}
                    </p>
                    {it.subtitle && (
                      <p className="text-[12px] leading-4 text-[color:var(--muted-foreground)] mt-0.5 truncate">
                        {it.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        {/* Divider above cancel */}
        <div className="h-[0.5px] bg-[color:var(--border)] mx-0" />

        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full flex items-center justify-center py-3.5 bg-[color:var(--surface)] text-[15px] font-semibold leading-5 text-[color:var(--primary)] active:bg-[color:var(--pettrace-coral-50)] transition-colors"
        >
          {actionSheetProps?.cancelText ?? cancelLabel}
        </button>
      </div>
    </div>
  )
}
