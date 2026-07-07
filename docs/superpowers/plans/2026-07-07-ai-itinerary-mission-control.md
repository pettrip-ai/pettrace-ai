# AI Itinerary Mission Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the AI itinerary tab from a simple recommendation/chat entry into a mission-control style itinerary planner that visibly connects pet profile authorization, place rules, AI planning, map execution, and community verification.

**Architecture:** Keep the existing `/ai` and `/ai/chat` routes. Upgrade `PlannerPage` into the mission-control landing state, keep `ChatView` as the generation and follow-up state, and split new display logic into focused components under `src/pages/AiPage/components`. Preserve the current Mock AI and OpenAI-compatible paths while extending the response shape with optional fields.

**Tech Stack:** Vite, React 19, TypeScript, React Router, Zustand, Tailwind utility classes, Lucide React, Playwright, existing Node SSR regression script.

---

## Current Context

The implementation must build on these existing files:

- `src/pages/AiPage/Planner.tsx`: currently renders greeting, two static trip cards, hot destinations, and a fixed chat input.
- `src/pages/AiPage/ChatView.tsx`: currently handles chat state, pending text auto-send, Mock/API selection, place cards, map navigation, and bookmark toast.
- `src/lib/ai.ts`: currently defines `AiItineraryStep`, `AiReply`, `PetContext`, API options, system prompt, JSON normalization, and `sendAiTurn`.
- `src/lib/mockAiEngine.ts`: currently detects city/days/focus and generates `prose`, `itinerary`, `risks`, `checklist`.
- `src/pages/AiPage/constants.ts`: currently contains pet context helpers, chat history trimming, place list mapping, and place name lookup.
- `src/store/useStore.ts`: currently owns `showPetInChat`, `setShowPetInChat`, `verifyPlace`, `feeds`, `places`, `pets`, `chat`, `settings`.
- `tests/e2e/core-loop.spec.ts`: currently covers AI plan to map navigation.
- `scripts/loop1-regression.mjs`: currently contains source and SSR regression checks.

Important existing bug to fix first: `ChatView` currently creates `petCtx = pet ? petToContext(pet) : undefined` and passes it to Mock/API regardless of `showPetInChat`. The spec requires that no pet profile context is sent unless the user explicitly authorizes it.

## File Structure

Create or modify these files:

- Modify: `src/lib/ai.ts`
  - Add optional plan summary/risk section types.
  - Preserve compatibility with old responses.
  - Extend the system prompt to ask real providers for optional fields.

- Modify: `src/lib/mockAiEngine.ts`
  - Add intent detection for indoor, rain, weekend, lodging, large-dog constraints.
  - Generate `summary`, `reason`, `verifyHint`, `alternatives`, and `riskSections`.
  - Keep existing `detectCity`, `detectDays`, and base return shape compatible.

- Create: `src/pages/AiPage/missionControl.ts`
  - Pure helpers for mission-control landing data: scenario prompts, signal derivation, pet labels, place counts, verification summary.
  - This file must not import React.

- Create: `src/pages/AiPage/components/MissionControl.tsx`
  - Presentational components for the `/ai` landing page: `MissionControlHero`, `PlanningSignals`, `DemoScenarioCard`, `ScenarioRail`.
  - It receives already-derived data from `Planner.tsx`.

- Create: `src/pages/AiPage/components/PlanWorkspace.tsx`
  - Presentational components for generated results: `PlanSummaryCard`, `ItineraryTimeline`, `RiskPanel`, `ChecklistPanel`.
  - It owns no store access except through callbacks passed from `ChatView`.

- Modify: `src/pages/AiPage/Planner.tsx`
  - Replace static recommendation/hot destination layout with mission-control landing.
  - Wire authorization toggle to `showPetInChat` and `setShowPetInChat`.
  - Use existing navigation to `/ai/chat?q=...`.

- Modify: `src/pages/AiPage/ChatView.tsx`
  - Gate pet context behind `showPetInChat`.
  - Pass `source` metadata to fallback Mock replies.
  - Replace per-step `PlaceCard` rendering with `PlanWorkspace`.
  - Add verify and replace actions.

- Modify: `src/pages/AiPage/constants.ts`
  - Make `petToContext` use actual pet traits where available.
  - Keep `placesListFor` and `placeNameOf` compatible.

- Modify: `scripts/loop1-regression.mjs`
  - Add source/SSR tests for pet privacy gating, optional AI fields, mission-control components, and plan workspace strings.

- Modify: `tests/e2e/core-loop.spec.ts`
  - Update AI landing expectations.
  - Add mission-control demo scenario path.
  - Keep AI-to-map navigation coverage.

- Modify: `.gitignore`
  - Keep `.superpowers/` ignored. This is a local workspace hygiene rule already present in the current working tree and must not be removed during implementation.

## Task 1: Extend AI Types and Privacy Regression Coverage

**Files:**
- Modify: `src/lib/ai.ts`
- Modify: `scripts/loop1-regression.mjs`

- [ ] **Step 1: Write failing regression checks for optional AI fields and pet privacy gating**

Add this test block near the existing AI-related tests in `scripts/loop1-regression.mjs`, before `let failures = 0`:

```js
test('AI response types include optional mission-control fields', async () => {
  const source = await readFile(new URL('../src/lib/ai.ts', import.meta.url), 'utf8')

  assert.match(source, /export type AiReplySource = 'mock' \| 'api' \| 'fallback'/)
  assert.match(source, /export interface AiPlanSummary/)
  assert.match(source, /export interface AiRiskSection/)
  assert.match(source, /summary\?: AiPlanSummary/)
  assert.match(source, /riskSections\?: AiRiskSection\[\]/)
  assert.match(source, /reason\?: string/)
  assert.match(source, /verifyHint\?: string/)
  assert.match(source, /alternatives\?: Array<\{ placeId: string; reason: string \}>/)
})

test('AI chat only passes pet context when profile authorization is enabled', async () => {
  const chatView = await readFile(new URL('../src/pages/AiPage/ChatView.tsx', import.meta.url), 'utf8')

  assert.match(chatView, /showPetInChat/)
  assert.match(chatView, /const petCtx = showPetInChat && pet \? petToContext\(pet\) : undefined/)
  assert.match(chatView, /usePetContext: !!petCtx/)
  assert.doesNotMatch(chatView, /const petCtx = pet \? petToContext\(pet\) : undefined/)
})
```

- [ ] **Step 2: Run regression test to verify it fails**

Run:

```bash
npm run test:regression
```

Expected: FAIL. The first new test fails because `AiReplySource`, `AiPlanSummary`, and `AiRiskSection` do not exist yet. The second new test fails because `ChatView` still creates `petCtx` without checking `showPetInChat`.

- [ ] **Step 3: Extend AI types and provider prompt**

