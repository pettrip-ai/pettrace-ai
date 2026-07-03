import { createContext, useCallback, useContext } from 'react'

export type ToastKind = 'info' | 'success' | 'error' | 'warning' | 'ok' | 'warn'

export interface ToastCtx {
  show: (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}

export function useSafeToast(): ToastCtx {
  const value = useContext(ToastContext)
  const show = useCallback(
    (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => {
      if (value) value.show(message, opts)
    },
    [value],
  )
  return {
    show,
    dismiss: value?.dismiss ?? (() => {}),
  }
}
