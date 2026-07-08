export type AiReplySource = 'mock' | 'api' | 'fallback'

export type AiRiskType = 'rule' | 'environment' | 'execution'

export interface AiPlanSummary {
  title?: string
  city?: string
  days?: number
  confidenceLabel?: string
  source?: AiReplySource
  petProfileUsed?: boolean
}

export interface AiRiskSection {
  type: AiRiskType
  title: string
  items: string[]
}

export interface AiItineraryAlternative {
  placeId: string
  reason: string
}

export interface AiItineraryStep {
  time?: string
  placeId?: string
  label: string
  ruleBrief?: string
  action?: string
  reason?: string
  verifyHint?: string
  alternatives?: Array<{ placeId: string; reason: string }>
  name?: string
  place?: string
  tagline?: string
  type?: string
  rating?: number
  address?: string
  area?: string
  distanceKm?: number
  category?: string
  phone?: string
  openHours?: string
  priceRange?: string
  reviewCount?: number
  reviewHighlights?: string[]
  tagIds?: string[]
}

export interface AiReply {
  prose: string
  itinerary: AiItineraryStep[]
  risks: string[]
  checklist: string[]
  summary?: AiPlanSummary
  riskSections?: AiRiskSection[]
}

export interface PetContext {
  name: string
  kind: string
  breed?: string
  size?: 'small' | 'medium' | 'large' | 'any'
  personality?: string
  weightKg?: number
}

export interface SendAiTurnOptions {
  apiKey: string
  baseUrl: string
  model: string
  usePetContext?: boolean
  petContext?: PetContext
  city?: string
  places?: Array<{
    id: string
    name: string
    category: string
    rule?: { sizeLimit?: string; allowIndoor?: boolean; notes?: string }
  }>
  timeoutMs?: number
}

export class AiFetchError extends Error {
  code?: number | string
  constructor(message: string, code?: number | string) {
    super(message)
    this.code = code
  }
}

function buildSystemPrompt(opts: SendAiTurnOptions): string {
  const parts: string[] = []
  parts.push('你是宠迹AI的携宠行程规划伙伴。')
  parts.push(
    '你需要根据用户的目的地、日期、宠物特征，提供一份可执行的携宠行程方案。',
  )
  parts.push(
    '请同时输出自然语言分析(prose)和结构化行程(itinerary)、风险提示(risks)、行前清单(checklist)。',
  )
  parts.push('所有地点请只引用我已提供的候选 list 中的地点 id。')
  parts.push(
    '请严格按 JSON 输出，必填字段：prose, itinerary, risks, checklist。可选字段：summary, riskSections。',
  )
  parts.push(
    'itinerary 每步字段：time, placeId, label, ruleBrief, action, reason, verifyHint, alternatives。所有 placeId 必须来自候选地点列表。',
  )
  parts.push(
    'riskSections 每项字段：type(rule/environment/execution), title, items。summary 字段：title, city, days, confidenceLabel, source, petProfileUsed。',
  )
  if (opts.city) parts.push(`当前城市: ${opts.city}`)
  if (opts.places && opts.places.length) {
    const placeList = opts.places
      .map((p) => {
        const r = p.rule || {}
        return `- id=${p.id}, name=${p.name}, category=${p.category}, sizeLimit=${r.sizeLimit ?? 'any'}, allowIndoor=${
          r.allowIndoor ? 'true' : 'false'
        }, notes=${r.notes ?? ''}`
      })
      .join('\n')
    parts.push(`候选地点列表:\n${placeList}`)
  }
  if (opts.usePetContext && opts.petContext) {
    const pc = opts.petContext
    parts.push(
      `当前宠物档案: 名字=${pc.name}, 种类=${pc.kind}, 品种=${pc.breed ?? '未知'}, 体型=${pc.size ?? '未知'}, 性格=${pc.personality ?? '温和'}, 体重kg=${
        pc.weightKg ?? '未知'
      }`,
    )
  }
  parts.push('只输出 JSON，不要前后缀说明。')
  return parts.join('\n')
}

