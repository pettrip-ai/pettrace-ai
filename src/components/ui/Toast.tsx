import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext, type ToastCtx, type ToastKind } from './toast-context'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
  title?: string
  duration?: number
}

const kindStyles: Record<ToastKind, { bg: string; fg: string; ring: string; hover: string; icon: string }> = {
  info: {
    bg: 'bg-[color:var(--pettrace-coral-50)]',
    fg: 'text-[color:var(--pettrace-coral-800)]',
    ring: 'border-[color:var(--pettrace-coral-300)]',
    hover: 'hover:bg-[color:var(--pettrace-coral-100)]',
    icon: 'info',
  },
  success: {
    bg: 'bg-[color:var(--pettrace-mint-50)]',
    fg: 'text-[color:var(--pettrace-mint-800)]',
    ring: 'border-[color:var(--pettrace-mint-300)]',
    hover: 'hover:bg-[color:var(--pettrace-mint-100)]',
    icon: 'check-circle',
  },
  error: {
    bg: 'bg-[color:var(--pettrace-error-50)]',
    fg: 'text-[color:var(--pettrace-error-800)]',
    ring: 'border-[color:var(--pettrace-error-300)]',
    hover: 'hover:bg-[color:var(--pettrace-error-100)]',
    icon: 'alert-circle',
  },
  warning: {
    bg: 'bg-[color:var(--pettrace-honey-50)]',
    fg: 'text-[color:var(--pettrace-honey-800)]',
    ring: 'border-[color:var(--pettrace-honey-300)]',
    hover: 'hover:bg-[color:var(--pettrace-honey-100)]',
    icon: 'alert-triangle',
  },
  ok: {
    bg: 'bg-[color:var(--pettrace-coral-50)]',
    fg: 'text-[color:var(--pettrace-coral-800)]',
    ring: 'border-[color:var(--pettrace-coral-300)]',
    hover: 'hover:bg-[color:var(--pettrace-coral-100)]',
    icon: 'check-circle',
  },
  warn: {
    bg: 'bg-[color:var(--pettrace-honey-50)]',
    fg: 'text-[color:var(--pettrace-honey-800)]',
    ring: 'border-[color:var(--pettrace-honey-300)]',
    hover: 'hover:bg-[color:var(--pettrace-honey-100)]',
    icon: 'alert-triangle',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const show = useCallback(
    (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => {
      const id = idRef.current++
      const kind = opts?.kind ?? 'info'
      const duration = opts?.duration ?? 2600
      setItems([{ id, kind, message, title: opts?.title, duration }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss],
  )

  const ctx = useMemo<ToastCtx>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed top-[88px] left-0 right-0 z-[1400] pointer-events-none flex flex-col items-center gap-2 px-4">
        {items.map((it) => {
          const s = kindStyles[it.kind]
          return (
            <div
              key={it.id}
              className={[
                'pointer-events-auto min-w-[260px] max-w-[calc(100%-32px)] md:max-w-[360px]',
                'rounded-2xl px-4 py-3 flex items-start gap-3 border shadow-pop',
                'backdrop-blur-xl animate-[toast-in_.220ms_ease-out]',
                s.bg,
                s.fg,
                s.ring,
              ].join(' ')}
            >
              <span className="shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {s.icon === 'info' && (<><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 15.5v1"/></>)}
                  {s.icon === 'check-circle' && (<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>)}
                  {s.icon === 'alert-circle' && (<><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 15.5v1"/></>)}
                  {s.icon === 'alert-triangle' && (<><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17.5v.5"/></>)}
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                {it.title && <p className="text-[14px] font-semibold leading-5 truncate">{it.title}</p>}
                <p className="text-[13px] leading-5 opacity-95 break-words">{it.message}</p>
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={() => dismiss(it.id)}
                className={[
                  'shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                  s.hover,
                ].join(' ')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
