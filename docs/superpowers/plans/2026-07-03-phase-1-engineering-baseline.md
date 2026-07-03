# Phase 1 Engineering Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PetTrace AI safe to iterate by adding quality scripts, CI gates, zero-warning lint, browser smoke coverage, and bundle-size observation.

**Architecture:** Keep the app's product behavior unchanged. Add tooling around the existing Vite/React project, move non-component exports out of Fast Refresh component modules, and add one Playwright smoke suite that exercises the current local demo loop.

**Tech Stack:** Vite 8, React 19, TypeScript, npm, oxlint, custom Node regression script, Playwright Chromium, GitHub Actions.

---

## Scope Check

This plan implements Phase 1 only from `docs/superpowers/specs/2026-07-03-pettrace-ai-productization-design.md`.

Included:
- CI quality gates.
- Current lint warning fixes.
- Browser smoke coverage for the current demo loop.
- Bundle-size reporting.
- Development documentation for quality commands.

Excluded:
- Store slicing.
- LocalStorage migrations.
- Backend or edge AI gateway.
- Desktop layout redesign.
- Shared product data, accounts, moderation, or analytics.

## File Structure

Modify:
- `package.json`: add quality, regression, E2E, and bundle report scripts.
- `package-lock.json`: record `@playwright/test` after installation.
- `.github/workflows/deploy.yml`: make deploy run the quality build command before publishing.
- `src/components/ui/Toast.tsx`: export only `ToastProvider` from the component file.
- `src/pages/AiPage/components/WelcomeHero.tsx`: keep suggestion data local instead of exported.
- `src/pages/MapPage/components.tsx`: remove the exported `useMapPlaces` hook from this component module.
- `src/pages/MapPage/index.tsx`: import `useMapPlaces` from the new focused hook module.
- `src/lib/ai.ts`: remove the unused catch parameter.
- `README.md`: document the quality commands.

Create:
- `.github/workflows/quality.yml`: PR and main branch quality workflow.
- `playwright.config.ts`: Playwright test runner config with the Vite dev server.
- `tests/e2e/core-loop.spec.ts`: smoke tests for the current core loop.
- `scripts/bundle-report.mjs`: bundle budget and largest asset reporting.
- `src/components/ui/toast-context.ts`: toast context, types, and hooks.
- `src/pages/MapPage/useMapPlaces.ts`: focused map places hook.

## Task 1: Add Quality Scripts And Playwright Config

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`

- [ ] **Step 1: Install Playwright test dependency**

Run:

```bash
npm install -D @playwright/test
```

Expected:
- `package.json` contains `@playwright/test` in `devDependencies`.
- `package-lock.json` is updated.
- Command exits with code 0.

- [ ] **Step 2: Replace package scripts with explicit quality commands**

Modify the `scripts` block in `package.json` to exactly this:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build && node scripts/copy404.js",
  "lint": "oxlint",
  "test": "npm run test:regression",
  "test:regression": "node scripts/loop1-regression.mjs",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "bundle:report": "node scripts/bundle-report.mjs",
  "quality": "npm run lint && npm run test:regression && npm run build && npm run bundle:report",
  "quality:full": "npm run quality && npm run test:e2e",
  "preview": "vite preview"
}
```

