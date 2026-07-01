# 宠迹 AI — 移动端体验全方位升级 · 产品需求文档

## Overview
- **Summary**: 对已有的 Vite + React + Tailwind 移动端应用「宠迹 AI」进行一次彻底的全栈审查与升级，覆盖**性能、交互、样式、架构、可访问性**五大维度。目标是从"能跑的 Demo"升级为真正**接近小程序 / App 级别的精致移动端体验**，并确立一条可持续演进的技术基线，杜绝"修这里坏那里"的恶性循环。
- **Purpose**: 解决当前项目存在的"局部修修补补 → 新问题暴露 → 再修补"的无限循环，一次性系统性地收敛问题、分层拆解、按模块交付，让最终产物可稳定运行、可长期迭代。
- **Target Users**: 移动端携宠出行爱好者（主场景 iPhone / Android 浏览器），同时保留桌面端作为"开发者/预览"辅助形态。

## Goals
- **G1 性能基线**：地图切换不再卡顿；社区 Feed 超过 100 条仍丝滑；Bundle 首屏 < 400KB；路由切换 < 150ms。
- **G2 交互质感**：所有按钮有按压反馈；导航切换不闪烁；地图手势符合移动端预期；表单/弹窗体验比肩主流小程序。
- **G3 设计系统统一**：建立唯一的设计源（Tailwind tokens + 原子类 + 组件库），删除重复/不一致的 CSS 自定义样式。
- **G4 架构分层**：页面文件拆到 ≤300 行；共享组件库；Toast/Modal/Dialog 统一；Store 切片持久化。
- **G5 瓦片与地图可用**：提供中国大陆友好的 OSM 瓦片 fallback，明确加载中/加载失败状态。
- **G6 可访问性与韧性**：全键盘可用；ARIA 标签完整；ErrorBoundary 真正可恢复；所有 Toast 有语义与倒计时。

## Non-Goals (Out of Scope)
- 不迁移到小程序（Taro / uni-app）—— 仍保持 SPA；未来可按需加 PWA。
- 不引入新的大型 UI 库（如 Ant Mobile / NutUI）—— 继续走 Tailwind + 自建组件的路线。
- 不做后端重构 —— 所有 AI 仍通过 OpenAI 兼容协议 + Mock。
- 不新增业务功能（如"收藏夹/路线保存"等）—— 本次聚焦现有功能的体验升级。
- 不做数据 schema 破坏性变更。

## Background & Context
当前项目：Vite 8 + React 19 + TS 6 + Tailwind 3.4 + react-router-dom 7 + zustand 5 + react-leaflet 5 + lucide-react + date-fns + Fuse.js；页面 5 个（map/ai/community/pet/settings）；Layout 为 Mobile 一套 + Desktop 一套。
核心历史债务：
- 每个页面都是 500-800 行的巨型单文件；弹窗、Toast、Hook 都内联在页面里。
- Toast 重复 4 次（MapPage/AiPage/CommunityPage/PetPage/SettingsPage 各有各的实现）。
- iOS-style CSS 工具类（`.ios-btn` / `.ios-card` ...）与 Tailwind 并行、重复表达同一语义。
- Leaflet 地图无手势优化；Marker icon 每个都用 renderToStaticMarkup 生成 SVG；无代码分割。
- 地图瓦片用 openstreetmap.org，中国大陆不稳定。
- 表单用 `alert` / `confirm`，移动端粗糙。
- 路由切换时整个 `<Outlet />` 被卸载重建，地图销毁、状态丢失、滚动位置重置。
- 导航 Tab bar、Header 与内容区之间有 z-index 魔法数字（80 / 800 / 900 / 1000），没有建立图层规范。
- 没有任何 loading/skeleton 状态，空态/错误态提示风格不一致。

## Functional Requirements

### 架构 & 组件化
- **FR-A1**: 抽出 `src/components/ui/` 原子组件：`Button` / `Card` / `Chip` / `Input` / `Textarea` / `Dialog` / `Sheet`（底部抽屉） / `Toast` / `Badge` / `Avatar` / `EmptyState` / `Loading`。
- **FR-A2**: 页面文件控制在 ≤ 300 行；将 Hook、Modal、Section 拆到 `src/pages/<Page>/components`、`src/pages/<Page>/hooks`。
- **FR-A3**: 统一 Toast 为全局单例（通过 context/provider 或 hook），支持堆叠、自动消失、可关闭。
- **FR-A4**: 统一 Dialog/Modal/Sheet：使用 radix-ui/react-dialog 或自建 headless 实现；所有弹窗带淡入、背景遮罩、ESC 关闭、点击遮罩关闭。
- **FR-A5**: 统一确认弹窗替代 `alert` / `confirm`，带主/次按钮、危险操作红按钮。
- **FR-A6**: 路由不重新挂载 Layout（navigate 切换时 Header/TabBar 保持）；保留地图页面状态（地图不要每次重建）。

