import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: LucideIcon
  trailingIcon?: LucideIcon
  error?: boolean
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leadingIcon: LeadingIcon, trailingIcon: TrailingIcon, error, hint, className, id, type = 'text', ...rest },
  ref,
) {
  const autoId = id ?? rest.name
  return (
    <div className="w-full">
      <div className="relative">
        {LeadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <LeadingIcon size={16} strokeWidth={1.8} />
          </span>
        )}
        <input
          ref={ref}
          id={autoId}
          type={type}
          className={clsx(
            'w-full px-3 py-2 bg-surface/80 border rounded-xl text-sm transition placeholder:text-muted',
            'focus:outline-none focus:ring-1 focus:border-primary',
            LeadingIcon ? 'pl-9' : '',
            TrailingIcon ? 'pr-9' : '',
            error ? 'border-error focus:ring-error' : 'border-rule focus:ring-primary',
            className,
          )}
          {...rest}
        />
        {TrailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <TrailingIcon size={16} strokeWidth={1.8} />
          </span>
        )}
      </div>
      {hint && (
        <p className={clsx('mt-1 text-[11px]', error ? 'text-error' : 'text-muted')}>{hint}</p>
      )}
    </div>
  )
})
