import { useState } from 'react'
import { clsx } from 'clsx'
import { Eye, EyeOff, RefreshCw, Trash2, ArrowRight, ChevronRight } from 'lucide-react'
import type { AiProvider } from '../../store/useStore'
import { PROVIDER_LABELS, CITIES, VERSION, VALUE_CHAIN } from './constants'

interface SettingSectionProps {
  accent?: 'primary' | 'accent'
  title: string
  children: React.ReactNode
  suffix?: React.ReactNode
}

export function SettingSection({ accent = 'primary', title, children, suffix }: SettingSectionProps) {
  const barColor = accent === 'primary' ? 'bg-primary' : 'bg-accent'
  return (
    <section className="bg-surface border border-rule rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <div className={clsx('w-1.5 h-5 rounded', barColor)} />
        <h2 className="font-semibold">{title}</h2>
        {suffix}
      </div>
      {children}
    </section>
  )
}

interface ProviderSelectProps {
  value: AiProvider
  onChange: (p: AiProvider) => void
  onReset: () => void
}

export function ProviderSelect({ value, onChange, onReset }: ProviderSelectProps) {
  return (
    <div>
      <label htmlFor="ai-provider" className="text-xs text-muted mb-1 block">AI Provider</label>
      <div className="flex items-center gap-2">
        <select
          id="ai-provider"
          value={value}
          onChange={(e) => onChange(e.target.value as AiProvider)}
          className="flex-1 appearance-none bg-bg border border-rule rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {(Object.keys(PROVIDER_LABELS) as AiProvider[]).map((p) => (
            <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onReset}
          aria-label="重置为该 Provider 的默认值"
          title="重置为该 Provider 的默认值"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs border border-rule text-muted hover:text-ink hover:bg-outline-variant transition"
        >
          <RefreshCw size={14} aria-hidden="true" />
          默认
        </button>
      </div>
    </div>
  )
}

interface ApiKeyFieldProps {
  value: string
  onChange: (v: string) => void
}

export function ApiKeyField({ value, onChange }: ApiKeyFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor="api-key" className="text-xs text-muted mb-1 block">API Key</label>
      <div className="relative">
        <input
          id="api-key"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
          className="w-full bg-bg border border-rule rounded-md px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? '隐藏 API Key' : '显示 API Key'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-muted hover:text-ink hover:bg-outline-variant"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function TextField({ id, label, value, onChange, placeholder }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-muted mb-1 block">{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg border border-rule rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={clsx(
          'relative inline-flex items-center h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-outline-variant',
        )}
      >
        <span
          className={clsx(
            'inline-block h-5 w-5 rounded-full bg-surface shadow-sm transform transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

interface CitySelectProps {
  value: string
  onChange: (v: string) => void
}

export function CitySelect({ value, onChange }: CitySelectProps) {
  return (
    <div>
      <label htmlFor="mock-city" className="text-xs text-muted mb-1 block">Mock 城市</label>
      <select
        id="mock-city"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-bg border border-rule rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

interface DangerActionProps {
  label: string
  onClick: () => void
}

export function DangerAction({ label, onClick }: DangerActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-surface border border-rule text-ink hover:bg-outline-variant transition"
    >
      <Trash2 size={14} aria-hidden="true" />
      {label}
    </button>
  )
}

export function LocalDataInfo() {
  return (
    <p className="text-xs text-muted leading-relaxed">
      所有设置、宠物档案、聊天、收藏与地点验证均保存在本机 LocalStorage（key 前缀 <code className="bg-outline-variant px-1 rounded">pettrace:*</code>）。
    </p>
  )
}

export function AppInfo() {
  return (
    <SettingSection
      accent="accent"
      title="关于"
      suffix={<span className="ml-auto text-xs text-muted">v{VERSION}</span>}
    >
      <div className="text-sm">
        <div className="font-medium">宠迹AI</div>
        <div className="text-xs text-muted mt-0.5">TRAE AI 创造力大赛参赛作品</div>
      </div>

      <div>
        <div className="text-xs text-muted mb-2">价值飞轮</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {VALUE_CHAIN.map((v, i) => (
            <div key={v + i} className="flex items-center gap-1.5">
              <div className="bg-accent/10 text-accent rounded-md px-2.5 py-1 text-xs font-medium border border-accent/25">
                {v}
              </div>
              {i < VALUE_CHAIN.length - 1 && <ArrowRight size={14} className="text-muted" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>
    </SettingSection>
  )
}

export function FooterNote() {
  return (
    <p className="text-[11px] text-muted text-center pt-4 pb-3">© 宠迹AI 2026 · 愿你和毛孩子都拥有更安心的旅途</p>
  )
}

export { ChevronRight }
