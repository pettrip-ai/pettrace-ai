# 宠迹 AI · 移动端体验升级 · 验收清单

## 架构 / 代码质量
- [ ] 每个页面主文件 ≤ 300 行（wc -l 验证）
- [ ] 所有 `.ios-*` 自定义 CSS 已迁移 / 删除，`index.css` ≤ 120 行
- [ ] 5 处本地 Toast 全部合并为全局 `useToast()`
- [ ] 所有 `window.alert` / `window.confirm` 已替换为 Dialog
- [ ] `npm run build` 成功，gzip JS ≤ 400KB
- [ ] oxlint 0 error（`npm run lint`）
- [ ] 页面懒加载（React.lazy + Suspense）已生效，首屏 bundle 仅含 map + shared

## 地图（MapPage）
- [ ] 瓦片 fallback：依次尝试多个 CDN，第一个可用就用，全部失败显示统一 EmptyState
- [ ] 瓦片加载 shimmer 可见，加载完成自动淡出
- [ ] Marker icon 无 renderToStaticMarkup 重复生成，同类型复用
- [ ] 长按/捏合/双击/惯性手势正常
- [ ] 我的位置按钮可用（浏览器 geolocation）
- [ ] 底部浮动提示 / 空态统一 EmptyState 组件
- [ ] 切换到其他 Tab 再切回地图，center/zoom 保持，不 flyTo 动画
- [ ] 筛选/搜索/列表功能保持可用
- [ ] Tab 行横向可滚动 chip

## AI 规划（AiPage）
- [ ] 输入框 auto-resize（1→6 行）
- [ ] AI prose 打字机流式，itinerary 卡片逐条出现
- [ ] 新消息 smooth scroll 到底
- [ ] Quick Suggestions 用 Chip 组
- [ ] 清空对话为 ConfirmDialog，有遮罩/ESC 关闭
- [ ] 结构化行程卡片可点按压反馈

## 社区（CommunityPage）
- [ ] Feed 超过 1000 条 DOM 数量 ≤ 300（虚拟滚动生效）
- [ ] 发布按钮点击 → 底部 Sheet（遮罩 + 上滑）
- [ ] Sheet 发布区可滚动，底部按钮 sticky
- [ ] 空态统一 EmptyState
- [ ] 筛选（类型/城市）用 Chip/Tab 统一
- [ ] 点赞/验证/跳转地图全部可用

## 档案（PetPage）
- [ ] 新增/编辑宠物 → 底部 Sheet 或 Modal（移动端倾向 Sheet）
- [ ] 删除宠物 → ConfirmDialog（红按钮）
- [ ] 护理日程"上次日期"用 `<input type="date">`，不再 `prompt`
- [ ] 顶部标题 sticky
- [ ] 所有卡片有按压反馈

## 设置（SettingsPage）
- [ ] 四个 section 用统一 Card
- [ ] "清空所有本地数据"双重 ConfirmDialog
- [ ] Mock 开关带描述
- [ ] API Key 显隐按钮保留 + autocomplete 友好

## 全局体验
- [ ] 所有按钮有按压反馈（scale 0.97 + shadow pop）
- [ ] 全局动画缓动为 `cubic-bezier(0.22, 1, 0.36, 1)`；时长三档 200/260/320ms
- [ ] z-index 有 token（z.base / z.overlay / z.modal / z.toast），无魔法数字
- [ ] Toast 堆叠 + 自动消失 + 可关闭
- [ ] Modal/Sheet 支持 ESC 关闭、遮罩点击关闭、focus trap
- [ ] 路由切换 Header/TabBar 不闪烁、背景不重绘
- [ ] 路由切换保留地图状态（center/zoom）、AI scroll position
- [ ] `document.title` 随路由更新
- [ ] iOS `viewport-fit=cover` + 安全区 padding 正确
- [ ] Android Chrome 状态栏安全区正确
- [ ] prefers-reduced-motion 全局已启用

## 可访问性
- [ ] 所有 icon 按钮有 aria-label
- [ ] 所有输入框有 label 或 aria-label
- [ ] Modal/Sheet 打开时 focus trap
- [ ] Tab 键可完成主流程：地图 → 社区 → 档案 → 新增宠物 → 设置
- [ ] Enter 可激活 TabBar 项 / 对话框按钮
- [ ] Lighthouse A11y ≥ 95

## 构建 / 运行时
- [ ] `npm run dev` 本地热更新正常
- [ ] `npm run build` 成功
- [ ] `npm run preview` 打开 dist 产物正常
- [ ] 无 console.warn / console.error 来自我们自己的代码（ErrorBoundary 日志除外）