In `src/lib/ai.ts`, replace the top interface block with this code:

```ts
export type AiReplySource = 'mock' | 'api' | 'fallback'

export type AiRiskType = 'rule' | 'environment' | 'execution'

export interface AiPlanSummary {
  title: string
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
```

In the same file, replace the strict JSON prompt line:

```ts
parts.push(
  '请严格按 JSON 输出，字段：prose, itinerary(每步 { time:"09:00", placeId:"xxx", label:"餐厅", ruleBrief:"大型犬可进", action:"打车前往" }), risks[], checklist[]。',
)
```

with:

```ts
parts.push(
  '请严格按 JSON 输出，必填字段：prose, itinerary, risks, checklist。可选字段：summary, riskSections。',
)
parts.push(
  'itinerary 每步字段：time, placeId, label, ruleBrief, action, reason, verifyHint, alternatives。所有 placeId 必须来自候选地点列表。',
)
parts.push(
  'riskSections 每项字段：type(rule/environment/execution), title, items。summary 字段：title, city, days, confidenceLabel, source, petProfileUsed。',
)
```

In `normalizeReplyJson`, replace the final parsing section:

```ts
const itinerary = Array.isArray(obj.itinerary) ? (obj.itinerary as AiItineraryStep[]) : []
const risks = Array.isArray(obj.risks) ? (obj.risks as string[]) : []
const checklist = Array.isArray(obj.checklist) ? (obj.checklist as string[]) : []
const prose = typeof obj.prose === 'string' ? obj.prose : ''
return { prose, itinerary, risks, checklist }
```

with:

```ts
const itinerary = Array.isArray(obj.itinerary) ? (obj.itinerary as AiItineraryStep[]) : []
const risks = Array.isArray(obj.risks) ? (obj.risks as string[]) : []
const checklist = Array.isArray(obj.checklist) ? (obj.checklist as string[]) : []
const prose = typeof obj.prose === 'string' ? obj.prose : ''
const summary = obj.summary && typeof obj.summary === 'object'
  ? (obj.summary as AiPlanSummary)
  : undefined
const riskSections = Array.isArray(obj.riskSections)
  ? (obj.riskSections as AiRiskSection[])
  : undefined
return { prose, itinerary, risks, checklist, summary, riskSections }
```

- [ ] **Step 4: Run regression test and confirm only pet privacy check still fails**

Run:

```bash
npm run test:regression
```

Expected: FAIL only on `AI chat only passes pet context when profile authorization is enabled`.

- [ ] **Step 5: Commit AI type extension**

Run:

```bash
git add src/lib/ai.ts scripts/loop1-regression.mjs
git commit -m "feat(ai): 扩展行程规划结构字段"
```

## Task 2: Fix Pet Profile Authorization Before AI Calls

**Files:**
- Modify: `src/pages/AiPage/ChatView.tsx`
- Modify: `src/pages/AiPage/Planner.tsx`
- Modify: `scripts/loop1-regression.mjs`

- [ ] **Step 1: Write failing regression check for Planner authorization control**

Add this test block in `scripts/loop1-regression.mjs`, near the AI chat privacy test:

```js
test('AI planner exposes an explicit pet profile authorization control', async () => {
  const planner = await readFile(new URL('../src/pages/AiPage/Planner.tsx', import.meta.url), 'utf8')

  assert.match(planner, /showPetInChat/)
  assert.match(planner, /setShowPetInChat/)
  assert.match(planner, /授权档案/)
  assert.match(planner, /aria-pressed=\{showPetInChat\}/)
})
```

- [ ] **Step 2: Run regression test to verify privacy and Planner checks fail**

Run:

```bash
npm run test:regression
```

Expected: FAIL on the `ChatView` pet context check and the new Planner authorization check.

- [ ] **Step 3: Gate pet context in ChatView**

In `src/pages/AiPage/ChatView.tsx`, update the store destructuring:

```ts
const {
  city,
  setCity,
  pets,
  chat,
  addMessage,
  settings,
  showPetInChat,
} = useStore()
```

Replace:

```ts
const petCtx = pet ? petToContext(pet) : undefined
```

with:

```ts
const petCtx = showPetInChat && pet ? petToContext(pet) : undefined
```

This exact expression is required by the regression test.

- [ ] **Step 4: Add authorization state to Planner store usage**

In `src/pages/AiPage/Planner.tsx`, change:

```ts
const { pets, clearChat } = useStore()
```

to:

```ts
const { pets, clearChat, showPetInChat, setShowPetInChat } = useStore()
```

Add this button somewhere in the top section before the chat input is reached:

```tsx
<button
  type="button"
  aria-pressed={showPetInChat}
  onClick={() => setShowPetInChat(!showPetInChat)}
  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-semibold"
  style={{
    background: showPetInChat ? 'var(--color-primary-container)' : 'rgba(255,255,255,0.72)',
    color: showPetInChat ? 'var(--primary)' : 'var(--color-muted-foreground)',
    border: '0.5px solid var(--border)',
  }}
>
  <PawPrint size={13} />
  {showPetInChat ? `已授权档案：${petLabel}` : '授权档案给 AI'}
</button>
```

This temporary insertion can be replaced by the mission-control component in Task 4, but the state path must work before any AI call changes.

- [ ] **Step 5: Run regression test**

Run:

```bash
npm run test:regression
```

Expected: PASS for the two new privacy checks. Other source checks may still pass because the temporary Planner button preserves existing layout strings.

- [ ] **Step 6: Commit privacy fix**

Run:

```bash
git add src/pages/AiPage/ChatView.tsx src/pages/AiPage/Planner.tsx scripts/loop1-regression.mjs
git commit -m "fix(ai): 限制宠物档案进入AI上下文"
```

## Task 3: Enhance Mock AI Into a Structured Planning Engine

**Files:**
- Modify: `src/lib/mockAiEngine.ts`
- Modify: `scripts/loop1-regression.mjs`

- [ ] **Step 1: Add failing SSR regression for enhanced Mock AI**

Add this test block in `scripts/loop1-regression.mjs`:

```js
test('mock ai returns mission-control itinerary metadata', async () => {
  const { mockAiEngine } = await server.ssrLoadModule('/src/lib/mockAiEngine.ts')
  const reply = mockAiEngine({
    message: '周六带大型犬去上海玩一天，午餐要室内可进，下午避开高温',
    city: 'shanghai',
    petContext: {
      name: '豆豆',
      kind: 'dog',
      breed: '金毛',
      size: 'large',
      personality: '温和',
      weightKg: 28,
    },
  })

  assert.equal(reply.summary?.source, 'mock')
  assert.equal(reply.summary?.petProfileUsed, true)
  assert.ok(reply.summary?.title.includes('上海'))
  assert.ok(reply.itinerary.length >= 4)
  assert.ok(reply.itinerary.every((step) => typeof step.reason === 'string' && step.reason.length > 0))
  assert.ok(reply.itinerary.every((step) => typeof step.verifyHint === 'string' && step.verifyHint.length > 0))
  assert.ok(reply.riskSections?.some((section) => section.type === 'rule'))
  assert.ok(reply.riskSections?.some((section) => section.type === 'environment'))
  assert.ok(reply.riskSections?.some((section) => section.type === 'execution'))
})
```

