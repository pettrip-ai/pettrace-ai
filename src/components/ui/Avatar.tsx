import { forwardRef, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'default' | 'gradient'

const sizeCls: Record<Size, string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-14 h-14 text-xl',
}

const variantCls: Record<Variant, string> = {
  default: 'bg-coral-100 text-primary',
  gradient: 'bg-gradient-to-br from-coral-100 to-coral-300 text-primary-deep',
}

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: Size
  name?: string
  src?: string
  variant?: Variant
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  { size = 'md', name, src, variant = 'gradient', className, ...rest },
  ref,
) {
  const initial = name ? name.trim().slice(0, 1) : '🐾'
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold overflow-hidden',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  )
})
