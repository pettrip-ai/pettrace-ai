# 宠迹 AI — 移动端体验升级 · 实施计划

> 建议顺序：基础设施先行 → 页面逐张改造 → 收尾可访问性/性能。
> 每个任务独立可验证；优先修复"会造成连锁破坏"的结构性问题。

---

## [ ] Task 1: 建立设计令牌与组件基座（Design Tokens + UI 组件库）
- **Priority**: high
- **Depends On**: None
- **Description**:
  1. 统一 Tailwind 扩展：在 `tailwind.config.js` 中新增 `z.base/z.sticky/z.overlay/z.modal/z.popover/z.toast`；统一动画三档（200ms / 260ms / 320ms），缓动统一 `cubic-bezier(0.22, 1, 0.36, 1)`；统一阴影 `shallow/card/pop`；统一圆角 `card-18/pill-28/btn-14`；新增 `container.page` / `input.base` 等语义化类。
  2. 在 `src/components/ui/` 新建：`Button.tsx`、`Card.tsx`、`Chip.tsx`、`Input.tsx`、`Textarea.tsx`、`Badge.tsx`、`Avatar.tsx`、`EmptyState.tsx`、`Loading.tsx`（含 shimmer）。全部基于 Tailwind 类，支持 `variant` / `size` / `fullWidth` / `leadingIcon` / `trailingIcon`。
  3. 统一按压反馈：全局添加 `active:scale-[0.97] transition-transform duration-150` 的默认行为；主按钮额外 `shadow-pop`/深色渐变。
  4. 清理 `src/index.css` 中与 Tailwind 重复的自定义 `.ios-*` 类，将仍在用的语义平移到 Tailwind（例如 `.ios-btn-primary` → `variant="primary"`）；移除废弃的 bubble / chip 重复实现。
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-1.1: 新增组件可 import 使用、Props 完整、无 TS 错误（tsc -b 通过）。
  - `programmatic` TR-1.2: `index.css` 行数 ≤ 120（保留基础 reset + 字体 + 滚动行为）。
  - `human-judgement` TR-1.3: 打开任意页面，所有按钮有按压反馈，hover 样式一致。
- **Notes**: 不引入额外依赖（除非 radix-ui Dialog 作为 Task 2 的一部分）。

---

## [ ] Task 2: 统一 Toast / Dialog / Sheet 基础设施
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  1. 建立全局 Toast：`src/components/ui/ToastProvider.tsx` + `useToast()`，支持 `{ text, kind: 'ok' | 'info' | 'warn' | 'error', duration, onClose }`，stack 展示；在 App 根部注入；删除 MapPage/AiPage/CommunityPage/PetPage/SettingsPage 各自的本地 Toast（5 处）。
  2. 建立 ConfirmDialog / AlertDialog：基于 radix-ui/react-dialog（轻量 headless）或自建 headless，支持 title / description / confirmText / cancelText / danger / onConfirm；替代 `window.confirm`（目前在 PetPage、SettingsPage 有 4 处）。
  3. 建立 BottomSheet（移动端底部抽屉）`src/components/ui/Sheet.tsx`：基于 radix-ui Dialog，支持遮罩、下滑关闭、圆角、粘性 footer；用于社区发布、宠物新增、AI 清空确认。
  4. 建立 `src/components/ui/Modal.tsx`（居中桌面模式）。
- **Acceptance Criteria Addressed**: AC-3, AC-6
- **Test Requirements**:
  - `programmatic` TR-2.1: 5 处本地 Toast 全部移除，用全局 `useToast()`。
  - `programmatic` TR-2.2: 所有 `window.confirm` 全部替换为 ConfirmDialog。
  - `human-judgement` TR-2.3: 在社区发布、新增宠物、清空数据处分别触发，关闭路径完整。
- **Notes**: 建议引入 `@radix-ui/react-dialog` 和 `@radix-ui/react-slot`；体积很小（gzip 约 8KB）。

---

