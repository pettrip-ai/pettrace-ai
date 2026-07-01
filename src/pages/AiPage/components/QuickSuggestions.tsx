import { Sparkles } from 'lucide-react'

interface Props {
  suggestions: string[]
  onPick: (s: string) => void
}

export function QuickSuggestions({ suggestions, onPick }: Props) {
  return (
    <div className="pt-4 pb-4">
      <div className="text-center text-sm text-muted-foreground mb-4 font-body">
        <Sparkles className="inline-block mr-1 -mt-1 text-primary" size={14} />
        试试让 AI 帮你规划
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="pet-pill-secondary hover:bg-coral-100 hover:text-ink transition active:scale-[0.98]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