- [ ] **Step 3: Add Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  reporter: process.env.CI ? [['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5181',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5181/pettrace-ai/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 393, height: 852 },
      },
    },
  ],
})
```

- [ ] **Step 4: Verify existing non-browser checks still run**

Run:

```bash
npm run test:regression
npm run lint
```

Expected:
- Regression script exits 0.
- Lint exits 0, but still prints the existing Fast Refresh and unused catch warnings before Task 2.

- [ ] **Step 5: Commit Task 1**

```bash
git add package.json package-lock.json playwright.config.ts
git commit -m "chore: add quality scripts and playwright config"
```

## Task 2: Fix Current Lint Warnings Without Suppressing Rules

**Files:**
- Create: `src/components/ui/toast-context.ts`
- Modify: `src/components/ui/Toast.tsx`
- Modify: `src/pages/AiPage/ChatView.tsx`
- Modify: `src/pages/SettingsPage/index.tsx`
- Modify: `src/pages/PetPage/actions.ts`
- Modify: `src/pages/PetPage/hooks.ts`
- Modify: `src/pages/CommunityPage/PostDetailPage.tsx`
- Modify: `src/pages/CommunityPage/hooks.ts`
- Modify: `src/pages/MapPage/tiles.tsx`
- Modify: `src/pages/AiPage/components/WelcomeHero.tsx`
- Create: `src/pages/MapPage/useMapPlaces.ts`
- Modify: `src/pages/MapPage/components.tsx`
- Modify: `src/pages/MapPage/index.tsx`
- Modify: `src/lib/ai.ts`

- [ ] **Step 1: Confirm the warning baseline**

Run:

```bash
npm run lint
```

Expected warnings before edits:
- `src/components/ui/Toast.tsx` Fast Refresh warnings for hook exports.
- `src/lib/ai.ts` unused catch parameter.
- `src/pages/AiPage/components/WelcomeHero.tsx` Fast Refresh warning for exported suggestion data.
- `src/pages/MapPage/components.tsx` Fast Refresh warning for exported hook.

- [ ] **Step 2: Move toast types and hooks to a non-component module**

Create `src/components/ui/toast-context.ts`:

```ts
import { createContext, useCallback, useContext } from 'react'

export type ToastKind = 'info' | 'success' | 'error' | 'warning' | 'ok' | 'warn'