## [ ] Task 3: Store 持久化切片 + 代码分割 + Layout 优化（路由切换不闪烁）
- **Priority**: high
- **Depends On**: None
- **Description**:
  1. Store 持久化切片：`settings / pets / feeds / chat / city / highlight / showPetInChat` 各自独立 localStorage key（例如 `pettrace:settings`），hydrate 时并发；避免每次 set 都序列化整个 store。
  2. `App.tsx` 用 `React.lazy` + `Suspense` + `Loading` 组件，对 Map/Ai/Community/Pet/Settings 逐页拆包。
  3. Layout 不重建：当前 Layout 在 App.tsx 的 Route element 下，navigate 切换时 `<Outlet />` 重建 —— 将"路由层"从 Layout 外面挪到 Layout 里面，或用 `keep-alive` 思路：把地图包一层 Context + 缓存 map instance 于 store；AI 页的 scroll ref 也持久化。
  4. `main.tsx` 添加 `viewport-fit=cover`；`<meta name="theme-color">` 动态切换（按路由）。
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-3.1: `npm run build` gzip 后 JS ≤ 400KB。
  - `programmatic` TR-3.2: 路由从 map → ai → map，地图不重新 flyTo（center/zoom 保持）。
  - `human-judgement` TR-3.3: 真机切换 Tab，Header/TabBar 不闪烁、不重绘背景。
- **Notes**: React.lazy 不要包到 Layout；只包页面。

---

## [ ] Task 4: MapPage 重构（瓦片韧性 + Marker 缓存 + 手势 + Loading Skeleton + 我的位置）
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  1. 瓦片 fallback：维护数组 `OSM_TILE_CANDIDATES = [ {url:'https://tile-cn.openstreetmap.org/{z}/{x}/{y}.png', subdomains:'abc'}, ... ]`；第一个返回 200 就用；全部失败 → 显示统一 EmptyState + "瓦片加载失败，请稍后再试"。
  2. Marker icon 缓存：icon 用 `L.icon({ iconUrl, iconRetinaUrl, iconSize, iconAnchor, popupAnchor, className })` + lucide-react 的静态 SVG 预渲染为 dataURL 或使用 `L.divIcon` 但全局 `useMemo` 一次生成、所有同类 marker 复用。
  3. 瓦片 loading Skeleton：MapContainer 外层包一个 overlay，检测第一个 tile load 后淡出（监听 `zoomend` + 300ms 稳定态）。
  4. 手势：`L.Icon.Default` 改为 `touch-action: none`；全屏按钮 + 捏合缩放默认就有（Leaflet 原生）；移动端取消 `zoomControl`（已有），新增"定位到我的位置"按钮（navigator.geolocation.watchPosition）。
  5. 顶部筛选栏改为粘性吸顶（`sticky top-...`），水平滚动 chip 组统一用 Chip 组件。
  6. 删除 `forceUpdate` hack（MarkerNode 中 `[ , forceUpdate]`），改用 store 直接订阅。
  7. 底部浮动提示改为统一 Loading/EmptyState。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 离线时（DevTools 勾选 offline）打开地图，显示统一瓦片错误态，不白屏。
  - `human-judgement` TR-4.2: 真机捏合、双击、惯性、长按定位按钮都正常。
  - `programmatic` TR-4.3: wc -l src/pages/MapPage.tsx ≤ 300。
- **Notes**: 将 MapPage 内的 PlaceListPanel、MobileFilterPanel、MarkerNode、PlacePopup 拆到 `src/pages/MapPage/components/`。

---

## [ ] Task 5: AiPage 重构（打字机 + auto-resize + 滚动 + 组件化）
- **Priority**: medium
- **Depends On**: Task 1, Task 2
- **Description**:
  1. Textarea auto-resize：监听内容高度，动态 rows（min 1, max 6），与 ios-style 输入框统一。
  2. 打字机流式：AI reply 的 prose 逐字呈现（typewriter），同时 structured itinerary 卡片逐条出现（带 fade-up）。
  3. 滚动体验：容器 `overflow-y-auto snap-y`，新消息用 `scrollIntoView({ behavior: 'smooth', block: 'end' })`。
  4. 结构化行程卡片使用 Card 组件 + hover 按压反馈；空态 Quick Suggestions 用 Chip 组。
  5. 清空用 Sheet / ConfirmDialog。
  6. 页面文件拆至 ≤ 300 行：MessageBubble、ItineraryCard、QuickSuggestions、TypingIndicator 拆到子组件。
