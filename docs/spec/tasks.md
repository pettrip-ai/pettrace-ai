# 宠迹AI Demo — 实现计划（分解与优先级）

## [x] Task 1: 工程脚手架 + 主题 + Mock 数据层
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 用 `npm create vite@latest pettrace-ai -- --template react-ts` 初始化 Vite + React 18 + TypeScript 项目。
  - 安装 Tailwind CSS 3、react-router-dom、leaflet + react-leaflet、lucide-react、clsx、zustand（轻量状态管理，含 LocalStorage 持久化）。
  - 定义设计 Token（颜色、字体、圆角），贴合报名帖视觉风格：`--accent #C2703E`、`--accent2 #5B8C5A`、`--bg #FDF8F4`、`--ink #2D2A26`。
  - 建立统一的 Mock 数据层 `src/data/mock.ts`（类型 + 上海/北京/广州/成都四市的地点数据，每市 8-12 条）与 `src/data/types.ts`（Pet、Place、Review、CareRecord、ItineraryStep 等类型）。
  - 编写 `src/lib/storage.ts`：LocalStorage 读写封装（带 schema 版本号，方便未来迁移）。
- **Acceptance Criteria Addressed**: AC-6（响应式基础）、AC-5（Mock 兜底）
- **Test Requirements**:
  - `programmatic` TR-1.1: `npm run build` 成功，无 TS 错误、无 Tailwind 未使用 warning 级别错误。
  - `programmatic` TR-1.2: Mock 数据 TS 类型完整覆盖 Place/Review/Pet/CareRecord/ItineraryStep，`tsc --noEmit` 通过。
  - `human-judgement` TR-1.3: Tailwind 主题色与报名帖 HTML 的视觉风格一致（可用 `npm run dev` 首屏截图目测）。
- **Notes**: 不要引入 UI 库（如 shadcn/ui）或大组件库，保持轻量。

## [ ] Task 2: 响应式壳层（路由 + Tab + 侧边栏 + 设置面板）
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - React Router 路由：`/map`、`/ai`、`/community`、`/pet`、`/settings`。
  - 布局组件：`MobileLayout`（< 768px）— 底部 TabNav；`DesktopLayout`（≥ 768px）— 左侧侧边栏。共用一套菜单项。
  - Settings 页面：AI Provider 选择（OpenAI / DeepSeek / Moonshot / DashScope / 自定义）、API Key（密码型）、Base URL、Model 下拉、开关"启用 Mock AI"、Mock 城市、清空所有本地数据按钮、版本信息、显示 About 页（含价值飞轮示意图）。
  - 城市切换放顶部 header，下拉框选择城市，路由不变。
  - 所有偏好用 zustand + LocalStorage 持久化。
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-2.1: Playwright 截图测试在 375px、768px、1440px 三个断点下，四条 Tab 均可见且可点击。
  - `programmatic` TR-2.2: 设置面板关闭再打开，偏好值不丢失（持久化验证）。
  - `human-judgement` TR-2.3: 移动端底部 Tab 图标 + 文字紧凑、误触概率低；桌面侧边栏可折叠。

## [ ] Task 3: 宠物友好地点地图（Leaflet + 卡片 + 筛选 + 验证）
- **Priority**: high
- **Depends On**: Task 1、Task 2
- **Description**:
  - 地图容器：Leaflet + OSM 瓦片（默认城市初始中心），自定义 Marker 图标（用 Lucide 的 paw / home / shop / hotel / park / coffee 图标）。
  - Marker 点击打开 Popup 卡片：名称、分类、宠物规则表（体型、室内、牵引、费用、室外座位）、验证人数、最近验证时间、一致性评分、社区入口按钮（跳转该地点 Feed）。
  - 顶部工具条：分类筛选 chip、体型筛选 chip、关键词搜索（fuse.js 轻量模糊匹配）。
  - 地图下方或侧边显示验证按钮组："我验证了 ✓"、"信息可能过期 ✗"，点后写回 zustand store + LocalStorage。
  - 若瓦片加载失败（离线），以 CSS 占位网格显示地点位置，卡片仍可交互。
- **Acceptance Criteria Addressed**: AC-1、AC-4、AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: 切换城市后 Marker 全部刷新为该城市数据；筛选 chip 联动过滤。
  - `programmatic` TR-3.2: 点击"我验证了"后，该地点验证人数 +1、时间更新，重新读取 store 可验证。
  - `programmatic` TR-3.3: 离线（瓦片请求失败）时 App 不崩溃，Popup 仍可打开。
  - `human-judgement` TR-3.4: Marker 图标准确（狗/酒店/餐厅等一眼可区分）；卡片信息层次清晰。

