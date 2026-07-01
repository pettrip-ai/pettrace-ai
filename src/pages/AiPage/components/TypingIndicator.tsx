import { Dog } from 'lucide-react'

export function TypingIndicator({ indent = true }: { indent?: boolean }) {
  return (
    <div className={indent ? 'flex gap-2 items-start' : ''}>
      {indent && (
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-primary bg-gradient-to-br from-coral-100 to-coral-200"
          style={{ boxShadow: '0 2px 8px rgba(247,107,122,0.14)' }}
        >
          <Dog size={16} />
        </div>
      )}
      <div className="pet-card inline-flex items-center gap-1 h-[30px]">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}