- **Acceptance Criteria Addressed**: AC-4, AC-7
- **Test Requirements**:
  - `human-judgement` TR-5.1: 真机 AI 回复打字机效果自然，输入框随内容变高。
  - `programmatic` TR-5.2: wc -l src/pages/AiPage.tsx ≤ 300。

---

## [ ] Task 6: CommunityPage + PetPage 重构（虚拟滚动 + Sheet 发布 + Dialog 编辑）
- **Priority**: medium
- **Depends On**: Task 1, Task 2
- **Description**:
  1. CommunityPage：Feed 列表用 react-window 的 `FixedSizeList`（或自实现 IntersectionObserver + 动态挂载）；1000 条也 60fps。发布用 Sheet；筛选用 Chip/Tab 统一。
  2. PetPage：新增/编辑宠物改用 Sheet；日期用 `<input type="date">` 替换 `prompt`；删除用 ConfirmDialog；顶部 sticky；卡片使用 Card。
  3. 两页文件拆至 ≤ 300 行。
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: mock 注入 1000 feed 后 DOM 数量不超过 300（虚拟滚动）。
  - `human-judgement` TR-6.2: 发布/新增/删除/清空 4 处交互无 alert/confirm 原生弹窗。
  - `programmatic` TR-6.3: wc -l 各自 ≤ 300。

---

## [ ] Task 7: SettingsPage 重构 + 全局 ARIA / 键盘 / 可访问性扫雷
- **Priority**: medium
- **Depends On**: Task 1, Task 2
- **Description**:
  1. SettingsPage section 卡片统一 Card；清空数据双重 ConfirmDialog；Mock 开关加描述。
  2. 全应用可访问性扫雷：
     - 所有 `<button>` 有文字或 aria-label；图标按钮 aria-label 完整。
     - 所有 `<input>` 有 `<label>` 或 `aria-label`。
     - 所有 Modal/Sheet/Drawer 打开时 trap focus，ESC 关闭。
     - TabBar 支持左右箭头切换、Enter 激活。
     - 路由切换时 `document.title` 更新。
     - 增加 `prefers-reduced-motion` 全局已有，继续保留。
  3. Tab bar 中间 AI 按钮增加 pulse 动画（`animate-tab-pop`），并在未激活时也有轻量 hover。
- **Acceptance Criteria Addressed**: AC-3, AC-6, AC-8
- **Test Requirements**:
  - `programmatic` TR-7.1: Lighthouse A11y 分数 ≥ 95。
  - `human-judgement` TR-7.2: 键盘 Tab 键 + Enter 可走主流程。

---

## [ ] Task 8: 收尾 — 性能加固 + PWA Manifest + 清理死代码
- **Priority**: low
- **Depends On**: Task 3, Task 4, Task 5, Task 6, Task 7
- **Description**:
  1. 添加图片 lazy load（目前仅 favicon）。
  2. 添加 PWA `manifest.webmanifest`、service-worker 生成（可选：Vite PWA 插件）。
  3. `index.html` 加 `theme-color`（动态）、apple-mobile-web-app-capable、apple-mobile-web-app-status-bar-style。
  4. 清理死代码（未使用 import、未引用的类型、废弃的函数如 `lastItinerary` / `detectFocus` 或确认保留）。
  5. `npm run build` 最终检查；oxlint 通过。
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-8.1: `npm run build` 成功、oxlint 0 error。
  - `human-judgement` TR-8.2: iOS Safari 添加到主屏幕有图标。

---

## 建议的执行顺序（DAG）
```
Task 1 ─┐
        ├──► Task 2 ─► Task 5 ──┐
Task 3 ─┤                        ├──► Task 7 ─► Task 8
        └──► Task 4 ─┐           │
                     └──► Task 6 ─┘
```
关键路径：1 → 2 → 4 → 6 → 7 → 8 （或并行 4 & 6）。
Task 3 最独立，可最先执行或与 Task 1 并行。
