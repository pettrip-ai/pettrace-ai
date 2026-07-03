import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import {
  Dog, Bug, HardDrive, Info, ChevronRight,
  Trash2, RefreshCw, PawPrint,
} from 'lucide-react'
import { AI_PROVIDER_DEFAULTS, useStore, type AiProvider } from '../../store/useStore'
import { ToastProvider } from '../../components/ui/Toast'
import { useToast } from '../../components/ui/toast-context'
import { ActionSheet } from '../../components/ui/ActionSheet'
import { Avatar } from '../../components/ui/Avatar'
import type { CityId } from '../../data/types'
import { PROVIDER_LABELS, CITIES, VERSION } from './constants'
import { ApiKeyField, TextField } from './components'

const KIND_LABEL: Record<string, string> = { dog: '狗', cat: '猫', rabbit: '兔', hamster: '仓鼠', other: '其它' }

function useDebouncedSave(ms = 300) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const run = useCallback((fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fn, ms)
  }, [ms])
  return { run }
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Dog; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <Icon size={14} className="text-primary" />
      <span className="text-[11px] text-muted font-semibold uppercase tracking-[0.05em] font-body leading-[var(--line-height-caption)]">{title}</span>
    </div>
  )
}

function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card !p-0 !overflow-hidden">
      {children}
    </div>
  )
}

function Row({
  label,
  right,
  border,
}: {
  label: string
  right?: React.ReactNode
  border?: boolean
}) {
  return (
    <div className={clsx('flex items-center justify-between px-4 py-3', border !== false && 'border-b border-rule/50')}>
      <span className="text-[14px] text-ink">{label}</span>
      {right}
    </div>
  )
}

function RowToggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-rule/50">
      <div className="min-w-0">
        <div className="text-[14px] text-ink">{label}</div>
        {desc && <div className="text-[11px] text-muted mt-0.5">{desc}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors',
          checked ? 'bg-primary' : 'bg-muted/40',
        )}
      >
        <span className={clsx(
          'inline-block h-5 w-5 rounded-full bg-surface shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )} />
      </button>
    </div>
  )
}