export interface ToastCtx {
  show: (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside ToastProvider')
  return value
}

export function useSafeToast(): ToastCtx {
  const value = useContext(ToastContext)
  const show = useCallback(
    (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => {
      if (value) value.show(message, opts)
    },
    [value],
  )
  return {
    show,
    dismiss: value?.dismiss ?? (() => {}),
  }
}
```

- [ ] **Step 3: Make `Toast.tsx` export only the provider component**

In `src/components/ui/Toast.tsx`, change the first import to:

```ts
import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext, type ToastCtx, type ToastKind } from './toast-context'
```

Remove these declarations from `Toast.tsx` because they now live in `toast-context.ts`:

```ts
export type ToastKind = 'info' | 'success' | 'error' | 'warning' | 'ok' | 'warn'

interface ToastCtx {
  show: (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)
```

Change the provider tag from:

```tsx
<Ctx.Provider value={ctx}>
```

to:

```tsx
<ToastContext.Provider value={ctx}>
```

Change the closing provider from:

```tsx
</Ctx.Provider>
```

to:

```tsx
</ToastContext.Provider>
```

Delete the `useToast` and `useSafeToast` exports at the bottom of `Toast.tsx`.

- [ ] **Step 4: Update toast hook imports**

Apply these exact import changes:

```ts
// src/pages/AiPage/ChatView.tsx
import { useToast } from '../../components/ui/toast-context'

// src/pages/SettingsPage/index.tsx
import { ToastProvider } from '../../components/ui/Toast'
import { useToast } from '../../components/ui/toast-context'

// src/pages/PetPage/actions.ts
import type { ToastKind } from '../../components/ui/toast-context'

// src/pages/PetPage/hooks.ts
export { useToast } from '../../components/ui/toast-context'

// src/pages/CommunityPage/PostDetailPage.tsx
import { useToast } from '../../components/ui/toast-context'

// src/pages/CommunityPage/hooks.ts
export { useToast } from '../../components/ui/toast-context'

// src/pages/MapPage/tiles.tsx
import { useToast } from '../../components/ui/toast-context'
```

Leave `src/App.tsx` importing `ToastProvider` from `./components/ui/Toast`.

- [ ] **Step 5: Keep WelcomeHero suggestion data internal**

In `src/pages/AiPage/components/WelcomeHero.tsx`, change:

```ts
export interface Suggestion {
```

to:

```ts
interface Suggestion {
```

Change:

```ts
export const QUICK_SUGGESTIONS: Suggestion[] = [
```

to:

```ts
const QUICK_SUGGESTIONS: Suggestion[] = [
```

- [ ] **Step 6: Move `useMapPlaces` into a hook module**

Create `src/pages/MapPage/useMapPlaces.ts`:

```ts
import { useStore } from '../../store/useStore'
import { PLACES } from '../../data/mock'
import { enrichPlace, type PlaceRich } from './filter'

export type Place = PlaceRich

export function useMapPlaces(): Place[] {
  const city = useStore((state) => state.city)
  const storePlaces = useStore((state) => state.places)
  const raw = PLACES[city]
  return raw.map((place) => enrichPlace(storePlaces[place.id] ?? place, place.city))
}
```

In `src/pages/MapPage/components.tsx`, remove these imports:

```ts
import { PLACES } from '../../data/mock'
import { enrichPlace, type CategoryFilter, type SizeFilter, type PlaceRich } from './filter'
```

Replace them with:

```ts
import { type CategoryFilter, type SizeFilter, type PlaceRich } from './filter'
```

Delete the exported `useMapPlaces` function from `components.tsx`.

In `src/pages/MapPage/index.tsx`, change:

```ts
import { useMapPlaces, ListContent, type CategoryFilter, type SizeFilter, type Place } from './components'
```

to:

```ts
import { ListContent, type CategoryFilter, type SizeFilter, type Place } from './components'
import { useMapPlaces } from './useMapPlaces'
```

- [ ] **Step 7: Remove the unused catch parameter**

In `src/lib/ai.ts`, change:

```ts
    } catch (e) {
      throw new AiFetchError('AI 返回无法解析为 JSON')
    }
```

to:

```ts
    } catch {
      throw new AiFetchError('AI 返回无法解析为 JSON')
    }
```

- [ ] **Step 8: Verify lint is clean**

Run:

```bash
npm run lint
npm run test:regression
```

Expected:
- `npm run lint` exits 0 with no warnings.
- `npm run test:regression` exits 0.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/components/ui/toast-context.ts src/components/ui/Toast.tsx src/pages/AiPage/ChatView.tsx src/pages/SettingsPage/index.tsx src/pages/PetPage/actions.ts src/pages/PetPage/hooks.ts src/pages/CommunityPage/PostDetailPage.tsx src/pages/CommunityPage/hooks.ts src/pages/MapPage/tiles.tsx src/pages/AiPage/components/WelcomeHero.tsx src/pages/MapPage/useMapPlaces.ts src/pages/MapPage/components.tsx src/pages/MapPage/index.tsx src/lib/ai.ts
git commit -m "chore: resolve lint warnings"
```

## Task 3: Add GitHub Actions Quality Gate

**Files:**
- Create: `.github/workflows/quality.yml`
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add PR and main branch quality workflow**

Create `.github/workflows/quality.yml`:

```yaml
name: Quality

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Chromium
        run: npx playwright install --with-deps chromium

      - name: Run full quality suite
        run: npm run quality:full
```

- [ ] **Step 2: Make deploy run the production quality build**

In `.github/workflows/deploy.yml`, replace:

```yaml
      - name: Build
        run: npm run build
```

with:

```yaml
      - name: Quality checks and build
        run: npm run quality
```

- [ ] **Step 3: Validate workflow YAML locally with text checks**

Run:

```bash
Select-String -Path .github\workflows\quality.yml -Pattern "npm run quality:full"
Select-String -Path .github\workflows\deploy.yml -Pattern "npm run quality"
```

Expected:
- First command prints the `Run full quality suite` command line.
- Second command prints the `Quality checks and build` command line.

- [ ] **Step 4: Commit Task 3**

```bash
git add .github/workflows/quality.yml .github/workflows/deploy.yml
git commit -m "ci: add quality gate"
```

## Task 4: Add Browser Smoke Tests For The Current Demo Loop

**Files:**
- Create: `tests/e2e/core-loop.spec.ts`

- [ ] **Step 1: Add the core loop Playwright spec**

Create `tests/e2e/core-loop.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/pettrace-ai/ai')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('AI plan can jump to a highlighted map place', async ({ page }) => {
  await expect(page.getByText(/今天想带/)).toBeVisible()

  await page.getByPlaceholder('告诉AI你想去哪里...').click()
  await expect(page.getByText('PetTrace AI')).toBeVisible()

  await page.getByPlaceholder('告诉我你的目的地').fill('带金毛去上海玩一天，晚餐要室内可进')
  await page.getByRole('button', { name: '发送' }).click()

  const routeButton = page.getByRole('button', { name: /查看路线/ }).first()
  await expect(routeButton).toBeVisible()
  await routeButton.click()

  await expect(page).toHaveURL(/\/pettrace-ai\/map\?place=/)
  await expect(page.locator('[data-map-search]')).toBeVisible()
  await expect(page.getByPlaceholder('搜索宠物友好地点...')).toBeVisible()
})

test('community verification post can be created from the existing local data set', async ({ page }) => {
  await page.getByRole('tab', { name: '社区' }).click()
  await expect(page.getByRole('heading', { name: '社区' })).toBeVisible()

  await page.getByRole('button', { name: /发布验证/ }).click()
  await page.getByRole('button', { name: /打卡/ }).first().click()
  await page
    .getByPlaceholder('今天我也去了这家，带金毛室内坐不挤...')
    .fill('E2E 验证：现场规则清晰，牵绳即可进入户外区。')
  await page.getByRole('button', { name: '发布' }).click()

  await expect(page.getByText('发布成功')).toBeVisible()
  await expect(page.getByText(/E2E 验证/)).toBeVisible()
})

test('settings persist through LocalStorage hydration', async ({ page }) => {
  await page.getByRole('tab', { name: '设置' }).click()
  await expect(page.getByText('AI 服务')).toBeVisible()

  await page.locator('#api-key').fill('sk-e2e-local')
  await page.locator('#ai-model').fill('e2e-model')
  await page.waitForTimeout(500)
  await page.reload()

  await expect(page.locator('#api-key')).toHaveValue('sk-e2e-local')
  await expect(page.locator('#ai-model')).toHaveValue('e2e-model')
})
```

- [ ] **Step 2: Install the Chromium browser locally for Playwright**

Run:

```bash
npx playwright install chromium
```

Expected:
- Chromium browser is installed for local Playwright execution.
- Command exits 0.

- [ ] **Step 3: Run the E2E suite**

Run:

```bash
npm run test:e2e
```

Expected:
- Playwright starts the Vite dev server on port 5181.
- All 3 tests pass in Chromium.
- No app console error is required for this first pass; failures are evaluated by visible UI and URL assertions.

- [ ] **Step 4: Commit Task 4**

```bash
git add tests/e2e/core-loop.spec.ts
git commit -m "test: add core browser smoke coverage"
```

## Task 5: Add Bundle Size Observation

**Files:**
- Create: `scripts/bundle-report.mjs`

- [ ] **Step 1: Add bundle report script**

Create `scripts/bundle-report.mjs`:

```js
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = fileURLToPath(new URL('../dist', import.meta.url))

const budgets = {
  largestJsBytes: 700 * 1024,
  largestCssBytes: 120 * 1024,
  totalBytes: 3 * 1024 * 1024,
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${bytes} B`
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolute))
    } else if (entry.isFile()) {
      const info = await stat(absolute)
      files.push({
        path: relative(distDir, absolute).replaceAll('\\', '/'),
        ext: extname(entry.name),
        bytes: info.size,
      })
    }
  }
  return files
}

