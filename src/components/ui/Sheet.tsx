import { useEffect, useRef, useState, useCallback } from 'react'
import clsx from 'clsx'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  fullScreenOnMobile?: boolean
  className?: string
  contentClassName?: string
}

export function Sheet({
  open,
  onClose,
  children,
  title,
  header,
  footer,
  fullScreenOnMobile = false,
  className,
  contentClassName,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [sheetHeight, setSheetHeight] = useState<number | undefined>(undefined)

  // Measure content and cap at 70dvh
  const measureHeight = useCallback(() => {
    if (!sheetRef.current) return
    const vh70 = window.innerHeight * 0.7
    // Temporarily remove maxHeight to measure natural content height
    const el = sheetRef.current
    const prev = el.style.maxHeight
    el.style.maxHeight = 'none'
    el.style.height = 'auto'
    const naturalH = el.scrollHeight
    el.style.maxHeight = prev
    el.style.height = ''
    // Cap at 70dvh
    const capped = Math.min(naturalH, vh70)
    // Only set if footer exists and content overflows, otherwise let it be natural
    if (footer && naturalH > vh70) {
      setSheetHeight(capped)
    } else {
      setSheetHeight(undefined)
    }
  }, [footer])

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

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mounted])

  // Tabbar visibility — tied to `open` so it reappears immediately when closing
  useEffect(() => {
    if (open) {
      document.body.classList.add('sheet-open')
    } else {
      document.body.classList.remove('sheet-open')
    }
  }, [open])

  // Measure after mount and when content changes
  useEffect(() => {
    if (open && footer) {
      // Use requestAnimationFrame to ensure DOM is rendered
      const raf = requestAnimationFrame(() => measureHeight())
      return () => cancelAnimationFrame(raf)
    }
  }, [open, footer, children, measureHeight])

  if (!mounted) return null

  const isFullScreen = fullScreenOnMobile

  return (
    <div className="fixed inset-0 z-[1100]">
      {/* Backdrop */}
      <div
        className={clsx(
          'absolute inset-0 transition-opacity duration-250',
          open ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={sheetRef}
        className={clsx(
          'absolute bottom-0 left-0 right-0 w-full md:mx-auto md:max-w-[480px]',
          'flex flex-col',
          'transition-[transform,opacity] duration-250 ease-out',
          open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
          isFullScreen
            ? 'rounded-t-2xl md:rounded-2xl'
            : 'rounded-t-2xl md:rounded-2xl',
          className,
        )}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: isFullScreen ? '16px 16px 0 0' : undefined,
          // Full screen: use dvh. Non-fullscreen: use JS-measured height or natural
          height: isFullScreen ? 'calc(100dvh + 0px)' : sheetHeight ? `${sheetHeight}px` : undefined,
          maxHeight: isFullScreen ? undefined : sheetHeight ? undefined : '70dvh',
          paddingBottom: 'var(--sab, 0px)',
          overflow: 'hidden',
        }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2.5 pb-1.5 md:hidden flex-shrink-0">
          <div style={{ width: 144, height: 4, borderRadius: 9999, background: 'rgba(0,0,0,0.12)' }} />
        </div>

        {/* Header / Title — outside scroll */}
        {header}
        {title && !header && (
          <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <span className="w-9 h-9" />
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600, lineHeight: '20px', color: 'var(--foreground)' }}>{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[rgba(0,0,0,0.04)]"
              style={{ color: 'var(--muted)', fontSize: 20, lineHeight: 1 }}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className={clsx('flex-1 overflow-y-auto min-h-0', contentClassName)}>
          {children}
        </div>

        {/* Footer — outside scroll, always visible */}
        {footer && (
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '0.5px solid var(--border)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export type { SheetProps }