function SettingsPageInner() {
  const { settings, updateSettings, clearAll, pets } = useStore()
  const [provider, setProvider] = useState<AiProvider>(settings.aiProvider)
  const [apiKey, setApiKey] = useState(settings.apiKey)
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl)
  const [model, setModel] = useState(settings.model)
  const [enableMockAi, setEnableMockAi] = useState(settings.enableMockAi)
  const [mockCity, setMockCity] = useState<string>(settings.mockCity)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { show } = useToast()
  const { run } = useDebouncedSave(300)

  const debouncedPersist = useCallback(
    (patch: Partial<typeof settings>, toastMsg = '已保存') => {
      run(() => { updateSettings(patch); show(toastMsg) })
    },
    [run, updateSettings, show],
  )

  useEffect(() => {
    setProvider(settings.aiProvider)
    setApiKey(settings.apiKey)
    setBaseUrl(settings.baseUrl)
    setModel(settings.model)
    setEnableMockAi(settings.enableMockAi)
    setMockCity(settings.mockCity)
  }, [
    settings.aiProvider,
    settings.apiKey,
    settings.baseUrl,
    settings.model,
    settings.enableMockAi,
    settings.mockCity,
  ])

  const handleProviderChange = (p: AiProvider) => {
    setProvider(p)
    if (p !== 'custom') {
      const next = AI_PROVIDER_DEFAULTS[p]
      setBaseUrl(next.baseUrl)
      setModel(next.model)
      updateSettings({ aiProvider: p, baseUrl: next.baseUrl, model: next.model })
    } else {
      updateSettings({ aiProvider: p })
    }
    show('已保存')
  }

  const handleResetProvider = () => {
    if (provider !== 'custom') {
      const next = AI_PROVIDER_DEFAULTS[provider]
      setBaseUrl(next.baseUrl)
      setModel(next.model)
      updateSettings({ aiProvider: provider, baseUrl: next.baseUrl, model: next.model })
    }
    show('已恢复默认')
  }

  const mainPet = pets[0]

  const handleClearAll = () => {
    clearAll()
    setApiKey('')
    setBaseUrl('')
    setModel('')
    setProvider('openai')
    setEnableMockAi(true)
    setMockCity('shanghai')
    show('已清空本地数据', { kind: 'warn' })
  }

  return (
    <div className="min-h-full h-full w-full overflow-y-auto bg-bg px-4 md:px-5 pt-3 md:pt-4 pb-28 space-y-5">
      <div>
        <h2 className="font-display font-extrabold text-xl md:text-[22px] tracking-tight text-ink">设置</h2>
        <p className="text-[12px] md:text-[13px] text-muted mt-1">配置AI服务与本地数据</p>
      </div>

      <section>
        <SectionHeader icon={PawPrint} title="宠物档案" />
        <GroupCard>
          {mainPet ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--pettrace-coral-100)] to-[var(--pettrace-coral-200)] flex items-center justify-center shrink-0 shadow-[0_2px_6px_rgba(247,107,122,0.15)] font-bold text-[18px] text-[var(--primary)]">
                <Avatar size="sm" name={mainPet.name} variant="gradient" className="!w-full !h-full text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px] text-ink truncate">{mainPet.name}</div>
                <div className="text-[12px] text-muted mt-0.5 truncate">
                  {KIND_LABEL[mainPet.kind]}{mainPet.breed ? ` · ${mainPet.breed}` : ''}
                  {mainPet.size ? ` · ${mainPet.size === 'large' ? '大型犬' : mainPet.size === 'medium' ? '中型犬' : '小型犬'}` : ''}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </div>
          ) : (
            <div className="text-sm text-muted text-center py-4">暂无档案</div>
          )}
        </GroupCard>
      </section>

      <section>
        <SectionHeader icon={Dog} title="AI 服务" />
        <GroupCard>
          <Row
            label="AI 提供商"
            right={
              <div className="flex items-center gap-2">
                <select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
                  className="bg-transparent text-right text-[14px] font-mono text-muted focus:outline-none"
                >
                  {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="text-muted shrink-0" />
              </div>
            }
          />
          <div className="px-4 py-3 border-b border-rule/50 space-y-3">
            <ApiKeyField
              value={apiKey}
              onChange={(value) => {
                setApiKey(value)
                debouncedPersist({ apiKey: value })
              }}
            />
            <TextField
              id="ai-base-url"
              label="Base URL"
              value={baseUrl}
              placeholder="https://api.example.com/v1"
              onChange={(value) => {
                setBaseUrl(value)
                debouncedPersist({ baseUrl: value })
              }}
            />
            <TextField
              id="ai-model"
              label="Model"
              value={model}
              placeholder="gpt-4o-mini"
              onChange={(value) => {
                setModel(value)
                debouncedPersist({ model: value })
              }}
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-rule/50">
            <span className="text-[14px] text-ink">当前提供商</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] text-muted">{PROVIDER_LABELS[provider]}</span>
              <button onClick={handleResetProvider} title="重置默认" aria-label="重置默认" className="p-1 rounded hover:bg-outline-variant text-muted">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </GroupCard>
      </section>

      <section>
        <SectionHeader icon={Bug} title="Mock & 调试" />
        <GroupCard>
          <RowToggle
            label="启用 Mock AI"
            desc="不调用远端服务"
            checked={enableMockAi}
            onChange={(v) => {
              setEnableMockAi(v)
              debouncedPersist({ enableMockAi: v })
            }}
          />
          <Row
            label="Mock 城市"
            border={false}
            right={
              <div className="flex items-center gap-1">
                <select
                  value={mockCity}
                  onChange={(e) => { setMockCity(e.target.value); debouncedPersist({ mockCity: e.target.value as CityId }) }}
                  className="bg-transparent text-right text-[14px] font-mono text-muted focus:outline-none"
                >
                  {CITIES.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <ChevronRight size={14} className="text-muted shrink-0" />
              </div>
            }
          />
        </GroupCard>
      </section>

      <section>
        <SectionHeader icon={HardDrive} title="本地数据" />
        <GroupCard>
          <div className="px-4 py-3">
            <p className="text-[12px] text-muted leading-relaxed">
              所有设置、宠物档案、聊天、收藏与地点验证均保存在本机 LocalStorage（key 前缀 <span className="px-1 bg-outline-variant rounded">pettrace:*</span>）。
            </p>
            <button
              onClick={() => setSheetOpen(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-error/5 hover:bg-error/10 border border-error/25 text-error text-[14px] font-semibold transition active:scale-[0.98]"
            >
              <Trash2 size={15} /> 清空所有数据
            </button>
          </div>
        </GroupCard>
      </section>

      <section>
        <SectionHeader icon={Info} title="关于" />
        <GroupCard>
          <Row label="版本号" right={<span className="font-mono text-[13px] text-muted">v{VERSION}</span>} />
          <Row label="品牌标识" border={false} right={<span className="font-display font-bold text-[14px] text-primary">PetTrace AI</span>} />
        </GroupCard>
      </section>

      <p className="text-[11px] text-muted text-center pt-2 pb-1">数据仅保存在本地设备</p>

      <ActionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        actionSheetProps={{
          title: '清空所有数据？',
          description: '将删除城市、宠物、设置、聊天、收藏等所有本地数据，操作不可恢复。',
          cancelText: '再想想',
          actions: [
            {
              label: '确认清空所有数据',
              variant: 'destructive',
              onClick: handleClearAll,
            },
          ],
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ToastProvider>
      <SettingsPageInner />
    </ToastProvider>
  )
}