## [ ] Task 4: AI 对话式行程规划（OpenAI 兼容 + Mock 引擎）
- **Priority**: high
- **Depends On**: Task 1、Task 2
- **Description**:
  - 聊天 UI：消息气泡、打字指示器、建议提示（"带金毛周末去杭州一天"、"帮我规划两天一夜去苏州"等引导用例）。
  - AI 客户端 `src/lib/ai.ts`：
    - 统一接口 `sendAiTurn(messages[]): Promise<AiReply>`。
    - 当 `enableMock=true` 或 API Key 缺失时，走 `mockAiEngine.ts`：规则引擎 + 随机数 + 城市数据集，生成(1)自然语言(2)结构化行程数组（交通、每日分段、风险提示、行前清单）。
    - 当走真实 API 时，调 OpenAI Chat Completions 兼容端点，system prompt 定义为"你是宠迹AI 的行程规划伙伴..."，输出用 JSON 结构化。
    - 错误处理：超时、401、429、5xx 均给出友好提示并回退 Mock。
  - 结构化行程渲染为卡片列表，每张卡片含地点名 + 时间片 + 关键宠物规则标签，点击可跳地图并高亮 Marker。
  - "使用档案宠物参与规划"开关（默认关闭），开启后把用户档案宠物特征拼进 system prompt。
  - 对话历史 zustand + LocalStorage，支持"清空对话"。
- **Acceptance Criteria Addressed**: AC-2、AC-3、AC-5、AC-7
- **Test Requirements**:
  - `programmatic` TR-4.1: Mock AI 对同一句输入可稳定输出结构化 JSON（单测：`mockAiEngine` 多次随机种子下 schema 校验）。
  - `programmatic` TR-4.2: 对话多轮（3 轮以上）时历史上下文正确传入 Mock / 真实 AI。
  - `programmatic` TR-4.3: "使用档案宠物"关闭时，网络请求体不含宠物特征（Mock 上下文同样验证）。
  - `human-judgement` TR-4.4: AI 回复卡片视觉上"自然语言在上、结构化行程在下"，结构化卡片点击可跳地图并高亮。

## [x] Task 5: 真实验证社区 Feed + 宠物私密档案
- **Priority**: medium
- **Depends On**: Task 1、Task 2
- **Description**:
  - 社区 Tab：Feed 列表 = Mock 初始化 + 用户最近打卡（置顶）。每条 Feed 关联一个地点，支持"我验证了 ✓"、"信息过期 ✗"按钮。
  - 宠物档案 Tab：列表式展示，支持新增/编辑一只（名字、品种、体型、性格、生日、体重、头像占位）。护理日程卡片（疫苗、驱虫、洗澡、体检），支持添加提醒日期，距离提醒 ≤ 7 天显示"即将到期"红色条。
  - 档案数据只在 LocalStorage，不与其他模块共享，除非用户在 AI Tab 主动开启"使用档案宠物"。
- **Acceptance Criteria Addressed**: AC-3、AC-4
- **Test Requirements**:
  - `programmatic` TR-5.1: 新增一只宠物后再打开档案页，数据持久化存在。
  - `programmatic` TR-5.2: 在 AI Tab 默认不勾选"使用档案宠物"时，mock AI 不接收任何宠物特征（可通过 console 断言）。
  - `human-judgement` TR-5.3: 档案默认私密的文案清晰（页面底部明确提示"默认私密 · 不会自动同步到任何平台"）。

## [ ] Task 6: 打包部署 + 参赛说明 + 最终打磨
- **Priority**: medium
- **Depends On**: Task 1-5 全部完成
- **Description**:
  - `npm run build` 成功，产出 dist 可被任意静态服务器运行。
  - 准备一份 README 参赛说明（1 屏介绍 + 启动步骤 + 功能清单 + API Key 可选说明）。
  - 全局可访问性抽查（对比度、tab 顺序、focus 样式）。
  - 若干打磨：加载骨架屏、错误边界、空状态友好提示、iOS 安全区（safe-area-inset）。
  - 可选：部署到 Vercel（用户可选）。
- **Acceptance Criteria Addressed**: AC-1~7 全部
- **Test Requirements**:
  - `programmatic` TR-6.1: Vercel/Netlify 构建配置验证通过（build 零错误零 warn）。
  - `human-judgement` TR-6.2: 从冷启动 → 四条 Tab 全流程走通无明显卡顿、无白屏。

## 依赖关系图（DAG）
```
Task 1 ─┬─ Task 2 ─┬─ Task 4 ─┐
        ├─ Task 3 ─┤           ├─ Task 6
        └─ Task 2 ─┴─ Task 5 ─┘
```
Task 4 与 Task 3、Task 5 相互独立，可并行；但因实际开发效率建议串行完成。
