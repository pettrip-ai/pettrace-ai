import { Dog, Calendar, Hotel, Compass, PawPrint } from 'lucide-react'

export interface Suggestion {
  icon: 'calendar' | 'hotel' | 'compass' | 'paw'
  title: string
  subtitle: string
  prompt: string
}

export const QUICK_SUGGESTIONS: Suggestion[] = [
  {
    icon: 'calendar',
    title: '周末一日游',
    subtitle: '时间不挤·宠物友好路线',
    prompt: '下周六带豆豆去杭州玩一天，帮我规划行程',
  },
  {
    icon: 'hotel',
    title: '两天一夜携宠游',
    subtitle: '行程 + 住宿一站式',
    prompt: '两天一夜苏州携宠游，推荐住宿和行程',
  },
  {
    icon: 'compass',
    title: '本地遛狗路线',
    subtitle: '按宠物体型精选',
    prompt: '在上海帮我规划这周的遛狗路线',
  },
  {
    icon: 'paw',
    title: '大型犬友好路线',
    subtitle: '只进真正允许大型犬的场所',
    prompt: '带一只金毛（大型犬）去上海玩一天',
  },
]

function SuggestionIcon({ kind }: { kind: Suggestion['icon'] }) {
  const cls = 'w-5 h-5 text-primary'
  switch (kind) {
    case 'calendar': return <Calendar className={cls} />
    case 'hotel': return <Hotel className={cls} />
    case 'compass': return <Compass className={cls} />
    case 'paw': return <PawPrint className={cls} />
  }
}

export function WelcomeHero({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center shadow-soft mb-3">
        <Dog size={28} className="text-primary" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-100/80 border border-coral-200/70 text-[11px] text-ink mb-3 font-body">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        内容由 AI 生成
      </div>

      <h2 className="font-heading font-extrabold text-[26px] md:text-[32px] leading-tight text-ink tracking-tight">
        你好，我是<span className="text-primary">宠迹</span> AI
      </h2>
      <p className="text-[12px] md:text-[14px] text-muted-foreground mt-2 max-w-[420px] leading-relaxed font-body">
        告诉我你的宠物和想去哪里 — 我会按真实地点数据和宠物友好规则，为你秒出一份可执行的携宠行程
      </p>

      <div className="mt-6 md:mt-8 w-full">
        <div className="flex flex-wrap justify-center gap-3">
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              onClick={() => onPick(s.prompt)}
              className="pet-card flex flex-col items-center text-left min-w-[220px] md:w-[250px] hover:-translate-y-[1px] active:scale-[0.98] transition hover:shadow-pop hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-50 to-coral-100 border border-coral-200/70 flex items-center justify-center shrink-0 mb-2.5">
                <SuggestionIcon kind={s.icon} />
              </div>
              <div className="font-heading font-bold text-[14px] md:text-[15px] text-ink">
                {s.title}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                {s.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground font-body">
        👇 点击任意卡片开始，或直接在下方输入你的需求
      </p>
    </div>
  )
}