### 地图（MapPage）专项
- **FR-M1**: 地图瓦片按顺序尝试（osm-cdn → 3A 瓦片 → 离线/本地 fallback）；各瓦片 CDN 可配置。
- **FR-M2**: 瓦片加载 Skeleton（shimmer）。
- **FR-M3**: Marker icon 使用 `L.icon` + 预渲染 PNG（或缓存化 SVG 字符串），避免每次 renderToStaticMarkup。
- **FR-M4**: 移动端地图手势优化：惯性、捏合、双击缩放、长按我的位置（使用 `leaflet-touch` / `leaflet-fullscreen` 或轻量补丁）。
- **FR-M5**: 顶部筛选栏改为横向可滚动 chip 组 + 粘性吸顶，不遮挡内容。
- **FR-M6**: 增加"我的位置"按钮（watchPosition，浏览器原生 geolocation）。
- **FR-M7**: 空态覆盖层保留但视觉与 EmptyState 组件统一。
- **FR-M8**: 地图状态持久化（center, zoom），切换回来时不 flyTo 重新动画。

### AI 规划（AiPage）专项
- **FR-I1**: 输入框自动增高（根据内容自适应 rows 1→6）。
- **FR-I2**: AI Typing 状态改为逐字流式 / 打字机效果。
- **FR-I3**: 消息列表滚动容器 `overflow` + `scroll-snap`，新消息自动滚到底部（用 `useEffect` + `scrollIntoView({ behavior: 'smooth', block: 'end' })`）。
- **FR-I4**: 结构化行程卡片可左右滑动，每个卡片有轻量 hover / 按压反馈。
- **FR-I5**: 清空确认改为 Dialog。

### 社区（CommunityPage）专项
- **FR-C1**: Feed 列表使用虚拟滚动（`react-window` 或自实现 IntersectionObserver）超过 100 条不再一次性渲染。
- **FR-C2**: 发布按钮点击底部弹出 Sheet（带背景遮罩），与 PetPage 新增弹窗样式统一。
- **FR-C3**: 发布 Sheet 内容区域可滚动，底部按钮区 sticky。
- **FR-C4**: 空态卡片使用统一 EmptyState。

### 档案（PetPage）专项
- **FR-P1**: 宠物卡片网格/移动端单列 + 移动端大按钮按压反馈。
- **FR-P2**: 新增 / 编辑宠物统一 Dialog（底部 Sheet 或居中 Modal，移动端倾向 Sheet）。
- **FR-P3**: 护理日程编辑上次日期改用原生 `<input type="date">` 而非 `prompt`。
- **FR-P4**: 危险操作（删除）统一 ConfirmDialog（红按钮）。
- **FR-P5**: 顶部导航 sticky。

### 设置（SettingsPage）专项
- **FR-S1**: 每个 section 卡片圆角/阴影统一样式 token。
- **FR-S2**: Mock / API 切换带描述提示。
- **FR-S3**: 危险操作"清空所有本地数据"使用 ConfirmDialog（双重确认）。

### 全局体验
- **FR-G1**: 统一按压反馈：`active:scale-[0.97]` + 阴影微缩小（为每个组件提供默认行为）。
- **FR-G2**: 动画统一缓动：`cubic-bezier(0.22, 1, 0.36, 1)` 为主；时长 200/260/320ms 三档。
- **FR-G3**: 增加 `z-index` 令牌：`z-base / z-dropdown / z-sticky / z-overlay / z-modal / z-popover / z-toast`。
- **FR-G4**: 统一 loading / shimmer / skeleton 动画 token。
- **FR-G5**: 全局滚动容器统一 `overscroll-behavior-y: contain` + 禁止 body 双指缩放（已有 touch-action，但需加强）。
- **FR-G6**: 代码分割：每个页面用 `React.lazy` + `Suspense`。
- **FR-G7**: Store 持久化切片：settings / pets / feeds / chat 各自独立 key；hydrate 时并发。
- **FR-G8**: 所有输入框 autofill-friendly；`name` / `autocomplete` 属性齐全；focus 样式统一。
- **FR-G9**: 移除未使用 / 与 Tailwind 重复的 `.ios-*` 自定义 CSS 类（保留可平移到 Tailwind 的样式）。
- **FR-G10**: PWA manifest + theme-color + 桌面图标占位。

