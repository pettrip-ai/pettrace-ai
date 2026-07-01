import { forwardRef, type ReactNode } from 'react'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leadingIcon?: LucideIcon
  trailingIcon?: LucideIcon
}

const sizeCls: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10',
}

const variantCls: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-coral-400 to-primary text-primary-fg shadow-primary-glow border border-transparent',
  secondary:
    'bg-surface/70 text-ink backdrop-blur border border-rule hover:bg-surface/90',
  ghost:
    'bg-transparent text-muted hover:text-foreground hover:bg-outline-variant/50 border border-transparent',
  danger:
    'bg-error hover:bg-red-700 text-white shadow-[0_6px_18px_rgba(239,68,68,0.28)] border border-transparent',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        'active:scale-[0.97] transition-transform duration-150',
        'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        sizeCls[size],
        variantCls[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {LeadingIcon && <LeadingIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={2} />}
      {children as ReactNode}
      {TrailingIcon && <TrailingIcon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={2} />}
    </button>
  )
})
