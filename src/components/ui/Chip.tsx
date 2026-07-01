import { forwardRef } from 'react'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

export interface ChipProps extends React.ComponentPropsWithoutRef<'button'> {
  active?: boolean
  leadingIcon?: LucideIcon
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { active, leadingIcon: LeadingIcon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs md:text-sm font-medium border transition',
        active
          ? 'bg-primary text-primary-fg border-primary shadow-[0_4px_12px_rgba(247,107,122,0.22)]'
          : 'bg-surface/70 border-rule text-muted hover:text-foreground hover:bg-surface hover:border-rule',
        'active:scale-[0.97]',
        className,
      )}
      {...rest}
    >
      {LeadingIcon && <LeadingIcon size={12} strokeWidth={2.2} />}
      {children}
    </button>
  )
})