if (!existsSync(distDir)) {
  console.error('dist/ does not exist. Run npm run build before npm run bundle:report.')
  process.exit(1)
}

const files = await collectFiles(distDir)
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
const jsFiles = files.filter((file) => file.ext === '.js').sort((a, b) => b.bytes - a.bytes)
const cssFiles = files.filter((file) => file.ext === '.css').sort((a, b) => b.bytes - a.bytes)
const largestJs = jsFiles[0]
const largestCss = cssFiles[0]

console.log('Bundle report')
console.log(`Total dist size: ${formatBytes(totalBytes)}`)
if (largestJs) console.log(`Largest JS: ${largestJs.path} (${formatBytes(largestJs.bytes)})`)
if (largestCss) console.log(`Largest CSS: ${largestCss.path} (${formatBytes(largestCss.bytes)})`)
console.log('Largest files:')
for (const file of [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 12)) {
  console.log(`- ${file.path}: ${formatBytes(file.bytes)}`)
}

const failures = []
if (largestJs && largestJs.bytes > budgets.largestJsBytes) {
  failures.push(`largest JS ${formatBytes(largestJs.bytes)} exceeds ${formatBytes(budgets.largestJsBytes)}`)
}
if (largestCss && largestCss.bytes > budgets.largestCssBytes) {
  failures.push(`largest CSS ${formatBytes(largestCss.bytes)} exceeds ${formatBytes(budgets.largestCssBytes)}`)
}
if (totalBytes > budgets.totalBytes) {
  failures.push(`total dist size ${formatBytes(totalBytes)} exceeds ${formatBytes(budgets.totalBytes)}`)
}

