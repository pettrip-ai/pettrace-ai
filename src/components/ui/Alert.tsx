import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Icon, type IconLike } from './Icon'

export interface AlertButton {
  id: string
  label: string
  variant?: 'default' | 'primary' | 'destructive'
  onPress?: () => void
}

export interface AlertProps {
  open: boolean
  onClose?: () => void
  title?: string
  message?: string
  icon?: IconLike
  buttons?: AlertButton[]
  tone?: 'info' | 'success' | 'error' | 'warning'
}

const TONE = {
  info: {
    icon: 'info',
    iconBg: 'bg-[#ffe0e3]',
    iconColor: 'text-[color:var(--primary)]',
  },
  success: {
    icon: 'check-circle',
    iconBg: 'bg-[#eefbf4]',
    iconColor: 'text-[color:var(--accent)]',
  },
  error: {
    icon: 'alert-circle',
    iconBg: 'bg-[#fef2f2]',
    iconColor: 'text-[color:var(--error)]',
  },
  warning: {
    icon: 'alert-triangle',
    iconBg: 'bg-[#fffbeb]',
    iconColor: 'text-[color:var(--warning)]',
  },
} as const

export function Alert({
  open,
  onClose,
  title,
  message,
  icon,
  buttons,
  tone = 'info',
}: AlertProps) {
  const [mounted, setMounted] = useState(open)
  const activeTone = TONE[tone]

  useEffect(() => {
    if (open) setMounted(true)
    else {
      const t = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open || !buttons?.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, buttons, onClose])

  if (!mounted) return null

  const primaryBtn = buttons?.find((b) => b.variant === 'primary') ?? buttons?.[0]
  const otherBtns = buttons?.filter((b) => b !== primaryBtn) ?? []

  const variantClass = (v?: AlertButton['variant']) => {
    if (v === 'primary')
      return 'bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-semibold shadow-[var(--shadow-2)]'
    if (v === 'destructive')
      return 'text-[color:var(--error)]'
    return 'bg-[color:var(--surface)] text-[color:var(--muted)] border-[0.5px] border-[color:var(--border)]'
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center px-6">
      {/* Overlay */}
      <div
        className={clsx(
          'absolute inset-0 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        className={clsx(
          'relative w-full transition-[transform,opacity] duration-200',
          open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0',
        )}
        style={{
          maxWidth: 300,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-4)',
        }}
      >
        {/* Icon Area */}
        <div className="flex justify-center" style={{ paddingTop: 16 }}>
          <div
            className={clsx(
              'flex items-center justify-center',
              activeTone.iconBg,
              activeTone.iconColor,
            )}
            style={{ width: 48, height: 48, borderRadius: 9999 }}
          >
            <Icon name={(icon ?? activeTone.icon) as any} size={24} />
          </div>
        </div>

        {/* Title */}
        {title && (
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              textAlign: 'center',
              padding: '12px 20px 4px',
              color: 'var(--foreground)',
            }}
          >
            {title}
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--muted-foreground)',
              textAlign: 'center',
              padding: '0 20px 16px',
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}

        {/* Buttons */}
        {buttons && buttons.length > 0 && (
          <div className="flex" style={{ gap: 10, padding: '0 16px 16px' }}>
            {otherBtns.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  b.onPress?.()
                  if (b === primaryBtn) onClose?.()
                }}
                className={clsx(
                  'flex-1 flex items-center justify-center transition-colors cursor-pointer',
                  'font-medium',
                  variantClass(b.variant),
                )}
                style={{
                  height: 40,
                  borderRadius: 9999,
                  fontSize: 14,
                }}
              >
                {b.label}
              </button>
            ))}
            {primaryBtn && (
              <button
                key={primaryBtn.id}
                type="button"
                onClick={() => {
                  primaryBtn.onPress?.()
                  onClose?.()
                }}
                className={clsx(
                  'flex-1 flex items-center justify-center transition-colors cursor-pointer',
                  variantClass(primaryBtn.variant),
                )}
                style={{
                  height: 40,
                  borderRadius: 9999,
                  fontSize: 14,
                }}
              >
                {primaryBtn.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