- [ ] **Step 2: Run regression test to verify it fails**

Run:

```bash
npm run test:regression
```

Expected: FAIL because `mockAiEngine` does not return `summary`, `reason`, `verifyHint`, or `riskSections`.

- [ ] **Step 3: Add intent and helper types to mockAiEngine**

In `src/lib/mockAiEngine.ts`, add these helpers after `detectFocus`:

```ts
interface TripIntent {
  days: number
  wantsIndoor: boolean
  wantsHotel: boolean
  rainy: boolean
  weekend: boolean
  largeDog: boolean
  avoidHeat: boolean
}

function detectIntent(text: string, petContext?: PetContext): TripIntent {
  const days = detectDays(text, 1)
  const largeDog = /大型犬|金毛|拉布拉多|阿拉斯加|哈士奇/.test(text) || petContext?.size === 'large'
  return {
    days,
    wantsIndoor: /室内|进店|可进|雨天|下雨/.test(text),
    wantsHotel: /酒店|住宿|住|两天|2\s*天|过夜/.test(text),
    rainy: /雨|下雨|雨天/.test(text),
    weekend: /周末|周六|周日|星期六|星期日/.test(text),
    largeDog,
    avoidHeat: /避暑|高温|太热|中暑|下午/.test(text),
  }
}

function canFitLargeDog(p: Place) {
  return p.rule.sizeLimit === 'any' || p.rule.sizeLimit === 'large'
}

function placeReason(p: Place, label: string, intent: TripIntent) {
  if (label.includes('午餐') || label.includes('晚餐')) {
    if (p.rule.allowIndoor) return '用餐时段优先选择室内可进，减少排队和天气影响'
    if (p.rule.hasOutdoorSeat) return '该地点有户外座位，适合作为宠物友好用餐点'
  }
  if (p.category === 'pet_park') return '宠物公园能释放精力，适合作为中段活动'
  if (p.category === 'park') return intent.avoidHeat ? '安排在上午活动，避开下午高温' : '开放空间更适合牵引散步'
  if (p.category === 'hotel') return '住宿点支持宠物入住，适合多日行程'
  return '地点规则清晰，社区验证信号较完整'
}

function verifyHintOf(p: Place) {
  if (p.rule.allowIndoor) return '到店后确认宠物是否仍可进入室内区域'
  if (p.rule.hasOutdoorSeat) return '到店后确认户外座位是否开放且是否需要预约'
  return '到达后确认牵引要求、体型限制和现场告示'
}

function alternativesFor(places: Place[], current: Place) {
  return places
    .filter((p) => p.id !== current.id && p.category === current.category)
    .slice(0, 2)
    .map((p) => ({ placeId: p.id, reason: p.rule.allowIndoor ? '同类型室内可进备选' : '同类型宠物友好备选' }))
}
```

- [ ] **Step 4: Replace makeItineraryForDay with intent-aware version**

Replace the existing `makeItineraryForDay` function with:

```ts
function makeItineraryForDay(
  dayIdx: number,
  dayPlaces: Place[],
  intent: TripIntent,
): AiItineraryStep[] {
  const categories: Array<Place['category']> = intent.wantsHotel && dayIdx > 0
    ? ['hotel', 'park', 'restaurant', 'pet_park', 'cafe']
    : ['park', 'scenic_spot', 'restaurant', 'pet_park', 'cafe']
  const picked = pickByCategory(dayPlaces, categories)
  const indoorRestaurant = dayPlaces.find((p) => p.category === 'restaurant' && p.rule.allowIndoor)
  const petPark = dayPlaces.find((p) => p.category === 'pet_park')

  const slots = [
    { time: '09:00', label: dayIdx === 0 ? '上午释放精力' : '第二天轻量散步', index: 0 },
    { time: '11:30', label: '规则确认', index: 1 },
    { time: '12:30', label: '午餐补给', index: 2 },
    { time: '15:30', label: intent.avoidHeat ? '低强度避暑' : '宠物公园', index: 3 },
    { time: '18:00', label: '晚餐与验证', index: 4 },
  ]

  return slots.flatMap((slot) => {
    const preferred = slot.label.includes('午餐') || slot.label.includes('晚餐')
      ? indoorRestaurant ?? picked[slot.index % Math.max(1, picked.length)]
      : slot.label.includes('宠物公园') || slot.label.includes('避暑')
        ? petPark ?? picked[slot.index % Math.max(1, picked.length)]
        : picked[slot.index % Math.max(1, picked.length)]
    if (!preferred) return []
    return [{
      time: slot.time,
      placeId: preferred.id,
      label: slot.label,
      ruleBrief: briefOf(preferred),
      action: slot.label.includes('晚餐') || slot.label.includes('午餐')
        ? (preferred.rule.allowIndoor ? '室内用餐' : '户外用餐')
        : '查看地图后前往',
      reason: placeReason(preferred, slot.label, intent),
      verifyHint: verifyHintOf(preferred),
      alternatives: alternativesFor(dayPlaces, preferred),
    }]
  })
}
```

- [ ] **Step 5: Add risk sections and summary**

Add this helper after `risksOf`:

```ts
function riskSectionsOf(places: Place[], intent: TripIntent, petContext?: PetContext) {
  const ruleItems: string[] = []
  const environmentItems: string[] = []
  const executionItems: string[] = []

  if (intent.largeDog || petContext?.size === 'large') {
    const limited = places.filter((p) => !canFitLargeDog(p)).slice(0, 2)
    if (limited.length) ruleItems.push(`大型犬需避开 ${limited.map((p) => p.name).join('、')} 等体型限制地点`)
  }
  if (places.some((p) => !p.rule.allowIndoor)) ruleItems.push('部分地点仅限室外，需准备室内备选')
  const feePlace = places.find((p) => p.rule.fee > 0)
  if (feePlace) ruleItems.push(`${feePlace.name} 等地点可能收取宠物服务费`)

  if (intent.rainy) environmentItems.push('雨天优先选择室内可进或有遮挡的地点')
  if (intent.avoidHeat) environmentItems.push('户外活动安排在上午，下午减少暴晒和长距离步行')
  if (intent.weekend) environmentItems.push('周末热门地点人流较高，建议提前 30 分钟抵达')
  if (!environmentItems.length) environmentItems.push('夏季中午注意补水，户外活动避开 11:00-15:00')

  executionItems.push('所有公共区域默认牵引，准备 1.5m 内胸背式牵引')
  executionItems.push('到店后先确认现场告示，社区验证可能滞后')
  if (intent.wantsHotel) executionItems.push('住宿类地点需提前确认宠物房和清洁费')

  return [
    { type: 'rule' as const, title: '规则风险', items: ruleItems },
    { type: 'environment' as const, title: '环境风险', items: environmentItems },
    { type: 'execution' as const, title: '执行提醒', items: executionItems },
  ].filter((section) => section.items.length > 0)
}
```

