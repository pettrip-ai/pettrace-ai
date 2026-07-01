import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Variant = 'default' | 'soft'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  hover?: boolean
}

const variantCls: Record<Variant, string> = {
  default: 'bg-surface/80 backdrop-blur-xl border border-rule/30 shadow-card',
  soft: 'bg-surface/55 backdrop-blur-lg border border-outline-variant/40 shadow-soft',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', hover, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-xl',
        variantCls[variant],
        hover && 'hover:shadow-pop transition-shadow',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})