function stringListOf(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function normalizeRiskType(raw: unknown): AiRiskType {
  return raw === 'rule' || raw === 'environment' || raw === 'execution' ? raw : 'execution'
}

function normalizeRiskSections(raw: unknown): AiRiskSection[] | undefined {
  if (!Array.isArray(raw)) return undefined

  const sections = raw.flatMap((section): AiRiskSection[] => {
    if (!section || typeof section !== 'object') return []
    const obj = section as Record<string, unknown>
    const items = stringListOf(obj.items)
    if (items.length === 0) return []
    const title = typeof obj.title === 'string' && obj.title.trim().length > 0
      ? obj.title
      : '风险提示'
    return [{
      type: normalizeRiskType(obj.type),
      title,
      items,
    }]
  })

  return sections.length > 0 ? sections : undefined
}

function normalizeSummary(raw: unknown): AiPlanSummary | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const obj = raw as Record<string, unknown>
  const summary: AiPlanSummary = {}

  if (typeof obj.title === 'string') summary.title = obj.title
  if (typeof obj.city === 'string') summary.city = obj.city
  if (typeof obj.confidenceLabel === 'string') summary.confidenceLabel = obj.confidenceLabel
  if (typeof obj.days === 'number' && Number.isFinite(obj.days)) summary.days = obj.days
  if (obj.source === 'mock' || obj.source === 'api' || obj.source === 'fallback') summary.source = obj.source
  if (typeof obj.petProfileUsed === 'boolean') summary.petProfileUsed = obj.petProfileUsed

  return Object.keys(summary).length > 0 ? summary : undefined
}

function normalizeReplyJson(raw: unknown): AiReply {
  if (typeof raw === 'string') {
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new AiFetchError('AI 返回非 JSON 文本')
      return normalizeReplyJson(JSON.parse(match[0]))
    } catch {
      throw new AiFetchError('AI 返回无法解析为 JSON')
    }
  }
  if (!raw || typeof raw !== 'object') throw new AiFetchError('AI 响应为空')
  const obj = raw as Record<string, unknown>
  const itinerary = Array.isArray(obj.itinerary) ? (obj.itinerary as AiItineraryStep[]) : []
  const risks = stringListOf(obj.risks)
  const checklist = stringListOf(obj.checklist)
  const prose = typeof obj.prose === 'string' ? obj.prose : ''
  const summary = normalizeSummary(obj.summary)
  const riskSections = normalizeRiskSections(obj.riskSections)
  return { prose, itinerary, risks, checklist, summary, riskSections }
}

export async function sendAiTurn(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  opts: SendAiTurnOptions,
): Promise<AiReply> {
  if (!opts.apiKey) throw new AiFetchError('apiKey 缺失', 'NO_API_KEY')
  const timeout = opts.timeoutMs ?? 20_000
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined
  const timer = controller
    ? setTimeout(() => controller.abort(), timeout)
    : null

  try {
    const endpoint = `${opts.baseUrl.replace(/\/$/, '')}/chat/completions`
    const systemPrompt = buildSystemPrompt(opts)
    const body = {
      model: opts.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller?.signal,
    })
    if (res.status === 401) throw new AiFetchError('API Key 无效 (401)', 401)
    if (res.status === 429) throw new AiFetchError('API 限流 (429)', 429)
    if (res.status >= 400) {
      let errText = ''
      try {
        errText = await res.text()
      } catch {}
      throw new AiFetchError(`API 错误 ${res.status}: ${errText.slice(0, 200)}`, res.status)
    }
    const data = await res.json()
    const content = (data?.choices?.[0]?.message?.content as string | undefined) ?? ''
    if (!content) throw new AiFetchError('AI 没有返回内容')
    return normalizeReplyJson(content)
  } finally {
    if (timer) clearTimeout(timer)
  }
}
