import { ArrowRight, CheckCircle2, MapPinned, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'
import type { DemoScenario, PlanningSignal } from '../missionControl'

const toneStyle: Record<PlanningSignal['tone'], { bg: string; fg: string }> = {
  coral: { bg: 'var(--color-primary-container)', fg: 'var(--primary)' },
  mint: { bg: 'var(--pettrace-mint-50)', fg: 'var(--color-accent)' },
  honey: { bg: 'var(--pettrace-honey-50)', fg: 'var(--color-warning)' },
  info: { bg: 'var(--pettrace-info-50)', fg: 'var(--pettrace-info-600)' },
}

const signalIcons = {
  pet: PawPrint,
  rules: MapPinned,
  risk: ShieldCheck,
  community: CheckCircle2,
} satisfies Record<PlanningSignal['key'], typeof PawPrint>

export function MissionControlHero({
  petLabel,
  cityName,
  hasPet,
  showPetInChat,
  onTogglePetContext,
}: {
  petLabel: string
  cityName: string
  hasPet: boolean
  showPetInChat: boolean
  onTogglePetContext: () => void
}) {
  const petContextEnabled = hasPet && showPetInChat

  return (
    <section className="card shadow-card mb-4 overflow-hidden rounded-2xl border-rule/50 p-4">
      <div className="flex items-start gap-3">
        <div className="avatar gradient md shrink-0" title={petLabel}>
          {petLabel.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--pettrace-info-50)', color: 'var(--pettrace-info-600)' }}>
            <Sparkles size={12} />
            {cityName} Mission Control
          </div>
          <h1 className="pettrace-h3" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
            让 AI 把宠物档案、地点规则和社区验证变成一份可执行行程
          </h1>
          <p className="pettrace-body mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
            从授权到约束检查，再到社区实测反馈，先校准任务台，再进入对话。
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={petContextEnabled}
        disabled={!hasPet}
        onClick={() => {
          if (hasPet) onTogglePetContext()
        }}
        className="mt-4 flex min-h-11 w-full items-center justify-between rounded-2xl px-3 text-sm font-semibold"
        style={{
          background: petContextEnabled ? 'var(--color-primary-container)' : 'rgba(255,255,255,0.8)',
          color: petContextEnabled ? 'var(--primary)' : 'var(--color-on-surface)',
          border: '0.5px solid var(--border)',
          opacity: hasPet ? 1 : 0.68,
        }}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <PawPrint size={16} className="shrink-0" />
          <span className="truncate">
            {!hasPet ? '先添加宠物档案' : petContextEnabled ? `已授权档案：${petLabel}` : '授权档案给 AI'}
          </span>
        </span>
        <ArrowRight size={16} className="shrink-0" />
      </button>
    </section>
  )
}

export function PlanningSignals({ signals }: { signals: PlanningSignal[] }) {
  return (
    <section className="mb-4">
      <div className="grid grid-cols-2 gap-3">
        {signals.map((signal) => {
          const Icon = signalIcons[signal.key]
          const tone = toneStyle[signal.tone]
          return (
            <article key={signal.key} className="rounded-2xl border border-rule/50 bg-white/80 p-3 shadow-card">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.fg }}>
                  <Icon size={16} />
                </span>
                <span className="pettrace-caption truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                  {signal.label}
                </span>
              </div>
              <h2 className="pettrace-h4 truncate" style={{ margin: 0, color: 'var(--color-on-surface)', fontSize: 16 }}>
                {signal.value}
              </h2>
              <p className="pettrace-caption mt-1 line-clamp-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                {signal.detail}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function DemoScenarioCard({ scenario, onRun }: { scenario: DemoScenario; onRun: (prompt: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRun(scenario.prompt)}
      className="mb-4 w-full rounded-2xl border border-rule/50 bg-white/80 p-4 text-left shadow-card"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="pettrace-caption rounded-full px-2.5 py-1 font-semibold" style={{ background: 'var(--pettrace-honey-50)', color: 'var(--color-warning)' }}>
          {scenario.meta}
        </span>
        <ArrowRight size={17} className="shrink-0" style={{ color: 'var(--primary)' }} />
      </div>
      <h2 className="pettrace-h4" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
        {scenario.title}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {scenario.steps.map((step) => (
          <span key={step} className="pettrace-caption rounded-xl px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.72)', color: 'var(--color-on-surface-variant)' }}>
            {step}
          </span>
        ))}
      </div>
    </button>
  )
}

export function ScenarioRail({ scenarios, onRun }: { scenarios: DemoScenario[]; onRun: (prompt: string) => void }) {
  return (
    <section className="mb-4">
      <h2 className="pettrace-h4 mb-3" style={{ color: 'var(--color-on-surface)', fontSize: 18 }}>
        快捷场景
      </h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onRun(scenario.prompt)}
            className="shrink-0 rounded-full border border-rule/50 bg-white/80 px-3.5 py-2 text-[12px] font-semibold shadow-card"
            style={{ color: 'var(--color-on-surface)' }}
          >
            {scenario.title}
          </button>
        ))}
      </div>
    </section>
  )
}