In `mockAiEngine`, replace:

```ts
const days = detectDays(opts.message, 1)
const places = PLACES[city]
const focus = detectFocus(opts.message)
```

with:

```ts
const intent = detectIntent(opts.message, opts.petContext)
const days = intent.days
const places = PLACES[city]
const focus = detectFocus(opts.message)
```

Replace:

```ts
itinerary.push(...makeItineraryForDay(d, places))
```

with:

```ts
itinerary.push(...makeItineraryForDay(d, places, intent))
```

At the end of `mockAiEngine`, replace:

```ts
return { prose, itinerary, risks, checklist }
```

with:

```ts
const riskSections = riskSectionsOf(places, intent, opts.petContext)
const summary = {
  title: `${cityName}${days === 1 ? '一日' : `${days}天`}携宠任务台计划`,
  city: cityName,
  days,
  confidenceLabel: '基于地点规则与社区验证',
  source: 'mock' as const,
  petProfileUsed: !!opts.petContext,
}

return { prose, itinerary, risks, checklist, summary, riskSections }
```

- [ ] **Step 6: Run regression test**

Run:

```bash
npm run test:regression
```

Expected: PASS for `mock ai returns mission-control itinerary metadata`.

- [ ] **Step 7: Commit Mock AI enhancement**

Run:

```bash
git add src/lib/mockAiEngine.ts scripts/loop1-regression.mjs
git commit -m "feat(ai): 增强Mock行程规划结构"
```

## Task 4: Build Mission-Control Landing Helpers and UI

**Files:**
- Create: `src/pages/AiPage/missionControl.ts`
- Create: `src/pages/AiPage/components/MissionControl.tsx`
- Modify: `src/pages/AiPage/Planner.tsx`
- Modify: `scripts/loop1-regression.mjs`

- [ ] **Step 1: Add failing regression checks for mission-control files**

Add this test block in `scripts/loop1-regression.mjs`:

```js
test('AI planner mission-control files expose core landing sections', async () => {
  const helper = await readFile(new URL('../src/pages/AiPage/missionControl.ts', import.meta.url), 'utf8')
  const components = await readFile(new URL('../src/pages/AiPage/components/MissionControl.tsx', import.meta.url), 'utf8')
  const planner = await readFile(new URL('../src/pages/AiPage/Planner.tsx', import.meta.url), 'utf8')

  assert.match(helper, /export function buildPlanningSignals/)
  assert.match(helper, /export const DEMO_SCENARIOS/)
  assert.match(components, /export function MissionControlHero/)
  assert.match(components, /export function PlanningSignals/)
  assert.match(components, /export function DemoScenarioCard/)
  assert.match(components, /让 AI 把宠物档案、地点规则和社区验证变成一份可执行行程/)
  assert.match(planner, /MissionControlHero/)
  assert.match(planner, /PlanningSignals/)
  assert.match(planner, /DemoScenarioCard/)
})
```

- [ ] **Step 2: Run regression test to verify it fails**

Run:

```bash
npm run test:regression
```

Expected: FAIL because the mission-control files do not exist and Planner still uses static trip cards.

- [ ] **Step 3: Create mission-control helper**

Create `src/pages/AiPage/missionControl.ts` with this content:

```ts
import type { CityId, FeedItem, Pet, Place } from '../../data/types'
import { CITIES, PLACES } from '../../data/mock'
import { weightLabel } from './constants'

export interface PlanningSignal {
  key: 'pet' | 'rules' | 'risk' | 'community'
  label: string
  value: string
  detail: string
  tone: 'coral' | 'mint' | 'honey' | 'info'
}

export interface DemoScenario {
  id: string
  title: string
  prompt: string
  meta: string
  steps: string[]
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'large-dog-day',
    title: '大型犬友好一日游',
    prompt: '周六带豆豆在上海玩一天，午餐要室内可进，下午避开高温',
    meta: '档案 + 室内规则 + 避暑风险',
    steps: ['上午释放精力', '午餐室内可进', '下午低强度', '傍晚验证打卡'],
  },
  {
    id: 'rainy-indoor',
    title: '雨天室内备选',
    prompt: '上海雨天带狗出门，帮我规划室内可进和有遮挡的路线',
    meta: '天气约束 + 室内备选',
    steps: ['规则筛选', '室内优先', '户外备选', '到店确认'],
  },
  {
    id: 'two-day-hotel',
    title: '两天一夜含住宿',
    prompt: '两天一夜带金毛去上海玩，要包含宠物友好酒店和晚餐',
    meta: '住宿 + 服务费 + 行前清单',
    steps: ['酒店确认', '错峰游玩', '晚餐安排', '证件清单'],
  },
]

export function petDisplayName(pet?: Pet) {
  if (!pet) return '未添加宠物'
  const size = weightLabel(pet.weightKg) || (pet.size === 'large' ? '大型' : pet.size === 'small' ? '小型' : '中型')
  return `${pet.name} · ${pet.breed ?? pet.kind} · ${size}`
}

export function buildPlanningSignals(args: {
  city: CityId
  pet?: Pet
  showPetInChat: boolean
  places: Record<string, Place>
  feeds: FeedItem[]
}): PlanningSignal[] {
  const cityPlaces = Object.values(args.places).filter((place) => place.city === args.city)
  const seedPlaces = PLACES[args.city] ?? []
  const places = cityPlaces.length ? cityPlaces : seedPlaces
  const indoorCount = places.filter((place) => place.rule.allowIndoor).length
  const largeDogCount = places.filter((place) => place.rule.sizeLimit === 'any' || place.rule.sizeLimit === 'large').length
  const verifiedCount = places.reduce((sum, place) => sum + (place.verifierCount || 0), 0)
  const latestFeed = args.feeds.find((feed) => places.some((place) => place.id === feed.placeId))
  const cityName = CITIES[args.city]?.name ?? args.city

  return [
    {
      key: 'pet',
      label: '宠物档案',
      value: args.showPetInChat && args.pet ? petDisplayName(args.pet) : '未授权',
      detail: args.showPetInChat ? 'AI 会使用档案做规划' : '默认私密，点击后才进入 AI 上下文',
      tone: 'coral',
    },
    {
      key: 'rules',
      label: '地点规则',
      value: `${places.length} 个候选点`,
      detail: `${indoorCount} 个室内可进，${largeDogCount} 个大型犬友好`,
      tone: 'mint',
    },
    {
      key: 'risk',
      label: '风险约束',
      value: '规则 + 天气 + 人流',
      detail: '优先避开体型限制、午后高温和周末拥挤',
      tone: 'honey',
    },
    {
      key: 'community',
      label: '社区验证',
      value: `${verifiedCount} 次验证`,
      detail: latestFeed ? `最近反馈：${latestFeed.type}` : `${cityName} 暂无本地新反馈`,
      tone: 'info',
    },
  ]
}
```