## Non-Functional Requirements
- **NFR-1 性能**: LCP < 1.5s（真机 4G）。
- **NFR-2 Bundle**: gzip 后 JS ≤ 400KB。
- **NFR-3 可访问性**: WAI-ARIA A 级，键盘导航可完成核心流程（查看地图、切换 Tab、新增宠物）。
- **NFR-4 跨平台**: iOS Safari / Chrome Android 稳定；桌面端 1280px 布局不破坏。
- **NFR-5 内存**: 社区 Feed 1000 条不崩溃（虚拟滚动）。
- **NFR-6 可测试性**: 核心 UI 组件单元测试 + 至少一个 E2E 流程（Playwright）。

## Constraints
- **技术**: Vite + React 19 + TS 6 + Tailwind 3.4；不引入重量级 UI 库；不做 PWA 后端。
- **业务**: 数据 schema 不变（Place / Pet / Feed / CareTask）；localStorage key `pettrace:*` 不变。
- **时间**: 以"一周内可交付"为上限（1 人）。

## Assumptions
- 用户主要使用 iOS Safari / Chrome（真机测试优先）。
- OpenStreetMap 瓦片在中国大陆可通过 cdn 替代；备选方案够用。
- 不添加网络层（fetch 缓存 / request dedup）—— 本轮只做前端。
- 可引入轻量依赖（radix-ui/react-dialog 若要、react-window 若要、leaflet.touch 若要）。

## Acceptance Criteria

### AC-1: 性能基线达成
- **Given**: 冷启动 / 硬刷新
- **When**: 打开应用
- **Then**: 首屏 LCP < 1.5s；JS bundle gzip ≤ 400KB；路由切换无白屏闪烁
- **Verification**: `programmatic` (lighthouse + vite-bundle-visualizer)

### AC-2: 地图手势与瓦片韧性
- **Given**: 中国大陆网络环境
- **When**: 打开地图
- **Then**: 加载成功（任一瓦片源）；加载中呈现 shimmer；失败呈现统一错误态；捏合/双击/惯性工作正常
- **Verification**: `human-judgment`（真机交互）+ `programmatic`（离线注入 tile 错误）

### AC-3: 统一 Design System
- **Given**: 任意一个新组件
- **When**: 开发者使用 Button / Card / Dialog / Toast / Sheet
- **Then**: 全局只有一套实现，无重复 CSS；按压/动画/阴影/圆角来自同一个 token
- **Verification**: `human-judgment`（代码审查 + Tailwind inspector 目视）

### AC-4: 页面文件大小收敛
- **Given**: 代码库
- **When**: 统计每个页面 .tsx 行数
- **Then**: 每个页面主文件 ≤ 300 行；共享组件集中在 src/components/ui
- **Verification**: `programmatic`（脚本 wc -l）

### AC-5: 社区 Feed 大数据不崩
- **Given**: 注入 1000 条 mock feed
- **When**: 滚动列表
- **Then**: 60fps，不一次性渲染 1000 个 DOM
- **Verification**: `programmatic`（performance 面板 + DOM 数量）

### AC-6: 全局交互韧性
- **Given**: 任意危险操作（清空数据、删除宠物）
- **When**: 触发
- **Then**: 使用统一 ConfirmDialog（红按钮）；可 ESC / 遮罩关闭
- **Verification**: `human-judgment`（手工触发 4 处危险操作）

### AC-7: AI 规划沉浸感
- **Given**: 一条 AI 对话
- **When**: AI 回复
- **Then**: 打字机流式呈现；新消息自动滚到底；输入框 auto-resize
- **Verification**: `human-judgment`（真机试）

### AC-8: 无障碍通过
- **Given**: 屏幕阅读器 / 仅键盘
- **When**: 用 Tab + Enter 走主流程
- **Then**: 可完成 打开地图 → 切社区 → 切档案 → 新增宠物 → 切到设置 的全流程
- **Verification**: `human-judgment`（键盘走查 + Lighthouse A11y 分数 ≥ 95）

## Open Questions
- [ ] 瓦片 fallback 选哪套：`tile.openstreetmap.org` / `tile-cn.openstreetmap.org` / `3Amap` / 本地离线瓦片 ？（默认策略：按顺序尝试，第一个返回 200 就用）
- [ ] 是否引入 `radix-ui/react-dialog` 作为 Dialog 基座？（倾向：是，轻量且健壮）
- [ ] 社区虚拟滚动用 `react-window` 还是自实现 IntersectionObserver ？（倾向：react-window，足够轻）
- [ ] Leaflet 手势补丁用哪套？（倾向：leaflet-touch-handlers 或直接用 CSS + `touch-action: none` + 少量自定义事件）
- [ ] 是否顺便迁移 PWA + Web App Manifest？（倾向：可选，放在任务最后，低优先级）
