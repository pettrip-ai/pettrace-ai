import type { AiProvider } from '../../store/useStore'

export const VERSION = '0.2.0'

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  moonshot: '月之暗面 Moonshot',
  dashscope: '通义千问 DashScope',
  custom: '自定义',
}

export const CITIES: { id: string; name: string }[] = [
  { id: 'shanghai', name: '上海' },
  { id: 'beijing', name: '北京' },
  { id: 'guangzhou', name: '广州' },
  { id: 'chengdu', name: '成都' },
]

export const VALUE_CHAIN = ['查找', '出行', '验证', '更新'] as const