- [ ] **Step 4: Create mission-control components**

Create `src/pages/AiPage/components/MissionControl.tsx` with this content:

```tsx
import { ArrowRight, CheckCircle2, MapPinned, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'
import type { DemoScenario, PlanningSignal } from '../missionControl'

const toneStyle: Record<PlanningSignal['tone'], { bg: string; fg: string }> = {
  coral: { bg: 'var(--color-primary-container)', fg: 'var(--primary)' },
  mint: { bg: 'var(--pettrace-mint-50)', fg: 'var(--color-accent)' },
  honey: { bg: 'var(--pettrace-honey-50)', fg: 'var(--color-warning)' },
  info: { bg: 'var(--pettrace-info-50)', fg: 'var(--pettrace-info-600)' },
}

export function MissionControlHero({
  petLabel,
  cityName,
  showPetInChat,
  onTogglePetContext,
}: {
  petLabel: string
  cityName: string
  showPetInChat: boolean
  onTogglePetContext: () => void
}) {
  return (
    <section className="mb-4 rounded-2xl border border-rule/50 bg-white/80 p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--pettrace-mint-50)', color: 'var(--color-accent)' }}>
            <Sparkles size={12} />
            AI 行程任务台 · {cityName}
          </div>
          <h1 className="pettrace-h3" style={{ margin: 0, fontSize: 24, color: 'var(--color-on-surface)', lineHeight: 1.18 }}>
            让 AI 把宠物档案、地点规则和社区验证变成一份可执行行程
          </h1>
        </div>
        <div className="avatar gradient md shrink-0" title={petLabel}>{petLabel.slice(0, 1)}</div>
      </div>
      <button
        type="button"
        aria-pressed={showPetInChat}
        onClick={onTogglePetContext}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-3 text-[12px] font-semibold"
        style={{
          background: showPetInChat ? 'var(--color-primary-container)' : 'rgba(255,255,255,0.72)',
          color: showPetInChat ? 'var(--primary)' : 'var(--color-muted-foreground)',
          border: '0.5px solid var(--border)',
        }}
      >
        <PawPrint size={14} />
        {showPetInChat ? `已授权档案：${petLabel}` : '授权档案给 AI'}
      </button>
    </section>
  )
}

export function PlanningSignals({ signals }: { signals: PlanningSignal[] }) {
  return (
    <section className="mb-4 grid grid-cols-2 gap-2">
      {signals.map((signal) => {
        const tone = toneStyle[signal.tone]
        return (
          <div key={signal.key} className="rounded-xl border border-rule/50 bg-white/78 p-3 shadow-card">
            <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}>
              {signal.key === 'pet' && <PawPrint size={15} />}
              {signal.key === 'rules' && <ShieldCheck size={15} />}
              {signal.key === 'risk' && <CheckCircle2 size={15} />}
              {signal.key === 'community' && <MapPinned size={15} />}
            </div>
            <p className="pettrace-caption" style={{ margin: 0, color: 'var(--color-muted-foreground)' }}>{signal.label}</p>
            <p className="truncate" style={{ margin: '2px 0', color: 'var(--color-on-surface)', fontWeight: 700, fontSize: 14 }}>{signal.value}</p>
            <p style={{ margin: 0, color: 'var(--color-muted-foreground)', fontSize: 11, lineHeight: 1.45 }}>{signal.detail}</p>
          </div>
        )
      })}
    </section>
  )
}

export function DemoScenarioCard({ scenario, onRun }: { scenario: DemoScenario; onRun: (prompt: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRun(scenario.prompt)}
      className="card mb-4 w-full cursor-pointer overflow-hidden p-0 text-left active:scale-[0.99]"
    >
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="pettrace-caption" style={{ margin: 0, color: 'var(--color-accent)', fontWeight: 700 }}>{scenario.meta}</p>
            <h2 className="truncate" style={{ margin: '2px 0 0', color: 'var(--color-on-surface)', fontSize: 18, fontWeight: 800 }}>{scenario.title}</h2>
          </div>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            <ArrowRight size={18} />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {scenario.steps.map((step) => (
            <span key={step} className="rounded-lg px-2.5 py-2 text-[11px]" style={{ background: 'var(--surface-container-low)', color: 'var(--color-on-surface)' }}>
              {step}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

export function ScenarioRail({ scenarios, onRun }: { scenarios: DemoScenario[]; onRun: (prompt: string) => void }) {
  return (
    <section className="mb-5">
      <h2 className="pettrace-h4" style={{ margin: '0 0 10px', color: 'var(--color-on-surface)', fontSize: 18 }}>快捷场景</h2>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onRun(scenario.prompt)}
            className="shrink-0 rounded-full border border-rule/60 bg-white/80 px-3.5 py-2 text-[12px] font-semibold"
            style={{ color: 'var(--color-on-surface)' }}
          >
            {scenario.title}
          </button>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Replace Planner with mission-control landing**

Replace `src/pages/AiPage/Planner.tsx` with:

```tsx
import { PawPrint, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CITIES } from '../../data/mock'
import { useStore } from '../../store/useStore'
import { DEMO_SCENARIOS, buildPlanningSignals, petDisplayName } from './missionControl'
import { DemoScenarioCard, MissionControlHero, PlanningSignals, ScenarioRail } from './components/MissionControl'