if (failures.length > 0) {
  console.error('Bundle budget failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
```

- [ ] **Step 2: Verify bundle report after a build**

Run:

```bash
npm run build
npm run bundle:report
```

Expected:
- Build exits 0.
- Bundle report prints total dist size, largest JS, largest CSS, and the largest 12 files.
- Bundle report exits 0 under the initial budgets.

- [ ] **Step 3: Commit Task 5**

```bash
git add scripts/bundle-report.mjs
git commit -m "chore: add bundle size report"
```

## Task 6: Document And Run The Phase 1 Quality Gate

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add quality commands to README**

In `README.md`, after the quick start command block, add:

````md
## ✅ 质量检查

```bash
npm run lint             # oxlint 静态检查
npm run test:regression  # Node + SSR 回归脚本
npm run test:e2e         # Playwright 浏览器烟测
npm run build            # TypeScript + Vite 生产构建
npm run bundle:report    # dist 产物体积报告
npm run quality          # lint + regression + build + bundle report
npm run quality:full     # quality + Playwright E2E
```
````

- [ ] **Step 2: Run the full local verification suite**

Run:

```bash
npm run lint
npm run test:regression
npm run build
npm run bundle:report
npm run test:e2e
```

Expected:
- `npm run lint` exits 0 with no warnings.
- `npm run test:regression` exits 0.
- `npm run build` exits 0 and creates `dist/404.html`.
- `npm run bundle:report` exits 0.
- `npm run test:e2e` exits 0 with 3 passing tests.

- [ ] **Step 3: Check git status before final commit**

Run:

```bash
git status --short
```

Expected:
- Only Phase 1 files from this plan are modified or created.
- Any pre-existing unrelated user edits remain unstaged.

- [ ] **Step 4: Commit Task 6**

```bash
git add README.md
git commit -m "docs: document quality workflow"
```

## Final Verification

Run:

```bash
npm run quality:full
git status --short
```

Expected:
- `npm run quality:full` exits 0.
- `git status --short` shows no uncommitted Phase 1 files.
- Pre-existing unrelated user edits can remain visible and must not be reverted.

## Self-Review Notes

Spec coverage:
- Phase 1 CI gate is covered by Task 3.
- Current lint warning cleanup is covered by Task 2.
- Browser smoke coverage is covered by Task 4.
- Bundle-size observation is covered by Task 5.
- Development command documentation is covered by Task 6.

Intentional gaps:
- Store slicing starts in Phase 2, so it is not included here.
- AI gateway starts in Phase 3, so it is not included here.
- Desktop product layout starts in Phase 4, so it is not included here.
