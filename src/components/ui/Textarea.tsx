import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'w-full px-3 py-2 bg-surface/80 border border-rule rounded-xl text-sm transition placeholder:text-muted',
        'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
        'resize-none max-h-36',
        className,
      )}
      {...rest}
    />
  )
})
