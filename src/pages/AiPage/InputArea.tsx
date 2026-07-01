import { forwardRef } from 'react'
import { Send, Trash2, PawPrint } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onClear: () => void
  canClear: boolean
  isTyping: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  petName?: string
  showPetInChat?: boolean
}

export const InputArea = forwardRef<HTMLDivElement, Props>(function InputArea(
  { value, onChange, onSend, onClear, canClear, isTyping, textareaRef, petName, showPetInChat },
  ref,
) {
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const placeholder = showPetInChat
    ? `和 ${petName} 一起规划一次完美出行…（Enter 发送，Shift+Enter 换行）`
    : '告诉我你的目的地，AI 帮你规划携宠行程'

  return (
    <div ref={ref} className="shrink-0 relative z-30 glass-soft border-t border-rule/40">
      <div className="px-3 md:px-4 py-2.5 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center rounded-2xl bg-white/80 border border-rule/60 px-2.5 py-2">
            <PawPrint size={16} className="text-primary shrink-0 opacity-80 mr-1.5" />
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={placeholder}
              className="flex-1 min-w-0 bg-transparent outline-none text-[14px] md:text-[15px] resize-none leading-relaxed min-h-[38px] max-h-[120px] font-body"
            />
          </div>
          <button
            onClick={onSend}
            disabled={!value.trim() || isTyping}
            className="inline-flex items-center justify-center shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-primary to-coral-600 text-primary-fg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95] transition"
            style={{ boxShadow: '0 4px 14px rgba(247,107,122,0.28)' }}
            aria-label="发送"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="md:hidden mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground font-body">
          <span>Enter 发送 · Shift+Enter 换行</span>
          <button
            onClick={onClear}
            disabled={!canClear}
            className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary disabled:opacity-40"
          >
            <Trash2 size={12} /> 清空
          </button>
        </div>
        <div className="hidden md:flex mt-2 items-center justify-between text-[11px] text-muted-foreground font-body">
          <span>Enter 发送 · Shift+Enter 换行</span>
          <button
            onClick={onClear}
            disabled={!canClear}
            className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary disabled:opacity-40"
          >
            <Trash2 size={12} /> 清空对话
          </button>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground text-center font-body opacity-80">
          内容由 AI 生成，仅供参考
        </div>
      </div>
    </div>
  )
})
