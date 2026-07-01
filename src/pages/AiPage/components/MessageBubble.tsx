import { Dog, UserCircle } from 'lucide-react'

interface Props {
  role: 'user' | 'assistant'
  content: string
  showPetLine?: boolean
  petLineText?: string
  typewriter?: boolean
}

export function MessageBubble({
  role,
  content,
  showPetLine,
  petLineText,
}: Props) {
  if (role === 'user') {
    return (
      <div className="flex gap-2 items-start justify-end">
        <div
          className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-primary to-coral-600 text-primary-fg font-body"
          style={{ boxShadow: '0 4px 14px rgba(247,107,122,0.22)' }}
        >
          {showPetLine && petLineText && (
            <div className="text-[10px] opacity-75 mb-0.5 font-body">{petLineText}</div>
          )}
          <div className="whitespace-pre-wrap text-[14px] md:text-[15px] leading-relaxed break-words">
            {content}
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-primary-fg bg-gradient-to-br from-primary to-coral-600"
          style={{ boxShadow: '0 2px 8px rgba(247,107,122,0.18)' }}
        >
          <UserCircle size={16} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-primary bg-gradient-to-br from-coral-100 to-coral-200"
        style={{ boxShadow: '0 2px 8px rgba(247,107,122,0.14)' }}
      >
        <Dog size={16} />
      </div>
      <div className="pet-card max-w-[92%] md:max-w-[90%] rounded-tl-sm">
        <div className="whitespace-pre-wrap text-[14px] md:text-[15px] leading-relaxed text-ink font-body break-words">
          {content}
        </div>
      </div>
    </div>
  )
}