export default function PlannerPage() {
  const {
    city,
    pets,
    places,
    feeds,
    clearChat,
    showPetInChat,
    setShowPetInChat,
  } = useStore()
  const navigate = useNavigate()
  const pet = pets[0]
  const petLabel = pet?.name ?? '豆豆'
  const petDetail = petDisplayName(pet)
  const cityName = CITIES[city]?.name ?? city
  const signals = buildPlanningSignals({ city, pet, showPetInChat, places, feeds })
  const primaryScenario = DEMO_SCENARIOS[0]

  function runScenario(prompt: string) {
    clearChat()
    navigate({ pathname: '/ai/chat', search: `q=${encodeURIComponent(prompt)}` })
  }

  function openChat() {
    clearChat()
    navigate({ pathname: '/ai/chat' })
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-bg" style={{ paddingBottom: 'calc(150px + var(--sab, 0px))' }}>
      <div className="flex flex-col px-4 pt-3">
        <MissionControlHero
          petLabel={petLabel}
          cityName={cityName}
          showPetInChat={showPetInChat}
          onTogglePetContext={() => setShowPetInChat(!showPetInChat)}
        />
        <PlanningSignals signals={signals} />
        <DemoScenarioCard scenario={{ ...primaryScenario, prompt: primaryScenario.prompt.replace('豆豆', petLabel) }} onRun={runScenario} />
        <ScenarioRail scenarios={DEMO_SCENARIOS.slice(1)} onRun={(prompt) => runScenario(prompt.replace('豆豆', petLabel))} />
        <section className="rounded-2xl border border-rule/50 bg-white/70 p-3">
          <p className="pettrace-caption" style={{ margin: 0, color: 'var(--color-muted-foreground)' }}>当前档案</p>
          <p className="truncate" style={{ margin: '4px 0 0', color: 'var(--color-on-surface)', fontWeight: 700 }}>{petDetail}</p>
        </section>
      </div>

      <div
        className="fixed z-40"
        style={{
          bottom: 'calc(76px + var(--sab))',
          left: 16,
          right: 16,
          padding: '0 0 0',
        }}
      >
        <div
          className="chat-wrap"
          style={{
            maxWidth: '100%',
            minWidth: 0,
            boxShadow: 'var(--shadow-3)',
            alignItems: 'center',
          }}
          onClick={openChat}
        >
          <PawPrint size={18} style={{ color: 'var(--primary)', opacity: 1, flexShrink: 0 }} />
          <input
            className="chat-input"
            type="text"
            placeholder="描述宠物、城市和出行限制..."
            readOnly
            style={{ flex: 1, minWidth: 0, height: 20, lineHeight: '20px', cursor: 'text' }}
          />
          <button className="chat-send" aria-label="发送"><Send size={16} /></button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run regression test**

Run:

```bash
npm run test:regression
```

Expected: FAIL in `primary tab pages share background rhythm and ai planner remains scrollable` because it still asserts the old Planner header and placeholder.

- [ ] **Step 7: Update old Planner source assertions**

In `scripts/loop1-regression.mjs`, update the `primary tab pages share background rhythm and ai planner remains scrollable` test:

Replace:

```js
assert.match(planner, /paddingBottom: 'calc\(150px \+ var\(--sab, 0px\)\)'/)
assert.match(planner, /className="flex flex-col px-4 pt-3"/)
assert.match(planner, /className="flex items-center justify-between pb-3"/)
assert.doesNotMatch(planner, /paddingBottom: 170/)
assert.doesNotMatch(planner, /pt-6/)
assert.doesNotMatch(planner, /py-3/)
```

with:

```js
assert.match(planner, /paddingBottom: 'calc\(150px \+ var\(--sab, 0px\)\)'/)
assert.match(planner, /className="flex flex-col px-4 pt-3"/)
assert.match(planner, /MissionControlHero/)
assert.match(planner, /PlanningSignals/)
assert.match(planner, /placeholder="描述宠物、城市和出行限制\.\.\."/)
assert.doesNotMatch(planner, /paddingBottom: 170/)
assert.doesNotMatch(planner, /pt-6/)
assert.doesNotMatch(planner, /py-3/)
```

- [ ] **Step 8: Run regression test again**

Run:

```bash
npm run test:regression
```

Expected: PASS.

- [ ] **Step 9: Commit mission-control landing**

Run:

```bash
git add src/pages/AiPage/missionControl.ts src/pages/AiPage/components/MissionControl.tsx src/pages/AiPage/Planner.tsx scripts/loop1-regression.mjs
git commit -m "feat(ai): 构建行程任务台首页"
```

## Task 5: Build Generated Plan Workspace Components

**Files:**
- Create: `src/pages/AiPage/components/PlanWorkspace.tsx`
- Modify: `src/pages/AiPage/ChatView.tsx`
- Modify: `scripts/loop1-regression.mjs`

- [ ] **Step 1: Add failing regression checks for PlanWorkspace**

Add this test block in `scripts/loop1-regression.mjs`:

```js
test('AI generated plan workspace exposes timeline, risk, checklist, and verification actions', async () => {
  const workspace = await readFile(new URL('../src/pages/AiPage/components/PlanWorkspace.tsx', import.meta.url), 'utf8')
  const chatView = await readFile(new URL('../src/pages/AiPage/ChatView.tsx', import.meta.url), 'utf8')

  assert.match(workspace, /export function PlanWorkspace/)
  assert.match(workspace, /export function ItineraryTimeline/)
  assert.match(workspace, /查看地图/)
  assert.match(workspace, /标记已验证/)
  assert.match(workspace, /风险提示/)
  assert.match(workspace, /行前清单/)
  assert.match(chatView, /<PlanWorkspace/)
  assert.doesNotMatch(chatView, /msg\.structured\.itinerary\.map/)
})
```

- [ ] **Step 2: Run regression test to verify it fails**

Run:

```bash
npm run test:regression
```

Expected: FAIL because `PlanWorkspace.tsx` does not exist and `ChatView` still maps itinerary directly.

- [ ] **Step 3: Create PlanWorkspace components**

Create `src/pages/AiPage/components/PlanWorkspace.tsx` with this content:

```tsx
import { AlertTriangle, CheckCircle2, ClipboardList, MapPin, RefreshCw, ShieldCheck } from 'lucide-react'
import type { AiReply, AiRiskSection } from '../../../lib/ai'
import type { CityId, Place } from '../../../data/types'
import { placeNameOf } from '../constants'

interface PlanWorkspaceProps {
  reply: AiReply
  city: CityId
  findPlace: (placeId?: string) => Place | undefined
  onOpenMap: (placeId?: string) => void
  onVerifyPlace: (placeId?: string) => void
  onRefine: (text: string) => void
}

function riskFallback(risks: string[]): AiRiskSection[] {
  if (!risks.length) return []
  return [{ type: 'execution', title: '风险提示', items: risks }]
}

export function PlanWorkspace({ reply, city, findPlace, onOpenMap, onVerifyPlace, onRefine }: PlanWorkspaceProps) {
  const riskSections = reply.riskSections?.length ? reply.riskSections : riskFallback(reply.risks)
  return (
    <div className="space-y-2">
      <PlanSummaryCard reply={reply} />
      <ItineraryTimeline
        reply={reply}
        city={city}
        findPlace={findPlace}
        onOpenMap={onOpenMap}
        onVerifyPlace={onVerifyPlace}
        onRefine={onRefine}
      />
      <RiskPanel sections={riskSections} />
      <ChecklistPanel items={reply.checklist} />
    </div>
  )
}

export function PlanSummaryCard({ reply }: { reply: AiReply }) {
  const summary = reply.summary
  return (
    <section className="card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="pettrace-caption" style={{ margin: 0, color: 'var(--color-muted-foreground)' }}>
            {summary?.source === 'fallback' ? 'Mock fallback' : summary?.source === 'api' ? '真实 AI' : 'Mock AI'}
          </p>
          <h3 className="truncate" style={{ margin: '2px 0 0', color: 'var(--color-on-surface)', fontSize: 15, fontWeight: 800 }}>
            {summary?.title ?? `为你规划了 ${reply.itinerary.length} 步行程`}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'var(--pettrace-mint-50)', color: 'var(--color-accent)' }}>
          <ShieldCheck size={12} />
          {summary?.confidenceLabel ?? '规则已标注'}
        </span>
      </div>
      <p style={{ margin: 0, color: 'var(--color-muted-foreground)', fontSize: 12 }}>
        {summary?.petProfileUsed ? '已使用授权宠物档案' : '未使用宠物档案，档案默认私密'}
      </p>
    </section>
  )
}

export function ItineraryTimeline({
  reply,
  city,
  findPlace,
  onOpenMap,
  onVerifyPlace,
  onRefine,
}: PlanWorkspaceProps) {
  if (!reply.itinerary.length) return null

  return (
    <section className="space-y-2">
      {reply.itinerary.map((step, index) => {
        const place = findPlace(step.placeId)
        const placeName = step.name ?? step.place ?? (step.placeId ? placeNameOf(city, step.placeId) : '推荐地点')
        return (
          <div key={`${step.placeId ?? 'step'}-${index}`} className="card p-0 overflow-hidden">
            <div className="flex">
              <div className="w-1.5 shrink-0 bg-gradient-to-b from-primary to-coral-300" />
              <div className="min-w-0 flex-1 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="pettrace-caption" style={{ margin: 0, color: 'var(--primary)', fontWeight: 700 }}>{step.time ?? '出发'} · {step.label}</p>
                    <h3 className="truncate" style={{ margin: '2px 0', color: 'var(--color-on-surface)', fontSize: 15, fontWeight: 800 }}>{placeName}</h3>
                    <p style={{ margin: 0, color: 'var(--color-muted-foreground)', fontSize: 12, lineHeight: 1.45 }}>{step.reason ?? step.action ?? '地点规则清晰，适合加入当前行程'}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ background: 'var(--pettrace-honey-50)', color: 'var(--color-warning)' }}>{step.ruleBrief ?? place?.rule.notes ?? '规则待确认'}</span>
                </div>
                {step.verifyHint && (
                  <p className="mb-2 rounded-lg px-2.5 py-2 text-[11px]" style={{ background: 'var(--surface-container-low)', color: 'var(--color-muted-foreground)' }}>
                    到店验证：{step.verifyHint}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }} onClick={() => onOpenMap(step.placeId)}>
                    <MapPin size={13} />查看地图
                  </button>
                  <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold" style={{ background: 'var(--pettrace-mint-50)', color: 'var(--color-accent)' }} onClick={() => onVerifyPlace(step.placeId)}>
                    <CheckCircle2 size={13} />标记已验证
                  </button>
                  <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold" style={{ background: 'rgba(255,255,255,0.72)', color: 'var(--color-on-surface)', border: '0.5px solid var(--border)' }} onClick={() => onRefine(`把「${placeName}」这一步换成室内可进、人少、对大型犬更友好的地点`)}>
                    <RefreshCw size={13} />替换
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export function RiskPanel({ sections }: { sections: AiRiskSection[] }) {
  if (!sections.length) return null
  return (
    <section className="card p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-[14px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
        <AlertTriangle size={15} style={{ color: 'var(--color-warning)' }} />风险提示
      </h3>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={`${section.type}-${section.title}`}>
            <p className="pettrace-caption" style={{ margin: 0, color: 'var(--color-muted-foreground)', fontWeight: 700 }}>{section.title}</p>
            <ul className="mt-1 space-y-1 pl-4 text-[12px]" style={{ color: 'var(--color-muted-foreground)', listStyle: 'disc' }}>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ChecklistPanel({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <section className="card p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-[14px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
        <ClipboardList size={15} style={{ color: 'var(--primary)' }} />行前清单
      </h3>
      <div className="grid grid-cols-1 gap-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px]" style={{ background: 'var(--surface-container-low)', color: 'var(--color-on-surface)' }}>
            <CheckCircle2 size={13} style={{ color: 'var(--color-accent)' }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Wire PlanWorkspace into ChatView**

In `src/pages/AiPage/ChatView.tsx`, add this import:

```ts
import { PlanWorkspace } from './components/PlanWorkspace'
```

Add `verifyPlace` to the store destructuring:

```ts
const {
  city,
  setCity,
  pets,
  chat,
  addMessage,
  settings,
  showPetInChat,
  verifyPlace,
} = useStore()
```

Add these handlers below `handleAttachmentClick`:

```ts
function openMapPlace(placeId?: string) {
  if (!placeId) {
    show('这个地点暂时无法跳转地图', { kind: 'warn' })
    return
  }
  navigate(`/map?place=${placeId}`)
}

function markVerified(placeId?: string) {
  if (!placeId) {
    show('这个地点暂时无法验证', { kind: 'warn' })
    return
  }
  verifyPlace(placeId, 'good')
  show('已写入社区验证', { kind: 'ok' })
}

function fillRefinePrompt(text: string) {
  setValue(text)
  textareaRef.current?.focus()
}
```

Replace the block:

```tsx
{msg.structured && Array.isArray(msg.structured.itinerary) && msg.structured.itinerary.map((p, pi) => {
  const place = findPlaceById(city, p.placeId)
  return (
    <PlaceCard
      key={pi}
      placeId={p.placeId}
      data={{
        name: p.name ?? p.place ?? (p.placeId ? placeNameOf(city, p.placeId) : '推荐地点'),
        tagline: p.tagline ?? p.type ?? p.label ?? place?.category,
        rating: p.rating ?? place?.rating,
        address: p.address ?? p.area ?? place?.address,
        distanceKm: p.distanceKm,
      }}
    />
  )
})}
```

with:

```tsx
{msg.structured && Array.isArray(msg.structured.itinerary) && (
  <PlanWorkspace
    reply={msg.structured}
    city={city}
    findPlace={(placeId) => findPlaceById(city, placeId)}
    onOpenMap={openMapPlace}
    onVerifyPlace={markVerified}
    onRefine={fillRefinePrompt}
  />
)}
```

Leave `PlaceCard` in place until Task 6 cleanup so the diff stays easier to review.

- [ ] **Step 5: Run regression test**

Run:

```bash
npm run test:regression
```

Expected: PASS for the PlanWorkspace source checks. The existing bookmark regression still passes because `PlaceCard` remains in the file.

- [ ] **Step 6: Commit PlanWorkspace integration**

Run:

```bash
git add src/pages/AiPage/components/PlanWorkspace.tsx src/pages/AiPage/ChatView.tsx scripts/loop1-regression.mjs
git commit -m "feat(ai): 展示结构化行程工作台"
```

## Task 6: Update E2E Coverage for Mission-Control Flow

**Files:**
- Modify: `tests/e2e/core-loop.spec.ts`

- [ ] **Step 1: Update the AI-to-map E2E test for the new landing**

Replace the existing `AI 规划可以跳转到地图地点` test with:

```ts
test('AI 任务台示例可以生成计划并跳转到地图地点', async ({ page }) => {
  await expect(page.getByText('AI 行程任务台')).toBeVisible()
  await expect(page.getByText(/让 AI 把宠物档案/)).toBeVisible()
  await expect(page.getByText('地点规则')).toBeVisible()
  await expect(page.getByText('社区验证')).toBeVisible()

  await page.getByRole('button', { name: /大型犬友好一日游/ }).click()
  await expect(page.getByRole('heading', { name: 'PetTrace AI' })).toBeVisible()

  const routeButton = page.getByRole('button', { name: /查看地图/ }).first()
  await expect(routeButton).toBeVisible()
  await routeButton.click()

  await expect(page).toHaveURL(/\/pettrace-ai\/map\?place=[^&]+/)
  const placeId = new URL(page.url()).searchParams.get('place')
  expect(placeId).toMatch(/^(shanghai|beijing|guangzhou|chengdu)-\d+$/)
  await expect(page.locator('[data-map-search]')).toBeVisible()
  await expect(page.getByPlaceholder('搜索宠物友好地点...')).toBeVisible()
})
```

- [ ] **Step 2: Add E2E test for verification action**

Add this test after the AI-to-map test:

```ts
test('AI 计划可以写入本地社区验证', async ({ page }) => {
  await expect(page.getByText('AI 行程任务台')).toBeVisible()

  await page.getByRole('button', { name: /大型犬友好一日游/ }).click()
  await expect(page.getByText('风险提示')).toBeVisible()

  await page.getByRole('button', { name: /标记已验证/ }).first().click()
  await expect(page.getByText('已写入社区验证')).toBeVisible()

  await page.getByRole('tab', { name: '社区' }).click()
  await expect(page.getByText(/真实验证|现场规则一致/)).toBeVisible()
})
```

- [ ] **Step 3: Run Playwright E2E**

Run:

```bash
npm run test:e2e
```

Expected: PASS. If Chromium is not installed, run `npx playwright install chromium`, then rerun `npm run test:e2e`.

- [ ] **Step 4: Run quality checks**

Run:

```bash
npm run lint
npm run test:regression
npm run build
```

Expected: all commands pass.

- [ ] **Step 5: Commit E2E updates**

Run:

```bash
git add tests/e2e/core-loop.spec.ts
git commit -m "test(ai): 覆盖行程任务台主流程"
```

## Task 7: Cleanup Dead Code and Final Verification

**Files:**
- Modify: `src/pages/AiPage/ChatView.tsx`
- Modify: `scripts/loop1-regression.mjs`
- Modify: `docs/superpowers/specs/2026-07-06-ai-itinerary-mission-control-design.md`

- [ ] **Step 1: Remove obsolete PlaceCard from ChatView**

After PlanWorkspace passes E2E, remove the old `PlaceCard` function from `src/pages/AiPage/ChatView.tsx`.

Replace the Lucide import line with:

```ts
import { Send, Plus, Footprints, Clock, Calendar, Dog as DogIcon, ChevronLeft } from 'lucide-react'
```

Replace the constants import block with:

```ts
import {
  petToContext,
  chatToHistory,
  placesListFor,
} from './constants'
```

Keep `findPlaceById`, because `PlanWorkspace` still needs it through the callback.

- [ ] **Step 2: Update obsolete bookmark regression**

In `scripts/loop1-regression.mjs`, replace the `AI place bookmark toast is fired outside the state updater` test with:

```js
test('AI chat uses the generated plan workspace instead of inline place cards', async () => {
  const source = await readFile(new URL('../src/pages/AiPage/ChatView.tsx', import.meta.url), 'utf8')

  assert.match(source, /import \{ PlanWorkspace \} from '\.\/components\/PlanWorkspace'/)
  assert.match(source, /<PlanWorkspace/)
  assert.match(source, /function markVerified/)
  assert.match(source, /function fillRefinePrompt/)
  assert.doesNotMatch(source, /function PlaceCard/)
  assert.doesNotMatch(source, /const \[saved, setSaved\]/)
})
```

- [ ] **Step 3: Mark design spec as implemented**

In `docs/superpowers/specs/2026-07-06-ai-itinerary-mission-control-design.md`, change:

```md
状态：待评审
```

to:

```md
状态：已实施
```

- [ ] **Step 4: Run full local verification**

Run:

```bash
npm run quality:full
```

Expected: PASS. This runs lint, regression, build, bundle report, and Playwright E2E.

- [ ] **Step 5: Final visual spot check**

Run the dev server:

```bash
npm run dev
```

Open the local URL printed by Vite, then check:

- `/pettrace-ai/ai` shows “AI 行程任务台” and the value statement.
- The authorization button changes between “授权档案给 AI” and “已授权档案：豆豆”.
- Clicking “大型犬友好一日游” generates a plan.
- Generated plan contains summary, timeline, risk panel, checklist, map button, verification button, and replace button.
- Mobile width around 375px has no horizontal scrollbar or overlapping fixed composer.

Stop the dev server with `Ctrl+C` after the check.

- [ ] **Step 6: Commit cleanup and final status**

Run:

```bash
git add src/pages/AiPage/ChatView.tsx scripts/loop1-regression.mjs docs/superpowers/specs/2026-07-06-ai-itinerary-mission-control-design.md
git commit -m "chore(ai): 完成任务台清理和验收标记"
```

## Final Acceptance Checklist

- [ ] `/ai` first screen clearly communicates the mission-control value proposition.
- [ ] Pet profile authorization is explicit and controls whether `petContext` is passed to Mock/API calls.
- [ ] Mock AI returns `summary`, `reason`, `verifyHint`, `alternatives`, and categorized `riskSections`.
- [ ] Generated results render as a timeline/workspace, not a loose list of place cards.
- [ ] Generated plan includes map navigation, verification, and refinement actions.
- [ ] Verification action calls existing `verifyPlace` and creates local community feedback.
- [ ] Existing Mock fallback and API failure behavior remain stable.
- [ ] `npm run lint` passes.
- [ ] `npm run test:regression` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test:e2e` passes.
- [ ] `npm run quality:full` passes before final handoff.
