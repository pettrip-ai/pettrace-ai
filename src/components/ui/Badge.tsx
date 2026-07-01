import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Color = 'accent' | 'success' | 'honey' | 'error' | 'gray'

const colorCls: Record<Color, string> = {
  accent: 'bg-primary/15 text-primary-deep',
  success: 'bg-success/15 text-success',
  honey: 'bg-honey/15 text-honey-deep',
  error: 'bg-error/10 text-error',
  gray: 'bg-outline-variant/60 text-muted-fg',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: Color
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { color = 'accent', className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
        colorCls[color],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
})
