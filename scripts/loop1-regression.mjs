import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

function createMemoryStorage() {
  const data = new Map()
  return {
    get length() {
      return data.size
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null
    },
    setItem(key, value) {
      data.set(key, String(value))
    },
    removeItem(key) {
      data.delete(key)
    },
    clear() {
      data.clear()
    },
  }
}

globalThis.localStorage = createMemoryStorage()

const server = await createServer({
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

const tests = []
function test(name, fn) {
  tests.push({ name, fn })
}

test('hydrating empty storage keeps exactly one default pet', async () => {
  localStorage.clear()
  const { useStore } = await server.ssrLoadModule('/src/store/useStore.ts')

  useStore.getState().hydrateFromStorage()

  const pets = useStore.getState().pets
  const defaultPets = pets.filter((pet) => pet.id === 'pet-default')
  assert.equal(defaultPets.length, 1)
  assert.equal(new Set(pets.map((pet) => pet.id)).size, pets.length)
})

test('care sheet save handler persists the submitted care task', async () => {
  const { createCareTaskSaveHandler } = await server.ssrLoadModule('/src/pages/PetPage/actions.ts')
  const calls = []
  const messages = []
  const handler = createCareTaskSaveHandler(
    (task) => calls.push(task),
    (message, options) => messages.push({ message, options }),
  )
  const task = {
    petId: 'pet-default',
    type: 'bath',
    lastDoneISO: '2026-07-02T12:00:00.000Z',
    intervalDays: 14,
  }

  handler(task)

  assert.deepEqual(calls, [task])
  assert.deepEqual(messages, [{ message: '已添加', options: { kind: 'ok' } }])
})

test('new pet sheet initializes birthday date input for mobile browsers', async () => {
  const { PetSheet } = await server.ssrLoadModule('/src/pages/PetPage/components/PetSheet.tsx')
  const html = renderToStaticMarkup(
    React.createElement(PetSheet, {
      open: true,
      onClose: () => {},
      initial: null,
      onSave: () => {},
    }),
  )

  assert.match(html, /type="date"[^>]*value="\d{4}-\d{2}-\d{2}"/)
  assert.match(html, /type="date"[^>]*max="\d{4}-\d{2}-\d{2}"/)
  assert.doesNotMatch(html, /type="date"[^>]*value=""/)
})

test('settings page renders editable AI service fields', async () => {
  const { default: SettingsPage } = await server.ssrLoadModule('/src/pages/SettingsPage/index.tsx')
  const html = renderToStaticMarkup(React.createElement(SettingsPage))

  assert.match(html, /id="api-key"/)
  assert.match(html, /id="ai-base-url"/)
  assert.match(html, /id="ai-model"/)
})

test('community city labels use Chengdu for chengdu places', async () => {
  const constants = await server.ssrLoadModule('/src/pages/CommunityPage/constants.ts')
  assert.equal(constants.CITY_NAMES.chengdu, '成都')
  assert.equal(constants.CITY_TABS.find((tab) => tab.key === 'chengdu')?.label, '成都')

  const { FeedCard } = await server.ssrLoadModule('/src/pages/CommunityPage/components/FeedCard.tsx')
  const html = renderToStaticMarkup(
    React.createElement(FeedCard, {
      feed: {
        id: 'feed-1',
        placeId: 'chengdu-2',
        type: '游记',
        text: '周末散步',
        whenISO: '2026-07-02T12:00:00.000Z',
        byUser: '成都法斗',
        likes: 0,
      },
      placesById: {
        'chengdu-2': {
          id: 'chengdu-2',
          name: '浣花溪公园',
          city: 'chengdu',
          address: '青羊区青华路',
        },
      },
      onLike: () => {},
      onUnlike: () => {},
      onVerify: () => {},
      onNavigateMap: () => {},
    }),
  )

  assert.match(html, /成都/)
  assert.doesNotMatch(html, /深圳/)
})

test('design tokens expose the runtime aliases used by components', async () => {
  const css = await readFile(new URL('../src/tokens.css', import.meta.url), 'utf8')
  const requiredTokens = [
    '--color-primary-container',
    '--color-primary',
    '--color-accent',
    '--color-warning',
    '--color-error',
    '--color-on-surface',
    '--color-muted-foreground',
    '--color-on-surface-variant',
    '--color-outline',
    '--color-outline-variant',
    '--pettrace-coral',
    '--pettrace-mint',
    '--pettrace-error',
    '--pettrace-honey',
    '--danger',
    '--line-height-caption',
  ]

  for (const token of requiredTokens) {
    assert.ok(css.includes(`${token}:`), `${token} should be defined in tokens.css`)
  }
})

test('toast tones use explicit readable color pairs instead of unsupported opacity modifiers', async () => {
  const source = await readFile(new URL('../src/components/ui/Toast.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /bg-\[color:var\([^)]+\)\]\/\d+/)

  for (const token of [
    '--pettrace-coral-50',
    '--pettrace-coral-800',
    '--pettrace-mint-50',
    '--pettrace-mint-800',
    '--pettrace-error-50',
    '--pettrace-error-800',
    '--pettrace-honey-50',
    '--pettrace-honey-800',
  ]) {
    assert.ok(source.includes(token), `${token} should be used by Toast tones`)
  }
})

test('sheet components render dialog semantics when open', async () => {
  const { Sheet } = await server.ssrLoadModule('/src/components/ui/Sheet.tsx')
  const sheetHtml = renderToStaticMarkup(
    React.createElement(Sheet, {
      open: true,
      onClose: () => {},
      title: '新增护理',
    }, React.createElement('p', null, 'content')),
  )

  assert.match(sheetHtml, /role="dialog"/)
  assert.match(sheetHtml, /aria-modal="true"/)
  assert.match(sheetHtml, /aria-labelledby=/)

  const { ActionSheet } = await server.ssrLoadModule('/src/components/ui/ActionSheet.tsx')
  const actionSheetHtml = renderToStaticMarkup(
    React.createElement(ActionSheet, {
      open: true,
      onClose: () => {},
      actionSheetProps: {
        title: '清空所有数据？',
        description: '操作不可恢复。',
        cancelText: '再想想',
        actions: [{ label: '确认清空所有数据', variant: 'destructive' }],
      },
    }),
  )

  assert.match(actionSheetHtml, /role="dialog"/)
  assert.match(actionSheetHtml, /aria-modal="true"/)
  assert.match(actionSheetHtml, /aria-labelledby=/)
  assert.match(actionSheetHtml, /aria-describedby=/)
})

test('primary mobile actions meet a 44px touch target floor', async () => {
  const indexCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(indexCss, /\.chat-send\s*{[\s\S]*width:\s*44px/)
  assert.match(indexCss, /\.chat-send\s*{[\s\S]*height:\s*44px/)
  assert.match(indexCss, /\.chat-send\s*{[\s\S]*min-width:\s*44px/)

  const mapSource = await readFile(new URL('../src/pages/MapPage/index.tsx', import.meta.url), 'utf8')
  assert.match(mapSource, /className="w-11 h-11/)
  assert.match(mapSource, /const mapToolHitClass = 'w-11 h-11 p-1/)

  const { FeedCard } = await server.ssrLoadModule('/src/pages/CommunityPage/components/FeedCard.tsx')
  const html = renderToStaticMarkup(
    React.createElement(FeedCard, {
      feed: {
        id: 'feed-2',
        placeId: 'shanghai-1',
        type: '打卡',
        text: '适合散步',
        whenISO: '2026-07-02T12:00:00.000Z',
        byUser: '豆豆妈妈',
        likes: 3,
      },
      placesById: {
        'shanghai-1': {
          id: 'shanghai-1',
          name: '静安公园',
          city: 'shanghai',
          address: '南京西路',
        },
      },
      onLike: () => {},
      onUnlike: () => {},
      onVerify: () => {},
      onNavigateMap: () => {},
    }),
  )

  assert.match(html, /<button[^>]*min-h-11[^>]*aria-label="点赞"/)
  assert.match(html, /<button[^>]*w-11[^>]*aria-label="收藏"/)
})

test('feed bookmarks persist and expose pressed state', async () => {
  const { useStore } = await server.ssrLoadModule('/src/store/useStore.ts')
  useStore.getState().addFeed({
    id: 'feed-bookmark-regression',
    placeId: 'shanghai-1',
    type: '打卡',
    text: '收藏回归测试',
    byUser: '测试用户',
    likes: 0,
  })

  useStore.getState().bookmarkFeed('feed-bookmark-regression')
  assert.equal(
    useStore.getState().feeds.find((feed) => feed.id === 'feed-bookmark-regression')?.bookmarkedByMe,
    true,
  )

  useStore.getState().unbookmarkFeed('feed-bookmark-regression')
  assert.equal(
    useStore.getState().feeds.find((feed) => feed.id === 'feed-bookmark-regression')?.bookmarkedByMe,
    false,
  )

  const { FeedCard } = await server.ssrLoadModule('/src/pages/CommunityPage/components/FeedCard.tsx')
  const html = renderToStaticMarkup(
    React.createElement(FeedCard, {
      feed: {
        id: 'feed-3',
        placeId: 'shanghai-1',
        type: '打卡',
        text: '适合收藏',
        whenISO: '2026-07-02T12:00:00.000Z',
        byUser: '豆豆妈妈',
        likes: 3,
        bookmarkedByMe: false,
      },
      placesById: {
        'shanghai-1': {
          id: 'shanghai-1',
          name: '静安公园',
          city: 'shanghai',
          address: '南京西路',
        },
      },
      onLike: () => {},
      onUnlike: () => {},
      onBookmark: () => {},
      onUnbookmark: () => {},
      onVerify: () => {},
      onNavigateMap: () => {},
    }),
  )

  assert.match(html, /aria-label="收藏"/)
  assert.match(html, /aria-pressed="false"/)
})

test('known dead buttons have explicit handlers or feedback paths', async () => {
  const chatView = await readFile(new URL('../src/pages/AiPage/ChatView.tsx', import.meta.url), 'utf8')
  assert.match(chatView, /function handleAttachmentClick/)
  assert.match(chatView, /function toggleSaved/)
  assert.match(chatView, /onClick=\{handleAttachmentClick\}/)
  assert.match(chatView, /aria-pressed=\{saved\}/)

  const postDetail = await readFile(new URL('../src/pages/CommunityPage/PostDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(postDetail, /const handleShare/)
  assert.match(postDetail, /const handleCheckIn/)
  assert.match(postDetail, /onClick=\{handleShare\}/)
  assert.match(postDetail, /onCheckIn=\{handleCheckIn\}/)
})

test('pwa assets are base-path safe and service worker does not pin stale runtime code', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))
  assert.equal(manifest.start_url, './')
  assert.equal(manifest.scope, './')
  for (const icon of manifest.icons) {
    assert.ok(!icon.src.startsWith('/'), `icon ${icon.src} should be relative`)
  }

  const sw = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')
  assert.match(sw, /CACHE_NAME = 'pettrace-ai-v4'/)
  assert.match(sw, /STATIC_ASSETS/)
  assert.match(sw, /cache\.addAll/)
  assert.match(sw, /event\.request\.method !== 'GET'/)
  assert.match(sw, /cache\.put/)
  assert.match(sw, /event\.request\.mode === 'navigate'/)
  assert.match(sw, /request\.destination === 'script'/)
  assert.doesNotMatch(sw, /caches\.match\(event\.request\)[\s\S]{0,160}if \(cached\) return cached/)

  const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8')
  assert.match(main, /import\.meta\.env\.BASE_URL/)
  assert.match(main, /import\.meta\.env\.PROD[\s\S]*serviceWorker/)
  assert.match(main, /import\.meta\.env\.DEV[\s\S]*getRegistrations/)
  assert.doesNotMatch(main, /register\('\/pettrace-ai\/sw\.js'\)/)

  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(html, /%BASE_URL%manifest\.webmanifest/)
  assert.doesNotMatch(html, /fonts\.googleapis\.com/)

  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /fonts\.googleapis\.com/)
})

test('community feed images include async decoding and intrinsic dimensions', async () => {
  const feedCard = await readFile(new URL('../src/pages/CommunityPage/components/FeedCard.tsx', import.meta.url), 'utf8')
  assert.match(feedCard, /decoding="async"/)
  assert.match(feedCard, /width=\{640\}/)
  assert.match(feedCard, /height=\{360\}/)
})

test('mobile layout avoids zoom lock and duplicate fixed map layers', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.doesNotMatch(html, /user-scalable=no/)
  assert.doesNotMatch(html, /maximum-scale=1/)

  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /background-attachment:\s*fixed/)
  assert.doesNotMatch(css, /position:\s*fixed;\s*[\s\S]*background-image:/)

  const mapSource = await readFile(new URL('../src/pages/MapPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(mapSource, /<MapListFloat/)
  assert.match(mapSource, /onOpenList/)
})

test('bottom sheets keep action footers inside the simulated phone screen', async () => {
  const sheet = await readFile(new URL('../src/components/ui/Sheet.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(sheet, /70dvh/)
  assert.match(sheet, /height: isFullScreen \? '100%' : 'min\(86%, calc\(100% - max\(16px, var\(--sat, 0px\)\)\)\)'/)
  assert.match(sheet, /boxSizing: 'border-box'/)
  assert.match(sheet, /data-sheet-footer/)
  assert.doesNotMatch(sheet, /position: 'sticky'/)

  const petSheet = await readFile(new URL('../src/pages/PetPage/components/PetSheet.tsx', import.meta.url), 'utf8')
  assert.match(petSheet, /className="flex-1 h-11/)

  const careSheet = await readFile(new URL('../src/pages/PetPage/components/CareAddSheet.tsx', import.meta.url), 'utf8')
  assert.match(careSheet, /className="flex-1 h-11/)
})

test('ai chat itinerary view fits phone safe areas and resolves real place cards', async () => {
  const aiPage = await readFile(new URL('../src/pages/AiPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(aiPage, /minHeight:\s*'100dvh'/)
  assert.match(aiPage, /h-full min-h-0 overflow-hidden/)

  const chatView = await readFile(new URL('../src/pages/AiPage/ChatView.tsx', import.meta.url), 'utf8')
  assert.match(chatView, /className="flex flex-col h-full min-h-0 w-full overflow-hidden"/)
  assert.match(chatView, /data-ai-chat-header/)
  assert.match(chatView, /paddingTop: 'calc\(var\(--sat, 0px\) \+ 10px\)'/)
  assert.match(chatView, /className="flex-1 min-h-0 overflow-y-auto no-scrollbar"/)
  assert.match(chatView, /overscrollBehavior: 'contain'/)
  assert.match(chatView, /data-ai-chat-suggestions/)
  assert.match(chatView, /data-ai-chat-composer/)
  assert.match(chatView, /minHeight: 44/)
  assert.match(chatView, /function findPlaceById/)
  assert.match(chatView, /placeNameOf\(city, p\.placeId/)
  assert.doesNotMatch(chatView, /name:\s*p\.name\s*\?\?\s*p\.place\s*\?\?\s*'推荐地点'/)
})

test('app shell applies top safe area globally while map controls avoid the notch', async () => {
  const appLayout = await readFile(new URL('../src/layouts/AppLayout.tsx', import.meta.url), 'utf8')
  assert.match(appLayout, /const isMapRoute = location\.pathname === '\/map'/)
  assert.match(appLayout, /const isChatRoute = location\.pathname === '\/ai\/chat'/)
  assert.match(appLayout, /const needsTopInset = !isMapRoute && !isChatRoute/)
  assert.match(appLayout, /paddingTop: needsTopInset \? 'var\(--sat, 0px\)' : 0/)
  assert.match(appLayout, /boxSizing: 'border-box'/)
  assert.match(appLayout, /className="flex flex-col w-full min-h-0"/)

  const community = await readFile(new URL('../src/pages/CommunityPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(community, /paddingTop:\s*'calc\(var\(--sat/)

  const pet = await readFile(new URL('../src/pages/PetPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(pet, /paddingTop:\s*'calc\(var\(--sat/)

  const settings = await readFile(new URL('../src/pages/SettingsPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(settings, /paddingTop:\s*'calc\(var\(--sat/)

  const mapPage = await readFile(new URL('../src/pages/MapPage/index.tsx', import.meta.url), 'utf8')
  assert.match(mapPage, /data-map-controls/)
  assert.match(mapPage, /data-map-search/)
  assert.match(mapPage, /data-map-categories/)
  assert.match(mapPage, /className="fixed z-\[820\] flex flex-col/)
  assert.match(mapPage, /top: 'calc\(var\(--sat, 0px\) \+ 140px\)'/)
  assert.match(mapPage, /right: 'max\(16px, var\(--sar, 0px\)\)'/)
  assert.match(mapPage, /left: 'max\(16px, var\(--sal, 0px\)\)'/)
  assert.match(mapPage, /top: 'calc\(var\(--sat, 0px\) \+ 12px\)'/)
  assert.match(mapPage, /top: 'calc\(var\(--sat, 0px\) \+ 70px\)'/)
  assert.doesNotMatch(mapPage, /top: 'calc\(var\(--sat, 0px\) \+ 124px\)'/)
  assert.doesNotMatch(mapPage, /top: 'calc\(var\(--sat\) \+ 4px\)'/)
  assert.doesNotMatch(mapPage, /top: 'calc\(52px \+ var\(--sat\)\)'/)
})

test('map overlays use compact visual controls without native horizontal scrollbars', async () => {
  const mapPage = await readFile(new URL('../src/pages/MapPage/index.tsx', import.meta.url), 'utf8')
  assert.match(mapPage, /const mapToolHitClass = 'w-11 h-11 p-1/)
  assert.match(mapPage, /const mapToolFaceClass = 'w-9 h-9 rounded-lg/)
  assert.match(mapPage, /<Plus size=\{15\}/)
  assert.match(mapPage, /<Minus size=\{15\}/)
  assert.match(mapPage, /<MapPin size=\{15\}/)
  assert.match(mapPage, /data-map-nearby/)
  assert.match(mapPage, /overflow-x-auto no-scrollbar overscroll-x-contain/)
  assert.match(mapPage, /paddingLeft: 'max\(0px, var\(--sal, 0px\)\)'/)
  assert.match(mapPage, /paddingRight: 'max\(0px, var\(--sar, 0px\)\)'/)
  assert.doesNotMatch(mapPage, /boxShadow: '0 2px 12px rgba\(84,49,31,0\.1\)'/)
})

test('map category chips stay compact and selected nearby cards keep a full border', async () => {
  const mapPage = await readFile(new URL('../src/pages/MapPage/index.tsx', import.meta.url), 'utf8')
  const mapComponents = await readFile(new URL('../src/pages/MapPage/components.tsx', import.meta.url), 'utf8')

  assert.match(mapPage, /const mapCategoryChipClass = 'shrink-0 h-8 px-3\.5 rounded-full text-\[12px\]/)
  assert.match(mapPage, /className=\{clsx\(\s*mapCategoryChipClass,/)
  assert.doesNotMatch(mapPage, /shrink-0 h-9 px-4/)
  assert.doesNotMatch(mapPage, /shrink-0 h-11 px-4 rounded-full text-\[13px\]/)
  assert.match(mapComponents, /shrink-0 h-8 px-3\.5 rounded-full text-\[12px\]/)
  assert.doesNotMatch(mapComponents, /shrink-0 h-8 px-4 rounded-full text-\[13px\]/)

  assert.match(mapPage, /data-place-card-active=\{highlightId === p\.id \? 'true' : 'false'\}/)
  assert.match(mapPage, /outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary/)
  assert.match(mapPage, /highlightId === p\.id\s*\?\s*'border-primary shadow-\[0_10px_24px_rgba\(84,49,31,0\.08\),inset_0_0_0_1px_rgba\(247,107,122,0\.45\)\]'/)
  assert.match(mapPage, /:\s*'border-\[rgba\(255,255,255,0\.6\)\] shadow-card'/)
  assert.doesNotMatch(mapPage, /ring-2 ring-primary/)

  assert.match(mapComponents, /data-place-list-card-active=\{highlightId === p\.id \? 'true' : 'false'\}/)
  assert.match(mapComponents, /outline-none focus:outline-none focus-visible:outline-none focus-visible:border-primary/)
  assert.match(mapComponents, /highlightId === p\.id\s*\?\s*'border-primary shadow-\[0_10px_24px_rgba\(84,49,31,0\.08\),inset_0_0_0_1px_rgba\(247,107,122,0\.45\)\]'/)
  assert.match(mapComponents, /:\s*'border-\[rgba\(255,255,255,0\.6\)\] shadow-card'/)
  assert.doesNotMatch(mapComponents, /ring-2 ring-primary/)
})

test('mobile tab bar avoids default focus rectangles while keeping keyboard focus visible', async () => {
  const appLayout = await readFile(new URL('../src/layouts/AppLayout.tsx', import.meta.url), 'utf8')
  assert.match(appLayout, /className="mobile-tab-link"/)
  assert.match(appLayout, /className="mobile-ai-tab-button"/)

  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(css, /\.mobile-tab-link,\s*\.mobile-ai-tab-button\s*{[\s\S]*outline:\s*none/)
  assert.match(css, /\.mobile-tab-link:focus,\s*\.mobile-ai-tab-button:focus\s*{[\s\S]*outline:\s*none/)
  assert.match(css, /\.mobile-tab-link:focus-visible,\s*\.mobile-ai-tab-button:focus-visible\s*{[\s\S]*outline:\s*2px solid var\(--primary\)/)
  assert.match(css, /-webkit-tap-highlight-color:\s*transparent/)
})

test('community post sheet uses the shared safe-area sheet footer instead of viewport clamps', async () => {
  const postSheet = await readFile(new URL('../src/pages/CommunityPage/components/PostSheet.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(postSheet, /70dvh/)
  assert.doesNotMatch(postSheet, /!max-h-\[70dvh\]/)
  assert.match(postSheet, /<Sheet[\s\S]{0,120}open=\{open\}[\s\S]{0,120}onClose=\{onClose\}[\s\S]{0,120}title="选择发布类型"/)
  assert.match(postSheet, /footer=\{/)
  assert.match(postSheet, /className="w-full h-11 rounded-full flex items-center justify-center text-sm font-semibold"/)
  assert.match(postSheet, /className="flex-1 h-11 rounded-full flex items-center justify-center text-sm font-medium"/)
  assert.doesNotMatch(postSheet, /<div style=\{\{ borderTop: '0\.5px solid var\(--border\)', marginTop: 6 \}\}>/)
})

test('primary tab pages share background rhythm and ai planner remains scrollable', async () => {
  const pet = await readFile(new URL('../src/pages/PetPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(pet, /className="pet-bg/)
  assert.match(pet, /className="min-h-full h-full w-full overflow-y-auto bg-bg px-4 md:px-5 pt-3 md:pt-4 pb-28"/)

  const settings = await readFile(new URL('../src/pages/SettingsPage/index.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(settings, /className="pet-bg/)
  assert.match(settings, /className="min-h-full h-full w-full overflow-y-auto bg-bg px-4 md:px-5 pt-3 md:pt-4 pb-28 space-y-5"/)

  const planner = await readFile(new URL('../src/pages/AiPage/Planner.tsx', import.meta.url), 'utf8')
  assert.match(planner, /className="h-full min-h-0 overflow-y-auto bg-bg"/)
  assert.match(planner, /paddingBottom: 'calc\(150px \+ var\(--sab, 0px\)\)'/)
  assert.match(planner, /className="flex flex-col px-4 pt-3"/)
  assert.match(planner, /className="flex items-center justify-between pb-3"/)
  assert.doesNotMatch(planner, /paddingBottom: 170/)
  assert.doesNotMatch(planner, /pt-6/)
  assert.doesNotMatch(planner, /py-3/)

  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /\.pet-bg::after/)
  assert.doesNotMatch(css, /repeating-linear-gradient/)
})

let failures = 0
try {
  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`PASS ${name}`)
    } catch (error) {
      failures += 1
      console.error(`FAIL ${name}`)
      console.error(error?.stack || error)
    }
  }
} finally {
  await server.close()
}

if (failures > 0) {
  process.exitCode = 1
}
